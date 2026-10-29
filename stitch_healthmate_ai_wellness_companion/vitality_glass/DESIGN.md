---
name: Vitality Glass
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#3d4a42'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#6d7a72'
  outline-variant: '#bccac0'
  surface-tint: '#006c4a'
  primary: '#006948'
  on-primary: '#ffffff'
  primary-container: '#00855d'
  on-primary-container: '#f5fff7'
  inverse-primary: '#68dba9'
  secondary: '#006a61'
  on-secondary: '#ffffff'
  secondary-container: '#86f2e4'
  on-secondary-container: '#006f66'
  tertiary: '#006194'
  on-tertiary: '#ffffff'
  tertiary-container: '#007bb9'
  on-tertiary-container: '#fdfcff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#85f8c4'
  primary-fixed-dim: '#68dba9'
  on-primary-fixed: '#002114'
  on-primary-fixed-variant: '#005137'
  secondary-fixed: '#89f5e7'
  secondary-fixed-dim: '#6bd8cb'
  on-secondary-fixed: '#00201d'
  on-secondary-fixed-variant: '#005049'
  tertiary-fixed: '#cce5ff'
  tertiary-fixed-dim: '#93ccff'
  on-tertiary-fixed: '#001d31'
  on-tertiary-fixed-variant: '#004b73'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 44px
    fontWeight: '800'
    lineHeight: 52px
    letterSpacing: -0.03em
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 40px
    letterSpacing: -0.025em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  title-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  metric-val:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '800'
    lineHeight: 32px
    letterSpacing: -0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-tablet: 1.5rem
  gutter-desktop: 2rem
  margin: 1.25rem
  margin-tablet: 2rem
  margin-desktop: 3rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system embodies an empathetic, luminous, and scientifically grounded wellness companion. The target audience spans health-conscious adults, individuals managing chronic conditions, and wellness seekers looking for encouraging, proactive health guidance.

The visual style unites **Organic Minimalism** with **Luminous Glassmorphism**. The experience prioritizes optimism over clinical sterility, utilizing warm light physics, expansive breathing room, and soft tactile elements to dissolve healthcare anxiety. Interfaces evoke natural vitality—fresh morning air, clear spring water, and restorative warmth—reinforcing trust, calm authority, and proactive empowerment.

## Colors

The color palette centers on therapeutic natural pigments balanced with high-clarity neutrals:

- **Primary (`#059669` / Mint Emerald):** Core brand actions, proactive affirmations, and baseline health state indicators. Paired with a brighter mint tone (`#10B981`) for micro-interactions and interactive states.
- **Secondary (`#0D9488` / Deep Ocean Teal):** Anchors secondary navigational components, analytical charts, and biometric containers. Complemented by `#14B8A6` for hover rings and luminous data gradients.
- **Tertiary (`#0284C7` / Radiant Sky Blue):** Expresses artificial intelligence processes, conversational prompts, hydration stats, and cognitive wellness tracking, supported by `#38BDF8`.
- **Accent Coral (`#F43F5E` / `#FF6B6B`):** Reserved for vital alerts, critical biometric anomalies, heart rate markers, and actionable reminders to preserve maximum urgency without punitive aggression.
- **Surface & Backgrounds:** Crisp off-white foundational canvas (`#F8FAFC`) layered with pure white elevated panels (`#FFFFFF`) and frosted glass overlays (`rgba(255, 255, 255, 0.78)`).
- **Text & Contrast:** Deep slate (`#0F172A`) ensures WCAG AAA compliant readability across all body copy, with subdued secondary labels rendered in `#475569`.

## Typography

The typography system relies exclusively on **Plus Jakarta Sans** for unified, highly legible typographic personality across all interfaces. Its geometric clarity, wide aperture, and friendly curved stems offer high readability for rapid metric scanning while maintaining warmth during conversational AI diagnostics.

- **Display & Headlines:** Set in bold and extrabold weights with snug negative tracking (`-0.015em` to `-0.03em`) to anchor dashboards and key coaching insights.
- **Metrics & Indicators:** Dedicated `metric-val` sizing guarantees immediate glanceability for heart rate, step count, and sleep score telemetry.
- **Body & Captions:** Kept at comfortable line heights (1.5x minimum) with neutral tracking to reduce visual fatigue during long medical summaries or AI dietary recommendations.

## Layout & Spacing

A mobile-first fluid layout governs the interface, transitioning into a multi-column structural grid on larger devices:

