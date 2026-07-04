"use client";

import { motion, type Variants } from "framer-motion";

const cont: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } } };
const item: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

export function CtaBanner() {
  return (
    <section className="relative py-28 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-violet-900/20 via-blue-900/10 to-violet-900/20" />
      <div className="absolute inset-0 grid-pattern opacity-[0.06]" />

      {/* soft ambient bloom that drifts in */}
      <motion.div
        aria-hidden
        className="absolute left-1/2 top-1/2 pointer-events-none rounded-full"
        style={{
          width: 640, height: 320, x: "-50%", y: "-50%",
          background: "radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 68%)",
          filter: "blur(30px)",
        }}
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 1.1, ease: "easeOut" }}
      />

      <motion.div
        className="relative max-w-3xl mx-auto text-center"
        variants={cont}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-120px" }}
      >
        <motion.div
          variants={item}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-500/20 bg-violet-500/5 mb-6"
        >
          <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-violet-300/80 font-medium">Бесплатно · Без карты</span>
        </motion.div>

        <motion.h2
          variants={item}
          className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight"
          style={{ textWrap: "balance" } as React.CSSProperties}
        >
          Готовы построить свой бизнес?
        </motion.h2>

        <motion.p variants={item} className="text-lg text-white/40 mb-8 max-w-xl mx-auto">
          Присоединяйтесь к тысячам основателей, которые получают стратегии мирового уровня за считанные минуты.
        </motion.p>

        <motion.div variants={item} className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <motion.a
            href="/register"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="inline-flex items-center gap-3 h-14 px-8 text-base font-semibold bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-2xl hover:shadow-2xl hover:shadow-violet-500/30"
          >
            <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
            Начать бесплатно
          </motion.a>
          <motion.a
            href="/login"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="inline-flex items-center gap-2 h-14 px-8 text-base font-medium text-white/50 border border-white/[0.08] rounded-2xl hover:border-white/[0.15] hover:text-white/80"
          >
            Войти в аккаунт →
          </motion.a>
        </motion.div>

        <motion.p variants={item} className="mt-4 text-sm text-white/20">
          3 отчёта бесплатно · Без кредитной карты · Отмена в любой момент
        </motion.p>
      </motion.div>
    </section>
  );
}
