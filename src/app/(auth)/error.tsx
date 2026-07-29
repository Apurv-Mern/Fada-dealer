"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

import { StatusScreen } from "@/components/layout/status-screen";
import { routes } from "@/config/navigation";

export default function AuthError({
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
      className="min-h-0 bg-transparent py-0"
      icon={AlertTriangle}
      title="Something went wrong"
      description={
        error.message ||
        "We couldn’t complete that request. Try again or return to login."
      }
      primaryAction={{ label: "Try again", onClick: reset }}
      secondaryAction={{ label: "Back to login", href: routes.login }}
    />
  );
}
