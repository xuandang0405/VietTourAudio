export function LoadingState({ label = 'Dang tai...' }) {
  return (
    <div className="space-y-3 p-4">
      <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />
      <div className="h-24 animate-pulse rounded-xl bg-slate-200" />
      <div className="h-24 animate-pulse rounded-xl bg-slate-200" />
      <p className="text-center text-sm text-slate-500">{label}</p>
    </div>
  );
}
