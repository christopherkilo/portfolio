import { cn } from "@/lib/utils";

export function SpecLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[#C4BBB3]",
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-[#FF8C2B]" aria-hidden />
      {children}
    </span>
  );
}

export function HorizonRule({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "block h-px w-full max-w-xs bg-gradient-to-r from-transparent via-[#FF8C2B] to-transparent",
        className,
      )}
    />
  );
}

export function PrintEclipse({
  size = 40,
  hollow = false,
  className,
}: {
  size?: number;
  hollow?: boolean;
  className?: string;
}) {
  // Geometry locked to public/projects/event-horizon-brand/symbol-print.svg
  // (r=18 stroke 2.75, r=11.5 black core) and symbol-ring.svg (stroke only).
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="none"
      className={className}
      aria-hidden
    >
      <circle cx="32" cy="32" r="18" fill="none" stroke="#FF8C2B" strokeWidth="2.75" />
      {hollow ? null : <circle cx="32" cy="32" r="11.5" fill="#000000" />}
    </svg>
  );
}

export function PrintWordmark({
  field = "dark",
  className,
}: {
  field?: "dark" | "light";
  className?: string;
}) {
  const color = field === "dark" ? "#F4F0EB" : "#161310";
  return (
    <span
      role="img"
      aria-label="Event Horizon"
      className={cn("inline-flex items-center", className)}
      style={{ color }}
    >
      <span
        aria-hidden="true"
        className="font-display text-[0.95em] font-bold uppercase tracking-[0.14em]"
      >
        Event H
        <span style={{ color: "#FF8C2B" }}>o</span>
        rizon
      </span>
    </span>
  );
}

export function MerchLockup({ className }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="Event Horizon"
      className={cn("inline-flex flex-col items-center gap-3", className)}
    >
      <span
        aria-hidden="true"
        className="inline-flex flex-col items-center gap-3"
      >
        <PrintEclipse size={36} hollow />
        <span className="font-display text-lg font-bold uppercase tracking-[0.18em] text-[#F4F0EB]">
          Event Horizon
        </span>
      </span>
    </span>
  );
}

export function BrandFrame({
  children,
  className,
  padded = true,
}: {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-white/8 bg-[#0B0B0B]",
        padded && "p-5 sm:p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}
