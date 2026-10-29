import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Sun,
  Thermometer,
} from 'lucide-react';
import { describe, expect, it } from 'vitest';
import {
  getWeatherIcon,
  getWeatherIconComponent,
  getWeatherInfo,
  getWeatherLabel,
} from '../../src/lib/weatherCodes';

describe('weatherCodes', () => {
  it.each([
    { code: 0, label: 'Céu limpo', icon: '☀️' },
    { code: 61, label: 'Chuva fraca', icon: '🌦️' },
    { code: 95, label: 'Trovoadas', icon: '⛈️' },
  ])('retorna descrição e ícone conhecidos para o código $code', ({ code, label, icon }) => {
    expect(getWeatherInfo(code)).toEqual({ label, icon });
    expect(getWeatherLabel(code)).toBe(label);
    expect(getWeatherIcon(code)).toBe(icon);
  });

  it.each([
    { code: 0, expected: Sun },
    { code: 2, expected: CloudSun },
    { code: 3, expected: Cloud },
    { code: 45, expected: CloudFog },
    { code: 51, expected: CloudDrizzle },
    { code: 61, expected: CloudRain },
    { code: 71, expected: CloudSnow },
    { code: 95, expected: CloudLightning },
  ])('retorna o componente de ícone correspondente ao código $code', ({ code, expected }) => {
    expect(getWeatherIconComponent(code)).toBe(expected);
  });

  it.each([-1, 999, null])('usa fallback sem inventar condição para o código %s', (code) => {
    expect(getWeatherInfo(code)).toEqual({ label: 'Condição indisponível', icon: '🌡️' });
    expect(getWeatherLabel(code)).toBe('Condição indisponível');
    expect(getWeatherIcon(code)).toBe('🌡️');
    expect(getWeatherIconComponent(code)).toBe(Thermometer);
  });
});
