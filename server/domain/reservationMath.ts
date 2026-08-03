import "server-only";

/** Shared Event Horizon fee rules — server is authoritative (integer cents). */
export const SERVICE_FEE_RATE = 0.08;
export const SERVICE_FEE_FLAT_CENTS = 250;

export type ReservationTotalsCents = {
  unitPriceInCents: number;
  quantity: number;
  subtotalInCents: number;
  feeInCents: number;
  totalInCents: number;
};

export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

export function centsToDollars(cents: number): number {
  return Math.round(cents) / 100;
}

export function calculateReservationTotalsCents(
  unitPriceInCents: number,
  quantity: number,
): ReservationTotalsCents {
  const safeQuantity = Number.isFinite(quantity) ? quantity : 0;
  const subtotalInCents = Math.round(unitPriceInCents * safeQuantity);
  const feeInCents =
    safeQuantity < 1
      ? 0
      : Math.round(subtotalInCents * SERVICE_FEE_RATE) + SERVICE_FEE_FLAT_CENTS;
  return {
    unitPriceInCents,
    quantity: safeQuantity,
    subtotalInCents,
    feeInCents,
    totalInCents: subtotalInCents + feeInCents,
  };
}

/** Demo confirmation numbers: EH-XXXX-XXXX (A–Z / 0–9). */
export function createConfirmationNumber(seed?: string): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let source =
    seed ??
    `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`.toUpperCase();
  source = source.replace(/[^A-Z0-9]/g, "");
  while (source.length < 8) {
    source += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  const chunk = source.slice(0, 8);
  return `EH-${chunk.slice(0, 4)}-${chunk.slice(4, 8)}`;
}

export function isConfirmationNumber(value: string): boolean {
  return /^EH-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(value);
}
