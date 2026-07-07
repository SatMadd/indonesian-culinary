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

Last Updated: July 7th 2026