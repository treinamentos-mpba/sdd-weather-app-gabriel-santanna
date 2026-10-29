import type { City, ForecastDay, WeatherData } from '../types/weather';

export class WeatherServiceError extends Error {
  constructor(
    message: string,
    public readonly kind: 'network' | 'api' | 'invalid-response' | 'timeout',
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'WeatherServiceError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function parseCity(value: unknown): City {
  if (
    !isRecord(value) ||
    typeof value.name !== 'string' ||
    typeof value.country !== 'string' ||
    !isFiniteNumber(value.latitude) ||
    !isFiniteNumber(value.longitude)
  ) {
    throw new WeatherServiceError('A resposta contém uma localidade inválida.', 'invalid-response');
  }

  return {
    name: value.name,
    country: value.country,
    latitude: value.latitude,
    longitude: value.longitude,
    ...(isFiniteNumber(value.id) ? { id: value.id } : {}),
    ...(typeof value.admin1 === 'string' ? { region: value.admin1 } : {}),
    ...(typeof value.country_code === 'string' ? { countryCode: value.country_code } : {}),
    ...(typeof value.timezone === 'string' ? { timezone: value.timezone } : {}),
  };
}

export async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    return await fetch(url, { signal: controller.signal });
  } catch (error) {
    if (isRecord(error) && error.name === 'AbortError') {
      throw new WeatherServiceError('A requisição demorou demais.', 'timeout');
    }
    throw new WeatherServiceError('Falha de rede.', 'network');
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchPayload(url: string, apiMessage: string): Promise<Record<string, unknown>> {
  const response = await fetchWithTimeout(url);
  if (!response.ok) {
    throw new WeatherServiceError(apiMessage, 'api', response.status);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new WeatherServiceError('O serviço retornou um JSON inválido.', 'invalid-response');
  }

  if (!isRecord(payload)) {
    throw new WeatherServiceError('O serviço retornou uma resposta inválida.', 'invalid-response');
  }
  if (payload.error === true) {
    throw new WeatherServiceError(apiMessage, 'api', response.status);
  }
  return payload;
}

export async function searchCities(name: string): Promise<City[]> {
  const query = name.trim();
  if (!query) return [];

  const payload = await fetchPayload(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&language=pt&format=json`,
    'Não foi possível buscar cidades.',
  );
  if (payload.results === undefined) return [];
  if (!Array.isArray(payload.results)) {
    throw new WeatherServiceError('O serviço retornou resultados inválidos.', 'invalid-response');
  }

  return payload.results.map(parseCity);
}

function nullableNumber(value: unknown): number | null {
  return isFiniteNumber(value) ? value : null;
}

function dailyValues(value: unknown): unknown[] {
  if (value == null) return [];
  if (!Array.isArray(value)) {
    throw new WeatherServiceError(
      'O serviço retornou uma previsão diária inválida.',
      'invalid-response',
    );
  }
  return value;
}

export async function getWeather(city: City): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    current:
      'temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,surface_pressure',
    daily: 'temperature_2m_min,temperature_2m_max,weather_code',
    forecast_days: '5',
    timezone: 'auto',
    temperature_unit: 'celsius',
    wind_speed_unit: 'kmh',
    precipitation_unit: 'mm',
  });
  const payload = await fetchPayload(
    `https://api.open-meteo.com/v1/forecast?${params}`,
    'Não foi possível consultar a previsão.',
  );
  if (!isRecord(payload.current) || !isRecord(payload.daily)) {
    throw new WeatherServiceError(
      'Resposta incompleta: condições atuais ou previsão diária ausentes.',
      'invalid-response',
    );
  }

  const { current, daily } = payload;
  if (!Array.isArray(daily.time) || daily.time.length < 5) {
    throw new WeatherServiceError(
      'Resposta incompleta: são necessárias cinco datas de previsão.',
      'invalid-response',
    );
  }

  const dates: unknown[] = daily.time.slice(0, 5);
  const minimums = dailyValues(daily.temperature_2m_min);
  const maximums = dailyValues(daily.temperature_2m_max);
  const codes = dailyValues(daily.weather_code);
  const forecastDays: ForecastDay[] = dates.map((date, index) => {
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new WeatherServiceError(
        'O serviço retornou uma data de previsão inválida.',
        'invalid-response',
      );
    }
    return {
      date,
      minTemperatureC: nullableNumber(minimums[index]),
      maxTemperatureC: nullableNumber(maximums[index]),
      weatherCode: nullableNumber(codes[index]),
    };
  });

  return {
    city,
    current: {
      temperatureC: nullableNumber(current.temperature_2m),
      weatherCode: nullableNumber(current.weather_code),
      humidityPercent: nullableNumber(current.relative_humidity_2m),
      windSpeedKmh: nullableNumber(current.wind_speed_10m),
      precipitationMm: current.precipitation === null ? 0 : nullableNumber(current.precipitation),
      pressureHpa: nullableNumber(current.surface_pressure),
    },
    forecastDays,
  };
}
