"use client";

import { useState } from "react";

import { Button, Dialog, Input, toast } from "@/components/ui";
import { createOutlet, updateOutlet } from "@/features/branches/api";
import type { Branch, OutletInput } from "@/features/branches/types";
import { toAuthErrorMessage } from "@/features/auth/client-auth";

type FormState = {
  name: string;
  code: string;
  manager: string;
  city: string;
  state: string;
  address: string;
  pinCode: string;
};

const emptyForm: FormState = {
  name: "",
  code: "",
  manager: "",
  city: "",
  state: "",
  address: "",
  pinCode: "",
};

function formFromBranch(branch?: Branch | null): FormState {
  if (!branch) return emptyForm;
  return {
    name: branch.name,
    code: branch.code ?? "",
    manager: branch.manager ?? "",
    city: branch.city ?? "",
    state: branch.state ?? "",
    address: branch.address ?? "",
    pinCode: branch.pinCode ?? "",
  };
}

export function BranchesAddDialog({
  open,
  onOpenChange,
  branch,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branch?: Branch | null;
  onSaved?: () => void;
}) {
  const isEdit = Boolean(branch);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit Branch" : "Add New Branch"}
      description={
        isEdit
          ? "Update outlet details for this dealership."
          : "Create a new outlet for this dealership."
      }
    >
      {open ? (
        <BranchForm
          key={branch?.id ?? "new"}
          branch={branch}
          onOpenChange={onOpenChange}
          onSaved={onSaved}
        />
      ) : null}
    </Dialog>
  );
}

function BranchForm({
  branch,
  onOpenChange,
  onSaved,
}: {
  branch?: Branch | null;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}) {
  const [form, setForm] = useState<FormState>(() => formFromBranch(branch));
  const [isLoading, setIsLoading] = useState(false);
  const isEdit = Boolean(branch);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Enter branch name");
      return;
    }

    const payload: OutletInput = {
      name: form.name.trim(),
      code: form.code.trim() || undefined,
      manager: form.manager.trim() || undefined,
      city: form.city.trim() || undefined,
      state: form.state.trim() || undefined,
      address: form.address.trim() || undefined,
      pinCode: form.pinCode.trim() || undefined,
      isActive: true,
    };

    setIsLoading(true);
    try {
      if (isEdit && branch) {
        await updateOutlet(branch.id, payload);
        toast.success("Branch updated");
      } else {
        await createOutlet(payload);
        toast.success("Branch added");
      }
      onOpenChange(false);
      onSaved?.();
    } catch (err) {
      toast.error(
        toAuthErrorMessage(
          err,
          isEdit ? "Failed to update branch" : "Failed to add branch",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      <Input
        label="Branch name"
        value={form.name}
        onChange={(e) => update("name", e.target.value)}
        required
      />
      <Input
        label="Code"
        value={form.code}
        onChange={(e) => update("code", e.target.value)}
        placeholder="Optional"
      />
      <Input
        label="Manager"
        value={form.manager}
        onChange={(e) => update("manager", e.target.value)}
        placeholder="Optional"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="City"
          value={form.city}
          onChange={(e) => update("city", e.target.value)}
        />
        <Input
          label="State"
          value={form.state}
          onChange={(e) => update("state", e.target.value)}
        />
      </div>
      <Input
        label="PIN code"
        value={form.pinCode}
        onChange={(e) => update("pinCode", e.target.value)}
      />
      <Input
        label="Address"
        value={form.address}
        onChange={(e) => update("address", e.target.value)}
      />
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => onOpenChange(false)}
        >
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {isEdit ? "Save changes" : "Save"}
        </Button>
      </div>
    </form>
  );
}
