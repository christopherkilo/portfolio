export default function ToolkitLoading() {
  return (
    <div className="grid min-h-screen place-items-center bg-[#050505] text-text">
      <div className="text-center">
        <span className="mx-auto block size-8 animate-spin rounded-full border-2 border-white/10 border-t-primary" />
        <p className="mt-4 font-display text-lg font-semibold">Preparing Kilo Toolkit…</p>
        <p className="mt-1 text-sm text-muted">Loading modules</p>
      </div>
    </div>
  );
}
