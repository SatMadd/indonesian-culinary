@AGENTS.md

## Project Name
**Enaknyo** - Web Resep Kuliner Indonesia

A website showcasing Indonesian recipes (masakan nusantara): recipe
grids, regional categories, search/filters, and user accounts with
favorites.

## Current phase: modernization

This project was originally built some months ago and is now being
**modernized** — both visually and functionally. This is not a greenfield
build. Two things are true at once:

1. The app is real and running in production (Vercel), with a real
   Supabase database containing ~1,335 recipes (bulk-imported from an
   external source, on top of whatever was there before).
2. A lot of the original build has rough edges: dead-end UI elements,
   silent error handling, hardcoded assumptions that don't match the
   real data, and a visual design (orange theme, heavy gradients) that's
   being actively replaced.

**Do not treat this as a rebuild.** Prefer fixing/restyling what exists
over rewriting from scratch, unless a section is asked to be replaced
outright. Always check the live Supabase schema and the actual current
code before assuming anything below — including this file — is still
accurate. This file itself has drifted from reality before (an earlier
version wrongly claimed `ingredients` was an array of objects when the
real column is an array of strings); don't repeat that mistake by
documenting aspiration instead of what's actually deployed.

## Tech Stack (actual, verified)

- **Next.js** (App Router — `app/` folder, TypeScript)
- **Tailwind CSS** (verify whether shadcn/ui is actually installed and
  used before assuming it's available — the original project doc
  claimed it, but confirm via `package.json` and `components/ui/`
  before relying on it)
- **Supabase** (PostgreSQL + Auth), client via `@/utils/supabase/client`
  (browser) and `@/utils/supabase/server` (server components)
- **Vercel** (deployment)

## Design direction

The old vibrant-orange theme is being replaced. See `design.md` in the
project root for the full current design system (color tokens,
typography, component conventions — clean/minimal, grounded in
Indonesian kitchen materials rather than a generic food-blog look).
Always check `design.md` before styling anything; don't default back to
orange or gradients out of habit from the old build.

## Database Schema (Supabase) — verified against live DB

Table name is **`recipes_db`**, not `recipes`. `id` is `int8` (identity),
not `uuid`. Reconfirm via Table Editor or a scratch script if in doubt —
this is the actual current shape, not the original plan:

### Table: `recipes_db`
| Column | Type | Notes |
|---|---|---|
| `id` | `int8` (identity) | Primary key |
| `created_at` | `timestamptz` | |
| `title` | `text` | |
| `slug` | `text` | Unique; used as the route param in `app/recipes/[slug]` |
| `description` | `text` | Non-null, empty string `""` if none (never `null`) |
| `image_url` | `text` | Any new image host must be added to `next.config.ts`'s `images.remotePatterns` or `<Image>` fails silently |
| `region` | `text` | Non-null, empty string `""` if unknown. Free text, not a fixed enum — most bulk-imported recipes have no region set. Filtering logic must handle arbitrary/empty region values, not just a hardcoded shortlist like Jawa/Padang/Sunda/Betawi |
| `prep_time` | `int4` | Non-null, defaults to `0` |
| `cook_time` | `int4` | Non-null, defaults to `0` |
| `servings` | `int2` | |
| `ingredients` | `jsonb`, stores a **flat array of strings** (e.g. `["1 ekor ayam kampung, potong kecil-kecil"]`) — NOT an array of `{amount, unit, name}` objects. Matches the `Recipe` TypeScript type (`ingredients: string[]`) |
| `steps` | `jsonb`, flat array of strings, one per instruction |
| `is_popular` | `bool` | |
| `difficulty` | `text`, convention-constrained (not a DB enum) to lowercase `'mudah' \| 'sedang' \| 'sulit'` — always lowercase when writing |
| `user_id` | `uuid`, nullable, FK to `auth.users.id` | Null for recipes with no specific owner (e.g. bulk-imported ones) |

### Table: `favorites`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | |
| `user_id` | `uuid`, FK to `auth.users.id` | |
| `recipe_id` | `int8`, FK to `recipes_db.id` | Cast with `Number(...)` when comparing — it's a plain integer, not a UUID |
| `created_at` | `timestamptz` | |

