"use client";

import { BrandsReadonlyChips } from "@/features/dealership/components/brands-readonly-chips";
import { ProfileFieldValue } from "@/features/dealership/components/profile-field-value";
import { ProfileImageUploader } from "@/features/dealership/components/profile-image-uploader";
import {
  companyCode,
  displayValue,
  type DealerProfile,
} from "@/features/dealership/types";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium text-[var(--color-text-muted)]">
        {label}
      </p>
      <div className="mt-1 min-h-5 break-words text-sm font-semibold text-[var(--color-heading)]">
        {value}
      </div>
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

export function DealershipProfileView({
  profile,
  onImageUploaded,
}: {
  profile: DealerProfile;
  onImageUploaded?: () => void;
}) {
  const addressParts = [
    displayValue(profile.address),
    displayValue(profile.city),
    displayValue(profile.state),
    displayValue(profile.pinCode),
  ].filter(Boolean);
  const address = addressParts.length > 0 ? addressParts.join(", ") : "";

  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
      <ProfileImageUploader
        name={displayValue(profile.name) || "Company"}
        logoUrl={profile.logoUrl}
        onUploaded={onImageUploaded}
      />
      <div className="min-w-0 flex-1 space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Field
            label="Company Name"
            value={<ProfileFieldValue value={profile.name} />}
          />
          <Field
            label="Company Code"
            value={<ProfileFieldValue value={companyCode(profile)} />}
          />
          <Field
            label="Year of Establishment"
            value={<ProfileFieldValue value={profile.yearOfEstablishment} />}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Field
            label="PAN Number"
            value={<ProfileFieldValue value={profile.panNumber} />}
          />
          <Field
            label="GST Number"
            value={<ProfileFieldValue value={profile.gstNumber} />}
          />
          <Field
            label="FADA Membership ID"
            value={<ProfileFieldValue value={profile.fadaMembershipId} />}
          />
          <Field
            label="FADA Member Since"
            value={
              <ProfileFieldValue
                value={formatMemberSince(profile.fadaMemberSince)}
              />
            }
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Field
            label="Registered Address"
            value={<ProfileFieldValue value={address} />}
          />
          <Field
            label="Mobile Number"
            value={<ProfileFieldValue value={profile.phone} />}
          />
          <Field
            label="Email ID"
            value={<ProfileFieldValue value={profile.email} />}
          />
          <Field
            label="Brands Represented"
            value={
              <BrandsReadonlyChips brandsRepresented={profile.brandsRepresented} />
            }
          />
          <Field
            label="Total Outlets"
            value={String(profile.totalOutlets ?? 0)}
          />
          <Field
            label="Total Employees"
            value={String(profile.allEmployees ?? 0)}
          />
        </div>
      </div>
    </div>
  );
}
