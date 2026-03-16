export function checkSunsetSignal(product: {
  snapshots: { mrr: number; date: Date }[];
  lastNewSignup: Date | null;
}): { triggered: boolean; reason: string } {
  const last3 = product.snapshots.slice(-3);
  if (last3.length < 3) return { triggered: false, reason: "" };

  const decliningMonths = last3.every(
    (s, i) => i === 0 || s.mrr < last3[i - 1].mrr,
  );

  const totalDecline =
    last3.length >= 2
      ? ((last3[last3.length - 1].mrr - last3[0].mrr) / last3[0].mrr) * 100
      : 0;

  const daysSinceSignup = product.lastNewSignup
    ? (Date.now() - product.lastNewSignup.getTime()) / 86400000
    : 999;

  if (decliningMonths && totalDecline < -10 && daysSinceSignup > 14) {
    return {
      triggered: true,
      reason: `MRR has declined ${Math.abs(totalDecline).toFixed(0)}% over 3 months. No new signups in ${Math.round(daysSinceSignup)} days.`,
    };
  }

  return { triggered: false, reason: "" };
}
