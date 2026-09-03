# Dealer employee CSV import

Swagger: [POST /dealers/employees/import](https://api.fadaid.com/api-docs/#/Dealer%20-%20Employees/post_dealers_employees_import)

The dealer portal uploads a **CSV file in the browser**, parses it client-side, and POSTs a **JSON array** to the Node API when `NEXT_PUBLIC_USE_MOCKS=false`.

## Endpoint

```http
POST /dealers/employees/import
Authorization: Bearer <dealer access token>
X-Dealer-Id: <optional child dealer id>
Content-Type: application/json
```

| Body | Type | Notes |
|------|------|--------|
| JSON array | `DealerEmployeeImportItem[]` | Parsed from CSV in the portal; must not be empty |

## CSV columns (template download)

Aligned with Swagger `DealerEmployeeImportItem` — all columns **required** per row:

```csv
name,email,phone,designation,department,outletCode,startDate
John Doe,john@example.com,9876543210,Sales Executive,Sales,OT583721,2026-01-15
```

| Column | Required | Notes |
|--------|----------|--------|
| `name` | Yes | Employee full name |
| `email` | Yes | Valid email |
| `phone` | Yes | Contact number |
| `designation` | Yes | Organization structure role **name** (slug role) |
| `department` | Yes | Organization structure department **name** (slug department) |
| `outletCode` | Yes | Global outlet code `OT######` (pattern `^OT[1-9][0-9]{5}$`) |
| `startDate` | Yes | Assignment start date `YYYY-MM-DD` |

New employees receive an auto-generated FADA ID, pending status, and a temporary password email. Existing employees (matched by email or phone) are linked via a new assignment when they are not currently working elsewhere.

## Portal: reference CSV (frontend only)

The Import dialog offers **Download reference**, which builds `employee-import-reference.csv` in the browser from:

| `type` | Source API | Columns in reference file |
|--------|------------|---------------------------|
| `department` | `GET /dealers/masters/departments` | `type,name` |
| `designation` | `GET /dealers/masters/designations?parentId={departmentId}` | `type,name,department` |
| `outlet` | `GET /dealers/outlets/options` | `type,name,outletCode` |

Reference columns: `type,name,department,outletCode`. This file is **not** an upload format — it is only a lookup aid for filling import template values.

## Success response (200)

Returns **skipped rows only** in `data` (successful imports are not listed):

```json
{
  "success": true,
  "message": "Import completed",
  "data": [
    {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "9876543210",
      "designation": "Sales Executive",
      "department": "Sales",
      "outletCode": "OT583721",
      "startDate": "2026-01-15",
      "reason": "Employee already working presently."
    }
  ]
}
```

### Skip reasons (`reason` enum)

| Reason | When |
|--------|------|
| `Employee already working presently.` | Employee is already active elsewhere |
| `Outlet not found` | `outletCode` could not be resolved |
| `Department not found` | `department` name could not be resolved |
| `Designation not found` | `designation` name could not be resolved |

The portal derives UI counts client-side: `total` = parsed rows, `failed` = skipped count, `created` = `total - failed`.

## Error responses

| Status | When |
|--------|------|
| `400` | Empty import payload |
| `401` | Unauthorized |
| `403` | `X-Dealer-Id` is not a child of the authenticated dealer |

Client-side (before POST): invalid CSV headers, row validation failures, file > 2MB, or zero data rows.
