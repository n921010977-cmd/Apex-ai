# Vertlix AI — Design Tokens

> **Foundation only.** This document + `src/styles/tokens.css` are the single
> source of truth for every value in the product. No screens, no components here —
> just the atoms all future UI is built from. Companion docs:
> [`DESIGN-PHILOSOPHY.md`](./DESIGN-PHILOSOPHY.md) (why) · [`03-Design-System.md`](./03-Design-System.md) (components).

**Source of truth:** [`src/styles/tokens.css`](../src/styles/tokens.css)
**Figma:** [`design/figma-variables.json`](../design/figma-variables.json)
**Tailwind:** v4 CSS-first via the `@theme` block in `tokens.css` (a portable
[`tailwind.config.ts`](../tailwind.config.ts) is provided for v3 / Figma-sync tooling).

---

## 0. Architecture — three layers, one rule

```
PRIMITIVE ──▶ SEMANTIC ──▶ COMPONENT ──▶ UI
 raw values   meaning       role          screens
 (indigo-500) (--color-     (--btn-        (never
              primary)       primary-bg)    hardcode)
```

**The rule:** a layer may only reference the layer directly above it.
Components read **semantic** and **component** tokens — never primitives, never
raw hex. Re-theming (light mode, rebrand, new accent) = editing primitives only.

**Naming:** `--{category}-{role}-{scale?}`. Kebab-case. Scale steps `50…950`,
`500` = pure brand step. Semantic names describe *meaning* (`surface`,
`text-primary`), never appearance (`gray-2`, `dark-bg`).

**Backward compatibility:** every legacy token the codebase already used
(`--accent`, `--r-card`, `--sp-4`, `--sh-2`, `--z-modal`, …) is preserved as an
alias resolving to an identical value. Verified: the compiled CSS is byte-for-byte
unchanged for those values. New code should prefer the semantic tokens.

---

## 1. Color

### 1.1 Primitives (palettes × 50→950)

Eight ramps. `500` is the brand step; `50–200` are tints (light UI, on-dark
tinted fills), `700–950` are shades (borders, pressed states, deep surfaces).
**Never use a primitive directly in a component** — go through semantic.

| Palette | Role | 500 |
|---|---|---|
| `--neutral-*` | Every surface & text tone (cool slate, dark-first) | `#6B7280` |
| `--indigo-*` | **Primary** — action, "AI is here" | `#6366F1` |
| `--violet-*` | **Secondary** — secondary emphasis, agent identity | `#8B5CF6` |
| `--cyan-*` | **Accent** — data, live signals (sparingly) | `#06B6D4` |
| `--emerald-*` | **Success** | `#10B981` |
| `--amber-*` | **Warning** | `#F59E0B` |
| `--red-*` | **Error** | `#EF4444` |
| `--blue-*` | **Info** | `#3B82F6` |

- **When to use each step:** `500` default; `400` hover-lighten on dark; `600`
  pressed / stronger; `600–700` gradients; `50–100` text-on-color & light tints;
  `900–950` deep surfaces & borders.
- **When NOT:** never mix two brand palettes in one section (see Philosophy P4).
  Cyan is not a second accent — it's for data/live states only.
- **Example:** primary button `linear-gradient(135deg, indigo-500, indigo-600)`;
  success chip `bg emerald-500/10, border emerald-500/30, text emerald-400`.

### 1.2 Semantic — surfaces & structure

| Token | Value | Use | Not for |
|---|---|---|---|
| `--color-background` | neutral-950 | The page | Cards (use surface) |
| `--color-surface` | neutral-900 | Raised solid panels, modals | Page bg |
| `--color-surface-2/3` | neutral-850 / `#1a2235` | Nested elevation | — |
| `--color-card` | white α3% | Card fill (glass over bg) | Opaque panels |
| `--color-card-hover` | white α5% | Card hover | Active/pressed |
| `--color-surface-hover/active` | α5% / α7% | List rows, ghost buttons | — |
| `--color-border` | white α7% | **Hairline** — all borders | Emphasis dividers |
| `--color-border-strong` | white α12% | Hover borders, outline buttons | Default borders |
| `--color-divider` | white α5% | Section separators | Interactive borders |
| `--color-overlay` | bg α60% | Modal scrim | Tooltips |
| `--color-modal` / `--color-sidebar` / `--color-navbar` | — | Chrome surfaces | — |
| `--color-selection` | indigo α30% | Text/row selection | Focus (use ring) |
| `--color-skeleton` | white α6% | Loading placeholders | Disabled |

