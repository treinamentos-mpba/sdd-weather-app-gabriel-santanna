import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  type LucideIcon,
  Sun,
  Thermometer,
} from 'lucide-react';

interface WeatherInfo {
  label: string;
  icon: string;
}

const WEATHER_CODE_MAP: Record<number, WeatherInfo> = {
  0: { label: 'Céu limpo', icon: '☀️' },
  1: { label: 'Predomínio de sol', icon: '🌤️' },
  2: { label: 'Parcialmente nublado', icon: '⛅' },
  3: { label: 'Nublado', icon: '☁️' },
  45: { label: 'Névoa', icon: '🌫️' },
  48: { label: 'Névoa com gelo', icon: '🌫️' },
  51: { label: 'Garoa leve', icon: '🌦️' },
  53: { label: 'Garoa moderada', icon: '🌦️' },
  55: { label: 'Garoa intensa', icon: '🌧️' },
  56: { label: 'Garoa congelante', icon: '🌧️' },
  57: { label: 'Garoa congelante intensa', icon: '🌧️' },
  61: { label: 'Chuva fraca', icon: '🌦️' },
  63: { label: 'Chuva moderada', icon: '🌧️' },
  65: { label: 'Chuva forte', icon: '🌧️' },
  66: { label: 'Chuva congelante', icon: '🌧️' },
  67: { label: 'Chuva congelante forte', icon: '🌧️' },
  71: { label: 'Neve fraca', icon: '🌨️' },
  73: { label: 'Neve moderada', icon: '🌨️' },
  75: { label: 'Neve forte', icon: '❄️' },
  77: { label: 'Grãos de neve', icon: '🌨️' },
  80: { label: 'Pancadas de chuva fracas', icon: '🌦️' },
  81: { label: 'Pancadas de chuva moderadas', icon: '🌧️' },
  82: { label: 'Pancadas de chuva fortes', icon: '⛈️' },
  85: { label: 'Pancadas de neve fracas', icon: '🌨️' },
  86: { label: 'Pancadas de neve fortes', icon: '❄️' },
  95: { label: 'Trovoadas', icon: '⛈️' },
  96: { label: 'Trovoadas com granizo', icon: '⛈️' },
  99: { label: 'Trovoadas com granizo forte', icon: '⛈️' },
};

const UNKNOWN: WeatherInfo = { label: 'Condição indisponível', icon: '🌡️' };

const ICON_GROUPS: { codes: number[]; icon: LucideIcon }[] = [
  { codes: [0], icon: Sun },
  { codes: [1, 2], icon: CloudSun },
  { codes: [3], icon: Cloud },
  { codes: [45, 48], icon: CloudFog },
  { codes: [51, 53, 55], icon: CloudDrizzle },
  { codes: [56, 57, 61, 63, 65, 66, 67, 80, 81, 82], icon: CloudRain },
  { codes: [71, 73, 75, 77, 85, 86], icon: CloudSnow },
  { codes: [95, 96, 99], icon: CloudLightning },
];

export function getWeatherIconComponent(code: number | null): LucideIcon {
  return (
    ICON_GROUPS.find((group) => code !== null && group.codes.includes(code))?.icon ?? Thermometer
  );
}

export function getWeatherInfo(code: number | null): WeatherInfo {
  return code === null ? UNKNOWN : (WEATHER_CODE_MAP[code] ?? UNKNOWN);
}

export function getWeatherLabel(code: number | null): string {
  return getWeatherInfo(code).label;
}

export function getWeatherIcon(code: number | null): string {
  return getWeatherInfo(code).icon;
}
