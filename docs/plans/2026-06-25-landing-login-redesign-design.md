# Landing + Login Redesign — Design Document

## Goal
Replace the current plain `Landing.tsx` and keep the signature split-screen `Login.tsx`/`Register.tsx`, but elevate both to a bold, playful, 2026-trendy experience that still belongs to the StudyMap/Peeky identity.

## Design read
**Vietnamese student/consumer study app**, warm Peeky palette, playful-but-premium energy, native-Vite-React stack. Leaning toward **Motion-powered scroll choreography + bento grids + glassmorphism accents** inside the existing cream/plum/coral token system.

## Trend signals used
- Story-driven hero with supporting visual (Notion/Linear/Framer pattern).
- Purposeful micro-animations (hover lift, focus glow, staggered reveals).
- Bento-grid feature section with asymmetric tile sizes.
- Subtle glassmorphism/frosted overlays on floating shapes.
- Kinetic type entrance in the hero.
- Single, benefit-driven CTAs.

## Dials
- `DESIGN_VARIANCE: 8` — asymmetric hero, mixed bento tiles.
- `MOTION_INTENSITY: 7` — scroll reveals, hover physics, floating orbs.
- `VISUAL_DENSITY: 4` — airy marketing page density.

## Must keep
- Fraunces display + Inter body.
- Peeky tokens (`--canvas`, `--surface`, `--paper`, `--ink`, `--accent`, `--accent-soft`, `--coral-glow`, dark-mode warm plum).
- Login/Register split-screen coral art panel + cream form.
- Vietnamese copy and existing auth wiring.
- `prefers-reduced-motion` safe fallbacks.

## New dependency
- `motion` (Framer Motion v12+) — React-friendly animations, scroll reveals, `useReducedMotion`.

## Landing page sections

### 1. Hero
- Full viewport (`min-h: 100dvh`), cream canvas.
- Left column (desktop) / stacked (mobile):
  - Eyebrow pill: `<Sparkles /> Sổ tay học tập` (coral dot/text, paper bg).
  - Kinetic headline: **“Học chậm lại, nhớ lâu hơn.”** — words fade/slide up in sequence.
  - Subcopy ≤ 20 words: *“Ghi chú, ôn tập theo lịch ghi nhớ và theo dõi tiến bộ mỗi ngày — nhẹ nhàng trước mỗi kỳ thi.”*
  - CTAs: primary “Bắt đầu ngay” (coral fill, coral glow), secondary “Đăng nhập” (ghost, plum border).
- Right column:
  - Floating bento preview cluster (3 tiles: note snippet, quiz badge, streak flame) with gentle hover drift and coral glow behind.
- Scroll indicator at bottom (subtle chevron pulse).

### 2. Mini social proof / stats
- 3 horizontally scrollable/snap pills on mobile, row on desktop.
- Animated counters: “Ghi chú đã tạo”, “Quiz đã làm”, “Ngày streak”.
- Use existing `--surface` pill background.

### 3. Bento features
- Asymmetric 4-tile grid:
  - Large left tile: **Ghi chú thông minh** (BlockNote preview, coral tint).
  - Top-right: **Quiz tự động** (amber tint).
  - Bottom-right: **Ôn tập đúng lịch** (green tint).
  - Full-width bottom tile: **Theo dõi streak** (rose tint, heatmap mini SVG).
- Each tile scroll-reveals with stagger; hover lifts and brightens.

### 4. How it works
- 3 step cards (numbered 01/02/03) with scroll reveal.
- Cards: write notes → take quiz → review on schedule.

### 5. Final CTA
- Coral gradient background, Fraunces headline, single register CTA.

### 6. Footer
- Minimal: brand, theme toggle, login/register links.

## Login / Register pages
- Keep the 44%/56% split-screen on desktop; full-screen form on mobile.
- Art panel:
  - Existing coral gradient (`linear-gradient(160deg, var(--accent), var(--accent-press))`).
  - Add two slow-drifting frosted “glass” orb shapes (`backdrop-filter: blur`, white/10 fill).
  - Headline and subcopy stay the same.
- Form side:
  - Staggered entrance: brand → fields → button → divider.
  - Inputs: focus ring expands with `motion` scale, error state rose glow.
  - CTA hover: coral glow pulse; `:active` scale 0.98.
  - Google button remains, but with hover lift.
- Register mirrors the same motion treatment.

## Animation spec
- Use `motion` components: `motion.div`, `motion.h1`, `motion.button`, `motion.section`.
- Scroll reveals via `whileInView` with `viewport={{ once: true, amount: 0.3 }}`.
- Entrance easing: `[0.16, 1, 0.3, 1]` (peeky ease).
- Hover: `y: -6`, `scale: 1.02`, shadow lift.
- Floating orbs: infinite slow translate-y loop, paused under reduced motion.
- Kinetic headline: `staggerChildren: 0.08` on parent, each word fades up.

## Responsive
- Desktop: 2-column hero, 4-cell bento.
- Tablet: stacked hero, 2-column bento.
- Mobile: single column, bottom tab safe padding, smaller headline (max 2 lines).

## Accessibility
- Honor `prefers-reduced-motion`: disable all continuous loops and set `whileInView`/`initial` to final state.
- WCAG AA contrast on all buttons and inputs.
- Focus rings visible.

## Files to change / create
- `frontend/package.json` — add `motion`.
- `frontend/src/styles/landing.css` — new hero/bento/animation utilities.
- `frontend/src/pages/Landing.tsx` — rewrite.
- `frontend/src/pages/Login.tsx` — add motion + glass orbs.
- `frontend/src/pages/Register.tsx` — same motion treatment as login.

## Success criteria
- `npm run build` passes.
- `npm run lint` passes.
- Landing page looks impressive on desktop and mobile, respects dark mode and reduced motion.
- Login/Register still authenticate correctly and match the brand.
