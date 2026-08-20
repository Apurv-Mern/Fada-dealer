"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";

import { SectionError } from "@/components/layout/section-error";
import { Badge, Button, Dialog, Skeleton, toast } from "@/components/ui";
import { toAuthErrorMessage } from "@/features/auth/client-auth";
import {
  advanceLeavingStatus,
  getLeavingDetail,
  getLeavingSteps,
} from "@/features/employment-requests/api";
import { requestStatusBadge } from "@/features/employment-requests/components/employment-requests-table";
import {
  isLeavingExitStatus,
  nextLeavingExitStatus,
  normalizeLeavingStepStatus,
  type LeavingExitStatus,
} from "@/features/employment-requests/leaving-steps";
import type {
  EmploymentRequest,
  LeavingDetail,
  LeavingStep,
} from "@/features/employment-requests/types";
import { cn } from "@/lib/utils/cn";

function DetailRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-2 text-sm sm:grid-cols-[9rem_1fr]">
      <dt className="text-[var(--color-text-muted)]">{label}</dt>
      <dd className="min-w-0 break-words font-medium text-[var(--color-heading)]">
        {value || "—"}
      </dd>
    </div>
  );
}

export function EmploymentExitDialog({
  request,
  open,
  onOpenChange,
  onApprove,
  onReject,
  onAdvanced,
}: {
  request: EmploymentRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove?: (request: EmploymentRequest) => void;
  onReject?: (request: EmploymentRequest) => void;
  onAdvanced?: () => void;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Exit request"
      description={request ? request.employeeName : undefined}
      className="max-w-lg"
    >
      {open && request && request.requestType === "Exit" ? (
        <ExitDialogBody
          key={request.id}
          request={request}
          onApprove={onApprove}
          onReject={onReject}
          onAdvanced={onAdvanced}
        />
      ) : null}
    </Dialog>
  );
}

function ExitDialogBody({
  request,
  onApprove,
  onReject,
  onAdvanced,
}: {
  request: EmploymentRequest;
  onApprove?: (request: EmploymentRequest) => void;
  onReject?: (request: EmploymentRequest) => void;
  onAdvanced?: () => void;
}) {
  const [detail, setDetail] = useState<LeavingDetail | null>(null);
  const [steps, setSteps] = useState<LeavingStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [advancing, setAdvancing] = useState<LeavingExitStatus | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([getLeavingDetail(request.id), getLeavingSteps()])
      .then(([nextDetail, nextSteps]) => {
        if (cancelled) return;
        setDetail(nextDetail);
        setSteps(nextSteps);
        setError(null);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(toAuthErrorMessage(err, "Couldn't load exit request"));
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [request.id, reloadToken]);

  const row = detail ?? request;
  const completed = detail?.completedSteps ?? request.completedSteps ?? [];
  const nextStep = nextLeavingExitStatus(completed);
  const canAdvance = Boolean(detail?.canAdvanceWorkflow && nextStep);

  async function handleAdvance(status: LeavingExitStatus) {
    if (!detail) return;
    setAdvancing(status);
    try {
      await advanceLeavingStatus(detail, status);
      toast.success(
        status === "exit_completed"
          ? "Exit completed"
          : status === "accept_resignation"
            ? "Resignation accepted"
            : "Exit step updated",
      );
      const [nextDetail, nextSteps] = await Promise.all([
        getLeavingDetail(detail.id),
        getLeavingSteps(),
      ]);
      setDetail(nextDetail);
      setSteps(nextSteps);
      setError(null);
      onAdvanced?.();
    } catch (err) {
      setError(toAuthErrorMessage(err, "Failed to update exit step"));
    } finally {
      setAdvancing(null);
    }
  }

  if (loading && !detail) {
    return (
      <div className="space-y-3" aria-busy>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (error && !detail) {
    return (
      <SectionError
        title="Couldn't load exit request"
        description={error}
        onRetry={() => {
          setLoading(true);
          setError(null);
          setReloadToken((n) => n + 1);
        }}
        className="min-h-[12rem] py-6"
      />
    );
  }

  return (
    <div className="space-y-5">
      {error ? (
        <p className="text-sm text-[var(--color-danger)]" role="alert">
          {error}
        </p>
      ) : null}
      <dl className="space-y-3">
        <DetailRow label="Employee" value={row.employeeName} />
        <DetailRow label="FADA ID" value={row.fadaId} />
        <DetailRow label="Branch" value={row.branchName || row.fromTo} />
        <DetailRow label="Requested" value={row.requestedAt} />
        <DetailRow label="Resignation" value={row.resignationDate} />
        <DetailRow label="Last working day" value={row.lastWorkingDay} />
        <DetailRow label="Reason" value={row.reason} />
        <div className="grid grid-cols-[7.5rem_1fr] gap-2 text-sm sm:grid-cols-[9rem_1fr]">
          <dt className="text-[var(--color-text-muted)]">Status</dt>
          <dd>
            <Badge variant={requestStatusBadge[row.status]}>
              {row.status}
            </Badge>
          </dd>
        </div>
      </dl>

      {row.status === "Pending" ? (
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={() => onReject?.(row)}
          >
            Reject
          </Button>
          <Button type="button" onClick={() => onApprove?.(row)}>
            Approve
          </Button>
        </div>
      ) : null}

      {row.status !== "Rejected" ? (
        <ol className="space-y-3">
          {steps.map((step) => {
            const normalizedStatus = normalizeLeavingStepStatus(step.status);
            const isActionable = isLeavingExitStatus(normalizedStatus);
            const done = completed.includes(normalizedStatus);
            const isNext = Boolean(
              canAdvance && isActionable && normalizedStatus === nextStep,
            );
            return (
              <li
                key={step.id}
                className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-semibold text-[var(--color-heading)]">
                      <span
                        className={cn(
                          "flex size-5 shrink-0 items-center justify-center rounded-full",
                          done
                            ? "bg-[var(--color-success)] text-white"
                            : "bg-[var(--color-muted)] text-[var(--color-text-muted)]",
                        )}
                      >
                        {done ? <Check className="size-3" /> : null}
                      </span>
                      {step.title}
                    </p>
                    {step.description ? (
                      <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                        {step.description}
                      </p>
                    ) : null}
                  </div>
                  {isActionable ? (
                    <Button
                      type="button"
                      size="sm"
                      disabled={!isNext || advancing !== null}
                      isLoading={advancing === normalizedStatus}
                      onClick={() => void handleAdvance(normalizedStatus)}
                    >
                      {done ? "Done" : "Mark done"}
                    </Button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      ) : null}

      {detail?.history.length ? (
        <div>
          <p className="mb-2 text-xs font-semibold tracking-wide text-[var(--color-text-muted)] uppercase">
            History
          </p>
          <ul className="space-y-1.5 text-sm">
            {detail.history.map((item) => (
              <li
                key={item.id}
                className="flex justify-between gap-3 text-[var(--color-text-muted)]"
              >
                <span className="min-w-0 break-words">{item.status}</span>
                <span className="shrink-0">
                  {item.createdAt
                    ? new Date(item.createdAt).toISOString().slice(0, 10)
                    : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
