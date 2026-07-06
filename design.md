# Enaknyo — Design System

## Grounding

Enaknyo's audience is home cooks looking for a specific Indonesian dish,
fast. The design's job is: help them find a dish, trust it's good, and
cook it — not browse a food magazine. Every visual decision should serve
that, not decorate it.

Direction: **clean & minimal**, grounded in actual Indonesian kitchen
materials (turmeric, banana leaf, palm sugar) rather than a generic
cream-and-terracotta "AI food blog" look. Restraint over decoration —
one or two accent colors used consistently beats eight different
gradients on eight category pills.

## Color tokens

Use these exact hex values as Tailwind arbitrary values (`bg-[#FAF8F3]`)
or promote them into `tailwind.config` under `theme.extend.colors` if
that's cleaner for the agent to maintain — either is fine, just don't
invent new colors outside this list.

| Token | Light mode | Dark mode | Use |
|---|---|---|---|
| `bg` | `#FAF8F3` | `#17160F` | Page background |
| `surface` | `#FFFFFF` | `#1F1E1A` | Cards, panels, inputs |
| `surface-muted` | `#F1EFE6` | `#232219` | Skeleton loaders, subtle fills |
| `border` | `#E8E3D8` | `#33322C` | All borders/dividers |
| `ink` | `#1C1B19` | `#F3F0E6` | Primary text |
| `ink-muted` | `#5C5A52` | `#B4B2A9` | Secondary text, descriptions |
| `primary` (banana-leaf green) | `#3F6B4F` | `#6FA47D` | Primary actions, active states, links |
| `secondary` (turmeric gold) | `#C08A2E` | `#E0AA4E` | Badges, highlights, icons |
| `accent` (chili red) | `#8B3A2F` | `#C25646` | Favorites/hearts, errors, spicy indicators only — not decorative |

Do not use orange (`#ff6b00` or similar) anywhere — that's the old brand
color being replaced. Do not introduce gradients on category pills,
buttons, or badges; use flat fills with the tokens above.

## Typography

- **Display/headings** (`h1`, hero titles, page titles): Fraunces serif,
  weight 500–600. Apply via inline `style={{ fontFamily: "'Fraunces', serif" }}`
  or a Tailwind `font-display` utility if one is set up in the config —
  check `tailwind.config` first before adding a duplicate font stack.
- **Body/UI text** (everything else — buttons, labels, card titles, nav):
  the existing default sans stack (`font-sans` / system UI). Don't apply
  the serif to small text; it hurts legibility below ~16px.
- **Numeric/metadata** (cook time, servings, difficulty, prep time): 'JetBrains Mono',
  monospace. This is a deliberate signature — numbers should read like
  precise recipe measurements, not just decorative text.

Both fonts need `<link>` tags in `app/layout.tsx`'s `<head>`:
```
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
<link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@500;600&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet" />
```
Check if these are already present before adding duplicates.

## Component conventions

- **Corners**: `rounded-xl` (cards, pills, inputs) or `rounded-2xl` (larger
  containers like the hero or empty states). Avoid `rounded-3xl` or
  fully pill-shaped buttons except where already established (category
  pills can stay pill-shaped if that's the existing pattern — check
  before changing shape, this doc governs color/type, not layout
  overhauls unless explicitly asked).
- **Borders over shadows**: prefer a 1px `border` token over drop
  shadows for card separation. Only use a subtle shadow on true overlays
  (modals, dropdowns), never on inline cards.
- **Hover states**: border color shifts to `primary`, not a shadow lift
  or scale transform, to keep the "restrained" feel. Existing
  `hover:-translate-y-0.5` type effects should be removed in favor of
  `hover:border-[primary]`.
- **Badges** (region, category, difficulty tags): flat fill using
  `secondary` (gold) as the default badge color, `accent` (chili) only
  for anything favorite/spicy-related, `primary` (green) for active/
  selected states. Never more than these three on one badge type.
- **Icons**: keep using `lucide-react` (already in the project) — recolor
  to match tokens above, don't switch icon libraries.

## What NOT to do

- Don't add new gradients anywhere.
- Don't reintroduce orange.
- Don't apply the serif display font to body copy, buttons, or anything
  under ~16px.
- Don't invent new colors outside the token table — if something doesn't
  fit, ask rather than picking an arbitrary hex.
- Don't change component logic, state, or data-fetching while doing
  visual work — see `CLAUDE.md` for the boundary between design changes
  and logic changes. If a visual change seems to require a logic change,
  stop and flag it rather than doing both at once.
