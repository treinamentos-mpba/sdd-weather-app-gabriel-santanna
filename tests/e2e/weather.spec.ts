import { expect, test } from '@playwright/test';

const geocodingResponse = {
  results: [
    {
      id: 3448439,
      name: 'São Paulo',
      admin1: 'São Paulo',
      country: 'Brasil',
      country_code: 'BR',
      latitude: -23.55,
      longitude: -46.63,
      timezone: 'America/Sao_Paulo',
    },
  ],
};

const forecastResponse = {
  current: {
    temperature_2m: 0,
    weather_code: 0,
    relative_humidity_2m: 70,
    wind_speed_10m: 5,
    precipitation: 0,
    surface_pressure: 1013,
  },
  daily: {
    time: ['2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02'],
    temperature_2m_min: [-2, -1, 0, 1, 2],
    temperature_2m_max: [2, 3, 4, 5, 6],
    weather_code: [0, 2, 3, 61, 0],
  },
};

for (const scenario of [
  { name: 'desktop', viewport: { width: 1440, height: 900 } },
  { name: 'mobile 320px', viewport: { width: 320, height: 900 } },
  { name: 'mobile 375x812', viewport: { width: 375, height: 812 } },
]) {
  test(`busca cidade, apresenta cinco dias e converte para Fahrenheit em ${scenario.name}`, async ({
    page,
  }) => {
    let geocodingRequests = 0;
    let forecastRequests = 0;
    await page.setViewportSize(scenario.viewport);
    await page.route('https://geocoding-api.open-meteo.com/**', (route) => {
      geocodingRequests += 1;
      const url = new URL(route.request().url());
      expect(url.searchParams.get('name')).toBe('São Paulo');
      return route.fulfill({ json: geocodingResponse });
    });
    await page.route('https://api.open-meteo.com/**', (route) => {
      forecastRequests += 1;
      const url = new URL(route.request().url());
      expect(url.searchParams.get('latitude')).toBe('-23.55');
      expect(url.searchParams.get('longitude')).toBe('-46.63');
      return route.fulfill({ json: forecastResponse });
    });

    await page.goto('/');
    await page.getByRole('searchbox', { name: 'Buscar cidade' }).fill('São Paulo');
    await page.getByRole('button', { name: 'Buscar', exact: true }).click();

    await expect(page.getByRole('heading', { name: 'São Paulo', exact: true })).toBeVisible();
    const forecast = page.getByRole('region', { name: 'Previsão de 5 dias' });
    await expect(forecast).toBeVisible();
    await expect(forecast.getByRole('listitem')).toHaveCount(5);
    await expect(page.getByLabel('Temperatura atual')).toHaveText('0°C');

    await page.getByRole('button', { name: 'Fahrenheit' }).click();

    await expect(page.getByLabel('Temperatura atual')).toHaveText('32°F');
    await expect(page.getByRole('button', { name: 'Fahrenheit' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(forecast.getByRole('listitem').first()).toContainText('35,6°F');
    expect(geocodingRequests).toBe(1);
    expect(forecastRequests).toBe(1);
  });
}

test('geocoding sem results mostra Nenhuma cidade encontrada e não consulta previsão', async ({
  page,
}) => {
  let forecastRequests = 0;
  await page.route('https://geocoding-api.open-meteo.com/**', (route) =>
    route.fulfill({ json: {} }),
  );
  await page.route('https://api.open-meteo.com/**', (route) => {
    forecastRequests += 1;
    return route.fulfill({ json: forecastResponse });
  });

  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Buscar cidade' }).fill('Cidade inexistente');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();

  await expect(page.getByRole('heading', { name: 'Nenhuma cidade encontrada' })).toBeVisible();
  await expect(page.getByRole('searchbox', { name: 'Buscar cidade' })).toHaveValue(
    'Cidade inexistente',
  );
  await expect(page.getByRole('region', { name: 'Previsão de 5 dias' })).toHaveCount(0);
  await expect(page.getByLabel('Temperatura atual')).toHaveCount(0);
  await expect(page.getByRole('alert')).toHaveCount(0);
  expect(forecastRequests).toBe(0);
});

for (const missing of [
  {
    field: 'temperature_2m',
    label: 'temperatura',
    before: 'Temperatura indisponível',
    after: 'Temperatura indisponível',
  },
  { field: 'weather_code', label: 'condição', before: '0°C', after: '32°F' },
]) {
  test(`resposta parcial sem ${missing.label} conserva dados válidos e datas ao trocar unidade`, async ({
    page,
  }) => {
    await page.route('https://geocoding-api.open-meteo.com/**', (route) =>
      route.fulfill({ json: geocodingResponse }),
    );
    await page.route('https://api.open-meteo.com/**', (route) =>
      route.fulfill({
        json: {
          current: {
            ...forecastResponse.current,
            [missing.field]: null,
            relative_humidity_2m: null,
            wind_speed_10m: undefined,
            surface_pressure: undefined,
          },
          daily: {
            ...forecastResponse.daily,
            temperature_2m_min: [null, -1, 0, 1, 2],
            temperature_2m_max: [null, 3, 4, 5, 6],
            weather_code: [null, 2, 3, 61, 0],
          },
        },
      }),
    );

    await page.goto('/');
    await page.getByRole('searchbox', { name: 'Buscar cidade' }).fill('São Paulo');
    await page.getByRole('button', { name: 'Buscar', exact: true }).click();

    const current = page.getByRole('region', { name: 'São Paulo', exact: true });
    await expect(current).toBeVisible();
    await expect(current.getByRole('status')).toHaveText('Dados meteorológicos incompletos.');
    await expect(page.getByLabel('Temperatura atual')).toHaveText(missing.before);
    await expect(current.getByText('Indisponível', { exact: true })).toHaveCount(3);
    await expect(current.getByText('0 mm', { exact: true })).toBeVisible();
    await expect(
      current.getByText(missing.field === 'weather_code' ? 'Condição indisponível' : 'Céu limpo'),
    ).toBeVisible();

    const rows = page.getByRole('region', { name: 'Previsão de 5 dias' }).getByRole('listitem');
    await expect(rows).toHaveCount(5);
    await expect(rows.first().getByRole('definition')).toHaveText(['Indisponível', 'Indisponível']);

    await page.getByRole('button', { name: 'Fahrenheit' }).click();

    await expect(page.getByLabel('Temperatura atual')).toHaveText(missing.after);
    await expect(rows.first().getByRole('definition')).toHaveText(['Indisponível', 'Indisponível']);
    await expect(rows.first().getByText('29 Out')).toHaveAttribute('datetime', '2026-10-29');
    await expect(rows.nth(1).getByText('30 Out')).toHaveAttribute('datetime', '2026-10-30');
    await expect(rows.nth(1).getByRole('definition')).toHaveText(['30,2°F', '37,4°F']);
    await expect(page.getByRole('alert')).toHaveCount(0);
  });
}

for (const stage of ['geocoding', 'forecast']) {
  test(`perda de conexão em ${stage} permite retry e preserva Fahrenheit escolhido durante o erro`, async ({
    page,
  }) => {
    let geocodingRequests = 0;
    let forecastRequests = 0;
    await page.route('https://geocoding-api.open-meteo.com/**', (route) => {
      geocodingRequests += 1;
      if (stage === 'geocoding' && geocodingRequests === 1)
        return route.abort('internetdisconnected');
      return route.fulfill({ json: geocodingResponse });
    });
    await page.route('https://api.open-meteo.com/**', (route) => {
      forecastRequests += 1;
      if (stage === 'forecast' && forecastRequests === 1)
        return route.abort('internetdisconnected');
      return route.fulfill({ json: forecastResponse });
    });

    await page.goto('/');
    await page.getByRole('searchbox', { name: 'Buscar cidade' }).fill('São Paulo');
    await page.getByRole('button', { name: 'Buscar', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('Falha de rede.');
    await expect(page.getByLabel('Temperatura atual')).toHaveCount(0);
    await expect(page.getByRole('region', { name: 'Previsão de 5 dias' })).toHaveCount(0);
    await expect(page.getByRole('searchbox')).toHaveValue('São Paulo');
    if (stage === 'forecast')
      await expect(page.getByText('São Paulo', { exact: true })).toBeVisible();
    const beforeUnitChange = { geocodingRequests, forecastRequests };

    await page.getByRole('button', { name: 'Fahrenheit' }).click();

    await expect(page.getByRole('alert')).toContainText('Falha de rede.');
    expect({ geocodingRequests, forecastRequests }).toEqual(beforeUnitChange);
    await page.getByRole('button', { name: 'Tentar novamente' }).click();

    await expect(page.getByRole('region', { name: 'São Paulo', exact: true })).toBeVisible();
    await expect(page.getByLabel('Temperatura atual')).toHaveText('32°F');
    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Fahrenheit' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(geocodingRequests).toBe(2);
    expect(forecastRequests).toBe(stage === 'forecast' ? 2 : 1);
  });
}
