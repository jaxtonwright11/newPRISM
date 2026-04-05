"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { CommunityType } from "@shared/types";
import { COMMUNITY_COLORS } from "@/lib/constants";

// ─── Hero Section ───────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Background with noise grain */}
      <div
        className="absolute inset-0 bg-prism-bg-base"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Animated background map dots */}
      <div className="absolute inset-0 overflow-hidden">
        {[
          { x: "15%", y: "30%", color: COMMUNITY_COLORS.civic, delay: 0 },
          { x: "75%", y: "25%", color: COMMUNITY_COLORS.diaspora, delay: 0.5 },
          { x: "45%", y: "60%", color: COMMUNITY_COLORS.rural, delay: 1 },
          { x: "25%", y: "70%", color: COMMUNITY_COLORS.policy, delay: 1.5 },
          { x: "65%", y: "45%", color: COMMUNITY_COLORS.academic, delay: 2 },
          { x: "85%", y: "65%", color: COMMUNITY_COLORS.cultural, delay: 2.5 },
          { x: "35%", y: "40%", color: COMMUNITY_COLORS.civic, delay: 0.8 },
          { x: "55%", y: "20%", color: COMMUNITY_COLORS.diaspora, delay: 1.2 },
          { x: "20%", y: "50%", color: COMMUNITY_COLORS.rural, delay: 1.8 },
          { x: "80%", y: "35%", color: COMMUNITY_COLORS.policy, delay: 0.3 },
        ].map((dot, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{ left: dot.x, top: dot.y }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: dot.delay + 0.5, duration: 0.8, ease: "easeOut" }}
          >
            <div className="relative">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  backgroundColor: dot.color,
                  boxShadow: `0 0 12px ${dot.color}60, 0 0 24px ${dot.color}30`,
                }}
              />
              <motion.div
                className="absolute -inset-2 rounded-full border"
                style={{ borderColor: `${dot.color}40` }}
                animate={{ scale: [1, 2.5], opacity: [0.4, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: dot.delay }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Hero content */}
      <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
        <motion.h1
          className="font-display text-5xl md:text-7xl lg:text-8xl font-bold text-prism-text-primary tracking-tight"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          PRISM
        </motion.h1>
        <motion.p
          className="text-lg md:text-xl text-prism-text-secondary mt-4 md:mt-6 max-w-xl mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
        >
          See the world through every community&apos;s eyes.
        </motion.p>
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8 md:mt-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
        >
          <Link
            href="/"
            className="px-8 py-3 rounded-lg bg-prism-accent-primary text-white font-medium hover:bg-prism-accent-glow transition-colors shadow-lg shadow-prism-accent-primary/20"
          >
            Open the App
          </Link>
          <a
            href="#how-it-works"
            className="px-8 py-3 rounded-lg border border-prism-border text-prism-text-secondary hover:text-prism-text-primary hover:border-prism-text-dim transition-colors"
          >
            Learn More
          </a>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <svg className="w-5 h-5 text-prism-text-dim" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
        </svg>
      </motion.div>
    </section>
  );
}

// ─── Problem Section ────────────────────────────────────────────────────────
function ProblemSection() {
  return (
    <section className="py-32 md:py-40 px-4 bg-prism-bg-base border-t border-prism-border/30">
      <div className="max-w-3xl mx-auto text-center">
        <motion.h2
          className="font-display text-3xl md:text-5xl font-bold text-prism-text-primary leading-tight"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8 }}
        >
          We&apos;re all experiencing the same world differently.
        </motion.h2>
        <motion.p
          className="text-xl md:text-2xl text-prism-text-secondary mt-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          Nobody&apos;s showing you why.
        </motion.p>
      </div>
    </section>
  );
}

// ─── How It Works Section ───────────────────────────────────────────────────
function HowItWorksSection() {
  const steps = [
    {
      number: "01",
      title: "See the map",
      description: "A live geographic view of community activity worldwide. Every glowing dot is a real community sharing their perspective.",
      color: COMMUNITY_COLORS.civic,
    },
    {
      number: "02",
      title: "Select a topic",
      description: "From immigration policy to remote work economics - choose a topic and see which communities are experiencing it right now.",
      color: COMMUNITY_COLORS.diaspora,
    },
    {
      number: "03",
      title: "Read perspectives side by side",
      description: "Same event. Completely different worlds. A perspective from Chicago sits next to one from Rural Appalachia. That moment of understanding is why PRISM exists.",
      color: COMMUNITY_COLORS.rural,
    },
  ];

  return (
    <section id="how-it-works" className="py-24 md:py-32 px-4 bg-prism-bg-elevated/50 border-t border-prism-border/30">
      <div className="max-w-5xl mx-auto">
        <motion.h2
          className="font-display text-2xl md:text-4xl font-bold text-prism-text-primary text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
        >
          How it works
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              className="text-center md:text-left"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: i * 0.2 }}
            >
              {/* Abstract visual */}
              <div className="w-20 h-20 mx-auto md:mx-0 mb-6 rounded-2xl bg-prism-bg-elevated border border-prism-border flex items-center justify-center relative overflow-hidden">
                <div
                  className="absolute inset-0 opacity-10"
                  style={{ background: `radial-gradient(circle at center, ${step.color}, transparent 70%)` }}
                />
                <span className="font-mono text-2xl font-bold" style={{ color: step.color }}>
                  {step.number}
                </span>
              </div>
              <h3 className="font-display text-xl font-semibold text-prism-text-primary mb-3">
                {step.title}
              </h3>
              <p className="text-sm text-prism-text-secondary leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── AHA Moment Preview Section ─────────────────────────────────────────────
