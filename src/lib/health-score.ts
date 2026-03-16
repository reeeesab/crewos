export function calculateHealthScore(data: {
  snapshots: { mrr: number; date: Date }[];
  churnRate: number;
  netMargin: number;
  openP0Bugs: number;
  dauMauRatio: number;
}): { total: number; breakdown: Record<string, number> } {
  // MRR trend: compare last 3 months
  const recent = data.snapshots.slice(-3).map((s) => s.mrr);
  const mrrTrend =
    recent.length >= 2
      ? ((recent[recent.length - 1] - recent[0]) / recent[0]) * 100
      : 0;
  const mrrScore = Math.min(100, Math.max(0, 50 + mrrTrend * 2));

  // Churn score
  const churnScore =
    data.churnRate <= 0
      ? 100
      : data.churnRate <= 1
        ? 95
        : data.churnRate <= 2
          ? 85
          : data.churnRate <= 3
            ? 72
            : data.churnRate <= 5
              ? 50
              : data.churnRate <= 8
                ? 25
                : 0;

  // Margin score
  const marginScore =
    data.netMargin >= 70
      ? 100
      : data.netMargin >= 50
        ? 85
        : data.netMargin >= 30
          ? 65
          : data.netMargin >= 0
            ? 40
            : 0;

  // Bug score (P0 = critical)
  const bugScore = Math.max(0, 100 - data.openP0Bugs * 20);

  // Engagement (DAU/MAU)
  const engScore = Math.min(100, data.dauMauRatio * 200);

  const total = Math.round(
    mrrScore * 0.3 +
      churnScore * 0.25 +
      marginScore * 0.2 +
      bugScore * 0.15 +
      engScore * 0.1,
  );

  return {
    total,
    breakdown: {
      mrrTrend: Math.round(mrrScore),
      churnRate: Math.round(churnScore),
      costMargin: Math.round(marginScore),
      openP0Bugs: Math.round(bugScore),
      engagementRate: Math.round(engScore),
    },
  };
}
