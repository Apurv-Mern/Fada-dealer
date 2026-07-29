import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui";

export function PlaceholderPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <PageHeader title={title} description={description} />
      <Card>
        <CardContent className="py-10 text-center text-sm text-[var(--color-text-muted)]">
          This section is not connected to an API yet. Use the sidebar to open
          available pages — chrome stays available after you sign in.
        </CardContent>
      </Card>
    </div>
  );
}
