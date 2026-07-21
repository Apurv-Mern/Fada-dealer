import { AuthBrandPanel } from "@/features/auth/components/auth-brand-panel";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <AuthBrandPanel />
      <div className="flex items-center justify-center bg-[var(--background)] px-6 py-12">
        {children}
      </div>
    </div>
  );
}
