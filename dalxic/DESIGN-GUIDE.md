# DALXIC — MASTER DESIGN GUIDE

> This document defines the visual language for EVERY surface in the Dalxic platform.
> Every UI phase in BUILD-BLUEPRINT.md MUST reference this guide before building.
> No UI work starts without reading this document first.
>
> **Authority:** Founder-defined. No design decisions made without explicit approval.
> **Date:** 2026-04-18

---

## 1. THE FOUNDATION — Ops Aesthetic as Baseline

The `/ops` Master Command screen is the DNA. Every surface in the platform inherits from this foundation.

**What this means:**
- Dark foundation — `#040A0F` background, not just "dark mode"
- Glass morphism cards — blur backdrop, subtle borders, translucent surfaces
- Information density — stats, tables, charts visible at a glance, no wasted space
- Organizational clarity — grouped sections, clear hierarchy, nav groups, stat rows, content blocks
- Speaks as one — consistent card style, spacing, and typography across every screen. Every page feels like it belongs to the same system

**Reference:** `/Users/thecreator/Desktop/Operations design/Ops.png`

---

## 2. COLOR SYSTEM — Platform Signature + Vertical Accents + Strategic Infusion

**NOT one color. A color SYSTEM.**

### 2.1 Platform Signature

Emerald (`#10B981`) is the dominant platform identity. It says "this is Dalxic." It appears in:
- Primary CTAs
- Active nav states
- System status indicators
- Platform-level branding (logo accent, header badges)

### 2.2 Vertical Accents

Each vertical has its own accent color. They are siblings — related but distinct:

| Vertical | Accent | Personality |
|----------|--------|-------------|
| Health | TBD (founder defines) | Clinical, trust, precision |
| Trade | Amber/Gold family | Commerce, warmth, energy |
| Institute | Sky/Cyan family | Education, clarity, aspiration |
| Restaurant | TBD | Appetite, warmth, hospitality |
| Salon | TBD | Style, elegance, personal |
| Hotel | TBD | Luxury, comfort, refinement |
| Gym | TBD | Energy, power, vitality |
| Mechanic | TBD | Industrial, reliability, strength |
| Pharmacy | TBD | Medical, safety, care |
| Law | TBD | Authority, formality, gravitas |

> **Founder defines all vertical colors.** Above suggestions are placeholders — final palette comes from the founder.

### 2.3 Strategic Infusion

Beyond the dominant palette, color is used WHERE it creates impact:
- A stat number that pops
- A status indicator that draws the eye
- A highlight on a key data point
- A gradient moment on a headline

These aren't random — they serve information. Every color infusion makes the screen read faster or feel richer. If removing the color wouldn't lose meaning, it shouldn't be there.

### 2.4 Color Tokens (from ops baseline)

```
Platform:
  bg:        #040A0F       Dark foundation
  surface:   rgba(255,255,255,0.03–0.06)  Glass layers
  border:    rgba(255,255,255,0.08–0.12)  Subtle edges
  
Text:
  primary:   #ECF5F0       Bright text
  secondary: rgba(236,245,240,0.6)  Mid text
  muted:     rgba(236,245,240,0.35) Dim text

Accent:
  emerald:   #10B981       Platform signature
  amber:     #F59E0B       Trade / warm accent
  sky:       #0EA5E9       Institute / cool accent
  copper:    #D97706       Secondary warm
  red:       #EF4444       Critical / danger

Glows:
  emerald:   rgba(16,185,129,0.35)
  amber:     rgba(245,158,11,0.25)
  sky:       rgba(14,165,233,0.25)
```

> These tokens will evolve as the founder defines vertical colors. The structure stays — the values update.

---

## 3. PROPRIETARY TERMINOLOGY — TM Everything

**Every feature gets a name, not a description.**

### 3.1 The Principle

Competitors looking at the UI see trademarks, not a feature list they can copy-paste into their own product. The architecture is universal — the language is proprietary.

### 3.2 The Pattern

- **Nexus-7** = the engine (never "AI" or "Claude")
- Every module, capability, and feature surface gets its own coined term
- Terms are simple enough for customers to understand, but specific enough that they can't be mapped 1:1 to a generic feature
- "Simple but not straight" — the name communicates value without revealing implementation

### 3.3 Term Registry

> **Founder defines all terms.** No term is invented without explicit approval.
> This registry will grow as terms are defined:

| Term | What It Is | Used Where |
|------|-----------|------------|
| Nexus-7 | AI/ML engine | Platform-wide |
| DalxicOperations | The platform | Branding |
| DalxicHealth | Health vertical | Branding |
| DalxicTrade | Trade vertical | Branding |
| DalxicInstitute | Institute vertical | Branding |
| DalxicMedia | Forensic verification product | Separate product |
| *(more TBD by founder)* | | |

