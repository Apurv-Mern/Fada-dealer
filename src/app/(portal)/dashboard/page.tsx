import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui";

export default function DashboardPage() {
  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of dealership operations and pending actions."
      />
      <Card>
        <CardContent className="py-10 text-center text-sm text-[var(--color-text-muted)]">
          Dashboard widgets will be connected in a later milestone. Use{" "}
          <strong className="text-[var(--color-text)]">Branches</strong> or{" "}
          <strong className="text-[var(--color-text)]">Employees</strong> in the
          sidebar to review the UI matching Figma.
        </CardContent>
      </Card>
    </div>
  );
}
