<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:static-site -->
# Static site (no SSR)

This dealer portal is a **static export** (`output: "export"` → `build/`). Nginx serves files only; no PM2/Node on the dealer host for the SPA.

- Do **not** add Route Handlers (`app/api`), middleware/proxy auth, or server cookie sessions.
- Features must be **client-side**: fetch via `apiFetch` / `getApiBaseUrl()`, Skeleton loading, auth via `sessionStorage` (`client-auth.ts`).
- See `.cursor/rules/static-site.mdc` and `deploy/DEPLOY.md`.
<!-- END:static-site -->

<!-- BEGIN:api-proxy -->
# API proxy vs direct

`NEXT_PUBLIC_USE_PROXY=true` → browser uses same-origin `/api/*` (Nginx in prod; `next.dev` rewrites with export disabled in development). `false` → call `NEXT_PUBLIC_API_URL` directly. Never hardcode the API host; always `apiFetch`. See `.cursor/rules/api-proxy.mdc`.
<!-- END:api-proxy -->

<!-- BEGIN:section-errors -->
# Shell-stable section errors

After successful login, sidebar + header stay mounted. Domain API failures → `SectionError` in main with Retry (not soft-empty). Authenticated `401` → clear session + redirect to login. See `.cursor/rules/mock-until-api.mdc`.
<!-- END:section-errors -->

<!-- BEGIN:loading-ui -->
# Loading UI

Page and data loading must use **Skeleton** (`Skeleton` / `PageSkeleton` / feature skeletons). Spinners only on button `isLoading`. See `.cursor/rules/skeleton-loading.mdc`.
<!-- END:loading-ui -->

<!-- BEGIN:responsive -->
# Responsiveness

Mobile-first with Tailwind `sm`/`md`/`lg`/`xl`. Sidebar at `lg+`, tables→cards below `md`. See `.cursor/rules/responsive.mdc`.
<!-- END:responsive -->

<!-- BEGIN:mock-until-api -->
# Mock data until Node backend API is ready

The real backend is a **separate Node.js** service. Until mocks are turned off:

- Keep `NEXT_PUBLIC_USE_MOCKS=true` (default if unset — see `isMockMode()`).
- Feature data goes through `src/features/<domain>/api.ts` → `mocks/` when mock mode is on. UI must not import mocks directly.
- When mocks are off, use `apiFetch` / `getApiBaseUrl()`; show `SectionError` on failure (do not soft-empty).
- Auth uses Node `/dealer/auth/*` from the client (`client-auth.ts`); no local Route Handlers.
- To switch domain data off mocks: set `NEXT_PUBLIC_USE_MOCKS=false` and rebuild (public env is build-time).
<!-- END:mock-until-api -->
