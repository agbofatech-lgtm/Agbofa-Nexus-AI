"use client";

import {
  Activity,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  Clock3,
  Newspaper,
  Radio,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";

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
import {
  fadeIn,
  fadeInTransition,
  slideUp,
  slideUpTransition,
  staggerContainer,
} from "@/lib/animations/presets";

const metrics = [
  {
    label: "Active agents",
    value: "12",
    change: "+2 online",
    icon: Bot,
    tone: "gold",
  },
  {
    label: "Stories monitored",
    value: "1,284",
    change: "+18.4%",
    icon: Newspaper,
    tone: "blue",
  },
  {
    label: "Truth confidence",
    value: "94.8%",
    change: "+1.2 pts",
    icon: ShieldCheck,
    tone: "green",
  },
  {
    label: "Audience reach",
    value: "2.4M",
    change: "+12.6%",
    icon: Users,
    tone: "purple",
  },
] as const;

const activity = [
  {
    title: "Market signal verified",
    detail: "Truth Engine cross-checked 14 independent sources.",
    time: "18s ago",
    icon: ShieldCheck,
    tone: "green",
  },
  {
    title: "Newsroom agent dispatched",
    detail: "Astra-04 is building the regional impact brief.",
    time: "1m ago",
    icon: Bot,
    tone: "gold",
  },
  {
    title: "Audience anomaly detected",
    detail: "Mobile readership accelerated across Greater Accra.",
    time: "4m ago",
    icon: TrendingUp,
    tone: "blue",
  },
] as const;

export default function DashboardPage() {
  const reduceMotion = useReducedMotion();
  const [brief, setBrief] = useState("");
  const [region, setRegion] = useState("ghana");
  const [running, setRunning] = useState(false);

  const runBrief = () => {
    if (!brief.trim() || running) return;
    setRunning(true);
    window.setTimeout(() => setRunning(false), 1200);
  };

  const tabs: readonly TabItem[] = [
    {
      value: "activity",
      label: "Live activity",
      content: (
        <div className="activity-list">
          {activity.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="activity-item">
                <span
                  className={`activity-item__icon activity-item__icon--${item.tone}`}
                >
                  <Icon size={17} />
                </span>
                <div className="activity-item__copy">
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                </div>
                <time>{item.time}</time>
              </div>
            );
          })}
        </div>
      ),
    },
    {
      value: "signals",
      label: "Priority signals",
      content: (
        <div className="signal-grid">
          <div>
            <Badge variant="verification" verification="verified" /> Monetary
            policy brief
          </div>
          <div>
            <Badge variant="confidence" confidence={88} /> Climate resilience
            report
          </div>
          <div>
            <Badge status="queued" /> West Africa markets desk
          </div>
        </div>
      ),
    },
    {
      value: "system",
      label: "System health",
      content: (
        <div className="system-health">
          <CheckCircle2 size={34} />
          <div>
            <strong>All foundation systems operational</strong>
            <p>
              Theme, navigation, motion, and interface primitives are ready.
            </p>
          </div>
        </div>
      ),
    },
  ];

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
            <span className="live-signal" />
            Command centre online
          </div>
          <h1>Good evening, Kofi.</h1>
          <p>
            Your intelligence network is synchronized. Here is the signal that
            matters now.
          </p>
        </div>
        <div className="dashboard-hero__actions">
          <Button size="sm" variant="ghost">
            <Clock3 size={16} /> View timeline
          </Button>
          <Button size="sm">
            <Sparkles size={16} /> New intelligence brief
          </Button>
        </div>
      </motion.section>

      <motion.section
        aria-label="Operational metrics"
        className="metrics-grid"
        transition={reduceMotion ? { duration: 0 } : fadeInTransition}
        variants={fadeIn}
      >
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card
              key={metric.label}
              className="metric-card"
              variant="interactive"
            >
              <div
                className={`metric-card__icon metric-card__icon--${metric.tone}`}
              >
                <Icon size={19} />
              </div>
              <div className="metric-card__value-row">
                <strong>{metric.value}</strong>
                <Badge status="running">{metric.change}</Badge>
              </div>
              <span>{metric.label}</span>
              <div className="metric-card__spark" aria-hidden="true">
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
              </div>
            </Card>
          );
        })}
      </motion.section>

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
                <h2>Command the next brief</h2>
              </div>
              <Badge status="running">AI ready</Badge>
            </div>
            <p className="section-description">
              Frame a question for the Nexus intelligence layer. Phase 1 runs a
              local interaction while the hybrid API boundary is prepared.
            </p>
            <Input
              icon={<Sparkles size={17} />}
              label="Brief objective"
              onChange={setBrief}
              placeholder="e.g. Map the strongest AI policy signals across Africa"
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
              <Button
                disabled={!brief.trim()}
                loading={running}
                onClick={runBrief}
              >
                {running ? "Composing brief" : "Compose brief"}
                {!running ? <ArrowUpRight size={16} /> : null}
              </Button>
            </div>
          </GlassCard>
        </motion.section>

        <motion.section
          transition={reduceMotion ? { duration: 0 } : slideUpTransition}
          variants={slideUp}
        >
          <Card className="network-card" variant="glass">
            <div className="section-heading">
              <div>
                <span className="section-kicker">
                  <Radio size={13} /> Live network
                </span>
                <h2>Agent constellation</h2>
              </div>
              <Badge variant="confidence" confidence={96} />
            </div>
            <div className="constellation" aria-label="12 connected AI agents">
              <div className="constellation__orbit constellation__orbit--outer" />
              <div className="constellation__orbit constellation__orbit--inner" />
              <span className="constellation__node constellation__node--one" />
              <span className="constellation__node constellation__node--two" />
              <span className="constellation__node constellation__node--three" />
              <span className="constellation__node constellation__node--four" />
              <div className="constellation__core">
                <Sparkles size={23} />
              </div>
            </div>
            <div className="network-card__footer">
              <span>
                <Activity size={14} /> 847 events/min
              </span>
              <span>
                <span className="live-signal" /> 12 connected
              </span>
            </div>
          </Card>
        </motion.section>
      </div>

      <motion.section
        transition={reduceMotion ? { duration: 0 } : fadeInTransition}
        variants={fadeIn}
      >
        <Card className="activity-card" variant="glass">
          <Tabs ariaLabel="Network intelligence views" items={tabs} />
        </Card>
      </motion.section>

      <motion.section
        aria-label="Loading state example"
        className="foundation-strip glass"
        transition={reduceMotion ? { duration: 0 } : fadeInTransition}
        variants={fadeIn}
      >
        <div>
          <span className="section-kicker">Foundation readiness</span>
          <strong>
            8 reusable primitives · 2 themes · reduced-motion safe
          </strong>
        </div>
        <div
          className="foundation-strip__skeletons"
          aria-label="Skeleton component preview"
        >
          <Skeleton height={8} width={88} />
          <Skeleton height={8} width={54} />
          <Skeleton height={8} width={72} />
        </div>
        <Badge variant="verification" verification="verified">
          Phase 1
        </Badge>
      </motion.section>
    </motion.div>
  );
}
