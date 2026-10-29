import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import CurrentWeather from '../../src/components/CurrentWeather';
import { convertTemperature } from '../../src/lib/temperature';
import { getWeatherInfo } from '../../src/lib/weatherCodes';
import { mockWeatherData } from '../../src/mocks/weatherData';

afterEach(cleanup);

describe('CurrentWeather', () => {
  it('apresenta cidade, temperatura, condição com ícone e as quatro métricas', () => {
    render(
      <CurrentWeather
        city={mockWeatherData.city}
        current={mockWeatherData.current}
        unit="celsius"
      />,
    );

    expect(screen.getByRole('region', { name: 'Curitiba' })).toBeTruthy();
    expect(screen.getByText('Paraná, Brasil')).toBeTruthy();
    expect(screen.getByLabelText('Temperatura atual').textContent).toBe('21,3°C');
    expect(screen.getByText('Parcialmente nublado')).toBeTruthy();
    expect(screen.getByText('Parcialmente nublado').previousElementSibling).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    expect(
      screen.getByText('Parcialmente nublado').previousElementSibling?.tagName.toLowerCase(),
    ).toBe('svg');
    expect(screen.getByText('Umidade').nextElementSibling?.textContent).toBe('64 %');
    expect(screen.getByText('Vento').nextElementSibling?.textContent).toBe('8,6 km/h');
    expect(screen.getByText('Precipitação').nextElementSibling?.textContent).toBe('0 mm');
    expect(screen.getByText('Pressão').nextElementSibling?.textContent).toBe('1.014,2 hPa');
    expect(screen.queryByRole('status')).toBeNull();
  });

  it.each([
    [0, '32°F'],
    [100, '212°F'],
    [-10, '14°F'],
    [21.3, '70,3°F'],
  ])('converte %s Celsius e atualiza quando a unidade muda', (temperatureC, expected) => {
    const current = { ...mockWeatherData.current, temperatureC };
    const { rerender } = render(
      <CurrentWeather city={mockWeatherData.city} current={current} unit="celsius" />,
    );

    rerender(<CurrentWeather city={mockWeatherData.city} current={current} unit="fahrenheit" />);

    expect(screen.getByLabelText('Temperatura atual').textContent).toBe(expected);
    expect(screen.getByText('64 %')).toBeTruthy();
    expect(current.temperatureC).toBe(temperatureC);
  });

  it('mostra dados ausentes sem convertê-los em zero ou inventar uma condição', () => {
    render(
      <CurrentWeather
        city={mockWeatherData.city}
        current={{
          temperatureC: null,
          weatherCode: null,
          humidityPercent: null,
          windSpeedKmh: null,
          precipitationMm: null,
        }}
        unit="fahrenheit"
      />,
    );

    expect(screen.getByText('Temperatura indisponível')).toBeTruthy();
    expect(screen.getByText('Condição indisponível')).toBeTruthy();
    expect(screen.getAllByText('Indisponível')).toHaveLength(4);
    expect(screen.getByRole('status').textContent).toBe('Dados meteorológicos incompletos.');
  });

  it('preserva valores zero e trata pressão null e código WMO desconhecido', () => {
    render(
      <CurrentWeather
        city={mockWeatherData.city}
        current={{
          temperatureC: 0,
          weatherCode: 999,
          humidityPercent: 0,
          windSpeedKmh: 0,
          precipitationMm: 0,
          pressureHpa: null,
        }}
        unit="celsius"
      />,
    );

    expect(screen.getByLabelText('Temperatura atual').textContent).toBe('0°C');
    expect(screen.getByText('0 %')).toBeTruthy();
    expect(screen.getByText('0 km/h')).toBeTruthy();
    expect(screen.getByText('0 mm')).toBeTruthy();
    expect(screen.getByText('Pressão').nextElementSibling?.textContent).toBe('Indisponível');
    expect(screen.getByText('Condição indisponível')).toBeTruthy();
    expect(screen.getByRole('status')).toBeTruthy();
  });

  it('mantém a conversão sem arredondamento no domínio e reconhece códigos WMO', () => {
    expect(convertTemperature(0, 'fahrenheit')).toBe(32);
    expect(convertTemperature(100, 'fahrenheit')).toBe(212);
    expect(convertTemperature(21.3, 'celsius')).toBe(21.3);
    expect(convertTemperature(21.3, 'fahrenheit')).toBeCloseTo(70.34);
    expect(getWeatherInfo(0).label).toBe('Céu limpo');
    expect(getWeatherInfo(61).label).toBe('Chuva fraca');
    expect(getWeatherInfo(null).label).toBe('Condição indisponível');
    expect(getWeatherInfo(999).label).toBe('Condição indisponível');
  });
});
