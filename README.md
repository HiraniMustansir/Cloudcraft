# Cloudcraft Collective

A collaborative publishing and architecture-design prototype for cloud professionals. The project uses Next.js, React, TypeScript, Tailwind CSS, and Base UI components.

## Run locally

Requirements: Node.js 22.13 or newer and npm.

```bash
npm install
npm run dev
```

Open [http://localhost:3001](http://localhost:3001).

## Supabase email authentication

Copy `.env.example` to `.env.local` and add the project URL and publishable key. The local credentials are already configured in this checkout.

In Supabase, open **Authentication → URL Configuration** and add:

- `http://localhost:3001/auth/callback`
- `https://your-vercel-domain.vercel.app/auth/callback`

New accounts created through the app are tagged with `account_type: developer` in Supabase Auth user metadata.

### Create the application database

1. Open **Supabase Dashboard → SQL Editor → New query**.
2. Copy the complete contents of `supabase/migrations/001_cloudcraft.sql`.
3. Paste it into the query editor and choose **Run**.

The migration creates profiles, architectures, version history, follows, bookmarks, likes, comments, and pull requests. It also enables Row Level Security so public content is readable while changes remain restricted to their owners. Existing Auth users are automatically given profiles.

After running it, restart the local app:

```bash
npm run dev
```

To test the production build locally:

```bash
npm run build
npm start
```

## Deploy to Vercel

### Git workflow

1. Push this folder to a GitHub, GitLab, or Bitbucket repository.
2. In Vercel, choose **Add New → Project** and import the repository.
3. Keep the detected framework as **Next.js**.
4. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in the Vercel project environment variables, then deploy.

### Vercel CLI

```bash
npx vercel
```

Follow the prompts to connect the folder to your own Vercel account. Use `npx vercel --prod` when you are ready for the production deployment.

## Product documentation

See [`docs/PRD.md`](docs/PRD.md) for the full product requirements and roadmap.
