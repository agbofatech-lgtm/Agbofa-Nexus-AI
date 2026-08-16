"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  CheckCircle2,
  Globe2,
  Radio,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { LandingCTA } from "@/components/features/public/LandingCTA";
import {
  fadeIn,
  fadeInTransition,
  slideUp,
  slideUpTransition,
} from "@/lib/animations/presets";

export function LandingHero() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="landing-hero" aria-labelledby="landing-title">
      <div aria-hidden="true" className="landing-hero__atmosphere">
        <span className="landing-orbit landing-orbit--one" />
        <span className="landing-orbit landing-orbit--two" />
        <span className="landing-signal landing-signal--one" />
        <span className="landing-signal landing-signal--two" />
        <span className="landing-signal landing-signal--three" />
      </div>

      <motion.div
        animate="animate"
        className="landing-hero__content"
        initial={reduceMotion ? false : "initial"}
      >
        <motion.div
          className="landing-hero__eyebrow"
          transition={reduceMotion ? { duration: 0 } : fadeInTransition}
          variants={fadeIn}
        >
          <span className="live-signal" />
          Ghana born · globally intelligent
        </motion.div>

        <motion.h1
          id="landing-title"
          transition={reduceMotion ? { duration: 0 } : slideUpTransition}
          variants={slideUp}
        >
          <span className="landing-hero__brand">AGBOFA NEXUS AI</span>
          <span>AI-powered media for</span>
          <span className="landing-hero__future">
            technology, innovation &amp; the future.
          </span>
        </motion.h1>

        <motion.p
          className="landing-hero__lede"
          transition={reduceMotion ? { duration: 0 } : slideUpTransition}
          variants={slideUp}
        >
          Technology <i /> Innovation <i /> Business <i /> Science <i /> News
          <br />
          <strong>Ghana · Africa · Beyond</strong>
        </motion.p>

        <motion.div
          transition={reduceMotion ? { duration: 0 } : slideUpTransition}
          variants={slideUp}
        >
          <LandingCTA />
        </motion.div>

        <motion.div
          className="landing-hero__proof"
          transition={reduceMotion ? { duration: 0 } : fadeInTransition}
          variants={fadeIn}
        >
          <span>
            <CheckCircle2 size={14} /> Verified intelligence
          </span>
          <span>
            <ShieldCheck size={14} /> Confidence on every claim
          </span>
          <span>
            <Globe2 size={14} /> Local context, global reach
          </span>
        </motion.div>
      </motion.div>

      <motion.aside
        animate={{ opacity: 1, y: 0 }}
        aria-label="Nexus intelligence network status"
        className="landing-intelligence-map glass"
        initial={reduceMotion ? false : { opacity: 0, y: 24 }}
        transition={{
          delay: reduceMotion ? 0 : 0.25,
          duration: reduceMotion ? 0 : 0.65,
        }}
      >
        <div className="landing-intelligence-map__heading">
          <span>
            <Radio size={13} /> Intelligence network
          </span>
          <strong>LIVE</strong>
        </div>
        <div className="landing-intelligence-map__visual" aria-hidden="true">
          <span className="network-ring network-ring--one" />
          <span className="network-ring network-ring--two" />
          <span className="network-link network-link--one" />
          <span className="network-link network-link--two" />
          <span className="network-point network-point--one" />
          <span className="network-point network-point--two" />
          <span className="network-point network-point--three" />
          <span className="network-point network-point--four" />
          <span className="network-core">
            <Sparkles size={24} />
          </span>
        </div>
        <div className="landing-intelligence-map__metrics">
          <div>
            <strong>32</strong>
            <span>AI agents</span>
          </div>
          <div>
            <strong>94.8%</strong>
            <span>Confidence</span>
          </div>
          <div>
            <strong>24/7</strong>
            <span>Coverage</span>
          </div>
        </div>
      </motion.aside>
    </section>
  );
}
