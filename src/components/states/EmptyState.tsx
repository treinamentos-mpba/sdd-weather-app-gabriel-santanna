export default function EmptyState() {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center gap-2 px-4 py-8 text-center text-white">
      <h2 className="break-words text-xl font-semibold">Nenhuma cidade encontrada</h2>
      <p className="break-words text-white/70">Confira a grafia ou tente buscar outra cidade.</p>
    </div>
  );
}
