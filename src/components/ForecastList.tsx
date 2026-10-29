import { getDayLabel, getShortDate } from '../lib/format';
import { formatTemperature, unitLabel } from '../lib/temperature';
import { getWeatherIconComponent, getWeatherInfo } from '../lib/weatherCodes';
import type { ForecastDay, Unit } from '../types/weather';

interface ForecastListProps {
  days: ForecastDay[];
  unit: Unit;
}

function displayTemperature(value: number | null, unit: Unit): string {
  return value === null
    ? 'Indisponível'
    : `${formatTemperature(value, unit)}${unitLabel(unit).slice(1)}`;
}

export default function ForecastList({ days, unit }: ForecastListProps) {
  return (
    <section aria-labelledby="forecast-heading" className="space-y-5 py-8">
      <h2 id="forecast-heading" className="text-xl font-semibold">
        Previsão de 5 dias
      </h2>
      {days.length === 0 ? (
        <p className="text-white/70">Previsão indisponível.</p>
      ) : (
        <ul
          aria-label="Previsão diária"
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
        >
          {days.slice(0, 5).map((day, index) => {
            const condition = getWeatherInfo(day.weatherCode);
            const WeatherIcon = getWeatherIconComponent(day.weatherCode);
            return (
              <li
                key={day.date}
                className="min-w-0 space-y-4 rounded-lg border border-white/10 bg-white/5 p-4"
              >
                <div>
                  <h3 className="font-semibold">{getDayLabel(day.date, index)}</h3>
                  <time dateTime={day.date} className="text-sm text-white/60">
                    {getShortDate(day.date)}
                  </time>
                </div>
                <WeatherIcon aria-hidden="true" focusable="false" className="h-10 w-10" />
                <p className="min-h-12 break-words text-sm text-white/70">{condition.label}</p>
                <dl className="space-y-2 text-sm">
                  <div className="flex flex-wrap justify-between gap-x-2 gap-y-1">
                    <dt className="text-white/60">Mínima</dt>
                    <dd className="break-words tabular-nums">
                      {displayTemperature(day.minTemperatureC, unit)}
                    </dd>
                  </div>
                  <div className="flex flex-wrap justify-between gap-x-2 gap-y-1">
                    <dt className="text-white/60">Máxima</dt>
                    <dd className="break-words font-semibold tabular-nums">
                      {displayTemperature(day.maxTemperatureC, unit)}
                    </dd>
                  </div>
                </dl>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
