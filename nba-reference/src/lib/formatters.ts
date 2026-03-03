export function formatPct(value: string | number | null | undefined) {
  if (value == null) return "-";
  const n = Number(value);
  if (Number.isNaN(n)) return "-";
  return n.toFixed(3);
}

export function formatMoney(value: string | number | null | undefined) {
  if (value == null) return "-";
  const n = Number(value);
  if (Number.isNaN(n)) return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatSignedNumber(value: number | null | undefined) {
  if (value == null) return "-";
  return value > 0 ? `+${value}` : String(value);
}
