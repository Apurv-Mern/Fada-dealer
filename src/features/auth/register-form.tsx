"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Mail, Phone, User } from "lucide-react";

import {
  Button,
  Checkbox,
  Input,
  PasswordInput,
  Select,
} from "@/components/ui";
import { AuthCard } from "@/features/auth/components/auth-card";
import { routes } from "@/config/navigation";

type FormState = {
  dealershipName: string;
  oem: string;
  membershipCode: string;
  contactName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
};

const initialState: FormState = {
  dealershipName: "",
  oem: "",
  membershipCode: "",
  contactName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  acceptTerms: false,
};

export function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>(
    {},
  );
  const [isLoading, setIsLoading] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (!form.dealershipName.trim())
      next.dealershipName = "Dealership name is required";
    if (!form.contactName.trim())
      next.contactName = "Authorized user name is required";
    if (!form.email.includes("@")) next.email = "Enter a valid email address";
    if (form.phone.replace(/\D/g, "").length < 10)
      next.phone = "Enter a valid mobile number";
    if (form.password.length < 6)
      next.password = "Password must be at least 6 characters";
    if (form.confirmPassword !== form.password)
      next.confirmPassword = "Passwords do not match";
    if (!form.acceptTerms)
      next.acceptTerms = "You must accept the terms to continue";

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setIsLoading(true);
    // Placeholder: submit pending dealer registration to API later.
    setTimeout(() => {
      setIsLoading(false);
      router.push(routes.login);
    }, 600);
  }

  return (
    <AuthCard
      title="Register your dealership"
      description="Submit your details for FADA approval and activation."
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
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          label="Dealership name"
          placeholder="e.g. Sharma Motors Pvt Ltd"
          leftAddon={<Building2 />}
          value={form.dealershipName}
          onChange={(e) => update("dealershipName", e.target.value)}
          error={errors.dealershipName}
          required
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            aria-label="OEM"
            placeholder="Select OEM (optional)"
            options={[
              { label: "Maruti Suzuki", value: "maruti" },
              { label: "Hyundai", value: "hyundai" },
              { label: "Tata Motors", value: "tata" },
              { label: "Mahindra", value: "mahindra" },
              { label: "BYD", value: "byd" },
            ]}
            value={form.oem}
            onChange={(value) => update("oem", value)}
            className="w-full"
          />
          <Input
            placeholder="FADA membership code (optional)"
            aria-label="FADA membership code"
            value={form.membershipCode}
            onChange={(e) => update("membershipCode", e.target.value)}
          />
        </div>

        <Input
          label="Authorized user name"
          placeholder="Full name"
          leftAddon={<User />}
          value={form.contactName}
          onChange={(e) => update("contactName", e.target.value)}
          error={errors.contactName}
          required
        />

        <div className="grid gap-4 sm:grid-cols-2">
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
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <PasswordInput
            label="Password"
            placeholder="Create password"
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            error={errors.password}
            required
          />
          <PasswordInput
            label="Confirm password"
            placeholder="Re-enter password"
            value={form.confirmPassword}
            onChange={(e) => update("confirmPassword", e.target.value)}
            error={errors.confirmPassword}
            required
          />
        </div>

        <Checkbox
          label={
            <>
              I accept the{" "}
              <Link href="#" className="text-[var(--color-primary)] hover:underline">
                Terms &amp; Conditions
              </Link>{" "}
              and{" "}
              <Link href="#" className="text-[var(--color-primary)] hover:underline">
                Privacy Policy
              </Link>
            </>
          }
          checked={form.acceptTerms}
          onChange={(e) => update("acceptTerms", e.target.checked)}
          error={errors.acceptTerms}
        />

        <Button type="submit" fullWidth isLoading={isLoading}>
          Submit registration
        </Button>
      </form>
    </AuthCard>
  );
}
