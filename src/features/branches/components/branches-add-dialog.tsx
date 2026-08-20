"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  Building2,
  Layers,
  MapPin,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

import {
  Button,
  Dialog,
  Input,
  Label,
  Skeleton,
  toast,
} from "@/components/ui";
import { createOutlet, getOutletById, updateOutlet } from "@/features/branches/api";
import type { Branch, OutletInput } from "@/features/branches/types";
import { toAuthErrorMessage } from "@/features/auth/client-auth";
import { useActingDealerName } from "@/features/auth/use-acting-dealer-name";
import { getBrands, getOutletFunctions } from "@/features/masters/api";
import type { MasterIdNameItem } from "@/features/masters/types";
import { lookupPincode } from "@/lib/pincode";
import { cn } from "@/lib/utils/cn";

type FormState = {
  name: string;
  code: string;
  manager: string;
  city: string;
  state: string;
  address: string;
  pinCode: string;
  brandId: string;
  functionIds: string[];
  isActive: boolean;
};

const emptyForm: FormState = {
  name: "",
  code: "",
  manager: "",
  city: "",
  state: "",
  address: "",
  pinCode: "",
  brandId: "",
  functionIds: [],
  isActive: true,
};

export function toggleOutletFunctionIds(
  selectedIds: string[],
  id: string,
): string[] {
  return selectedIds.includes(id)
    ? selectedIds.filter((x) => x !== id)
    : [...selectedIds, id];
}

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
    brandId: branch.brandId != null ? String(branch.brandId) : "",
    functionIds: (branch.functionIds ?? []).map(String),
    isActive: branch.isActive !== false && branch.status !== "Inactive",
  };
}

function FormSection({
  icon: Icon,
  title,
  description,
  tone,
  children,
  contentClassName,
}: {
  icon: typeof Building2;
  title: string;
  description: string;
  tone: "basics" | "location" | "brand" | "status";
  children: ReactNode;
  contentClassName?: string;
}) {
  const toneClasses = {
    basics: {
      wrap: "border-orange-200/80 bg-orange-50/40",
      icon: "bg-orange-100 text-orange-700",
      title: "text-orange-700",
    },
    location: {
      wrap: "border-orange-200/80 bg-orange-50/40",
      icon: "bg-orange-100 text-orange-700",
      title: "text-orange-700",
    },
    brand: {
      wrap: "border-emerald-200/80 bg-emerald-50/50",
      icon: "bg-emerald-100 text-emerald-700",
      title: "text-emerald-700",
    },
    status: {
      wrap: "border-orange-200/80 bg-orange-50/40",
      icon: "bg-orange-100 text-orange-700",
      title: "text-orange-700",
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
          <h3 className={cn("text-sm font-semibold", toneClasses.title)}>
            {title}
          </h3>
          <p className="text-xs text-[var(--color-text-muted)]">{description}</p>
        </div>
      </div>
      <div className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2", contentClassName)}>
        {children}
      </div>
    </section>
  );
}

function ActiveSwitch({
  checked,
  onCheckedChange,
}: {
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
}) {
  const id = useId();
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label="Active outlet"
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-1",
        checked ? "bg-[var(--color-primary)]" : "bg-[var(--color-border-strong)]",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform",
          checked && "translate-x-5",
        )}
      />
    </button>
  );
}

