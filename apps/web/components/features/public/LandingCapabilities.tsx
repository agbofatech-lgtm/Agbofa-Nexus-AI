"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  AudioLines,
  Bot,
  BrainCircuit,
  CheckCircle2,
  Image as ImageIcon,
  ScanSearch,
  Sparkles,
  TrendingUp,
  Video,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui";
import {
  slideUp,
  slideUpTransition,
  staggerContainer,
} from "@/lib/animations/presets";

interface Capability {
  id: string;
  number: string;
  title: string;
  summary: string;
  detail: string;
  icon: LucideIcon;
  stat: string;
  features: readonly string[];
}

const capabilities: readonly Capability[] = [
  {
    id: "agents",
    number: "01",
    title: "Agent Workforce",
    summary:
      "A transparent specialist registry for discovery, verification, creation, and learning.",
    detail:
      "Twenty-eight canonical frontend agent definitions demonstrate collaboration across editorial, truth, audience, production, and distribution workflows—with humans retaining final authority.",
    icon: Bot,
    stat: "28 registered definitions",
    features: ["Visible activity", "Human checkpoints", "Role-based trust"],
  },
  {
    id: "predictive",
    number: "02",
    title: "Predictive Intelligence",
    summary:
      "See the signal before it becomes the story—and understand why it matters.",
    detail:
      "The intelligence layer connects emerging patterns, regional context, audience momentum, and historical evidence into decision-ready briefs.",
    icon: BrainCircuit,
    stat: "Illustrative signal models",
    features: ["Trend detection", "Context graphs", "Priority scoring"],
  },
  {
    id: "verification",
    number: "03",
    title: "Verification Engine",
    summary:
      "Every claim carries evidence, provenance, and a visible confidence score.",
    detail:
      "Evidence chains, source diversity, contradiction detection, and human review combine to make trust inspectable—not merely asserted.",
    icon: ScanSearch,
    stat: "Inspectable confidence UX",
    features: ["Claim evidence", "Source provenance", "Correction trails"],
  },
  {
    id: "multimodal",
    number: "04",
    title: "Multimodal Studio",
    summary:
      "Turn verified intelligence into exceptional stories for every format.",
    detail:
      "Compose text, visual, audio, and video narratives from one verified source of truth while preserving brand and factual integrity.",
    icon: Sparkles,
    stat: "4 media modes",
    features: ["Editorial copilot", "Brand controls", "Format adaptation"],
  },
];

export function LandingCapabilities() {
  const reduceMotion = useReducedMotion();
  const [activeId, setActiveId] = useState(capabilities[0]?.id ?? "agents");
  const activeCapability =
    capabilities.find((capability) => capability.id === activeId) ??
    capabilities[0];

  const selectCapability = (id: string) => {
    setActiveId(id);
    window.requestAnimationFrame(() => {
      document.getElementById("capability-detail")?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    });
  };

  if (!activeCapability) return null;
  const ActiveIcon = activeCapability.icon;

  return (
    <section
      className="landing-capabilities"
      id="capabilities"
      aria-labelledby="capabilities-title"
    >
      <div className="public-section-heading">
        <div>
          <span className="section-kicker">The Nexus advantage</span>
          <h2 id="capabilities-title">
            One platform. Four intelligence superpowers.
          </h2>
        </div>
        <p>
          Built to turn information overload into trusted understanding and
          decisive action.
        </p>
      </div>

      <motion.div
        animate="animate"
        className="capability-grid"
        initial={reduceMotion ? false : "initial"}
        variants={staggerContainer}
      >
        {capabilities.map((capability) => {
          const Icon = capability.icon;
          const active = capability.id === activeId;
          return (
            <motion.button
              key={capability.id}
              aria-pressed={active}
              className="capability-card glass-card"
              onClick={() => selectCapability(capability.id)}
              transition={reduceMotion ? { duration: 0 } : slideUpTransition}
              type="button"
              variants={slideUp}
            >
              <span className="capability-card__number">
                {capability.number}
              </span>
              <span className="capability-card__icon">
                <Icon size={21} />
              </span>
              <strong>{capability.title}</strong>
              <p>{capability.summary}</p>
              <span className="capability-card__stat">{capability.stat}</span>
            </motion.button>
          );
        })}
      </motion.div>

      <div
        className="capability-detail glass-gold"
        id="capability-detail"
        aria-live="polite"
      >
        <div className="capability-detail__icon">
          <ActiveIcon size={28} />
        </div>
        <div className="capability-detail__copy">
          <Badge variant="category" category="AI">
            Selected capability
          </Badge>
          <h3>{activeCapability.title}</h3>
          <p>{activeCapability.detail}</p>
        </div>
        <ul>
          {activeCapability.features.map((feature) => (
            <li key={feature}>
              <CheckCircle2 size={14} /> {feature}
            </li>
          ))}
        </ul>
      </div>

      <div className="media-modes" aria-label="Supported media modes">
        <span>
          <ImageIcon size={15} /> Visual
        </span>
        <span>
          <AudioLines size={15} /> Audio
        </span>
        <span>
          <Video size={15} /> Video
        </span>
        <span>
          <TrendingUp size={15} /> Intelligence
        </span>
      </div>
    </section>
  );
}
