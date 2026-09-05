import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const loginOtpRequestSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

export type LoginOtpRequestInput = z.infer<typeof loginOtpRequestSchema>;

export const loginOtpVerifySchema = z.object({
  email: z.string().email("Enter a valid email address"),
  otp: z
    .string()
    .trim()
    .length(4, "Enter the 4-digit OTP sent to your email")
    .regex(/^\d{4}$/, "OTP must contain numbers only"),
});

export type LoginOtpVerifyInput = z.infer<typeof loginOtpVerifySchema>;

export const otpSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  otp: z
    .string()
    .trim()
    .min(4, "Enter the OTP sent to your email")
    .max(8, "Enter a valid OTP"),
});

export type OtpInput = z.infer<typeof otpSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const forgotPasswordOtpSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  otp: z
    .string()
    .trim()
    .length(6, "Enter the 6-digit OTP sent to your email"),
});

export type ForgotPasswordOtpInput = z.infer<typeof forgotPasswordOtpSchema>;

export const resetPasswordSchema = z
  .object({
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z
      .string()
      .min(6, "Password must be at least 6 characters"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/** Register body sent to POST /dealer/auth/register (includes password). */
export const registerSchema = z.object({
  name: z.string().trim().min(1, "Company name is required"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z
    .string()
    .refine(
      (v) => v.replace(/\D/g, "").length >= 10,
      "Enter a valid mobile number",
    ),
});

export type RegisterInput = z.infer<typeof registerSchema>;
