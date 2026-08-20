import { describe, expect, it } from "vitest";

import {
  loginOtpVerifySchema,
  registerSchema,
} from "@/features/auth/schemas";

describe("loginOtpVerifySchema", () => {
  const valid = {
    email: "dealer@example.com",
    otp: "1234",
  };

  it("accepts a 4-digit numeric OTP", () => {
    expect(loginOtpVerifySchema.safeParse(valid).success).toBe(true);
  });

  it("rejects OTP shorter than 4 digits", () => {
    expect(
      loginOtpVerifySchema.safeParse({ ...valid, otp: "12" }).success,
    ).toBe(false);
  });

  it("rejects OTP longer than 4 digits", () => {
    expect(
      loginOtpVerifySchema.safeParse({ ...valid, otp: "12345" }).success,
    ).toBe(false);
  });

  it("rejects non-numeric OTP", () => {
    expect(
      loginOtpVerifySchema.safeParse({ ...valid, otp: "12ab" }).success,
    ).toBe(false);
  });
});

describe("registerSchema", () => {
  const valid = {
    name: "Sharma Motors",
    dealerCode: "DLR-001",
    email: "dealer@example.com",
    password: "secret1",
    phone: "9876543210",
  };

  it("accepts registration with dealer code", () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts registration without dealer code", () => {
    expect(
      registerSchema.safeParse({ ...valid, dealerCode: "" }).success,
    ).toBe(true);
  });
});
