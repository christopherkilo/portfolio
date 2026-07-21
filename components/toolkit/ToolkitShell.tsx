"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "framer-motion";
import {
  Bell,
  ChevronLeft,
  Command,
  Download,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Play,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { DEMO_DISCLOSURE, SCAN_STAGES, TOOLKIT_NAV } from "@/lib/toolkit/constants";
import { exportReport, saveReport } from "@/lib/toolkit/report-storage";
import type { DiagnosticReport } from "@/lib/toolkit/types";
import { ToolkitProvider, useToolkit } from "@/components/toolkit/ToolkitContext";
import { DemoModeBadge } from "@/components/toolkit/ToolkitUI";

export function ToolkitShell({ children }: { children: React.ReactNode }) {
  return (
    <ToolkitProvider>
      <ToolkitShellInner>{children}</ToolkitShellInner>
    </ToolkitProvider>
  );
}

function ToolkitShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const {
    system,
    memory,
    network,
    sessionLabel,
    settings,
    reports,
    providerError,
    reportStorageStatus,
    refreshReports,
    refreshAll,
  } = useToolkit();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanState, setScanState] = useState<"idle" | "running" | "cancelled" | "complete">("idle");
  const [stage, setStage] = useState(0);

  const commands = [
    ...TOOLKIT_NAV.map((item) => ({
      label: `Open ${item.label}`,
      hint: item.href,
      action: () => router.push(item.href),
    })),
    { label: "Run full diagnostic scan", hint: "Action", action: startScan },
    ...(reports[0] ? [{ label: "Export latest report", hint: "JSON", action: () => exportReport(reports[0]) }] : []),
    { label: "Open portfolio", hint: "Navigation", action: () => router.push("/") },
  ];

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((open) => !open);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    if (scanState !== "running") return;
    if (stage >= SCAN_STAGES.length) {
      const timer = window.setTimeout(() => {
        setScanState("complete");
        if (system && memory && network) {
          const report: DiagnosticReport = {
            id: crypto.randomUUID(),
            name: `Full Diagnostic · ${new Date().toLocaleDateString()}`,
            createdAt: new Date().toISOString(),
            overallStatus: system.health >= 85 ? "healthy" : "attention",
            systemFindings: system.findings,
            memoryFindings: memory.findings,
            networkFindings: network.findings,
            recommendations: [
              { id: "storage", title: "Recover primary-drive headroom", description: "Review large files before utilization reaches 85%.", priority: "medium", module: "system" },
              { id: "browser", title: "Review browser workload", description: "Close inactive tabs before considering a memory upgrade.", priority: "low", module: "memory" },
            ],
            demoMode: true,
          };
          saveReport(report);
          refreshReports();
        }
      }, 0);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(() => setStage((value) => value + 1), reducedMotion || !settings.animations ? 120 : 520);
    return () => window.clearTimeout(timer);
  }, [scanState, stage, system, memory, network, refreshReports, reducedMotion, settings.animations]);

  function startScan() {
    setStage(0);
    setScanState("running");
    setScannerOpen(true);
  }

  return (
    <MotionConfig reducedMotion={settings.animations ? "user" : "always"}>
    <div
      className="toolkit-root min-h-screen bg-[#050505] text-text"
      data-density={settings.density}
      data-animations={settings.animations ? "on" : "off"}
    >
      <a href="#toolkit-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-primary focus:px-3 focus:py-2 focus:text-black">
        Skip to toolkit content
      </a>
      <div className="pointer-events-none fixed inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.025)_1px,transparent_1px)] [background-size:44px_44px]" aria-hidden />

      <aside className={cn("fixed inset-y-0 left-0 z-40 hidden border-r border-white/7 bg-black/75 backdrop-blur-2xl transition-[width] duration-300 lg:flex lg:flex-col", collapsed ? "w-[78px]" : "w-64")}>
        <div className="flex h-20 items-center gap-3 border-b border-white/7 px-5">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.05] font-display text-sm font-bold">K</span>
          {!collapsed ? <div><p className="font-display font-semibold">KILO TOOLKIT</p><p className="font-mono text-[9px] uppercase tracking-wider text-muted">Diagnostics suite</p></div> : null}
        </div>
        <nav className="flex-1 space-y-1 p-3" aria-label="Toolkit navigation">
          {TOOLKIT_NAV.map((item) => {
            const active = item.href === "/toolkit" ? pathname === item.href : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} title={collapsed ? item.label : undefined} className={cn("group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition", active ? "bg-white/[0.08] text-text ring-1 ring-white/8" : "text-muted hover:bg-white/[0.045] hover:text-text")}>
                <Icon className={cn("size-4 shrink-0", active && "text-primary")} aria-hidden />
                {!collapsed ? <span>{item.label}</span> : <span className="sr-only">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/7 p-3">
          {!collapsed ? <div className="mb-3 rounded-xl bg-white/[0.03] p-3"><DemoModeBadge compact /><p className="mt-2 text-[11px] leading-relaxed text-muted">No system data is read from this device.</p></div> : null}
          <button type="button" onClick={() => setCollapsed((value) => !value)} className="flex w-full items-center justify-center rounded-xl p-2 text-muted hover:bg-white/5 hover:text-text" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
            {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
          </button>
        </div>
      </aside>

      <div className={cn("relative transition-[padding] duration-300", collapsed ? "lg:pl-[78px]" : "lg:pl-64")}>
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-white/7 bg-black/70 px-4 backdrop-blur-2xl sm:px-6">
          <button type="button" className="rounded-lg p-2 text-muted hover:bg-white/5 hover:text-text lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
            <Menu className="size-5" />
          </button>
          <button type="button" onClick={() => setCommandOpen(true)} className="flex min-w-0 max-w-md flex-1 items-center gap-3 rounded-xl border border-white/8 bg-white/[0.035] px-3 py-2 text-left text-sm text-muted hover:border-white/15 hover:text-text">
            <Search className="size-4" /><span className="truncate">Search modules and actions</span><kbd className="ml-auto hidden rounded border border-white/10 px-1.5 py-0.5 font-mono text-[10px] sm:block">⌘K</kbd>
          </button>
          <div className="hidden items-center gap-2 text-xs text-muted xl:flex"><span className="size-1.5 rounded-full bg-emerald-400" />{sessionLabel}</div>
          <DemoModeBadge compact />
          <button type="button" disabled={!settings.notifications} onClick={() => setNotificationsOpen((value) => !value)} className="relative rounded-lg p-2 text-muted hover:bg-white/5 hover:text-text disabled:cursor-not-allowed disabled:opacity-40" aria-label={settings.notifications ? "Open notifications" : "Notifications disabled in settings"}>
            <Bell className="size-4" />{settings.notifications ? <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-primary" /> : null}
          </button>
          <button type="button" disabled={!reports[0]} onClick={() => reports[0] && exportReport(reports[0])} className="hidden rounded-lg p-2 text-muted hover:bg-white/5 hover:text-text disabled:cursor-not-allowed disabled:opacity-35 sm:block" aria-label={reports[0] ? `Export latest report: ${reports[0].name}` : "No report available to export"} title="Export latest report">
            <Download className="size-4" />
          </button>
          <button type="button" onClick={startScan} className="hidden items-center gap-2 rounded-xl bg-white px-3.5 py-2 text-sm font-semibold text-black transition hover:bg-primary sm:flex">
            <Play className="size-4" />Run Full Scan
          </button>
        </header>

        {providerError ? (
          <div role="alert" className="mx-4 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-400/20 bg-rose-400/[0.06] px-4 py-3 text-sm text-rose-100 sm:mx-6 lg:mx-8">
            <span>{providerError}</span>
            <button type="button" onClick={() => void refreshAll()} className="rounded-lg border border-rose-300/20 px-3 py-1.5 font-medium hover:bg-rose-300/10">Retry providers</button>
          </div>
        ) : null}
        {reportStorageStatus === "malformed" ? (
          <div role="alert" className="mx-4 mt-4 rounded-xl border border-amber-300/20 bg-amber-300/[0.06] px-4 py-3 text-sm text-amber-100 sm:mx-6 lg:mx-8">
            Saved report data was malformed and could not be loaded. Clear saved reports in Settings to reset local storage safely.
          </div>
        ) : null}

        {notificationsOpen && settings.notifications ? (
          <aside className="fixed right-4 top-20 z-50 w-[min(360px,calc(100vw-2rem))] rounded-2xl border border-white/10 bg-[#0b0b0b]/95 p-4 shadow-2xl backdrop-blur-2xl" aria-label="Notifications">
            <div className="flex items-center justify-between"><h2 className="font-display font-semibold">Notifications</h2><button type="button" onClick={() => setNotificationsOpen(false)} aria-label="Close notifications"><X className="size-4" /></button></div>
            <div className="mt-4 space-y-3 text-sm"><p className="rounded-xl bg-white/[0.04] p-3 text-muted"><span className="block font-medium text-text">Storage check</span>Primary-drive utilization is above 70%.</p><p className="rounded-xl bg-white/[0.04] p-3 text-muted"><span className="block font-medium text-text">Demo provider ready</span>All three simulated diagnostic providers are available.</p></div>
          </aside>
        ) : null}

        <main id="toolkit-content" className="relative mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-8">{children}</main>
      </div>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileOpen(false)}>
            <motion.aside className="h-full w-[min(320px,86vw)] border-r border-white/10 bg-[#080808] p-4" initial={{ x: -330 }} animate={{ x: 0 }} exit={{ x: -330 }} onClick={(event) => event.stopPropagation()}>
              <div className="flex items-center justify-between p-2"><p className="font-display font-semibold">KILO TOOLKIT</p><button type="button" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X className="size-5" /></button></div>
              <nav className="mt-6 space-y-1">{TOOLKIT_NAV.map((item) => <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-muted hover:bg-white/5 hover:text-text"><item.icon className="size-4" />{item.label}</Link>)}</nav>
              <Link href="/" className="mt-8 flex items-center gap-2 px-3 text-sm text-muted hover:text-text"><ChevronLeft className="size-4" />Back to portfolio</Link>
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <CommandDialog open={commandOpen} onClose={() => setCommandOpen(false)} commands={commands} />
      <ScanDialog open={scannerOpen} onClose={() => setScannerOpen(false)} state={scanState} stage={stage} onStart={startScan} onCancel={() => setScanState("cancelled")} />
    </div>
    </MotionConfig>
  );
}

function useDialogFocus(open: boolean, onClose: () => void) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    previousFocus.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => {
      panelRef.current?.querySelector<HTMLElement>(
        "input, button, a[href], select, textarea, [tabindex]:not([tabindex='-1'])",
      )?.focus();
    }, 0);

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          "input, button:not([disabled]), a[href], select, textarea, [tabindex]:not([tabindex='-1'])",
        ),
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
      previousFocus.current?.focus();
    };
  }, [open]);

  return panelRef;
}

