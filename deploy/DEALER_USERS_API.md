# Backend handoff: Dealer portal users (R-059)

These endpoints are **not** in [Swagger](https://api.fadaid.com/api-docs/#/) yet. The dealer portal calls them when `NEXT_PUBLIC_USE_MOCKS=false`.

These are **portal login users** (controlled access), **not** Key Contacts (`/dealers/contact-persons`).

Roles (fixed enum): `dealer_admin` | `hr` | `viewer`.

Scope with dealer Bearer and optional `X-Dealer-Id`. Invite does **not** share the dealer owner password; the user is a child account under the dealer tenant. Backend emails invite / temp password.

## List

```http
GET /dealers/users?search=&isActive=&page=1&pageSize=10
Authorization: Bearer <dealer access token>
```

Success `200`:

```json
{
  "success": true,
  "message": "Users fetched",
  "data": {
    "items": [
      {
        "id": 1,
        "name": "Priya Shah",
        "email": "priya@sundaram.com",
        "phone": "9876500001",
        "role": "dealer_admin",
        "isActive": true,
        "lastLoginAt": "2026-03-11T08:12:00.000Z",
        "createdAt": "2025-01-10T00:00:00.000Z"
      }
    ],
    "pagination": { "total": 1, "limit": 10, "offset": 0 }
  }
}
```

## Invite

```http
POST /dealers/users
Authorization: Bearer <dealer access token>
Content-Type: application/json
```

Request:

```json
{
  "name": "Amit Rao",
  "email": "amit@sundaram.com",
  "phone": "9876500002",
  "role": "hr"
}
```

Success `200` returns the created user. `409` duplicate email.

## Update / deactivate

```http
PUT /dealers/users/{id}
Authorization: Bearer <dealer access token>
Content-Type: application/json
```

Request:

```json
{
  "name": "Amit Rao",
  "phone": "9876500002",
  "role": "hr",
  "isActive": false
}
```

`409` if deactivating the last active `dealer_admin`.

## Errors

| Status | When |
|--------|------|
| `401` | Unauthorized |
| `404` | User not found |
| `409` | Duplicate email, or last admin deactivate |
| `422` | Validation error |

Please add this group as **Dealer - Users** in Swagger when implemented.
