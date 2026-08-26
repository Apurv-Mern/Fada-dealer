"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  buttonVariants,
} from "@/components/ui";
import { ProfileFieldValue } from "@/features/dealership/components/profile-field-value";
import {
  profileGridCardClass,
  profileGridCardScrollClass,
} from "@/features/dealership/components/profile-grid-card";
import type { DealerProfile } from "@/features/dealership/types";
import { cn } from "@/lib/utils/cn";

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-[var(--color-border)] py-2.5 last:border-b-0">
      <span className="text-sm text-[var(--color-text-muted)]">{label}</span>
      <div className="min-h-5 max-w-[55%] break-words text-right text-sm font-semibold text-[var(--color-heading)]">
        {value}
      </div>
    </div>
  );
}

export function DealershipBusinessDetailsCard({
  profile,
  editing,
  onEdit,
}: {
  profile: DealerProfile;
  editing?: boolean;
  onEdit?: () => void;
}) {
  return (
    <Card className={profileGridCardClass}>
      <CardHeader>
        <CardTitle>Business Details</CardTitle>
        {onEdit && !editing ? (
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
      <CardContent className="flex min-h-0 flex-1 flex-col">
        <div className={profileGridCardScrollClass}>
          <Row
            label="Total Employees"
            value={String(profile.allEmployees ?? 0)}
          />
          <Row
            label="Active Outlets"
            value={String(profile.totalOutlets ?? 0)}
          />
          <Row label="City" value={<ProfileFieldValue value={profile.city} />} />
          <Row label="State" value={<ProfileFieldValue value={profile.state} />} />
          <Row
            label="Pin Code"
            value={<ProfileFieldValue value={profile.pinCode} />}
          />
        </div>
      </CardContent>
    </Card>
  );
}
