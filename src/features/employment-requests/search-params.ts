import type {
  EmploymentRequestStatus,
  EmploymentRequestTypeFilter,
} from "@/features/employment-requests/types";

export type EmploymentRequestsQueryPatch = {
  page?: number;
  pageSize?: number;
  q?: string;
  type?: EmploymentRequestTypeFilter;
  status?: EmploymentRequestStatus | "";
  branchId?: string;
};

export function applyEmploymentRequestsQueryPatch(
  current: URLSearchParams | string,
  next: EmploymentRequestsQueryPatch,
): URLSearchParams {
  const params = new URLSearchParams(
    typeof current === "string" ? current : current.toString(),
  );

  if (next.q !== undefined) {
    if (next.q) params.set("q", next.q);
    else params.delete("q");
  }

  if (next.page !== undefined) {
    if (next.page > 1) params.set("page", String(next.page));
    else params.delete("page");
  }

  if (next.pageSize !== undefined) {
    if (next.pageSize !== 10) params.set("pageSize", String(next.pageSize));
    else params.delete("pageSize");
  }

  if (next.type !== undefined) {
    if (next.type) params.set("type", next.type);
    else params.delete("type");
  }

  if (next.status !== undefined) {
    if (next.status) params.set("status", next.status);
    else params.delete("status");
  }

  if (next.branchId !== undefined) {
    if (next.branchId) params.set("branchId", next.branchId);
    else params.delete("branchId");
  }

  return params;
}
