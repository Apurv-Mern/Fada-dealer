"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { Skeleton } from "@/components/ui/skeleton";
import { isLoggedIn } from "@/features/auth/token-store";
import { routes } from "@/config/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace(isLoggedIn() ? routes.branches : routes.login);
  }, [router]);

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-3 p-6"
      aria-busy
      aria-label="Loading"
    >
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-64" />
    </div>
  );
}
