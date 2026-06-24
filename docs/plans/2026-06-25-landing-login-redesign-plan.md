# Landing + Login Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship a bold, playful, 2026-trendy landing page and refresh the split-screen login/register pages while preserving the Peeky brand identity and existing auth behavior.

**Architecture:** Use the `motion` package (Framer Motion v12) for React-friendly scroll reveals, staggered entrances, and hover physics. Keep the existing Fraunces + Inter typography and Peeky CSS variables. Add a new `landing.css` for page-specific static styles and bento-grid layouts. Landing, Login, and Register pages become Motion client components but remain simple Vite/React pages with no SSR concerns.

**Tech Stack:** React 18, Vite, TypeScript, CSS variables, `lucide-react` (already used), `motion` (new dependency).

---

## Task 1: Install the animation dependency

**Files:**
- Modify: `frontend/package.json`

**Step 1:** Add `motion` to dependencies.

```bash
cd frontend && npm install motion
```

**Step 2:** Verify `package.json` includes `"motion": "^12.x"`.

**Step 3:** Commit (if committing).

---

## Task 2: Add landing-page styles

**Files:**
- Create: `frontend/src/styles/landing.css`

**Step 1:** Create the file with the following content. It defines hero layout, bento grid, glass orbs, scroll indicator, reduced-motion fallbacks, and responsive collapse. It reuses Peeky tokens from `tokens.css`.

