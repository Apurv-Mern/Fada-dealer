"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  buttonVariants,
} from "@/components/ui";
import {
  displayValue,
  type DealerProfile,
} from "@/features/dealership/types";
import { cn } from "@/lib/utils/cn";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-[var(--color-border)] py-2.5 last:border-b-0">
      <span className="text-sm text-[var(--color-text-muted)]">{label}</span>
      <span className="min-h-5 max-w-[55%] break-words text-right text-sm font-semibold text-[var(--color-heading)]">
        {value}
      </span>
    </div>
  );
}

export function DealershipBusinessDetailsCard({
  profile,
  onEdit,
}: {
  profile: DealerProfile;
  onEdit?: () => void;
}) {
  return (
    <Card className="flex min-h-0 flex-col">
      <CardHeader>
        <CardTitle>Business Details</CardTitle>
        {onEdit ? (
          <button
            type="button"
            onClick={onEdit}
            className={cn(
              buttonVariants({ variant: "link", size: "sm" }),
              "h-auto p-0",
            )}
          >
            Edit
          </button>
        ) : null}
      </CardHeader>
      <CardContent className="flex-1">
        <Row label="Nature of Business" value="" />
        <Row label="Brands Represented" value="" />
        <Row label="Total Showrooms" value="" />
        <Row label="Total Workshops" value="" />
        <Row
          label="Total Employees"
          value={
            profile.allEmployees != null ? String(profile.allEmployees) : ""
          }
        />
        <Row
          label="Active Branches"
          value={
            profile.totalOutlets != null ? String(profile.totalOutlets) : ""
          }
        />
        <Row label="City" value={displayValue(profile.city)} />
        <Row label="State" value={displayValue(profile.state)} />
        <Row label="Pin Code" value={displayValue(profile.pinCode)} />
      </CardContent>
    </Card>
  );
}
