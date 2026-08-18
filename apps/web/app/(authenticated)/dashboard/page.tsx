"use client";

import {
  Activity,
  ArrowUpRight,
  Bot,
  DatabaseZap,
  Newspaper,
  Radio,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useMemo, useState } from "react";

import { DataAuthorityBadge } from "@/components/features/business/DataAuthorityBadge";
import {
  Badge,
  Button,
  Card,
  GlassCard,
  Input,
  Select,
  Skeleton,
  Tabs,
  type TabItem,
} from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { useCommandOverview } from "@/hooks/useCommandOverview";
import {
  fadeIn,
  fadeInTransition,
  slideUp,
  slideUpTransition,
  staggerContainer,
} from "@/lib/animations/presets";
import type { CommandActivityId, CommandMetricId } from "@/types/command";

const metricIcons: Record<CommandMetricId, LucideIcon> = {
  agents: Bot,
  stories: Newspaper,
  confidence: ShieldCheck,
  reach: Users,
};

const activityIcons: Record<CommandActivityId, LucideIcon> = {
  verified: ShieldCheck,
  agent: Bot,
  audience: TrendingUp,
};

export default function DashboardPage() {
  const reduceMotion = useReducedMotion();
  const { session } = useAuth();
  const overview = useCommandOverview();
  const [brief, setBrief] = useState("");
  const [region, setRegion] = useState("ghana");
  const [preparedBrief, setPreparedBrief] = useState<string | null>(null);
  const data = overview.value?.data ?? null;
  const firstName = session?.user.name.split(" ")[0] ?? "Nexus editor";

  const tabs = useMemo<readonly TabItem[]>(() => {
    if (!data) return [];
    return [
      {
        value: "activity",
        label: "Demo activity",
        content: (
          <div className="activity-list">
            {data.activity.map((item) => {
              const Icon = activityIcons[item.id];
              return (
                <div key={item.title} className="activity-item">
                  <span className={`activity-item__icon activity-item__icon--${item.tone}`}>
                    <Icon size={17} />
                  </span>
                  <div className="activity-item__copy">
                    <strong>{item.title}</strong>
                    <p>{item.detail}</p>
                  </div>
                  <time>{item.timeLabel}</time>
                </div>
              );
            })}
          </div>
        ),
      },
      {
        value: "signals",
        label: "Priority fixtures",
        content: (
          <div className="signal-grid">
            {data.signals.map((signal) => (
              <div key={signal.label}>
                <span>{signal.label}</span>
                <Badge
                  status={
                    signal.status === "queued-demo" ? "queued" : "running"
                  }
                >
                  {signal.value}
                </Badge>
              </div>
            ))}
          </div>
        ),
      },
      {
        value: "system",
        label: "Integration state",
        content: (
          <div className="system-health">
            <DatabaseZap size={34} />
            <div>
              <strong>Frontend adapters are serving local fixtures</strong>
              <p>
                Backend, BFF, provider, publishing, and production telemetry
                integrations remain required.
              </p>
            </div>
          </div>
        ),
      },
    ];
  }, [data]);

  const prepareBrief = () => {
    if (!brief.trim()) return;
    setPreparedBrief(
      `${region.toUpperCase()} brief objective saved in component state. No AI request was sent.`,
    );
  };

  return (
    <motion.div
      animate="animate"
      className="dashboard-page"
      initial={reduceMotion ? false : "initial"}
      variants={staggerContainer}
    >
      <motion.section
        className="dashboard-hero"
        transition={reduceMotion ? { duration: 0 } : slideUpTransition}
        variants={slideUp}
      >
        <div>
          <div className="eyebrow">
            <span className="demo-signal" />
            Media Intelligence Operating System
          </div>
          <h1>Good evening, {firstName}.</h1>
          <p>
            Move from information to evidence, editorial judgment, and action—
            with every example clearly separated from production authority.
          </p>
        </div>
        <div className="dashboard-hero__actions">
          <Link className="dashboard-action-link dashboard-action-link--quiet" href="/reader">
            Open reader
          </Link>
          <Link className="dashboard-action-link" href="/newsroom/origination">
            Enter newsroom <ArrowUpRight size={16} />
          </Link>
        </div>
      </motion.section>

      <motion.aside
        className="command-authority-line"
        role="note"
        transition={reduceMotion ? { duration: 0 } : fadeInTransition}
        variants={fadeIn}
      >
        <DataAuthorityBadge state={overview.error ? "error" : overview.loading ? "loading" : "demo"} />
        <span>
          {overview.value?.source ?? "Local Phase 1 command overview fixture"}
        </span>
        <strong>Not live · not production authority</strong>
      </motion.aside>

      <motion.section
        aria-label="Illustrative command metrics"
        className="metrics-grid"
        transition={reduceMotion ? { duration: 0 } : fadeInTransition}
        variants={fadeIn}
      >
        {overview.loading
          ? Array.from({ length: 4 }, (_, index) => (
              <Card key={index} className="metric-card" variant="glass">
                <Skeleton height={32} rounded="md" width={32} />
                <Skeleton height={25} rounded="sm" width="54%" />
                <Skeleton height={10} rounded="sm" width="82%" />
              </Card>
            ))
          : data?.metrics.map((metric) => {
              const Icon = metricIcons[metric.id];
              return (
                <Card key={metric.id} className="metric-card" variant="default">
                  <div className={`metric-card__icon metric-card__icon--${metric.tone}`}>
                    <Icon size={19} />
                  </div>
                  <div className="metric-card__value-row">
                    <strong>{metric.value}</strong>
                    <Badge variant="category" category="AI">Demo</Badge>
                  </div>
                  <span>{metric.label}</span>
                  <small>{metric.context}</small>
                </Card>
              );
            })}
      </motion.section>

      {overview.error ? (
        <Card className="command-error" role="alert" variant="glass">
          <DatabaseZap size={20} />
          <div>
            <strong>Local command fixture unavailable</strong>
            <p>{overview.error}</p>
          </div>
          <Button onClick={overview.retry} size="sm" variant="secondary">Retry</Button>
        </Card>
      ) : null}

      <div className="dashboard-grid">
        <motion.section
          transition={reduceMotion ? { duration: 0 } : slideUpTransition}
          variants={slideUp}
        >
          <GlassCard className="command-card" tone="gold">
            <div className="section-heading">
              <div>
                <span className="section-kicker">
                  <Zap size={13} /> Intelligence composer
                </span>
                <h2>Frame the next editorial brief</h2>
              </div>
              <Badge status="idle">Local draft</Badge>
            </div>
            <p className="section-description">
              Prepare an objective for a future intelligence workflow. This
              control stores presentation state only; an AI provider integration
              is required to generate a brief.
            </p>
            <Input
              icon={<Sparkles size={17} />}
              label="Brief objective"
              onChange={(value) => {
                setBrief(value);
                setPreparedBrief(null);
              }}
              placeholder="Map the strongest AI policy signals across Africa"
              type="search"
              value={brief}
            />
            <div className="command-card__controls">
              <Select
                aria-label="Brief region"
                onValueChange={setRegion}
                options={[
                  { value: "ghana", label: "Ghana" },
                  { value: "africa", label: "Africa" },
                  { value: "global", label: "Global" },
                ]}
                value={region}
              />
              <Button disabled={!brief.trim()} onClick={prepareBrief}>
                Prepare local objective <ArrowUpRight size={16} />
              </Button>
            </div>
            <span aria-live="polite" className="command-card__integration-state">
              {preparedBrief ?? "AI generation: integration required"}
            </span>
          </GlassCard>
        </motion.section>

        <motion.section
          transition={reduceMotion ? { duration: 0 } : slideUpTransition}
          variants={slideUp}
        >
          <Card className="network-card" variant="default">
            <div className="section-heading">
              <div>
                <span className="section-kicker">
                  <Radio size={13} /> Demonstration topology
                </span>
                <h2>Agent constellation</h2>
              </div>
              <Badge variant="confidence" confidence={data?.network.exampleConfidence ?? 0} />
            </div>
            <div className="constellation" aria-label="Illustrative agent network graphic">
              <div className="constellation__orbit constellation__orbit--outer" />
              <div className="constellation__orbit constellation__orbit--inner" />
              <span className="constellation__node constellation__node--one" />
              <span className="constellation__node constellation__node--two" />
              <span className="constellation__node constellation__node--three" />
              <span className="constellation__node constellation__node--four" />
              <div className="constellation__core"><Sparkles size={23} /></div>
            </div>
            <div className="network-card__footer">
              <span><Activity size={14} /> {data?.network.exampleEventsPerMinute ?? "—"} example events/min</span>
              <span><span className="demo-signal" /> {data?.network.simulatedConnectedAgents ?? "—"}/{data?.network.registeredAgents ?? "—"} simulated</span>
            </div>
          </Card>
        </motion.section>
      </div>

      <motion.section
        transition={reduceMotion ? { duration: 0 } : fadeInTransition}
        variants={fadeIn}
      >
        <Card className="activity-card" variant="default">
          {tabs.length ? (
            <Tabs ariaLabel="Demo network intelligence views" items={tabs} />
          ) : (
            <div className="activity-card__loading">
              <Skeleton height={42} rounded="md" />
              <Skeleton height={120} rounded="md" />
            </div>
          )}
        </Card>
      </motion.section>

      <motion.section
        aria-label="Frontend boundary summary"
        className="foundation-strip"
        transition={reduceMotion ? { duration: 0 } : fadeInTransition}
        variants={fadeIn}
      >
        <div>
          <span className="section-kicker">Phase 1 foundation</span>
          <strong>Cinematic · editorial · technical · evidence-aware</strong>
        </div>
        <div className="foundation-strip__boundary">
          <DatabaseZap size={15} /> Backend integrations not connected
        </div>
        <Badge variant="verification" verification="verified">
          Frontend only
        </Badge>
      </motion.section>
    </motion.div>
  );
}
