# Vantage Circle — Product Design System

> **Single source of truth** for all UI across the product and the marketing site. Every primitive, component and pattern below is finalised and must be used as-is on every screen. If a component is not covered here, follow **shadcn/ui** — simple, clean, straightforward — adapted to the brand tokens below. When in doubt, prefer a token over a literal, a semantic class over a utility, and an existing pattern over a new one.

---

## 1. Foundation Principles

These are the non-negotiables. Every rule later in this document is downstream of one of these.

1. **Tokens, not literals.** Never write a raw hex, px, rem, or rgba in a component. If a token doesn't exist for the value you need, the value is wrong — pick the nearest token instead of inventing a new one.
2. **Semantic over primitive.** Reach for `--text-primary` before `--neutral-600`, `--color-error` before `--error-500`. Primitives are for defining tokens; semantics are for using them.
3. **One way to do each thing.** A button is a `.btn-*` class, not a hand-rolled `border-radius` + padding. A card is `.card`, not bespoke shadow + radius. Variants exist; reinventions don't.
4. **No `!important`.** It is the symptom of a specificity problem, not a fix. If you need it, you're styling at the wrong layer — fix the cascade or scope the selector instead.
5. **Brand colour is one ramp, not seven shades of purple.** All purple comes from the `--brand-*` ramp. Never hand-pick a "slightly different purple" — use the next step on the ramp.
6. **Light by default, dark by intention.** Surfaces are white or `--neutral-50/100`. Dark sections are reserved for trust strips, testimonials, gradient CTAs, and the footer — and never two in a row.
7. **Accent colour is loud — use it like punctuation.** Status colours (`success`, `error`, `warning`, `info`) communicate state. They never decorate. They never live alongside other status colours in the same component.
8. **Mobile-first responsive.** Every layout is designed for a 320–375 px viewport first, then upscaled at `sm`, `md`, `lg`, `xl`. If it doesn't work on mobile, it isn't done.

---

## 2. Typography

### Font Family

| Token | Stack |
|-------|-------|
| `--font-family-base` | `'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` |
| `--font-family-mono` | `ui-monospace, 'SF Mono', Consolas, monospace` |

`--font-family-mono` is reserved for: gift-card codes, employee IDs, copy-paste tokens, and code blocks. Never for body copy or headings.

**Self-host Inter** at `400`, `500`, `600`, and `700` weights from `public/fonts/`. All weights load with `font-display: swap`.

### Body Defaults

```css
body {
  font-family: var(--font-family-base);
  font-size: var(--font-size-md);          /* 14px */
  line-height: var(--line-height-base);    /* 1.5 */
  letter-spacing: var(--letter-spacing-normal);
  color: var(--text-primary);
}
p { color: var(--text-primary); }
small, .caption { color: var(--text-secondary); font-size: var(--font-size-xs); }
```

### Font Size Scale

| Token | px | rem | Usage |
|-------|-----|-----|-------|
| `--font-size-xs` | 11 | 0.6875 | Captions, timestamps, micro labels |
| `--font-size-sm` | 12 | 0.75 | Button labels, form labels, tags |
| `--font-size-dense` | 13 | 0.8125 | Table rows, sidebars, compact lists |
| `--font-size-md` ⬅ default | 14 | 0.875 | Body copy, table content, inputs |
| `--font-size-lg` | 16 | 1 | Subheadings, card titles |
| `--font-size-xl` | 18 | 1.125 | Section headings, modal titles |
| `--font-size-2xl` | 20 | 1.25 | Page titles |
| `--font-size-3xl` | 26 | 1.625 | Hero headings, congratulations screens |

> **Rule:** Body copy is always `--font-size-md` (14 px). Anything bigger than `--font-size-3xl` does not exist — design for hierarchy with weight and spacing, not size.

### Font Weight

| Token | Value | Usage |
|-------|-------|-------|
| `--font-weight-regular` | 400 | Body copy, captions |
| `--font-weight-medium` | 500 | Buttons, labels, navigation |
| `--font-weight-semibold` | 600 | Section headings, subheadings |
| `--font-weight-bold` | 700 | Page titles, key numbers, hero |

There are exactly four weights. `300`, `800`, and `900` are not part of the system.

### Line Height

| Token | Value | Usage |
|-------|-------|-------|
| `--line-height-tight` | 1.2 | All headings, single-line labels, buttons |
| `--line-height-base` | 1.5 | Body copy, paragraphs, lists |

### Letter Spacing

| Token | Value | Usage |
|-------|-------|-------|
| `--letter-spacing-normal` | 0 | Default — body and heading text |
| `--letter-spacing-wide` | 0.05em | ALL-CAPS labels, badges, eyebrow headings only |

### Text Colour Hierarchy

| Use | Token | Hex |
|-----|-------|-----|
| Headings & body (default) | `--text-primary` | `#33475b` |
| Supporting / secondary | `--text-secondary` | `#5c6c7c` |
| On dark / coloured surfaces | `--color-white` | `#ffffff` |
| Disabled text | `--color-disabled-text` | `#637281` |
| Link / interactive text | `--color-link` (= `--brand-500`) | `#5b3b97` |

> Never colour body copy with a brand or status colour. Status colour applies only to the matching alert / badge / icon.

---

## 3. Colors

The system has **seven palettes**. Six are static; one (`--brand-*`) is rebrandable per company at runtime.

### 3.1 Brand — Company Color (runtime)

Used for primary CTAs, links, focus rings, selected states, brand surfaces.

| Step | Token | Hex |
|------|-------|-----|
| 25 | `--brand-25` | `#f6f4fb` |
| 50 | `--brand-50` | `#f1edf8` |
| 100 | `--brand-100` | `#e2daf1` |
| 200 | `--brand-200` | `#c5b5e2` |
| 300 | `--brand-300` | `#a086d0` |
| 400 | `--brand-400` | `#7a56bd` |
| **500** ⬅ default | `--brand-500` / `--company-color-hex` | `#5b3b97` |
| 600 | `--brand-600` | `#472e75` |

`--brand-500` is the **only** runtime-overridable colour. All other palettes are static.

### 3.2 Info — Skyblue · Success — Green · Warning — Orange · Error — Red

Each status palette follows the same 25 → 600 ramp with a consistent role per step.

| Step | Info | Success | Warning | Error |
|------|------|---------|---------|-------|
| 25 | `#F5FBFF` | `#F6FEF9` | `#FFFCF5` | `#FFFBFA` |
| 50 | `#F0F9FF` | `#ECFDF3` | `#FFFAEB` | `#FEF3F2` |
| 100 | `#E0F2FE` | `#D1FADF` | `#FEF0C7` | `#FEE4E2` |
| 200 | `#B9E6FE` | `#A6F4C5` | `#FEDF89` | `#FECDCA` |
| 300 | `#7CD4FD` | `#6CE9A6` | `#FEC84B` | `#FDA29B` |
| 400 | `#36BFFA` | `#32D583` | `#FDB022` | `#F97066` |
| 500 | `#0BA5EC` | `#12B76A` | `#F79009` | `#F04438` |
| 600 | `#0086C9` | `#039855` | `#DC6803` | `#D92D20` |

**The 25 / 200 / 600 contract** — every status component pairs these three steps the same way:

| Element | Step | Why |
|---------|------|-----|
| Background fill | `-25` (alerts) or `-50` (badges) | Soft tint, never overwhelming |
| Border / divider | `-200` | Visible separation without contrast spike |
| Text / icon | `-600` | WCAG AA on the matching tinted bg |

