"use client";

import {
  downloadEmployeeImportTemplate,
  validateEmployeeImportCsv,
} from "@/features/employees/csv-template";
import { downloadEmployeeMastersReferenceCsv } from "@/features/employees/masters-reference-csv";
import type {
  Employee,
  EmployeeFilterOptions,
  EmployeeImportResult,
  EmployeeInput,
} from "@/features/employees/types";
import { getDepartments, getDesignations } from "@/features/masters/api";
import type { MasterIdNameItem } from "@/features/masters/types";
import { cn } from "@/lib/utils/cn";
import { toAuthErrorMessage } from "@/features/auth/client-auth";
import { useActingDealerName } from "@/features/auth/use-acting-dealer-name";
import { routes } from "@/config/navigation";
import {
  createEmployee,
  importEmployeesCsv,
  updateEmployee,
} from "@/features/employees/api";
import {
  Button,
  Dialog,
  Input,
  Label,
  MasterChipSelect,
  toChipItems,
  toast,
} from "@/components/ui";
import Link from "next/link";
import {
  Award,
  Briefcase,
  Building2,
  Download,
  Upload,
  UserRound,
} from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

type FormState = {
  name: string;
  email: string;
  phone: string;
  departmentId: string;
  designationId: string;
  outletId: string;
  score: string;
  isActive: boolean;
  joinedDate: string;
};

const emptyForm: FormState = {
  name: "",
  email: "",
  phone: "",
  departmentId: "",
  designationId: "",
  outletId: "",
  score: "0",
  isActive: true,
  joinedDate: "",
};

function stripPhonePrefix(phone: string): string {
  return phone.replace(/^\+91\s*/i, "").trim();
}

function toApiPhone(local: string): string | undefined {
  const trimmed = local.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith("+")) return trimmed;
  return `+91 ${trimmed}`;
}

function formFromEmployee(employee?: Employee | null): FormState {
  if (!employee) return emptyForm;
  return {
    name: employee.name,
    email: employee.email,
    phone: stripPhonePrefix(employee.phone).replace(/\D/g, "").slice(0, 10),
    departmentId: employee.departmentId ?? "",
    designationId: employee.designationId ?? "",
    outletId: employee.branchId,
    score: String(employee.fadaScore ?? 0),
    isActive: employee.isActive !== false && employee.status !== "Inactive",
    joinedDate: employee.joinedDate ?? "",
  };
}

function FormSection({
  icon: Icon,
  title,
  description,
  tone,
  /** Full-width vertical field stack instead of the default 2-up grid. */
  stack,
  children,
}: {
  icon: typeof UserRound;
  title: string;
  description: string;
  tone: "identity" | "role" | "assignment" | "employment";
  stack?: boolean;
  children: ReactNode;
}) {
  const toneClasses = {
    identity: {
      wrap: "border-violet-200/80 bg-violet-50/50",
      icon: "bg-violet-100 text-violet-700",
    },
    role: {
      wrap: "border-emerald-200/80 bg-emerald-50/50",
      icon: "bg-emerald-100 text-emerald-700",
    },
    assignment: {
      wrap: "border-orange-200/80 bg-orange-50/40",
      icon: "bg-orange-100 text-orange-700",
    },
    employment: {
      wrap: "border-slate-200/90 bg-slate-50/60",
      icon: "bg-slate-200/80 text-slate-700",
    },
  }[tone];

  return (
    <section
      className={cn(
        "rounded-[var(--radius-lg)] border p-4",
        toneClasses.wrap,
      )}
    >
      <div className="mb-3 flex items-start gap-3">
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-md)]",
            toneClasses.icon,
          )}
        >
          <Icon className="size-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-[var(--color-heading)]">
            {title}
          </h3>
          <p className="text-xs text-[var(--color-text-muted)]">{description}</p>
        </div>
      </div>
      <div
        className={cn(
          "grid grid-cols-1",
          stack ? "gap-4" : "gap-3 sm:grid-cols-2",
        )}
      >
        {children}
      </div>
    </section>
  );
}

function FieldLabel({
  htmlFor,
  required,
  children,
  hint,
}: {
  htmlFor?: string;
  required?: boolean;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div className="mb-1.5 flex items-center justify-between gap-2">
      <Label htmlFor={htmlFor} required={required}>
        {children}
      </Label>
      {hint ? (
        <span className="text-[10px] font-medium tracking-wide text-[var(--color-text-muted)] uppercase">
          {hint}
        </span>
      ) : null}
    </div>
  );
}

