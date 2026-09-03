"use client";

import { useRef, useState } from "react";
import { Download, Upload } from "lucide-react";

import { Button, Dialog, toast } from "@/components/ui";
import { importOutletsCsv } from "@/features/branches/api";
import {
  downloadOutletImportTemplate,
  validateOutletImportCsv,
} from "@/features/branches/csv-template";
import { downloadOutletMastersReferenceCsv } from "@/features/branches/masters-reference-csv";
import type { OutletImportResult } from "@/features/branches/types";
import { toAuthErrorMessage } from "@/features/auth/client-auth";
import { cn } from "@/lib/utils/cn";

export function BranchesImportDialog({
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
      title="Import Outlets"
      description="Upload a CSV to onboard multiple outlets at once."
      className="max-w-xl"
    >
      {open ? (
        <BranchesImportForm
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

function BranchesImportForm({
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
  const [result, setResult] = useState<OutletImportResult | null>(null);
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

  async function handleDownloadReference() {
    setReferenceLoading(true);
    try {
      const count = await downloadOutletMastersReferenceCsv();
      if (count === 0) {
        toast.message("No master data found — downloaded empty reference file");
      } else {
        toast.success("Reference downloaded");
      }
    } catch (err) {
      toast.error(
        toAuthErrorMessage(err, "Couldn't download reference"),
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

    const validationError = await validateOutletImportCsv(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsLoading(true);
    try {
      const importResult = await importOutletsCsv(file);
      setResult(importResult);

      if (importResult.failed > 0 && importResult.created > 0) {
        toast.message(
          `Imported ${importResult.created} of ${importResult.total}; ${importResult.failed} skipped`,
        );
      } else if (importResult.failed > 0) {
        toast.error(
          importResult.created === 0 && importResult.errors.some((e) => e.row > 1)
            ? `Fix ${importResult.failed} row error(s) before importing`
            : `Import skipped ${importResult.failed} of ${importResult.total} row(s)`,
        );
      } else {
        toast.success(
          `Imported ${importResult.created} outlet${importResult.created === 1 ? "" : "s"}`,
        );
      }

      if (importResult.created > 0) {
        onImported?.();
      }
    } catch (err) {
      toast.error(toAuthErrorMessage(err, "Failed to import outlets"));
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
          onClick={() => downloadOutletImportTemplate()}
        >
          <Download className="size-3.5" aria-hidden />
          Download template
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          isLoading={referenceLoading}
          onClick={() => void handleDownloadReference()}
        >
          <Download className="size-3.5" aria-hidden />
          Download reference
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
          Columns: name, brandName, outletFunctions, manager, pincode, city,
          state, address
        </p>
        <p>
          Required per row: name, brandName, outletFunctions (pipe-separated,
          e.g. Sales|Service). Use Download reference for brand and function
          names.
        </p>
      </div>

      {result ? (
        <div className="space-y-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-muted)] p-3 text-sm">
          <p className="font-medium text-[var(--color-heading)]">
            {result.created} imported · {result.failed} skipped · {result.total}{" "}
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