### 3.3 Neutral

The grey ramp. Bluish-warm — never pure grey.

| Step | Token | Hex | Usage |
|------|-------|-----|-------|
| 50 | `--neutral-50` | `#f5f5f7` | Page-level secondary surface |
| 100 | `--neutral-100` | `#eff2f5` | Card / section fill, default |
| 200 | `--neutral-200` | `#eef0f4` | Hairline divider, hover surface |
| 300 | `--neutral-300` | `#d9dde7` | Default border |
| 400 | `--neutral-400` | `#637281` | Placeholder, disabled text, icon-default |
| 500 | `--neutral-500` | `#5C6C7C` | Body secondary |
| 600 | `--neutral-600` | `#475467` | Slate text on light surfaces |

### 3.4 Semantic Tokens — what you actually use

Components reach for semantic tokens, never raw palette steps.

#### Text
| Token | Maps to | Hex |
|-------|---------|-----|
| `--text-primary` | — | `#33475b` |
| `--text-secondary` | `--neutral-500` | `#5c6c7c` |
| `--color-white` | — | `#ffffff` |

#### Status
| Token | Hex | Usage |
|-------|-----|-------|
| `--color-success` | `#28a745` | Confirmed, completed, positive |
| `--color-success-bg` | `#d4edda` | Success alert / banner bg |
| `--color-error` | `#dc3545` | Errors, destructive actions |
| `--color-error-bg` | `#f8d7da` | Error alert / banner bg |
| `--color-warning` | `#ffc107` | Caution — pair with dark text |
| `--color-warning-bg` | `#fff3cd` | Warning alert bg |
| `--color-warning-text` | `#856404` | Text on warning bg |

#### Interactive
| Token | Value | Usage |
|-------|-------|-------|
| `--color-link` | → `--brand-500` | Hyperlinks, text buttons, "View all" |
| `--color-focus` | brand + `rgba(brand, 0.25)` glow | Focus ring on every interactive element |

#### Disabled (always applied together)
| Token | Hex | Usage |
|-------|-----|-------|
| `--color-disabled-bg` | `#eef0f4` | Background of disabled inputs / buttons / selects |
| `--color-disabled-text` | `#637281` | Text and icons inside any disabled control |

#### Overlays
| Token | Value | Usage |
|-------|-------|-------|
| `--overlay-modal` | `rgba(0,0,0,0.5)` | Full-screen backdrop behind modals and drawers |
| `--overlay-subtle` | `rgba(0,0,0,0.1)` | Hover overlay on image tiles, card hover darkening |

#### Availability (product-specific)
| Token | Hex | Usage |
|-------|-----|-------|
| `--color-available` | `#6DD400` | Availability dot / pill on product & swag cards |
| `--color-available-dark` | `#459D14` | Availability label text beside the lime dot |

> `--color-available` is **not** the same as `--color-success`. Don't substitute one for the other.

---

## 4. Spacing & Layout

### Spacing Scale

Token: `--space-{1–8}`. Write `0` as a literal, never a token.

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 4 px | Icon-to-label gaps, badge internal padding |
| `--space-2` | 8 px | Compact gaps, chip padding, tight gutters |
| `--space-3` | 10 px | Base element padding, list item margins |
| `--space-4` | 12 px | Button vertical padding, form field gaps |
| `--space-5` | 16 px | Compact card padding, form section rhythm |
| `--space-6` | 20 px | Standard card / section padding |
| `--space-7` | 24 px | Generous card padding, modal content padding |
| `--space-8` | 32 px | Section rhythm, page container padding |

> Anything larger than `--space-8` should be expressed as a multiple, e.g. `calc(var(--space-8) * 2)`. We do not add `--space-9`, `-10`, etc.

### Breakpoints

| Token | Value |
|-------|-------|
| `sm` | 640 px |
| `md` | 900 px |
| `lg` | 1024 px |
| `xl` | 1280 px |

### Container

```
max-width: 1280px;
margin-inline: auto;
padding-inline: var(--space-5);   /* 16px on mobile, scales with breakpoint */

@media (min-width: 1024px) {
  padding-inline: var(--space-8);
}
```

### Section Pattern

Every content section follows this skeleton.

```html
<section class="section">
  <div class="container">
    <h2 class="section-heading">…</h2>
    <p class="section-subtext">…</p>
    <!-- content grid -->
  </div>
</section>
```

```css
.section { padding-block: var(--space-8); }
@media (min-width: 1280px) { .section { padding-block: calc(var(--space-8) * 1.5); } }
```

### Common Spacing Tokens for Layout

| Context | Token |
|---------|-------|
| Section vertical | `--space-8` mobile · `--space-8 × 1.5` desktop |
| Card grid gap | `--space-7` or `--space-8` |
| Inner card padding (compact) | `--space-5` mobile · `--space-7` desktop |
| Inner card padding (large) | `--space-7` mobile · `--space-8` desktop |
| Heading bottom margin | `--space-7` |
| CTA top margin | `--space-7` mobile · `--space-8` desktop |

---

## 5. Border Radius

Token: `--radius-{step}`. **9 steps**, no others.

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-none` | 0 | Full-bleed images, flush dividers |
| `--radius-2xs` | 2 px | Tags inline with text |
| `--radius-xs` | 4 px | Chips, small badges |
| `--radius-sm` | 6 px | Code blocks, tooltips |
| `--radius` ⬅ default | 8 px | Inputs, selects, small cards |
| `--radius-md` | 10 px | Action sheets, compact tiles |
| `--radius-lg` | 12 px | Alerts, snackbars |
| `--radius-xl` | 16 px | Cards, modals |
| `--radius-pill` | 50 px | Buttons, badges, status pills |

**Rules:**
- Buttons, badges, status pills → `--radius-pill`. No exceptions.
- Cards & modals → `--radius-xl`. Stat cards may use `--radius-lg`.
- Inputs → `--radius`. Always.
- Never use `50%` for circular avatars except true circles — use a fixed `width = height` + `--radius-pill`.

---

## 6. Shadows

Token: `--shadow-{xs|sm|md|lg|xl|2xl}`. All built on `rgba(16, 24, 40, …)` so they read consistently across surfaces.

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-xs` | `0px 1px 2px rgba(16,24,40,0.05)` | Hairline lift — inputs on focus, sticky bars |
| `--shadow-sm` | `0px 1px 3px rgba(…,0.10), 0px 1px 2px rgba(…,0.06)` | Default card resting state |
| `--shadow-md` | `0px 4px 8px rgba(…,0.10), 0px 2px 4px rgba(…,0.06)` | Card hover, dropdowns |
| `--shadow-lg` | `0px 12px 16px rgba(…,0.08), 0px 4px 6px rgba(…,0.03)` | Hover-lifted cards, deal cards |
| `--shadow-xl` | `0px 20px 24px rgba(…,0.08), 0px 8px 8px rgba(…,0.03)` | Floating panels, popovers |
| `--shadow-2xl` | `0px 24px 48px rgba(16,24,40,0.18)` | Modal dialogs |

> Custom shadow values are forbidden. If a Figma frame uses a shadow not in this list, snap to the nearest token.

---

## 7. Cards

Default radius `--radius-xl` (16 px) · default shadow `--shadow-sm` · hover shadow `--shadow-lg` + `translateY(-2px)`.

### 7.1 Default Card (`.card`)

