import type { ListResult } from "@/types/api";

export type AnnouncementStatus = "draft" | "published" | "scheduled";

export type Announcement = {
  id: string;
  postType: "announcement_circular";
  title: string;
  messageBody: string;
  targetAudience: string;
  deliveryChannels: string[];
  status: AnnouncementStatus;
  publishedAt: string;
  scheduledAt: string;
  createdAt: string;
  updatedAt: string;
};

export type AnnouncementListParams = {
  page?: number;
  pageSize?: number;
  q?: string;
  /** Filter by glance category; only `announcement` returns rows today. */
  category?: string;
};

export type AnnouncementPageData = {
  list: ListResult<Announcement>;
  filteredItems: Announcement[];
  /** Count before client search filter. */
  totalUnfiltered: number;
};

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** Format ISO date-time or date → "01 Jul 2024". */
export function formatAnnouncementDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    const dateOnly = new Date(`${iso.slice(0, 10)}T00:00:00`);
    if (Number.isNaN(dateOnly.getTime())) return iso;
    const day = String(dateOnly.getDate()).padStart(2, "0");
    return `${day} ${MONTHS[dateOnly.getMonth()]} ${dateOnly.getFullYear()}`;
  }
  const day = String(d.getDate()).padStart(2, "0");
  return `${day} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** Format ISO → "12 Jun" (day + short month). */
export function formatAnnouncementShortDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    const dateOnly = new Date(`${iso.slice(0, 10)}T00:00:00`);
    if (Number.isNaN(dateOnly.getTime())) return iso;
    return `${dateOnly.getDate()} ${MONTHS[dateOnly.getMonth()]}`;
  }
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function postTypeLabel(postType: string): string {
  if (postType === "announcement_circular") return "Circular";
  return postType || "Announcement";
}

export function audienceLabel(audience: string): string {
  const map: Record<string, string> = {
    employees: "Employees",
    dealers: "Companies",
    members_and_dealers: "Members & Companies",
    all: "All",
    both: "Both",
  };
  return map[audience] ?? audience ?? "—";
}

export function channelLabel(channel: string): string {
  const map: Record<string, string> = {
    in_app: "In-app",
    email: "Email",
    push: "Push",
  };
  return map[channel] ?? channel;
}

export function displayPublishedAt(row: Announcement): string {
  return row.publishedAt || row.createdAt || "";
}
