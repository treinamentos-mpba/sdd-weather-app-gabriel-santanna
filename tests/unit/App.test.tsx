import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import App from '../../src/App';
import { mockWeatherData } from '../../src/mocks/weatherData';
import type { City, WeatherData, WeatherService } from '../../src/types/weather';

function createService() {
  return {
    searchLocations: vi
      .fn<WeatherService['searchLocations']>()
      .mockResolvedValue([mockWeatherData.city]),
    getWeather: vi.fn<WeatherService['getWeather']>().mockResolvedValue(mockWeatherData),
  };
}

describe('App', () => {
  it('usa o serviço real por padrão com fetch simulado, sem depender de cidade fixa', async () => {
    const user = userEvent.setup();
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({ results: [] })))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            results: [
              {
                name: 'Porto Alegre',
                country: 'Brasil',
                latitude: -30.03,
                longitude: -51.23,
              },
            ],
          }),
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            current: { temperature_2m: 21.3, weather_code: 2 },
            daily: {
              time: mockWeatherData.forecastDays.map((day) => day.date),
              temperature_2m_min: mockWeatherData.forecastDays.map((day) => day.minTemperatureC),
              temperature_2m_max: mockWeatherData.forecastDays.map((day) => day.maxTemperatureC),
              weather_code: mockWeatherData.forecastDays.map((day) => day.weatherCode),
            },
          }),
        ),
      );
    try {
      render(<App />);
      expect(fetchSpy).not.toHaveBeenCalled();
      await user.type(screen.getByRole('searchbox'), 'Lisboa{Enter}');
      expect(
        await screen.findByRole('heading', { name: 'Nenhuma cidade encontrada' }),
      ).toBeTruthy();

      await user.clear(screen.getByRole('searchbox'));
      await user.type(screen.getByRole('searchbox'), 'Porto Alegre{Enter}');

      expect((await screen.findByLabelText('Temperatura atual')).textContent).toBe('21,3°C');
      expect(screen.getByRole('region', { name: 'Porto Alegre' })).toBeTruthy();
      const forecastUrl = new URL(String(fetchSpy.mock.calls[2][0]));
      expect(forecastUrl.searchParams.get('latitude')).toBe('-30.03');
      expect(forecastUrl.searchParams.get('longitude')).toBe('-51.23');
      await user.click(screen.getByRole('button', { name: 'Fahrenheit' }));
      expect(screen.getByLabelText('Temperatura atual').textContent).toBe('70,3°F');
      expect(fetchSpy).toHaveBeenCalledTimes(3);
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it('inicia em idle, com marca, busca e Celsius, sem consultar o serviço', () => {
    const service = createService();
    render(<App service={service} />);

    expect(screen.getByRole('heading', { name: /WeatherView/ })).toBeTruthy();
    expect(screen.getByRole('searchbox', { name: 'Buscar cidade' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Celsius', pressed: true })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Consultar clima' })).toBeTruthy();
    expect(screen.getByText('Nenhuma cidade selecionada.')).toBeTruthy();
    expect(screen.queryByText('Dados de demonstração')).toBeNull();
    expect(screen.queryByRole('button', { name: /Curitiba/ })).toBeNull();
    expect(screen.queryByLabelText('Temperatura atual')).toBeNull();
    expect(service.searchLocations).not.toHaveBeenCalled();
    expect(service.getWeather).not.toHaveBeenCalled();
  });

  it('rejeita entrada vazia e carrega automaticamente a primeira cidade após buscar', async () => {
    const user = userEvent.setup();
    const service = createService();
    render(<App service={service} />);

    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(screen.getByRole('alert').textContent).toBe('Digite o nome de uma cidade.');
    expect(screen.getByRole('searchbox')).toHaveFocus();
    expect(screen.getByRole('searchbox')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('searchbox')).toHaveAccessibleDescription(
      'Digite o nome de uma cidade.',
    );
    expect(service.searchLocations).not.toHaveBeenCalled();

    await user.type(screen.getByRole('searchbox'), ' Curitiba {Enter}');
    expect(await screen.findByLabelText('Temperatura atual')).toBeTruthy();
    expect(screen.getByText('Condições e previsão de Curitiba carregadas.')).toHaveAttribute(
      'aria-live',
      'polite',
    );
    expect(screen.getByRole('searchbox')).toHaveFocus();
    expect(service.searchLocations).toHaveBeenCalledExactlyOnceWith('Curitiba');
    expect(service.getWeather).toHaveBeenCalledExactlyOnceWith(mockWeatherData.city);
  });

  it('mantém alternativas disponíveis para selecionar outra cidade após a busca automática', async () => {
    const user = userEvent.setup();
    const service = createService();
    const secondCity = { ...mockWeatherData.city, name: 'Curitiba do Sul', latitude: -24 };
    service.searchLocations.mockResolvedValue([mockWeatherData.city, secondCity]);
    service.getWeather
      .mockResolvedValueOnce(mockWeatherData)
      .mockResolvedValueOnce({ ...mockWeatherData, city: secondCity });
    render(<App service={service} />);

    await user.type(screen.getByRole('searchbox'), 'Curitiba{Enter}');
    await screen.findByRole('region', { name: 'Curitiba' });
    expect(screen.getByRole('heading', { name: 'Cidades encontradas' })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: /Curitiba do Sul/ }));

    expect(await screen.findByRole('region', { name: 'Curitiba do Sul' })).toBeTruthy();
    expect(service.getWeather).toHaveBeenNthCalledWith(2, secondCity);
    expect(service.searchLocations).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('main')).toHaveFocus();
    expect(screen.getByRole('searchbox')).toHaveValue('Curitiba');
  });

  it('mostra loading e preserva a unidade escolhida durante a consulta', async () => {
    const user = userEvent.setup();
    const service = createService();
    let resolveWeather: (data: WeatherData) => void = vi.fn();
    service.getWeather.mockReturnValue(
      new Promise((resolve) => {
        resolveWeather = resolve;
      }),
    );
    render(<App service={service} />);

    await user.type(screen.getByRole('searchbox'), 'Curitiba{Enter}');
    expect(screen.getByRole('status').textContent).toBe('Carregando dados meteorológicos...');
    expect(screen.getByRole('searchbox')).toHaveFocus();
    expect(screen.queryByLabelText('Temperatura atual')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Fahrenheit' }));
    await act(async () => {
      resolveWeather(mockWeatherData);
    });

    expect(screen.getByLabelText('Temperatura atual').textContent).toBe('70,3°F');
    expect(screen.getByRole('button', { name: 'Fahrenheit' })).toHaveFocus();
    expect(screen.getByText('Condições e previsão de Curitiba carregadas.')).toHaveAttribute(
      'aria-live',
      'polite',
    );
    expect(service.getWeather).toHaveBeenCalledTimes(1);
  });

  it('converte clima atual e cinco dias sem alterar os dados nem consultar novamente', async () => {
    const user = userEvent.setup();
    const service = createService();
    const original = structuredClone(mockWeatherData);
    render(<App service={service} />);

    await user.type(screen.getByRole('searchbox'), 'Curitiba{Enter}');
    expect((await screen.findByLabelText('Temperatura atual')).textContent).toBe('21,3°C');
    const days = within(screen.getByRole('list', { name: 'Previsão diária' })).getAllByRole(
      'listitem',
    );
    expect(days).toHaveLength(5);
    expect(within(days[0]).getByText('15,2°C')).toBeTruthy();
    expect(within(days[0]).getByText('23,4°C')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Fahrenheit' }));
    expect(screen.getByLabelText('Temperatura atual').textContent).toBe('70,3°F');
    expect(within(days[0]).getByText('59,4°F')).toBeTruthy();
    expect(within(days[0]).getByText('74,1°F')).toBeTruthy();
    expect(days.every((day) => !day.textContent?.includes('°C'))).toBe(true);

    await user.click(screen.getByRole('button', { name: 'Celsius' }));
    expect(screen.getByLabelText('Temperatura atual').textContent).toBe('21,3°C');
    expect(screen.getByRole('region', { name: 'Curitiba' })).toBeTruthy();
    expect(screen.getByText('29 Out').getAttribute('datetime')).toBe('2026-10-29');
    expect(service.getWeather).toHaveBeenCalledTimes(1);
    expect(service.searchLocations).toHaveBeenCalledExactlyOnceWith('Curitiba');
    expect(mockWeatherData).toEqual(original);
  });

  it('mostra empty sem preservar a previsão de uma busca anterior', async () => {
    const user = userEvent.setup();
    const service = createService();
    service.searchLocations.mockResolvedValueOnce([mockWeatherData.city]).mockResolvedValueOnce([]);
    render(<App service={service} />);

    await user.type(screen.getByRole('searchbox'), 'Curitiba{Enter}');
    await screen.findByLabelText('Temperatura atual');
    await user.clear(screen.getByRole('searchbox'));
    await user.type(screen.getByRole('searchbox'), 'Outra cidade{Enter}');

    expect(await screen.findByRole('heading', { name: 'Nenhuma cidade encontrada' })).toBeTruthy();
    expect(screen.getByText('Nenhuma cidade encontrada.')).toHaveAttribute('aria-live', 'polite');
    expect(screen.queryByLabelText('Temperatura atual')).toBeNull();
    expect(screen.queryByRole('list', { name: 'Previsão diária' })).toBeNull();
    expect(screen.getByRole('searchbox').getAttribute('value')).toBe('Outra cidade');
  });

  it('repete a consulta original após erro e mantém a cidade identificada', async () => {
    const user = userEvent.setup();
    const service = createService();
    service.getWeather.mockRejectedValueOnce(new Error('Falha simulada'));
    render(<App service={service} />);

    await user.type(screen.getByRole('searchbox'), 'Curitiba{Enter}');
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.getByText('Curitiba')).toBeTruthy();
    expect(screen.queryByLabelText('Temperatura atual')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(await screen.findByLabelText('Temperatura atual')).toBeTruthy();
    expect(screen.getByRole('main')).toHaveFocus();
    expect(service.getWeather).toHaveBeenNthCalledWith(2, mockWeatherData.city);
    expect(service.searchLocations).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('permite repetir também uma busca que falhou', async () => {
    const user = userEvent.setup();
    const service = createService();
    service.searchLocations.mockRejectedValueOnce(new Error('Falha simulada'));
    render(<App service={service} />);

    await user.type(screen.getByRole('searchbox'), 'Curitiba{Enter}');
    await screen.findByRole('alert');
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(await screen.findByLabelText('Temperatura atual')).toBeTruthy();
    expect(service.searchLocations).toHaveBeenNthCalledWith(2, 'Curitiba');
    expect(service.getWeather).toHaveBeenCalledExactlyOnceWith(mockWeatherData.city);
  });

  it('ignora respostas de buscas anteriores que chegam depois da atual', async () => {
    const user = userEvent.setup();
    const service = createService();
    let resolveFirst: (cities: City[]) => void = vi.fn();
    service.searchLocations.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveFirst = resolve;
      }),
    );
    service.searchLocations.mockResolvedValueOnce([]);
    render(<App service={service} />);

    await user.type(screen.getByRole('searchbox'), 'Curitiba{Enter}');
    expect(screen.getByRole('status')).toBeTruthy();
    await user.clear(screen.getByRole('searchbox'));
    await user.type(screen.getByRole('searchbox'), 'Outra cidade{Enter}');
    await screen.findByRole('heading', { name: 'Nenhuma cidade encontrada' });
    await act(async () => {
      resolveFirst([mockWeatherData.city]);
    });

    expect(screen.getByRole('heading', { name: 'Nenhuma cidade encontrada' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Curitiba/ })).toBeNull();
  });
});
