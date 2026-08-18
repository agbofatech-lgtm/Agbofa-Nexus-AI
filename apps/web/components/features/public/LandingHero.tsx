"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Eye,
  Globe2,
  Radio,
  Scale,
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
          <span className="demo-signal" />
          Media Intelligence Operating System · Ghana to global
        </motion.div>

        <motion.h1
          id="landing-title"
          transition={reduceMotion ? { duration: 0 } : slideUpTransition}
          variants={slideUp}
        >
          <span className="landing-hero__brand">AGBOFA NEXUS AI</span>
          <span>Covering the future,</span>
          <span className="landing-hero__future">today.</span>
        </motion.h1>

        <motion.p
          className="landing-hero__lede"
          transition={reduceMotion ? { duration: 0 } : slideUpTransition}
          variants={slideUp}
        >
          Turn media signals into verified editorial intelligence—then move
          from evidence to decisions, distribution, and measurable impact.
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
          <span><Scale size={14} /> Evidence before assertion</span>
          <span><ShieldCheck size={14} /> Human editorial authority</span>
          <span><Eye size={14} /> Transparent demo boundaries</span>
          <span><Globe2 size={14} /> Local context, global view</span>
        </motion.div>
      </motion.div>

      <motion.aside
        animate={{ opacity: 1, y: 0 }}
        aria-label="Nexus intelligence system preview"
        className="landing-intelligence-map glass"
        initial={reduceMotion ? false : { opacity: 0, y: 24 }}
        transition={{
          delay: reduceMotion ? 0 : 0.25,
          duration: reduceMotion ? 0 : 0.65,
        }}
      >
        <div className="landing-intelligence-map__heading">
          <span><Radio size={13} /> System topology</span>
          <strong>PREVIEW</strong>
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
          <span className="network-core"><Sparkles size={24} /></span>
        </div>
        <div className="landing-intelligence-map__metrics">
          <div><strong>28</strong><span>Agent definitions</span></div>
          <div><strong>DEMO</strong><span>Intelligence data</span></div>
          <div><strong>HUMAN</strong><span>Final authority</span></div>
        </div>
        <p className="landing-intelligence-map__authority">
          Interface demonstration · no live provider or production feed connected
        </p>
      </motion.aside>
    </section>
  );
}