- **When NOT:** never use pure `#000`/`#fff` as a surface — the ramp's `950`/`0`
  read as intentional; pure black/white read as unstyled.

### 1.3 Semantic — text & icons

| Text | Value | Use |
|---|---|---|
| `--color-text-primary` | neutral-200 `#E5E7EB` | Headings, body |
| `--color-text-secondary` | neutral-400 `#9CA3AF` | Supporting, captions |
| `--color-text-muted` | neutral-600 `#4B5563` | Timestamps, meta |
| `--color-text-disabled` | neutral-700 | Disabled labels |
| `--color-text-inverse` | neutral-950 | Text on light/accent fills |
| `--color-text-link` | indigo-400 | Links |

Icons mirror text: `--color-icon-primary/secondary/disabled` + `--color-icon-interactive`
(indigo) and `--color-icon-brand`. **Limit:** `text-muted` (`#4B5563`) fails AA
for body text on `#05060A` — use it only for decorative/meta, never primary reading.

### 1.4 Semantic — feedback (4 parts each)

Each of success / warning / error / info exposes: solid (`--color-success`),
tint bg (`--color-success-bg`, α10%), border (`--color-success-border`, α30%).

- **Best practice:** status = color **+** icon **+** text (never color alone —
  accessibility). Red is reserved for genuinely destructive/error states.

### 1.5 Component — buttons

`--btn-{variant}-bg / -fg / -hover` for `primary, secondary, ghost, outline,
danger, success, warning, link`. Variants read these, so a brand tweak never
touches button code.

---

## 2. Typography

- **Families:** `--font-sans` (Geist Sans, self-hosted) · `--font-mono` (Geist Mono).
- **Weights:** `--fw-regular 400 · medium 500 · semibold 600 · bold 700 · extrabold 800`.
- **Sizes:** rem-based `--text-11 … --text-60` (11–60px). **Never** hardcode px.
- **Line-height:** `--lh-tight 1.1 · snug 1.25 · normal 1.5 · relaxed 1.65 · loose 1.75`.
- **Letter-spacing:** `--ls-tight -0.02em` (headings) · `--ls-caps 0.14em` (uppercase labels).

**Composed levels** (size / weight / line-height / tracking — apply in the order below):

| Level | Size | Weight | LH | Tracking | Use |
|---|---|---|---|---|---|
| Display XL | 60 | 800 | tight | tighter | Marketing hero |
| Display LG | 48 | 800 | tight | tight | Landing section title |
| Display MD | 40 | 800 | tight | tight | Page hero (`--fs-h1`) |
| Heading XL | 32 | 800 | snug | tight | Major page heading |
| Heading LG | 28 | 700 | snug | tight | Section (`--fs-h2`) |
| Heading MD | 24 | 700 | snug | tight | Subsection |
| Heading SM | 20 | 600 | snug | normal | Card title (`--fs-h3`) |
| Title | 18 | 600 | snug | normal | List/panel title |
| Subtitle | 16 | 500 | normal | normal | Lead paragraph (`--fs-lg`) |
| Body Large | 16 | 400 | relaxed | normal | Long-form reading |
| Body Medium | 14 | 400 | relaxed | normal | **Default UI** (`--fs-body`) |
| Body Small | 13 | 400 | normal | normal | Dense tables |
| Caption | 12 | 400 | normal | normal | Meta (`--fs-caption`) |
| Label | 11 | 600 | normal | caps + uppercase | Eyebrow labels (`--fs-micro`) |
| Button | 13–14 | 700 | none | wide | Button text |
| Code | 13 | 400 mono | normal | normal | Inline/block code |
| Tooltip | 12 | 500 | snug | normal | Tooltips |

