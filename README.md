# Sayanox Info — Collaborative Knowledge Base

Wikipedia-style, admin-moderated, community-driven knowledge base for **Sayanox** (AI-native programming language, tools & ecosystem).

## Features

- **Public Contributions**: Logged-in users can create pages or propose edits
- **Admin / Moderator Control**: Review, approve, reject, or edit contributions
- **Full Database (Supabase)**: Real-time capable Postgres backend
- **Full-text Search**: Indexed titles + content + categories + tags
- **Version History**: Every change is stored
- **Categories & Tags**
- **Dark Mode + Fully Responsive (Mobile-first)**
- **SEO Ready**: Metadata, clean URLs (`/page/slug`)
- **Authentication**: Email + (optional) OAuth via Supabase Auth

## Tech Stack

- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS** + shadcn/ui style components
- **Supabase** (Auth + Postgres + RLS)
- **react-markdown** + remark-gfm
- **next-themes** for dark mode
- Deployable on **Vercel** in one click

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/sayan9168/sayanox-info.git
cd sayanox-info
npm install
```

### 2. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) → New Project
2. Copy **Project URL** and **anon public key**
3. Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Run the SQL Schema

In Supabase Dashboard → SQL Editor → New Query → paste the entire contents of `supabase-schema.sql` → Run.

### 4. Make yourself Admin

After signing up once via the app:

```sql
update public.profiles 
set role = 'admin' 
where id = 'your-user-uuid';
```

### 5. Run Locally

```bash
npm run dev
```

Open http://localhost:3000

### 6. Deploy to Vercel

1. Import this repo in Vercel
2. Add the two environment variables
3. Deploy

## License

MIT — Built for the Sayanox community.
