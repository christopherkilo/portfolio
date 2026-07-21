export default function ToolkitLoading() {
  return (
    <div className="grid min-h-[60vh] place-items-center" role="status" aria-live="polite">
      <div className="text-center">
        <span className="mx-auto block size-9 animate-spin rounded-full border-2 border-white/10 border-t-primary" aria-hidden />
        <p className="mt-4 text-sm text-muted">Preparing Kilo Toolkit…</p>
      </div>
    </div>
  );
}
