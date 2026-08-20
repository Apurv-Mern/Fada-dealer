# Dealer employee transfer

Live contract: [Dealer - Employeement Transfer](https://api.fadaid.com/api-docs/#/Dealer%20-%20Employeement%20Transfer) (API 1.3.2).

The earlier handoff path `/dealers/employer-transfers` (list / get / accept-reject, plus `fromOutletId`, `effectiveDate`, `reason`) is **superseded**. The dealer portal no longer calls it.

Transfer ends the current assignment (`isCurrentlyWorking=false`) and creates a **new pending EmployeeAssignment** for the target outlet. That pending row is decided on **Join Requests** via `/dealers/employer-invitations`.

## Create transfer

```http
POST /dealers/employeement-transfer
Authorization: Bearer <dealer access token>
X-Dealer-Id: <optional>
Content-Type: application/json
```

Request (`DealerEmployeementTransferRequest`):

```json
{
  "employeeId": 1,
  "outletId": 3,
  "departmentId": 5,
  "designationId": 12
}
```

| Field | Required | Notes |
|-------|----------|--------|
| `employeeId` | Yes | Active employee at this dealer |
| `outletId` | Yes | Target outlet under the active dealer |
| `departmentId` | Yes | OrganizationStructure id (`flag=department`) |
| `designationId` | Yes | OrganizationStructure id (`flag=role`) |

Success `200`: employeement transfer request sent. There is **no** transfer list, get-by-id, or accept/reject endpoint in Swagger.

## Errors

| Status | When |
|--------|------|
| `401` | Unauthorized |
| `403` | `X-Dealer-Id` is not a child of the authenticated dealer |
| `404` | Employee or outlet not found |
| `422` | Validation error |
