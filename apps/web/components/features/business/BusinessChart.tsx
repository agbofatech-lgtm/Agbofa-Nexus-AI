"use client";

import dynamic from "next/dynamic";

import { Skeleton } from "@/components/ui";

const IntelligenceChart = dynamic(
  () =>
    import("@/components/features/intelligence/IntelligenceChart").then(
      (module) => module.IntelligenceChart,
    ),
  {
    ssr: false,
    loading: () => <Skeleton height={300} rounded="lg" />,
  },
);

interface BusinessChartProps {
  data: Array<Record<string, string | number>>;
  series: Array<{ key: string; label: string; color: string }>;
  label: string;
  type?: "line" | "bar";
}

export function BusinessChart(props: BusinessChartProps) {
  return <IntelligenceChart {...props} />;
}
