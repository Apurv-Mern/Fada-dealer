"use client";

import { useRef, useState } from "react";
import { Download, FileText, Plus, Trash2 } from "lucide-react";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  buttonVariants,
  toast,
} from "@/components/ui";
import {
  deleteBusinessDocument,
  uploadBusinessDocument,
} from "@/features/dealership/api";
import type { BusinessDocument } from "@/features/dealership/types";
import { displayValue } from "@/features/dealership/types";
import { toAuthErrorMessage } from "@/features/auth/client-auth";
import { cn } from "@/lib/utils/cn";

function formatUploadedOn(value: string) {
  const raw = displayValue(value);
  if (!raw) return "";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function DealershipDocumentsSection({
  documents,
  onChanged,
}: {
  documents: BusinessDocument[];
  onChanged?: () => void;
}) {
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<BusinessDocument | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingDocId = useRef<string | null>(null);
  const listRef = useRef<HTMLUListElement>(null);

  function pickFile(documentId: string) {
    pendingDocId.current = documentId;
    inputRef.current?.click();
  }

  function uploadFirstMissing() {
    const target =
      documents.find((d) => !d.isUploaded) ?? documents[0] ?? null;
    if (!target) {
      toast.message("No document slots available to upload.");
      return;
    }
    pickFile(target.id);
  }

  async function confirmDelete() {
    const uploadId = pendingDelete?.upload?.id;
    if (!uploadId) return;
    setDeleting(true);
    try {
      await deleteBusinessDocument(uploadId);
      toast.success("Document removed");
      setPendingDelete(null);
      onChanged?.();
    } catch (err) {
      toast.error(toAuthErrorMessage(err, "Failed to delete document"));
    } finally {
      setDeleting(false);
    }
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const documentId = pendingDocId.current;
    e.target.value = "";
    pendingDocId.current = null;
    if (!file || !documentId) return;

    setUploadingId(documentId);
    try {
      await uploadBusinessDocument(documentId, file);
      toast.success("Document uploaded");
      onChanged?.();
    } catch (err) {
      toast.error(toAuthErrorMessage(err, "Failed to upload document"));
    } finally {
      setUploadingId(null);
    }
  }

  return (
    <Card className="flex min-h-0 flex-col">
      <CardHeader>
        <CardTitle>Business Documents</CardTitle>
        <button
          type="button"
          onClick={() => listRef.current?.scrollIntoView({ behavior: "smooth" })}
          className={cn(
            buttonVariants({ variant: "link", size: "sm" }),
            "h-auto p-0",
          )}
        >
          View All
        </button>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={onFileChange}
        />

        {documents.length === 0 ? (
          <p className="flex flex-1 items-center justify-center py-8 text-center text-sm text-[var(--color-text-muted)]">
            No documents found.
          </p>
        ) : (
          <ul
            ref={listRef}
            className="min-h-0 flex-1 space-y-3 overflow-y-auto"
          >
            {documents.map((doc) => {
              const uploadedOn = formatUploadedOn(doc.upload?.uploadedAt ?? "");
              const verified =
                doc.upload?.isVerified || doc.upload?.status === "approved";
              return (
                <li
                  key={doc.id}
                  className="flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2.5"
                >
                  <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-red-50 text-[var(--color-danger)]">
                    <FileText className="size-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[var(--color-heading)]">
                      {displayValue(doc.name)}
                      {doc.isMandatory ? (
                        <span className="text-[var(--color-danger)]"> *</span>
                      ) : null}
                    </p>
                    <p className="mt-0.5 min-h-4 text-xs text-[var(--color-text-muted)]">
                      {uploadedOn ? `Uploaded on ${uploadedOn}` : ""}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {doc.isUploaded ? (
                        <Badge variant={verified ? "success" : "warning"}>
                          {verified
                            ? "Verified"
                            : displayValue(doc.upload?.status) || "Uploaded"}
                        </Badge>
                      ) : (
                        <Badge variant="muted">Not uploaded</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {doc.upload?.documentUrl ? (
                      <a
                        href={doc.upload.documentUrl}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Download ${doc.name}`}
                        className={cn(
                          buttonVariants({ variant: "ghost", size: "icon" }),
                        )}
                      >
                        <Download className="size-4" />
                      </a>
                    ) : null}
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={
                        doc.isUploaded
                          ? `Replace ${doc.name}`
                          : `Upload ${doc.name}`
                      }
                      isLoading={uploadingId === doc.id}
                      onClick={() => pickFile(doc.id)}
                    >
                      <Plus />
                    </Button>
                    {doc.upload?.id ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Delete ${doc.name}`}
                        onClick={() => setPendingDelete(doc)}
                      >
                        <Trash2 />
                      </Button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <Button
          variant="secondary"
          fullWidth
          className="mt-auto border-[var(--color-primary-soft)] bg-[var(--color-primary-soft)] text-[var(--color-primary)] hover:bg-[var(--color-primary-soft)]"
          onClick={uploadFirstMissing}
        >
          <Plus />
          Upload New Document
        </Button>
      </CardContent>

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(next) => {
          if (!next) setPendingDelete(null);
        }}
        description={
          pendingDelete
            ? `Remove uploaded “${pendingDelete.name}”? This cannot be undone.`
            : undefined
        }
        isLoading={deleting}
        onConfirm={confirmDelete}
      />
    </Card>
  );
}