### 3.4 Application

- **Landing page:** Feature callouts use TM terms, not generic descriptions
- **Module workspace:** Module names are branded terms
- **Kiosk:** Tenant sees branded feature names
- **Ops:** Internal ops can use either (founder decides)

---

## 4. VISUAL ASSETS — Premium Vector System

### 4.1 Source & Quality

- **Premium infographic-style vectors** — sourced from Freepik premium tier or equivalent
- Not generic stock icons, not emoji, not flat minimal illustrations
- Information-rich, detailed, polished
- Licensable for commercial use

### 4.2 Visual DNA

All vectors across the platform share ONE style:
- Same illustration weight/thickness
- Same level of detail
- Same perspective/dimension style
- Same color treatment (adapted to section accent)

A Health vector looks like it belongs next to a Trade vector — they're from the same visual family, telling different stories.

### 4.3 Sectional Identity

Each vertical/section gets its own vector set:
- When you land on the Health section, the vectors say "healthcare" without reading a word
- Trade vectors say commerce instantly
- Institute vectors say education instantly
- The vectors DO the communication — text reinforces, it doesn't carry the load alone

### 4.4 Usage

- Landing page: section headers, feature illustrations, capability callouts
- Module workspace: module icons, empty states, onboarding
- Ops: dashboard illustrations, status visuals
- Kiosk: login screens, branding moments

---

## 5. TYPOGRAPHY — Hierarchy with Color Inheritance

### 5.1 Text Gradient & Accent

Headlines use a two-tone approach:
- Main words in white/light
- Power words in the section's accent color
- Example: "Run Your Business *With Precision*" — "With Precision" in emerald
- Example: "Retail *Reimagined*" — "Reimagined" in amber

This creates a gradient moment — the eye scans the white text and lands on the colored word. That word IS the message.

### 5.2 Color Flows Down the Hierarchy

When a section owns a color, EVERYTHING in that section carries it:

```
SECTION LABEL (spaced caps)     → Full section color
HEADLINE                        → White + accent on power word
Subtitle / body text            → Muted/desaturated version of section color
                                  NOT generic grey
```

Trade section body text = warm muted tone (not grey)
Health section body text = soft version of health's accent (not grey)
Institute body text = desaturated version of institute's accent (not grey)

The color doesn't stop at the headline — it bleeds into the whole section's atmosphere.

### 5.3 Font Selection

> **Founder approves final fonts.** Current ops baseline uses monospace for data (`Space Grotesk`) and sans-serif for UI.
> Landing page / marketing surfaces may use different display fonts — founder decides.

### 5.4 Sizing Hierarchy

```
Label (spaced caps):     12–14px, letter-spacing 2–4px, uppercase
Headline (hero):         48–72px, bold/heavy weight
Headline (section):      36–48px, bold
Subtitle:                18–22px, regular/medium
Body:                    15–17px, regular
Caption / meta:          12–14px, light/regular
```

> Exact sizes finalized during implementation. These are starting points.

---

## 6. LAYOUT — Center-Aligned Composition

### 6.1 Default Alignment

- **Center is the default** for all marketing/landing/presentation surfaces
- Headlines, subtitles, body text, section labels — all center-aligned
- The page reads like a presentation, not a blog post
- Creates symmetry and authority — content commands the viewport

### 6.2 Content Width

- Hero sections: full viewport presence, text centered in narrow column (~700–800px)
- Feature grids: cards in 2–3 column grid, grid itself centered
- Cards internally: can be left-aligned (text within a card), but the card arrangement centers
- Max content width: ~1200–1280px

### 6.3 Spacing Philosophy

- Generous vertical spacing between sections (120–160px)
- Sections breathe — never crowded
- Each section is a standalone visual panel
- Scroll = next chapter

---

## 7. COMPOSITION — Infographic Poster Aesthetic

### 7.1 The Feel

Every page feels like a curated infographic poster — not a website with sections, but a visual document designed to be understood at a glance.

### 7.2 Characteristics

- **Data visualization as design** — stats, numbers, capabilities presented as visual elements with weight, not text lists
- **Visual density done right** — packed with information but never cluttered. Every element earns its space
- **Print-quality on screen** — someone screenshots your page and it looks like a designed asset, not a webpage
- **Vectors + typography + data + color = one composed piece** — each section is a self-contained infographic panel flowing into the next

### 7.3 Section Composition

Each section on a page is a standalone infographic panel:
```
┌─────────────────────────────────────────┐
│         SECTION LABEL (spaced caps)      │
│                                          │
│     Headline with Accent Word            │
│                                          │
│     Subtitle in section's muted color    │
│                                          │
│  ┌──────┐  ┌──────┐  ┌──────┐          │
│  │ Card │  │ Card │  │ Card │          │
│  │ with │  │ with │  │ with │          │
│  │vector│  │vector│  │vector│          │
│  │ text │  │ text │  │ text │          │
│  └──────┘  └──────┘  └──────┘          │
│                                          │
└─────────────────────────────────────────┘
         ╲  wave/flow divider  ╱
┌─────────────────────────────────────────┐
│         NEXT SECTION LABEL               │
│              ...                         │
```

