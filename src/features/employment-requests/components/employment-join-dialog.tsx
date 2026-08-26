"use client";

import { useEffect, useMemo, useState } from "react";
import { Check } from "lucide-react";

import { SectionError } from "@/components/layout/section-error";
import {
  Badge,
  Button,
  Dialog,
  Input,
  Skeleton,
  toast,
} from "@/components/ui";
import { toAuthErrorMessage } from "@/features/auth/client-auth";
import {
  advanceInvitationStatus,
  getInvitationDetail,
  getInvitationSteps,
} from "@/features/employment-requests/api";
import { requestStatusBadge } from "@/features/employment-requests/components/employment-requests-table";
import {
  isEmployeeOwnedJoinStep,
  isJoinInvitationStatus,
  nextDealerJoinStatus,
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

function pickDisplayValue(primary?: string, fallback?: string): string {
  if (primary && primary !== "—") return primary;
  if (fallback && fallback !== "—") return fallback;
  return primary ?? fallback ?? "—";
}

/** Prefer list-row values when detail unwrap drops nested fields. */
function mergeEmploymentRequest(
  list: EmploymentRequest,
  detail: EmploymentRequest | null | undefined,
): EmploymentRequest {
  if (!detail) return list;
  return {
    ...list,
    ...detail,
    employeeName: pickDisplayValue(detail.employeeName, list.employeeName),
    fadaId: pickDisplayValue(detail.fadaId, list.fadaId),
    branchName: pickDisplayValue(detail.branchName, list.branchName),
    fromTo: pickDisplayValue(detail.fromTo, list.fromTo),
    requestedAt: pickDisplayValue(detail.requestedAt, list.requestedAt),
    departmentName: detail.departmentName || list.departmentName,
    designationName: detail.designationName || list.designationName,
    mobile: detail.mobile || list.mobile,
    requestedAtDateTime:
      detail.requestedAtDateTime || list.requestedAtDateTime,
    acceptedAt: detail.acceptedAt || list.acceptedAt,
    rejectedAt: detail.rejectedAt || list.rejectedAt,
  };
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

function sendInvitationTitle(byDealer: boolean): string {
  return byDealer ? "Invitation sent" : "Invitation Received";
}

function sendInvitationActorLine(
  byDealer: boolean,
  actorName: string,
  outletName?: string,
): string {
  const outlet =
    outletName && outletName !== "—" ? ` · ${outletName}` : "";
  return byDealer
    ? `Sent by ${actorName}${outlet}`
    : `Received from ${actorName}${outlet}`;
}

function rejectionLabel(byDealer: boolean): string {
  return byDealer
    ? "Invitation rejected by Employee"
    : "Invitation rejected by Dealer";
}

function stepDisplayTitle(
  step: LeavingStep,
  sendByDealer: boolean,
): string {
  const normalized = normalizeJoinStepStatus(step.status);
  if (normalized === "send_invitation") {
    return sendInvitationTitle(sendByDealer);
  }
  return step.title;
}

function stepDisplayDescription(
  step: LeavingStep,
  sendByDealer: boolean,
  actorName: string,
  outletName?: string,
): string {
  const normalized = normalizeJoinStepStatus(step.status);
  if (normalized === "send_invitation") {
    return sendInvitationActorLine(sendByDealer, actorName, outletName);
  }
  return step.description;
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
  const [joiningDateOpen, setJoiningDateOpen] = useState(false);
  const [joiningDate, setJoiningDate] = useState("");

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

  const row = mergeEmploymentRequest(request, detail);
  const completed = detail?.completedSteps ?? request.completedSteps ?? [];
  const sendByDealer = detail?.sendInvitationByDealer ?? false;
  const actorName =
    detail?.sendInvitationActorName ||
    (sendByDealer ? "Dealer" : row.employeeName) ||
    "Dealer";
  const outletName = row.branchName || row.fromTo;
  const nextStep = nextDealerJoinStatus(completed, sendByDealer);
  const currentWorkflowStep = nextJoinInvitationStatus(completed);
  const canAdvance = Boolean(detail?.canAdvanceWorkflow && nextStep);
  const isRejected = row.status === "Rejected";
  const showAcceptedAt =
    Boolean(row.acceptedAt) &&
    row.status !== "Rejected" &&
    row.status !== "Pending";
  const completedCount = useMemo(
    () =>
      steps.filter((step) =>
        completed.includes(normalizeJoinStepStatus(step.status)),
      ).length,
    [steps, completed],
  );
  const progressPct =
    steps.length === 0 ? 0 : Math.round((completedCount / steps.length) * 100);

  async function handleAdvance(
    status: JoinInvitationStatus,
    date?: string,
  ) {
    if (!detail) return;
    setAdvancing(status);
    try {
      await advanceInvitationStatus(detail, status, date);
      toast.success(joinStepSuccessMessage(status));
      setJoiningDateOpen(false);
      setJoiningDate("");
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

  function onMarkDoneClick(status: JoinInvitationStatus) {
    if (status === "joining_confirmed") {
      setJoiningDate("");
      setJoiningDateOpen(true);
      return;
    }
    void handleAdvance(status);
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
        <DetailRow label="Branch" value={outletName} />
        <DetailRow label="Department" value={row.departmentName} />
        <DetailRow label="Designation" value={row.designationName} />
        <DetailRow
          label="Requested"
          value={row.requestedAtDateTime || row.requestedAt}
        />
        {showAcceptedAt ? (
          <DetailRow label="Invitation accepted" value={row.acceptedAt} />
        ) : null}
        {isRejected ? (
          <DetailRow
            label={rejectionLabel(sendByDealer)}
            value={row.rejectedAt}
          />
        ) : null}
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

      {isRejected ? (
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
          <p className="text-sm font-semibold text-[var(--color-heading)]">
            {sendInvitationTitle(sendByDealer)}
          </p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            {sendInvitationActorLine(sendByDealer, actorName, outletName)}
          </p>
        </div>
      ) : null}

      {!isRejected && steps.length > 0 ? (
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
              const employeeOwned =
                isActionable &&
                isEmployeeOwnedJoinStep(normalizedStatus, sendByDealer);
              const isNext = Boolean(
                canAdvance && isActionable && normalizedStatus === nextStep,
              );
              const isWaitingOnEmployee =
                !done &&
                employeeOwned &&
                normalizedStatus === currentWorkflowStep;
              const isHighlighted = isNext || isWaitingOnEmployee;
              const isFuture = !done && !isHighlighted;
              const title = stepDisplayTitle(step, sendByDealer);
              const description = stepDisplayDescription(
                step,
                sendByDealer,
                actorName,
                outletName,
              );

              return (
                <li
                  key={step.id}
                  className={cn(
                    "rounded-[var(--radius-md)] border p-3 transition-colors",
                    isHighlighted
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
                              : isHighlighted
                                ? "border border-[var(--color-primary)] bg-white text-[var(--color-primary)]"
                                : "bg-[var(--color-muted)] text-[var(--color-text-muted)]",
                          )}
                        >
                          {done ? <Check className="size-3" /> : null}
                        </span>
                        {title}
                      </p>
                      {description ? (
                        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                          {description}
                        </p>
                      ) : null}
                    </div>
                    {done ? (
                      <Button type="button" size="sm" disabled>
                        Done
                      </Button>
                    ) : employeeOwned ? (
                      isWaitingOnEmployee ? (
                        <Badge variant="warning">Pending</Badge>
                      ) : null
                    ) : isActionable ? (
                      <Button
                        type="button"
                        size="sm"
                        disabled={!isNext || advancing !== null}
                        isLoading={advancing === normalizedStatus}
                        onClick={() => onMarkDoneClick(normalizedStatus)}
                      >
                        Mark done
                      </Button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      ) : null}

      <Dialog
        open={joiningDateOpen}
        onOpenChange={(open) => {
          if (advancing) return;
          setJoiningDateOpen(open);
          if (!open) setJoiningDate("");
        }}
        title="Select joining date"
        description="Choose the employee’s joining date to confirm this step."
        className="max-w-sm"
        overlayClassName="z-[60]"
      >
        <div className="space-y-4">
          <Input
            label="Joining date"
            type="date"
            value={joiningDate}
            onChange={(e) => setJoiningDate(e.target.value)}
            required
          />
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              disabled={advancing !== null}
              onClick={() => setJoiningDateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!joiningDate}
              isLoading={advancing === "joining_confirmed"}
              onClick={() =>
                void handleAdvance("joining_confirmed", joiningDate)
              }
            >
              Confirm
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
