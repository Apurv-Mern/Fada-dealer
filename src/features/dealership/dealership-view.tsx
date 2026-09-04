"use client";

import { useState } from "react";
import { Info } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { PERMISSION } from "@/features/auth/permissions";
import { usePermissions } from "@/features/auth/permissions-context";
import { Badge } from "@/components/ui/badge";
import { DealershipActivityOverview } from "@/features/dealership/components/activity-overview";
import { DealershipBusinessDetailsCard } from "@/features/dealership/components/business-details-card";
import { DealershipContactsSection } from "@/features/dealership/components/contacts-section";
import { DealershipDocumentsSection } from "@/features/dealership/components/documents-section";
import { DealershipProfileSection } from "@/features/dealership/components/profile-section";
import { SHOW_ACTIVITY_OVERVIEW } from "@/features/dealership/feature-flags";
import {
  dealerProfileBannerMessage,
  dealerProfileStatusLabel,
  parseDealerAccountStatus,
} from "@/features/dealership/status";
import type { DealershipPageData } from "@/features/dealership/types";

export function DealershipView({
  data,
  onRefresh,
}: {
  data: DealershipPageData;
  onRefresh?: () => void;
}) {
  const { has } = usePermissions();
  const canEditProfile = has(PERMISSION.companyProfileEdit);
  const [editing, setEditing] = useState(false);
  const accountStatus = parseDealerAccountStatus(data.profile.status);
  const bannerMessage = dealerProfileBannerMessage(accountStatus);
  const statusBadgeVariant =
    accountStatus === "rejected"
      ? "danger"
      : accountStatus === "approved"
        ? "success"
        : "warning";

  function startEdit() {
    setEditing(true);
    document
      .getElementById("business-profile")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Company Profile"
        description="View and manage your company information and documents."
        actions={
          <Badge variant={statusBadgeVariant}>
            {dealerProfileStatusLabel(accountStatus)}
          </Badge>
        }
      />

      {bannerMessage ? (
        <div
          role="status"
          className="flex gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-info-soft)] px-4 py-3 text-sm text-[var(--color-text)]"
        >
          <Info
            className="mt-0.5 size-4 shrink-0 text-[var(--color-info)]"
            aria-hidden
          />
          <div className="min-w-0 space-y-1">
            <p className="leading-relaxed">{bannerMessage}</p>
            {accountStatus === "rejected" ? (
              <p className="text-xs text-[var(--color-text-muted)]">
                Need help?{" "}
                <a
                  href="mailto:support@fada.in"
                  className="font-semibold text-[var(--color-primary)] hover:underline"
                >
                  Contact FADA Support
                </a>
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      <DealershipProfileSection
        profile={data.profile}
        editing={editing}
        onEditingChange={setEditing}
        onSaved={onRefresh}
        canEdit={canEditProfile}
      />

      <div className="grid gap-4 lg:grid-cols-3 lg:items-stretch">
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
          editing={editing}
          onEdit={canEditProfile ? startEdit : undefined}
        />
      </div>

      {SHOW_ACTIVITY_OVERVIEW ? (
        <DealershipActivityOverview activity={data.activity} />
      ) : null}
    </div>
  );
}
