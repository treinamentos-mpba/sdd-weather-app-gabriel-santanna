import type { WeatherService } from '../types/weather';
import { mockWeatherData } from './weatherData';

function wait(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 350));
}

function normalize(value: string): string {
  return value
    .trim()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('pt-BR');
}

export const mockWeatherService: WeatherService = {
  async searchLocations(query) {
    await wait();
    const normalized = normalize(query);
    return normalized && normalize(mockWeatherData.city.name).startsWith(normalized)
      ? [mockWeatherData.city]
      : [];
  },
  async getWeather(city) {
    await wait();
    if (
      city.latitude !== mockWeatherData.city.latitude ||
      city.longitude !== mockWeatherData.city.longitude
    ) {
      throw new Error('Localidade indisponível nos dados de demonstração.');
    }
    return mockWeatherData;
  },
};