function employeeFormKey(employee?: Employee | null): string {
  if (!employee) return "new";
  return [
    employee.id,
    employee.branchId,
    employee.departmentId ?? "",
    employee.designationId ?? "",
  ].join("-");
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
  onSaved?: () => void | Promise<void>;
}) {
  const isEdit = Boolean(employee);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit Employee" : "Add Employee"}
      description="FADA ID holder — linked to a company, outlet and role."
      className="max-h-[min(90dvh,48rem)] max-w-2xl"
    >
      {open ? (
        <EmployeeForm
          key={employeeFormKey(employee)}
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
  onSaved?: () => void | Promise<void>;
}) {
  const [form, setForm] = useState<FormState>(() => formFromEmployee(employee));
  const [phoneError, setPhoneError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [departments, setDepartments] = useState<MasterIdNameItem[]>([]);
  const [designations, setDesignations] = useState<MasterIdNameItem[]>([]);
  const [departmentsLoaded, setDepartmentsLoaded] = useState(false);
  const [designationsLoading, setDesignationsLoading] = useState(() =>
    Boolean(employee?.departmentId),
  );
  const isEdit = Boolean(employee);
  const dealershipName = useActingDealerName();
  const hasBranches = filterOptions.branches.length > 0;
  const canSave = Boolean(form.outletId.trim());
  const baseId = useId();
  const phoneErrorId = `${baseId}-phone-error`;

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

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
    const departmentId = form.departmentId;
    if (!departmentId) return;

    let cancelled = false;
    void (async () => {
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
  }, [form.departmentId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Enter employee name");
      return;
    }
    if (!form.outletId.trim()) {
      toast.error(
        hasBranches
          ? "Select an outlet"
          : "Create an outlet first, then add the employee",
      );
      return;
    }
    if (form.email && !form.email.includes("@")) {
      toast.error("Enter a valid email");
      return;
    }
    if (
      (form.departmentId && !form.designationId) ||
      (!form.departmentId && form.designationId)
    ) {
      toast.error("Select both department and designation");
      return;
    }

    const phoneDigits = form.phone.replace(/\D/g, "");
    if (form.phone.trim() && phoneDigits.length !== 10) {
      setPhoneError("Enter a valid 10-digit mobile number");
      return;
    }
    setPhoneError("");

    const payload: EmployeeInput = {
      name: form.name.trim(),
      email: form.email.trim() || undefined,
      phone: toApiPhone(phoneDigits),
      outletId: form.outletId || undefined,
      joinedDate: form.joinedDate || undefined,
      score:
        isEdit && employee
          ? employee.fadaScore
          : 0,
      isActive:
        isEdit && employee
          ? employee.isActive !== false && employee.status !== "Inactive"
          : true,
      departmentId: form.departmentId || undefined,
      designationId: form.designationId || undefined,
      assignmentId: isEdit ? employee?.assignmentId : undefined,
    };

    setIsLoading(true);
    try {
      if (isEdit && employee) {
        await updateEmployee(employee.id, payload);
        toast.success("Employee updated");
      } else {
        await createEmployee(payload);
        toast.success("Employee added");
      }
      await onSaved?.();
      onOpenChange(false);
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

  const departmentItems = departments.map((d) => ({ id: d.id, name: d.name }));
  const designationItems = designations.map((d) => ({ id: d.id, name: d.name }));
  const branchItems = toChipItems(filterOptions.branches);

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      <FormSection
        icon={UserRound}
        title="Identity"
        description="FADA ID, full legal name, and primary contact details."
        tone="identity"
      >
        <div>
          <FieldLabel htmlFor={`${baseId}-fada`} required hint="Auto-generated">
            FADA ID
          </FieldLabel>
          <Input
            id={`${baseId}-fada`}
            value={isEdit ? employee?.fadaId || "—" : ""}
            placeholder="Auto-generated"
            readOnly
            disabled
          />
        </div>
        <Input
          id={`${baseId}-name`}
          label="Full Name"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          required
        />
        <Input
          id={`${baseId}-email`}
          label="Email"
          type="email"
          placeholder="name@company.com"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
        />
        <div>
          <FieldLabel htmlFor={`${baseId}-phone`}>Mobile</FieldLabel>
          <div
            className={cn(
              "flex overflow-hidden rounded-[var(--radius-md)] border bg-[var(--color-surface)] focus-within:ring-2 focus-within:ring-offset-1",
              phoneError
                ? "border-[var(--color-danger)] focus-within:ring-[var(--color-danger)]"
                : "border-[var(--color-border)] focus-within:ring-[var(--color-ring)]",
            )}
          >
            <span className="flex items-center border-r border-[var(--color-border)] bg-[var(--color-muted)] px-3 text-sm text-[var(--color-text-muted)]">
              +91
            </span>
            <input
              id={`${baseId}-phone`}
              type="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder="9876543210"
              value={form.phone}
              aria-invalid={phoneError ? true : undefined}
              aria-describedby={phoneError ? phoneErrorId : undefined}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                update("phone", digits);
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
      </FormSection>

      <FormSection
        icon={Briefcase}
        title="Role"
        description="Department and designation from Org Structure."
        tone="role"
        stack
      >
        <MasterChipSelect
          id={`${baseId}-dept`}
          label="Department"
          className="w-full min-w-0"
          compact
          items={departmentItems}
          value={form.departmentId}
          onChange={(value) => {
            setForm((prev) => ({
              ...prev,
              departmentId: value,
              designationId: "",
            }));
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
          compact
          items={designationItems}
          value={form.designationId}
          onChange={(value) => update("designationId", value)}
          disabled={!form.departmentId || designationsLoading}
          loading={designationsLoading}
          placeholder={
            form.departmentId
              ? designationsLoading
                ? "Loading…"
                : "Search designations"
              : "Select department first"
          }
          hint={
            !form.departmentId ? "Select department first" : undefined
          }
          searchAriaLabel="Designation"
        />
      </FormSection>

      <FormSection
        icon={Building2}
        title="Assignment"
        description="Company and outlet this employee reports to."
        tone="assignment"
      >
        <div>
          <FieldLabel htmlFor={`${baseId}-dealer`} hint="Read-only">
            Company
          </FieldLabel>
          <Input
            id={`${baseId}-dealer`}
            value={dealershipName}
            readOnly
            disabled
          />
        </div>
        {isEdit ? (
          <div>
            <FieldLabel htmlFor={`${baseId}-branch`} hint="Read-only">
              Outlet
            </FieldLabel>
            <Input
              id={`${baseId}-branch`}
              value={employee?.branch ?? ""}
              readOnly
              disabled
            />
          </div>
        ) : (
          <>
            <MasterChipSelect
              id={`${baseId}-branch`}
              label="Outlet"
              required
              className="w-full min-w-0"
              compact
              items={branchItems}
              value={form.outletId}
              onChange={(value) => update("outletId", value)}
              disabled={!hasBranches}
              placeholder={hasBranches ? "Search outlets" : "No outlets yet"}
              searchAriaLabel="Outlet"
            />
            {!hasBranches ? (
              <p
                className="text-xs text-[var(--color-text-muted)]"
                role="status"
              >
                This company has no outlet yet.{" "}
                <Link
                  href={routes.branches}
                  className="font-medium text-[var(--color-primary)] underline-offset-2 hover:underline"
                  onClick={() => onOpenChange(false)}
                >
                  Create an outlet
                </Link>{" "}
                first, then add the employee.
              </p>
            ) : null}
          </>
        )}
      </FormSection>

      <FormSection
        icon={Award}
        title="Employment"
        description="Joining date. Score and status are managed by FADA."
        tone="employment"
      >
        <Input
          id={`${baseId}-score`}
          label="Score"
          type="number"
          min={0}
          value={form.score}
          readOnly
          disabled
          helperText="Managed by FADA system"
        />
        <div>
          <FieldLabel htmlFor={`${baseId}-status`}>Status</FieldLabel>
          <div className="mt-1.5">
            <span
              id={`${baseId}-status`}
              className={cn(
                "inline-flex h-8 items-center rounded-full border px-3 text-sm font-medium",
                form.isActive
                  ? "border-[var(--color-primary)]/30 bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                  : "border-[var(--color-border)] bg-[var(--color-muted)] text-[var(--color-text-muted)]",
              )}
              aria-label="Status"
            >
              {form.isActive ? "Active" : "Inactive"}
            </span>
          </div>
          <p className="mt-1.5 text-xs text-[var(--color-text-muted)]">
            Managed by FADA system
          </p>
        </div>
        <Input
          id={`${baseId}-joined`}
          label="Joined"
          type="date"
          value={form.joinedDate}
          onChange={(e) => update("joinedDate", e.target.value)}
          containerClassName="sm:col-span-2"
        />
      </FormSection>

      <div className="flex justify-end gap-2 pt-1">
        <Button
          type="button"
          variant="secondary"
          onClick={() => onOpenChange(false)}
        >
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading} disabled={!canSave}>
          {isEdit ? "Save changes" : "Save Employee"}
        </Button>
      </div>
    </form>
  );
}

export function EmployeesImportDialog({
  open,
  onOpenChange,
  onImported,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported?: () => void;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Import Employees"
      description="Upload a CSV to onboard multiple employees at once."
      className="max-w-xl"
    >
      {open ? (
        <EmployeesImportForm
          onOpenChange={onOpenChange}
          onImported={onImported}
        />
      ) : null}
    </Dialog>
  );
}

function isCsvFile(file: File): boolean {
  const lower = file.name.toLowerCase();
  return lower.endsWith(".csv") || file.type === "text/csv";
}

function pickCsvFile(list: FileList | null): File | null {
  if (!list?.length) return null;
  for (const file of Array.from(list)) {
    if (isCsvFile(file)) return file;
  }
  return null;
}

function EmployeesImportForm({
  onOpenChange,
  onImported,
}: {
  onOpenChange: (open: boolean) => void;
  onImported?: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [referenceLoading, setReferenceLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] = useState<EmployeeImportResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepthRef = useRef(0);

  function applyFile(next: File | null) {
    setFile(next);
    setResult(null);
  }

  function onFileList(list: FileList | null) {
    if (!list?.length) {
      applyFile(null);
      return;
    }
    const csv = pickCsvFile(list);
    if (!csv) {
      toast.error("Only CSV files are supported");
      return;
    }
    applyFile(csv);
  }

  function openFilePicker() {
    inputRef.current?.click();
  }

  async function handleDownloadIdReference() {
    setReferenceLoading(true);
    try {
      const count = await downloadEmployeeMastersReferenceCsv();
      if (count === 0) {
        toast.message("No master data found — downloaded empty reference file");
      } else {
        toast.success("ID reference downloaded");
      }
    } catch (err) {
      toast.error(
        toAuthErrorMessage(err, "Couldn't download ID reference"),
      );
    } finally {
      setReferenceLoading(false);
    }
  }

  async function handleImport() {
    if (!file) {
      toast.error("Choose a CSV file to import");
      return;
    }

    const validationError = await validateEmployeeImportCsv(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsLoading(true);
    try {
      const importResult = await importEmployeesCsv(file);
      setResult(importResult);

      if (importResult.failed > 0 && importResult.created > 0) {
        toast.message(
          `Imported ${importResult.created} of ${importResult.total}; ${importResult.failed} failed`,
        );
      } else if (importResult.failed > 0) {
        toast.error(
          `Import failed for ${importResult.failed} of ${importResult.total} row(s)`,
        );
      } else {
        toast.success(
          `Imported ${importResult.created} employee${importResult.created === 1 ? "" : "s"}`,
        );
      }

      if (importResult.created > 0) {
        onImported?.();
      }
    } catch (err) {
      toast.error(toAuthErrorMessage(err, "Failed to import employees"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => downloadEmployeeImportTemplate()}
        >
          <Download className="size-3.5" aria-hidden />
          Download template
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          isLoading={referenceLoading}
          onClick={() => void handleDownloadIdReference()}
        >
          <Download className="size-3.5" aria-hidden />
          Download ID reference
        </Button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="sr-only"
        onChange={(e) => {
          onFileList(e.target.files);
          e.target.value = "";
        }}
      />

      <div
        role="button"
        tabIndex={0}
        aria-label={
          file
            ? `Selected file ${file.name}. Click or press Enter to choose another CSV.`
            : "Drop CSV here or click to browse"
        }
        onClick={openFilePicker}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openFilePicker();
          }
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          dragDepthRef.current += 1;
          setIsDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
          if (dragDepthRef.current === 0) setIsDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          dragDepthRef.current = 0;
          setIsDragging(false);
          onFileList(e.dataTransfer.files);
        }}
        className={cn(
          "flex w-full flex-col items-center justify-center gap-2 rounded-[var(--radius-md)] border border-dashed px-4 py-10 text-center transition-colors",
          "cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-1",
          isDragging
            ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)]"
            : "border-[var(--color-border)] bg-[var(--color-muted)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-soft)]",
        )}
      >
        <Upload className="size-6 text-[var(--color-primary)]" aria-hidden />
        <span className="text-sm font-medium text-[var(--color-heading)]">
          {file ? file.name : "Drop CSV here or click to browse"}
        </span>
        {file ? (
          <span className="text-xs text-[var(--color-text-muted)]">
            Click or drop another file to replace
          </span>
        ) : null}
      </div>

      <div className="space-y-1 text-xs text-[var(--color-text-muted)]">
        <p>
          Columns: name, email, phone, departmentId, designationId, outletId,
          score, isActive, joinedDate
        </p>
        <p>
          Use Download ID reference for departmentId, designationId, and
          outletId values.
        </p>
      </div>

      {result ? (
        <div className="space-y-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-muted)] p-3 text-sm">
          <p className="font-medium text-[var(--color-heading)]">
            {result.created} created · {result.failed} failed · {result.total}{" "}
            total
          </p>
          {result.errors.length > 0 ? (
            <ul className="max-h-32 space-y-1 overflow-y-auto text-[var(--color-text-muted)]">
              {result.errors.map((err) => (
                <li key={`${err.row}-${err.message}`}>
                  Row {err.row}: {err.message}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => onOpenChange(false)}
        >
          Close
        </Button>
        <Button
          type="button"
          isLoading={isLoading}
          disabled={!file}
          onClick={() => void handleImport()}
        >
          Import
        </Button>
      </div>
    </div>
  );
}
