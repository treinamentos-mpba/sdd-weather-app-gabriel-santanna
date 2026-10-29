import { type FormEvent, useId, useRef, useState } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [invalid, setInvalid] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const errorId = useId();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      setInvalid(true);
      inputRef.current?.focus();
      return;
    }
    setInvalid(false);
    onSearch(trimmed);
  }

  return (
    <form role="search" aria-label="Busca de cidade" onSubmit={handleSubmit}>
      <label htmlFor={inputId} className="sr-only">
        Buscar cidade
      </label>
      <div className="flex gap-2">
        <input
          ref={inputRef}
          id={inputId}
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setInvalid(false);
          }}
          placeholder="Buscar cidade"
          autoComplete="off"
          aria-invalid={invalid}
          aria-describedby={invalid ? errorId : undefined}
          className="h-11 min-w-0 flex-1 rounded-md border border-white/50 bg-night-900/70 px-3 text-white placeholder:text-white/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-400"
        />
        <button
          type="submit"
          className="h-11 w-20 shrink-0 rounded-md bg-accent-400 font-semibold text-night-900 hover:bg-accent-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
        >
          Buscar
        </button>
      </div>
      {invalid && (
        <p id={errorId} role="alert" className="mt-2 text-sm text-sun">
          Digite o nome de uma cidade.
        </p>
      )}
    </form>
  );
}