- **Best practice:** headings get `text-wrap: balance`; body line length ~65 chars;
  never go below 12px for reading text (a11y).

---

## 3. Spacing (8px grid)

`--space-0 … --space-64` (0–256px). Base grid is 8px; 4px & 2px/6px/10px sub-steps
exist only for dense controls (button padding, icon gaps).

- **Where:** `2` (icon↔label) · `3–4` (control padding) · `4–6` (card padding) ·
  `6–8` (between cards) · `10–16` (section gaps) · `24+` (page rhythm).
- **Rule:** lay out with flex/grid + `gap`, not per-element margins.
- **Never:** values off the scale (e.g. 7px, 13px, 30px). Legacy `--sp-1…24` alias in.

---

## 4. Border radius

| Token | px | Component |
|---|---|---|
| `--radius-none` | 0 | Full-bleed, tables |
| `--radius-xs / sm` | 6 / 8 | Tags, small chips, tooltips |
| `--radius-md` = `--radius-chip` | 10 | Icon tiles, chips, avatars-square |
| `--radius-lg` = `--radius-btn` | 12 | **Buttons, inputs** |
| `--radius-xl` = `--radius-card` | 16 | **Cards** |
| `--radius-2xl` = `--radius-panel` | 22 | Large panels, modals |
| `--radius-3xl` | 28 | Marketing feature blocks |
| `--radius-full` = `--radius-pill` | 9999 | Pills, toggles, round avatars |

- **Rule:** never mix radii on nested elements arbitrarily — a card (16) contains
  buttons (12) contains chips (10): each level steps down consistently.

---

## 5. Elevation / Shadow

Matte, neutral shadows — **never colored glow** (Philosophy anti-pattern #3).

| Token | Use | Not for |
|---|---|---|
| `--elevation-0` | Flush elements | — |
| `--elevation-1` (`--sh-1`) | Cards at rest | Modals |
| `--elevation-2` (`--sh-2`) | Hover-raised cards, dropdowns | Flat lists |
| `--elevation-3` (`--sh-3`) | Popovers, dropdowns | Cards at rest |
| `--elevation-4` | Floating panels | Inline elements |
| `--elevation-5` | Modals, command palette | Anything inline |
| `--shadow-inner` | Pressed inputs/wells | Raised elements |
| `--shadow-focus` | Focus ring (indigo α35%) | Decorative |
| `--shadow-glass` | Blurred glass surfaces | Opaque cards |
| `--shadow-modal / -dropdown / -popover` | Semantic aliases | — |

- **When NOT:** don't stack elevation on already-elevated parents (double shadows
  read muddy); don't use e4–e5 on inline content.

---

## 6. Motion

| Group | Tokens |
|---|---|
| Duration | `--duration-instant 75 · fast 150 · normal 250 · slow 400 · slower 600 · slowest 900` (ms) |
| Easing | `--ease-standard` (default, out-quint) · `-in` · `-out` · `-in-out` · `-spring` (overshoot) |
| Component | `--motion-hover · -button · -modal · -drawer · -tooltip · -toast` (duration + easing pairs) |

- **Use:** hover/micro `fast`; content enter `slow`; modal `normal`; toast `spring`.
- **Don't:** micro-interactions > 800ms; decorative infinite loops; animate everything
  at once. Always honor `prefers-reduced-motion`.

---

## 7. Opacity · 8. Blur · 9. Z-index

- **Opacity:** `--opacity-0 … -100` + semantic `--opacity-disabled 0.4`, `-muted 0.6`.
- **Blur:** `--blur-none … -3xl` (0–100px). `xl/2xl` for glass navbars & ambient glows.
- **Z-index (use these, never raw numbers):**
  `--z-hide -1 · base 1 · raised 10 · sticky 20 · fixed 30 · dropdown 40 · popover 50 ·
  overlay 60 · modal 80 · toast 100 · tooltip 120`. Legacy `--z-*` aliases preserved.

---

## 10. Grid & layout

