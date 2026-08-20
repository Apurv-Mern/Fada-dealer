# Backend handoff: Invite employee by FADA ID (joining search)

The dealer portal uses these **Swagger** endpoints when `NEXT_PUBLIC_USE_MOCKS=false`.

Search an existing FADA identity, then send a **pending join invitation** (not an immediate rejoin).

Scope with dealer Bearer and optional `X-Dealer-Id`.

Swagger: [Dealer - Employees / joining](https://api.fadaid.com/api-docs/#/Dealer%20-%20Employees/get_dealers_employees_joining) · [Employer Invitations / send](https://api.fadaid.com/api-docs/#/Dealer%20-%20Employer%20Invitations/post_dealers_employer_invitations_send)

## Search (joining lookup)

```http
GET /dealers/employees/joining?search=fada-df-12345
Authorization: Bearer <dealer access token>
```

| Query | Required | Notes |
|-------|----------|-------|
| `search` | Yes | Partial or full FADA ID |

Success `200`:

```json
{
  "success": true,
  "message": "Employees fetched successfully",
  "data": [
    {
      "id": 101,
      "fadaId": "fada-df-12345",
      "name": "Rahul Nair",
      "email": "rahul@example.com",
      "phone": "+91 9876543210"
    }
  ]
}
```

| Status | When |
|--------|------|
| `200` + empty `data` | Portal treats as not found |
| `401` | Unauthorized |
| `403` | Invalid `X-Dealer-Id` |

## Send invitation

```http
POST /dealers/employer-invitations/send
Authorization: Bearer <dealer access token>
Content-Type: application/json
```

Request:

```json
{
  "employeeId": 12,
  "outletId": 3,
  "departmentId": 5,
  "designationId": 12
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `employeeId` | Yes | From joining search result |
| `outletId` | Yes | Target outlet under active dealer |
| `departmentId` | Yes | OrganizationStructure (department) |
| `designationId` | Yes | OrganizationStructure (role); must belong to department |

Success `200`: pending `EmployeeAssignment` created; appears in `GET /dealers/employer-invitations` and dealer **Join Requests** UI.

| Status | When |
|--------|------|
| `400` | Employee already working at another company |
| `401` | Unauthorized |
| `403` | Invalid `X-Dealer-Id` |
| `422` | Validation error (missing fields) |

## Portal UI flow

1. **Employees → Invite Employee** opens dialog.
2. User searches by FADA ID → `GET /dealers/employees/joining?search=…`.
3. If multiple matches, user picks one row.
4. User selects branch, department, designation → **Invite** → `POST /dealers/employer-invitations/send`.
5. Success toast; invitation is pending until accepted via Join Requests workflow.

## Superseded endpoints

The previous handoff paths below are **not** used by the portal anymore:

- ~~`GET /dealers/employees/lookup?fadaId=…`~~
- ~~`POST /dealers/employees/{id}/rejoin`~~
