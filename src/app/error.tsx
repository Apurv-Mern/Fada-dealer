"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

import { StatusScreen } from "@/components/layout/status-screen";
import { routes } from "@/config/navigation";

export default function RootError({
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
    <StatusScreen
      icon={AlertTriangle}
      title="Something went wrong"
      description={
        error.message ||
        "An unexpected error occurred. You can try again or return to login."
      }
      primaryAction={{ label: "Try again", onClick: reset }}
      secondaryAction={{ label: "Back to login", href: routes.login }}
    />
  );
}
