# Peeky — Design System

> Warm, intimate, authentic. The cozy way to share real life with the people who matter.

## What is Peeky?

Peeky is a **mobile app for sharing real, unfiltered photos with your closest circle** — family, best friends, your partner. You snap a photo in the moment and it lands directly on your people's **home-screen widget**. No filters, no public feed, no algorithm. Just a small, private circle.

- **Category:** like *Locket* (widget-based intimate photo sharing).
- **Audience:** Gen Z / Millennials in Vietnam (copy is bilingual-friendly, defaults Vietnamese).
- **Platform:** native mobile app (iOS / Android). Mobile is the only surface.
- **Feeling:** like *BeReal*, but cozier — warm, human, low-pressure, not corporate, not gaming.

### Sources
This system was **built from scratch** from a brand brief — there is no existing codebase, Figma, or screenshots. Direction provided by the founder:
- Background `#FDFAF6` (warm cream), primary `#2D1B35` (deep plum), CTA `#FF6B6B` (coral), surface `#F5F0EB`.
- Heading font **Fraunces**, body font **Inter**, signature border radius **24px**, soft/light shadows.
- Constraints: **no cold colors, no neon, no default dark mode.**

---

## Content fundamentals — how Peeky talks

**Voice:** a warm friend, not a brand. Talks *to* you ("bạn"), about *us* ("vòng tròn của bạn"). Speaks like a text from someone who loves you.

- **Person:** Second person ("bạn"), first-person plural for the circle. Never "the user," never "users."
- **Casing:** Sentence case everywhere. Titles, buttons, labels. Never Title Case, never ALL CAPS (except tiny tracked eyebrow labels).
- **Tone:** Warm, gentle, low-pressure. Encouraging, never demanding. "Gửi cho cả nhà một khoảnh khắc nhé" — not "Post now."
- **Length:** Short. A line, not a paragraph. Empty states get one cozy sentence + one action.
- **Emoji:** Used sparingly and warmly — ❤️ 🤍 ☕ 🌙 as accents in product moments (reactions, nudges), never in UI chrome or formal copy. Reactions are emoji-first.
- **Vietnamese-first** with natural code-switching ("widget," "story") where it reads naturally to young Vietnamese users.

**Examples**
- Capture CTA: *"Chụp gì đó cho mọi người 📸"*
- Empty feed: *"Chưa có gì ở đây cả. Gửi tấm đầu tiên nhé?"*
- Sent toast: *"Đã gửi tới 4 người thân ❤️"*
- Friend request: *"Linh muốn vào vòng tròn của bạn"*
- Push nudge: *"Mẹ vừa gửi cho bạn một khoảnh khắc ☕"*

Avoid: corporate verbs ("submit," "manage," "configure"), growth-hack urgency ("Don't miss out!"), gaming language ("streak," "level up," "XP"), cold systemy phrasing.

---

## Visual foundations

The whole system reads like **warm paper in soft afternoon light**. Cream backgrounds, deep-plum ink, one coral accent that does all the asking.

