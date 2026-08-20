import type { EmploymentRequest } from "@/features/employment-requests/types";

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function exportEmploymentRequestsCsv(rows: EmploymentRequest[]) {
  const headers = [
    "Employee",
    "FADA ID",
    "Request Type",
    "From / To",
    "Request Date",
    "Status",
  ];
  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      [
        row.employeeName,
        row.fadaId,
        row.requestType,
        row.fromTo,
        row.requestedAt,
        row.status,
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
  anchor.download = `employment-requests-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}
