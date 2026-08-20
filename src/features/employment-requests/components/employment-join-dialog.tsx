"use client";

import { useEffect, useMemo, useState } from "react";
import { Check } from "lucide-react";

import { SectionError } from "@/components/layout/section-error";
import { Badge, Button, Dialog, Skeleton, toast } from "@/components/ui";
import { toAuthErrorMessage } from "@/features/auth/client-auth";
import {
  advanceInvitationStatus,
  getInvitationDetail,
  getInvitationSteps,
} from "@/features/employment-requests/api";
import { requestStatusBadge } from "@/features/employment-requests/components/employment-requests-table";
import {
  isJoinInvitationStatus,
  nextJoinInvitationStatus,
  normalizeJoinStepStatus,
  type JoinInvitationStatus,
} from "@/features/employment-requests/joining-steps";
import type {
  EmploymentRequest,
  InvitationDetail,
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

function joinStepSuccessMessage(status: JoinInvitationStatus): string {
  switch (status) {
    case "joining_confirmed":
      return "Joining confirmed";
    case "employer_verification":
      return "Employer verification completed";
    case "share_details":
      return "Details shared step completed";
    case "accept_invitation":
      return "Invitation acceptance recorded";
    case "send_invitation":
      return "Invitation step updated";
    default:
      return "Join step updated";
  }
}

function historyLabel(status: string, steps: LeavingStep[]): string {
  const normalized = normalizeJoinStepStatus(status);
  const match = steps.find(
    (step) => normalizeJoinStepStatus(step.status) === normalized,
  );
  if (match?.title) return match.title;
  if (normalized === "accepted") return "Accepted";
  if (normalized === "rejected") return "Rejected";
  if (normalized === "pending") return "Pending";
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function EmploymentJoinDialog({
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
      title="Join request"
      description={request ? request.employeeName : undefined}
      className="max-w-lg"
    >
      {open && request && request.requestType === "Join" ? (
        <JoinDialogBody
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

function JoinDialogBody({
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
  const [detail, setDetail] = useState<InvitationDetail | null>(null);
  const [steps, setSteps] = useState<LeavingStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [advancing, setAdvancing] = useState<JoinInvitationStatus | null>(
    null,
  );
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([getInvitationDetail(request.id), getInvitationSteps()])
      .then(([nextDetail, nextSteps]) => {
        if (cancelled) return;
        setDetail(nextDetail);
        setSteps(nextSteps);
        setError(null);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(toAuthErrorMessage(err, "Couldn't load join request"));
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [request.id, reloadToken]);

  const row = detail ?? request;
  const completed = detail?.completedSteps ?? request.completedSteps ?? [];
  const nextStep = nextJoinInvitationStatus(completed);
  const canAdvance = Boolean(detail?.canAdvanceWorkflow && nextStep);
  const completedCount = useMemo(
    () =>
      steps.filter((step) =>
        completed.includes(normalizeJoinStepStatus(step.status)),
      ).length,
    [steps, completed],
  );
  const progressPct =
    steps.length === 0 ? 0 : Math.round((completedCount / steps.length) * 100);

  async function handleAdvance(status: JoinInvitationStatus) {
    if (!detail) return;
    setAdvancing(status);
    try {
      await advanceInvitationStatus(detail, status);
      toast.success(joinStepSuccessMessage(status));
      const [nextDetail, nextSteps] = await Promise.all([
        getInvitationDetail(detail.id),
        getInvitationSteps(),
      ]);
      setDetail(nextDetail);
      setSteps(nextSteps);
      setError(null);
      onAdvanced?.();
    } catch (err) {
      setError(toAuthErrorMessage(err, "Failed to update join step"));
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
        title="Couldn't load join request"
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
        <DetailRow label="Mobile" value={row.mobile} />
        <DetailRow label="Branch" value={row.branchName || row.fromTo} />
        <DetailRow label="Department" value={row.departmentName} />
        <DetailRow label="Designation" value={row.designationName} />
        <DetailRow label="Requested" value={row.requestedAt} />
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

      {row.status !== "Rejected" && steps.length > 0 ? (
        <div className="space-y-3">
          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs text-[var(--color-text-muted)]">
              <span>
                {completedCount} of {steps.length} steps complete
              </span>
              <span>{progressPct}%</span>
            </div>
            <div
              className="h-1.5 overflow-hidden rounded-full bg-[var(--color-muted)]"
              role="progressbar"
              aria-valuenow={progressPct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Join onboarding progress"
            >
              <div
                className="h-full rounded-full bg-[var(--color-success)] transition-[width]"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
          <ol className="space-y-3">
            {steps.map((step) => {
              const normalizedStatus = normalizeJoinStepStatus(step.status);
              const isActionable = isJoinInvitationStatus(normalizedStatus);
              const done = completed.includes(normalizedStatus);
              const isNext = Boolean(
                canAdvance && isActionable && normalizedStatus === nextStep,
              );
              const isFuture = !done && !isNext;
              return (
                <li
                  key={step.id}
                  className={cn(
                    "rounded-[var(--radius-md)] border p-3 transition-colors",
                    isNext
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                      : "border-[var(--color-border)]",
                    isFuture && "opacity-70",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 text-sm font-semibold text-[var(--color-heading)]">
                        <span
                          className={cn(
                            "flex size-5 shrink-0 items-center justify-center rounded-full",
                            done
                              ? "bg-[var(--color-success)] text-white"
                              : isNext
                                ? "border border-[var(--color-primary)] bg-white text-[var(--color-primary)]"
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
        </div>
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
                <span className="min-w-0 break-words">
                  {historyLabel(item.status, steps)}
                </span>
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
