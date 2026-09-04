"use client";

import { useEffect, useState } from "react";

import { Button, Dialog, Input, MasterChipSelect, toast } from "@/components/ui";
import { toAuthErrorMessage } from "@/features/auth/client-auth";
import {
  createStaff,
  getStaffRoles,
  updateStaff,
} from "@/features/dealer-staff/api";
import type { StaffMember, StaffRole } from "@/features/dealer-staff/types";

export function StaffDialog({
  open,
  onOpenChange,
  member,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: StaffMember | null;
  onSaved?: () => void;
}) {
  const isEdit = Boolean(member);
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit staff member" : "Add staff member"}
      description={
        isEdit
          ? "Update role and access for this portal staff account."
          : "Create a staff login. They receive credentials by email."
      }
      className="max-w-md"
    >
      {open ? (
        <StaffForm
          member={member}
          onOpenChange={onOpenChange}
          onSaved={onSaved}
        />
      ) : null}
    </Dialog>
  );
}

function StaffForm({
  member,
  onOpenChange,
  onSaved,
}: {
  member: StaffMember | null;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}) {
  const isEdit = Boolean(member);
  const [roles, setRoles] = useState<StaffRole[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [roleId, setRoleId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changePassword, setChangePassword] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setRolesLoading(true);
    getStaffRoles()
      .then((items) => {
        if (!cancelled) setRoles(items);
      })
      .catch(() => {
        if (!cancelled) toast.error("Couldn't load roles");
      })
      .finally(() => {
        if (!cancelled) setRolesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setName(member?.name ?? "");
    setEmail(member?.email ?? "");
    setPhone(member?.phone ?? "");
    setRoleId(member?.roleId ?? roles[0]?.id ?? "");
    setPassword("");
    setConfirmPassword("");
    setChangePassword(false);
    setIsActive(member?.isActive ?? true);
  }, [member, roles]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Enter a name");
      return;
    }
    if (!email.trim()) {
      toast.error("Enter an email");
      return;
    }
    if (!roleId) {
      toast.error("Select a role");
      return;
    }
    if (!isEdit) {
      if (password.length < 8) {
        toast.error("Password must be at least 8 characters");
        return;
      }
      if (password !== confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }
    } else if (changePassword) {
      if (password.length < 8) {
        toast.error("Password must be at least 8 characters");
        return;
      }
      if (password !== confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }
    }

    setIsLoading(true);
    try {
      if (isEdit && member) {
        await updateStaff(member.id, {
          name,
          email,
          phone,
          roleId,
          isActive,
          ...(changePassword
            ? { password, confirmPassword }
            : {}),
        });
        toast.success("Staff member updated");
      } else {
        await createStaff({
          name,
          email,
          phone,
          roleId,
          password,
          confirmPassword,
          isActive,
        });
        toast.success("Staff member created");
      }
      onOpenChange(false);
      onSaved?.();
    } catch (err) {
      toast.error(
        toAuthErrorMessage(
          err,
          isEdit ? "Failed to update staff member" : "Failed to create staff member",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }

  const roleOptions = roles.map((role) => ({
    id: role.id,
    name: role.name,
  }));

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      <Input
        id="staff-name"
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <Input
        id="staff-email"
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Input
        id="staff-phone"
        label="Phone"
        value={phone}
        onChange={(e) =>
          setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
        }
        placeholder="9876500002"
      />
      <MasterChipSelect
        id="staff-role"
        label="Role"
        className="w-full min-w-0"
        items={roleOptions}
        value={roleId}
        onChange={setRoleId}
        placeholder={rolesLoading ? "Loading roles…" : "Search roles"}
        searchAriaLabel="Role"
        disabled={rolesLoading || roleOptions.length === 0}
      />
      {isEdit ? (
        <>
          <label className="flex items-center gap-2 text-sm text-[var(--color-text)]">
            <input
              type="checkbox"
              checked={changePassword}
              onChange={(e) => setChangePassword(e.target.checked)}
            />
            Change password
          </label>
          {changePassword ? (
            <>
              <Input
                id="staff-password"
                label="New password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
              <Input
                id="staff-confirm-password"
                label="Confirm password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </>
          ) : null}
          <MasterChipSelect
            id="staff-status"
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
        </>
      ) : (
        <>
          <Input
            id="staff-password"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
          <Input
            id="staff-confirm-password"
            label="Confirm password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
          <p className="text-xs text-[var(--color-text-muted)]">
            Staff receives login credentials by email.
          </p>
        </>
      )}
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => onOpenChange(false)}
        >
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {isEdit ? "Save changes" : "Create staff member"}
        </Button>
      </div>
    </form>
  );
}