## Data flow conventions

- **Guest vs. authenticated users**: guests use `localStorage` for
  favorites (`enaknyo_favorites`, array of recipe slugs) and custom
  recipes (`enaknyo_local_recipes`, array of `Recipe` objects).
  Authenticated users use the `favorites` and `recipes_db` tables. Any
  component reading favorites/custom-recipes must check BOTH sources
  and combine them — a past bug only checked one and silently omitted
  guest-created recipes from their own favorites list.
- **Favorite toggle must be optimistic-safe, not optimistic-blind**:
  never flip the UI's favorited state before confirming the Supabase
  write succeeded. On failure, keep the prior UI state and surface a
  brief inline error rather than failing silently to the console only.
- **Fallback recipes**: `lib/data/recipes.ts` exports `FALLBACK_RECIPES`,
  shown when the Supabase fetch fails or returns empty, or blended in
  when their slugs aren't already in the DB. If a guest favorites a
  fallback recipe, it gets seeded into `recipes_db` on the fly so it has
  a real `id` for the `favorites` FK — this should eventually move to an
  upsert (`onConflict: 'slug'`) to avoid duplicate-row races, but hasn't
  caused a confirmed issue yet.
- **Region filtering**: never hardcode a shortlist of regions to check
  against — treat any category value that isn't one of the known
  non-region categories (`kue`, `lauk pauk`, `sayuran`, `seafood`) as a
  generic region match against `recipe.region`.
- **Difficulty**: always compare/store lowercase, constrained to
  `'mudah' | 'sedang' | 'sulit'`. Normalize any user-submitted or
  scraped value against this before writing.

## Known non-obvious gotchas

- Next.js `<Image>` requires every external image hostname to be listed
  in `next.config.ts`'s `images.remotePatterns`, or it fails silently
  (broken image, no visible error). Check this file before adding any
  new recipe image source.
- `ingredients`/`steps` are `jsonb` columns but always store flat string
  arrays — don't assume object shape from the column type alone.
- Many recipes (particularly bulk-imported ones) have `region: ""` —
  this is expected, not a bug. UI should simply not render a region
  badge when empty, rather than showing "null" or a broken tag.

## Roles & moderation system (in progress)

The app is moving from "anyone writes, anyone's recipe goes live
immediately" to a moderated model with two roles: `user` and `admin`.

### `profiles` table
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK, FK to `auth.users.id` |
| `role` | `text` | `'user'` \| `'admin'`, default `'user'` |
| `display_name` | `text` | Nullable; suggested default for `author_name` on recipes |
| `created_at` | `timestamptz` | |

A row must be created here automatically on signup (via a Supabase
trigger on `auth.users` insert, or in the register flow) — a user with
no `profiles` row should be treated as role `'user'`, never as an error
state or as `'admin'`.

### `recipes_db` additions
- `status`: `'pending' | 'approved' | 'rejected'`, default `'pending'`
  for new user-submitted rows. Bulk-imported/scraped recipes are
  inserted directly as `'approved'`.
- `reviewed_by` (`uuid`, nullable, FK to `profiles.id`), `reviewed_at`
  (`timestamptz`, nullable), `rejection_reason` (`text`, nullable).
- `author_name` (`text`, nullable) — free text, defaults to the
  submitter's `display_name` but stays editable on the write form.

**All public-facing queries (homepage, search, detail page) must filter
`status = 'approved'`.** Only the recipe's own author and admins should
ever see `pending`/`rejected` rows for that recipe.

### `recipe_change_requests` table (new)
Handles edit and delete proposals for already-approved recipes — the
live row is never modified directly by a user edit or delete action.

| Column | Type | Notes |
|---|---|---|
| `id` | `int8` | PK |
| `recipe_id` | `int8` | FK to `recipes_db.id` |
| `requested_by` | `uuid` | FK to `auth.users.id` |
| `type` | `text` | `'edit'` \| `'delete'` |
| `proposed_data` | `jsonb`, nullable | Full proposed new field set for edits; null for deletes |
| `status` | `text` | `'pending'` \| `'approved'` \| `'rejected'` |
| `reviewed_by` / `reviewed_at` / `rejection_reason` | same pattern as `recipes_db` |
| `created_at` | `timestamptz` | |

