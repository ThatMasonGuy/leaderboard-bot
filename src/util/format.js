export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export function fmtHoursFromTicks(ticks) {
  const seconds = (ticks || 0) / 20;
  return seconds / 3600;
}

export function fmtDurationHours(hours) {
  if (!isFinite(hours) || hours <= 0) return "0h";
  const h = Math.floor(hours);
  const m = Math.floor((hours - h) * 60);
  if (h <= 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export function nowAest() {
  return new Date().toLocaleString("en-AU", { timeZone: "Australia/Brisbane" });
}
