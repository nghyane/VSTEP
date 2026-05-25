# Duolingo — Style Reference

> Playground Starter Kit · VSTEP Frontend V3 design reference

**Theme:** light

The design feels like an energetic, gamified classroom. Its core is built on three choices: the plump, ultra-rounded `feather` headline font, the vibrant Duo Green for primary actions and identity, and charming blob-like character illustrations. The layout uses large white space so colorful elements pop. Primary buttons use a solid bottom shadow to feel tactile and pressable; cards and panels stay flat.

## Tokens — Colors

| Name | Value | Token | Role |
|------|-------|-------|------|
| Duo Green | `#58cc02` | `--color-duo-green` | Primary CTAs, logos, headlines, interactive highlights. |
| Sky Blue | `#1cb0f6` | `--color-sky-blue` | Secondary outline buttons and inline text links. |
| Duo Green Light | `#d7ffb8` | `--color-duo-green-light` | Highlighted or active state backgrounds. |
| Sunshine Yellow | `#ffc700` | `--color-sunshine-yellow` | Illustration warmth/accent. |
| Grape Soda | `#a570ff` | `--color-grape-soda` | Illustration cool/playful accent. |
| Bubblegum Pink | `#cc348d` | `--color-bubblegum-pink` | Illustration vibrant detail. |
| Snow White | `#ffffff` | `--color-snow-white` | Page backgrounds, button text, card surfaces. |
| Cloud Gray | `#e5e5e5` | `--color-cloud-gray` | Secondary borders and dividers. |
| Silver | `#afafaf` | `--color-silver` | Placeholder, disabled, secondary info. |
| Graphite | `#777777` | `--color-graphite` | Body copy and descriptive text. |
| Charcoal | `#4b4b4b` | `--color-charcoal` | Subheadings and secondary headlines. |
| Almost Black | `#3c3c3c` | `--color-almost-black` | Primary body and UI text. |

## Tokens — Typography

### `feather` · `--font-feather`

Used exclusively for large, impactful H1/H2 headlines.

- Substitute: Fredoka One, Baloo 2
- Weights: 700
- Sizes: 48px, 64px
- Line height: 1.2
- Letter spacing: -0.02em

### `din-round` · `--font-din-round`

Workhorse font for UI text, body copy, and buttons. Use wide tracking for the open Duolingo texture.

- Substitute: Nunito Sans, Varela Round
- Weights: 500, 700
- Sizes: 13px, 14px, 15px, 17px, 19px, 32px
- Line height: 1.15-1.47
- Letter spacing: 0.053em

### Type Scale

| Role | Size | Line Height | Letter Spacing | Token |
|------|------|-------------|----------------|-------|
| caption | 13px | 1.4 | 0.69px | `--text-caption` |
| body | 15px | 1.4 | 0.8px | `--text-body` |
| heading-sm | 19px | 1.2 | 1.01px | `--text-heading-sm` |
| heading | 32px | 1.2 | 1.7px | `--text-heading` |
| heading-lg | 48px | 1.2 | -0.96px | `--text-heading-lg` |
| display | 64px | 1.2 | -1.28px | `--text-display` |

## Tokens — Spacing & Shapes

Base unit: 4px. Density: comfortable.

| Name | Value | Token |
|------|-------|-------|
| 8 | 8px | `--spacing-8` |
| 12 | 12px | `--spacing-12` |
| 16 | 16px | `--spacing-16` |
| 24 | 24px | `--spacing-24` |
| 32 | 32px | `--spacing-32` |
| 40 | 40px | `--spacing-40` |
| 48 | 48px | `--spacing-48` |
| 64 | 64px | `--spacing-64` |
| 80 | 80px | `--spacing-80` |
| 96 | 96px | `--spacing-96` |

### Layout

- Page max-width: 1140px
- Section gap: 80-120px
- Card padding: 24px
- Element gap: 16px
- Border radius: 12px for cards, inputs, and buttons

## Components

### Green Headline

Use `feather` at 48px or 64px, weight 700, tight negative tracking, and Duo Green. Use for feature titles like “free. fun. effective.”

### Character Illustration

Large organic vector illustrations with Duo Green, Sunshine Yellow, Grape Soda, and Bubblegum Pink. They should anchor major sections, not act as small decoration.

### Inline Text Link

Use Sky Blue, standard `din-round` body text, and subtle underline on hover.

### Language Flag Item

Small rectangular flag icon plus uppercase Graphite text. The whole item is a link.

## Do's

- Use Duo Green for primary CTAs and brand-voice headlines.
- Use 12px radius on interactive UI.
- Use `feather` only for large 48px+ headlines.
- Create button depth with a solid darker bottom shadow, e.g. `box-shadow: 0 4px 0 #3f8f01`.
- Pair major content sections with a character illustration.
- Use Sky Blue for secondary interactive elements and text links.
- Set body/UI text with `din-round` and `letter-spacing: 0.053em`.

## Don'ts

- Do not use sharp corners.
- Do not use a non-green main “Get Started” action.
- Do not use `feather` for body or small UI text.
- Do not use traditional elevation shadows on cards/panels.
- Do not create text links outside Sky Blue.
- Do not use system fonts as the main visual style.
- Do not design a major section without considering its illustration.

## Elevation

The system is intentionally flat. Depth belongs only to primary buttons through a solid bottom shadow. Cards and containers remain flat on Snow White.

