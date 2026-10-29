import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CurrentWeather from '../../src/components/CurrentWeather';
import UnitToggle from '../../src/components/UnitToggle';
import { mockWeatherData } from '../../src/mocks/weatherData';
import type { Unit } from '../../src/types/weather';

afterEach(cleanup);

describe('UnitToggle', () => {
  it('atualiza CurrentWeather de 0°C para 32°F ao clicar em Fahrenheit', async () => {
    const user = userEvent.setup();
    const current = { ...mockWeatherData.current, temperatureC: 0 };

    function WeatherWithUnitToggle() {
      const [unit, setUnit] = useState<Unit>('celsius');
      return (
        <>
          <UnitToggle unit={unit} onChange={setUnit} />
          <CurrentWeather city={mockWeatherData.city} current={current} unit={unit} />
        </>
      );
    }

    render(<WeatherWithUnitToggle />);
    expect(screen.getByLabelText('Temperatura atual')).toHaveTextContent(/^0°C$/);
    expect(screen.getByRole('button', { name: 'Celsius', pressed: true })).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Fahrenheit' }));

    expect(screen.getByRole('group', { name: 'Temperatura atual' })).toHaveTextContent(/^32°F$/);
    expect(screen.getByRole('button', { name: 'Fahrenheit', pressed: true })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Celsius', pressed: false })).toBeVisible();
    expect(current.temperatureC).toBe(0);

    await user.click(screen.getByRole('button', { name: 'Celsius' }));

    expect(screen.getByLabelText('Temperatura atual')).toHaveTextContent(/^0°C$/);
  });

  it('expõe o grupo e atualiza o estado pressionado a partir da prop', () => {
    const onChange = vi.fn();
    const { rerender } = render(<UnitToggle unit="celsius" onChange={onChange} />);
    const group = screen.getByRole('group', {
      name: 'Unidade de temperatura',
    });

    expect(within(group).getAllByRole('button')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Celsius', pressed: true }).textContent).toBe('°C');
    expect(screen.getByRole('button', { name: 'Fahrenheit', pressed: false }).textContent).toBe(
      '°F',
    );

    rerender(<UnitToggle unit="fahrenheit" onChange={onChange} />);

    expect(screen.getByRole('button', { name: 'Fahrenheit', pressed: true })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Celsius', pressed: false })).toBeTruthy();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('emite apenas uma mudança ao clicar na unidade inativa', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(<UnitToggle unit="celsius" onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Celsius' }));
    expect(onChange).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Fahrenheit' }));
    expect(onChange).toHaveBeenCalledExactlyOnceWith('fahrenheit');

    onChange.mockClear();
    rerender(<UnitToggle unit="fahrenheit" onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: 'Celsius' }));
    expect(onChange).toHaveBeenCalledExactlyOnceWith('celsius');
  });

  it('permite navegar com Tab e Shift+Tab e ativar com Enter e Espaço', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(<UnitToggle unit="celsius" onChange={onChange} />);

    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Celsius' }));
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Fahrenheit' }));
    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalledExactlyOnceWith('fahrenheit');

    onChange.mockClear();
    rerender(<UnitToggle unit="fahrenheit" onChange={onChange} />);
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Celsius' }));
    await user.keyboard(' ');
    expect(onChange).toHaveBeenCalledExactlyOnceWith('celsius');
    expect(screen.getByRole('button', { name: 'Celsius' }).getAttribute('type')).toBe('button');
  });
});
