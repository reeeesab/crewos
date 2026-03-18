"use client";

import { useParams } from "next/navigation";
import { AnalyticsPageClient } from "./_components/analytics-page-client";

export default function AnalyticsPage() {
  const params = useParams();
  const productId = params.productId as string;

  return <AnalyticsPageClient productId={productId} />;
}
