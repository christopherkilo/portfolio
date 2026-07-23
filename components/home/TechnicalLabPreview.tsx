"use client";

import { useMemo, useState } from "react";
import { ArrowRight, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/shared/Reveal";
import { LAB_CASE_STUDIES } from "@/lib/constants";

type NodeId =
  | "start"
  | "powerLed"
  | "fans"
  | "psu"
  | "motherboard"
  | "display"
  | "resolved";

type DecisionNode = {
  id: NodeId;
  question: string;
  options?: { label: string; next: NodeId }[];
  result?: string;
};

const TREE: Record<NodeId, DecisionNode> = {
  start: {
    id: "start",
    question: "PC won't power on. Where do we begin?",
    options: [{ label: "Start triage", next: "powerLed" }],
  },
  powerLed: {
    id: "powerLed",
    question: "Is the power LED on when you press the power button?",
    options: [
      { label: "Yes", next: "fans" },
      { label: "No", next: "psu" },
    ],
  },
  fans: {
    id: "fans",
    question: "Are the fans spinning?",
    options: [
      { label: "Yes", next: "display" },
      { label: "No", next: "motherboard" },
    ],
  },
  psu: {
    id: "psu",
    question: "Likely power delivery issue",
    result:
      "Suggested causes: wall outlet / surge strip, PSU switch, 24-pin seating, failed PSU. Verify outlet with a known-good device, reseat cables, then test with a PSU jumper or known-good unit.",
  },
  motherboard: {
    id: "motherboard",
    question: "Board may not be posting",
    result:
      "Suggested causes: shorted standoff, front-panel header miswire, CPU power (8-pin) loose, dead motherboard. Reseat CPU power, inspect for shorts, try clear CMOS.",
  },
  display: {
    id: "display",
    question: "Power is present—check signal path",
    result:
      "Suggested causes: GPU not seated, display cable on iGPU vs dGPU, failed monitor input, RAM not trained. Reseat GPU/RAM, try onboard video if available, beep codes / Q-LEDs.",
  },
  resolved: {
    id: "resolved",
    question: "Triage complete",
    result: "Document findings and verify with a controlled power-on test.",
  },
};

export function TroubleshootingDemo() {
  const [nodeId, setNodeId] = useState<NodeId>("start");
  const node = TREE[nodeId];
  const steps = useMemo(() => {
    const order: NodeId[] = ["start", "powerLed", "fans"];
    return order;
  }, []);

  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-5 backdrop-blur-xl md:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            Interactive
          </p>
          <h3 className="mt-1 font-display text-lg font-semibold text-text">
            Troubleshooting demo
          </h3>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setNodeId("start")}
          aria-label="Reset troubleshooting flow"
        >
          <RotateCcw className="size-3.5" aria-hidden />
          Reset
        </Button>
      </div>

      <ol className="mb-5 flex flex-wrap gap-2" aria-label="Flow steps">
        {steps.map((id, i) => (
          <li key={id}>
            <Badge tone={nodeId === id || (i > 0 && nodeId !== "start") ? "primary" : "default"}>
              {i + 1}. {TREE[id].question.split("?")[0].slice(0, 18)}
            </Badge>
          </li>
        ))}
      </ol>

      <AnimatePresence mode="wait">
        <motion.div
          key={node.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22 }}
        >
          <p className="text-base font-medium text-text">{node.question}</p>
          {node.result ? (
            <p className="mt-3 text-sm leading-relaxed text-muted">{node.result}</p>
          ) : null}
          {node.options ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {node.options.map((opt) => (
                <Button
                  key={opt.label}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setNodeId(opt.next)}
                >
                  {opt.label}
                  <ArrowRight className="size-3.5" aria-hidden />
                </Button>
              ))}
            </div>
          ) : (
            <div className="mt-5">
              <Button
                type="button"
                size="sm"
                onClick={() => setNodeId("start")}
              >
                Run again
              </Button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export function TechnicalLabPreview() {
  return (
    <section id="lab" className="mx-auto max-w-6xl scroll-mt-[var(--scroll-mt)] px-4 py-[var(--section-y)] sm:px-6 lg:px-8">
      <SectionHeader
        eyebrow="Technical Lab"
        title="Systems thinking, documented"
        description="Case studies from the bench—builds, deployments, networks, and methodical diagnostics."
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {LAB_CASE_STUDIES.map((study, i) => (
          <Reveal key={study.id} delay={i * 0.04}>
            <article className="gradient-border h-full rounded-2xl border border-white/8 bg-white/[0.03] p-5 backdrop-blur-xl transition hover:bg-white/[0.05]">
              <h3 className="font-display text-lg font-semibold text-text">
                {study.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {study.summary}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {study.tags.map((tag) => (
                  <Badge key={tag}>{tag}</Badge>
                ))}
              </div>
            </article>
          </Reveal>
        ))}
      </div>

      <Reveal className="mt-8">
        <TroubleshootingDemo />
      </Reveal>

      <Reveal className="mt-6">
        <Button href="/lab" variant="outline">
          Open Technical Lab
        </Button>
      </Reveal>
    </section>
  );
}
