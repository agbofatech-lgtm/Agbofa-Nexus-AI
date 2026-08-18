import { Activity, Clock3, DatabaseZap, ShieldCheck } from "lucide-react";

import type { AgentTelemetryPoint } from "@/types/agents";

interface SparklineProps {
  points: AgentTelemetryPoint[];
  label: string;
  color: string;
}

function Sparkline({ points, label, color }: SparklineProps) {
  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);
  const width = 260;
  const height = 76;
  const coordinates = points
    .map((point, index) => {
      const x = (index / Math.max(1, points.length - 1)) * width;
      const y = height - ((point.value - min) / range) * (height - 12) - 6;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg
      aria-label={`${label} simulated telemetry trend`}
      className="agent-sparkline"
      role="img"
      viewBox={`0 0 ${width} ${height}`}
    >
      <defs>
        <linearGradient
          id={`fill-${label.replace(/\s/g, "-")}`}
          x1="0"
          x2="0"
          y1="0"
          y2="1"
        >
          <stop offset="0" stopColor={color} stopOpacity=".24" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        fill="none"
        points={coordinates}
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <polygon
        fill={`url(#fill-${label.replace(/\s/g, "-")})`}
        points={`0,${height} ${coordinates} ${width},${height}`}
      />
    </svg>
  );
}

interface AgentTelemetryProps {
  telemetry: {
    throughput: AgentTelemetryPoint[];
    latency: AgentTelemetryPoint[];
    successRate: AgentTelemetryPoint[];
    queue: AgentTelemetryPoint[];
  };
}

const telemetryCards = [
  {
    key: "throughput",
    label: "Throughput",
    icon: Activity,
    color: "#D4AF37",
    unit: "/s",
  },
  {
    key: "latency",
    label: "Latency",
    icon: Clock3,
    color: "#3399FF",
    unit: "ms",
  },
  {
    key: "successRate",
    label: "Success rate",
    icon: ShieldCheck,
    color: "#0D9040",
    unit: "%",
  },
  {
    key: "queue",
    label: "Queue depth",
    icon: DatabaseZap,
    color: "#6C5CE7",
    unit: "",
  },
] as const;

export function AgentTelemetry({ telemetry }: AgentTelemetryProps) {
  return (
    <section
      className="agent-telemetry glass"
      aria-labelledby="agent-telemetry-title"
    >
      <div className="agent-panel-heading">
        <div>
          <span className="section-kicker">Simulated runtime data</span>
          <h2 id="agent-telemetry-title">Telemetry</h2>
        </div>
        <span>Last 100 minutes · 5m intervals</span>
      </div>
      <div className="agent-telemetry-grid">
        {telemetryCards.map((card) => {
          const Icon = card.icon;
          const points = telemetry[card.key];
          const latest = points.at(-1)?.value ?? 0;
          return (
            <article key={card.key}>
              <div>
                <span>
                  <Icon size={14} /> {card.label}
                </span>
                <strong>
                  {latest.toLocaleString()}
                  {card.unit}
                </strong>
              </div>
              <Sparkline
                color={card.color}
                label={card.label}
                points={points}
              />
            </article>
          );
        })}
      </div>
    </section>
  );
}
