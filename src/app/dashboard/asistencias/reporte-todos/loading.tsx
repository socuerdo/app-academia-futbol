export default function ReporteTodosLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-56 rounded bg-slate-200" />
      <div className="flex flex-wrap gap-4">
        <div className="h-10 w-32 rounded-lg bg-slate-200" />
        <div className="h-10 w-32 rounded-lg bg-slate-200" />
        <div className="h-10 w-28 rounded-lg bg-slate-200" />
      </div>
      <div className="h-80 rounded-xl bg-slate-200" />
    </div>
  );
}
