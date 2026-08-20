# Backend handoff: Dealer employee CSV import (R-092)

This endpoint is **not** in [Swagger](https://api.fadaid.com/api-docs/#/) yet. The dealer portal calls it when `NEXT_PUBLIC_USE_MOCKS=false`.

## Endpoint

```http
POST /dealers/employees/import
Authorization: Bearer <dealer access token>
Content-Type: multipart/form-data
```

| Field | Type | Notes |
|-------|------|--------|
| `file` | `File` (`.csv`) | Required. UTF-8. Suggest max ~2MB |

## CSV columns

Aligned with Add Employee / `DealerEmployeeCreateRequest`:

```csv
name,email,phone,departmentId,designationId,outletId,score,isActive,joinedDate
```

| Column | Required | Maps to `POST /dealers/employees` body |
|--------|----------|----------------------------------------|
| `name` | Yes | `name` |
| `email` | No | `email` |
| `phone` | No | `phone` |
| `departmentId` | No* | `designation.departmentId` (integer) |
| `designationId` | No* | `designation.designationId` (integer) |
| `outletId` | No | `assignment.outletId` (integer) |
| `score` | No | `score` (integer, default `0`) |
| `isActive` | No | `isActive` (`true`/`false`, default `true`) |
| `joinedDate` | No | `joinedDate` (`YYYY-MM-DD`) |

\*If either `departmentId` or `designationId` is set, **both** must be provided (same rule as the Add Employee form). When both are present, send nested `designation: { departmentId, designationId, isActive: true }`.

Do **not** expect `fadaId` or dealership columns — FADA ID is auto-generated; dealership is implied by the dealer token.

Example:

```csv
name,email,phone,departmentId,designationId,outletId,score,isActive,joinedDate
Rahul Sharma,rahul@example.com,9876543210,2,4,12,0,true,2024-06-01
```

Per-row create semantics must match existing `DealerEmployeeCreateRequest` / `POST /dealers/employees`.

## Portal: ID reference CSV (frontend only)

The Import dialog offers **Download ID reference**, which builds `employee-import-id-reference.csv` in the browser from:

| `type` | API |
|--------|-----|
| `department` | `GET /dealers/masters/departments` |
| `designation` | `GET /dealers/masters/designations?parentId={departmentId}` |
| `outlet` | `GET /dealers/outlets/options` |

Reference columns: `type,id,name,parentId,parentName` (designation rows set parent to the department). This file is **not** an upload format for `/import` — it is only a lookup aid for filling `departmentId`, `designationId`, and `outletId` in the employee template.

## Success response (200)

```json
{
  "success": true,
  "message": "Import completed",
  "data": {
    "total": 10,
    "created": 8,
    "failed": 2,
    "errors": [
      { "row": 3, "message": "Email already exists" },
      { "row": 7, "message": "Invalid outletId" }
    ]
  }
}
```

## Error responses

| Status | When |
|--------|------|
| `400` | Bad CSV / missing `name` column / invalid file |
| `401` | Unauthorized |
| `413` | File too large |

Please add this route under **Dealer - Employees** in Swagger when implemented.
