import { apiFetch, isMockMode } from "@/lib/api";
import { mockDelay, unwrapApiData } from "@/lib/api/parse";
import { mockAnnouncements } from "@/features/announcements/mocks/data";
import type {
  Announcement,
  AnnouncementListParams,
  AnnouncementPageData,
  AnnouncementStatus,
} from "@/features/announcements/types";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function readString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function readChannels(record: Record<string, unknown>): string[] {
  const raw = record.deliveryChannels;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (typeof item === "string") return item;
      if (typeof item === "number" || typeof item === "boolean") return String(item);
      return "";
    })
    .filter(Boolean);
}

function mapStatus(raw: string): AnnouncementStatus {
  const s = raw.toLowerCase();
  if (s === "draft") return "draft";
  if (s === "scheduled") return "scheduled";
  return "published";
}

export function mapApiAnnouncement(raw: unknown): Announcement {
  const record = asRecord(raw);
  const postTypeRaw = readString(record, "postType");
  return {
    id: readString(record, "id") || String(record.id ?? ""),
    postType:
      postTypeRaw === "announcement_circular"
        ? "announcement_circular"
        : "announcement_circular",
    title: readString(record, "title") || "Untitled",
    messageBody:
      readString(record, "messageBody") ||
      readString(record, "body") ||
      readString(record, "message") ||
      "",
    targetAudience: readString(record, "targetAudience") || "dealers",
    deliveryChannels: readChannels(record),
    status: mapStatus(readString(record, "status")),
    publishedAt: readString(record, "publishedAt"),
    scheduledAt: readString(record, "scheduledAt"),
    createdAt: readString(record, "createdAt"),
    updatedAt: readString(record, "updatedAt"),
  };
}

function extractAnnouncementItems(body: unknown): unknown[] {
  const unwrapped = (() => {
    try {
      return unwrapApiData(body);
    } catch {
      return body;
    }
  })();

  if (Array.isArray(unwrapped)) return unwrapped;
  if (unwrapped && typeof unwrapped === "object") {
    const record = unwrapped as Record<string, unknown>;
    if (Array.isArray(record.announcements)) return record.announcements;
    if (Array.isArray(record.items)) return record.items;
    if (Array.isArray(record.data)) return record.data;
  }
  return [];
}

export async function getAnnouncements(): Promise<Announcement[]> {
  if (isMockMode()) {
    await mockDelay();
    return mockAnnouncements.map((row) => ({ ...row }));
  }

  const body = await apiFetch<unknown>("/dealers/announcements");
  return extractAnnouncementItems(body)
    .map(mapApiAnnouncement)
    .filter((row) => row.id);
}

function filterAndPaginate(
  rows: Announcement[],
  params: AnnouncementListParams = {},
): AnnouncementPageData {
  const page = Math.max(1, params.page ?? DEFAULT_PAGE);
  const pageSize = Math.max(1, params.pageSize ?? DEFAULT_PAGE_SIZE);
  const q = (params.q ?? "").trim().toLowerCase();
  const category = (params.category ?? "").trim().toLowerCase();

  let filtered = rows;

  // Non-announcement categories have no dealer API rows yet.
  if (category && category !== "announcement") {
    filtered = [];
  }

  if (q) {
    filtered = filtered.filter((row) => {
      const hay = `${row.title} ${row.messageBody}`.toLowerCase();
      return hay.includes(q);
    });
  }

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);

  return {
    list: { items, total, page, pageSize },
    filteredItems: filtered,
    totalUnfiltered: rows.length,
  };
}

export async function getAnnouncementsPage(
  params?: AnnouncementListParams,
): Promise<AnnouncementPageData> {
  const rows = await getAnnouncements();
  return filterAndPaginate(rows, params);
}
