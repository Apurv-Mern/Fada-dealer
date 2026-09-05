# Dealer outlet CSV / Excel import

Swagger: [POST /dealers/outlets/import](https://api.fadaid.com/api-docs/#/Dealer%20-%20Outlets/post_dealers_outlets_import)

The dealer portal uploads a **CSV or Excel file in the browser**, parses it client-side, validates rows against live master APIs, and POSTs a **JSON array** to the Node API when `NEXT_PUBLIC_USE_MOCKS=false`.

## Endpoint

```http
POST /dealers/outlets/import
Authorization: Bearer <dealer access token>
X-Dealer-Id: <optional child dealer id>
Content-Type: application/json
```

| Body | Type | Notes |
|------|------|--------|
| JSON array | `DealerOutletImportItem[]` | Parsed from CSV/XLSX in the portal; must not be empty |

## Import columns

Aligned with Swagger `DealerOutletImportItem`:

```csv
name,brandName,outletFunctions,manager,pincode,city,state,address
Sanganer,Honda,Sales|Workshop,Shambhu,303908,Jaipur,Rajasthan,"jaipur, kotkhawada"
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

Public outlet code (`OT######`) is auto-generated on create and is **not** part of the import file.

## Portal: template downloads (frontend only)

The Import dialog offers two downloads. Both fetch **live** master data at click time:

| Button | File | Source APIs |
|--------|------|-------------|
| Download CSV template | `outlet-import-template.csv` | `GET /dealers/masters/brands`, `GET /dealers/masters/outlet-functions` |
| Download Excel template | `outlet-import-template.xlsx` | same |

No brand or function names are hardcoded in the portal — lists always reflect the API response on the day of download.

### CSV template

- Header row + one example row using current master names.
- Trailing `#` comment lines list valid brand and function names for copy/reference.
- Lines starting with `#` are **ignored** during import.

### Excel template

| Sheet | Purpose |
|-------|---------|
| `Outlets` | Import columns, example row, dropdown validation on `brandName` and `outletFunctions` |
| `Lists` | Hidden sheet with brand names (column A) and function names (column B) |
| `Instructions` | Fill/upload steps |

For multiple outlet functions, type pipe-separated names (e.g. `Sales|Service`) — Excel dropdowns are single-select but custom values are allowed with a warning.

## Upload formats

| Format | Accepted |
|--------|----------|
| `.csv` | Yes |
| `.xlsx` | Yes |

Max file size: 2MB.

Before POST, the portal re-fetches masters and validates each row's `brandName` and `outletFunctions` against **current** API names (case-insensitive). Stale template values are rejected with row-level errors.

Uploading the old standalone reference file (`type,name` columns) is rejected with a clear message directing users to download a proper template.

## Success response (200)

Returns **skipped rows only** in `data` (successful imports are not listed):

```json
{
  "success": true,
  "message": "Import completed",
  "data": [
    {
      "name": "Sanganer",
      "brandName": "Honda",
      "outletFunctions": ["Sales", "Workshop"],
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

The portal derives UI counts client-side: `total` = parsed rows, `failed` = skipped count + validation errors, `created` = `total - failed`.

## Error responses

| Status | When |
|--------|------|
| `400` | Empty import payload |
| `401` | Unauthorized |
| `403` | `X-Dealer-Id` is not a child of the authenticated dealer |

Client-side (before POST): invalid headers, wrong file type, row validation failures, unknown brand/function names, file > 2MB, zero data rows, or masters API unavailable.
