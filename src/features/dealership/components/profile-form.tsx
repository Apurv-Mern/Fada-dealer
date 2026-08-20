"use client";

import { useEffect, useState } from "react";

import { Button, Input, toast } from "@/components/ui";
import { toAuthErrorMessage } from "@/features/auth/client-auth";
import { updateDealerProfile } from "@/features/dealership/api";
import {
  BrandsMultiSelect,
  seedSelectedBrands,
} from "@/features/dealership/components/brands-multi-select";
import { YearPickerField } from "@/features/dealership/components/year-picker-field";
import {
  buildDealerProfileUpdate,
  missingRequiredProfileFields,
  type DealerProfile,
  type DealerProfileUpdateInput,
} from "@/features/dealership/types";
import { getBrands } from "@/features/masters/api";
import type { MasterIdNameItem } from "@/features/masters/types";
import { messageFromApiError } from "@/lib/api/errors";

function formFromProfile(profile: DealerProfile): DealerProfileUpdateInput {
  return {
    name: profile.name,
    phone: profile.phone,
    yearOfEstablishment: profile.yearOfEstablishment,
    panNumber: profile.panNumber,
    fadaMembershipId: profile.fadaMembershipId,
    fadaMemberSince: profile.fadaMemberSince,
    brandsRepresented: profile.brandIds,
    city: profile.city,
    state: profile.state,
    pinCode: profile.pinCode,
    address: profile.address,
    gstNumber: profile.gstNumber,
  };
}

export function DealershipProfileForm({
  profile,
  onSaved,
  onCancel,
}: {
  profile: DealerProfile;
  onSaved?: () => void;
  onCancel?: () => void;
}) {
  return (
    <ProfileFormFields
      key={profile.id}
      profile={profile}
      onSaved={onSaved}
      onCancel={onCancel}
    />
  );
}

function ProfileFormFields({
  profile,
  onSaved,
  onCancel,
}: {
  profile: DealerProfile;
  onSaved?: () => void;
  onCancel?: () => void;
}) {
  const [form, setForm] = useState<DealerProfileUpdateInput>(() =>
    formFromProfile(profile),
  );
  const [selectedBrands, setSelectedBrands] = useState<MasterIdNameItem[]>([]);
  const [brandQuery, setBrandQuery] = useState("");
  const [brandsCatalog, setBrandsCatalog] = useState<MasterIdNameItem[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(true);
  const [brandsError, setBrandsError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setBrandsLoading(true);
    setBrandsError(null);
    (async () => {
      try {
        const list = await getBrands();
        if (cancelled) return;
        setBrandsCatalog(list);
        setSelectedBrands(
          seedSelectedBrands(
            profile.brandsRepresented,
            list,
            profile.brandIds,
          ),
        );
      } catch (err) {
        if (cancelled) return;
        setBrandsError(messageFromApiError(err) || "Failed to load brands");
        setSelectedBrands(
          seedSelectedBrands(profile.brandsRepresented, [], profile.brandIds),
        );
        toast.error("Failed to load brands");
      } finally {
        if (!cancelled) setBrandsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profile.brandIds, profile.brandsRepresented, profile.id]);

  function update<K extends keyof DealerProfileUpdateInput>(
    key: K,
    value: DealerProfileUpdateInput[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedBrands.length === 0) {
      toast.error("Select at least one brand");
      return;
    }
    const brandIds = selectedBrands
      .map((brand) => Number(brand.id))
      .filter((id) => Number.isInteger(id) && id > 0);

    if (brandIds.length !== selectedBrands.length) {
      toast.error(
        "One or more selected brands are invalid. Re-select from the list.",
      );
      return;
    }

    const payload = buildDealerProfileUpdate(profile, {
      ...form,
      brandsRepresented: brandIds,
    });
    const missing = missingRequiredProfileFields(payload);
    if (missing.length > 0) {
      toast.error(
        `${missing.join(", ")} ${missing.length === 1 ? "is" : "are"} required`,
      );
      return;
    }
    const city = payload.city?.trim() ?? "";
    const state = payload.state?.trim() ?? "";
    const pinCode = payload.pinCode?.trim() ?? "";
    if (!city || !state || !pinCode) {
      toast.error("City, state, and pin code are required");
      return;
    }
    if (!/^\d{6}$/.test(pinCode)) {
      toast.error("Enter a valid 6-digit pin code");
      return;
    }
    setIsLoading(true);
    try {
      await updateDealerProfile(payload);
      toast.success("Profile updated");
      onSaved?.();
    } catch (err) {
      toast.error(toAuthErrorMessage(err, "Failed to update profile"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Company name"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          required
        />
        <Input label="Email" value={profile.email} disabled />
        <Input
          label="Phone"
          value={form.phone}
          onChange={(e) => update("phone", e.target.value)}
          required
        />
        <Input label="Company code" value={profile.dealerCode} disabled />
        <YearPickerField
          label="Year of establishment"
          value={form.yearOfEstablishment}
          onChange={(year) => update("yearOfEstablishment", year)}
          disabled={isLoading}
        />
        <Input
          label="PAN number"
          value={form.panNumber}
          onChange={(e) => update("panNumber", e.target.value)}
          required
        />
        <Input
          label="GST Number"
          value={form.gstNumber ?? ""}
          onChange={(e) => update("gstNumber", e.target.value)}
          required
        />
        <Input
          label="FADA membership ID"
          value={form.fadaMembershipId}
          onChange={(e) => update("fadaMembershipId", e.target.value)}
        />
        <Input
          label="FADA member since"
          type="date"
          value={form.fadaMemberSince}
          onChange={(e) => update("fadaMemberSince", e.target.value)}
        />
      </div>
      <h3 className="text-sm font-semibold text-[var(--color-heading)]">
        Business details
      </h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <BrandsMultiSelect
          brands={brandsCatalog}
          value={selectedBrands}
          onChange={setSelectedBrands}
          query={brandQuery}
          onQueryChange={setBrandQuery}
          loading={brandsLoading}
          disabled={isLoading}
          error={brandsError}
        />
        <div className="sm:col-span-2">
          <Input
            label="Registered Address"
            value={form.address ?? ""}
            onChange={(e) => update("address", e.target.value)}
          />
        </div>
        <Input
          label="City"
          value={form.city ?? ""}
          onChange={(e) => update("city", e.target.value)}
          required
        />
        <Input
          label="State"
          value={form.state ?? ""}
          onChange={(e) => update("state", e.target.value)}
          required
        />
        <Input
          label="Pin Code"
          inputMode="numeric"
          maxLength={6}
          value={form.pinCode ?? ""}
          onChange={(e) => update("pinCode", e.target.value)}
          required
        />
      </div>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancel ? (
          <Button
            type="button"
            variant="secondary"
            disabled={isLoading}
            onClick={onCancel}
          >
            Cancel
          </Button>
        ) : null}
        <Button type="submit" isLoading={isLoading}>
          Save profile
        </Button>
      </div>
    </form>
  );
}
