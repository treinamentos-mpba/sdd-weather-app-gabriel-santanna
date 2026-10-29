import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fetchWithTimeout,
  getWeather,
  searchCities,
  WeatherServiceError,
} from '../../src/services/weatherService';
import type { City } from '../../src/types/weather';

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function respond(payload: unknown) {
  fetchMock.mockResolvedValue(new Response(JSON.stringify(payload)));
}

const city: City = {
  name: 'Curitiba',
  country: 'Brasil',
  latitude: -25.43,
  longitude: -49.27,
};

function forecastPayload() {
  return {
    timezone: 'America/Sao_Paulo',
    current: {
      temperature_2m: 21.3,
      weather_code: 2,
      relative_humidity_2m: 64,
      wind_speed_10m: 8.6,
      precipitation: 0,
      surface_pressure: 1014.2,
    },
    daily: {
      time: ['2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02'],
      temperature_2m_min: [15.2, 14.8, 16.1, 15.7, 16.4],
      temperature_2m_max: [23.4, 22.1, 24.7, 25.2, 26],
      weather_code: [2, 3, 61, 1, 0],
    },
  };
}

describe('fetchWithTimeout', () => {
  it('passa AbortSignal e limpa o timer no sucesso sem cancelar a resposta depois', async () => {
    vi.useFakeTimers();
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
    const response = new Response('{}');
    fetchMock.mockResolvedValue(response);

    await expect(fetchWithTimeout('https://example.test')).resolves.toBe(response);

    const signal = fetchMock.mock.calls[0][1]?.signal;
    expect(signal).toBeInstanceOf(AbortSignal);
    expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(signal?.aborted).toBe(false);
  });

  it('aborta apenas ao completar 10 segundos e limpa o timer no finally', async () => {
    vi.useFakeTimers();
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
    fetchMock.mockImplementation(
      (_url, options) =>
        new Promise((_resolve, reject) => {
          options?.signal?.addEventListener(
            'abort',
            () => {
              reject(new DOMException('Aborted', 'AbortError'));
            },
            { once: true },
          );
        }),
    );

    const request = fetchWithTimeout('https://example.test');
    const rejection = expect(request).rejects.toMatchObject({
      name: 'WeatherServiceError',
      kind: 'timeout',
      message: 'A requisição demorou demais.',
    });
    const signal = fetchMock.mock.calls[0][1]?.signal;

    await vi.advanceTimersByTimeAsync(9_999);
    expect(signal?.aborted).toBe(false);
    expect(clearTimeoutSpy).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    await rejection;
    await expect(request).rejects.toBeInstanceOf(WeatherServiceError);
    expect(signal?.aborted).toBe(true);
    expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('converte falha de rede e limpa o timer também na rejeição imediata', async () => {
    vi.useFakeTimers();
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    const request = fetchWithTimeout('https://example.test');

    await expect(request).rejects.toBeInstanceOf(WeatherServiceError);
    await expect(request).rejects.toMatchObject({ kind: 'network', message: 'Falha de rede.' });
    expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each([
    { name: 'searchCities', run: () => searchCities('Curitiba') },
    { name: 'getWeather', run: () => getWeather(city) },
  ])('preserva o erro de timeout em $name', async ({ run }) => {
    vi.useFakeTimers();
    fetchMock.mockRejectedValue(new DOMException('Aborted', 'AbortError'));

    await expect(run()).rejects.toMatchObject({
      name: 'WeatherServiceError',
      kind: 'timeout',
      message: 'A requisição demorou demais.',
    });
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('searchCities', () => {
  it.each(['', '   ', '\n\t'])('retorna vazio sem acessar a rede para %j', async (name) => {
    await expect(searchCities(name)).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('codifica o nome aparado com encodeURIComponent e usa parâmetros de geocodificação', async () => {
    respond({ results: [] });

    await searchCities('  São Paulo & Região  ');

    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent('São Paulo & Região')}&language=pt&format=json`,
      { signal: expect.any(AbortSignal) },
    );
  });

  it('mapeia todos os campos para City e preserva a ordem das localidades', async () => {
    respond({
      results: [
        {
          id: 3448439,
          name: 'São Paulo',
          country: 'Brasil',
          admin1: 'São Paulo',
          country_code: 'BR',
          latitude: -23.55,
          longitude: -46.63,
          timezone: 'America/Sao_Paulo',
          population: 12325232,
        },
        {
          name: 'Curitiba',
          country: 'Brasil',
          latitude: -25.43,
          longitude: -49.27,
        },
      ],
    });

    await expect(searchCities('São')).resolves.toStrictEqual([
      {
        id: 3448439,
        name: 'São Paulo',
        country: 'Brasil',
        region: 'São Paulo',
        countryCode: 'BR',
        latitude: -23.55,
        longitude: -46.63,
        timezone: 'America/Sao_Paulo',
      },
      {
        name: 'Curitiba',
        country: 'Brasil',
        latitude: -25.43,
        longitude: -49.27,
      },
    ]);
  });

  it.each([{}, { results: [] }])('retorna vazio quando não há resultados: %j', async (payload) => {
    respond(payload);
    await expect(searchCities('Cidade inexistente')).resolves.toEqual([]);
  });

  it.each([400, 429, 500])('lança WeatherServiceError em resposta HTTP %s', async (status) => {
    const json = vi.fn();
    fetchMock.mockResolvedValue({ ok: false, status, json } as unknown as Response);

    const request = searchCities('Curitiba');

    await expect(request).rejects.toBeInstanceOf(WeatherServiceError);
    await expect(request).rejects.toMatchObject({
      name: 'WeatherServiceError',
      kind: 'api',
      status,
    });
    expect(json).not.toHaveBeenCalled();
  });

  it('classifica falha de rede sem tratá-la como ausência de resultados', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(searchCities('Curitiba')).rejects.toMatchObject({
      name: 'WeatherServiceError',
      kind: 'network',
      message: 'Falha de rede.',
    });
  });

  it('rejeita payload que declara erro mesmo com HTTP bem-sucedido', async () => {
    respond({ error: true, reason: 'Falha interna do serviço' });

    await expect(searchCities('Curitiba')).rejects.toMatchObject({ kind: 'api' });
  });

  it('rejeita JSON ilegível como resposta inválida', async () => {
    fetchMock.mockResolvedValue(new Response('não é JSON'));

    await expect(searchCities('Curitiba')).rejects.toMatchObject({ kind: 'invalid-response' });
  });

  it.each([
    null,
    [],
    { results: null },
    { results: {} },
    { results: [{}] },
    { results: [{ name: 'Curitiba', country: 'Brasil', latitude: '-25.43', longitude: -49.27 }] },
    { results: [{ name: 'Curitiba', latitude: -25.43, longitude: -49.27 }] },
  ])('rejeita estrutura inválida sem inventar localidades: %j', async (payload) => {
    respond(payload);

    await expect(searchCities('Curitiba')).rejects.toMatchObject({
      name: 'WeatherServiceError',
      kind: 'invalid-response',
    });
  });
});

describe('getWeather', () => {
  it('solicita current e daily com coordenadas, cinco dias, fuso e unidades canônicas', async () => {
    respond(forecastPayload());

    await getWeather(city);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = new URL(String(fetchMock.mock.calls[0][0]));
    expect(url.origin + url.pathname).toBe('https://api.open-meteo.com/v1/forecast');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      latitude: '-25.43',
      longitude: '-49.27',
      current:
        'temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,surface_pressure',
      daily: 'temperature_2m_min,temperature_2m_max,weather_code',
      forecast_days: '5',
      timezone: 'auto',
      temperature_unit: 'celsius',
      wind_speed_unit: 'kmh',
      precipitation_unit: 'mm',
    });
  });

  it('mapeia current e os arrays paralelos em cinco dias sem alterar cidade ou resposta', async () => {
    const payload = forecastPayload();
    const original = structuredClone(payload);
    respond(payload);

    const weather = await getWeather(city);

    expect(weather.city).toBe(city);
    expect(weather.current).toEqual({
      temperatureC: 21.3,
      weatherCode: 2,
      humidityPercent: 64,
      windSpeedKmh: 8.6,
      precipitationMm: 0,
      pressureHpa: 1014.2,
    });
    expect(weather.forecastDays).toEqual([
      { date: '2026-10-29', minTemperatureC: 15.2, maxTemperatureC: 23.4, weatherCode: 2 },
      { date: '2026-10-30', minTemperatureC: 14.8, maxTemperatureC: 22.1, weatherCode: 3 },
      { date: '2026-10-31', minTemperatureC: 16.1, maxTemperatureC: 24.7, weatherCode: 61 },
      { date: '2026-11-01', minTemperatureC: 15.7, maxTemperatureC: 25.2, weatherCode: 1 },
      { date: '2026-11-02', minTemperatureC: 16.4, maxTemperatureC: 26, weatherCode: 0 },
    ]);
    expect(payload).toEqual(original);
  });

  it('limita a cinco itens quando a resposta contém mais datas', async () => {
    const payload = forecastPayload();
    payload.daily.time.push('2026-11-03');
    payload.daily.temperature_2m_min.push(17);
    payload.daily.temperature_2m_max.push(27);
    payload.daily.weather_code.push(3);
    respond(payload);

    const weather = await getWeather(city);

    expect(weather.forecastDays).toHaveLength(5);
    expect(weather.forecastDays[4].date).toBe('2026-11-02');
  });

  it.each([
    { precipitation: null, expected: 0 },
    { precipitation: undefined, expected: null },
    { precipitation: 0, expected: 0 },
    { precipitation: 1.7, expected: 1.7 },
  ])('normaliza precipitação $precipitation como $expected', async ({
    precipitation,
    expected,
  }) => {
    const payload = forecastPayload();
    respond({ ...payload, current: { ...payload.current, precipitation } });

    const weather = await getWeather(city);

    expect(weather.current.precipitationMm).toBe(expected);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('preserva zeros e índices quando os arrays de métricas contêm valores ausentes', async () => {
    const payload = forecastPayload();
    respond({
      ...payload,
      current: { temperature_2m: 0, weather_code: 0, precipitation: 0 },
      daily: {
        time: payload.daily.time,
        temperature_2m_min: [0, null, 16.1],
        temperature_2m_max: [null, 22.1, 24.7, 25.2, 26],
      },
    });

    const weather = await getWeather(city);

    expect(weather.current).toEqual({
      temperatureC: 0,
      weatherCode: 0,
      humidityPercent: null,
      windSpeedKmh: null,
      precipitationMm: 0,
      pressureHpa: null,
    });
    expect(weather.forecastDays).toEqual([
      { date: '2026-10-29', minTemperatureC: 0, maxTemperatureC: null, weatherCode: null },
      { date: '2026-10-30', minTemperatureC: null, maxTemperatureC: 22.1, weatherCode: null },
      { date: '2026-10-31', minTemperatureC: 16.1, maxTemperatureC: 24.7, weatherCode: null },
      { date: '2026-11-01', minTemperatureC: null, maxTemperatureC: 25.2, weatherCode: null },
      { date: '2026-11-02', minTemperatureC: null, maxTemperatureC: 26, weatherCode: null },
    ]);
  });

  it.each([
    {},
    { current: {} },
    { daily: {} },
    { current: null, daily: {} },
    { current: {}, daily: null },
    { current: [], daily: {} },
    { current: {}, daily: [] },
  ])('rejeita resposta sem blocos current e daily válidos: %j', async (payload) => {
    respond(payload);
    const request = getWeather(city);

    await expect(request).rejects.toBeInstanceOf(WeatherServiceError);
    await expect(request).rejects.toMatchObject({
      kind: 'invalid-response',
      message: expect.stringContaining('incompleta'),
    });
  });

  it.each([
    undefined,
    null,
    [],
    ['2026-10-29'],
    '2026-10-29',
  ])('rejeita datas ausentes ou insuficientes: %j', async (time) => {
    const payload = forecastPayload();
    respond({ ...payload, daily: { ...payload.daily, time } });

    await expect(getWeather(city)).rejects.toMatchObject({ kind: 'invalid-response' });
  });

  it.each([
    null,
    123,
    '2026-10-29T00:00',
  ])('rejeita data inválida sem tentar convertê-la: %j', async (date) => {
    const payload = forecastPayload();
    respond({
      ...payload,
      daily: { ...payload.daily, time: [date, ...payload.daily.time.slice(1)] },
    });

    await expect(getWeather(city)).rejects.toMatchObject({ kind: 'invalid-response' });
  });

  it('rejeita métrica diária que não é um array', async () => {
    const payload = forecastPayload();
    respond({ ...payload, daily: { ...payload.daily, temperature_2m_min: 15 } });

    await expect(getWeather(city)).rejects.toMatchObject({ kind: 'invalid-response' });
  });

  it.each([400, 429, 500])('classifica resposta HTTP %s como erro de API', async (status) => {
    fetchMock.mockResolvedValue(new Response('Falha', { status }));

    await expect(getWeather(city)).rejects.toMatchObject({
      name: 'WeatherServiceError',
      kind: 'api',
      status,
    });
  });

  it('classifica falha de rede', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(getWeather(city)).rejects.toMatchObject({
      kind: 'network',
      message: 'Falha de rede.',
    });
  });

  it('classifica JSON ilegível', async () => {
    fetchMock.mockResolvedValue(new Response('não é JSON'));

    await expect(getWeather(city)).rejects.toMatchObject({ kind: 'invalid-response' });
  });

  it('classifica payload que declara erro mesmo com HTTP bem-sucedido', async () => {
    respond({ error: true, reason: 'Falha interna' });

    await expect(getWeather(city)).rejects.toMatchObject({ kind: 'api' });
  });
});
