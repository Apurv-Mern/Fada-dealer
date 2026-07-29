"use client";

import { useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { DealershipActivityOverview } from "@/features/dealership/components/activity-overview";
import { DealershipBusinessDetailsCard } from "@/features/dealership/components/business-details-card";
import { DealershipContactsSection } from "@/features/dealership/components/contacts-section";
import { DealershipDocumentsSection } from "@/features/dealership/components/documents-section";
import { DealershipProfileSection } from "@/features/dealership/components/profile-section";
import type { DealershipPageData } from "@/features/dealership/types";

export function DealershipView({
  data,
  onRefresh,
}: {
  data: DealershipPageData;
  onRefresh?: () => void;
}) {
  const [editing, setEditing] = useState(false);

  function startEdit() {
    setEditing(true);
    document
      .getElementById("business-profile")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dealer Profile"
        description="View and manage your dealership information and documents."
      />

      <DealershipProfileSection
        profile={data.profile}
        editing={editing}
        onEditingChange={setEditing}
        onSaved={onRefresh}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <DealershipDocumentsSection
          documents={data.documents}
          onChanged={onRefresh}
        />
        <DealershipContactsSection
          contacts={data.contacts}
          onChanged={onRefresh}
        />
        <DealershipBusinessDetailsCard
          profile={data.profile}
          onEdit={startEdit}
        />
      </div>

      <DealershipActivityOverview activity={data.activity} />
    </div>
  );
}
