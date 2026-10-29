import type { WeatherData } from '../types/weather';

/** Dados fixos para desenvolver e demonstrar a UI sem chamadas à API. */
export const mockWeatherData: WeatherData = {
  city: {
    name: 'Curitiba',
    region: 'Paraná',
    country: 'Brasil',
    countryCode: 'BR',
    latitude: -25.43,
    longitude: -49.27,
    timezone: 'America/Sao_Paulo',
  },
  current: {
    temperatureC: 21.3,
    weatherCode: 2,
    humidityPercent: 64,
    windSpeedKmh: 8.6,
    precipitationMm: 0,
    pressureHpa: 1014.2,
  },
  forecastDays: [
    {
      date: '2026-10-29',
      minTemperatureC: 15.2,
      maxTemperatureC: 23.4,
      weatherCode: 2,
    },
    {
      date: '2026-10-30',
      minTemperatureC: 14.8,
      maxTemperatureC: 22.1,
      weatherCode: 3,
    },
    {
      date: '2026-10-31',
      minTemperatureC: 16.1,
      maxTemperatureC: 24.7,
      weatherCode: 61,
    },
    {
      date: '2026-11-01',
      minTemperatureC: 15.7,
      maxTemperatureC: 25.2,
      weatherCode: 1,
    },
    {
      date: '2026-11-02',
      minTemperatureC: 16.4,
      maxTemperatureC: 26.0,
      weatherCode: 0,
    },
  ],
};