- **Containers:** `--container-sm 640 · md 768 · lg 1024 · xl 1200 · 2xl 1440`;
  canonical content `--container-max 1200`.
- **Columns / gutters / margins:** desktop 12 / 24 / 64 · tablet 8 / 20 / 32 ·
  mobile 4 / 16 / 16.
- **Safe area:** `--safe-top/bottom/left/right` (`env(safe-area-inset-*)`).

## 11. Breakpoints

| Token | px | Devices |
|---|---|---|
| `xs` | 480 | Large phones (new) |
| `sm` | 640 | Landscape phones |
| `md` | 768 | Tablets |
| `lg` | 1024 | Small laptops / sidebar appears |
| `xl` | 1280 | Desktops |
| `2xl` | 1536 | Large desktops |
| `3xl` | 1920 | Wide / TV (new) |

`sm–2xl` match Tailwind defaults exactly (no behavior change); `xs` & `3xl` are additive.

## 12. Icons

Sizes `--icon-xs 12 · sm 14 · md 16 · lg 20 · xl 24 · 2xl 32`; stroke `--icon-stroke 2px`
(`-thin 1.5px`); one library (lucide), one weight. Icon reinforces text, never replaces it.

## 13. State

`--state-hover-overlay · -pressed-overlay · -active-overlay · -focus-ring ·
-disabled-opacity (0.4) · -selected-bg · -loading-opacity (0.6)`. Interaction states
are composed from these, so every control feels identical.

---

## 14. Figma Variables

Import [`design/figma-variables.json`](../design/figma-variables.json) (W3C DTCG
format — works with Tokens Studio / native Variables import). Collection structure:

```
Vertlix Tokens
├── Primitives   (Color/*, all 50–950 ramps)          — private, not for design use
├── Semantic     (Color/Surface, Color/Text, Color/Feedback, Color/Button)
├── Typography   (Family, Weight, Size, LineHeight, Tracking, Levels)
├── Spacing      (0–256)
├── Radius       (none–full + semantic)
├── Elevation    (0–5, inner, focus, semantic)
├── Motion       (Duration, Easing, Component)
├── Effects      (Opacity, Blur)
├── ZIndex
├── Layout       (Container, Grid, Breakpoint, Safe)
├── Icon
└── State
```

- **Modes:** the collection is authored for **Dark** (default). A **Light** mode is
  added later by overriding *Semantic* values only — Primitives never change per mode.
- **Rule:** designers bind components to **Semantic** variables, never Primitives.

## 15. Tailwind

This project is **Tailwind v4** — tokens are exposed via the `@theme` block in
`tokens.css` (already wired). Generated utilities (additive, non-colliding):
`bg-surface`, `text-ink`, `border-hairline`, `rounded-card`, `shadow-e2`,
`ease-standard`, `blur-e-xl`, `max-w-content`, `bg-primary-500`, etc. Tailwind's
numeric defaults (`p-4`, `rounded-lg`, `gap-6`) are untouched. A portable
[`tailwind.config.ts`](../tailwind.config.ts) mirrors the tokens for v3 projects
or Figma-sync tooling.

---

## 16. Verification & governance

**Checked (this foundation):**
- ✅ No duplicate tokens — legacy names are single-definition aliases; primitives
  are referenced once by semantics.
- ✅ Logical — strict primitive→semantic→component direction; no component reads a primitive.
- ✅ Scalable — new palette/mode = edit primitives; adding a token never forces a rename.
- ✅ Non-breaking — build passes, compiled CSS retains every legacy value (0 drift, verified).
- ✅ Modern-SaaS aligned — layered tokens, DTCG Figma export, Tailwind-native.

**Governance (keep it world-class for years):**
1. New value → add a **primitive** first, then reference it. Never inline a raw hex.
2. New component color → a **component** token referencing semantic; never a new primitive per component.
3. Deprecate, don't delete: keep an alias for one release cycle with a `/* deprecated */` note.
4. One PR may not add a token *and* use it in 50 places — land the token, then adopt.
5. `tokens.css`, this doc, and `figma-variables.json` change **together** (they are one artifact in three formats).
