"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Download,
  ExternalLink,
  LifeBuoy,
  RotateCcw,
  SkipForward,
  X,
} from "lucide-react";
import { useToolkit } from "@/components/toolkit/ToolkitContext";
import { useGuidedTroubleshooting } from "@/components/toolkit/GuidedTroubleshootingProvider";
import { LoadingPanel, ModuleHeader, StatusBadge } from "@/components/toolkit/ToolkitUI";
import { DEMO_DISCLOSURE } from "@/lib/toolkit/constants";
import {
  DIAGNOSTIC_CHECKS,
  buildDiagnosticReading,
  fillConclusion,
  resolveBranchFindingId,
  resolveBranchNext,
  statusLabel,
} from "@/lib/toolkit/guided/engine";
import { buildGuideReport } from "@/lib/toolkit/guided/report";
import type {
  CheckStatus,
  RecommendedAction,
  TroubleshootingFinding,
  TroubleshootingStep,
  TroubleshootingWorkflow,
} from "@/lib/toolkit/guided/types";
import { getWorkflow } from "@/lib/toolkit/guided/workflows";
import { exportReport, saveReport } from "@/lib/toolkit/report-storage";
import type { SimulationProfileId } from "@/lib/toolkit/scenarios";
import { cn } from "@/lib/utils";

function statusTone(status: CheckStatus) {
  switch (status) {
    case "normal":
      return "text-emerald-300 border-emerald-400/25 bg-emerald-400/10";
    case "monitor":
      return "text-sky-200 border-sky-400/25 bg-sky-400/10";
    case "attention":
      return "text-amber-200 border-amber-400/25 bg-amber-400/10";
    case "high":
      return "text-rose-200 border-rose-400/30 bg-rose-400/10";
  }
}

function classLabel(value: RecommendedAction["classification"]) {
  switch (value) {
    case "try-now":
      return "Try Now";
    case "monitor":
      return "Monitor";
    case "requires-restart":
      return "Requires Restart";
    case "professional-support":
      return "Consider Professional Support";
  }
}

function labelForScenario(id: SimulationProfileId) {
  const labels: Record<SimulationProfileId, string> = {
    healthy: "Healthy System",
    "heavy-memory": "Heavy Memory Usage",
    "network-instability": "Network Instability",
    "low-disk": "Low Disk Space",
    developer: "Developer Workstation",
    aging: "Aging Workstation",
    custom: "Custom",
  };
  return labels[id];
}

export function GuidedTroubleshootingApp() {
  return (
    <Suspense fallback={<LoadingPanel label="Preparing guided troubleshooting…" />}>
      <GuidedTroubleshootingInner />
    </Suspense>
  );
}

function GuidedTroubleshootingInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    system,
    memory,
    network,
    liveMetrics,
    healthScore,
    loading,
    activeProfileId,
    profileLabel,
    setActiveProfile,
    applyGuideRemediation,
    refreshReports,
    settings,
  } = useToolkit();
  const { session, dispatch, workflows, confirmDiscard } = useGuidedTroubleshooting();
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionFlash, setActionFlash] = useState<string | null>(null);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const queryHandled = useRef(false);

  const reading = useMemo(() => {
    if (!system || !memory || !network) return null;
    const startupOverrides = session.simulatedActions
      .filter((item) => item.kind === "disable-startup-item")
      .map((_, index) => ({
        id: ["cloud-sync", "chat", "updater"][index] ?? "music",
        enabled: false,
      }));
    return buildDiagnosticReading({
      system,
      memory,
      network,
      liveMetrics,
      healthScore,
      profileId: activeProfileId,
      profileLabel,
      startupOverrides,
    });
  }, [
    system,
    memory,
    network,
    liveMetrics,
    healthScore,
    activeProfileId,
    profileLabel,
    session.simulatedActions,
  ]);

  const workflow = session.workflowId ? getWorkflow(session.workflowId) : null;
  const step: TroubleshootingStep | null =
    workflow && session.currentStepId
      ? (workflow.steps.find((item) => item.id === session.currentStepId) ?? null)
      : null;

  const progress = useMemo(() => {
    if (!workflow) return { current: 0, total: 0, label: "Not started" };
    const total = workflow.steps.length;
    const currentIndex = Math.max(
      0,
      workflow.steps.findIndex((item) => item.id === session.currentStepId),
    );
    return {
      current: session.status === "completed" ? total : currentIndex + 1,
      total,
      label: `Step ${session.status === "completed" ? total : currentIndex + 1} of ${total}`,
    };
  }, [workflow, session.currentStepId, session.status]);

  useEffect(() => {
    if (queryHandled.current) return;
    const startId = searchParams.get("start");
    const resume = searchParams.get("resume");
    if (resume === "1" && session.workflowId) {
      queryHandled.current = true;
      if (session.currentStepId) {
        dispatch({ type: "HYDRATE", session: { ...session, status: "active" } });
      } else if (session.scenarioDecision === "pending") {
        dispatch({ type: "HYDRATE", session: { ...session, status: "scenario-prompt" } });
      }
      router.replace("/toolkit/troubleshooting");
      return;
    }
    if (startId && getWorkflow(startId)) {
      queryHandled.current = true;
      dispatch({
        type: "SELECT_WORKFLOW",
        workflowId: startId,
        recommendedScenario: getWorkflow(startId)!.recommendedScenario,
      });
      router.replace("/toolkit/troubleshooting");
    }
  }, [searchParams, session, dispatch, router]);

  useEffect(() => {
    if (!step && session.status !== "completed") return;
    const timer = window.setTimeout(() => stepHeadingRef.current?.focus(), settings.animations ? 40 : 0);
    return () => window.clearTimeout(timer);
  }, [session.currentStepId, session.status, step, settings.animations]);

  useEffect(() => {
    if (step?.type === "summary" && session.status === "active") {
      dispatch({ type: "COMPLETE", at: new Date().toISOString() });
    }
  }, [step, session.status, dispatch]);

  if (loading || !system || !memory || !network || !reading) {
    return <LoadingPanel label="Preparing guided troubleshooting…" />;
  }

  function beginWorkflow(workflowId: string) {
    const next = getWorkflow(workflowId);
    if (!next) return;
    if (
      session.workflowId &&
      session.workflowId !== workflowId &&
      !confirmDiscard("Start a different guide? Current progress will be discarded.")
    ) {
      return;
    }
    dispatch({
      type: "SELECT_WORKFLOW",
      workflowId,
      recommendedScenario: next.recommendedScenario,
    });
  }

  function decideScenario(decision: "loaded-recommended" | "kept-current") {
    if (!workflow) return;
    if (decision === "loaded-recommended") {
      setActiveProfile(workflow.recommendedScenario);
      dispatch({
        type: "DECIDE_SCENARIO",
        decision,
        notice: `Loaded recommended scenario: ${labelForScenario(workflow.recommendedScenario)}. Metrics will animate to the new environment while this guide continues.`,
      });
    } else {
      dispatch({
        type: "DECIDE_SCENARIO",
        decision,
        notice: `Continuing with your current scenario (${profileLabel}).`,
      });
    }
    dispatch({ type: "START_WORKFLOW", firstStepId: "intro" });
  }

  function makeFinding(
    findingId: string,
    stepId: string,
    observedValue: string,
  ): TroubleshootingFinding | undefined {
    if (!workflow) return undefined;
    const template = workflow.findings[findingId];
    if (!template) return undefined;
    return {
      id: findingId,
      stepId,
      observedValue,
      category: template.category,
      status: template.status,
      explanation: template.explanation,
      relatedModule: template.relatedModule,
      confidence: template.confidence,
      nextAction: template.nextAction,
    };
  }

  function advanceFromCheck(current: Extract<TroubleshootingStep, { type: "diagnostic-check" }>) {
    if (!reading) return;
    const check = DIAGNOSTIC_CHECKS[current.checkId];
    const result = check.read(reading);
    const next = resolveBranchNext(current, reading);
    const findingId = resolveBranchFindingId(current, reading);
    const finding = findingId ? makeFinding(findingId, current.id, result.current) : undefined;
    dispatch({
      type: "ADVANCE",
      fromStepId: current.id,
      nextStepId: next,
      finding,
    });
  }

  function runRemediation(
    kind: NonNullable<RecommendedAction["remediation"]>,
    fromStepId: string,
    nextStepId: string,
  ) {
    setActionBusy(true);
    const result = applyGuideRemediation(kind);
    window.setTimeout(() => {
      if (result) {
        dispatch({ type: "RECORD_ACTION", action: result.record });
        setActionFlash(
          `${result.record.label}: ${Object.entries(result.record.before)
            .map(([key, value]) => `${key} ${value}`)
            .join(", ")} → ${Object.entries(result.record.after)
            .map(([key, value]) => `${key} ${value}`)
            .join(", ")}`,
        );
      }
      dispatch({ type: "ADVANCE", fromStepId, nextStepId });
      setActionBusy(false);
    }, settings.animations ? 650 : 120);
  }

  function exportSummary(format: "json" | "txt" | "pdf") {
    if (!reading) return;
    const report = buildGuideReport({ session, reading, healthScore });
    if (!report) return;
    saveReport(report);
    refreshReports();
    exportReport(report, format);
    setExportNotice(`Exported ${format.toUpperCase()} troubleshooting summary to Reports.`);
  }

  const showHome = session.status === "home" || session.status === "idle";
  const canResume =
    showHome &&
    Boolean(session.workflowId) &&
    (Boolean(session.currentStepId) || session.scenarioDecision === "pending");

  return (
    <div className="space-y-6">
      <ModuleHeader
        eyebrow="Guided Troubleshooting"
        title="Diagnostic walkthroughs"
        description="Choose a common issue and follow a simulated diagnostic workflow. Leave anytime and return to ordinary Toolkit modules."
        action={
          <div className="flex flex-wrap gap-2">
            {session.status === "active" || session.status === "completed" ? (
              <button
                type="button"
                onClick={() => dispatch({ type: "EXIT" })}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-muted hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <X className="size-4" />
                Exit Guide
              </button>
            ) : null}
            <Link
              href="/toolkit"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-muted hover:text-text"
            >
              Dashboard
            </Link>
          </div>
        }
      />

      <div aria-live="polite" className="sr-only">
        {session.scenarioNotice ?? actionFlash ?? exportNotice ?? progress.label}
      </div>

      {showHome ? (
        <>
          {canResume ? (
            <ResumeBanner
              title={getWorkflow(session.workflowId!)?.title ?? "Current guide"}
              onResume={() => {
                if (session.currentStepId) {
                  dispatch({ type: "HYDRATE", session: { ...session, status: "active" } });
                } else {
                  dispatch({ type: "HYDRATE", session: { ...session, status: "scenario-prompt" } });
                }
              }}
              onRestart={() => {
                if (confirmDiscard("Restart this guide from the beginning?")) {
                  dispatch({ type: "RESTART" });
                }
              }}
            />
          ) : null}
          <HomePanel workflows={workflows} onStart={beginWorkflow} />
        </>
      ) : null}

      {session.status === "scenario-prompt" && workflow ? (
        <ScenarioPrompt
          workflowTitle={workflow.title}
          rationale={workflow.scenarioRationale}
          recommended={workflow.recommendedScenario}
          currentLabel={profileLabel}
          onLoadRecommended={() => decideScenario("loaded-recommended")}
          onKeepCurrent={() => decideScenario("kept-current")}
          onCancel={() => dispatch({ type: "EXIT" })}
        />
      ) : null}

      {(session.status === "active" || session.status === "completed") && workflow ? (
        <section className="rounded-3xl border border-white/8 bg-white/[0.035] p-4 sm:p-6">
          <ProgressHeader
            workflowTitle={workflow.title}
            progress={progress}
            completed={session.completedStepIds.length}
            skipped={session.skippedStepIds.length}
          />

          {session.scenarioNotice ? (
            <p className="mt-4 rounded-xl border border-sky-400/20 bg-sky-400/[0.08] px-4 py-3 text-sm text-sky-100">
              {session.scenarioNotice}
            </p>
          ) : null}
          {actionFlash ? (
            <p className="mt-3 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.08] px-4 py-3 text-sm text-emerald-100">
              {actionFlash}
            </p>
          ) : null}

          {session.status === "completed" || step?.type === "summary" ? (
            <SummaryPanel
              headingRef={stepHeadingRef}
              workflowTitle={workflow.title}
              reading={reading}
              session={session}
              conclusion={fillConclusion(
                workflow.steps.find((item) => item.type === "summary")?.conclusionTemplate ??
                  "Session complete.",
                reading,
                session.findings.map((item) => item.category),
              )}
              actions={session.recommendedActionIds
                .map((id) => workflow.actions[id])
                .filter((item): item is RecommendedAction => Boolean(item))}
              onExport={exportSummary}
              onRestart={() => {
                if (confirmDiscard("Restart this guide?")) dispatch({ type: "RESTART" });
              }}
              onDifferent={() => {
                if (confirmDiscard("Start a different guide?")) dispatch({ type: "CLEAR" });
              }}
              onExit={() => dispatch({ type: "EXIT" })}
            />
          ) : step ? (
            <StepBody
              step={step}
              workflow={workflow}
              reading={reading}
              session={session}
              actionBusy={actionBusy}
              headingRef={stepHeadingRef}
              onContinueCheck={() => {
                if (step.type === "diagnostic-check") advanceFromCheck(step);
              }}
              onContinueSimple={(next, actionIds) =>
                dispatch({
                  type: "ADVANCE",
                  fromStepId: step.id,
                  nextStepId: next,
                  actionIds,
                })
              }
              onAnswer={(optionId, next) =>
                dispatch({ type: "ANSWER", stepId: step.id, optionId, nextStepId: next })
              }
              onSkip={(next) => dispatch({ type: "SKIP", fromStepId: step.id, nextStepId: next })}
              onBack={() => dispatch({ type: "BACK" })}
              onAction={(kind, next) => runRemediation(kind, step.id, next)}
              onMarkReviewed={(module) => dispatch({ type: "MARK_MODULE_REVIEWED", module })}
            />
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

function HomePanel({
  workflows,
  onStart,
}: {
  workflows: TroubleshootingWorkflow[];
  onStart: (id: string) => void;
}) {
  return (
    <section className="space-y-5">
      <article className="rounded-3xl border border-white/8 bg-white/[0.035] p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <LifeBuoy className="mt-1 size-6 shrink-0 text-secondary" aria-hidden />
          <div>
            <h2 className="font-display text-xl font-semibold sm:text-2xl">
              Choose a common issue and Kilo Toolkit will guide you through a simulated diagnostic
              workflow.
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">
              This is a portfolio demonstration. Diagnostic results are simulated and the guide does
              not make changes to your real computer.
            </p>
          </div>
        </div>
      </article>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {workflows.map((item) => (
          <article
            key={item.id}
            className="flex flex-col rounded-2xl border border-white/8 bg-white/[0.03] p-5"
          >
            <h3 className="font-display text-lg font-semibold">{item.title}</h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{item.shortDescription}</p>
            <p className="mt-3 text-xs text-secondary">
              Recommended scenario: {labelForScenario(item.recommendedScenario)}
            </p>
            <button
              type="button"
              onClick={() => onStart(item.id)}
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Start guide <ArrowRight className="size-4" />
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function ResumeBanner({
  title,
  onResume,
  onRestart,
}: {
  title: string;
  onResume: () => void;
  onRestart: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted">
        Resume <strong className="text-text">{title}</strong> from this browser session?
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onResume}
          className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-black"
        >
          Resume Current Guide
        </button>
        <button
          type="button"
          onClick={onRestart}
          className="rounded-xl border border-white/10 px-3 py-2 text-sm text-muted hover:text-text"
        >
          Restart Guide
        </button>
      </div>
    </div>
  );
}

function ScenarioPrompt({
  workflowTitle,
  rationale,
  recommended,
  currentLabel,
  onLoadRecommended,
  onKeepCurrent,
  onCancel,
}: {
  workflowTitle: string;
  rationale: string;
  recommended: SimulationProfileId;
  currentLabel: string;
  onLoadRecommended: () => void;
  onKeepCurrent: () => void;
  onCancel: () => void;
}) {
  return (
    <section
      className="rounded-3xl border border-white/8 bg-white/[0.035] p-5 sm:p-6"
      aria-labelledby="scenario-prompt-title"
    >
      <h2 id="scenario-prompt-title" className="font-display text-2xl font-semibold">
        Scenario for {workflowTitle}
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-muted">{rationale}</p>
      <p className="mt-4 text-sm text-secondary">
        Recommended scenario: <strong className="text-text">{labelForScenario(recommended)}</strong>
      </p>
      <p className="mt-1 text-sm text-muted">
        Current scenario: <strong className="text-text">{currentLabel}</strong>
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          onClick={onLoadRecommended}
          className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black hover:bg-primary"
        >
          Load Recommended Scenario
        </button>
        <button
          type="button"
          onClick={onKeepCurrent}
          className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-muted hover:text-text"
        >
          Continue With Current Scenario
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-transparent px-4 py-2.5 text-sm text-muted hover:text-text"
        >
          Cancel
        </button>
      </div>
    </section>
  );
}

function ProgressHeader({
  workflowTitle,
  progress,
  completed,
  skipped,
}: {
  workflowTitle: string;
  progress: { current: number; total: number; label: string };
  completed: number;
  skipped: number;
}) {
  const percent = Math.round((progress.current / Math.max(progress.total, 1)) * 100);
  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">{workflowTitle}</p>
          <p className="mt-1 text-sm text-secondary">{progress.label}</p>
        </div>
        <p className="text-xs text-muted">
          {completed} completed · {skipped} skipped
        </p>
      </div>
      <div
        className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.06]"
        role="progressbar"
        aria-label={`Guided troubleshooting progress: ${progress.label}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
      >
        <div className="h-full bg-primary transition-[width] duration-500" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function StepBody({
  step,
  workflow,
  reading,
  session,
  actionBusy,
  headingRef,
  onContinueCheck,
  onContinueSimple,
  onAnswer,
  onSkip,
  onBack,
  onAction,
  onMarkReviewed,
}: {
  step: TroubleshootingStep;
  workflow: TroubleshootingWorkflow;
  reading: NonNullable<ReturnType<typeof buildDiagnosticReading>>;
  session: ReturnType<typeof useGuidedTroubleshooting>["session"];
  actionBusy: boolean;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  onContinueCheck: () => void;
  onContinueSimple: (next: string, actionIds?: string[]) => void;
  onAnswer: (optionId: string, next: string) => void;
  onSkip: (next: string) => void;
  onBack: () => void;
  onAction: (kind: NonNullable<RecommendedAction["remediation"]>, next: string) => void;
  onMarkReviewed: (module: "system" | "memory" | "network" | "overview") => void;
}) {
  const canSkip =
    (step.type === "diagnostic-check" || step.type === "module-link" || step.type === "action") &&
    "skippable" in step &&
    step.skippable;

  return (
    <div className="mt-6 space-y-5">
      <h2 ref={headingRef} tabIndex={-1} className="font-display text-2xl font-semibold outline-none">
        {step.title}
      </h2>

      {step.type === "introduction" || step.type === "finding" || step.type === "confirmation" ? (
        <p className="max-w-3xl text-sm leading-relaxed text-muted">{step.body}</p>
      ) : null}

      {step.type === "question" ? (
        <div className="space-y-3">
          <p className="text-sm text-muted">{step.prompt}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {step.options.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => onAnswer(option.id, option.next)}
                className="rounded-xl border border-white/10 px-4 py-3 text-left text-sm text-muted transition hover:border-white/20 hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {step.type === "diagnostic-check" ? <DiagnosticCheckCard step={step} reading={reading} /> : null}

      {step.type === "module-link" ? (
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-muted">{step.body}</p>
          <Link
            href={step.href}
            onClick={() => onMarkReviewed(step.module)}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-text hover:border-primary/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {step.linkLabel} <ExternalLink className="size-4" />
          </Link>
          {session.reviewedModules.includes(step.module) ? (
            <p className="inline-flex items-center gap-2 text-sm text-emerald-300">
              <CheckCircle2 className="size-4" /> Related module marked as reviewed
            </p>
          ) : (
            <p className="text-xs text-muted">
              Open the module, then return here — your guide progress is preserved.
            </p>
          )}
        </div>
      ) : null}

      {step.type === "recommendation" ? (
        <div className="space-y-4">
          <p className="text-sm text-muted">{step.body}</p>
          <ul className="space-y-3">
            {step.actionIds.map((id) => {
              const action = workflow.actions[id];
              if (!action) return null;
              return (
                <li key={id} className="rounded-xl border border-white/8 bg-black/20 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-text">{action.title}</p>
                    <span className="rounded-full border border-white/10 px-2 py-0.5 text-[11px] text-muted">
                      {classLabel(action.classification)}
                    </span>
                    {action.simulated ? (
                      <span className="rounded-full border border-primary/30 px-2 py-0.5 text-[11px] text-primary">
                        Simulated
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-muted">{action.why}</p>
                  {action.caution ? (
                    <p className="mt-2 text-xs text-amber-200/90">{action.caution}</p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {step.type === "action" ? (
        <div className="space-y-4">
          <p className="text-sm text-muted">{step.body}</p>
          <button
            type="button"
            disabled={actionBusy}
            onClick={() => onAction(step.remediation, step.next)}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black hover:bg-primary disabled:opacity-50"
          >
            {actionBusy ? "Running simulation…" : step.actionLabel}
          </button>
          <p className="text-xs text-muted">Labeled simulated — no real system changes occur.</p>
        </div>
      ) : null}

      {step.type === "finding" && step.id === "categories" ? (
        <ul className="grid gap-2 sm:grid-cols-2">
          {reading.storageCategories.map((item) => (
            <li key={item.label} className="rounded-xl border border-white/8 px-3 py-2 text-sm text-muted">
              <span className="text-text">{item.label}</span>: ~{item.gb} GB
            </li>
          ))}
        </ul>
      ) : null}

      {step.type === "finding" && step.id === "list-startup" ? (
        <ul className="space-y-2">
          {reading.startupItems.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between rounded-xl border border-white/8 px-3 py-2 text-sm"
            >
              <span>
                {item.name} <span className="text-muted">({item.impact} impact)</span>
              </span>
              <StatusBadge status={item.enabled ? "attention" : "healthy"} />
            </li>
          ))}
        </ul>
      ) : null}

      <div className="flex flex-col gap-3 border-t border-white/8 pt-5 sm:flex-row sm:flex-wrap sm:items-center">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-muted hover:text-text"
        >
          <ArrowLeft className="size-4" /> Back
        </button>

        {step.type === "diagnostic-check" ? (
          <button
            type="button"
            onClick={onContinueCheck}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black hover:bg-primary"
          >
            Continue <ArrowRight className="size-4" />
          </button>
        ) : null}

        {step.type === "introduction" ||
        step.type === "finding" ||
        step.type === "confirmation" ||
        step.type === "module-link" ||
        step.type === "recommendation" ? (
          <button
            type="button"
            onClick={() => {
              if (step.type === "recommendation") {
                onContinueSimple(step.next, step.actionIds);
                return;
              }
              onContinueSimple(step.next);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black hover:bg-primary"
          >
            {step.type === "recommendation" ? "View summary" : "Continue"} <ArrowRight className="size-4" />
          </button>
        ) : null}

        {canSkip ? (
          <button
            type="button"
            onClick={() => {
              const next =
                step.type === "diagnostic-check"
                  ? step.defaultNext
                  : "next" in step
                    ? step.next
                    : null;
              if (next) onSkip(next);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm text-muted hover:text-text"
          >
            <SkipForward className="size-4" /> Skip
          </button>
        ) : null}
      </div>
    </div>
  );
}

function DiagnosticCheckCard({
  step,
  reading,
}: {
  step: Extract<TroubleshootingStep, { type: "diagnostic-check" }>;
  reading: NonNullable<ReturnType<typeof buildDiagnosticReading>>;
}) {
  const check = DIAGNOSTIC_CHECKS[step.checkId];
  const result = check.read(reading);
  return (
    <article className="rounded-2xl border border-white/8 bg-black/25 p-4 sm:p-5">
      {step.body ? <p className="mb-4 text-sm text-muted">{step.body}</p> : null}
      <p className="text-xs uppercase tracking-[0.14em] text-muted">What is being checked</p>
      <p className="mt-1 font-display text-xl font-semibold">{check.label}</p>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs text-muted">Current simulated reading</dt>
          <dd className="mt-1 text-lg text-text">{result.current}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Expected / healthy range</dt>
          <dd className="mt-1 text-sm text-secondary">{check.healthyRange}</dd>
        </div>
      </dl>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className={cn("rounded-full border px-2.5 py-1 text-xs font-medium", statusTone(result.status))}>
          {statusLabel(result.status)}
        </span>
        <span className="text-xs text-muted">Status uses text labels, not color alone.</span>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-muted">{result.interpretation}</p>
      <p className="mt-3 text-sm text-secondary">A reasonable next check follows when you continue.</p>
    </article>
  );
}

function SummaryPanel({
  headingRef,
  workflowTitle,
  reading,
  session,
  conclusion,
  actions,
  onExport,
  onRestart,
  onDifferent,
  onExit,
}: {
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  workflowTitle: string;
  reading: NonNullable<ReturnType<typeof buildDiagnosticReading>>;
  session: ReturnType<typeof useGuidedTroubleshooting>["session"];
  conclusion: string;
  actions: RecommendedAction[];
  onExport: (format: "json" | "txt" | "pdf") => void;
  onRestart: () => void;
  onDifferent: () => void;
  onExit: () => void;
}) {
  return (
    <div className="mt-6 space-y-5">
      <h2 ref={headingRef} tabIndex={-1} className="font-display text-2xl font-semibold outline-none">
        Completion summary
      </h2>
      <p className="max-w-3xl text-sm leading-relaxed text-muted">{conclusion}</p>

      <dl className="grid gap-3 sm:grid-cols-2">
        <SummaryItem label="Reported problem" value={workflowTitle} />
        <SummaryItem label="Active Demo Scenario" value={reading.profileLabel} />
        <SummaryItem label="Checks completed" value={session.completedStepIds.join(", ") || "None"} />
        <SummaryItem label="Checks skipped" value={session.skippedStepIds.join(", ") || "None"} />
        <SummaryItem label="Final simulated health" value={`${reading.healthScore} / 100`} />
        <SummaryItem
          label="Date and time"
          value={
            session.completedAt
              ? new Date(session.completedAt).toLocaleString()
              : "Pending completion"
          }
        />
      </dl>

      <section>
        <h3 className="font-display text-lg font-semibold">Findings</h3>
        <ul className="mt-3 space-y-3">
          {session.findings.length ? (
            session.findings.map((item) => (
              <li key={item.id} className="rounded-xl border border-white/8 p-3 text-sm">
                <p className="font-medium text-text">
                  {item.category} · {statusLabel(item.status)}
                </p>
                <p className="mt-1 text-muted">
                  Observed: {item.observedValue}. {item.explanation}
                </p>
                <p className="mt-1 text-xs text-secondary">{item.confidence}</p>
              </li>
            ))
          ) : (
            <li className="text-sm text-muted">No structured findings were recorded.</li>
          )}
        </ul>
      </section>

      <section>
        <h3 className="font-display text-lg font-semibold">Simulated actions taken</h3>
        <ul className="mt-3 space-y-2 text-sm text-muted">
          {session.simulatedActions.length ? (
            session.simulatedActions.map((item) => (
              <li key={item.id} className="rounded-xl border border-white/8 p-3">
                <strong className="text-text">{item.label}</strong>
                <span className="mt-1 block text-xs">
                  Before/after: {JSON.stringify(item.before)} → {JSON.stringify(item.after)}. {item.note}
                </span>
              </li>
            ))
          ) : (
            <li>No simulated remediation actions were taken.</li>
          )}
        </ul>
      </section>

      <section>
        <h3 className="font-display text-lg font-semibold">Remaining recommendations</h3>
        <ul className="mt-3 space-y-2">
          {actions.map((action) => (
            <li key={action.id} className="rounded-xl border border-white/8 p-3 text-sm text-muted">
              <span className="font-medium text-text">{action.title}</span> — {action.why}
            </li>
          ))}
        </ul>
      </section>

      <p className="rounded-xl border border-white/8 bg-black/20 p-3 text-xs leading-relaxed text-muted">
        {DEMO_DISCLOSURE}
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          onClick={() => onExport("pdf")}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black"
        >
          <Download className="size-4" /> Export PDF
        </button>
        <button
          type="button"
          onClick={() => onExport("json")}
          className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-muted hover:text-text"
        >
          Export JSON
        </button>
        <button
          type="button"
          onClick={() => onExport("txt")}
          className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-muted hover:text-text"
        >
          Export TXT
        </button>
        <button
          type="button"
          onClick={onRestart}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-muted hover:text-text"
        >
          <RotateCcw className="size-4" /> Restart Guide
        </button>
        <button
          type="button"
          onClick={onDifferent}
          className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-muted hover:text-text"
        >
          Start Different Guide
        </button>
        <button
          type="button"
          onClick={onExit}
          className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-muted hover:text-text"
        >
          Exit to Dashboard
        </button>
      </div>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/8 bg-black/20 p-3">
      <dt className="text-xs uppercase tracking-[0.12em] text-muted">{label}</dt>
      <dd className="mt-1 text-sm text-text">{value}</dd>
    </div>
  );
}
