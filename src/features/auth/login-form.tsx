"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";

import {
  Button,
  Checkbox,
  Input,
  PasswordInput,
} from "@/components/ui";
import { AuthCard } from "@/features/auth/components/auth-card";
import { routes } from "@/config/navigation";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );
  const [isLoading, setIsLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors: typeof errors = {};
    if (!email.includes("@")) nextErrors.email = "Enter a valid email address";
    if (password.length < 6)
      nextErrors.password = "Password must be at least 6 characters";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsLoading(true);
    // Placeholder: wire to auth API later.
    setTimeout(() => {
      setIsLoading(false);
      router.push(routes.branches);
    }, 600);
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
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
    </AuthCard>
  );
}
