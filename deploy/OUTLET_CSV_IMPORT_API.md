# Dealer outlet CSV import

Swagger: [POST /dealers/outlets/import](https://api.fadaid.com/api-docs/#/Dealer%20-%20Outlets/post_dealers_outlets_import)

The dealer portal uploads a **CSV file in the browser**, parses it client-side, and POSTs a **JSON array** to the Node API when `NEXT_PUBLIC_USE_MOCKS=false`.

## Endpoint

```http
POST /dealers/outlets/import
Authorization: Bearer <dealer access token>
X-Dealer-Id: <optional child dealer id>
Content-Type: application/json
```

| Body | Type | Notes |
|------|------|--------|
| JSON array | `DealerOutletImportItem[]` | Parsed from CSV in the portal; must not be empty |

## CSV columns (template download)

Aligned with Swagger `DealerOutletImportItem`:

```csv
name,brandName,outletFunctions,manager,pincode,city,state,address
Sanganer,Maruti,Sales|Service,Shambhu,303908,Jaipur,Rajasthan,"jaipur, kotkhawada"
```

| Column | Required | Notes |
|--------|----------|--------|
| `name` | Yes | Outlet name |
| `brandName` | Yes | Master brand **name** (not ID) |
| `outletFunctions` | Yes | Pipe-separated function names, e.g. `Sales\|Service` |
| `manager` | No | Outlet manager name |
| `pincode` | No | 6-digit PIN (maps to lowercase `pincode` in JSON) |
| `city` | No | |
| `state` | No | |
| `address` | No | |

Public outlet code (`OT######`) is auto-generated on create and is **not** part of the import CSV.

## Portal: reference CSV (frontend only)

The Import dialog offers **Download reference**, which builds `outlet-import-reference.csv` in the browser from:

| `type` | Source API | Columns in reference file |
|--------|------------|---------------------------|
| `brand` | `GET /dealers/masters/brands` | `type,name` |
| `outletFunction` | `GET /dealers/masters/outlet-functions` | `type,name` |

Reference columns: `type,name`. This file is **not** an upload format — it is only a lookup aid for filling import template values.

## Success response (200)

Returns **skipped rows only** in `data` (successful imports are not listed):

```json
{
  "success": true,
  "message": "Import completed",
  "data": [
    {
      "name": "Sanganer",
      "brandName": "Maruti",
      "outletFunctions": ["Sales", "Service"],
      "manager": "Shambhu",
      "pincode": "303908",
      "city": "Jaipur",
      "state": "Rajasthan",
      "address": "jaipur, kotkhawada",
      "reason": "Outlet already exists"
    }
  ]
}
```

### Skip reasons (`reason` enum)

| Reason | When |
|--------|------|
| `Outlet already exists` | An outlet with the same name already exists under the dealer |
| `Brand not found` | `brandName` could not be resolved to a master brand |

The portal derives UI counts client-side: `total` = parsed rows, `failed` = skipped count, `created` = `total - failed`.

## Error responses

| Status | When |
|--------|------|
| `400` | Empty import payload |
| `401` | Unauthorized |
| `403` | `X-Dealer-Id` is not a child of the authenticated dealer |

Client-side (before POST): invalid CSV headers, row validation failures, file > 2MB, or zero data rows.
