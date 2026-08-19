"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface ChartSeries {
  key: string;
  label: string;
  color: string;
}

interface IntelligenceChartProps {
  data: Array<Record<string, string | number>>;
  series: ChartSeries[];
  label: string;
  type?: "line" | "bar";
}

export function IntelligenceChart({
  data,
  series,
  label,
  type = "line",
}: IntelligenceChartProps) {
  if (!data.length)
    return <div className="chart-empty">No chart data available.</div>;
  const common = {
    data,
    margin: { top: 12, right: 12, left: -18, bottom: 0 },
    accessibilityLayer: true,
  };
  return (
    <div aria-label={label} className="intelligence-chart" role="img">
      <ResponsiveContainer height="100%" width="100%">
        {type === "bar" ? (
          <BarChart {...common}>
            <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
            <XAxis
              dataKey="label"
              stroke="var(--chart-axis)"
              tick={{ fontSize: 9 }}
            />
            <YAxis stroke="var(--chart-axis)" tick={{ fontSize: 9 }} />
            <Tooltip
              contentStyle={{
                background: "var(--chart-tooltip-bg)",
                border: "1px solid var(--chart-tooltip-border)",
                borderRadius: 8,
                fontSize: 11,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 9 }} />
            {series.map((item) => (
              <Bar
                key={item.key}
                dataKey={item.key}
                fill={item.color}
                name={item.label}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        ) : (
          <LineChart {...common}>
            <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
            <XAxis
              dataKey="label"
              stroke="var(--chart-axis)"
              tick={{ fontSize: 9 }}
            />
            <YAxis stroke="var(--chart-axis)" tick={{ fontSize: 9 }} />
            <Tooltip
              contentStyle={{
                background: "var(--chart-tooltip-bg)",
                border: "1px solid var(--chart-tooltip-border)",
                borderRadius: 8,
                fontSize: 11,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 9 }} />
            {series.map((item) => (
              <Line
                key={item.key}
                dataKey={item.key}
                dot={false}
                name={item.label}
                stroke={item.color}
                strokeWidth={2}
                type="monotone"
              />
            ))}
          </LineChart>
        )}
      </ResponsiveContainer>
      <span className="sr-only">
        {label}. Development values across {data.length} intervals.
      </span>
    </div>
  );
}
