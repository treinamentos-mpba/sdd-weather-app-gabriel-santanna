import { describe, expect, it } from 'vitest';
import {
  convertTemperature,
  formatTemperature,
  toFahrenheit,
  unitLabel,
} from '../../src/lib/temperature';

describe('toFahrenheit', () => {
  it.each([
    [0, 32],
    [100, 212],
    [-40, -40],
  ])('converte %s°C para %s°F', (celsius, expected) => {
    expect(toFahrenheit(celsius)).toBe(expected);
  });
});

describe('convertTemperature', () => {
  it.each([0, 100, -40, 21.345])('preserva %s quando a unidade é Celsius', (celsius) => {
    expect(convertTemperature(celsius, 'celsius')).toBe(celsius);
  });

  it.each([
    [0, 32],
    [100, 212],
    [-40, -40],
  ])('converte %s°C para %s quando a unidade é Fahrenheit', (celsius, expected) => {
    expect(convertTemperature(celsius, 'fahrenheit')).toBe(expected);
  });

  it('mantém a precisão da conversão antes da formatação', () => {
    expect(convertTemperature(21.345, 'fahrenheit')).toBeCloseTo(70.421, 10);
    expect(convertTemperature(21.345, 'fahrenheit')).not.toBe(70.4);
  });
});

describe('formatTemperature', () => {
  it.each([
    { celsius: 21.34, unit: 'celsius', expected: '21,3°' },
    { celsius: 21.36, unit: 'celsius', expected: '21,4°' },
    { celsius: -1.26, unit: 'celsius', expected: '-1,3°' },
    { celsius: 0, unit: 'celsius', expected: '0°' },
    { celsius: 0, unit: 'fahrenheit', expected: '32°' },
    { celsius: 100, unit: 'fahrenheit', expected: '212°' },
    { celsius: -40, unit: 'fahrenheit', expected: '-40°' },
    { celsius: 21.3, unit: 'fahrenheit', expected: '70,3°' },
  ] as const)('formata $celsius°C em $unit como $expected', ({ celsius, unit, expected }) => {
    expect(formatTemperature(celsius, unit)).toBe(expected);
  });
});

describe('unitLabel', () => {
  it.each([
    ['celsius', '°C'],
    ['fahrenheit', '°F'],
  ] as const)('retorna %s como %s', (unit, expected) => {
    expect(unitLabel(unit)).toBe(expected);
  });
});