| Property | Token / Value |
|----------|---------------|
| Background | `--color-white` |
| Border | `1px solid var(--neutral-200)` |
| Border-radius | `--radius-xl` |
| Shadow | `--shadow-sm` |
| Padding | `--space-7` mobile · `--space-8` desktop |
| Hover shadow | `--shadow-md` |
| Transition | `box-shadow 200ms ease, transform 200ms ease` |

### 7.2 Compact Card (`.card.card-compact`)

For grid items in benefits, stat blocks, feature lists.

| Property | Token / Value |
|----------|---------------|
| Padding | `--space-5` mobile · `--space-6` desktop |
| All else | inherits from `.card` |

### 7.3 Stat Card (`.stat-card`)

Square card for displaying numbers/metrics.

| Property | Token / Value |
|----------|---------------|
| Background | `--neutral-100` |
| Border | `1px solid var(--neutral-200)` |
| Border-radius | `--radius-lg` |
| Aspect ratio | `1 / 1` |
| Padding | `--space-5` |

Inner structure:
```html
<div class="stat-card">
  <span class="stat-label">Label</span>
  <span class="stat-value">123</span>
  <span class="stat-delta up">+4.2%</span>   <!-- or .down -->
</div>
```

| Element | Token |
|---------|-------|
| `.stat-label` | `--font-size-sm`, `--text-secondary` |
| `.stat-value` | `--font-size-2xl`, `--font-weight-bold`, `--text-primary` |
| `.stat-delta.up` | `--color-success` |
| `.stat-delta.down` | `--color-error` |

### 7.4 Deal Card (`.card.card-deal`)

Product/perks card with hover lift.

| Property | Token / Value |
|----------|---------------|
| Padding | `0` (image is flush) |
| Hover | `--shadow-lg` + `translateY(-2px)` |
| Badge slot | `.card-deal-badge` — absolute top-right |

### 7.5 Dark Card (`.card.card-dark`)

For dark sections (testimonials, CTA banners).

| Property | Token / Value |
|----------|---------------|
| Background | `--brand-600` or `--neutral-600` (never raw `#000`) |
| Text | `--color-white` |
| Border | none |
| Border-radius | `--radius-xl` |
| Padding | `--space-7` mobile · `--space-8` desktop |

### 7.6 Brand Surface Card (`.card.card-brand`)

For promotional surfaces using brand tint.

| Property | Token / Value |
|----------|---------------|
| Background | `--brand-25` or `--brand-50` |
| Border | `1px solid var(--brand-100)` |
| Text | `--text-primary` |

---

## 8. Buttons

Border-radius: `--radius-pill` always. Font-family inherited. Font-weight `--font-weight-medium`.

### 8.1 Variants

| Class | Background | Border | Text | Use |
|-------|-----------|--------|------|-----|
| `.btn-primary` | `--brand-500` | none | `--color-white` | Primary CTA |
| `.btn-outline` | transparent | `1px solid var(--brand-500)` | `--brand-500` | Secondary CTA |
| `.btn-ghost` | transparent | none | `--brand-500` | Tertiary / inline action |
| `.btn-neutral` | `--color-white` | `1px solid var(--neutral-300)` | `--text-primary` | Cancel, dismiss |
| `.btn-success` | `--color-success` | none | `--color-white` | Confirm / complete |
| `.btn-danger` | `--color-error` | none | `--color-white` | Destructive action |
| `.btn-warning` | `--color-warning` | none | `--color-warning-text` | Caution (use dark text) |

### 8.2 Sizes

| Class | Padding | Font Size |
|-------|---------|-----------|
| `.btn-sm` | `5px 12px` | `--font-size-xs` (11) |
| `.btn` (default) | `8px 18px` | `--font-size-dense` (13) |
| `.btn-lg` | `11px 26px` | `--font-size-md` (14) |

### 8.3 States

| State | Treatment |
|-------|-----------|
| Hover | Filled: bg shifts one step darker (`--brand-500` → `--brand-600`). Outline: bg fills `--brand-500`, text becomes `--color-white` |
| Focus | `box-shadow: 0 0 0 4px var(--color-focus)` — never `outline: none` without replacement |
| Active | Bg shifts another step darker, no scale animation |
| Disabled | Add `disabled` attribute → `opacity: 0.4`, `cursor: not-allowed`, no hover effect |
| Loading | Replace label with spinner, keep button width via `min-width` |

### 8.4 Icon Buttons

Buttons can carry a leading or trailing icon. Use `--space-2` (8 px) gap between icon and label. Icon size = `1em` (matches font size).

```html
<button class="btn btn-primary">
  <svg width="14" height="14" aria-hidden="true">…</svg>
  Redeem now
</button>
```

### 8.5 Dos & Don'ts

**DOs:**
- Brand-coloured CTAs use `.btn-primary` only — never reach for `--success` for "positive" copy
- Pair `.btn-primary` with `.btn-outline` or `.btn-ghost` for secondary, never two filled buttons
- All buttons get a focus ring (`--color-focus`), without exception

**DON'Ts:**
- No square buttons (`--radius` or below) — pill is the brand
- No bespoke padding — use `.btn-sm`, `.btn`, or `.btn-lg`
- No `text-transform: uppercase` on buttons. Sentence case only
- Never two `.btn-primary` next to each other in the same group

### 8.6 Implementation Reference (`vc-btn-*`)

The classes below are the live, in-codebase implementations. Treat the `.btn-*` table in §8.1 as the destination naming; these are what consumers reach for today.

#### `.vc-btn-primary` — Hero / Form CTA

Location: `src/styles.scss`.

| Property | Value |
|---|---|
| Height | `40px` |
| Min-width | `220px` |
| Padding | `0 var(--space-4)` |
| Border-radius | `$btn-border-radius` (pill) |
| Border | `1px solid var(--company-color-hex)` |
| Background | `rgba(var(--company-color), 0.1)` |
| Color | `var(--company-color-hex)` |
| Font-weight | `var(--font-weight-medium)` |
| Hover / Focus | Background fills brand, text becomes `--color-white` |
| Active | `box-shadow: none` |
| Disabled | `opacity: 0.7`, `cursor: not-allowed` |
| Transition | `all 0.3s ease-in-out` |

**Use for:** primary CTAs in hero sections, form submits, modal confirm actions — any context where the button can occupy ≥220 px width comfortably.

**Avoid in:** dense rows, tile cards, table cells. The 220 px min-width forces overflow in tight layouts (this was the original motivation for `.vc-btn-tertiary`).

#### `.vc-btn-tertiary` — Inline / Tertiary Action

Text-shaped action button for in-row, in-tile, and inline contexts. Replaces the legacy `.anchor-perks` / `.anchor-deal` / `.anchor-hover-no-decoration` patterns.

| Property | Value |
|---|---|
| Display | `inline-flex` (icon + label gap via `--space-2`) |
| Padding | `var(--space-1) 0` (text-shaped, no horizontal pad) |
| Min-width | none |
| Background | transparent |
| Border | none |
| Color | `var(--company-color-hex)` |
| Font-size | `inherit` — adapts to surrounding text (typically `--font-size-md` body, `--font-size-sm` inside subtitles) |
| Font-weight | `var(--font-weight-semibold)` (600) — *deviation from §8 default* |
| Line-height | `inherit` — matches surrounding text rhythm |
| Border-radius | `var(--radius-pill)` (shapes the focus ring) |
| Hover | `text-decoration: underline` |
| Focus | `box-shadow: 0 0 0 4px var(--color-focus)`, `outline: none` |
| Active | `opacity: 0.85` |
| Disabled | `opacity: 0.4`, `pointer-events: none`, no underline |
| Tap target | ≥40 px via invisible `::before` expansion (`inset: -10px -8px`) |

