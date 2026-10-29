import { useId } from 'react';
import { formatTemperature, unitLabel } from '../lib/temperature';
import { getWeatherIconComponent, getWeatherInfo } from '../lib/weatherCodes';
import type { City, CurrentWeather as CurrentWeatherData, Unit } from '../types/weather';

interface CurrentWeatherProps {
  city: City;
  current: CurrentWeatherData;
  unit: Unit;
}

const numberFormatter = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 1,
});

function formatMetric(value: number | null | undefined, suffix: string): string {
  return value == null ? 'Indisponível' : `${numberFormatter.format(value)} ${suffix}`;
}

export default function CurrentWeather({ city, current, unit }: CurrentWeatherProps) {
  const headingId = useId();
  const condition = getWeatherInfo(current.weatherCode);
  const WeatherIcon = getWeatherIconComponent(current.weatherCode);
  const incomplete = current.temperatureC === null || condition.label === 'Condição indisponível';
  const metrics = [
    { label: 'Umidade', value: formatMetric(current.humidityPercent, '%') },
    { label: 'Vento', value: formatMetric(current.windSpeedKmh, 'km/h') },
    { label: 'Precipitação', value: formatMetric(current.precipitationMm, 'mm') },
    { label: 'Pressão', value: formatMetric(current.pressureHpa, 'hPa') },
  ];

  return (
    <section
      aria-labelledby={headingId}
      className="min-w-0 space-y-6 border-b border-white/10 py-8 text-white"
    >
      <header className="space-y-1">
        <h2 id={headingId} className="break-words text-3xl font-semibold">
          {city.name}
        </h2>
        <p className="break-words text-white/70">
          {[city.region, city.country].filter(Boolean).join(', ')}
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-6">
        <div role="group" aria-label="Temperatura atual" className="min-w-0">
          {current.temperatureC === null ? (
            <span className="text-xl text-white/70">Temperatura indisponível</span>
          ) : (
            <span className="break-words text-7xl font-semibold tabular-nums">
              {formatTemperature(current.temperatureC, unit)}
              <span className="text-3xl">{unitLabel(unit).slice(1)}</span>
            </span>
          )}
        </div>
        <div className="flex min-w-0 items-center gap-3">
          <WeatherIcon aria-hidden="true" focusable="false" className="h-12 w-12 shrink-0" />
          <p className="break-words text-lg">{condition.label}</p>
        </div>
      </div>

      {incomplete && (
        <p role="status" className="text-sm text-sun">
          Dados meteorológicos incompletos.
        </p>
      )}

      <dl className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="min-w-0 space-y-1">
            <dt className="break-words text-sm text-white/70">{metric.label}</dt>
            <dd className="break-words font-medium tabular-nums">{metric.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
