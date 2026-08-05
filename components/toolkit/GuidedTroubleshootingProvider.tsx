"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import {
  clearGuideSession,
  guideSessionReducer,
  initialGuideSession,
  persistGuideSession,
  readGuideSession,
  sessionHasProgress,
} from "@/lib/toolkit/guided/session";
import type {
  GuideModule,
  SessionAction,
  TroubleshootingSession,
} from "@/lib/toolkit/guided/types";
import { getWorkflow, listWorkflows } from "@/lib/toolkit/guided/workflows";

type GuideContextValue = {
  session: TroubleshootingSession;
  dispatch: (action: SessionAction) => void;
  hasProgress: boolean;
  workflows: ReturnType<typeof listWorkflows>;
  markModuleReviewed: (module: GuideModule) => void;
  confirmDiscard: (message: string) => boolean;
};

const GuideContext = createContext<GuideContextValue | null>(null);

export function GuidedTroubleshootingProvider({ children }: { children: React.ReactNode }) {
  const [session, dispatchBase] = useReducer(guideSessionReducer, undefined, () => {
    return initialGuideSession();
  });
  const hydrated = useRef(false);

  useEffect(() => {
    const stored = readGuideSession();
    if (stored && stored.status !== "idle") {
      dispatchBase({ type: "HYDRATE", session: stored });
    } else {
      dispatchBase({ type: "OPEN_HOME" });
    }
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    if (session.status === "idle") {
      clearGuideSession();
      return;
    }
    persistGuideSession(session);
  }, [session]);

  const dispatch = useCallback((action: SessionAction) => {
    dispatchBase(action);
  }, []);

  const markModuleReviewed = useCallback((module: GuideModule) => {
    dispatchBase({ type: "MARK_MODULE_REVIEWED", module });
  }, []);

  const confirmDiscard = useCallback(
    (message: string) => {
      if (!sessionHasProgress(session)) return true;
      if (typeof window === "undefined") return true;
      return window.confirm(message);
    },
    [session],
  );

  const value = useMemo(
    () => ({
      session,
      dispatch,
      hasProgress: sessionHasProgress(session),
      workflows: listWorkflows(),
      markModuleReviewed,
      confirmDiscard,
    }),
    [session, dispatch, markModuleReviewed, confirmDiscard],
  );

  return <GuideContext.Provider value={value}>{children}</GuideContext.Provider>;
}

export function useGuidedTroubleshooting() {
  const context = useContext(GuideContext);
  if (!context) {
    throw new Error("useGuidedTroubleshooting must be used inside GuidedTroubleshootingProvider");
  }
  return context;
}

export function useOptionalGuidedTroubleshooting() {
  return useContext(GuideContext);
}

/** Resume helpers for command palette / deep links without requiring the page. */
export function getResumableWorkflowTitle(session: TroubleshootingSession) {
  if (!session.workflowId) return null;
  return getWorkflow(session.workflowId)?.title ?? null;
}
