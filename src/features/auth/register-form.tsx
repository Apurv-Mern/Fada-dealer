"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Hash, Mail, Phone } from "lucide-react";

import { Button, Input, PasswordInput, toast } from "@/components/ui";
import { AuthCard } from "@/features/auth/components/auth-card";
import {
  dealerRegister,
  dealerVerifyRegistrationOtp,
  toAuthErrorMessage,
} from "@/features/auth/client-auth";
import { otpSchema, registerSchema } from "@/features/auth/schemas";
import { routes } from "@/config/navigation";

type RegisterFormState = {
  name: string;
  dealerCode: string;
  email: string;
  password: string;
  phone: string;
};

type OtpFormState = {
  otp: string;
};

const initialRegister: RegisterFormState = {
  name: "",
  dealerCode: "",
  email: "",
  password: "",
  phone: "",
};

export function RegisterForm() {
  const router = useRouter();
  const [step, setStep] = useState<"details" | "otp">("details");
  const [form, setForm] = useState<RegisterFormState>(initialRegister);
  const [otpForm, setOtpForm] = useState<OtpFormState>({ otp: "" });
  const [errors, setErrors] = useState<
    Partial<Record<keyof RegisterFormState | "otp", string>>
  >({});
  const [isLoading, setIsLoading] = useState(false);

  function update<K extends keyof RegisterFormState>(
    key: K,
    value: RegisterFormState[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    const parsed = registerSchema.safeParse(form);

    if (!parsed.success) {
      const next: typeof errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string") {
          next[key as keyof RegisterFormState] = issue.message;
        }
      }
      setErrors(next);
      return;
    }
    setErrors({});
    setIsLoading(true);

    try {
      const message = await dealerRegister(parsed.data);
      toast.success(message);
      setStep("otp");
    } catch (err) {
      toast.error(toAuthErrorMessage(err, "Registration failed"));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    const parsed = otpSchema.safeParse({
      email: form.email,
      otp: otpForm.otp,
    });

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
    setErrors({});
    setIsLoading(true);

    try {
      const message = await dealerVerifyRegistrationOtp(parsed.data);
      toast.success(message);
      router.push(routes.login);
    } catch (err) {
      toast.error(toAuthErrorMessage(err, "OTP verification failed"));
    } finally {
      setIsLoading(false);
    }
  }

  if (step === "otp") {
    return (
      <AuthCard
        title="Verify your email"
        description={`Enter the OTP sent to ${form.email}`}
        footer={
          <button
            type="button"
            className="font-semibold text-[var(--color-primary)] hover:underline"
            onClick={() => {
              setStep("details");
              setOtpForm({ otp: "" });
              setErrors({});
            }}
          >
            Back to registration
          </button>
        }
      >
        <form onSubmit={handleVerifyOtp} className="space-y-4" noValidate>
          <Input
            label="OTP"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="Enter OTP"
            value={otpForm.otp}
            onChange={(e) => setOtpForm({ otp: e.target.value })}
            error={errors.otp}
            required
          />
          <Button type="submit" fullWidth isLoading={isLoading}>
            Verify OTP
          </Button>
        </form>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Register your company"
      description="We will send an OTP to verify your email."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href={routes.login}
            className="font-semibold text-[var(--color-primary)] hover:underline"
          >
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleRegister} className="space-y-4" noValidate>
        <Input
          label="Company name"
          placeholder="e.g. Sharma Motors Pvt Ltd"
          leftAddon={<Building2 />}
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          error={errors.name}
          required
        />
        <Input
          label="Company code"
          placeholder="Your company / membership code"
          helperText="Optional — your company or membership code"
          leftAddon={<Hash />}
          value={form.dealerCode}
          onChange={(e) => update("dealerCode", e.target.value)}
          error={errors.dealerCode}
        />
        <Input
          label="Email address"
          type="email"
          placeholder="dealer@example.com"
          leftAddon={<Mail />}
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          error={errors.email}
          required
        />
        <PasswordInput
          label="Password"
          placeholder="Create a password"
          value={form.password}
          onChange={(e) => update("password", e.target.value)}
          error={errors.password}
          required
        />
        <Input
          label="Mobile number"
          type="tel"
          placeholder="10-digit mobile"
          leftAddon={<Phone />}
          value={form.phone}
          onChange={(e) => update("phone", e.target.value)}
          error={errors.phone}
          required
        />
        <Button type="submit" fullWidth isLoading={isLoading}>
          Send OTP
        </Button>
      </form>
    </AuthCard>
  );
}