## Imagery

Use custom vector illustrations as central characters: flat, friendly, organic, blobby shapes, simple features, and warm playful colors. Illustrations can occupy up to half the screen width in major sections.

## Page Layout

Use a centered max-width layout on Snow White. Hero sections are asymmetric: illustration on one side, text and CTAs on the other. Below hero, use generous vertical spacing and alternate two-column sections.

## Agent Prompt Guide

### Quick Color Reference

- Page background: `#ffffff` Snow White
- Primary text: `#3c3c3c` Almost Black
- Primary CTA: `#58cc02` Duo Green
- Secondary action: `#1cb0f6` Sky Blue
- Borders: `#e5e5e5` Cloud Gray

### Example Component Prompts

1. Primary button: background `#58cc02`, text `#ffffff`, radius 12px, `din-round` 15px/700, padding 16px 32px, `box-shadow: 0 4px 0 #3f8f01`.
2. Headline: `feather` 64px/700, color `#58cc02`, letter-spacing -1.28px.
3. Outline button: transparent background, text `#1cb0f6`, border `2px solid #e5e5e5`, radius 12px, `din-round` 15px/700, padding 14px 24px.

## Quick Start

### CSS Custom Properties

```css
:root {
  --color-duo-green: #58cc02;
  --color-sky-blue: #1cb0f6;
  --color-duo-green-light: #d7ffb8;
  --color-sunshine-yellow: #ffc700;
  --color-grape-soda: #a570ff;
  --color-bubblegum-pink: #cc348d;
  --color-snow-white: #ffffff;
  --color-cloud-gray: #e5e5e5;
  --color-silver: #afafaf;
  --color-graphite: #777777;
  --color-charcoal: #4b4b4b;
  --color-almost-black: #3c3c3c;

  --font-feather: 'feather', ui-sans-serif, system-ui, sans-serif;
  --font-din-round: 'din-round', ui-sans-serif, system-ui, sans-serif;

  --text-caption: 13px;
  --leading-caption: 1.4;
  --tracking-caption: 0.69px;
  --text-body: 15px;
  --leading-body: 1.4;
  --tracking-body: 0.8px;
  --text-heading-sm: 19px;
  --leading-heading-sm: 1.2;
  --tracking-heading-sm: 1.01px;
  --text-heading: 32px;
  --leading-heading: 1.2;
  --tracking-heading: 1.7px;
  --text-heading-lg: 48px;
  --leading-heading-lg: 1.2;
  --tracking-heading-lg: -0.96px;
  --text-display: 64px;
  --leading-display: 1.2;
  --tracking-display: -1.28px;

  --spacing-unit: 4px;
  --spacing-8: 8px;
  --spacing-12: 12px;
  --spacing-16: 16px;
  --spacing-24: 24px;
  --spacing-32: 32px;
  --spacing-40: 40px;
  --spacing-48: 48px;
  --spacing-64: 64px;
  --spacing-80: 80px;
  --spacing-96: 96px;

  --page-max-width: 1140px;
  --card-padding: 24px;
  --element-gap: 16px;
  --radius-xl: 12px;
  --radius-cards: 12px;
  --radius-inputs: 12px;
  --radius-buttons: 12px;
}
```

### Tailwind v4 `@theme`

```css
@theme {
  --color-duo-green: #58cc02;
  --color-sky-blue: #1cb0f6;
  --color-duo-green-light: #d7ffb8;
  --color-sunshine-yellow: #ffc700;
  --color-grape-soda: #a570ff;
  --color-bubblegum-pink: #cc348d;
  --color-snow-white: #ffffff;
  --color-cloud-gray: #e5e5e5;
  --color-silver: #afafaf;
  --color-graphite: #777777;
  --color-charcoal: #4b4b4b;
  --color-almost-black: #3c3c3c;

  --font-feather: 'feather', ui-sans-serif, system-ui, sans-serif;
  --font-din-round: 'din-round', ui-sans-serif, system-ui, sans-serif;

  --text-caption: 13px;
  --leading-caption: 1.4;
  --tracking-caption: 0.69px;
  --text-body: 15px;
  --leading-body: 1.4;
  --tracking-body: 0.8px;
  --text-heading-sm: 19px;
  --leading-heading-sm: 1.2;
  --tracking-heading-sm: 1.01px;
  --text-heading: 32px;
  --leading-heading: 1.2;
  --tracking-heading: 1.7px;
  --text-heading-lg: 48px;
  --leading-heading-lg: 1.2;
  --tracking-heading-lg: -0.96px;
  --text-display: 64px;
  --leading-display: 1.2;
  --tracking-display: -1.28px;

  --spacing-8: 8px;
  --spacing-12: 12px;
  --spacing-16: 16px;
  --spacing-24: 24px;
  --spacing-32: 32px;
  --spacing-40: 40px;
  --spacing-48: 48px;
  --spacing-64: 64px;
  --spacing-80: 80px;
  --spacing-96: 96px;

  --radius-xl: 12px;
}
```

## Similar Brands

- Headspace — friendly rounded illustrations and approachable UI.
- Kahoot! — gamified learning with bold colors and simple UI.
- Mailchimp — quirky brand-defining illustrations and strong single-color identity.
- Discord — rounded custom typography and mascot-driven playful UI.
