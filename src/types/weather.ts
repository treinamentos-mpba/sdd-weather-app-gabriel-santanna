/** Unidade usada para apresentar temperaturas. */
export type Unit = 'celsius' | 'fahrenheit';

export interface City {
  /** Identificador da localidade, quando fornecido pela geocodificação. */
  id?: number;
  /** Nome da cidade. */
  name: string;
  /** Região administrativa usada para distinguir cidades homônimas. */
  region?: string;
  /** País da localidade. */
  country: string;
  /** Código ISO do país, quando fornecido pela fonte. */
  countryCode?: string;
  /** Latitude usada na consulta meteorológica. */
  latitude: number;
  /** Longitude usada na consulta meteorológica. */
  longitude: number;
  /** Fuso horário da localidade, quando fornecido pela fonte. */
  timezone?: string;
}

export interface CurrentWeather {
  /** Temperatura atual em Celsius; null quando indisponível. */
  temperatureC: number | null;
  /** Código WMO da condição atual; null quando indisponível. */
  weatherCode: number | null;
  /** Umidade relativa em porcentagem; null quando indisponível. */
  humidityPercent: number | null;
  /** Velocidade do vento em km/h; null quando indisponível. */
  windSpeedKmh: number | null;
  /** Precipitação em milímetros; null quando indisponível. */
  precipitationMm: number | null;
  /** Pressão atmosférica em hPa; ausente ou null quando indisponível. */
  pressureHpa?: number | null;
}

export interface ForecastDay {
  /** Data local no formato YYYY-MM-DD. */
  date: string;
  /** Temperatura mínima em Celsius; null quando indisponível. */
  minTemperatureC: number | null;
  /** Temperatura máxima em Celsius; null quando indisponível. */
  maxTemperatureC: number | null;
  /** Código WMO da condição diária; null quando indisponível. */
  weatherCode: number | null;
}

export interface WeatherData {
  /** Localidade à qual os dados meteorológicos pertencem. */
  city: City;
  /** Condições meteorológicas atuais. */
  current: CurrentWeather;
  /** Previsão diária em ordem cronológica. */
  forecastDays: ForecastDay[];
}

export interface WeatherService {
  searchLocations(query: string, signal?: AbortSignal): Promise<City[]>;
  getWeather(location: City, signal?: AbortSignal): Promise<WeatherData>;
}