function CommandDialog({ open, onClose, commands }: { open: boolean; onClose: () => void; commands: { label: string; hint: string; action: () => void }[] }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const filtered = commands.filter((item) => item.label.toLowerCase().includes(query.toLowerCase()));
  const panelRef = useDialogFocus(open, close);

  function close() {
    setQuery("");
    setActive(0);
    onClose();
  }

  function runCommand(index: number) {
    const command = filtered[index];
    if (!command) return;
    command.action();
    close();
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div className="fixed inset-0 z-[90] flex items-start justify-center bg-black/70 px-4 pt-[12vh] backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close} role="dialog" aria-modal="true" aria-labelledby="toolkit-command-title">
          <motion.div ref={panelRef} className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#0b0b0b]" initial={{ y: -10, scale: .98 }} animate={{ y: 0, scale: 1 }} onClick={(event) => event.stopPropagation()}>
            <h2 id="toolkit-command-title" className="sr-only">Toolkit command palette</h2>
            <div className="flex items-center gap-3 border-b border-white/8 px-4 py-3">
              <Command className="size-4 text-muted" />
              <input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActive(0);
                }}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    setActive((index) => Math.min(index + 1, Math.max(filtered.length - 1, 0)));
                  } else if (event.key === "ArrowUp") {
                    event.preventDefault();
                    setActive((index) => Math.max(index - 1, 0));
                  } else if (event.key === "Enter") {
                    event.preventDefault();
                    runCommand(active);
                  }
                }}
                placeholder="Search toolkit…"
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
                role="combobox"
                aria-expanded="true"
                aria-controls="toolkit-command-results"
                aria-activedescendant={filtered[active] ? `toolkit-command-${active}` : undefined}
              />
            </div>
            <div id="toolkit-command-results" role="listbox" className="max-h-80 overflow-y-auto p-2">
              {filtered.length ? filtered.map((item, index) => (
                <button
                  type="button"
                  id={`toolkit-command-${index}`}
                  role="option"
                  aria-selected={index === active}
                  key={item.label}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => runCommand(index)}
                  className={cn("flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm", index === active ? "bg-white/[0.07] text-text" : "text-muted hover:bg-white/[0.05] hover:text-text")}
                >
                  <span className="flex-1">{item.label}</span><span className="text-xs text-muted">{item.hint}</span>
                </button>
              )) : <p className="p-6 text-center text-sm text-muted">No matching actions</p>}
            </div>
            <p className="border-t border-white/8 px-4 py-2 text-[11px] text-muted">↑↓ navigate · Enter select · Esc close</p>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function ScanDialog({ open, onClose, state, stage, onStart, onCancel }: { open: boolean; onClose: () => void; state: "idle" | "running" | "cancelled" | "complete"; stage: number; onStart: () => void; onCancel: () => void }) {
  const progress = Math.min(100, Math.round((stage / SCAN_STAGES.length) * 100));
  const panelRef = useDialogFocus(open, onClose);
  return (
    <AnimatePresence>{open ? <motion.div className="fixed inset-0 z-[95] grid place-items-center bg-black/75 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true" aria-labelledby="diagnostic-scan-title"><motion.div ref={panelRef} className="w-full max-w-xl rounded-3xl border border-white/10 bg-[#0b0b0b] p-6 shadow-2xl" initial={{ scale: .97, y: 10 }} animate={{ scale: 1, y: 0 }}><div className="flex items-start justify-between"><div><DemoModeBadge compact /><h2 id="diagnostic-scan-title" className="mt-3 font-display text-2xl font-semibold">Full diagnostic scan</h2><p className="mt-2 text-sm text-muted">{state === "complete" ? "Scan complete. A simulated report was saved." : state === "cancelled" ? "Scan cancelled. No report was created." : "Reviewing all simulated diagnostic providers."}</p></div><button type="button" onClick={onClose} aria-label="Close scan"><X className="size-5 text-muted" /></button></div><div className="mt-6 h-2 overflow-hidden rounded-full bg-white/[0.06]" role="progressbar" aria-label="Diagnostic scan progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={state === "complete" ? 100 : progress}><motion.div className="h-full bg-primary" animate={{ width: `${state === "complete" ? 100 : progress}%` }} /></div><p className="mt-2 text-right font-mono text-xs text-muted" aria-live="polite">{state === "complete" ? 100 : progress}%</p><ol className="mt-5 space-y-2">{SCAN_STAGES.map((item, index) => <li key={item.id} className={cn("flex items-center gap-3 rounded-xl px-3 py-2 text-sm", index === stage && state === "running" ? "bg-white/[0.05] text-text" : index < stage || state === "complete" ? "text-secondary" : "text-muted")}><span className={cn("size-2 rounded-full border border-white/20", (index < stage || state === "complete") && "border-primary bg-primary")} />{item.label}</li>)}</ol><p className="mt-5 rounded-xl border border-white/7 bg-white/[0.025] p-3 text-xs leading-relaxed text-muted">{DEMO_DISCLOSURE}</p><div className="mt-5 flex justify-end gap-3">{state === "running" ? <button type="button" onClick={onCancel} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-muted hover:text-text">Cancel scan</button> : <button type="button" onClick={onStart} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-primary"><RotateCcw className="size-4" />{state === "idle" ? "Start scan" : "Run again"}</button>}{state === "complete" ? <Link href="/toolkit/reports" onClick={onClose} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm"><Download className="size-4" />View report</Link> : null}</div></motion.div></motion.div> : null}</AnimatePresence>
  );
}
