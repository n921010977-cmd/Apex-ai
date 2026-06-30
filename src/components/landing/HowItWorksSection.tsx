"use client";

import { motion } from "framer-motion";

const STEPS = [
  { number: "01", title: "Describe Your Business", description: "Tell us about your idea, market, or company. Be as specific as you want — our AI understands context and nuance.", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-6"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg> },
  { number: "02", title: "CEO Delegates Work", description: "Your AI CEO analyzes the brief and assigns specialized tasks to each executive — CFO, CMO, COO, CTO, and more.", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-6"><circle cx="12" cy="5" r="3" /><path d="M12 8v3M8 14h8M6 18v-1a6 6 0 0 1 12 0v1" /></svg> },
  { number: "03", title: "Executives Work in Parallel", description: "All 8 AI executives simultaneously research, analyze, and create their domain-specific strategies — in real time.", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-6"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg> },
  { number: "04", title: "Premium Report Generated", description: "Your complete Business Strategy Report is assembled — financials, market analysis, roadmap, and everything in between.", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-6"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg> },
];

export function HowItWorksSection() {
  return (
    <section id="product" className="relative py-32 px-6 overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[800px] rounded-full bg-violet-600/5 blur-[150px] pointer-events-none" />
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/20 bg-blue-500/5 mb-6">
            <span className="text-xs text-blue-300 font-medium tracking-wide uppercase">How It Works</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
            From Idea to Strategy<br /><span className="gradient-text">in Under 5 Minutes</span>
          </h2>
          <p className="text-lg text-white/40 max-w-xl mx-auto">No meetings. No lengthy onboarding. Just describe your business and watch your executive team get to work.</p>
        </motion.div>

        <div className="relative">
          <div className="absolute top-10 left-[2.5rem] right-[2.5rem] h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent hidden lg:block" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.number}
                className="relative flex flex-col items-center text-center lg:items-start lg:text-left"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: i * 0.1, ease: "easeOut" }}
              >
                <div className="relative mb-6">
                  <div className="size-20 rounded-2xl glass-strong border border-violet-500/15 flex flex-col items-center justify-center gap-1">
                    <span className="text-[10px] text-violet-400/60 font-mono font-bold tracking-widest">{step.number}</span>
                    <span className="text-violet-300">{step.icon}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="absolute top-1/2 -right-4 text-white/20 hidden lg:block">
                      <svg className="size-4" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5l8 7-8 7" /></svg>
                    </div>
                  )}
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
