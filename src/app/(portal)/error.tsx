"use client";

import { useEffect } from "react";

import { SectionError } from "@/components/layout/section-error";
import { messageFromApiError } from "@/lib/api/errors";

export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <SectionError
      title="Something went wrong"
      description={messageFromApiError(error)}
      onRetry={reset}
    />
  );
}
