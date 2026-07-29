"use client";

import { useState } from "react";

import { Button, Dialog, Input, Select, toast } from "@/components/ui";
import {
  createEmployee,
  updateEmployee,
} from "@/features/employees/api";
import type {
  Employee,
  EmployeeFilterOptions,
  EmployeeInput,
} from "@/features/employees/types";
import { toAuthErrorMessage } from "@/features/auth/client-auth";

type FormState = {
  name: string;
  email: string;
  phone: string;
  outletId: string;
  joinedDate: string;
};

const emptyForm: FormState = {
  name: "",
  email: "",
  phone: "",
  outletId: "",
  joinedDate: "",
};

function formFromEmployee(employee?: Employee | null): FormState {
  if (!employee) return emptyForm;
  return {
    name: employee.name,
    email: employee.email,
    phone: employee.phone,
    outletId: employee.branchId,
    joinedDate: employee.joinedDate ?? "",
  };
}

export function EmployeesAddDialog({
  open,
  onOpenChange,
  employee,
  filterOptions,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: Employee | null;
  filterOptions: EmployeeFilterOptions;
  onSaved?: () => void;
}) {
  const isEdit = Boolean(employee);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit Employee" : "Add New Employee"}
      description={
        isEdit
          ? "Update employee details for this dealership."
          : "Create a new employee for this dealership."
      }
    >
      {open ? (
        <EmployeeForm
          key={employee?.id ?? "new"}
          employee={employee}
          filterOptions={filterOptions}
          onOpenChange={onOpenChange}
          onSaved={onSaved}
        />
      ) : null}
    </Dialog>
  );
}

function EmployeeForm({
  employee,
  filterOptions,
  onOpenChange,
  onSaved,
}: {
  employee?: Employee | null;
  filterOptions: EmployeeFilterOptions;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}) {
  const [form, setForm] = useState<FormState>(() => formFromEmployee(employee));
  const [isLoading, setIsLoading] = useState(false);
  const isEdit = Boolean(employee);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Enter employee name");
      return;
    }
    if (form.email && !form.email.includes("@")) {
      toast.error("Enter a valid email");
      return;
    }

    const payload: EmployeeInput = {
      name: form.name.trim(),
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      outletId: form.outletId || undefined,
      joinedDate: form.joinedDate || undefined,
      isActive: true,
    };

    setIsLoading(true);
    try {
      if (isEdit && employee) {
        await updateEmployee(employee.id, {
          ...payload,
          isActive: employee.isActive !== false,
          score: employee.fadaScore,
        });
        toast.success("Employee updated");
      } else {
        await createEmployee(payload);
        toast.success("Employee added");
      }
      onOpenChange(false);
      onSaved?.();
    } catch (err) {
      toast.error(
        toAuthErrorMessage(
          err,
          isEdit ? "Failed to update employee" : "Failed to add employee",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      <Input
        label="Full name"
        value={form.name}
        onChange={(e) => update("name", e.target.value)}
        required
      />
      <Input
        label="Email"
        type="email"
        value={form.email}
        onChange={(e) => update("email", e.target.value)}
      />
      <Input
        label="Phone"
        type="tel"
        value={form.phone}
        onChange={(e) => update("phone", e.target.value)}
      />
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[var(--color-text)]">
          Branch / outlet
        </label>
        <Select
          aria-label="Branch / outlet"
          placeholder="Select outlet"
          className="w-full"
          options={[
            { label: "Unassigned", value: "" },
            ...filterOptions.branches,
          ]}
          value={form.outletId}
          onChange={(value) => update("outletId", value)}
        />
      </div>
      <Input
        label="Joined date"
        type="date"
        value={form.joinedDate}
        onChange={(e) => update("joinedDate", e.target.value)}
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

export function EmployeesImportDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Import Employees"
      description="Bulk CSV import is not available from the API yet."
    >
      <div className="space-y-4">
        <p className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] bg-[var(--color-muted)] px-4 py-8 text-center text-sm text-[var(--color-text-muted)]">
          Drop CSV here (not wired — no bulk import API)
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
