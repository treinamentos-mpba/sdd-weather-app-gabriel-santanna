import { expect, test } from '@playwright/test';
import { mockWeatherData } from '../../src/mocks/weatherData';

const forecastResponse = {
  current: {
    temperature_2m: mockWeatherData.current.temperatureC,
    weather_code: mockWeatherData.current.weatherCode,
    relative_humidity_2m: mockWeatherData.current.humidityPercent,
    wind_speed_10m: mockWeatherData.current.windSpeedKmh,
    precipitation: mockWeatherData.current.precipitationMm,
    surface_pressure: mockWeatherData.current.pressureHpa,
  },
  daily: {
    time: mockWeatherData.forecastDays.map((day) => day.date),
    temperature_2m_min: mockWeatherData.forecastDays.map((day) => day.minTemperatureC),
    temperature_2m_max: mockWeatherData.forecastDays.map((day) => day.maxTemperatureC),
    weather_code: mockWeatherData.forecastDays.map((day) => day.weatherCode),
  },
};

test.beforeEach(async ({ page }) => {
  await page.route('https://geocoding-api.open-meteo.com/**', (route) => {
    const query = new URL(route.request().url()).searchParams.get('name');
    return route.fulfill({
      json: {
        results:
          query === 'Lisboa'
            ? []
            : [
                {
                  ...mockWeatherData.city,
                  admin1: mockWeatherData.city.region,
                  country_code: mockWeatherData.city.countryCode,
                },
              ],
      },
    });
  });
  await page.route('https://api.open-meteo.com/**', (route) =>
    route.fulfill({ json: forecastResponse }),
  );
});

for (const width of [320, 375, 768, 1024, 1440]) {
  test(`layout acessível sem overflow em ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    let apiRequests = 0;
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('request', (request) => {
      if (/https:\/\/.*open-meteo\.com\//.test(request.url())) apiRequests += 1;
    });
    await page.goto('/');
    await page.getByRole('searchbox').fill('Curitiba');
    await page.getByRole('searchbox').press('Enter');
    await expect(page.getByRole('region', { name: 'Curitiba' })).toBeVisible();
    await expect(page.getByRole('searchbox')).toBeFocused();

    const controls = page.locator('header button, header input');
    for (const control of await controls.all()) {
      const bounds = await control.boundingBox();
      expect(bounds?.width).toBeGreaterThanOrEqual(44);
      expect(bounds?.height).toBeGreaterThanOrEqual(44);
    }

    await page.getByRole('button', { name: 'Fahrenheit' }).click();
    await expect(page.getByLabel('Temperatura atual')).toHaveText('70,3°F');
    await expect(page.getByRole('button', { name: 'Fahrenheit' })).toBeFocused();

    const geometry = await page.evaluate(() => {
      const heading = document.querySelector('h1');
      const toggle = document.querySelector('header [role="group"]');
      if (!heading || !toggle) throw new Error('Header incompleto.');
      const range = document.createRange();
      range.selectNodeContents(heading);
      return {
        viewport: window.innerWidth,
        scroll: document.documentElement.scrollWidth,
        brandRight: range.getBoundingClientRect().right,
        toggleLeft: toggle.getBoundingClientRect().left,
      };
    });
    expect(geometry.scroll).toBeLessThanOrEqual(geometry.viewport);
    expect(geometry.brandRight).toBeLessThanOrEqual(geometry.toggleLeft);

    const icons = page.locator('svg');
    await expect(icons).toHaveCount(7);
    for (const icon of await icons.all()) {
      await expect(icon).toBeVisible();
      await expect(icon).toHaveAttribute('aria-hidden', 'true');
      await expect(icon).toHaveAttribute('focusable', 'false');
      expect(await icon.locator('path, circle, line, polyline').count()).toBeGreaterThan(0);
    }

    await page.screenshot({ path: testInfo.outputPath(`layout-${width}.png`), fullPage: true });

    if (width === 320) {
      await page
        .getByRole('region', { name: 'Curitiba' })
        .getByRole('heading')
        .evaluate((heading) => {
          heading.textContent = 'CidadeComNomeMuitoLongoSemEspacosParaVerificarAQuebraDeTexto';
        });
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      );
    }

    await page.getByRole('searchbox').fill('Lisboa');
    await page.getByRole('searchbox').press('Enter');
    await expect(page.getByRole('heading', { name: 'Nenhuma cidade encontrada' })).toBeVisible();
    await expect(page.getByText('Nenhuma cidade encontrada.')).toHaveAttribute(
      'aria-live',
      'polite',
    );
    await expect(page.getByRole('searchbox')).toBeFocused();
    expect(errors).toEqual([]);
    expect(apiRequests).toBe(3);
  });
}

test('skip link encaminha o foco ao conteúdo', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('searchbox')).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Ir para o conteúdo' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
});

test('navegação por teclado inclui busca automática e unidade', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('searchbox')).toBeVisible();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('searchbox')).toBeFocused();
  await page.keyboard.type('Curitiba');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('region', { name: 'Curitiba' })).toBeVisible();
  await expect(page.getByRole('searchbox')).toBeFocused();

  const outline = await page.getByRole('searchbox').evaluate((input) => {
    const style = getComputedStyle(input);
    return { width: style.outlineWidth, style: style.outlineStyle };
  });
  expect(outline).toEqual({ width: '2px', style: 'solid' });

  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Buscar' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Celsius' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Fahrenheit' })).toBeFocused();
  await page.keyboard.press('Space');
  await expect(page.getByRole('button', { name: 'Fahrenheit' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByLabel('Temperatura atual')).toHaveText('70,3°F');
  await expect(page.getByRole('button', { name: 'Fahrenheit' })).toBeFocused();
});

test('erro de previsão oferece retry e refaz a consulta real com HTTP interceptado', async ({
  page,
}) => {
  let forecastRequests = 0;
  await page.route('https://api.open-meteo.com/**', (route) => {
    forecastRequests += 1;
    return forecastRequests === 1
      ? route.fulfill({ status: 503, json: { error: true } })
      : route.fulfill({ json: forecastResponse });
  });
  await page.goto('/');
  await page.getByRole('searchbox').fill('Curitiba');
  await page.getByRole('searchbox').press('Enter');
  await expect(page.getByRole('alert')).toContainText('Não foi possível consultar a previsão.');
  await expect(page.getByLabel('Temperatura atual')).toHaveCount(0);

  await page.getByRole('button', { name: 'Tentar novamente' }).click();

  await expect(page.getByRole('region', { name: 'Curitiba' })).toBeVisible();
  await expect(page.getByRole('main')).toBeFocused();
  await expect(page.getByRole('alert')).toHaveCount(0);
  expect(forecastRequests).toBe(2);
});
