import { useEffect, useReducer, useRef } from 'react';
import { getWeather, searchCities } from '../services/weatherService';
import type { City, WeatherData, WeatherService } from '../types/weather';

export type WeatherStatus = 'idle' | 'loading' | 'success' | 'error' | 'empty';

interface WeatherState {
  status: WeatherStatus;
  data: WeatherData | null;
  cities: City[];
  error: string | null;
  query: string;
  selectedCity: City | null;
}

type Operation = { kind: 'search'; query: string } | { kind: 'select'; city: City };

type WeatherAction =
  | { type: 'start'; operation: Operation }
  | { type: 'cities'; cities: City[] }
  | { type: 'success'; data: WeatherData }
  | { type: 'error'; error: string }
  | { type: 'reset' };

const initialState: WeatherState = {
  status: 'idle',
  data: null,
  cities: [],
  error: null,
  query: '',
  selectedCity: null,
};

const defaultService: WeatherService = { searchLocations: searchCities, getWeather };

function reducer(state: WeatherState, action: WeatherAction): WeatherState {
  switch (action.type) {
    case 'start':
      return {
        ...state,
        status: 'loading',
        data: null,
        error: null,
        query: action.operation.kind === 'search' ? action.operation.query : state.query,
        cities: action.operation.kind === 'search' ? [] : state.cities,
        selectedCity: action.operation.kind === 'select' ? action.operation.city : null,
      };
    case 'cities':
      return {
        ...state,
        cities: action.cities,
        selectedCity: action.cities[0] ?? null,
        status: action.cities.length > 0 ? 'loading' : 'empty',
      };
    case 'success':
      return { ...state, status: 'success', data: action.data, selectedCity: action.data.city };
    case 'error':
      return { ...state, status: 'error', error: action.error };
    case 'reset':
      return initialState;
  }
}

export function useWeather(service: WeatherService = defaultService) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const requestId = useRef(0);
  const lastOperation = useRef<Operation | null>(null);

  useEffect(
    () => () => {
      requestId.current += 1;
    },
    [],
  );

  async function run(operation: Operation): Promise<void> {
    const id = ++requestId.current;
    lastOperation.current = operation;
    dispatch({ type: 'start', operation });
    try {
      let city: City;
      if (operation.kind === 'search') {
        const cities = await service.searchLocations(operation.query);
        if (id !== requestId.current) return;
        dispatch({ type: 'cities', cities });
        if (cities.length === 0) return;
        city = cities[0];
      } else {
        city = operation.city;
      }

      const data = await service.getWeather(city);
      if (id === requestId.current) dispatch({ type: 'success', data });
    } catch (error) {
      if (id === requestId.current) {
        dispatch({
          type: 'error',
          error:
            error instanceof Error && error.message
              ? error.message
              : 'Não foi possível concluir a consulta. Tente novamente.',
        });
      }
    }
  }

  async function search(name: string): Promise<void> {
    const query = name.trim();
    if (!query) {
      requestId.current += 1;
      lastOperation.current = null;
      dispatch({ type: 'reset' });
      return;
    }
    await run({ kind: 'search', query });
  }

  async function selectCity(city: City): Promise<void> {
    await run({ kind: 'select', city });
  }

  async function retry(): Promise<void> {
    if (lastOperation.current) await run(lastOperation.current);
  }

  return { ...state, search, selectCity, retry };
}
