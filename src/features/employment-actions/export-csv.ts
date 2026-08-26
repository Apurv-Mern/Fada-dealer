import type { EmploymentAction } from "@/features/employment-actions/types";

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function exportEmploymentActionsCsv(rows: EmploymentAction[]) {
  const headers = [
    "Employee",
    "FADA ID",
    "Mobile",
    "Action Type",
    "Action Details",
    "Outlet",
    "Designation",
    "Action Date",
    "Initiated By",
    "Status",
    "Documents",
  ];
  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      [
        row.employeeName,
        row.fadaId,
        row.mobile,
        row.actionType,
        row.actionDetails,
        row.branchName,
        row.designation,
        row.actionDate,
        row.initiatedBy,
        row.status,
        String(row.documentCount),
      ]
        .map(csvEscape)
        .join(","),
    ),
  ];
  const blob = new Blob([lines.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `employment-actions-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}