Flow: user submits an edit/delete on their own recipe → row written
here, live recipe untouched → admin reviews in `/admin` → on approval,
apply `proposed_data` onto `recipes_db` (edit) or move the row to
`recipes_archive` and remove/deactivate it in `recipes_db` (delete).

### `recipes_archive` table (new)
Same column shape as `recipes_db` plus `deleted_at`, `deleted_by`,
`original_id`. Approved deletions are soft-deletes: copy to this table
before removing from `recipes_db`. Never hard-delete without archiving
first — this is the safety net for accidental/malicious removals.

### Access rules (enforce via Supabase RLS, not just UI checks)
- Anyone can read `recipes_db` where `status = 'approved'`.
- A user can read their own `pending`/`rejected` rows (`user_id = auth.uid()`).
- Only `admin` role can update `status`, `reviewed_by`, `reviewed_at` on
  `recipes_db`, or read/write `recipe_change_requests` and
  `recipes_archive` beyond their own submitted requests.
- Non-admins hitting `/admin` should be redirected, not shown a broken
  or empty dashboard — check `profiles.role` server-side, not just
  hide UI elements client-side (client-side-only hiding is not real
  access control).

### New/changed pages
- `/admin` — pending recipes queue, pending edit/delete request queue
  (with a diff view for edits comparing live vs. `proposed_data`),
  basic recipe management. Admin-only, guarded server-side.
- Write page (`app/write/page.tsx`) — add `author_name` input, default
  to the user's `profiles.display_name` if set. New submissions get
  `status: 'pending'`, not immediately live.
- Recipe owner's edit/delete actions write to `recipe_change_requests`
  instead of mutating `recipes_db` directly. Show the recipe's own
  pending/rejected status to its owner somewhere (e.g. a "Resep Saya"
  view or sidebar section), including `rejection_reason` if rejected.



- Use Server Components where practical; the existing homepage
  (`app/page.tsx`) and several components are currently Client
  Components (`'use client'`) for interactivity (search params, live
  filtering, auth state) — that's an intentional existing pattern, not
  automatically wrong, but don't add `'use client'` to new code unless
  it actually needs client-side interactivity.
- Use `next/link`'s `Link` for all internal navigation — not plain
  `<a>` tags (this was a real bug found in an audit: `<a>` tags caused
  full page reloads instead of client-side navigation).
- Image optimization via `next/image` (remember the `remotePatterns`
  requirement above).
- Keep visual/design changes and logic changes separate. If a design
  task seems to require a logic change, stop and flag the conflict
  rather than resolving both at once in the same pass.

## Current status (as of this modernization pass)

- ~1,335 recipes bulk-imported into `recipes_db` from an external source
  (most lack a `region` value — expected). All imported as `status:
  'approved'` once the moderation system below is implemented.
- Known Tier 1/2 logic bugs (favorite-toggle false success, hardcoded
  region filtering, incomplete guest favorites list, missing null
  guards) have been fixed — see git history / recent commits for
  specifics rather than assuming this list is exhaustive.
- Visual redesign in progress: homepage (`Hero.tsx`, `RecipeCard.tsx`,
  `app/page.tsx`) done; recipe detail page, write/submit page, and
  nav/sidebar still pending as of this writing.
- Roles & moderation system (see section above) is planned but not yet
  implemented — this is the next major feature pass. Until it ships,
  all recipes remain immediately public with no approval step and no
  `profiles`/`status`/`recipe_change_requests`/`recipes_archive` tables
  exist yet.
- Remaining known gaps (not yet addressed): no image upload to Supabase
  Storage on the write/submit page (URL-paste only), no guest-to-account
  data migration on login/register, an unused `activeStep` state in
  `RecipeDetailClient.tsx` with no functional purpose.

## How to use this file

Always check this file for context before making changes — but verify
anything schema- or data-related against the live Supabase project
first, since this file can drift. Update this file whenever a major
architectural or data-shape change is made, so it doesn't go stale
again.

Last Updated: July 7, 2026

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

Last updated: July 6, 2026