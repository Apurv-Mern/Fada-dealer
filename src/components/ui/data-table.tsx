import type { ReactNode } from "react";

import { EmptyState, type EmptyStateProps } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { cn } from "@/lib/utils/cn";

export type DataTableColumn<T> = {
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
  headerClassName?: string;
};

export type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  loading?: boolean;
  empty?: EmptyStateProps;
  toolbar?: ReactNode;
  footer?: ReactNode;
  className?: string;
  tableClassName?: string;
  /** When false, clips overflow instead of showing a horizontal scrollbar. */
  scrollable?: boolean;
  skeletonRows?: number;
};

export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  loading = false,
  empty,
  toolbar,
  footer,
  className,
  tableClassName,
  scrollable = true,
  skeletonRows = 5,
}: DataTableProps<T>) {
  return (
    <div className={cn("min-w-0", className)}>
      {toolbar}
      {loading ? (
        <div
          className="space-y-3 px-5 py-4"
          aria-busy
          aria-label="Loading table"
        >
          {Array.from({ length: skeletonRows }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : rows.length === 0 && empty ? (
        <EmptyState {...empty} />
      ) : (
        <div
          className={cn(
            "min-w-0",
            scrollable ? "overflow-x-auto" : "overflow-x-hidden",
          )}
        >
          <Table className={tableClassName}>
            <THead>
              <TR>
                {columns.map((col) => (
                  <TH key={col.id} className={col.headerClassName}>
                    {col.header}
                  </TH>
                ))}
              </TR>
            </THead>
            <TBody>
              {rows.map((row) => (
                <TR key={getRowKey(row)}>
                  {columns.map((col) => (
                    <TD key={col.id} className={col.className}>
                      {col.cell(row)}
                    </TD>
                  ))}
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      )}
      {footer}
    </div>
  );
}