```css
/* frontend/src/styles/landing.css */

/* Hero layout */
.sm-hero {
  position: relative;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  padding: 6rem 0 3rem;
  overflow: hidden;
}

.sm-hero-grid {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: grid;
  grid-template-columns: 1fr;
  gap: 3rem;
  align-items: center;
}

@media (min-width: 960px) {
  .sm-hero-grid {
    grid-template-columns: 1.05fr 0.95fr;
    gap: 4rem;
  }
}

.sm-hero-copy {
  position: relative;
  z-index: 2;
}

.sm-hero-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 0.85rem;
  background: var(--paper);
  border: 1px solid var(--border);
  border-radius: 99px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 1.25rem;
}

.sm-hero-headline {
  font-family: var(--display);
  font-weight: 600;
  font-size: clamp(2.4rem, 6vw, 4.2rem);
  line-height: 1.05;
  letter-spacing: -0.03em;
  color: var(--ink);
  margin: 0 0 1.25rem;
}

.sm-hero-sub {
  font-size: 1.125rem;
  line-height: 1.65;
  color: var(--muted);
  max-width: 46ch;
  margin: 0 0 2rem;
}

.sm-hero-ctas {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.sm-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  height: 52px;
  padding: 0 1.6rem;
  border-radius: 14px;
  font-weight: 700;
  font-size: 1rem;
  border: 1px solid transparent;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.sm-btn-primary {
  background: var(--accent);
  color: #fff;
  box-shadow: var(--coral-glow);
}

.sm-btn-primary:hover {
  background: var(--accent-hover);
}

.sm-btn-secondary {
  background: var(--paper);
  color: var(--ink);
  border-color: var(--border);
}

.sm-btn-secondary:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.sm-btn:active {
  transform: scale(0.98);
}

/* Hero visual cluster */
.sm-hero-visual {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 320px;
}

.sm-hero-glow {
  position: absolute;
  width: 420px;
  height: 420px;
  background: radial-gradient(circle, rgba(255,107,107,0.22) 0%, rgba(255,107,107,0) 70%);
  border-radius: 50%;
  filter: blur(20px);
  animation: sm-hero-glow-pulse 6s ease-in-out infinite;
  pointer-events: none;
}

@keyframes sm-hero-glow-pulse {
  0%, 100% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.1); opacity: 1; }
}

.sm-bento-cluster {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  grid-template-rows: auto auto;
  gap: 1rem;
  width: min(100%, 420px);
  transform: rotate(-2deg);
}

.sm-bento-cluster > *:nth-child(1) { grid-row: span 2; }

.sm-bento-card {
  background: var(--paper);
  border: 1px solid var(--border);
  border-radius: 24px;
  padding: 1.25rem;
  box-shadow: var(--shadow);
}

.sm-bento-card-title {
  font-family: var(--display);
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--ink);
  margin: 0 0 0.4rem;
}

.sm-bento-card-meta {
  font-size: 0.8rem;
  color: var(--muted);
}

/* Stats strip */
.sm-stats {
  padding: 4rem 0;
  background: var(--surface);
  border-top: 1px solid var(--border-soft);
  border-bottom: 1px solid var(--border-soft);
}

.sm-stats-grid {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

@media (max-width: 720px) {
  .sm-stats-grid {
    grid-template-columns: repeat(3, minmax(160px, 1fr));
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    padding-bottom: 1rem;
  }
  .sm-stat {
    scroll-snap-align: start;
  }
}

.sm-stat {
  background: var(--paper);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 1.5rem;
  text-align: center;
}

.sm-stat-value {
  font-family: var(--display);
  font-size: 2rem;
  font-weight: 600;
  color: var(--accent);
  line-height: 1;
}

.sm-stat-label {
  font-size: 0.85rem;
  color: var(--muted);
  margin-top: 0.5rem;
}

/* Bento features */
.sm-features {
  padding: 5rem 0;
}

.sm-section-head {
  max-width: 1200px;
  margin: 0 auto 2.5rem;
  padding: 0 1.5rem;
  text-align: center;
}

.sm-section-head h2 {
  font-family: var(--display);
  font-size: clamp(2rem, 4.5vw, 3rem);
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--ink);
  margin: 0 0 0.5rem;
}

.sm-section-head p {
  color: var(--muted);
  font-size: 1.05rem;
  margin: 0;
}

.sm-bento-grid {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (min-width: 720px) {
  .sm-bento-grid {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(3, auto);
  }
  .sm-bento-feature:nth-child(1) {
    grid-row: span 2;
  }
  .sm-bento-feature:nth-child(4) {
    grid-column: span 2;
  }
}

.sm-bento-feature {
  position: relative;
  border-radius: 28px;
  padding: 1.75rem;
  border: 1px solid var(--border);
  overflow: hidden;
  min-height: 220px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.sm-bento-feature.coral { background: linear-gradient(135deg, var(--paper) 0%, var(--accent-soft) 100%); }
.sm-bento-feature.amber { background: linear-gradient(135deg, var(--paper) 0%, rgba(201,138,46,0.12) 100%); }
.sm-bento-feature.green { background: linear-gradient(135deg, var(--paper) 0%, rgba(92,158,110,0.12) 100%); }
.sm-bento-feature.rose  { background: linear-gradient(135deg, var(--paper) 0%, rgba(194,96,123,0.12) 100%); }

.sm-bento-feature h3 {
  font-family: var(--display);
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--ink);
  margin: 0 0 0.5rem;
}

.sm-bento-feature p {
  color: var(--muted);
  line-height: 1.55;
  margin: 0;
  max-width: 38ch;
}

.sm-bento-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--paper);
  border: 1px solid var(--border);
  color: var(--accent);
  margin-bottom: 1.25rem;
}

/* Steps */
.sm-steps {
  padding: 5rem 0;
  background: var(--surface);
}

.sm-steps-grid {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.25rem;
}

.sm-step {
  background: var(--paper);
  border: 1px solid var(--border);
  border-radius: 24px;
  padding: 1.5rem;
}

.sm-step-number {
  font-family: var(--display);
  font-size: 2.5rem;
  font-weight: 600;
  color: var(--accent);
  line-height: 1;
  margin-bottom: 0.75rem;
}

.sm-step h3 {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--ink);
  margin: 0 0 0.35rem;
}

.sm-step p { color: var(--muted); margin: 0; }

/* Final CTA */
.sm-cta-final {
  padding: 6rem 0;
  text-align: center;
  background: linear-gradient(160deg, var(--accent) 0%, var(--accent-press) 100%);
  color: #fff;
}

.sm-cta-final h2 {
  font-family: var(--display);
  font-size: clamp(2rem, 5vw, 3.5rem);
  font-weight: 600;
  letter-spacing: -0.02em;
  margin: 0 0 1.25rem;
}

.sm-cta-final p {
  font-size: 1.1rem;
  opacity: 0.9;
  margin: 0 0 1.75rem;
}

.sm-cta-final .sm-btn-primary {
  background: #fff;
  color: var(--accent);
  box-shadow: 0 12px 30px rgba(45,27,53,0.18);
}

.sm-cta-final .sm-btn-secondary {
  background: rgba(255,255,255,0.14);
  color: #fff;
  border-color: rgba(255,255,255,0.25);
}

/* Footer */
.sm-footer {
  padding: 2.5rem 0;
  border-top: 1px solid var(--border-soft);
}

.sm-footer-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.sm-footer-brand {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--display);
  font-weight: 600;
  font-size: 1.15rem;
  color: var(--ink);
}

.sm-footer-brand span:first-child {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: var(--accent);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
}

/* Scroll indicator */
.sm-scroll-hint {
  position: absolute;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  color: var(--muted);
  animation: sm-bounce 2s infinite;
  pointer-events: none;
}

@keyframes sm-bounce {
  0%, 100% { transform: translate(-50%, 0); }
  50% { transform: translate(-50%, 8px); }
}

/* Glass orbs for auth panels */
.sm-glass-orb {
  position: absolute;
  border-radius: 50%;
  background: rgba(255,255,255,0.08);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.12);
  pointer-events: none;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .sm-hero-glow,
  .sm-scroll-hint,
  .sm-glass-orb {
    animation: none !important;
  }
}

/* Dark mode tweaks */
[data-theme="dark"] .sm-bento-card,
[data-theme="dark"] .sm-stat,
[data-theme="dark"] .sm-bento-feature,
[data-theme="dark"] .sm-step {
  background: var(--paper);
  border-color: rgba(255,255,255,0.08);
}

[data-theme="dark"] .sm-hero-eyebrow {
  background: var(--surface);
  border-color: rgba(255,255,255,0.1);
}

[data-theme="dark"] .sm-btn-secondary {
  background: var(--surface);
}

[data-theme="dark"] .sm-stats,
[data-theme="dark"] .sm-steps {
  background: rgba(255,255,255,0.03);
}
```

