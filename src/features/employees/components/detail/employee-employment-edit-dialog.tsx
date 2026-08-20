"use client";

import { useEffect, useId, useState } from "react";

import { Button, Dialog, Input, Label, MasterChipSelect, toChipItems, toast } from "@/components/ui";
import { toAuthErrorMessage } from "@/features/auth/client-auth";
import { useActingDealerName } from "@/features/auth/use-acting-dealer-name";
import { updateEmployee } from "@/features/employees/api";
import {
  employeeToUpdateInput,
  stripPhonePrefix,
  toApiPhone,
} from "@/features/employees/employee-detail-update";
import type { EmployeeDetail, EmployeeFilterOptions } from "@/features/employees/types";
import { getDepartments, getDesignations } from "@/features/masters/api";
import type { MasterIdNameItem } from "@/features/masters/types";

function EmploymentEditForm({
  employee,
  filterOptions,
  onCancel,
  onSaved,
}: {
  employee: EmployeeDetail;
  filterOptions: EmployeeFilterOptions;
  onCancel: () => void;
  onSaved?: () => void;
}) {
  const baseId = useId();
  const dealershipName = useActingDealerName();
  const [name, setName] = useState(employee.name);
  const [email, setEmail] = useState(employee.email);
  const [phone, setPhone] = useState(
    stripPhonePrefix(employee.phone).replace(/\D/g, "").slice(0, 10),
  );
  const [departmentId, setDepartmentId] = useState(employee.departmentId ?? "");
  const [designationId, setDesignationId] = useState(employee.designationId ?? "");
  const [joinedDate, setJoinedDate] = useState(employee.joinedDate ?? "");
  const [outletId, setOutletId] = useState(employee.branchId);
  const [phoneError, setPhoneError] = useState("");
  const [departments, setDepartments] = useState<MasterIdNameItem[]>([]);
  const [designations, setDesignations] = useState<MasterIdNameItem[]>([]);
  const [departmentsLoaded, setDepartmentsLoaded] = useState(false);
  const [designationsLoading, setDesignationsLoading] = useState(
    Boolean(employee.departmentId),
  );
  const [saving, setSaving] = useState(false);

  const hasBranches = filterOptions.branches.length > 0;
  const phoneErrorId = `${baseId}-phone-error`;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const rows = await getDepartments();
        if (!cancelled) {
          setDepartments(rows);
          setDepartmentsLoaded(true);
        }
      } catch {
        if (!cancelled) {
          setDepartments([]);
          setDepartmentsLoaded(true);
          toast.error("Couldn't load departments");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!departmentId) return;

    let cancelled = false;
    void (async () => {
      setDesignationsLoading(true);
      try {
        const rows = await getDesignations(departmentId);
        if (!cancelled) {
          setDesignations(rows);
          setDesignationsLoading(false);
        }
      } catch {
        if (!cancelled) {
          setDesignations([]);
          setDesignationsLoading(false);
          toast.error("Couldn't load designations");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [departmentId]);

  async function handleSave() {
    if (!name.trim()) {
      toast.error("Enter employee name");
      return;
    }
    if (email.trim() && !email.includes("@")) {
      toast.error("Enter a valid email");
      return;
    }
    const phoneDigits = phone.replace(/\D/g, "");
    if (phone.trim() && phoneDigits.length !== 10) {
      setPhoneError("Enter a valid 10-digit mobile number");
      return;
    }
    setPhoneError("");
    if (
      (departmentId && !designationId) ||
      (!departmentId && designationId)
    ) {
      toast.error("Select both department and designation");
      return;
    }
    if (hasBranches && !outletId.trim()) {
      toast.error("Select a branch");
      return;
    }

    setSaving(true);
    try {
      await updateEmployee(
        employee.id,
        employeeToUpdateInput(employee, {
          name: name.trim(),
          email: email.trim() || undefined,
          phone: toApiPhone(phoneDigits),
          departmentId: departmentId || undefined,
          designationId: designationId || undefined,
          joinedDate: joinedDate || undefined,
          outletId: outletId || undefined,
        }),
      );
      toast.success("Employee updated");
      onSaved?.();
      onCancel();
    } catch (err) {
      toast.error(toAuthErrorMessage(err, "Failed to update employee"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <Input
        id={`${baseId}-name`}
        label="Full name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />

      <Input
        id={`${baseId}-email`}
        label="Email"
        type="email"
        placeholder="name@company.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <div>
        <Label htmlFor={`${baseId}-phone`}>Mobile</Label>
        <div className="mt-1.5 flex overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] focus-within:ring-2 focus-within:ring-[var(--color-ring)] focus-within:ring-offset-1">
          <span className="flex items-center border-r border-[var(--color-border)] bg-[var(--color-muted)] px-3 text-sm text-[var(--color-text-muted)]">
            +91
          </span>
          <input
            id={`${baseId}-phone`}
            type="tel"
            inputMode="numeric"
            maxLength={10}
            placeholder="9876543210"
            value={phone}
            aria-invalid={phoneError ? true : undefined}
            aria-describedby={phoneError ? phoneErrorId : undefined}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
              setPhone(digits);
              if (phoneError) setPhoneError("");
            }}
            className="h-10 min-w-0 flex-1 bg-transparent px-3 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)]"
          />
        </div>
        {phoneError ? (
          <p
            id={phoneErrorId}
            role="alert"
            className="mt-1.5 text-xs text-[var(--color-danger)]"
          >
            {phoneError}
          </p>
        ) : null}
      </div>

      <MasterChipSelect
        id={`${baseId}-dept`}
        label="Department"
        className="w-full min-w-0"
        items={departments.map((d) => ({ id: d.id, name: d.name }))}
        value={departmentId}
        onChange={(value) => {
          setDepartmentId(value);
          setDesignationId("");
          setDesignations([]);
          setDesignationsLoading(Boolean(value));
        }}
        placeholder="Search departments"
        searchAriaLabel="Department"
      />
      {departmentsLoaded && departments.length === 0 ? (
        <p className="text-xs text-[var(--color-text-muted)]">
          No departments found in Org Structure.
        </p>
      ) : null}

      <MasterChipSelect
        id={`${baseId}-desig`}
        label="Designation"
        className="w-full min-w-0"
        items={designations.map((d) => ({ id: d.id, name: d.name }))}
        value={designationId}
        onChange={setDesignationId}
        disabled={!departmentId || designationsLoading}
        loading={designationsLoading}
        placeholder={
          departmentId
            ? designationsLoading
              ? "Loading…"
              : "Search designations"
            : "Select department first"
        }
        hint={!departmentId ? "Select department first" : undefined}
        searchAriaLabel="Designation"
      />

      {dealershipName ? (
        <Input
          id={`${baseId}-dealer`}
          label="Company"
          value={dealershipName}
          readOnly
          disabled
        />
      ) : null}

      <MasterChipSelect
        id={`${baseId}-branch`}
        label="Branch"
        className="w-full min-w-0"
        items={toChipItems(filterOptions.branches)}
        value={outletId}
        onChange={setOutletId}
        disabled={!hasBranches}
        placeholder={hasBranches ? "Search branches" : "No branches yet"}
        searchAriaLabel="Branch"
      />

      <Input
        id={`${baseId}-joined`}
        label="Joining date"
        type="date"
        value={joinedDate}
        onChange={(e) => setJoinedDate(e.target.value)}
      />

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" isLoading={saving} onClick={handleSave}>
          Save
        </Button>
      </div>
    </div>
  );
}

export function EmployeeEmploymentEditDialog({
  open,
  onOpenChange,
  employee,
  filterOptions,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: EmployeeDetail;
  filterOptions: EmployeeFilterOptions;
  onSaved?: () => void;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Edit employment & contact"
      description={employee.name}
      className="max-w-lg"
    >
      {open ? (
        <EmploymentEditForm
          key={`${employee.id}-${employee.joinedDate}-${employee.branchId}`}
          employee={employee}
          filterOptions={filterOptions}
          onCancel={() => onOpenChange(false)}
          onSaved={onSaved}
        />
      ) : null}
    </Dialog>
  );
}
