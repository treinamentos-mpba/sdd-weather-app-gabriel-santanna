interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center gap-4 px-4 py-8 text-center text-white">
      <div role="alert" className="min-w-0 space-y-2">
        <h2 className="break-words text-xl font-semibold">Não foi possível carregar o clima</h2>
        <p className="break-words text-white/70">{message}</p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="min-h-11 max-w-full rounded-md bg-accent-400 px-4 py-2 font-semibold text-night-900 hover:bg-accent-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
      >
        Tentar novamente
      </button>
    </div>
  );
}