---

## 8. PAGE STRUCTURE — Editorial / Magazine-Grade Layout

### 8.1 Not a Website — A Magazine Spread

The page feels like it was designed in InDesign or Keynote and brought to life on screen. Editorial precision, not web-template energy.

### 8.2 Characteristics

- **Magazine-style composition** — intentional white space, type as design element, content blocks that breathe like a printed spread
- **Wave and flow dividers** — sections transition, not stack. Curved separators, flowing shapes. No hard lines between sections
- **Minimal but rich** — clean layouts that feel expensive. Few elements, each placed with precision
- **Presentation-grade** — like flipping through a keynote where every slide is a visual statement. Scroll = next slide
- **Typography carries weight** — large, bold headlines with confident sizing. Text IS the design

### 8.3 Transition Elements

Between sections:
- Subtle gradient fades
- Curved/wave dividers (SVG paths)
- Color temperature shifts (one section's glow fading into the next)
- NOT: hard lines, borders, or abrupt background changes

---

## 9. COMPONENT PATTERNS

### 9.1 Glass Cards

```
Background:   rgba(255,255,255,0.03–0.06)
Border:       1px solid rgba(255,255,255,0.08–0.12)
Border-top:   Can carry section accent color (2px solid accent)
Backdrop:     blur(12–20px)
Border-radius: 12–16px
Hover:        subtle brightness increase, optional glow
```

### 9.2 Buttons

```
Primary:      Filled with platform emerald, white text, rounded
Secondary:    Border-only (ghost), section color border, section color text
Danger:       Red variant (ops-only)
Sizing:       Comfortable padding (16px 32px), not cramped
```

### 9.3 Stat Blocks

```
Layout:       Value large + bold, label small + muted above or below
Color:        Value can carry accent color for emphasis
Sub-text:     Additional context line (e.g., "3 trial · 3 past due")
```

### 9.4 Data Tables (Ops/Workspace)

```
Header:       Muted text, uppercase, small
Rows:         Subtle hover, clickable → opens drawer
Borders:      Minimal — bottom border only, very subtle
Text:         Left-aligned within table
```

### 9.5 Drawers (Ops/Workspace)

```
Position:     Right side slide-in
Width:        400–600px
Background:   Surface color (slightly lighter than bg)
Footer:       Action buttons fixed at bottom
```

---

## 10. DARK THEME DETAILS

### 10.1 Depth Through Darkness

Not one flat dark color — layers of darkness create depth:

```
Layer 0 (page bg):     #040A0F
Layer 1 (cards):       rgba(255,255,255,0.03)
Layer 2 (elevated):    rgba(255,255,255,0.06)
Layer 3 (modal/drawer): rgba(255,255,255,0.08)
```

### 10.2 Light Sources

- Subtle radial gradients in background (emerald-tinted, very low opacity)
- Glow effects behind key elements (stats, active states)
- Particle/dot effects (as seen in landing page background) — small, sparse, atmospheric
- These create a sense of depth and premium-ness, not decoration

### 10.3 Never

- Never use pure white (#FFFFFF) for text — always slightly tinted (`#ECF5F0`)
- Never use pure black — always the dark blue-black (`#040A0F`)
- Never flat backgrounds without any texture/gradient/particle
- Never harsh contrast jumps between sections

---

## 11. RESPONSIVE BEHAVIOR

> **Founder defines breakpoint priorities.** Initial build targets desktop-first.
> Responsive adaptation follows after desktop is approved.

General principles:
- Desktop: full magazine-spread experience
- Tablet: maintained composition, columns may reduce (3→2)
- Mobile: single column, same center alignment, same color inheritance
- Touch targets: minimum 44px for interactive elements
- Cards: full-width on mobile, maintain glass morphism

---

## 12. APPLICATION MAP

How this design guide applies to each surface:

| Surface | Applies Rules |
|---------|--------------|
| **Landing page** | ALL rules — this is the fullest expression of the design language |
| **Ops screens** | Rules 1, 2.4, 9, 10 — already built to this standard |
| **Module workspace** | Rules 1, 2 (vertical accent), 5 (color inheritance), 9, 10 |
| **Kiosk login** | Rules 1, 2 (tenant's vertical accent), 6, 10 |
| **Placeholder pages** | Rules 1, 6, 10 — minimal but consistent |

---

## REVISION LOG

| Date | What Changed |
|------|-------------|
| 2026-04-18 | Initial design guide created from founder's 8 design directives |
