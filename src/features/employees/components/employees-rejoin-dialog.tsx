"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye } from "lucide-react";

import {
  Button,
  Dialog,
  Input,
  MasterChipSelect,
  toChipItems,
  toast,
  Tooltip,
} from "@/components/ui";
import { routes } from "@/config/navigation";
import { toAuthErrorMessage } from "@/features/auth/client-auth";
import { searchEmployeesForJoining } from "@/features/employees/api";
import type {
  EmployeeFilterOptions,
  EmployeeJoiningCandidate,
} from "@/features/employees/types";
import { sendEmployerInvitation } from "@/features/employment-requests/api";
import { getDepartments, getDesignations } from "@/features/masters/api";
import type { MasterIdNameItem } from "@/features/masters/types";

export function EmployeesRejoinDialog({
  open,
  onOpenChange,
  filterOptions,
  onInvited,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filterOptions: EmployeeFilterOptions;
  onInvited?: () => void;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Invite employee"
      description="Search by FADA ID and send a join invitation with branch, department, and designation."
      className="max-w-md"
    >
      {open ? (
        <InviteForm
          filterOptions={filterOptions}
          onOpenChange={onOpenChange}
          onInvited={onInvited}
        />
      ) : null}
    </Dialog>
  );
}

function InviteForm({
  filterOptions,
  onOpenChange,
  onInvited,
}: {
  filterOptions: EmployeeFilterOptions;
  onOpenChange: (open: boolean) => void;
  onInvited?: () => void;
}) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<EmployeeJoiningCandidate[]>([]);
  const [selected, setSelected] = useState<EmployeeJoiningCandidate | null>(
    null,
  );
  const [searching, setSearching] = useState(false);
  const [outletId, setOutletId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [designationId, setDesignationId] = useState("");
  const [departments, setDepartments] = useState<MasterIdNameItem[]>([]);
  const [designations, setDesignations] = useState<MasterIdNameItem[]>([]);
  const [designationsLoading, setDesignationsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const rows = await getDepartments();
        if (!cancelled) setDepartments(rows);
      } catch {
        if (!cancelled) toast.error("Couldn't load departments");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!departmentId) {
      setDesignations([]);
      return;
    }
    let cancelled = false;
    setDesignationsLoading(true);
    void (async () => {
      try {
        const rows = await getDesignations(departmentId);
        if (!cancelled) setDesignations(rows);
      } catch {
        if (!cancelled) toast.error("Couldn't load designations");
      } finally {
        if (!cancelled) setDesignationsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [departmentId]);

  function resetToSearch() {
    setResults([]);
    setSelected(null);
    setOutletId("");
    setDepartmentId("");
    setDesignationId("");
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearching(true);
    try {
      const rows = await searchEmployeesForJoining(search);
      setResults(rows);
      if (rows.length === 1) {
        setSelected(rows[0] ?? null);
      } else {
        setSelected(null);
      }
    } catch (err) {
      resetToSearch();
      toast.error(toAuthErrorMessage(err, "Couldn't find that FADA ID"));
    } finally {
      setSearching(false);
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    if (!outletId || !departmentId || !designationId) {
      toast.error("Select branch, department, and designation");
      return;
    }
    setIsSaving(true);
    try {
      const branchName = filterOptions.branches.find(
        (b) => b.value === outletId,
      )?.label;
      await sendEmployerInvitation(
        {
          employeeId: selected.id,
          outletId,
          departmentId,
          designationId,
        },
        {
          employeeName: selected.name,
          fadaId: selected.fadaId,
          branchName,
        },
      );
      toast.success(
        `Invitation sent to ${selected.name} (${selected.fadaId}). Check Join Requests for status.`,
      );
      onOpenChange(false);
      onInvited?.();
    } catch (err) {
      toast.error(toAuthErrorMessage(err, "Failed to send invitation"));
    } finally {
      setIsSaving(false);
    }
  }

  if (selected) {
    return (
      <form className="space-y-4" onSubmit={handleInvite} noValidate>
        <div className="flex items-start gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-muted)] px-3 py-2 text-sm">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-[var(--color-heading)]">
              {selected.name}
            </p>
            <p className="text-[var(--color-text-muted)]">{selected.fadaId}</p>
            {selected.email ? (
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                {selected.email}
              </p>
            ) : null}
            {selected.phone ? (
              <p className="text-xs text-[var(--color-text-muted)]">
                {selected.phone}
              </p>
            ) : null}
          </div>
          <Tooltip content="View profile">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0"
              aria-label={`View ${selected.name}`}
              onClick={() => {
                onOpenChange(false);
                router.push(routes.employeeDetail(selected.id));
              }}
            >
              <Eye />
            </Button>
          </Tooltip>
        </div>
        <MasterChipSelect
          id="invite-branch"
          label="Branch"
          className="w-full min-w-0"
          items={toChipItems(filterOptions.branches)}
          value={outletId}
          onChange={setOutletId}
          placeholder="Search branches"
          searchAriaLabel="Branch"
        />
        <MasterChipSelect
          id="invite-dept"
          label="Department"
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
          id="invite-desig"
          label="Designation"
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
        <p className="text-xs text-[var(--color-text-muted)]">
          Sending an invitation creates a pending join request. The employee
          must accept before they appear as active staff.
        </p>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setSelected(null);
              setOutletId("");
              setDepartmentId("");
              setDesignationId("");
            }}
          >
            Back
          </Button>
          <Button type="submit" isLoading={isSaving}>
            Invite
          </Button>
        </div>
      </form>
    );
  }

  if (results.length > 1) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-[var(--color-text-muted)]">
          {results.length} employees match your search. Select one to invite.
        </p>
        <ul className="max-h-64 space-y-2 overflow-y-auto">
          {results.map((row) => (
            <li key={row.id}>
              <button
                type="button"
                className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-left transition hover:border-[var(--color-primary)]"
                onClick={() => setSelected(row)}
              >
                <p className="font-semibold text-[var(--color-heading)]">
                  {row.name}
                </p>
                <p className="text-sm text-[var(--color-text-muted)]">
                  {row.fadaId}
                </p>
                {row.email ? (
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {row.email}
                  </p>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={resetToSearch}>
            Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSearch} noValidate>
      <Input
        id="invite-search"
        label="FADA ID"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="fada-df-12345"
        required
      />
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => onOpenChange(false)}
        >
          Cancel
        </Button>
        <Button type="submit" isLoading={searching}>
          Search
        </Button>
      </div>
    </form>
  );
}
