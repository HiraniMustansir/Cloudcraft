# Cloudcraft Collective

A collaborative publishing and architecture-design prototype for cloud professionals. The project uses Next.js, React, TypeScript, Tailwind CSS, and Base UI components.

## Run locally

Requirements: Node.js 22.13 or newer and npm.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

To test the production build locally:

```bash
npm run build
npm start
```

## Deploy to Vercel

### Git workflow

1. Push this folder to a GitHub, GitLab, or Bitbucket repository.
2. In Vercel, choose **Add New → Project** and import the repository.
3. Keep the detected framework as **Next.js** and deploy. No environment variables are required for this prototype.

### Vercel CLI

```bash
npx vercel
```

Follow the prompts to connect the folder to your own Vercel account. Use `npx vercel --prod` when you are ready for the production deployment.

## Product documentation

See [`docs/PRD.md`](docs/PRD.md) for the full product requirements and roadmap.