> **Deviation note:** §8 sets `--font-weight-medium` as the default for buttons. Tertiary uses `--font-weight-semibold` to remain readable as an action when stripped of background/border.

**Markup**

```html
<!-- Navigates → use <a> -->
<a class="vc-btn-tertiary" [href]="origin + '/myaccount/redeem'">
  View All Gift Cards
  <i class="fas fa-angle-right" aria-hidden="true"></i>
</a>

<!-- Performs an action → use <button> -->
<button type="button" class="vc-btn-tertiary" (click)="onRedeem(giftcard)">
  Redeem
</button>
```

**Use for:**
- In-row actions inside tiles, cards, or table rows (e.g. "Redeem" on a gift-card tile)
- Section-header navigation links (e.g. "View All →", "See more →")
- Inline actions within paragraphs / subtitles

**Avoid:**
- As a hero or form CTA — use `.vc-btn-primary`
- For destructive actions — use a danger-coloured filled button
- Icon-only — tertiary is a text role; always include a visible label (localised via `translate` pipe)
- Inside `<a>` without an `href` — if it acts rather than navigates, switch the tag to `<button type="button">`

**Accessibility**
- Focus is keyboard-only (`:focus-visible`), so mouse clicks won't leave a lingering ring
- Disabled `<a>` requires `aria-disabled="true"` *and* removed `href` — anchors can't be natively disabled
- The invisible `::before` expansion guarantees the WCAG 2.5.5 touch-target minimum even when the visible label is short

---

## 9. Badges

Background uses the `-50` step. Text uses the `-600` step. Border-radius `--radius-pill`. Font-size `--font-size-xs`. Font-weight `--font-weight-medium`.

| Class | Bg | Text | Use |
|-------|----|------|-----|
| `.badge-brand` | `--brand-50` | `--brand-600` | Premium, featured |
| `.badge-success` | `--success-50` | `--success-600` | Active, redeemed |
| `.badge-error` | `--error-50` | `--error-600` | Expired, rejected |
| `.badge-warning` | `--warning-50` | `--warning-600` | Pending, under review |
| `.badge-info` | `--info-50` | `--info-600` | New, informational |
| `.badge-neutral` | `--neutral-100` | `--neutral-600` | Inactive, draft |

### Status Dot

Add `<span class="dot"></span>` inside any badge for an inline status dot. The dot inherits text colour by default; override with a modifier when needed (`.dot.dot-available` → `--color-available`).

```html
<span class="badge badge-success">
  <span class="dot"></span> Active
</span>
```

---

## 10. Alerts

Background `-25` · border `-200` · text `-600`. Border-radius `--radius-lg`. Padding `--space-5`.

| Class | Use |
|-------|-----|
| `.alert-brand` | Promotional / engagement |
| `.alert-info` | Informational notices |
| `.alert-success` | Confirmations |
| `.alert-warning` | Cautions, expiry warnings |
| `.alert-error` | Errors and failures |

### Anatomy

```html
<div class="alert alert-info">
  <span class="alert-icon">ℹ️</span>
  <div class="alert-content">
    <div class="alert-title">Title</div>
    <div class="alert-body">Body text</div>
  </div>
  <button class="alert-dismiss" aria-label="Dismiss">×</button>
</div>
```

| Element | Token |
|---------|-------|
| `.alert-icon` | 20 × 20 px, colour matches alert role |
| `.alert-title` | `--font-size-md`, `--font-weight-semibold` |
| `.alert-body` | `--font-size-sm`, current alert role text colour |
| `.alert-dismiss` | `--font-size-lg`, opacity 0.6, hover 1 |

> Only one alert is on screen at a time per logical region. If you need to stack multiple notices, you have a notification problem, not an alert problem.

---

## 11. Inputs & Forms

Border `--neutral-300` · radius `--radius` (8 px) · focus ring `--color-focus` · padding `--space-4 --space-5`.

### 11.1 States

| State | Modifier | Visual |
|-------|----------|--------|
| Default | `.input` | Neutral border |
| Focus | (intrinsic `:focus`) | Border `--brand-500`, ring `--color-focus` |
| Error | `.input.inp-error` | Border `--color-error`, hint becomes red |
| Success | `.input.inp-success` | Border `--color-success`, optional checkmark icon |
| Disabled | `disabled` attribute | Bg `--color-disabled-bg`, text `--color-disabled-text` |

### 11.2 Labels & Helper Text

| Element | Class | Token |
|---------|-------|-------|
| Label (above) | `.input-label` | `--font-size-sm`, `--font-weight-medium`, `--text-primary` |
| Helper hint (below) | `.input-hint` | `--font-size-xs`, `--text-secondary` |
| Error message (below) | `.input-err-msg` | `--font-size-xs`, `--color-error` |

### 11.3 Form Layout

```html
<div class="form-field">
  <label class="input-label" for="email">Email</label>
  <input class="input" id="email" type="email" />
  <span class="input-hint">We'll never share this.</span>
</div>
```

```css
.form-field { display: grid; gap: var(--space-2); margin-bottom: var(--space-5); }
```

### 11.4 Selects, Checkboxes, Radios

- Native `<select>` styled with the same `.input` class. Custom dropdown only when multi-select or async search is required.
- Checkboxes & radios: `--brand-500` fill on `:checked`, focus ring same as inputs.
- Toggle switches: 36 × 20 px, knob 16 × 16 px, off-state `--neutral-300`, on-state `--brand-500`.

---

## 12. Icons

All icons are **inline SVGs**. No icon font, no external icon library.

### 12.1 Sizing

| Size | Use |
|------|-----|
| `12 × 12` | Inline within text (same line as `--font-size-sm`) |
| `16 × 16` | Default — buttons, table rows, list bullets |
| `20 × 20` | Section labels, alert icons |
| `24 × 24` | Card feature icons, stat-card glyph |
| `32 × 32` | Hero / large feature illustrations |

### 12.2 Pattern

```html
<svg width="16" height="16" viewBox="0 0 24 24" fill="none"
     stroke="currentColor" stroke-width="2"
     stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  …paths…
</svg>
```

| Property | Value |
|----------|-------|
| `viewBox` | `0 0 24 24` |
| `fill` | `none` (stroked icons) — `currentColor` (filled) |
| `stroke` | `currentColor` — colour comes from CSS |
| `stroke-width` | `2` (default) · `1.5` for delicate · `1.2` for ultra-fine |
| `aria-hidden` | `"true"` for decorative — drop it and add `<title>` for meaningful icons |

### 12.3 Icon Container

For feature icons inside cards, wrap the SVG in a container.

| Property | Token / Value |
|----------|---------------|
| Background | `--brand-50` |
| Border-radius | `--radius-md` |
| Size | `40 × 40` mobile · `48 × 48` desktop |
| Display | `inline-flex; align-items: center; justify-content: center` |
| Inner SVG colour | `--brand-500` |

### 12.4 Brand Logo (Wordmark)

#### Asset

| Property | Value |
|----------|-------|
| File | `vc-logo.png` |
| Format | PNG, 8-bit RGBA |
| Dimensions | 713 × 104 px |
| Aspect ratio | 6.86 : 1 (width : height) |
| Asset type | White silhouette on transparent background |
| Location | `src/assets/images/vc-logo.png` |

