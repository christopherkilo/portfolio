"use client";

import type { CaseStudyChart } from "@/lib/caseStudies";
import { cn } from "@/lib/utils";

type CaseStudyChartProps = {
  chart: CaseStudyChart;
  className?: string;
};

const ACCENT = "#F8E71C";
const GRID = "rgba(255,255,255,0.08)";
const MUTED = "#8a8a8a";
const TEXT = "#f5f5f5";

export function CaseStudyChartView({ chart, className }: CaseStudyChartProps) {
  const width = 960;
  const height = 420;
  const pad = { top: 28, right: 28, bottom: 48, left: 56 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const max = Math.max(...chart.series.map((p) => p.value), 1);
  const min = 0;

  const xAt = (i: number) =>
    pad.left + (chart.series.length <= 1 ? innerW / 2 : (i / (chart.series.length - 1)) * innerW);
  const yAt = (v: number) =>
    pad.top + innerH - ((v - min) / (max - min || 1)) * innerH;

  const points = chart.series.map((p, i) => ({
    ...p,
    x: chart.type === "bar" ? pad.left + (i + 0.5) * (innerW / chart.series.length) : xAt(i),
    y: yAt(p.value),
  }));

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(" ");

  const areaPath = `${linePath} L ${points[points.length - 1]?.x ?? pad.left} ${(pad.top + innerH).toFixed(2)} L ${points[0]?.x ?? pad.left} ${(pad.top + innerH).toFixed(2)} Z`;

  const barW = Math.min(48, (innerW / chart.series.length) * 0.55);

  const ticks = 4;
  const yTicks = Array.from({ length: ticks + 1 }, (_, i) => {
    const v = min + ((max - min) * i) / ticks;
    return { v, y: yAt(v) };
  });

  return (
    <figure
      className={cn(
        "overflow-hidden rounded-2xl border border-white/8 bg-white/[0.03] p-4 backdrop-blur-xl sm:p-6",
        className,
      )}
    >
      <figcaption className="mb-4">
        <h3 className="font-display text-lg font-semibold text-text">{chart.title}</h3>
        <p className="mt-1 text-sm text-muted">{chart.description}</p>
      </figcaption>

      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto w-full min-w-[320px]"
          role="img"
          aria-label={`${chart.title} chart`}
        >
          <defs>
            <linearGradient id={`fill-${chart.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={ACCENT} stopOpacity="0.35" />
              <stop offset="100%" stopColor={ACCENT} stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id={`bar-${chart.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={ACCENT} stopOpacity="0.95" />
              <stop offset="100%" stopColor={ACCENT} stopOpacity="0.35" />
            </linearGradient>
          </defs>

          {yTicks.map((t) => (
            <g key={t.v}>
              <line
                x1={pad.left}
                x2={width - pad.right}
                y1={t.y}
                y2={t.y}
                stroke={GRID}
                strokeWidth={1}
              />
              <text
                x={pad.left - 12}
                y={t.y + 4}
                textAnchor="end"
                fill={MUTED}
                fontSize={12}
                fontFamily="ui-monospace, monospace"
              >
                {Math.round(t.v)}
              </text>
            </g>
          ))}

          {chart.type === "area" ? (
            <>
              <path d={areaPath} fill={`url(#fill-${chart.id})`} />
              <path
                d={linePath}
                fill="none"
                stroke={ACCENT}
                strokeWidth={2.5}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </>
          ) : null}

          {chart.type === "line" ? (
            <path
              d={linePath}
              fill="none"
              stroke={ACCENT}
              strokeWidth={2.5}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ) : null}

          {chart.type === "bar"
            ? points.map((p) => (
                <rect
                  key={p.label}
                  x={p.x - barW / 2}
                  y={p.y}
                  width={barW}
                  height={pad.top + innerH - p.y}
                  rx={6}
                  fill={`url(#bar-${chart.id})`}
                />
              ))
            : null}

          {(chart.type === "line" || chart.type === "area") &&
            points.map((p) => (
              <circle
                key={p.label}
                cx={p.x}
                cy={p.y}
                r={4.5}
                fill="#0a0a0a"
                stroke={ACCENT}
                strokeWidth={2}
              />
            ))}

          {points.map((p) => (
            <text
              key={`${p.label}-x`}
              x={p.x}
              y={height - 16}
              textAnchor="middle"
              fill={MUTED}
              fontSize={12}
              fontFamily="ui-sans-serif, system-ui"
            >
              {p.label}
            </text>
          ))}

          {chart.unit ? (
            <text
              x={pad.left}
              y={18}
              fill={TEXT}
              fontSize={11}
              fontFamily="ui-monospace, monospace"
              opacity={0.7}
            >
              {chart.unit}
            </text>
          ) : null}
        </svg>
      </div>
    </figure>
  );
}
