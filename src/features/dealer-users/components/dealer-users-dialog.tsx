"use client";

import { useEffect, useState } from "react";

import { Button, Dialog, Input, MasterChipSelect, toast } from "@/components/ui";
import { toAuthErrorMessage } from "@/features/auth/client-auth";
import {
  inviteDealerUser,
  updateDealerUser,
} from "@/features/dealer-users/api";
import {
  ROLE_LABELS,
  type DealerUser,
  type DealerUserRole,
} from "@/features/dealer-users/types";

const roleOptions = (Object.keys(ROLE_LABELS) as DealerUserRole[]).map(
  (value) => ({ label: ROLE_LABELS[value], value }),
);

export function DealerUserDialog({
  open,
  onOpenChange,
  user,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: DealerUser | null;
  onSaved?: () => void;
}) {
  const isEdit = Boolean(user);
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit user" : "Invite user"}
      description={
        isEdit
          ? "Update role and access for this portal user."
          : "Send portal access. Backend emails an invite or temporary password."
      }
      className="max-w-md"
    >
      {open ? (
        <UserForm user={user} onOpenChange={onOpenChange} onSaved={onSaved} />
      ) : null}
    </Dialog>
  );
}

function UserForm({
  user,
  onOpenChange,
  onSaved,
}: {
  user: DealerUser | null;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}) {
  const isEdit = Boolean(user);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<DealerUserRole>("hr");
  const [isActive, setIsActive] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setName(user?.name ?? "");
    setEmail(user?.email ?? "");
    setPhone(user?.phone ?? "");
    setRole(user?.role ?? "hr");
    setIsActive(user?.isActive ?? true);
  }, [user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Enter a name");
      return;
    }
    if (!isEdit && !email.trim()) {
      toast.error("Enter an email");
      return;
    }
    setIsLoading(true);
    try {
      if (isEdit && user) {
        await updateDealerUser(user.id, {
          name,
          phone,
          role,
          isActive,
        });
        toast.success("User updated");
      } else {
        await inviteDealerUser({ name, email, phone, role });
        toast.success("Invite sent");
      }
      onOpenChange(false);
      onSaved?.();
    } catch (err) {
      toast.error(
        toAuthErrorMessage(err, isEdit ? "Failed to update user" : "Failed to invite user"),
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      <Input
        id="user-name"
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <Input
        id="user-email"
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required={!isEdit}
        disabled={isEdit}
      />
      <Input
        id="user-phone"
        label="Phone"
        value={phone}
        onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
        placeholder="9876500002"
      />
      <MasterChipSelect
        id="user-role"
        label="Role"
        className="w-full min-w-0"
        items={roleOptions.map((option) => ({
          id: option.value,
          name: option.label,
        }))}
        value={role}
        onChange={(value) => setRole(value as DealerUserRole)}
        placeholder="Search roles"
        searchAriaLabel="Role"
      />
      {isEdit ? (
        <MasterChipSelect
          id="user-status"
          label="Status"
          className="w-full min-w-0"
          items={[
            { id: "active", name: "Active" },
            { id: "inactive", name: "Inactive" },
          ]}
          value={isActive ? "active" : "inactive"}
          onChange={(value) => setIsActive(value === "active")}
          placeholder="Search status"
          searchAriaLabel="Status"
        />
      ) : null}
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => onOpenChange(false)}
        >
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {isEdit ? "Save changes" : "Send invite"}
        </Button>
      </div>
    </form>
  );
}
