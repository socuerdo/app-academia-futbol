export default function ActivarJugadorLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-56 rounded bg-slate-200" />
      <div className="flex gap-4">
        <div className="h-10 w-40 rounded-lg bg-slate-200" />
        <div className="h-10 w-40 rounded-lg bg-slate-200" />
      </div>
      <div className="h-96 rounded-xl bg-slate-200" />
    </div>
  );
}
