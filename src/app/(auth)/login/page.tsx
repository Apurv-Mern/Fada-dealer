import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { LoginForm } from "@/features/auth/login-form";

function LoginFallback() {
  return (
    <div className="w-full max-w-md space-y-4" aria-busy aria-label="Loading">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-64" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
