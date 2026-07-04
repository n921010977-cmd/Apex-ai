"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

const PLANS = [
  {
    name: "Starter", price: { monthly: 0, annual: 0 },
    description: "Perfect for exploring your first business idea.",
    cta: "Start Free", href: "/register",
    features: ["3 strategy reports / month","All 8 AI executives","PDF export","Basic financial model","Email support"],
    popular: false, gradient: "from-slate-600 to-gray-600",
  },
  {
    name: "Pro", price: { monthly: 49, annual: 39 },
    description: "For founders building and launching their business.",
    cta: "Start Pro Trial", href: "/register",
    features: ["Unlimited strategy reports","All 8 AI executives","Premium PDF export","Advanced financial models","Competitive intelligence","Priority processing","Slack integration","Priority support"],
    popular: true, gradient: "from-violet-600 to-blue-600",
  },
  {
    name: "Agency", price: { monthly: 149, annual: 119 },
    description: "For agencies and consultants with multiple clients.",
    cta: "Start Agency Trial", href: "/register",
    features: ["Everything in Pro","Unlimited client projects","White-label reports","Custom branding","Team collaboration","API access","Dedicated account manager","SLA guarantee"],
    popular: false, gradient: "from-amber-600 to-orange-600",
  },
];

export function PricingSection() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="relative py-32 px-6 overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] rounded-full bg-violet-600/6 blur-[120px] pointer-events-none" />
      <div className="max-w-5xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/20 bg-amber-500/5 mb-6">
            <span className="text-xs text-amber-300 font-medium tracking-wide uppercase">Simple Pricing</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
            Invest in Your Business.<br /><span className="gradient-text-gold">Not Your Overhead.</span>
          </h2>
          <p className="text-lg text-white/40 max-w-lg mx-auto">One McKinsey project costs $250,000+. Business Command Center costs less than a business lunch.</p>

          <div className="inline-flex items-center gap-1 mt-8 p-1 rounded-xl glass border border-white/[0.08]">
            {[
              { key: false, label: <>Monthly</> },
              { key: true,  label: <>Annual<span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">-20%</span></> },
            ].map((opt) => (
              <button
                key={String(opt.key)}
                onClick={() => setAnnual(opt.key)}
                className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${annual === opt.key ? "text-white" : "text-white/40 hover:text-white"}`}
              >
                {annual === opt.key && (
                  <motion.span
                    layoutId="pricing-toggle-pill"
                    className="absolute inset-0 rounded-lg bg-violet-600 shadow-lg shadow-violet-500/25"
                    transition={{ type: "spring", stiffness: 420, damping: 32 }}
                  />
                )}
                <span className="relative z-10">{opt.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              className={`relative rounded-2xl p-px ${plan.popular ? "md:scale-105 z-10" : ""}`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: "easeOut" }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
            >
              {/* Deep indigo ambient glow radiating from behind the Pro card */}
              {plan.popular && (
                <div
                  aria-hidden
                  className="absolute -inset-8 rounded-[32px] pointer-events-none transition-opacity duration-500"
                  style={{
                    background: "radial-gradient(ellipse at 50% 60%, rgba(99,102,241,0.35) 0%, rgba(124,58,237,0.18) 45%, transparent 75%)",
                    filter: "blur(28px)",
                    zIndex: -1,
                  }}
                />
              )}
              {plan.popular && <div className={`absolute inset-0 rounded-2xl bg-gradient-to-b ${plan.gradient} opacity-40`} />}
              <div className={`relative rounded-[15px] p-6 flex flex-col h-full ${plan.popular ? "bg-[#0d0d14]" : "bg-[#0f0f0f] border border-white/[0.07]"}`}>
                {plan.popular && <div className="absolute -top-px inset-x-6"><div className="h-px bg-gradient-to-r from-transparent via-violet-500 to-transparent" /></div>}
                {plan.popular && (
                  <div className="inline-flex self-start px-2.5 py-1 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 text-[10px] font-semibold uppercase tracking-wider mb-4">
                    Most Popular
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
                  <p className="text-xs text-white/40 mb-4">{plan.description}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">${annual ? plan.price.annual : plan.price.monthly}</span>
                    {plan.price.monthly > 0 && <span className="text-sm text-white/30">/month</span>}
                  </div>
                </div>
                <ul className="flex flex-col gap-2.5 flex-1 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2.5">
                      <div className={`size-4 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${plan.gradient} opacity-80`}>
                        <svg className="size-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                      </div>
                      <span className="text-sm text-white/60">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`inline-flex items-center justify-center h-11 px-6 rounded-xl text-sm font-semibold transition-all duration-200 ${plan.popular ? "bg-gradient-to-r from-violet-600 to-blue-600 text-white hover:from-violet-500 hover:to-blue-500 hover:shadow-lg hover:shadow-violet-500/25" : "glass border border-white/[0.08] text-white/70 hover:text-white hover:border-white/[0.15]"}`}
                >
                  {plan.cta}
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="mt-10 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          <div className="inline-flex items-center gap-2 text-sm text-white/35">
            <svg className="size-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
            14-day money-back guarantee — no questions asked
          </div>
        </motion.div>
      </div>
    </section>
  );
}
