"use client";

import { useEffect, useState } from "react";

import { Button, Dialog, Input, Label, MasterChipSelect, toChipItems, toast } from "@/components/ui";
import { toAuthErrorMessage } from "@/features/auth/client-auth";
import { createEmployeeTransfer } from "@/features/employees/api";
import type { Employee, EmployeeFilterOptions } from "@/features/employees/types";
import { getDepartments, getDesignations } from "@/features/masters/api";
import type { MasterIdNameItem } from "@/features/masters/types";

export function EmployeesTransferDialog({
  employee,
  filterOptions,
  open,
  onOpenChange,
  onTransferred,
}: {
  employee: Employee | null;
  filterOptions: EmployeeFilterOptions;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTransferred?: () => void;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Transfer employee"
      description={
        employee
          ? `Move ${employee.name} to another outlet.`
          : undefined
      }
      className="max-w-md"
    >
      {open && employee ? (
        <TransferForm
          key={employee.id}
          employee={employee}
          filterOptions={filterOptions}
          onOpenChange={onOpenChange}
          onTransferred={onTransferred}
        />
      ) : null}
    </Dialog>
  );
}

function TransferForm({
  employee,
  filterOptions,
  onOpenChange,
  onTransferred,
}: {
  employee: Employee;
  filterOptions: EmployeeFilterOptions;
  onOpenChange: (open: boolean) => void;
  onTransferred?: () => void;
}) {
  const [toOutletId, setToOutletId] = useState("");
  const [departmentId, setDepartmentId] = useState(employee.departmentId ?? "");
  const [designationId, setDesignationId] = useState(employee.designationId);
  const [departments, setDepartments] = useState<MasterIdNameItem[]>([]);
  const [designationCache, setDesignationCache] = useState<{
    deptId: string;
    rows: MasterIdNameItem[];
  }>({ deptId: "", rows: [] });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void getDepartments()
      .then((rows) => {
        if (!cancelled) setDepartments(rows);
      })
      .catch(() => {
        if (!cancelled) toast.error("Couldn't load departments");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!departmentId) return;
    let cancelled = false;
    void getDesignations(departmentId)
      .then((rows) => {
        if (!cancelled) setDesignationCache({ deptId: departmentId, rows });
      })
      .catch(() => {
        if (!cancelled) toast.error("Couldn't load designations");
      });
    return () => {
      cancelled = true;
    };
  }, [departmentId]);

  const designations =
    designationCache.deptId === departmentId ? designationCache.rows : [];
  const designationsLoading = Boolean(departmentId) && designationCache.deptId !== departmentId;
  const toOptions = filterOptions.branches.filter(
    (b) => b.value !== employee.branchId,
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!toOutletId) {
      toast.error("Select a destination outlet");
      return;
    }
    if (!departmentId || !designationId) {
      toast.error("Select department and designation");
      return;
    }
    setIsLoading(true);
    try {
      const toBranch =
        filterOptions.branches.find((b) => b.value === toOutletId)?.label ??
        toOutletId;
      await createEmployeeTransfer(
        {
          employeeId: employee.id,
          fromOutletId: employee.branchId,
          outletId: toOutletId,
          departmentId,
          designationId,
        },
        {
          employeeName: employee.name,
          fadaId: employee.fadaId,
          toBranch,
        },
      );
      toast.success("Transfer sent. A pending join assignment was created.");
      onOpenChange(false);
      onTransferred?.();
    } catch (err) {
      toast.error(toAuthErrorMessage(err, "Failed to transfer employee"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      <div>
        <Label htmlFor="transfer-from">From outlet</Label>
        <Input id="transfer-from" value={employee.branch} readOnly disabled />
      </div>
      <MasterChipSelect
        id="transfer-to"
        label="To outlet"
        required
        className="w-full min-w-0"
        items={toChipItems(toOptions)}
        value={toOutletId}
        onChange={setToOutletId}
        placeholder="Search outlets"
        searchAriaLabel="To outlet"
      />
      <MasterChipSelect
        id="transfer-dept"
        label="Department"
        required
        className="w-full min-w-0"
        items={departments.map((d) => ({ id: d.id, name: d.name }))}
        value={departmentId}
        onChange={(value) => {
          setDepartmentId(value);
          setDesignationId("");
        }}
        placeholder="Search departments"
        searchAriaLabel="Department"
      />
      <MasterChipSelect
        id="transfer-desig"
        label="Designation"
        required
        className="w-full min-w-0"
        items={designations.map((d) => ({ id: d.id, name: d.name }))}
        value={designationId}
        onChange={setDesignationId}
        disabled={!departmentId || designationsLoading}
        loading={designationsLoading}
        placeholder={
          !departmentId
            ? "Select department first"
            : designationsLoading
              ? "Loading…"
              : "Search designations"
        }
        hint={!departmentId ? "Select department first" : undefined}
        searchAriaLabel="Designation"
      />
      <div className="flex justify-end gap-2 pt-1">
        <Button
          type="button"
          variant="secondary"
          onClick={() => onOpenChange(false)}
        >
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          Transfer
        </Button>
      </div>
    </form>
  );
}