The PNG is a white silhouette — never render it directly on a light background. Apply colour via the CSS `mask-image` technique below.

#### Logo Colours

| Role | Hex | Usage |
|------|-----|-------|
| Primary (dark) | `#29294C` | Logo on white or light-grey backgrounds |
| White | `#FFFFFF` | Logo on dark or brand-coloured backgrounds |

No other colours are permitted for the logo.

#### Sizing & Clear Space

| Context | Height | Width (auto) |
|---------|--------|--------------|
| Top-bar / header | 28 px | ~192 px |
| Compact header | 22 px | ~151 px |
| Footer | 20 px | ~137 px |
| Email / documents | 32 px | ~219 px |
| Minimum size | 18 px | ~123 px |

Width is derived from the 6.86 : 1 ratio — always maintain it. Maintain at least **16 px** clear space on all four sides.

```css
/* Always set height; let aspect ratio drive width */
.logo {
  height: 28px;
  width: 192px; /* 28 × 6.86 */
}
```

#### CSS Implementation

The `mask-image` technique lets the element's `background-color` fill through the PNG stencil — no separate colour-variant assets needed.

```scss
// logo.component.scss
.vc-logo {
  display: block;
  height: 28px;
  width: 192px;
  background-color: #29294C;
  -webkit-mask-image: url('/assets/images/vc-logo.png');
          mask-image: url('/assets/images/vc-logo.png');
  -webkit-mask-size: contain;
          mask-size: contain;
  -webkit-mask-repeat: no-repeat;
          mask-repeat: no-repeat;
  -webkit-mask-position: left center;
          mask-position: left center;
  flex-shrink: 0;
}
```

```html
<!-- logo.component.html -->
<span
  role="img"
  aria-label="Vantage Circle"
  class="vc-logo"
></span>
```

**White variant** (dark or brand-coloured backgrounds):

```scss
.vc-logo--white {
  background-color: #ffffff;
}
```

**Dark mode:**

```scss
@media (prefers-color-scheme: dark) {
  .vc-logo { background-color: #ffffff; }
}
```

#### Usage on Backgrounds

| Background | Logo colour | CSS value |
|---|---|---|
| White `#FFFFFF` | Primary | `background-color: #29294C` |
| Light grey `#F3F4F6` | Primary | `background-color: #29294C` |
| Dark `#111827` | White | `background-color: #FFFFFF` |
| Brand `#29294C` | White | `background-color: #FFFFFF` |
| Photo / gradient | White + frosted backing | See below |

**Logo on image backgrounds** — use a frosted backing layer instead of changing the logo colour:

```scss
.logo-on-image-wrapper {
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.90);
  border-radius: var(--radius-sm);
  backdrop-filter: blur(4px);

  .vc-logo { background-color: #29294C; }
}
```

#### Do's and Don'ts

**Do:**
- Use `mask-image` with `background-color` to render the logo in any colour
- Fix `height` and derive `width` from the 6.86 : 1 ratio
- Add `role="img"` and `aria-label="Vantage Circle"` on the mask `<span>`
- Include both `-webkit-mask-image` and `mask-image` declarations

**Don't:**
- Render the PNG directly on a light background — the white silhouette becomes invisible
- Use `filter: hue-rotate()` to colourize — produces inaccurate colours
- Set `width: 100%` without a fixed height — distorts the aspect ratio
- Use `box-shadow` directly on the logo — wrap it instead
- Scale below 18 px height
- Use colours other than `#29294C` or `#FFFFFF`

#### Accessibility

```html
<!-- Preferred -->
<a href="/" aria-label="Vantage Circle — home">
  <span class="vc-logo" role="img" aria-label="Vantage Circle"></span>
</a>

<!-- Alternative: visually-hidden sibling -->
<a href="/">
  <span class="vc-logo" aria-hidden="true"></span>
  <span class="sr-only">Vantage Circle</span>
</a>
```

#### Browser Support

Always write both the prefixed and unprefixed `mask-image` declarations:

```css
-webkit-mask-image: url(…); /* Safari, older Chrome */
        mask-image: url(…); /* Standard */
```

| Browser | Support |
|---|---|
| Chrome 120+ | `mask-image` ✓ |
| Safari 15.4+ | `-webkit-mask-image` ✓ |
| Firefox 113+ | `mask-image` ✓ |
| Edge 120+ | `mask-image` ✓ |
| Safari < 15.4 | `-webkit-mask-image` ✓ |

---

## 13. Motion & Transitions

The audit found 100+ uses of `all 0.3s ease-in-out` with no token. We standardise that here.

### 13.1 Duration

| Token | Value | Usage |
|-------|-------|-------|
| `--duration-fast` | 150 ms | Hover colour shifts, focus rings, tooltip fade |
| `--duration-base` | 200 ms | Default — buttons, inputs, dropdowns |
| `--duration-slow` | 300 ms | Card hover lift, modal open, drawer slide |
| `--duration-slower` | 500 ms | Carousel slide, hero fade-in |

### 13.2 Easing

| Token | Value | Usage |
|-------|-------|-------|
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Entrance — modals, dropdowns, toasts |
| `--ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` | Default — most state changes |
| `--ease-bounce` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Optional pop — chip select, success checkmark |

### 13.3 Standard Transitions

```css
/* Buttons, links, inputs */
transition: background-color var(--duration-base) var(--ease-in-out),
            border-color var(--duration-base) var(--ease-in-out),
            color var(--duration-base) var(--ease-in-out),
            box-shadow var(--duration-base) var(--ease-in-out);

/* Card hover lift */
transition: box-shadow var(--duration-slow) var(--ease-out),
            transform var(--duration-slow) var(--ease-out);
```

> Never use `transition: all`. Always enumerate properties — the audit shows that `all` is the single biggest cause of unintended re-renders and layout flicker.

### 13.4 Animation Patterns

| Pattern | Definition |
|---------|------------|
| Fade-in on scroll | `opacity: 0 → 1` + `translateY(20px → 0)`, `--duration-slower`, staggered 0.1s per child |
| Card hover | `transform: translateY(-2px)` + `--shadow-sm → --shadow-lg` |
| Button hover | Bg one step darker, no transform |
| Chevron reveal | width `0 → 16px`, opacity `0 → 1`, `--duration-slow` |
| Skeleton shimmer | `linear-gradient` translate, 1.5s loop, `--neutral-100` → `--neutral-200` |

---

## 14. Design Rules

The five rules everyone breaks first.

1. **Brand colour is `--brand-500`. Period.** Don't mix in raw `#5b3b97` even though it's "the same". Use the token, so the runtime override works.
2. **No pure grey.** All neutrals have a slight blue cast. Replacing `#999` or `#666` with the right `--neutral-*` step is almost always correct.
3. **One `<h1>` per page.** Heading levels are semantic — never skip from `<h2>` to `<h4>` for visual reasons. If you need a smaller heading, use a smaller font-size token.
4. **Status colours don't decorate.** `--color-success` is for state, not for "this is good news". A green-bordered card is wrong unless the card represents a successful state.
5. **Section padding is `--space-8` vertical, container `--space-5/8` horizontal.** No bespoke values. The rhythm is the rhythm.

---

## 15. Section Layout Patterns

Every content section is built from one of these skeletons.

### 15.1 Standard Section

