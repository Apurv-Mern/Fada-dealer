# Dealer announcements (Communications)

Portal route: `/communications`  
Swagger: [Dealer - Announcements](https://api.fadaid.com/api-docs/#/Dealer%20-%20Announcements)

## List

```http
GET /dealers/announcements
Authorization: Bearer <dealer access token>
```

Optional: `X-Dealer-Id` for group-holding context.

Returns announcements targeted at dealers (`dealers`, `members_and_dealers`, `both`, or `all`) that include the `in_app` delivery channel and are either published, or scheduled with `scheduledAt` in the past. Ordered by `publishedAt` then `createdAt` (newest first).

Success `200`:

```json
{
  "success": true,
  "message": "Announcements fetched successfully",
  "data": [
    {
      "id": 1,
      "createdByAdminId": 2,
      "postType": "announcement_circular",
      "title": "Q2 Dealer Score Policy Update",
      "messageBody": "…",
      "targetAudience": "dealers",
      "deliveryChannels": ["in_app", "email"],
      "status": "published",
      "publishedAt": "2026-04-01T10:00:00.000Z",
      "scheduledAt": null,
      "createdAt": "2026-03-28T08:00:00.000Z",
      "updatedAt": "2026-04-01T10:00:00.000Z"
    }
  ]
}
```

| Status | When |
|--------|------|
| `401` | Unauthorized |

There is **no** dealer detail-by-id endpoint. The portal shows full `messageBody` from the list row in a read-only dialog.

## Portal behaviour

- Feature: `src/features/announcements/`
- Fetch once via `apiFetch('/dealers/announcements')` (no `/api` prefix in feature code)
- Client-side search on `title` / `messageBody` and client-side pagination (`page`, `pageSize` query params)
- Mock samples: `src/features/announcements/mocks/data.ts` when `NEXT_PUBLIC_USE_MOCKS` is on
