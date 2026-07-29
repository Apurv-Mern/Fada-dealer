import { FileQuestion } from "lucide-react";

import { StatusScreen } from "@/components/layout/status-screen";
import { routes } from "@/config/navigation";

export default function NotFound() {
  return (
    <StatusScreen
      code={404}
      icon={FileQuestion}
      title="Page not found"
      description="This page doesn’t exist or may have moved. Check the URL, or head back to the dealer portal."
      primaryAction={{ label: "Back to login", href: routes.login }}
      secondaryAction={{ label: "Go to branches", href: routes.branches }}
    />
  );
}