```html
<section class="section">
  <div class="container">
    <h2 class="section-heading">Section heading</h2>
    <p class="section-subtext">Optional subtext, max ~60 chars.</p>

    <div class="section-grid">
      <!-- cards go here -->
    </div>

    <div class="section-cta">
      <a href="#" class="btn btn-outline">Action label</a>
    </div>
  </div>
</section>
```

```css
.section-heading  { font-size: var(--font-size-2xl); font-weight: var(--font-weight-semibold); text-align: center; max-width: 56ch; margin-inline: auto; }
.section-subtext  { font-size: var(--font-size-md); color: var(--text-secondary); text-align: center; max-width: 56ch; margin: var(--space-4) auto 0; }
.section-grid     { display: grid; gap: var(--space-7); margin-top: var(--space-8); }
.section-cta      { display: flex; justify-content: center; margin-top: var(--space-7); }

@media (min-width: 1024px) {
  .section-grid { grid-template-columns: repeat(3, 1fr); gap: var(--space-8); }
}
```

### 15.2 Two-Column Card Grid

```html
<div class="grid grid-2">
  <article class="card card-compact">…</article>
  <article class="card card-compact">…</article>
</div>
```

```css
.grid-2 { display: grid; gap: var(--space-7); }
@media (min-width: 1024px) { .grid-2 { grid-template-columns: 1fr 1fr; gap: var(--space-8); } }
```

### 15.3 Stat Grid (5-column metrics)

```html
<div class="stat-grid">
  <div class="stat-card">…</div>
  …
</div>
```

```css
.stat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-3); }
@media (min-width: 900px)  { .stat-grid { grid-template-columns: repeat(5, 1fr); gap: var(--space-5); } }
```

On mobile, when there are 5 cards, the last card spans both columns:

```css
.stat-grid > :nth-child(5) { grid-column: span 2; max-width: 50%; justify-self: center; }
@media (min-width: 900px)  { .stat-grid > :nth-child(5) { grid-column: auto; max-width: none; } }
```

### 15.4 Dark CTA Section

```html
<section class="section">
  <div class="container">
    <div class="card card-dark cta-dark">
      <div>
        <h2 class="section-heading-light">Heading</h2>
        <p class="section-subtext-light">Description</p>
      </div>
      <a href="#" class="btn btn-neutral">Action</a>
    </div>
  </div>
</section>
```

```css
.cta-dark { display: grid; gap: var(--space-6); align-items: center; }
@media (min-width: 1024px) { .cta-dark { grid-template-columns: 1fr auto; } }
.section-heading-light  { color: var(--color-white); }
.section-subtext-light  { color: rgba(255,255,255,0.7); }
```

### 15.5 Brand-Surface Feature Section

For warm promotional sections — use `--brand-25` or `--brand-50` as section background.

```html
<section class="section section-brand">
  <div class="container">…</div>
</section>
```

```css
.section-brand { background: var(--brand-25); }
```

---

## 16. Responsive Behavior

### 16.1 Grid Collapse

| Desktop | Mobile fallback |
|---------|-----------------|
| `grid-cols-3` | Single-column stack |
| `grid-cols-2` | Single-column stack |
| `grid-cols-5` (stat grid) | `grid-cols-2`, last card spans 2 |
| Side-by-side card+image | Image below text |

### 16.2 Mobile-Specific Treatments

- **Section padding:** `--space-5` horizontal (mobile) → `--space-8` desktop. Vertical scales similarly.
- **Headings:** Step down one size token on mobile, e.g. `--font-size-2xl` desktop → `--font-size-xl` mobile.
- **Card padding:** `--space-5` mobile → `--space-7/8` desktop.
- **Text alignment:** Centre on mobile, left-align ≥ `lg`. Single rule: hero is always centre on mobile.
- **CTA stacking:** Vertical stack ≤ `sm`, horizontal `≥ md`. Primary always first in DOM and visually.

### 16.3 Mobile Carousel Pattern

For 3+ items that don't fit a stacked layout, use a snap carousel on mobile, grid on desktop.

```html
<div class="carousel-mobile">
  <div class="carousel-card">…</div>
  <div class="carousel-card">…</div>
  <div class="carousel-card">…</div>
</div>
```

```css
.carousel-mobile {
  display: flex; gap: var(--space-5);
  overflow-x: auto; scroll-snap-type: x mandatory;
  margin-inline: calc(-1 * var(--space-5));
  padding-inline: var(--space-5);
  scrollbar-width: none;
}
.carousel-mobile::-webkit-scrollbar { display: none; }
.carousel-card { flex: 0 0 100%; scroll-snap-align: center; }

@media (min-width: 1024px) {
  .carousel-mobile { display: grid; grid-template-columns: repeat(3, 1fr); overflow: visible; padding-inline: 0; margin-inline: 0; }
}
```

### 16.4 Carousel Dot Indicators

```html
<div class="carousel-dots">
  <button class="dot dot-active" aria-label="Slide 1"></button>
  <button class="dot" aria-label="Slide 2"></button>
  <button class="dot" aria-label="Slide 3"></button>
</div>
```

```css
.carousel-dots .dot { width: 10px; height: 10px; border-radius: var(--radius-pill); background: var(--neutral-300); }
.carousel-dots .dot-active { background: var(--brand-500); }
```

---

## 17. Image & Media Treatment

### 17.1 Loading & Format

- All non-hero images: `loading="lazy"`.
- All Cloudinary URLs use `f_auto,q_auto`.
- Width hint: `w_400` for card images, `w_1000` for hero.
- Decorative images: `alt=""` and `role="presentation"`.

### 17.2 Image Sizing

| Context | Pattern |
|---------|---------|
| Logos in cards | Fixed width, no explicit height |
| Card feature images | `max-width: 100%; max-height: 100%; object-fit: contain` |
| Avatars | `border-radius: var(--radius-pill)`, fixed `width = height` |
| Award badges | `max-width: 130px`, `object-fit: contain`, `height: auto` |
| Trust logos | Fixed height `40px`, auto width, horizontal scroll on mobile |

### 17.3 Mobile vs Desktop Card Imagery

Decorative card images sit absolute on desktop, inline on mobile.

```html
<article class="card card-feature">
  <div class="card-content">…</div>
  <img class="card-image-mobile" src="…" alt="" />
  <div class="card-image-desktop" aria-hidden="true">
    <!-- absolute-positioned layered shapes -->
  </div>
</article>
```

```css
.card-image-mobile  { display: block; }
.card-image-desktop { display: none; }
@media (min-width: 1024px) {
  .card-image-mobile  { display: none; }
  .card-image-desktop { display: block; position: absolute; right: 0; bottom: 0; }
}
```

---

## 18. Dark Section Rules

### 18.1 When to Go Dark

| Surface | Use |
|---------|-----|
| `--brand-600` | Compact info bars, trust strips, single-row content |
| `--neutral-600` | Footer, mature content sections |
| Brand gradient (`--brand-500 → --brand-600`) | Feature showcases, CTA banners |

### 18.2 What's Allowed on Dark

| Element | Treatment |
|---------|-----------|
| Headings | `--color-white` |
| Body | `rgba(255,255,255,0.7)` |
| Muted | `rgba(255,255,255,0.5)` |
| Buttons | `.btn-neutral` (white-fill) or `.btn-outline` with white border + white text + hover fills white |
| Links | `--color-white`, no underline by default — `text-decoration: underline` on hover |
| Icons / badges | `rgba(255,255,255,0.08)` container background |