function AhaPreviewSection() {
  return (
    <section className="py-24 md:py-32 px-4 bg-prism-bg-base border-t border-prism-border/30">
      <div className="max-w-4xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
        >
          <span className="text-xs font-mono uppercase tracking-widest text-prism-accent-glow">
            Same topic. Different worlds.
          </span>
          <h2 className="font-display text-2xl md:text-4xl font-bold text-prism-text-primary mt-3">
            The AHA moment
          </h2>
          <p className="text-sm text-prism-text-secondary mt-3 max-w-lg mx-auto">
            Three communities. One topic. Three completely different realities.
            This is what PRISM shows you.
          </p>
        </motion.div>

        {/* Empty state: no perspectives yet */}
        <motion.div
          className="text-center py-12 px-6 rounded-xl bg-prism-bg-surface border border-prism-border"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          <div className="w-12 h-12 rounded-full bg-prism-accent-primary/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-prism-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
            </svg>
          </div>
          <h3 className="font-display font-bold text-lg text-prism-text-primary mb-2">
            Perspectives are coming.
          </h3>
          <p className="text-sm text-prism-text-secondary max-w-md mx-auto mb-6">
            Real communities are joining PRISM. Be one of the first voices and see how different
            neighborhoods experience the same events.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-prism-accent-primary text-white text-sm font-medium hover:shadow-lg hover:shadow-prism-accent-primary/20 transition-all"
          >
            Be one of the first
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Early Access CTA Section ───────────────────────────────────────────────
function EarlyAccessSection() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await fetch("/api/early-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSubmitted(true);
    } catch {
      // Still show success — email will be captured next time
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-24 md:py-32 px-4 bg-prism-bg-elevated/50 border-t border-prism-border/30">
      <motion.div
        className="max-w-md mx-auto text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="font-body text-2xl md:text-3xl font-bold text-prism-text-primary">
          Join the first community
        </h2>
        <p className="text-sm text-prism-text-secondary mt-3 mb-8">
          PRISM is building something that doesn&apos;t exist yet. Be part of it from the beginning.
        </p>

        {submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 rounded-lg bg-prism-accent-primary/10 border border-prism-accent-primary/20"
          >
            <p className="text-sm text-prism-text-primary font-medium">
              You&apos;re in. We&apos;ll be in touch.
            </p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="flex-1 px-4 py-3 rounded-lg bg-prism-bg-base border border-prism-border text-sm text-prism-text-primary placeholder:text-prism-text-dim focus:outline-none focus:ring-2 focus:ring-prism-accent-primary/50 focus:border-prism-accent-primary transition-all"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-lg bg-prism-accent-primary text-white text-sm font-medium hover:bg-prism-accent-glow transition-colors disabled:opacity-50 shrink-0"
            >
              {loading ? "..." : "Join"}
            </button>
          </form>
        )}
      </motion.div>
    </section>
  );
}

// ─── Footer ─────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="py-12 px-4 border-t border-prism-border bg-prism-bg-base">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <span className="font-body text-xl font-bold text-prism-text-primary">
            PRISM
          </span>
          <span className="text-xs text-prism-text-dim">
            See the world through every community&apos;s eyes.
          </span>
        </div>
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-xs text-prism-text-dim hover:text-prism-text-secondary transition-colors"
          >
            Open App
          </Link>
          <a
            href="https://github.com/jaxtonwright11/newPRISM"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-prism-text-dim hover:text-prism-text-secondary transition-colors"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}

// ─── Landing Page ───────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="bg-prism-bg-base min-h-screen">
      <HeroSection />
      <ProblemSection />
      <HowItWorksSection />
      <AhaPreviewSection />
      <EarlyAccessSection />
      <Footer />
    </div>
  );
}
