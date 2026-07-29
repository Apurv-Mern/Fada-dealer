"use client";

import { useState } from "react";

import { Button, Input, toast } from "@/components/ui";
import { updateDealerProfile } from "@/features/dealership/api";
import type {
  DealerProfile,
  DealerProfileUpdateInput,
} from "@/features/dealership/types";
import { toAuthErrorMessage } from "@/features/auth/client-auth";

function formFromProfile(profile: DealerProfile): DealerProfileUpdateInput {
  return {
    name: profile.name,
    phone: profile.phone,
    typeOfDealership: profile.typeOfDealership,
    yearOfEstablishment: profile.yearOfEstablishment,
    panNumber: profile.panNumber,
    fadaMembershipId: profile.fadaMembershipId,
    fadaMemberSince: profile.fadaMemberSince,
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
  const [isLoading, setIsLoading] = useState(false);

  function update<K extends keyof DealerProfileUpdateInput>(
    key: K,
    value: DealerProfileUpdateInput[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error("Name and phone are required");
      return;
    }
    setIsLoading(true);
    try {
      await updateDealerProfile(form);
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
          label="Dealership name"
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
        <Input label="Dealer code" value={profile.dealerCode} disabled />
        <Input
          label="Type of dealership"
          value={form.typeOfDealership}
          onChange={(e) => update("typeOfDealership", e.target.value)}
          required
        />
        <Input
          label="Year of establishment"
          value={form.yearOfEstablishment}
          onChange={(e) => update("yearOfEstablishment", e.target.value)}
          required
        />
        <Input
          label="PAN number"
          value={form.panNumber}
          onChange={(e) => update("panNumber", e.target.value)}
          required
        />
        <Input
          label="FADA membership ID"
          value={form.fadaMembershipId}
          onChange={(e) => update("fadaMembershipId", e.target.value)}
          required
        />
        <Input
          label="FADA member since"
          type="date"
          value={form.fadaMemberSince}
          onChange={(e) => update("fadaMemberSince", e.target.value)}
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