- **Color vibe:** Warm and analog. Cream paper (`--cream #FDFAF6`), plum ink (`--plum-800 #2D1B35`), a single coral CTA (`--coral-500 #FF6B6B`). Neutrals are warm taupe, never grey. Semantic colors stay warm (sage green, honey amber, dusty rose). **No cold hues, no neon, no pure black, no default dark mode.**
- **Typography:** Fraunces (soft serif, `SOFT` axis ~40, slightly editorial) for display & headings; Inter for body/UI. Big warm headlines, quiet legible body. Headings use a tiny negative letter-spacing.
- **Spacing:** 4px base rhythm; 20px screen gutters on mobile; generous breathing room — never cramped.
- **Backgrounds:** Flat warm cream. **No gradients on chrome.** Depth comes from soft shadows and layered surfaces (cream → surface → paper), not color washes. Photos themselves provide the imagery; the UI stays quiet around them.
- **Corner radii:** Pillowy. **24px (`--radius-lg`) is the signature** — buttons, cards, sheets. Photo cards & modals go 32px. Chips and round buttons are fully pill/circle.
- **Cards:** White/paper fill, 24–32px radius, soft low shadow (`--shadow-md`), hairline warm border optional (`--border`). No hard edges, no heavy borders, no colored left-border accents.
- **Shadows:** Soft, low, **plum-tinted** (never grey/black). `--shadow-sm/md/lg` for elevation; a dedicated coral glow (`--shadow-coral`) only on the primary shutter/CTA.
- **Borders:** Hairline warm taupe (`--line #E7DED3`), 1px. Used sparingly — shadows do most of the separating.
- **Animation:** Gentle and springy. Default ease `--ease-soft`; interactive moments use `--ease-spring` (tiny overshoot, ~1.56). Fades + soft scale, never harsh slides. The shutter has a satisfying squish. No infinite loops, no flashy motion.
- **Hover (where applicable / web/preview):** subtle — surfaces lift with a slightly stronger shadow; coral darkens to `--action-hover`.
- **Press states:** scale down to ~0.96 with the spring ease; coral CTA goes to `--action-press`. Tactile "squish," not a flat color flip.
- **Transparency & blur:** Used for overlays only — bottom sheets and toasts sit on a plum scrim (`--overlay-scrim`); the camera top/bottom bars use a soft cream blur. Not decorative.
- **Imagery:** Real, candid, warm-toned photos — kitchen tables, morning coffee, friends, pets. Slightly warm white balance. Never stocky, never cold, never b&w. Photos are framed in 24–32px rounded cards.

---

## Iconography

- **Set:** [**Lucide**](https://lucide.dev) — rounded line icons, 2px stroke, friendly and consistent. Loaded from CDN (`https://unpkg.com/lucide@latest`). This is a **substitution** chosen to fit the warm, soft, rounded brand (rounded line caps echo the 24px radii) — if you build the native app, match this stroke weight and roundness.
- **Stroke & sizing:** 2px stroke, 24px default, `currentColor` so they inherit text color (plum ink, or white on coral). Use 20px in dense rows, 28px+ for primary nav.
- **No icon font of our own**; no PNG icons. SVG only, via Lucide.
- **Emoji** are used as *content*, not icons — specifically for reactions (❤️ 🤍 😂 ☕ 🥹) and occasional warm copy accents. Never as functional UI icons.
- **Unicode glyphs:** avoided for UI; use Lucide.
- **The logomark** (`assets/logo/peeky-mark.svg`, plus an ink variant `peeky-mark-ink.svg`) is the only bespoke brand SVG: a plum widget tile with a coral "peek" lens.

---

## Index / manifest

**Root**
- `styles.css` — global entry point (link this one file). `@import` manifest only.
- `readme.md` — this guide.
- `SKILL.md` — Agent-Skill manifest for downloadable use.

**`tokens/`** — `fonts.css`, `colors.css`, `typography.css`, `spacing.css`, `radius.css`, `shadows.css`, `motion.css`, `base.css`.

**`assets/`** — `logo/peeky-mark.svg`, `logo/peeky-mark-ink.svg`.

**`guidelines/`** — foundation specimen cards shown in the Design System tab: colors (plum, coral, surfaces, accents, semantic), type (scale, display, body, eyebrow/label), spacing (scale, radii, shadows), brand (logo, voice).

**`components/`** — reusable primitives, grouped by concern:
- `actions/` — `Button`, `IconButton`, `ShutterButton` (the signature capture shutter)
- `display/` — `Avatar`, `AvatarGroup`, `Badge`, `Card`, `ReactionPill`
- `forms/` — `Input`, `Switch`, `SegmentedControl`

Each has `.jsx` + `.d.ts` + `.prompt.md`; one `@dsCard` per directory.

**`ui_kits/peeky-app/`** — interactive mobile recreation (onboarding → capture → feed → circle → profile) in an iOS frame. `index.html` is the click-through demo; screens are `Onboarding/Capture/Feed/Friends/Settings.jsx` composed by `app.jsx`.
