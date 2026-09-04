"use client";

import { useEffect, useMemo, useState } from "react";

import { Button, Dialog, Input, MasterChipSelect, toast } from "@/components/ui";
import { toAuthErrorMessage } from "@/features/auth/client-auth";
import {
  createRole,
  getPortalModules,
  updateRole,
} from "@/features/dealer-rbac/api";
import type { PortalModule, PortalRole } from "@/features/dealer-rbac/types";

export function RoleDialog({
  open,
  onOpenChange,
  role,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: PortalRole | null;
  onSaved?: () => void;
}) {
  const isEdit = Boolean(role);
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit role" : "Create role"}
      description="Assign module permissions for portal staff with this role."
      className="max-w-2xl"
    >
      {open ? (
        <RoleForm role={role} onOpenChange={onOpenChange} onSaved={onSaved} />
      ) : null}
    </Dialog>
  );
}

function RoleForm({
  role,
  onOpenChange,
  onSaved,
}: {
  role: PortalRole | null;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}) {
  const isEdit = Boolean(role);
  const [modules, setModules] = useState<PortalModule[]>([]);
  const [loadingModules, setLoadingModules] = useState(true);
  const [key, setKey] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  const readOnlyPermissions = role?.isSuperRole === true;

  useEffect(() => {
    let cancelled = false;
    setLoadingModules(true);
    getPortalModules()
      .then((items) => {
        if (!cancelled) setModules(items);
      })
      .catch(() => {
        if (!cancelled) toast.error("Couldn't load permission catalog");
      })
      .finally(() => {
        if (!cancelled) setLoadingModules(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setKey(role?.key ?? "");
    setName(role?.name ?? "");
    setDescription(role?.description ?? "");
    setIsActive(role?.isActive ?? true);
    setSelected(new Set(role?.permissions ?? []));
  }, [role]);

  const allPermissionKeys = useMemo(
    () => modules.flatMap((module) => module.permissions.map((p) => p.key)),
    [modules],
  );

  function togglePermission(permissionKey: string) {
    if (readOnlyPermissions) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(permissionKey)) next.delete(permissionKey);
      else next.add(permissionKey);
      return next;
    });
  }

  function toggleModule(module: PortalModule, checked: boolean) {
    if (readOnlyPermissions) return;
    setSelected((prev) => {
      const next = new Set(prev);
      for (const permission of module.permissions) {
        if (checked) next.add(permission.key);
        else next.delete(permission.key);
      }
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Enter a role name");
      return;
    }
    if (!isEdit && !key.trim()) {
      toast.error("Enter a role key");
      return;
    }

    setIsLoading(true);
    try {
      const permissions = readOnlyPermissions
        ? [...(role?.permissions ?? allPermissionKeys)]
        : [...selected];
      if (isEdit && role) {
        await updateRole(role.id, {
          name,
          description,
          permissions,
          isActive,
        });
        toast.success("Role updated");
      } else {
        await createRole({
          key: key.trim().toLowerCase(),
          name,
          description,
          permissions,
          isActive,
        });
        toast.success("Role created");
      }
      onOpenChange(false);
      onSaved?.();
    } catch (err) {
      toast.error(
        toAuthErrorMessage(err, isEdit ? "Failed to update role" : "Failed to create role"),
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          id="role-name"
          label="Role name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          id="role-key"
          label="Role key"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          disabled={isEdit}
          placeholder="dealer_sales_lead"
          required={!isEdit}
        />
      </div>
      <Input
        id="role-description"
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      {isEdit ? (
        <MasterChipSelect
          id="role-status"
          label="Status"
          className="w-full min-w-0 sm:max-w-xs"
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

      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)]">
        <div className="border-b border-[var(--color-border)] px-4 py-3">
          <p className="text-sm font-semibold text-[var(--color-heading)]">
            Permissions
          </p>
          {readOnlyPermissions ? (
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              Super roles have full access. Permission changes are ignored by the API.
            </p>
          ) : null}
        </div>
        <div className="max-h-[320px] space-y-4 overflow-y-auto p-4">
          {loadingModules ? (
            <p className="text-sm text-[var(--color-text-muted)]">Loading modules…</p>
          ) : (
            modules.map((module) => {
              const moduleKeys = module.permissions.map((p) => p.key);
              const allChecked =
                moduleKeys.length > 0 &&
                moduleKeys.every((permissionKey) => selected.has(permissionKey));
              const someChecked =
                !allChecked &&
                moduleKeys.some((permissionKey) => selected.has(permissionKey));

              return (
                <div key={module.key} className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-heading)]">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      ref={(el) => {
                        if (el) el.indeterminate = someChecked;
                      }}
                      disabled={readOnlyPermissions}
                      onChange={(e) => toggleModule(module, e.target.checked)}
                    />
                    {module.name}
                  </label>
                  <ul className="space-y-1 pl-6">
                    {module.permissions.map((permission) => (
                      <li key={permission.key}>
                        <label className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                          <input
                            type="checkbox"
                            checked={selected.has(permission.key)}
                            disabled={readOnlyPermissions}
                            onChange={() => togglePermission(permission.key)}
                          />
                          {permission.name}
                          <span className="text-xs">({permission.key})</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => onOpenChange(false)}
        >
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {isEdit ? "Save changes" : "Create role"}
        </Button>
      </div>
    </form>
  );
}