function BrandChipSelect({
  brands,
  value,
  onChange,
  disabled,
}: {
  brands: MasterIdNameItem[];
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");
  const selected = brands.find((b) => b.id === value);
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = brands.filter((b) =>
    normalizedQuery ? b.name.toLowerCase().includes(normalizedQuery) : true,
  );

  return (
    <div className="col-span-full min-w-0 space-y-2">
      <div>
        <Label required>Brand</Label>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
          Browse or search brands and tap a tag to select.
        </p>
      </div>

      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--color-text-muted)]"
          aria-hidden
        />
        <input
          type="search"
          disabled={disabled}
          value={query}
          placeholder="Search brands e.g. Honda"
          onChange={(e) => setQuery(e.target.value)}
          className={cn(
            "h-10 w-full rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] py-2 pr-3 pl-10 text-sm",
            "placeholder:text-[var(--color-text-muted)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-1",
            "disabled:cursor-not-allowed disabled:opacity-60",
          )}
          aria-label="Search brands"
        />
      </div>

      <div className="max-h-40 overflow-y-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
        {filtered.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">
            {normalizedQuery ? "No brands found" : "No brands available"}
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {filtered.map((brand) => {
              const isSelected = brand.id === value;
              return (
                <button
                  key={brand.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange(brand.id)}
                  aria-pressed={isSelected}
                  className={cn(
                    "inline-flex h-8 items-center rounded-full border px-3 text-sm font-medium transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]",
                    "disabled:pointer-events-none disabled:opacity-60",
                    isSelected
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                      : "border-[var(--color-primary)]/30 bg-[var(--color-primary-soft)] text-[var(--color-primary)] hover:bg-[var(--color-primary)]/15",
                  )}
                >
                  {brand.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selected ? (
        <div className="flex flex-wrap gap-2 pt-1">
          <span className="inline-flex h-8 max-w-full items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-muted)] px-2.5 text-sm font-medium text-[var(--color-heading)]">
            <span className="min-w-0 truncate">{selected.name}</span>
            <button
              type="button"
              disabled={disabled}
              aria-label={`Clear ${selected.name}`}
              onClick={() => onChange("")}
              className={cn(
                "inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[var(--color-text-muted)]",
                "hover:bg-white hover:text-[var(--color-text)]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]",
                "disabled:pointer-events-none disabled:opacity-60",
              )}
            >
              <X className="size-3.5" aria-hidden />
            </button>
          </span>
        </div>
      ) : null}
    </div>
  );
}

function OutletFunctionsPicker({
  functions,
  selectedIds,
  onChange,
  disabled,
}: {
  functions: MasterIdNameItem[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");
  const selected = functions.filter((fn) => selectedIds.includes(fn.id));
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = functions.filter((fn) =>
    normalizedQuery ? fn.name.toLowerCase().includes(normalizedQuery) : true,
  );

  return (
    <div className="col-span-full min-w-0 space-y-2">
      <div>
        <Label>Outlet Functions</Label>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
          Browse or search functions and tap tags to select.
        </p>
      </div>

      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--color-text-muted)]"
          aria-hidden
        />
        <input
          type="search"
          disabled={disabled}
          value={query}
          placeholder="Search functions e.g. Sales"
          onChange={(e) => setQuery(e.target.value)}
          className={cn(
            "h-10 w-full rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] py-2 pr-3 pl-10 text-sm",
            "placeholder:text-[var(--color-text-muted)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-1",
            "disabled:cursor-not-allowed disabled:opacity-60",
          )}
          aria-label="Search outlet functions"
        />
      </div>

      <div className="max-h-40 overflow-y-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
        {filtered.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">
            {normalizedQuery ? "No functions found" : "No functions available"}
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {filtered.map((fn) => {
              const isSelected = selectedIds.includes(fn.id);
              return (
                <button
                  key={fn.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange(toggleOutletFunctionIds(selectedIds, fn.id))}
                  aria-pressed={isSelected}
                  className={cn(
                    "inline-flex h-8 items-center rounded-full border px-3 text-sm font-medium transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]",
                    "disabled:pointer-events-none disabled:opacity-60",
                    isSelected
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                      : "border-[var(--color-primary)]/30 bg-[var(--color-primary-soft)] text-[var(--color-primary)] hover:bg-[var(--color-primary)]/15",
                  )}
                >
                  {fn.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-2 pt-1">
          {selected.map((fn) => (
            <span
              key={fn.id}
              className="inline-flex h-8 max-w-full items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-muted)] px-2.5 text-sm font-medium text-[var(--color-heading)]"
            >
              <span className="min-w-0 truncate">{fn.name}</span>
              <button
                type="button"
                disabled={disabled}
                aria-label={`Clear ${fn.name}`}
                onClick={() =>
                  onChange(toggleOutletFunctionIds(selectedIds, fn.id))
                }
                className={cn(
                  "inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[var(--color-text-muted)]",
                  "hover:bg-white hover:text-[var(--color-text)]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]",
                  "disabled:pointer-events-none disabled:opacity-60",
                )}
              >
                <X className="size-3.5" aria-hidden />
              </button>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
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
          ? "Update outlet details for this company."
          : "Create a new outlet for this company."
      }
      className="max-h-[min(90dvh,48rem)] max-w-2xl"
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
  const [mastersLoading, setMastersLoading] = useState(true);
  const [hydrateLoading, setHydrateLoading] = useState(Boolean(branch));
  const [brands, setBrands] = useState<MasterIdNameItem[]>([]);
  const [outletFunctions, setOutletFunctions] = useState<MasterIdNameItem[]>([]);
  const [pinLookingUp, setPinLookingUp] = useState(false);
  const isEdit = Boolean(branch);
  const companyName = useActingDealerName();
  const pinAbortRef = useRef<AbortController | null>(null);
  const pinTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  useEffect(() => {
    let cancelled = false;
    setMastersLoading(true);
    Promise.all([getBrands(), getOutletFunctions()])
      .then(([brandList, fnList]) => {
        if (cancelled) return;
        setBrands(brandList);
        setOutletFunctions(fnList);
      })
      .catch(() => {
        if (cancelled) return;
        toast.error("Failed to load brands and outlet functions");
      })
      .finally(() => {
        if (!cancelled) setMastersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!branch?.id) {
      setHydrateLoading(false);
      return;
    }
    let cancelled = false;
    setHydrateLoading(true);
    getOutletById(branch.id)
      .then((full) => {
        if (cancelled) return;
        setForm(formFromBranch(full));
      })
      .catch(() => {
        if (cancelled) return;
        // List row fields are enough as fallback
        setForm(formFromBranch(branch));
      })
      .finally(() => {
        if (!cancelled) setHydrateLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [branch?.id]);

  useEffect(() => {
    return () => {
      pinAbortRef.current?.abort();
      if (pinTimerRef.current) clearTimeout(pinTimerRef.current);
    };
  }, []);

  function handlePinChange(value: string) {
    const pin = value.replace(/\D/g, "").slice(0, 6);
    update("pinCode", pin);

    if (pinTimerRef.current) clearTimeout(pinTimerRef.current);
    pinAbortRef.current?.abort();

    if (pin.length !== 6) {
      setPinLookingUp(false);
      return;
    }

    pinTimerRef.current = setTimeout(async () => {
      const controller = new AbortController();
      pinAbortRef.current = controller;
      setPinLookingUp(true);
      try {
        const location = await lookupPincode(pin, controller.signal);
        if (controller.signal.aborted) return;
        if (location) {
          setForm((prev) => ({
            ...prev,
            city: location.city || prev.city,
            state: location.state || prev.state,
          }));
        }
      } finally {
        if (!controller.signal.aborted) setPinLookingUp(false);
      }
    }, 350);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Enter outlet name");
      return;
    }
    if (!form.brandId) {
      toast.error("Select a brand");
      return;
    }

    const brandIdNum = Number(form.brandId);
    if (!Number.isFinite(brandIdNum) || brandIdNum <= 0) {
      toast.error("Select a valid brand");
      return;
    }

    const payload: OutletInput = {
      name: form.name.trim(),
      brandId: brandIdNum,
      code: form.code.trim() || undefined,
      manager: form.manager.trim() || undefined,
      city: form.city.trim() || undefined,
      state: form.state.trim() || undefined,
      address: form.address.trim() || undefined,
      pinCode: form.pinCode.trim() || undefined,
      functions: form.functionIds.length ? form.functionIds : undefined,
      isActive: form.isActive,
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

  if (hydrateLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full rounded-[var(--radius-lg)]" />
        <Skeleton className="h-28 w-full rounded-[var(--radius-lg)]" />
        <Skeleton className="h-36 w-full rounded-[var(--radius-lg)]" />
        <Skeleton className="h-16 w-full rounded-[var(--radius-lg)]" />
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      <FormSection
        icon={Layers}
        title="Brand Coverage"
        description="What brands this outlet sells and services."
        tone="brand"
        contentClassName="sm:grid-cols-1"
      >
        {mastersLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <>
            <BrandChipSelect
              brands={brands}
              value={form.brandId}
              onChange={(id) => update("brandId", id)}
            />
            <OutletFunctionsPicker
              functions={outletFunctions}
              selectedIds={form.functionIds}
              onChange={(ids) => update("functionIds", ids)}
            />
          </>
        )}
      </FormSection>

      <FormSection
        icon={Building2}
        title="Outlet Basics"
        description="Identify the outlet and its parent company."
        tone="basics"
      >
        <Input
          label="Outlet Name"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder="e.g. Andheri West Showroom"
          required
        />
        <Input
          label="Code"
          value={form.code}
          onChange={(e) => update("code", e.target.value)}
          placeholder="Optional short code"
        />
        <Input
          label="Company"
          value={companyName}
          readOnly
          disabled
          required
        />
        <Input
          label="Manager"
          value={form.manager}
          onChange={(e) => update("manager", e.target.value)}
          placeholder="Outlet manager name"
        />
      </FormSection>

      <FormSection
        icon={MapPin}
        title="Location"
        description="Enter PIN — city & state auto-fill from India Post."
        tone="location"
        contentClassName="sm:grid-cols-2"
      >
        <Input
          label="PIN Code"
          value={form.pinCode}
          onChange={(e) => handlePinChange(e.target.value)}
          placeholder="e.g. 560001"
          inputMode="numeric"
          autoComplete="postal-code"
          helperText={pinLookingUp ? "Looking up city & state…" : undefined}
        />
        <Input
          label="City"
          value={form.city}
          onChange={(e) => update("city", e.target.value)}
          placeholder="Auto-filled from PIN"
        />
        <Input
          label="State"
          value={form.state}
          onChange={(e) => update("state", e.target.value)}
          placeholder="Auto-filled from PIN"
          containerClassName="sm:col-span-2"
        />
        <div className="sm:col-span-2">
          <Label htmlFor="outlet-address">Address</Label>
          <textarea
            id="outlet-address"
            value={form.address}
            onChange={(e) => update("address", e.target.value)}
            placeholder="Street, area, landmark"
            rows={3}
            className={cn(
              "w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm",
              "placeholder:text-[var(--color-text-muted)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-1",
            )}
          />
        </div>
      </FormSection>

      <FormSection
        icon={SlidersHorizontal}
        title="Status"
        description="Control whether this outlet is live."
        tone="status"
        contentClassName="sm:grid-cols-1"
      >
        <div className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5">
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--color-heading)]">
              Active outlet
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              Outlet is active and visible.
            </p>
          </div>
          <ActiveSwitch
            checked={form.isActive}
            onCheckedChange={(next) => update("isActive", next)}
          />
        </div>
      </FormSection>

      <div className="flex justify-end gap-2 pt-1">
        <Button
          type="button"
          variant="secondary"
          onClick={() => onOpenChange(false)}
        >
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {isEdit ? "Save changes" : "Save Outlet"}
        </Button>
      </div>
    </form>
  );
}
