# Backend handoff: Dealer portal staff (Swagger — Dealer - Staff)

Portal calls these when `NEXT_PUBLIC_USE_MOCKS=false`. These are **staff login accounts** (`userType=staff`), not the primary dealer owner account.

Scope with dealer Bearer and optional `X-Dealer-Id`. Staff accounts always operate under `parentDealerId`; `X-Dealer-Id` is ignored for staff logins.

## List assignable roles

```http
GET /dealers/staff/roles
Authorization: Bearer <token>
```

Returns active roles where `assignableTo` is `dealer` or `all`.

## List staff

```http
GET /dealers/staff?search=&roleId=&isActive=&limit=10&offset=0
Authorization: Bearer <token>
```

Success `200` → `data.staff[]` + `data.pagination`.

## Create staff

```http
POST /dealers/staff
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "name": "Amit Rao",
  "email": "amit@sundaram.com",
  "phone": "9876500002",
  "roleId": 2,
  "password": "SecurePass1",
  "confirmPassword": "SecurePass1",
  "isActive": true
}
```

Primary dealer account only. Sends temp-password email. `409` duplicate email.

## Update / delete / toggle

- `GET /dealers/staff/{id}`
- `PUT /dealers/staff/{id}` — optional password change
- `DELETE /dealers/staff/{id}` — soft delete; cannot delete own account (`400`)
- `PUT /dealers/staff/{id}/active-inactive` — toggle; cannot toggle own account (`400`)

Staff accounts receive `403` when attempting to manage other staff.

## Portal permissions (staff actions)

| Permission key | UI |
|----------------|-----|
| `dealer_staff.view` | Staff tab list |
| `dealer_staff.create` | Add staff member |
| `dealer_staff.edit` | Edit / activate / deactivate |
| `dealer_staff.delete` | Delete staff member |

See [DEALER_RBAC_API.md](./DEALER_RBAC_API.md) for role definitions.
