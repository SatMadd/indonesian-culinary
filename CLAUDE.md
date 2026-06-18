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
| `ingredients`       | jsonb     | Array of objects |
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
