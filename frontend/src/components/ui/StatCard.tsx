export default function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-5">
      <div className="text-xs text-[var(--text-secondary)] mb-2">{label}</div>
      <div className="font-mono text-2xl text-[var(--text-primary)]">{value}</div>
    </div>
  );
}
