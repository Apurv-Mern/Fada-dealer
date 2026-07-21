"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Mail } from "lucide-react";

import { Button, Input } from "@/components/ui";
import { AuthCard } from "@/features/auth/components/auth-card";
import { routes } from "@/config/navigation";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) {
      setError("Enter a valid email address");
      return;
    }
    setError(undefined);
    setIsLoading(true);
    // Placeholder: trigger reset email via API later.
    setTimeout(() => {
      setIsLoading(false);
      setSent(true);
    }, 600);
  }

  if (sent) {
    return (
      <AuthCard
        title="Check your email"
        description={`We've sent a password reset link to ${email}.`}
      >
        <div className="flex flex-col items-center gap-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center">
          <span className="inline-flex size-12 items-center justify-center rounded-full bg-[var(--color-success-soft)] text-[var(--color-success)]">
            <CheckCircle2 className="size-6" />
          </span>
          <p className="text-sm text-[var(--color-text-muted)]">
            Didn&apos;t receive the email? Check your spam folder or try again.
          </p>
          <Button
            variant="outline"
            fullWidth
            onClick={() => {
              setSent(false);
              setEmail("");
            }}
          >
            Try another email
          </Button>
        </div>

        <div className="mt-6 text-center">
          <Link
            href={routes.login}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-primary)] hover:underline"
          >
            <ArrowLeft className="size-4" />
            Back to login
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Forgot password?"
      description="Enter your email and we'll send you a reset link."
      footer={
        <Link
          href={routes.login}
          className="inline-flex items-center gap-1.5 font-medium text-[var(--color-primary)] hover:underline"
        >
          <ArrowLeft className="size-4" />
          Back to login
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          label="Email address"
          type="email"
          placeholder="dealer@example.com"
          leftAddon={<Mail />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={error}
          required
        />
        <Button type="submit" fullWidth isLoading={isLoading}>
          Send reset link
        </Button>
      </form>
    </AuthCard>
  );
}
