export default function LoadingState() {
  return (
    <div
      role="status"
      className="flex min-h-48 flex-col items-center justify-center gap-4 px-4 py-8 text-center text-white"
    >
      <span
        aria-hidden="true"
        className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-accent-400 motion-reduce:animate-none"
      />
      <p className="break-words text-white/70">Carregando dados meteorológicos...</p>
    </div>
  );
}