### 18.3 Don'ts on Dark

- No `--text-primary` (#33475b is invisible on dark)
- No `.btn-primary` (brand purple on brand-dark = no contrast). Use `.btn-neutral` or outline-white instead.
- No `--neutral-300` borders. Use `rgba(255,255,255,0.08)` for hairlines.
- Never two dark sections back-to-back. Separate with a light section or trust strip.

---

## 19. Page Anatomy

A typical page rhythm. Not every section is required — but light/dark alternation is.

```
┌──────────────────────────────────────┐
│  HEADER (sticky, white)              │
├──────────────────────────────────────┤
│  HERO (white)                        │  h1 + subtext + dual CTA + hero image
├──────────────────────────────────────┤
│  BENEFITS BAR (--neutral-50)         │  4-column icon + label compact cards
├──────────────────────────────────────┤
│  TRUST STRIP (white)                 │  "Trusted by" + scrolling logos
├──────────────────────────────────────┤
│  FEATURE SECTION (white)             │  heading + standard cards + outline CTA
├──────────────────────────────────────┤
│  TABBED / CAROUSEL (--neutral-50)    │  Desktop tabs · mobile snap-carousel
├──────────────────────────────────────┤
│  TESTIMONIAL (--brand-600 dark)      │  Quote + video thumbnail + dots
├──────────────────────────────────────┤
│  AWARDS (white)                      │  Compact white cards with badge images
├──────────────────────────────────────┤
│  DARK STRIP (--brand-600)            │  Compact info / security bar
├──────────────────────────────────────┤
│  GRADIENT CTA (--brand-500→600)      │  Heading + CTA + image
├──────────────────────────────────────┤
│  STAT GRID (white)                   │  5-column metric cards
├──────────────────────────────────────┤
│  FOOTER (--neutral-600)              │
└──────────────────────────────────────┘
```

### 19.1 Rhythm Rules

1. Alternate light ↔ dark — never stack two darks
2. White is the default surface
3. One CTA per section; outline by default; only the hero gets the filled `.btn-primary`
4. Section headings are centred with `max-width: 56ch` to prevent long lines
5. Every section is self-contained — `<section class="section">` with its own `.container`

---

## 20. Breadcrumbs

Shared component. Sits between the hero and any tab/filter navigation.

### Anatomy

```
Home / In the News / Media Coverage
 ↑          ↑              ↑
link       link        current (no link)
```

| Property | Token / Value |
|----------|---------------|
| Font-size | `--font-size-sm` desktop · `--font-size-xs` mobile |
| Link colour | `--text-secondary` |
| Link hover | `--brand-500` |
| Current colour | `--text-primary`, `--font-weight-medium` |
| Separator | `/` in `--neutral-300` |
| Gap | `--space-2` |
| Margin-bottom | `--space-6` desktop · `--space-3` mobile |

### Usage

```html
<nav class="breadcrumbs" aria-label="Breadcrumb">
  <a href="/">Home</a>
  <span class="sep">/</span>
  <a href="/in-the-press/">In the News</a>
  <span class="sep">/</span>
  <span aria-current="page">Media Coverage</span>
</nav>
```

---

## 21. Common Mistakes & Fixes

These are the patterns the codebase audit surfaced as the highest-frequency violations. Each row is the lookup table for a code review or refactor pass.

| Mistake | Fix |
|---------|-----|
| `#fff` or `#ffffff` written inline | Use `var(--color-white)` |
| `#33475b` or any hex matching a token | Use the matching `--text-*` / `--neutral-*` / palette token |
| Multiple values for the same role (4 different success greens) | Collapse to `var(--color-success)` (`#28a745`); never invent a new green |
| Pure grey (`#999`, `#666`, `#ccc`, `#000`) | Replace with bluish-grey via `--neutral-*` ramp |
| `!important` to override a parent style | Fix the cascade — scope the selector or move the rule into the right layer. `!important` is never the answer |
| Hardcoded `14px` font size | Use `var(--font-size-md)` |
| Hardcoded `0.7rem` font size | Use `var(--font-size-sm)` (12) — drop `0.7rem` (which is 11.2px) entirely; the system has no 11.2 |
| Missing font-weight | Always set explicitly with `var(--font-weight-*)` — never rely on default |
| `font-family: Inter` (unquoted, mid-string) vs `"Inter"` | Always `var(--font-family-base)`. Quoting differences = 2 different things to a tool |
| `border-radius: 16px` literal | Use `var(--radius-xl)` |
| `border-radius: 25px` literal (button) | Use `var(--radius-pill)` |
| `border-radius: 8px` literal (input) | Use `var(--radius)` |
| Custom shadow (`0px 3px 6px #00000029` etc.) | Snap to nearest `--shadow-*` token |
| `transition: all 0.3s ease-in-out` | Enumerate properties; use `--duration-slow` and `--ease-in-out` |
| Square or slightly-rounded buttons (`--radius-md`, `--radius-lg`) | All buttons are `--radius-pill` |
| Buttons with no focus ring | Add `box-shadow: 0 0 0 4px var(--color-focus)` on `:focus-visible` |
| Heading text in `--brand-500` | Headings stay `--text-primary`. Brand colour is for CTAs and links |
| Body paragraph in `--brand-*` or status colour | Body is always `--text-primary` (or `--text-secondary` for support) |
| `text-transform: uppercase` on buttons | Sentence case only |
| Multiple `<h1>` on one page | Exactly one `<h1>` per page, in the hero |
| Image without `loading="lazy"` (below fold) | Add lazy loading to all non-hero images |
| Decorative image with descriptive alt | `alt=""` and `role="presentation"` |
| Section without `.container` wrapper | Wrap content in `<div class="container">` |
| Two dark sections back-to-back | Insert a light section or trust strip between them |
| `.btn-primary` on a dark surface | Use `.btn-neutral` (white fill) or outline-white instead |

---

## 22. CSS Variable Quick-Reference

Copy-paste root for any new project or audit baseline.

```css
:root {
  /* Brand (runtime override-able) */
  --brand-25:  #f6f4fb;
  --brand-50:  #f1edf8;
  --brand-100: #e2daf1;
  --brand-200: #c5b5e2;
  --brand-300: #a086d0;
  --brand-400: #7a56bd;
  --brand-500: #5b3b97;
  --brand-600: #472e75;
  --company-color-hex: var(--brand-500);

  /* Info, Success, Warning, Error — same 25→600 ramp; values per spec §3.2 */

  /* Neutrals */
  --neutral-50:  #f5f5f7;
  --neutral-100: #eff2f5;
  --neutral-200: #eef0f4;
  --neutral-300: #d9dde7;
  --neutral-400: #637281;
  --neutral-500: #5C6C7C;
  --neutral-600: #475467;

  /* Semantic — Text */
  --text-primary:   #33475b;
  --text-secondary: var(--neutral-500);
  --color-white:    #ffffff;

  /* Semantic — Status */
  --color-success:      #28a745;
  --color-success-bg:   #d4edda;
  --color-error:        #dc3545;
  --color-error-bg:     #f8d7da;
  --color-warning:      #ffc107;
  --color-warning-bg:   #fff3cd;
  --color-warning-text: #856404;

  /* Interactive */
  --color-link:  var(--brand-500);
  --color-focus: rgba(91, 59, 151, 0.25);

  /* Disabled */
  --color-disabled-bg:   #eef0f4;
  --color-disabled-text: #637281;

  /* Overlays */
  --overlay-modal:  rgba(0, 0, 0, 0.5);
  --overlay-subtle: rgba(0, 0, 0, 0.1);

  /* Availability */
  --color-available:      #6DD400;
  --color-available-dark: #459D14;

  /* Spacing */
  --space-1: 4px; --space-2: 8px; --space-3: 10px; --space-4: 12px;
  --space-5: 16px; --space-6: 20px; --space-7: 24px; --space-8: 32px;

  /* Radius */
  --radius-none: 0; --radius-2xs: 2px; --radius-xs: 4px;
  --radius-sm: 6px; --radius: 8px; --radius-md: 10px;
  --radius-lg: 12px; --radius-xl: 16px; --radius-pill: 50px;

  /* Shadow */
  --shadow-xs:  0px 1px 2px rgba(16,24,40,0.05);
  --shadow-sm:  0px 1px 3px rgba(16,24,40,0.10), 0px 1px 2px rgba(16,24,40,0.06);
  --shadow-md:  0px 4px 8px rgba(16,24,40,0.10), 0px 2px 4px rgba(16,24,40,0.06);
  --shadow-lg:  0px 12px 16px rgba(16,24,40,0.08), 0px 4px 6px rgba(16,24,40,0.03);
  --shadow-xl:  0px 20px 24px rgba(16,24,40,0.08), 0px 8px 8px rgba(16,24,40,0.03);
  --shadow-2xl: 0px 24px 48px rgba(16,24,40,0.18);

  /* Typography */
  --font-family-base: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-family-mono: ui-monospace, 'SF Mono', Consolas, monospace;

  --font-size-xs:    0.6875rem; /* 11 */
  --font-size-sm:    0.75rem;   /* 12 */
  --font-size-dense: 0.8125rem; /* 13 */
  --font-size-md:    0.875rem;  /* 14 */
  --font-size-lg:    1rem;      /* 16 */
  --font-size-xl:    1.125rem;  /* 18 */
  --font-size-2xl:   1.25rem;   /* 20 */
  --font-size-3xl:   1.625rem;  /* 26 */

  --font-weight-regular:  400;
  --font-weight-medium:   500;
  --font-weight-semibold: 600;
  --font-weight-bold:     700;

  --line-height-tight: 1.2;
  --line-height-base:  1.5;

  --letter-spacing-normal: 0;
  --letter-spacing-wide:   0.05em;

  /* Motion */
  --duration-fast:   150ms;
  --duration-base:   200ms;
  --duration-slow:   300ms;
  --duration-slower: 500ms;

  --ease-out:    cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

---

## 23. Token Migration Cheatsheet

Use this when refactoring existing SCSS or replacing literals during code review.

### Color

| Old literal | New token |
|-------------|-----------|
| `#fff`, `#ffffff`, `white` | `var(--color-white)` |
| `#33475b`, `$text-primary` | `var(--text-primary)` |
| `#5c6c7c`, `$text_secondary` | `var(--text-secondary)` |
| `#d9dde7`, `$border-color` | `var(--neutral-300)` |
| `#eff2f5`, `$base_color`, `$base_color_secondary`, `$sec-bg` | `var(--neutral-100)` |
| `#eef0f4`, `$border-bottom` | `var(--neutral-200)` |
| `#f6f6f7`, `$modal-background-color` | `var(--neutral-100)` (consolidated) |
| `#637281`, `$tabsBackgound`, `rgb(99,114,129)`, `$icon-color` | `var(--neutral-400)` |
| `#5b3b97`, `--company-color-hex`, `rgba(91,59,151,1)` | `var(--brand-500)` |
| `#28a745`, `#389704`, `#6DD400`, `#459D14` | `var(--color-success)` (or `--color-available` only for product availability dot) |
| `#dc3545`, `red` | `var(--color-error)` |
| `#ffc107` | `var(--color-warning)` |
| `#17a2b8` | `var(--info-500)` |
| `#6c757d`, `#adb5bd`, `#ced4da` | `var(--color-disabled-text)` |
| `rgba(0,0,0,0.5)` | `var(--overlay-modal)` |
| `rgba(0,0,0,0.1)` | `var(--overlay-subtle)` |

### Typography

| Old literal | New token |
|-------------|-----------|
| `14px`, `$normal` | `var(--font-size-md)` |
| `0.7rem`, `$secondary` | `var(--font-size-sm)` |
| `12px` | `var(--font-size-sm)` |
| `13px` | `var(--font-size-dense)` |
| `0.8rem`, `$normal-button` | `var(--font-size-dense)` |
| `15px`, `$headlineText` | `var(--font-size-lg)` (round to 16) |
| `16px`, `1rem`, `$title`, `$heading-big` | `var(--font-size-lg)` |
| `18px` | `var(--font-size-xl)` |
| `20px` | `var(--font-size-2xl)` |
| `Inter`, `"Inter"` | `var(--font-family-base)` |
| `Roboto`, `Roboto, "Helvetica Neue", sans-serif` | `var(--font-family-base)` |
| `font-weight: 500` | `var(--font-weight-medium)` |
| `font-weight: 700` | `var(--font-weight-bold)` |

### Radius

| Old literal | New token |
|-------------|-----------|
| `2px` | `var(--radius-2xs)` |
| `4px` | `var(--radius-xs)` |
| `5px`, `6px` | `var(--radius-sm)` |
| `8px` | `var(--radius)` |
| `10px` | `var(--radius-md)` |
| `12px` | `var(--radius-lg)` |
| `15px`, `16px` | `var(--radius-xl)` |
| `25px`, `9999px`, `4.4375rem` (button) | `var(--radius-pill)` |
| `50%` (true circle) | `var(--radius-pill)` with equal `width = height` |

### Shadow

| Old literal | New token |
|-------------|-----------|
| `0px 3px 6px #00000029`, `$box-shadow` | `var(--shadow-sm)` |
| `0px 3px 5px 0px rgb(0 0 0 / 21%)` | `var(--shadow-md)` |
| `0px 3px 20px 0px rgb(0 0 0 / 10%)` | `var(--shadow-lg)` |
| `rgba(0, 0, 0, 0.15) 0px 5px 15px 0px` | `var(--shadow-xl)` |
| `0 4px 6px 0 rgba(120,135,150,0.20)` (any case/spacing) | `var(--shadow-md)` |

### Transition

| Old literal | New tokens |
|-------------|-----------|
| `all 0.3s ease-in-out` | Enumerate props + `var(--duration-slow) var(--ease-in-out)` |
| `all 0.2s ease-in-out` | Enumerate props + `var(--duration-base) var(--ease-in-out)` |
| `all 0.5s cubic-bezier(...)` | Pick `var(--duration-slower)` + `var(--ease-out)` or `--ease-bounce` |

---

## 24. How to Add to This Spec

1. **Don't.** Try to compose what you need from existing tokens and components first.
2. If you genuinely need a new primitive (a new colour step, a new spacing value, a new shadow), open a design-system PR — never add it to a feature branch.
3. New components must:
   - Use only tokens from §22
   - Provide a default, hover, focus, and disabled state
   - Render correctly on a 320 px viewport
   - Pass WCAG AA on every text/background pairing
4. New patterns belong in §15 (Section Layout Patterns) — every consumer should be able to copy-paste.
5. The audit (`token-audit-report.md`) is the baseline. Every PR that lands should reduce the violation count, never increase it.
