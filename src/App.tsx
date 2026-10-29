import { Sun } from 'lucide-react';
import { useRef, useState } from 'react';
import CurrentWeather from './components/CurrentWeather';
import ForecastList from './components/ForecastList';
import SearchBar from './components/SearchBar';
import EmptyState from './components/states/EmptyState';
import ErrorState from './components/states/ErrorState';
import LoadingState from './components/states/LoadingState';
import UnitToggle from './components/UnitToggle';
import { useWeather } from './hooks/useWeather';
import type { Unit, WeatherService } from './types/weather';

interface AppProps {
  service?: WeatherService;
}

export default function App({ service }: AppProps) {
  const [unit, setUnit] = useState<Unit>('celsius');
  const contentRef = useRef<HTMLElement>(null);
  const { status, data, cities, error, selectedCity, search, selectCity, retry } =
    useWeather(service);
  const showCityOptions = status === 'success' && cities.length > 1;
  let announcement = '';
  if (status === 'empty') {
    announcement = 'Nenhuma cidade encontrada.';
  } else if (status === 'success' && data) {
    announcement = `Condições e previsão de ${data.city.name} carregadas.`;
  }

  return (
    <div className="min-h-screen bg-night-900 font-sans text-white">
      <a
        href="#weather-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-10 focus:rounded-md focus:bg-accent-400 focus:p-3 focus:text-night-900"
      >
        Ir para o conteúdo
      </a>
      <header className="border-b border-white/10 bg-white/5 backdrop-blur-md">
        <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-5 sm:px-6 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:gap-8">
          <h1 className="flex min-w-0 items-center gap-2 text-xl font-semibold">
            <Sun aria-hidden="true" focusable="false" className="h-5 w-5 shrink-0 text-sun" />
            WeatherView
          </h1>
          <div className="order-last col-span-2 min-w-0 lg:order-none lg:col-span-1">
            <SearchBar onSearch={search} />
          </div>
          <UnitToggle unit={unit} onChange={setUnit} />
        </div>
      </header>

      <main
        ref={contentRef}
        id="weather-content"
        tabIndex={-1}
        className="mx-auto min-h-96 max-w-6xl px-4 py-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-400 sm:px-6"
      >
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {announcement}
        </div>
        {status === 'idle' && (
          <section aria-labelledby="idle-heading" className="space-y-2 py-8">
            <h2 id="idle-heading" className="text-xl font-semibold">
              Consultar clima
            </h2>
            <p className="text-white/70">Nenhuma cidade selecionada.</p>
          </section>
        )}

        {showCityOptions && (
          <section aria-labelledby="city-selection-heading" className="space-y-5 py-8">
            <h2 id="city-selection-heading" className="text-xl font-semibold">
              Cidades encontradas
            </h2>
            <ul className="divide-y divide-white/10 border-y border-white/10">
              {cities.map((city) => (
                <li key={`${city.latitude},${city.longitude}`}>
                  <button
                    type="button"
                    onClick={() => {
                      selectCity(city);
                      contentRef.current?.focus();
                    }}
                    className="min-h-14 w-full break-words rounded-sm px-3 py-4 text-left hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-400"
                  >
                    <span className="font-semibold">{city.name}</span>
                    <span className="ml-2 text-white/70">
                      {[city.region, city.country].filter(Boolean).join(', ')}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {status === 'loading' && <LoadingState />}
        {status === 'empty' && <EmptyState />}
        {status === 'error' && (
          <>
            {selectedCity && <p className="break-words font-semibold">{selectedCity.name}</p>}
            <ErrorState
              message={error ?? 'Não foi possível concluir a consulta. Tente novamente.'}
              onRetry={() => {
                retry();
                contentRef.current?.focus();
              }}
            />
          </>
        )}
        {status === 'success' && data && (
          <>
            <CurrentWeather city={data.city} current={data.current} unit={unit} />
            <ForecastList days={data.forecastDays} unit={unit} />
          </>
        )}
      </main>
    </div>
  );
}
