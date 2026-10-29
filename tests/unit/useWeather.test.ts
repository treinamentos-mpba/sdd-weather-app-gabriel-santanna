import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useWeather } from '../../src/hooks/useWeather';
import { mockWeatherData } from '../../src/mocks/weatherData';
import { WeatherServiceError } from '../../src/services/weatherService';
import type { City, WeatherData, WeatherService } from '../../src/types/weather';

afterEach(() => {
  vi.unstubAllGlobals();
});

function createService() {
  return {
    searchLocations: vi
      .fn<WeatherService['searchLocations']>()
      .mockResolvedValue([mockWeatherData.city]),
    getWeather: vi.fn<WeatherService['getWeather']>().mockResolvedValue(mockWeatherData),
  };
}

function deferred<Value>() {
  let resolve: (value: Value) => void = vi.fn();
  let reject: (reason: unknown) => void = vi.fn();
  const promise = new Promise<Value>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

describe('useWeather', () => {
  it('inicia em idle sem rede e retry inicial não faz nada', async () => {
    const service = createService();
    const { result } = renderHook(() => useWeather(service));

    expect(result.current).toMatchObject({
      status: 'idle',
      data: null,
      cities: [],
      error: null,
      query: '',
    });
    await act(async () => {
      await result.current.retry();
    });
    expect(service.searchLocations).not.toHaveBeenCalled();
    expect(service.getWeather).not.toHaveBeenCalled();
  });

  it('apara a query e permanece em loading até carregar o clima da primeira cidade', async () => {
    const service = createService();
    const pending = deferred<WeatherData>();
    const secondCity = { ...mockWeatherData.city, name: 'Outra Curitiba', latitude: -24 };
    service.searchLocations.mockResolvedValue([mockWeatherData.city, secondCity]);
    service.getWeather.mockReturnValue(pending.promise);
    const { result } = renderHook(() => useWeather(service));
    let request = Promise.resolve();

    act(() => {
      request = result.current.search('  Curitiba  ');
    });
    expect(result.current).toMatchObject({
      status: 'loading',
      query: 'Curitiba',
      data: null,
      error: null,
    });
    await waitFor(() =>
      expect(service.getWeather).toHaveBeenCalledExactlyOnceWith(mockWeatherData.city),
    );
    expect(result.current.status).toBe('loading');
    expect(result.current.cities).toEqual([mockWeatherData.city, secondCity]);
    expect(service.searchLocations).toHaveBeenCalledExactlyOnceWith('Curitiba');

    await act(async () => {
      pending.resolve(mockWeatherData);
      await request;
    });
    expect(result.current.status).toBe('success');
    expect(result.current.data).toBe(mockWeatherData);
  });

  it('selectCity carrega a opção escolhida, preservando cities e query', async () => {
    const service = createService();
    const secondCity = { ...mockWeatherData.city, name: 'Outra Curitiba', latitude: -24 };
    service.searchLocations.mockResolvedValue([mockWeatherData.city, secondCity]);
    const { result } = renderHook(() => useWeather(service));
    await act(async () => {
      await result.current.search('Curitiba');
    });
    service.getWeather.mockResolvedValue({ ...mockWeatherData, city: secondCity });

    await act(async () => {
      await result.current.selectCity(secondCity);
    });

    expect(service.getWeather).toHaveBeenNthCalledWith(2, secondCity);
    expect(service.searchLocations).toHaveBeenCalledTimes(1);
    expect(result.current).toMatchObject({
      status: 'success',
      query: 'Curitiba',
      cities: [mockWeatherData.city, secondCity],
    });
    expect(result.current.data?.city).toBe(secondCity);
  });

  it('sem resultados termina em empty, limpa dados anteriores e não consulta previsão', async () => {
    const service = createService();
    const { result } = renderHook(() => useWeather(service));
    await act(async () => {
      await result.current.selectCity(mockWeatherData.city);
    });
    service.searchLocations.mockResolvedValue([]);

    await act(async () => {
      await result.current.search('Inexistente');
    });

    expect(result.current).toMatchObject({
      status: 'empty',
      data: null,
      cities: [],
      error: null,
      query: 'Inexistente',
    });
    expect(service.getWeather).toHaveBeenCalledTimes(1);
  });

  it.each(['', '   ', '\n\t'])('entrada vazia %j retorna a idle sem rede', async (query) => {
    const service = createService();
    const { result } = renderHook(() => useWeather(service));

    await act(async () => {
      await result.current.search(query);
      await result.current.retry();
    });

    expect(result.current).toMatchObject({
      status: 'idle',
      query: '',
      error: null,
      data: null,
      cities: [],
    });
    expect(service.searchLocations).not.toHaveBeenCalled();
    expect(service.getWeather).not.toHaveBeenCalled();
  });

  it('preserva a mensagem do serviço e retry repete a busca original', async () => {
    const service = createService();
    service.searchLocations.mockRejectedValueOnce(
      new WeatherServiceError('Falha de rede.', 'network'),
    );
    const { result } = renderHook(() => useWeather(service));

    await act(async () => {
      await result.current.search(' Curitiba ');
    });
    expect(result.current).toMatchObject({
      status: 'error',
      error: 'Falha de rede.',
      query: 'Curitiba',
      data: null,
    });
    await act(async () => {
      await result.current.retry();
    });

    expect(service.searchLocations).toHaveBeenNthCalledWith(2, 'Curitiba');
    expect(result.current).toMatchObject({ status: 'success', error: null });
  });

  it('retry de search repete a busca completa quando a previsão automática falha', async () => {
    const service = createService();
    service.getWeather.mockRejectedValueOnce(
      new WeatherServiceError('A requisição demorou demais.', 'timeout'),
    );
    const { result } = renderHook(() => useWeather(service));

    await act(async () => {
      await result.current.search('Curitiba');
    });
    expect(result.current).toMatchObject({
      status: 'error',
      error: 'A requisição demorou demais.',
      selectedCity: mockWeatherData.city,
    });
    await act(async () => {
      await result.current.retry();
    });

    expect(service.searchLocations).toHaveBeenCalledTimes(2);
    expect(service.getWeather).toHaveBeenNthCalledWith(2, mockWeatherData.city);
    expect(result.current.status).toBe('success');
  });

  it('retry de selectCity repete somente a previsão selecionada', async () => {
    const service = createService();
    service.getWeather.mockRejectedValueOnce(new Error('Serviço indisponível.'));
    const { result } = renderHook(() => useWeather(service));

    await act(async () => {
      await result.current.selectCity(mockWeatherData.city);
    });
    expect(result.current.error).toBe('Serviço indisponível.');
    await act(async () => {
      await result.current.retry();
    });

    expect(service.searchLocations).not.toHaveBeenCalled();
    expect(service.getWeather).toHaveBeenNthCalledWith(2, mockWeatherData.city);
    expect(result.current).toMatchObject({ status: 'success', error: null });
  });

  it('usa mensagem segura para uma rejeição que não é Error', async () => {
    const service = createService();
    service.searchLocations.mockRejectedValue(null);
    const { result } = renderHook(() => useWeather(service));

    await act(async () => {
      await result.current.search('Curitiba');
    });

    expect(result.current).toMatchObject({
      status: 'error',
      error: 'Não foi possível concluir a consulta. Tente novamente.',
    });
  });

  it('ignora uma busca obsoleta sem iniciar sua previsão', async () => {
    const service = createService();
    const pending = deferred<City[]>();
    service.searchLocations.mockReturnValueOnce(pending.promise).mockResolvedValueOnce([]);
    const { result } = renderHook(() => useWeather(service));
    let oldRequest = Promise.resolve();
    act(() => {
      oldRequest = result.current.search('Antiga');
    });
    await act(async () => {
      await result.current.search('Nova');
    });
    await act(async () => {
      pending.resolve([mockWeatherData.city]);
      await oldRequest;
    });

    expect(result.current).toMatchObject({
      status: 'empty',
      query: 'Nova',
      cities: [],
      data: null,
    });
    expect(service.getWeather).not.toHaveBeenCalled();
  });

  it.each(['success', 'error'])('ignora previsão obsoleta que termina em %s', async (outcome) => {
    const service = createService();
    const pending = deferred<WeatherData>();
    service.getWeather.mockReturnValueOnce(pending.promise);
    const { result } = renderHook(() => useWeather(service));
    let oldRequest = Promise.resolve();
    act(() => {
      oldRequest = result.current.selectCity(mockWeatherData.city);
    });
    service.searchLocations.mockResolvedValue([]);
    await act(async () => {
      await result.current.search('Nova');
    });
    await act(async () => {
      if (outcome === 'success') pending.resolve(mockWeatherData);
      else pending.reject(new Error('Falha obsoleta'));
      await oldRequest;
    });

    expect(result.current).toMatchObject({
      status: 'empty',
      query: 'Nova',
      error: null,
      data: null,
    });
  });

  it('limpar a busca invalida uma operação pendente e o retry anterior', async () => {
    const service = createService();
    const pending = deferred<WeatherData>();
    service.getWeather.mockReturnValueOnce(pending.promise);
    const { result } = renderHook(() => useWeather(service));
    let request = Promise.resolve();
    act(() => {
      request = result.current.selectCity(mockWeatherData.city);
    });

    await act(async () => {
      await result.current.search(' ');
    });
    await act(async () => {
      pending.resolve(mockWeatherData);
      await request;
      await result.current.retry();
    });

    expect(result.current).toMatchObject({
      status: 'idle',
      query: '',
      data: null,
      cities: [],
      error: null,
    });
    expect(service.getWeather).toHaveBeenCalledTimes(1);
  });

  it('não inicia previsão quando a busca termina após desmontagem', async () => {
    const service = createService();
    const pending = deferred<City[]>();
    service.searchLocations.mockReturnValue(pending.promise);
    const { result, unmount } = renderHook(() => useWeather(service));
    let request = Promise.resolve();
    act(() => {
      request = result.current.search('Curitiba');
    });
    unmount();

    await act(async () => {
      pending.resolve([mockWeatherData.city]);
      await request;
    });

    expect(service.getWeather).not.toHaveBeenCalled();
  });

  it('usa searchCities e getWeather reais por padrão, com fetch simulado', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            results: [
              {
                name: mockWeatherData.city.name,
                country: mockWeatherData.city.country,
                latitude: mockWeatherData.city.latitude,
                longitude: mockWeatherData.city.longitude,
              },
            ],
          }),
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            current: { temperature_2m: 21.3 },
            daily: { time: mockWeatherData.forecastDays.map((day) => day.date) },
          }),
        ),
      );
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useWeather());

    await act(async () => {
      await result.current.search('Curitiba');
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[0][0])).toContain('geocoding-api.open-meteo.com');
    expect(String(fetchMock.mock.calls[1][0])).toContain('api.open-meteo.com/v1/forecast');
    expect(result.current.status).toBe('success');
    expect(result.current.data?.current.temperatureC).toBe(21.3);
  });
});
