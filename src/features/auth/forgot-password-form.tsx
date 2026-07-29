"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail } from "lucide-react";

import { Button, Input, PasswordInput, toast } from "@/components/ui";
import { AuthCard } from "@/features/auth/components/auth-card";
import {
  dealerForgotPassword,
  dealerResetPassword,
  dealerVerifyForgotPasswordOtp,
  toAuthErrorMessage,
} from "@/features/auth/client-auth";
import {
  forgotPasswordOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/features/auth/schemas";
import { routes } from "@/config/navigation";
import { isUnauthorizedError } from "@/lib/api/errors";

type Step = "email" | "otp" | "reset";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{
    email?: string;
    otp?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  function clearFieldErrors() {
    setErrors({});
  }

  function goToEmailStep() {
    setStep("email");
    setOtp("");
    setResetToken("");
    setNewPassword("");
    setConfirmPassword("");
    clearFieldErrors();
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      setErrors({
        email: parsed.error.issues[0]?.message ?? "Enter a valid email address",
      });
      return;
    }
    clearFieldErrors();
    setIsLoading(true);

    try {
      const message = await dealerForgotPassword(parsed.data.email);
      toast.success(message);
      setOtp("");
      setResetToken("");
      setStep("otp");
    } catch (err) {
      toast.error(toAuthErrorMessage(err, "Network error. Please try again."));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResendOtp() {
    clearFieldErrors();
    setIsResending(true);
    try {
      const message = await dealerForgotPassword(email);
      toast.success(message);
    } catch (err) {
      toast.error(toAuthErrorMessage(err, "Could not resend OTP."));
    } finally {
      setIsResending(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    const parsed = forgotPasswordOtpSchema.safeParse({ email, otp });
    if (!parsed.success) {
      const next: typeof errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (key === "otp" || key === "email") {
          next[key] = issue.message;
        }
      }
      setErrors(next);
      return;
    }
    clearFieldErrors();
    setIsLoading(true);

    try {
      const token = await dealerVerifyForgotPasswordOtp(parsed.data);
      setResetToken(token);
      setNewPassword("");
      setConfirmPassword("");
      setStep("reset");
    } catch (err) {
      toast.error(toAuthErrorMessage(err, "OTP verification failed"));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    const parsed = resetPasswordSchema.safeParse({
      newPassword,
      confirmPassword,
    });
    if (!parsed.success) {
      const next: typeof errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (key === "newPassword" || key === "confirmPassword") {
          next[key] = issue.message;
        }
      }
      setErrors(next);
      return;
    }
    clearFieldErrors();
    setIsLoading(true);

    try {
      const message = await dealerResetPassword({
        resetToken,
        newPassword: parsed.data.newPassword,
        confirmPassword: parsed.data.confirmPassword,
      });
      toast.success(message);
      router.push(routes.login);
    } catch (err) {
      toast.error(toAuthErrorMessage(err, "Could not reset password"));
      if (isUnauthorizedError(err)) {
        setOtp("");
        setResetToken("");
        setNewPassword("");
        setConfirmPassword("");
        setStep("otp");
      }
    } finally {
      setIsLoading(false);
    }
  }

  if (step === "otp") {
    return (
      <AuthCard
        title="Enter OTP"
        description={`Enter the 6-digit OTP sent to ${email}`}
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
        <form onSubmit={handleVerifyOtp} className="space-y-4" noValidate>
          <Input
            label="OTP"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            error={errors.otp}
            required
          />
          <Button type="submit" fullWidth isLoading={isLoading}>
            Verify OTP
          </Button>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              isLoading={isResending}
              onClick={handleResendOtp}
            >
              Resend OTP
            </Button>
            <button
              type="button"
              className="text-sm font-medium text-[var(--color-primary)] hover:underline"
              onClick={goToEmailStep}
            >
              Try another email
            </button>
          </div>
        </form>
      </AuthCard>
    );
  }

  if (step === "reset") {
    return (
      <AuthCard
        title="Create new password"
        description="Choose a new password for your account."
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
        <form onSubmit={handleResetPassword} className="space-y-4" noValidate>
          <PasswordInput
            label="New password"
            placeholder="At least 6 characters"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            error={errors.newPassword}
            required
          />
          <PasswordInput
            label="Confirm password"
            placeholder="Re-enter your new password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={errors.confirmPassword}
            required
          />
          <Button type="submit" fullWidth isLoading={isLoading}>
            Reset password
          </Button>
        </form>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Forgot password?"
      description="Enter your email and we'll send a 6-digit OTP."
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
      <form onSubmit={handleSendOtp} className="space-y-4" noValidate>
        <Input
          label="Email address"
          type="email"
          placeholder="dealer@example.com"
          leftAddon={<Mail />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          required
        />
        <Button type="submit" fullWidth isLoading={isLoading}>
          Send OTP
        </Button>
      </form>
    </AuthCard>
  );
}
