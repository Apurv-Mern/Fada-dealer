"use client";

import { Pencil } from "lucide-react";

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { DealershipProfileForm } from "@/features/dealership/components/profile-form";
import { DealershipProfileView } from "@/features/dealership/components/profile-view";
import type { DealerProfile } from "@/features/dealership/types";

export function DealershipProfileSection({
  profile,
  editing,
  onEditingChange,
  onSaved,
  canEdit = true,
}: {
  profile: DealerProfile;
  editing: boolean;
  onEditingChange: (editing: boolean) => void;
  onSaved?: () => void;
  canEdit?: boolean;
}) {
  return (
    <Card id="business-profile">
      <CardHeader>
        <CardTitle>Business Profile</CardTitle>
        {!editing && canEdit ? (
          <Button size="sm" onClick={() => onEditingChange(true)}>
            <Pencil />
            Edit Profile
          </Button>
        ) : null}
      </CardHeader>
      <CardContent>
        {editing ? (
          <DealershipProfileForm
            profile={profile}
            onCancel={() => onEditingChange(false)}
            onSaved={() => {
              onEditingChange(false);
              onSaved?.();
            }}
          />
        ) : (
          <DealershipProfileView profile={profile} onImageUploaded={onSaved} />
        )}
      </CardContent>
    </Card>
  );
}
