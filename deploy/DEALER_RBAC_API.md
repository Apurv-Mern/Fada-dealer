# Backend handoff: Dealer portal RBAC (Swagger — Dealer - Portal RBAC)

Used by Settings → **Roles & permissions** when `NEXT_PUBLIC_USE_MOCKS=false`.

Primary dealer account (`userType=dealer`) only for role CRUD. Requires `dealer_settings.manage` permission when middleware is wired.

## Module catalog (permission matrix UI)

```http
GET /dealers/modules
Authorization: Bearer <token>
```

Returns sidebar modules with nested permission keys (`dealer_*` prefix).

## Flat permissions (optional)

```http
GET /dealers/permissions
Authorization: Bearer <token>
```

## List roles

```http
GET /dealers/roles?search=&isActive=&limit=10&offset=0
Authorization: Bearer <token>
```

Success `200` → `data.roles[]` + `data.pagination`.

## Create custom role

```http
POST /dealers/roles
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "key": "dealer_sales_lead",
  "name": "Sales Lead",
  "description": "Employees module only",
  "permissions": ["dealer_dashboard.view", "dealer_employees.view"],
  "isActive": true
}
```

`409` if role key exists. `403` for staff accounts.

## Update / delete role

- `GET /dealers/roles/{id}`
- `PUT /dealers/roles/{id}` — replaces permission assignments; super roles ignore permission updates
- `DELETE /dealers/roles/{id}` — `400` for system roles or roles assigned to staff

## Default seeded roles

| key | name | notes |
|-----|------|-------|
| `dealer_admin` | Dealer Admin | Super role — full access |
| `dealer_manager` | Dealer Manager | Manage outlets, employees, requests, reports; view-only staff |
| `dealer_viewer` | Dealer Viewer | Read-only across modules |

## Session bootstrap

Staff login returns `roleId` on the auth envelope. Portal fetches `GET /dealers/roles/{roleId}` after login to populate client-side permission checks. Primary dealer accounts are treated as super-role locally.

## Portal module permission map

| Module | View | Manage / edit |
|--------|------|----------------|
| Dashboard | `dealer_dashboard.view` | — |
| Company Profile | `dealer_company_profile.view` | `dealer_company_profile.edit` |
| Outlets | `dealer_outlets.view` | `dealer_outlets.manage` |
| Employees | `dealer_employees.view` | `dealer_employees.manage` |
| Employment Requests | `dealer_employment_requests.view` | `dealer_employment_requests.manage` |
| Reports | `dealer_reports.view` | `dealer_reports.export` |
| Communications | `dealer_communications.view` | — |
| Settings | `dealer_staff.view` | `dealer_settings.manage` (+ staff CRUD keys) |
