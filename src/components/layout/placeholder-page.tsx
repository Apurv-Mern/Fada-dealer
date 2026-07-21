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
          Screen shell ready — feature UI comes next.
        </CardContent>
      </Card>
    </div>
  );
}