**Step 2:** Import `landing.css` in `frontend/src/main.tsx` **after** `global.css`.

```tsx
import "./styles/tokens.css";
import "./styles/global.css";
import "./styles/landing.css"; // add this line
```

**Step 3:** Run `npm run build` to ensure CSS parses.

---

## Task 3: Rewrite Landing.tsx

**Files:**
- Modify: `frontend/src/pages/Landing.tsx`

**Step 1:** Replace the file with a component that uses `motion` for the hero kinetic headline, scroll reveals, and hover physics. Use existing `useAuth`, `useTheme`, Lucide icons, and the styles from `landing.css`.

Key structure:
- `const prefersReduced = useReducedMotion()` from `motion/react`.
- `containerVariants` and `childVariants` for staggered word reveals.
- `whileInView` sections for stats, bento, steps, CTA.
- `whileHover={{ y: -6, scale: 1.02 }}` on bento cards and buttons.
- Floating bento cluster in hero with static content (no fake screenshots—use real icon + text tiles).
- Theme toggle remains in top-right.

**Step 2:** Verify the page compiles and dark mode toggles correctly.

---

## Task 4: Animate Login.tsx

**Files:**
- Modify: `frontend/src/pages/Login.tsx`

**Step 1:** Add `motion` imports and `useReducedMotion`.

**Step 2:** Wrap the form side in a `motion.div` with `staggerChildren` entrance.

**Step 3:** Add two `sm-glass-orb` divs inside the art panel with slow infinite `animate` translation loops.

**Step 4:** Animate the primary button with `whileHover={{ scale: 1.02 }}` and `whileTap={{ scale: 0.98 }}`.

**Step 5:** Keep all existing validation, error handling, and Google sign-in intact.

---

## Task 5: Mirror animations in Register.tsx

**Files:**
- Modify: `frontend/src/pages/Register.tsx`

**Step 1:** Apply the same `motion` entrance, glass orbs, and button physics as Login.tsx.

**Step 2:** Ensure the form still validates name/email/password/confirm and registers via `AuthContext`.

---

## Task 6: Verify and lint

**Files:** None (verification only).

**Step 1:** Run frontend build from the `frontend/` directory.

```bash
cd frontend && npm run build
```

Expected: build succeeds with no TypeScript errors.

**Step 2:** Run lint.

```bash
cd frontend && npm run lint
```

Expected: no errors (warnings acceptable).

**Step 3:** Manually check:
- Landing page hero headline animates in.
- Scroll down triggers bento/steps reveals.
- Login art panel has drifting orbs.
- Register mirrors Login motion.
- Dark mode and reduced motion both degrade gracefully.

---

## Task 7: Update handoff.md

**Files:**
- Modify: `handoff.md`

**Step 1:** Add a short note under **Current Status** that the landing/login pages were redesigned with `motion`, new `landing.css`, and the design doc at `docs/plans/2026-06-25-landing-login-redesign-design.md`.

---

## Rollback plan
- If `motion` causes build issues, remove the package and revert to CSS-only animations using the keyframes already in `landing.css`.
- If the new landing page breaks routing, restore the original `Landing.tsx` from git.
