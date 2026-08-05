import type { TroubleshootingSession, SessionAction } from "@/lib/toolkit/guided/types";

export const GUIDE_SESSION_KEY = "kilo-toolkit-guide-session-v1";

export const initialGuideSession = (): TroubleshootingSession => ({
  status: "idle",
  workflowId: null,
  currentStepId: null,
  completedStepIds: [],
  skippedStepIds: [],
  stepHistory: [],
  answers: {},
  findings: [],
  recommendedActionIds: [],
  simulatedActions: [],
  reviewedModules: [],
  startedAt: null,
  completedAt: null,
  scenarioDecision: null,
  recommendedScenario: null,
  scenarioNotice: null,
});

export function guideSessionReducer(
  state: TroubleshootingSession,
  action: SessionAction,
): TroubleshootingSession {
  switch (action.type) {
    case "HYDRATE":
      return action.session;
    case "OPEN_HOME":
      return { ...state, status: "home", scenarioNotice: null };
    case "SELECT_WORKFLOW":
      return {
        ...initialGuideSession(),
        status: "scenario-prompt",
        workflowId: action.workflowId,
        recommendedScenario: action.recommendedScenario,
        scenarioDecision: "pending",
        startedAt: new Date().toISOString(),
      };
    case "DECIDE_SCENARIO":
      return {
        ...state,
        scenarioDecision: action.decision,
        scenarioNotice:
          action.notice ??
          (action.decision === "loaded-recommended"
            ? "The simulation environment changed to the recommended Demo Scenario."
            : "Continuing with your current Demo Scenario."),
      };
    case "START_WORKFLOW":
      return {
        ...state,
        status: "active",
        currentStepId: action.firstStepId,
        stepHistory: [action.firstStepId],
        scenarioNotice: state.scenarioNotice,
      };
    case "ANSWER": {
      const completed = state.completedStepIds.includes(action.stepId)
        ? state.completedStepIds
        : [...state.completedStepIds, action.stepId];
      return {
        ...state,
        answers: { ...state.answers, [action.stepId]: action.optionId },
        completedStepIds: completed,
        currentStepId: action.nextStepId,
        stepHistory: [...state.stepHistory, action.nextStepId],
        scenarioNotice: null,
      };
    }
    case "ADVANCE": {
      const completed = state.completedStepIds.includes(action.fromStepId)
        ? state.completedStepIds
        : [...state.completedStepIds, action.fromStepId];
      const findings = action.finding
        ? [...state.findings.filter((item) => item.id !== action.finding!.id), action.finding]
        : state.findings;
      const recommendedActionIds = action.actionIds
        ? Array.from(new Set([...state.recommendedActionIds, ...action.actionIds]))
        : state.recommendedActionIds;
      return {
        ...state,
        completedStepIds: completed,
        findings,
        recommendedActionIds,
        currentStepId: action.nextStepId,
        stepHistory: [...state.stepHistory, action.nextStepId],
        scenarioNotice: null,
      };
    }
    case "SKIP": {
      const skipped = state.skippedStepIds.includes(action.fromStepId)
        ? state.skippedStepIds
        : [...state.skippedStepIds, action.fromStepId];
      return {
        ...state,
        skippedStepIds: skipped,
        currentStepId: action.nextStepId,
        stepHistory: [...state.stepHistory, action.nextStepId],
        scenarioNotice: null,
      };
    }
    case "BACK": {
      if (state.stepHistory.length < 2) return state;
      const history = state.stepHistory.slice(0, -1);
      return {
        ...state,
        stepHistory: history,
        currentStepId: history[history.length - 1] ?? null,
        status: "active",
        completedAt: null,
      };
    }
    case "MARK_MODULE_REVIEWED": {
      if (state.reviewedModules.includes(action.module)) return state;
      return { ...state, reviewedModules: [...state.reviewedModules, action.module] };
    }
    case "RECORD_ACTION":
      return {
        ...state,
        simulatedActions: [...state.simulatedActions, action.action],
      };
    case "COMPLETE":
      return {
        ...state,
        status: "completed",
        completedAt: action.at,
        completedStepIds: state.currentStepId
          ? Array.from(new Set([...state.completedStepIds, state.currentStepId]))
          : state.completedStepIds,
      };
    case "RESTART":
      if (!state.workflowId || !state.recommendedScenario) return initialGuideSession();
      return {
        ...initialGuideSession(),
        status: "scenario-prompt",
        workflowId: state.workflowId,
        recommendedScenario: state.recommendedScenario,
        scenarioDecision: "pending",
        startedAt: new Date().toISOString(),
      };
    case "EXIT":
      if (!state.workflowId) {
        return { ...initialGuideSession(), status: "home" };
      }
      return {
        ...state,
        status: "home",
        completedAt: state.completedAt,
      };
    case "CLEAR":
      return { ...initialGuideSession(), status: "home" };
    default:
      return state;
  }
}

export function persistGuideSession(session: TroubleshootingSession) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(GUIDE_SESSION_KEY, JSON.stringify(session));
  } catch {
    // Ignore quota / private-mode failures.
  }
}

export function readGuideSession(): TroubleshootingSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(GUIDE_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as TroubleshootingSession;
  } catch {
    return null;
  }
}

export function clearGuideSession() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(GUIDE_SESSION_KEY);
}

export function sessionHasProgress(session: TroubleshootingSession) {
  return (
    session.status === "active" ||
    session.status === "completed" ||
    session.status === "scenario-prompt" ||
    session.completedStepIds.length > 0 ||
    session.findings.length > 0 ||
    Boolean(session.workflowId && session.status === "home")
  );
}
