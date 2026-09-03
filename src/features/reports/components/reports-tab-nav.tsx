"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui";

export type ReportsTabNavProps = {
  onPrev?: () => void;
  onNext?: () => void;
  canPrev?: boolean;
  canNext?: boolean;
};

export function ReportsTabNav({
  onPrev,
  onNext,
  canPrev = false,
  canNext = false,
}: ReportsTabNavProps) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        aria-label="Previous report"
        disabled={!canPrev}
        onClick={onPrev}
      >
        <ChevronLeft className="size-4" aria-hidden />
        Prev
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        aria-label="Next report"
        disabled={!canNext}
        onClick={onNext}
      >
        Next
        <ChevronRight className="size-4" aria-hidden />
      </Button>
    </div>
  );
}
