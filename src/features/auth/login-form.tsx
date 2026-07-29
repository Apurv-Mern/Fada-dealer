"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail } from "lucide-react";

import {
  Button,
  Checkbox,
  Input,
  PasswordInput,
  toast,
} from "@/components/ui";
import { AuthCard } from "@/features/auth/components/auth-card";
import {
  dealerLogin,
  dealerSendLoginOtp,
  dealerVerifyLoginOtp,
  toAuthErrorMessage,
} from "@/features/auth/client-auth";
import {
  loginOtpRequestSchema,
  loginSchema,
  otpSchema,
} from "@/features/auth/schemas";
import { routes } from "@/config/navigation";

type LoginMode = "password" | "otp";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<LoginMode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    otp?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get("reason") === "session") {
      toast.error("Session expired. Please sign in again.");
    }
  }, [searchParams]);

  function goToPortal() {
    const next = searchParams.get("next");
    router.replace(next && next.startsWith("/") ? next : routes.branches);
  }

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const nextErrors: typeof errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (key === "email" || key === "password") {
          nextErrors[key] = issue.message;
        }
      }
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    setIsLoading(true);

    try {
      const result = await dealerLogin(parsed.data);
      if (result.kind === "needs_email_otp") {
        try {
          const message = await dealerSendLoginOtp(parsed.data.email);
          toast.success(message);
          setPassword("");
          setOtp("");
          setMode("otp");
          setOtpSent(true);
        } catch (err) {
          toast.error(toAuthErrorMessage(err, "Failed to send OTP"));
        }
        return;
      }
      goToPortal();
    } catch (err) {
      toast.error(toAuthErrorMessage(err, "Login failed"));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    const parsed = loginOtpRequestSchema.safeParse({ email });
    if (!parsed.success) {
      const nextErrors: typeof errors = {};
      for (const issue of parsed.error.issues) {
        if (issue.path[0] === "email") nextErrors.email = issue.message;
      }
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    setIsLoading(true);

    try {
      const message = await dealerSendLoginOtp(parsed.data.email);
      toast.success(message);
      setOtpSent(true);
    } catch (err) {
      toast.error(toAuthErrorMessage(err, "Failed to send OTP"));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    const parsed = otpSchema.safeParse({ email, otp });
    if (!parsed.success) {
      const nextErrors: typeof errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (key === "email" || key === "otp") {
          nextErrors[key] = issue.message;
        }
      }
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    setIsLoading(true);

    try {
      await dealerVerifyLoginOtp(parsed.data);
      goToPortal();
    } catch (err) {
      toast.error(toAuthErrorMessage(err, "OTP verification failed"));
    } finally {
      setIsLoading(false);
    }
  }

  function switchMode(next: LoginMode) {
    setMode(next);
    setErrors({});
    setOtp("");
    setOtpSent(false);
    setPassword("");
  }

  return (
    <AuthCard
      title="Welcome back"
      description="Log in to manage your dealership on FADA ID."
      footer={
        <>
          New dealership?{" "}
          <Link
            href={routes.register}
            className="font-semibold text-[var(--color-primary)] hover:underline"
          >
            Register here
          </Link>
        </>
      }
    >
      <div
        className="mb-4 grid grid-cols-2 gap-1 rounded-lg bg-[var(--color-muted)]/40 p-1"
        role="tablist"
        aria-label="Login method"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === "password"}
          className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            mode === "password"
              ? "bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm"
              : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          }`}
          onClick={() => switchMode("password")}
        >
          Password
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "otp"}
          className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            mode === "otp"
              ? "bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm"
              : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          }`}
          onClick={() => switchMode("otp")}
        >
          OTP
        </button>
      </div>

      {mode === "password" ? (
        <form onSubmit={handlePasswordLogin} className="space-y-4" noValidate>
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
          <PasswordInput
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            required
          />

          <div className="flex items-center justify-between">
            <Checkbox label="Remember me" containerClassName="w-auto" />
            <Link
              href={routes.forgotPassword}
              className="text-sm font-medium text-[var(--color-primary)] hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <Button type="submit" fullWidth isLoading={isLoading}>
            Log in
          </Button>
        </form>
      ) : (
        <form
          onSubmit={otpSent ? handleVerifyOtp : handleSendOtp}
          className="space-y-4"
          noValidate
        >
          <Input
            label="Email address"
            type="email"
            placeholder="dealer@example.com"
            leftAddon={<Mail />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            required
            disabled={otpSent}
          />
          {otpSent ? (
            <Input
              label="OTP"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              error={errors.otp}
              required
            />
          ) : null}

          <Button type="submit" fullWidth isLoading={isLoading}>
            {otpSent ? "Verify & log in" : "Send OTP"}
          </Button>

          {otpSent ? (
            <button
              type="button"
              className="w-full text-center text-sm font-medium text-[var(--color-primary)] hover:underline"
              onClick={() => {
                setOtpSent(false);
                setOtp("");
                setErrors({});
              }}
            >
              Use a different email
            </button>
          ) : null}
        </form>
      )}
    </AuthCard>
  );
}
