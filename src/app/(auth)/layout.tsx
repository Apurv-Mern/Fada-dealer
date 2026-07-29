import { AuthBrandPanel } from "@/features/auth/components/auth-brand-panel";
import { AuthGate } from "@/features/auth/auth-gate";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen min-h-dvh lg:grid-cols-2">
      <AuthBrandPanel />
      <div className="flex items-center justify-center overflow-x-hidden bg-[var(--background)] px-4 py-12 sm:px-6">
        <AuthGate>{children}</AuthGate>
      </div>
    </div>
  );
}
