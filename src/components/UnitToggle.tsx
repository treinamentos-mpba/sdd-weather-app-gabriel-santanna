import type { Unit } from '../types/weather';

interface UnitToggleProps {
  unit: Unit;
  onChange: (unit: Unit) => void;
}

const options: { unit: Unit; label: string; name: string }[] = [
  { unit: 'celsius', label: '°C', name: 'Celsius' },
  { unit: 'fahrenheit', label: '°F', name: 'Fahrenheit' },
];

export default function UnitToggle({ unit, onChange }: UnitToggleProps) {
  return (
    <div
      role="group"
      aria-label="Unidade de temperatura"
      className="inline-flex gap-1 rounded-lg border border-white/10 bg-white/5 p-1 backdrop-blur-md"
    >
      {options.map((option) => (
        <button
          key={option.unit}
          type="button"
          aria-label={option.name}
          aria-pressed={unit === option.unit}
          onClick={() => {
            if (unit !== option.unit) {
              onChange(option.unit);
            }
          }}
          className={`h-11 w-12 rounded-md font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400 ${
            unit === option.unit ? 'bg-accent-400 text-night-900' : 'text-white hover:bg-white/10'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
