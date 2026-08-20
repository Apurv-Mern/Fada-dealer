# FADA Dealer Portal

Static Next.js export for the FADA dealer admin portal. Nginx serves `build/`; the browser talks to a separate Node API via `apiFetch` (direct or same-origin `/api` proxy).

## Quick start

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server (rewrites enabled when `NEXT_PUBLIC_USE_PROXY=true`) |
| `npm run build` | Static export → `out/` copied to `build/` |
| `npm start` | Preview `build/` on port **3000** (no `/api` proxy) |
| `npm run lint` | ESLint |
| `npm test` | Vitest unit tests |

## Environment

See [`.env.example`](.env.example).

- **`NEXT_PUBLIC_USE_MOCKS`** — domain features (branches, employees, …). Default mocks on.
- **Auth** — uses the Node API when proxy is on or `NEXT_PUBLIC_API_URL` is set (`isRealDealerAuthEnabled`), even if domain mocks stay on.
- Rebuild / restart after changing any `NEXT_PUBLIC_*` value.

## Architecture

- Client-only portal (`output: "export"` in production builds)
- Feature modules under `src/features/<domain>/` with `api.ts` + `mocks/` (UI never imports mocks)
- Auth tokens in `localStorage` (shared across tabs); authenticated `401` clears session and redirects to login
- Deploy: upload `build/` only — see [`deploy/DEPLOY.md`](deploy/DEPLOY.md)
