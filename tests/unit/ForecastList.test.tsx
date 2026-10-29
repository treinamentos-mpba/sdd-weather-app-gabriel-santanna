import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import ForecastList from '../../src/components/ForecastList';
import UnitToggle from '../../src/components/UnitToggle';
import type { ForecastDay, Unit } from '../../src/types/weather';

const days: ForecastDay[] = [
  { date: '2026-12-30', minTemperatureC: 0, maxTemperatureC: 100, weatherCode: 0 },
  { date: '2026-12-31', minTemperatureC: -40, maxTemperatureC: 0, weatherCode: 2 },
  { date: '2027-01-01', minTemperatureC: 10, maxTemperatureC: 20, weatherCode: 3 },
  { date: '2027-01-02', minTemperatureC: -10, maxTemperatureC: 0, weatherCode: 61 },
  { date: '2027-01-03', minTemperatureC: 20.2, maxTemperatureC: 21.3, weatherCode: 0 },
];

function ForecastWithUnitToggle() {
  const [unit, setUnit] = useState<Unit>('celsius');
  return (
    <>
      <UnitToggle unit={unit} onChange={setUnit} />
      <ForecastList days={days} unit={unit} />
    </>
  );
}

describe('ForecastList: edge cases da previsão', () => {
  it('converte todas as mínimas e máximas e volta a Celsius sem alterar dados ou datas', async () => {
    const user = userEvent.setup();
    const original = structuredClone(days);
    render(<ForecastWithUnitToggle />);

    const rows = within(screen.getByRole('list', { name: 'Previsão diária' })).getAllByRole(
      'listitem',
    );
    const temperatures = () =>
      rows.map((row) =>
        within(row)
          .getAllByRole('definition')
          .map((value) => value.textContent),
      );
    const celsius = [
      ['0°C', '100°C'],
      ['-40°C', '0°C'],
      ['10°C', '20°C'],
      ['-10°C', '0°C'],
      ['20,2°C', '21,3°C'],
    ];
    expect(temperatures()).toEqual(celsius);

    await user.click(screen.getByRole('button', { name: 'Fahrenheit' }));

    expect(temperatures()).toEqual([
      ['32°F', '212°F'],
      ['-40°F', '32°F'],
      ['50°F', '68°F'],
      ['14°F', '32°F'],
      ['68,4°F', '70,3°F'],
    ]);

    await user.click(screen.getByRole('button', { name: 'Celsius' }));

    expect(temperatures()).toEqual(celsius);
    ['30 Dez', '31 Dez', '1 Jan', '2 Jan', '3 Jan'].forEach((label, index) => {
      expect(within(rows[index]).getByText(label)).toHaveAttribute('datetime', days[index].date);
    });
    expect(days).toEqual(original);
  });

  it('preserva a posição e a data de um dia sem métricas e não converte null para zero', () => {
    const partialDays = days.map((day, index) =>
      index === 0
        ? { ...day, minTemperatureC: null, maxTemperatureC: null, weatherCode: null }
        : day,
    );
    render(<ForecastList days={partialDays} unit="fahrenheit" />);

    const rows = within(screen.getByRole('list', { name: 'Previsão diária' })).getAllByRole(
      'listitem',
    );

    expect(rows).toHaveLength(5);
    expect(within(rows[0]).getByText('30 Dez')).toHaveAttribute('datetime', '2026-12-30');
    expect(
      within(rows[0])
        .getAllByRole('definition')
        .map((value) => value.textContent),
    ).toEqual(['Indisponível', 'Indisponível']);
    expect(within(rows[0]).getByText('Condição indisponível')).toBeVisible();
    expect(within(rows[1]).getByText('31 Dez')).toHaveAttribute('datetime', '2026-12-31');
    expect(
      within(rows[1])
        .getAllByRole('definition')
        .map((value) => value.textContent),
    ).toEqual(['-40°F', '32°F']);
    expect(
      within(rows[2])
        .getAllByRole('definition')
        .map((value) => value.textContent),
    ).toEqual(['50°F', '68°F']);
  });
});
