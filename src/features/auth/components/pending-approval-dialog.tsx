"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { routes } from "@/config/navigation";
import type { DealerAccountStatus } from "@/features/dealership/status";
import {
  portalLockMessage,
  portalLockTitle,
} from "@/features/dealership/status";

export type PendingApprovalDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status: DealerAccountStatus;
};

export function PendingApprovalDialog({
  open,
  onOpenChange,
  status,
}: PendingApprovalDialogProps) {
  const router = useRouter();

  function goToProfile() {
    onOpenChange(false);
    router.push(routes.dealership);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={portalLockTitle(status)}
      description={portalLockMessage(status)}
    >
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={() => onOpenChange(false)}>
          Close
        </Button>
        <Button variant="primary" onClick={goToProfile}>
          Go to Company Profile
        </Button>
      </div>
    </Dialog>
  );
}
