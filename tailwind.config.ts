import type { Config } from "tailwindcss";

/**
 * Vertlix AI — portable Tailwind token config.
 *
 * ⚠️ This project runs **Tailwind v4** (CSS-first). The canonical token source is
 * the `@theme` block in `src/styles/tokens.css`, which is already wired and does
 * NOT require this file. This config exists so the same tokens are portable to:
 *   • a Tailwind v3 project,
 *   • Figma / Style-Dictionary sync tooling that reads a JS config,
 *   • teams that prefer config-based theming (load via `@config "../tailwind.config.ts";`).
 *
 * It uses `extend` so Tailwind's numeric defaults (p-4, rounded-lg, gap-6) stay
 * intact — mirroring the additive, non-breaking design of the CSS `@theme`.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Primitives (ramps)
        neutral: {
          0: "#FFFFFF", 50: "#F8FAFC", 100: "#F1F5F9", 200: "#E5E7EB", 300: "#CBD5E1",
          400: "#9CA3AF", 500: "#6B7280", 600: "#4B5563", 700: "#374151", 800: "#1F2937",
          850: "#111827", 900: "#0B0F19", 950: "#05060A",
        },
        primary: {
          50: "#EEF0FF", 100: "#E0E3FF", 200: "#C6CBFF", 300: "#A5ABFF", 400: "#838BFB",
          500: "#6366F1", 600: "#4F46E5", 700: "#4338CA", 800: "#3730A3", 900: "#312E81", 950: "#1E1B4B",
        },
        secondary: {
          50: "#F5F3FF", 100: "#EDE9FE", 200: "#DDD6FE", 300: "#C4B5FD", 400: "#A78BFA",
          500: "#8B5CF6", 600: "#7C3AED", 700: "#6D28D9", 800: "#5B21B6", 900: "#4C1D95", 950: "#2E1065",
        },
        accent: {
          50: "#ECFEFF", 100: "#CFFAFE", 200: "#A5F3FC", 300: "#67E8F9", 400: "#22D3EE",
          500: "#06B6D4", 600: "#0891B2", 700: "#0E7490", 800: "#155E75", 900: "#164E63", 950: "#083344",
        },
        success: {
          50: "#ECFDF5", 100: "#D1FAE5", 200: "#A7F3D0", 300: "#6EE7B7", 400: "#34D399",
          500: "#10B981", 600: "#059669", 700: "#047857", 800: "#065F46", 900: "#064E3B", 950: "#022C22",
        },
        warning: {
          50: "#FFFBEB", 100: "#FEF3C7", 200: "#FDE68A", 300: "#FCD34D", 400: "#FBBF24",
          500: "#F59E0B", 600: "#D97706", 700: "#B45309", 800: "#92400E", 900: "#78350F", 950: "#451A03",
        },
        error: {
          50: "#FEF2F2", 100: "#FEE2E2", 200: "#FECACA", 300: "#FCA5A5", 400: "#F87171",
          500: "#EF4444", 600: "#DC2626", 700: "#B91C1C", 800: "#991B1B", 900: "#7F1D1D", 950: "#450A0A",
        },
        info: {
          50: "#EFF6FF", 100: "#DBEAFE", 200: "#BFDBFE", 300: "#93C5FD", 400: "#60A5FA",
          500: "#3B82F6", 600: "#2563EB", 700: "#1D4ED8", 800: "#1E40AF", 900: "#1E3A8A", 950: "#172554",
        },
        // Semantic (map to CSS vars so a single source drives both worlds)
        bg: "var(--color-background)",
        surface: "var(--color-surface)",
        card: "var(--color-card)",
        hairline: "var(--color-border)",
        "hairline-strong": "var(--color-border-strong)",
        ink: "var(--color-text-primary)",
        "ink-secondary": "var(--color-text-secondary)",
        "ink-muted": "var(--color-text-muted)",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        micro: ["11px", { lineHeight: "1.5" }],
        caption: ["12px", { lineHeight: "1.5" }],
        body: ["14px", { lineHeight: "1.65" }],
        title: ["18px", { lineHeight: "1.25", letterSpacing: "-0.01em" }],
        "h-sm": ["20px", { lineHeight: "1.25", letterSpacing: "-0.02em" }],
        "h-md": ["24px", { lineHeight: "1.25", letterSpacing: "-0.02em" }],
        "h-lg": ["28px", { lineHeight: "1.25", letterSpacing: "-0.02em" }],
        "h-xl": ["32px", { lineHeight: "1.2", letterSpacing: "-0.02em" }],
        "display-md": ["40px", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        "display-lg": ["48px", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        "display-xl": ["60px", { lineHeight: "1.1", letterSpacing: "-0.03em" }],
      },
      spacing: {
        "18": "72px", "88": "352px", "content": "1200px",
      },
      borderRadius: {
        chip: "10px", btn: "12px", card: "16px", panel: "22px",
      },
      boxShadow: {
        e1: "0 1px 2px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.045)",
        e2: "0 4px 24px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.05)",
        e3: "0 8px 32px rgba(0,0,0,0.28), 0 1px 2px rgba(0,0,0,0.40)",
        e4: "0 16px 48px rgba(0,0,0,0.40), 0 2px 4px rgba(0,0,0,0.40)",
        e5: "0 24px 70px rgba(0,0,0,0.55), 0 4px 8px rgba(0,0,0,0.40)",
        focus: "0 0 0 3px rgba(99,102,241,0.35)",
      },
      transitionTimingFunction: {
        standard: "cubic-bezier(0.22, 1, 0.36, 1)",
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      transitionDuration: {
        instant: "75ms", fast: "150ms", normal: "250ms", slow: "400ms", slower: "600ms", slowest: "900ms",
      },
      blur: { "e-sm": "6px", "e-md": "12px", "e-lg": "20px", "e-xl": "40px", "e-2xl": "60px" },
      zIndex: {
        raised: "10", sticky: "20", fixed: "30", dropdown: "40", popover: "50",
        overlay: "60", modal: "80", toast: "100", tooltip: "120",
      },
      maxWidth: { content: "1200px" },
      screens: { xs: "480px", "3xl": "1920px" },
    },
  },
  plugins: [],
};

export default config;
