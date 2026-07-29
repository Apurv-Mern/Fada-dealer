export type ListParams = {
  page?: number;
  pageSize?: number;
  q?: string;
};

export type ListResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type ApiErrorBody = {
  message: string;
  code?: string;
  status?: number;
};

/** Standard success envelope from FADA Node API. */
export type ApiSuccessResponse<T = unknown> = {
  success: boolean;
  message?: string;
  data?: T | null;
};

/** Standard error envelope from FADA Node API. */
export type ApiErrorResponse = {
  success: false;
  message?: string;
  error?: string | null;
};

/**
 * Auth token success shape (login / OTP verify / refresh).
 * Password login may use top-level accessToken + dealer; OTP verify may nest under data.
 * Gate portal entry on `isEmailVerified === false` (password login only).
 */
export type AuthTokenResponse = {
  success: boolean;
  message?: string;
  accessToken?: string;
  refreshToken?: string;
  status?: string;
  dealer?: {
    id?: number;
    name?: string;
    email?: string;
    role?: string;
    status?: string;
    isEmailVerified?: boolean;
    [key: string]: unknown;
  };
  data?: {
    accessToken?: string;
    refreshToken?: string;
    status?: string;
    email?: string;
    name?: string;
    role?: string;
    isEmailVerified?: boolean;
    user?: {
      email?: string;
      name?: string;
      role?: string;
      isEmailVerified?: boolean;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  } | null;
};
