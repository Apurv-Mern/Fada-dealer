# Deploy — FADA dealer portal (static Next.js export)

Upload target: `/var/www/apps/dealer/current/build`  
Nginx serves static files; optional `/api/` reverse proxy to the Node backend (no PM2 / no Node on the dealer host for the SPA itself).

## API modes

| `NEXT_PUBLIC_USE_PROXY` | Browser calls | Needs |
|-------------------------|---------------|--------|
| `true` | same-origin `/api/...` | Nginx `location /api/` (prod) or `next dev` rewrites |
| `false` (default) | `NEXT_PUBLIC_API_URL` directly | CORS on Node API |

Always set `NEXT_PUBLIC_API_URL` (upstream / direct origin). Rebuild after changing any `NEXT_PUBLIC_*`.

## 1. Build (CI or local)

```bash
npm ci

# Bake public env at build time:
#   NEXT_PUBLIC_API_URL=https://api.fadaid.com
#   NEXT_PUBLIC_USE_PROXY=true
#   NEXT_PUBLIC_USE_MOCKS=false

npm run build
# → creates out/ then copies to build/
```

## 2. Upload

Copy the **`build/`** folder contents to the server:

```text
/var/www/apps/dealer/current/build/
  index.html
  _next/
  ...
```

Example:

```bash
rsync -avz --delete ./build/ user@server:/var/www/apps/dealer/current/build/
```

Do **not** upload `.next/`, `node_modules/`, or run PM2.

## 3. Nginx

```bash
sudo cp deploy/nginx/dealer.conf /etc/nginx/sites-available/dealer
sudo ln -sf /etc/nginx/sites-available/dealer /etc/nginx/sites-enabled/dealer
sudo nginx -t && sudo systemctl reload nginx
```

The sample config includes `location /api/` → `https://api.fadaid.com/` (required when `NEXT_PUBLIC_USE_PROXY=true`, and for Business Profile images which load via `/api/uploads/...`).

TLS (optional):

```bash
sudo certbot --nginx -d dealer.fadaid.com
```

After Certbot, **copy `location /api/` into the HTTPS server block** as well. Without it, `https://dealer.fadaid.com/api/uploads/...` returns HTML 404 and the profile circle stays empty. Verify with:

```bash
curl -sI https://dealer.fadaid.com/api/uploads/<file>.png
# expect: HTTP 200 and Content-Type: image/png
```

## 4. Local preview of static build

```bash
npm run build
npm start   # serves ./build on port 3000
```

`npm start` does **not** proxy `/api`. For proxy mode locally, use `next dev` (rewrites; `output: "export"` is disabled in development so rewrites work) or Nginx.

## Flow

**Proxy on (`NEXT_PUBLIC_USE_PROXY=true`):**

```
Browser → Nginx (static build/) → HTML/JS/CSS
Browser → same-origin /api/... → Nginx proxy → api.fadaid.com
```

**Proxy off:**

```
Browser → Nginx (static build/) → HTML/JS/CSS
Browser → https://api.fadaid.com (direct; CORS required)
```

## Note on PM2

PM2 is **not** used for static hosting. Do not deploy or start a Node process for this SPA — Nginx serves `build/` only.
