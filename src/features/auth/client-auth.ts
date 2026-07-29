import {
  extractIsEmailVerified,
  extractTokensFromAuthBody,
  sessionFromAuthBody,
  type SessionPayload,
} from "@/features/auth/auth-utils";
import {
  clearTokens,
  getAccessToken,
  setSession,
} from "@/features/auth/token-store";
import {
  apiFetch,
  bearerAuthHeader,
  getApiBaseUrl,
  isRealDealerAuthEnabled,
} from "@/lib/api";
import { ApiError } from "@/lib/api/errors";
import type { AuthTokenResponse } from "@/types/api";

export { isRealDealerAuthEnabled };

export type DealerLoginResult =
  | { kind: "authenticated" }
  | { kind: "needs_email_otp"; email: string; message?: string };

function messageFromUnknown(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

function establishLocalSession(profile: SessionPayload, accessToken: string) {
  setSession({ accessToken, profile });
}

/** Persist tokens + profile in sessionStorage after a successful auth response. */
export async function completeDealerLogin(
  body: AuthTokenResponse,
  fallbackEmail: string,
): Promise<void> {
  const tokens = extractTokensFromAuthBody(body);
  if (!tokens.accessToken) {
    throw new Error(body.message ?? "Login succeeded but no token returned");
  }
  setSession({
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    profile: sessionFromAuthBody(body, fallbackEmail),
  });
}

function mockLoginSession(email: string) {
  establishLocalSession(
    {
      email,
      name: "Rajesh Sharma",
      role: "Dealer Admin",
    },
    "mock-access-token",
  );
}

export async function dealerLogin(input: {
  email: string;
  password: string;
}): Promise<DealerLoginResult> {
  if (!isRealDealerAuthEnabled()) {
    mockLoginSession(input.email);
    return { kind: "authenticated" };
  }

  const body = await apiFetch<AuthTokenResponse>("/dealer/auth/login", {
    method: "POST",
    body: input,
    skipAuth: true,
  });

  if (extractIsEmailVerified(body) === false) {
    return {
      kind: "needs_email_otp",
      email: input.email,
      message: body.message,
    };
  }

  await completeDealerLogin(body, input.email);
  return { kind: "authenticated" };
}

export async function dealerSendLoginOtp(email: string): Promise<string> {
  if (!isRealDealerAuthEnabled()) {
    return "OTP sent (mock)";
  }

  const body = await apiFetch<{ message?: string }>("/dealer/auth/login-otp", {
    method: "POST",
    body: { email },
    skipAuth: true,
  });
  return body.message ?? "OTP sent";
}

export async function dealerVerifyLoginOtp(input: {
  email: string;
  otp: string;
}): Promise<void> {
  if (!isRealDealerAuthEnabled()) {
    mockLoginSession(input.email);
    return;
  }

  const body = await apiFetch<AuthTokenResponse>(
    "/dealer/auth/login-otp/verify",
    {
      method: "POST",
      body: input,
      skipAuth: true,
    },
  );
  await completeDealerLogin(body, input.email);
}

export async function dealerRegister(input: {
  name: string;
  dealerCode: string;
  email: string;
  password: string;
  phone: string;
}): Promise<string> {
  if (!isRealDealerAuthEnabled()) {
    return "OTP sent (mock)";
  }

  const body = await apiFetch<{ message?: string }>("/dealer/auth/register", {
    method: "POST",
    body: input,
    skipAuth: true,
  });
  return body.message ?? "OTP sent";
}

export async function dealerVerifyRegistrationOtp(input: {
  email: string;
  otp: string;
}): Promise<string> {
  if (!isRealDealerAuthEnabled()) {
    return "OTP verified (mock)";
  }

  const body = await apiFetch<{ message?: string }>("/dealer/auth/verify-otp", {
    method: "POST",
    body: input,
    skipAuth: true,
  });
  return body.message ?? "OTP verified";
}

/** Step 1: request a 6-digit OTP for password reset. */
export async function dealerForgotPassword(email: string): Promise<string> {
  if (!isRealDealerAuthEnabled()) {
    await new Promise((r) => setTimeout(r, 400));
    return "If an account exists with this email, an OTP has been sent to your email";
  }

  const body = await apiFetch<{ message?: string }>(
    "/dealer/auth/forgot-password",
    {
      method: "POST",
      body: { email },
      skipAuth: true,
    },
  );
  return (
    body.message ??
    "If an account exists with this email, an OTP has been sent to your email"
  );
}

type ForgotPasswordVerifyOtpResponse = {
  success?: boolean;
  message?: string;
  resetToken?: string;
  data?: { resetToken?: string } | null;
};

/** Step 2: verify OTP and receive a short-lived resetToken. */
export async function dealerVerifyForgotPasswordOtp(input: {
  email: string;
  otp: string;
}): Promise<string> {
  if (!isRealDealerAuthEnabled()) {
    await new Promise((r) => setTimeout(r, 400));
    return "mock-password-reset-token";
  }

  const body = await apiFetch<ForgotPasswordVerifyOtpResponse>(
    "/dealer/auth/forgot-password/verify-otp",
    {
      method: "POST",
      body: input,
      skipAuth: true,
    },
  );

  const resetToken = body.resetToken ?? body.data?.resetToken;
  if (!resetToken) {
    throw new Error(body.message ?? "OTP verified but no reset token returned");
  }
  return resetToken;
}

/** Step 3: set a new password using the resetToken from verify-otp. */
export async function dealerResetPassword(input: {
  resetToken: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<string> {
  if (!isRealDealerAuthEnabled()) {
    await new Promise((r) => setTimeout(r, 400));
    return "Password reset successfully";
  }

  const body = await apiFetch<{ message?: string }>(
    "/dealer/auth/forgot-password/reset",
    {
      method: "POST",
      body: input,
      skipAuth: true,
    },
  );
  return body.message ?? "Password reset successfully";
}

export function dealerLogout(): void {
  const accessToken = getAccessToken();
  clearTokens();

  const base = getApiBaseUrl();
  if (!base || !accessToken) return;

  // Best-effort server revoke — never block UI / redirect.
  void apiFetch("/dealer/auth/logout", {
    method: "POST",
    skipAuth: true,
    headers: bearerAuthHeader(accessToken),
  }).catch(() => {
    // Ignore network / API failures after local session is cleared.
  });
}

export function toAuthErrorMessage(err: unknown, fallback: string): string {
  return messageFromUnknown(err, fallback);
}