- **Mobile (< 768px):** 4-column fluid layout with `1.25rem` outer canvas padding and `1rem` column gutters. Components stack vertically, leveraging full horizontal card expanses.
- **Tablet (768px - 1023px):** 8-column layout with `2rem` outer margin and `1.5rem` gutters. Biometric panels sit side-by-side with conversational interfaces.
- **Desktop (1024px+):** 12-column system capped at `1280px` max content width, flanked by `3rem` margins and `2rem` gutters. Accommodates contextual sidebars and expansive metric trends.
- **Vertical Spacing Scale:** Built upon an 8-point rhythmic grid (using 4px half-steps via `space-xs`). Component padding never drops below `space-md` for interactive targets to protect touch precision.

## Elevation & Depth

Visual hierarchy combines physical light refraction with subtle, chromatic drop shadows to establish natural z-index separation:

- **Surface Level 0 (Base Canvas):** Flat, tinted canvas (`#F8FAFC`) setting the ground state.
- **Surface Level 1 (Resting Cards):** Elevated pure white containers featuring an ultra-subtle primary tint shadow: `0 8px 24px -4px rgba(13, 148, 136, 0.06), 0 2px 6px -1px rgba(15, 23, 42, 0.04)`. Outlined with a high-translucency boundary border: `1px solid rgba(226, 232, 240, 0.8)`.
- **Surface Level 2 (Floating Glass Overlays):** Interactive AI dialogue sheets, floating search pills, and active filter tabs utilize frosted glass: `backdrop-filter: blur(16px); background: rgba(255, 255, 255, 0.78); border: 1px solid rgba(255, 255, 255, 0.6); box-shadow: 0 16px 36px -6px rgba(2, 132, 199, 0.1)`.
- **Surface Level 3 (Modals & Alerts):** Highest tier, lifted with deep atmospheric depth: `0 24px 48px -12px rgba(15, 23, 42, 0.18)` over a dark tinted scrim (`rgba(15, 23, 42, 0.4)` with `backdrop-filter: blur(4px)`).

## Shapes

The shape system expresses biological warmth and ergonomic comfort. Standard elements feature 0.5rem (8px) corner softening, medium cards feature 1rem (16px), and signature wellness containers, bottom sheets, and hero metric clusters adopt `rounded-xl` at 1.5rem (24px).

Buttons, pill badges, and AI interaction tags use fully rounded pill terminals (`border-radius: 9999px`) to emphasize fluidity, safety, and touch-first engagement.

## Components

### Buttons
- **Primary:** Full pill profile (`rounded-full`), filled with Mint Emerald (`#059669`) with text in `#FFFFFF`. Hover transitions to `#047857` with subtle glow (`0 8px 20px -4px rgba(5, 150, 105, 0.35)`). Active state applies `scale(0.98)` tactile feedback.
- **Secondary:** Ocean Teal tint (`rgba(13, 148, 136, 0.12)`) with `#0D9488` text; transitions to translucent hover state without harsh border lines.
- **Glass / Floating Action:** Frosted background (`rgba(255, 255, 255, 0.85)`), `#0284C7` icon/text, with 1px border `rgba(255, 255, 255, 0.8)`.

### Cards & Metric Containers
- **Health Cards:** Bounded by `20px-24px` radius (`rounded-xl`), containing generous padding (`space-lg`). Background uses pure white or faint ambient gradient (Mint to Sky Blue at 4% opacity).
- **Status Badges:** Miniature rounded pills inside cards displaying positive health states with green indicators (`#10B981` soft background with `#065F46` label).

### Input Fields & Search Bars
- Inputs feature `16px` border-radius (`rounded-lg`), padded at `14px 20px`. Background in light slate (`#F1F5F9`), transitioning to pure white on focus with a dual-ring highlight: a 1.5px solid `#0D9488` stroke encircled by a 4px soft teal ring (`rgba(13, 148, 136, 0.15)`).

### Chips & Health Filters
- Pill-shaped tags (`border-radius: 9999px`) with `8px 16px` padding. Unselected chips exhibit low-contrast slate tones; active selections leverage radiant sky blue (`#0284C7`) or fresh mint (`#059669`) fills with crisp white typography.

### Checkboxes & Radio Controls
- Circular checks and radios with smooth ease-spring transitions. Active state delivers a rich teal fill featuring an organic white checkmark icon. Ring states feature soft focus ripples.

### AI Companion Bubble & Diagnostics
- Asymmetric conversational modules: AI speech panels use `24px 24px 24px 6px` radius in frosted glass, paired with a glowing dual-tone border (`#38BDF8` to `#10B981`). User messages take a solid emerald fill with inverted corner radii (`24px 24px 6px 24px`).
