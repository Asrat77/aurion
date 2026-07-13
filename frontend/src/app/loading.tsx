export default function Loading() {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center gap-4">
      <span className="w-10 h-10 border-2 border-[var(--gold)] rounded-full flex items-center justify-center text-sm font-bold font-[family-name:var(--font-mono)] text-[var(--gold)] animate-pulse">
        A
      </span>
      <div className="skeleton w-32 h-2 rounded-full" />
    </div>
  );
}
