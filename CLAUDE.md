@AGENTS.md

## Project Name
**Enaknyo** - Web Resep Kuliner Indonesia

A beautiful, landscape-oriented website showcasing Indonesian recipes (masakan nusantara). The site features a vibrant orange theme, recipe grids, regional categories, and user features.

## Goal
Build a full-featured recipe website with:
- Stunning food photography
- Easy-to-follow recipes
- Search + filters by region/ingredients
- User authentication & favorite recipes
- Responsive design optimized for wide desktop (landscape)

---

## Tech Stack

### Frontend / Fullstack
- **Next.js 15** (App Router, TypeScript, Server Components)
- **Tailwind CSS** + shadcn/ui (for components)
- **TypeScript**

### Backend & Database
- **Supabase** (PostgreSQL + Auth + Storage)
  - Main table: `recipes`
  - Auth for user features

### Deployment
- **Vercel** (recommended)

### Design Reference
- Figma: https://www.figma.com/make/hhnzTlhqvqe1GKswSmeoPs/Web-Resep-Kuliner-Indonesia
- Orange dominant color (#FF6200 or similar)
- Clean, modern food blog style

---

## Database Schema (Supabase)

### Table: `recipes`
| Column              | Type      | Description |
|---------------------|-----------|-----------|
| `id`                | uuid      | Primary key |
| `created_at`        | timestamptz | Auto |
| `title`             | text      | Recipe title |
| `slug`              | text      | URL slug |
| `description`       | text      | Short description |
| `image_url`         | text      | Supabase Storage URL |
| `region`            | text      | e.g. "Jawa", "Padang", "Sunda" |
| `prep_time`         | integer   | Minutes |
| `cook_time`         | integer   | Minutes |
| `servings`          | integer   | Number of people |
| `ingredients`       | jsonb     | Array of strings |
| `steps`             | jsonb     | Array of strings |
| `is_popular`        | boolean   | For popular section |
| `difficulty`        | text      | "mudah", "sedang", "sulit" |

### Other Tables
- `favorites` (user_id, recipe_id)
- Supabase `auth.users`

---

## Project Structure (Expected)

```
indonesian-culinary/
├── app/
│   ├── (auth)/
│   ├── (main)/
│   ├── api/
│   ├── layout.tsx
│   ├── page.tsx                 ← Homepage
│   └── recipes/[slug]/page.tsx  ← Detail page
├── components/
│   ├── ui/                      ← shadcn components
│   ├── RecipeCard.tsx
│   ├── Navbar.tsx
│   ├── Hero.tsx
│   └── SearchFilters.tsx
├── lib/
│   └── supabase/
│       ├── client.ts
│       ├── server.ts
│       └── middleware.ts
├── public/
├── types/
└── .env.local
```

---

## Key Features To Implement

1. **Homepage**
   - Hero banner with search
   - Pencarian Populer (popular recipes grid)
   - Kategori Pilihan (colored category buttons)

2. **Recipe Listing**
   - Infinite scroll or pagination
   - Filters (region, time, difficulty)

3. **Recipe Detail**
   - Large image
   - Ingredients (checklist)
   - Step-by-step instructions
   - Save to favorites

4. **User System**
   - Sign up / Login
   - My Collection (Koleksi Resep)

5. **Admin / Content**
   - Easy way to add new recipes (later: admin dashboard)

---

## Coding Guidelines

- Use **Server Components** by default
- Use **Server Actions** for mutations
- Tailwind classes should match Figma closely
- Image optimization with `next/image`
- Good SEO: metadata, Open Graph for each recipe
- Mobile + Wide Desktop responsive

## Current Status
- Next.js project created
- Supabase project + `recipes` table ready
- Design reference available

---

## How to Use This File
When working on this project, always refer to this CLAUDE.md for context. Update it when major changes are made.

**Prompt example for AI:**
> "Based on CLAUDE.md and the Figma design, create the homepage component with popular recipes grid fetching from Supabase."

---
Last updated: June 2026

# Enaknyo — Project Guide for Agents

## Stack
- Next.js (App Router — `app/` folder, not `pages/`)
- Supabase (Postgres + Auth), client created via `@/utils/supabase/client`
  (browser) and `@/utils/supabase/server` (server components)
- Tailwind CSS
- Deployed on Vercel

## Database schema — source of truth

The database is the source of truth, not this file. If anything below
looks wrong, check the live schema via Supabase's Table Editor or a
scratch script before trusting this doc — schemas drift and docs get
stale (this happened once already: this file used to describe
`ingredients` as a jsonb array of objects when the real column had been
migrated to a plain string array).

### `recipes_db`
| Column | Type | Notes |
|---|---|---|
| `id` | `int8` (identity) | Primary key |
| `created_at` | `timestamptz` | |
| `title` | `text` | |
| `slug` | `text` | Must be unique; used as the route param in `app/recipes/[slug]` |
| `description` | `text` | Non-null, empty string `""` if no description (never `null`) |
| `image_url` | `text` | Full URL. Next.js `next.config.ts` must whitelist any new image host under `images.remotePatterns` or `<Image>` will silently fail to render |
| `region` | `text` | Non-null, empty string `""` if unknown (never `null`). Free text — NOT limited to a fixed enum. Any filtering logic must handle arbitrary region strings, not just a hardcoded shortlist |
| `prep_time` | `int4` | Non-null, defaults to `0` |
| `cook_time` | `int4` | Non-null, defaults to `0` |
| `servings` | `int2` | |
| `ingredients` | `jsonb`, but always stores a **flat array of strings** — e.g. `["1 ekor ayam kampung, potong kecil-kecil", "2 sdt garam"]`. NOT an array of `{amount, unit, name}` objects. Match this exactly in the `Recipe` TypeScript type (`ingredients: string[]`) |
| `steps` | `jsonb`, flat array of strings (one per instruction step) |
| `is_popular` | `bool` | |
| `difficulty` | `text`, but constrained by convention (not a DB enum) to lowercase `'mudah' \| 'sedang' \| 'sulit'` — always lowercase when writing, never title-case |
| `user_id` | `uuid`, nullable, FK to `auth.users.id` | Null for recipes with no specific owner (e.g. bulk-imported ones) |

### `favorites`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | |
| `user_id` | `uuid`, FK to `auth.users.id` | |
| `recipe_id` | `int8`, FK to `recipes_db.id` | Cast with `Number(...)` when comparing — the ID is a plain integer, not a UUID |
| `created_at` | `timestamptz` | |

## Data flow conventions

- **Guest vs. authenticated users**: guests use `localStorage` for
  favorites (`enaknyo_favorites`, an array of recipe slugs) and custom
  recipes (`enaknyo_local_recipes`, an array of `Recipe` objects).
  Authenticated users use the `favorites` and `recipes_db` Supabase
  tables. Any component reading favorites/custom-recipes must check
  BOTH sources and combine them where relevant (this was a real bug —
  see `components/Sidebar.tsx` history) rather than assuming one path.
- **Favorite toggle must be optimistic-safe, not optimistic-blind**:
  never flip the UI's favorited state before confirming the Supabase
  write succeeded. On failure, keep the prior state and surface a brief
  inline error, don't fail silently to the console only.
- **Fallback recipes**: `lib/data/recipes.ts` exports `FALLBACK_RECIPES`,
  a hardcoded array shown when the Supabase fetch fails or returns
  empty, or blended in when its slugs aren't already in the DB. If a
  guest favorites a fallback recipe, it gets seeded into `recipes_db`
  on the fly so it can have a real `id` for the `favorites` FK. Any
  future work here should move this to an upsert (`onConflict: 'slug'`)
  to avoid duplicate-row races if it becomes a code path anyone touches.
- **Region filtering**: never hardcode a shortlist of regions (e.g. just
  Jawa/Padang/Sunda/Betawi) to check against — the actual data has many
  more region values (and many recipes have no region at all, `""`).
  Filter generically: if a category value isn't one of the known
  non-region categories (`kue`, `lauk pauk`, `sayuran`, `seafood`),
  treat it as a region match against `recipe.region`.
- **Difficulty**: always compare/store lowercase. The `Recipe` type
  constrains this to `'mudah' | 'sedang' | 'sulit'` — validate/normalize
  any user-submitted or scraped value against this before writing.

## Known non-obvious gotchas

- Next.js `<Image>` requires every external image hostname to be listed
  in `next.config.ts`'s `images.remotePatterns`, or it fails silently
  (renders a broken image, no console error visible to end users).
  When adding any new recipe image source, check this file first.
- `recipes_db.ingredients` and `.steps` are `jsonb` columns but the
  actual JSON stored is always a flat string array — don't assume
  object shape from the column type alone.
- Scraped/imported recipes may have `region: ""` for the majority of
  rows — this is expected, not a bug, since the source data doesn't tag
  by Indonesian province. UI should handle an empty region gracefully
  (e.g. simply not render a region badge) rather than showing "null" or
  a broken empty tag.

## Design system

See `design.md` for the full visual design system (colors, type,
component conventions). Keep logic changes and visual changes separate:
if a design task seems to require changing data-fetching, filtering, or
state logic, stop and flag it rather than doing both in one pass.

Last updated: July 7, 2026