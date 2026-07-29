"use client";

import { Avatar } from "@/components/ui";
import {
  displayValue,
  type DealerProfile,
} from "@/features/dealership/types";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium text-[var(--color-text-muted)]">
        {label}
      </p>
      <p className="mt-1 min-h-5 break-words text-sm font-semibold text-[var(--color-heading)]">
        {value}
      </p>
    </div>
  );
}

function formatMemberSince(value: string) {
  const raw = displayValue(value);
  if (!raw) return "";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function DealershipProfileView({ profile }: { profile: DealerProfile }) {
  const address = [
    displayValue(profile.address),
    displayValue(profile.city),
    displayValue(profile.state),
    displayValue(profile.pinCode),
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
      <Avatar
        name={displayValue(profile.name) || "Dealer"}
        src={displayValue(profile.logoUrl) || null}
        size="xl"
        fallback="blank"
        className="mx-auto sm:mx-0"
      />
      <div className="min-w-0 flex-1 space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Field label="Dealer Name" value={displayValue(profile.name)} />
          <Field label="Dealer Code" value={displayValue(profile.dealerCode)} />
          <Field
            label="Type of Dealership"
            value={displayValue(profile.typeOfDealership)}
          />
          <Field
            label="Year of Establishment"
            value={displayValue(profile.yearOfEstablishment)}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Field label="PAN Number" value={displayValue(profile.panNumber)} />
          <Field label="GST Number" value={displayValue(profile.gstNumber)} />
          <Field
            label="FADA Membership ID"
            value={displayValue(profile.fadaMembershipId)}
          />
          <Field
            label="FADA Member Since"
            value={formatMemberSince(profile.fadaMemberSince)}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Field label="Registered Address" value={address} />
          <Field label="Primary Contact" value="" />
          <Field label="Mobile Number" value={displayValue(profile.phone)} />
          <Field label="Email ID" value={displayValue(profile.email)} />
          <Field
            label="Total Branches"
            value={
              profile.totalOutlets != null ? String(profile.totalOutlets) : ""
            }
          />
          <Field
            label="Total Employees"
            value={
              profile.allEmployees != null ? String(profile.allEmployees) : ""
            }
          />
        </div>
      </div>
    </div>
  );
}
