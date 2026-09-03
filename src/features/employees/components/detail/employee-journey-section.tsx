"use client";

import { useState } from "react";
import {
  Award,
  BarChart3,
  ChevronDown,
  Image,
  Percent,
  RefreshCw,
  ThumbsUp,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { EmployeeJourneyList } from "@/features/employees/components/detail/employee-journey-list";
import type { EmployeeDetail, EmployeeJourneyItem } from "@/features/employees/types";
import { cn } from "@/lib/utils/cn";

type JourneyCategory = {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  items?: EmployeeJourneyItem[];
  comingSoon?: boolean;
};

export function EmployeeJourneySection({
  employee,
}: {
  employee: EmployeeDetail;
}) {
  const categories: JourneyCategory[] = [
    {
      id: "certificates",
      label: "Certificates",
      description: "Professional certifications",
      icon: Award,
      color: "text-amber-600 bg-amber-50",
      items: employee.certificates ?? [],
    },
    {
      id: "training",
      label: "Training",
      description: "Completed training programs",
      icon: RefreshCw,
      color: "text-violet-600 bg-violet-50",
      items: employee.trainings ?? [],
    },
    {
      id: "skills",
      label: "Skills",
      description: "Skill assessments",
      icon: BarChart3,
      color: "text-blue-600 bg-blue-50",
      items: employee.skillItems ?? [],
    },
    {
      id: "appreciation",
      label: "Appreciation",
      description: "Recognition & awards",
      icon: ThumbsUp,
      color: "text-orange-600 bg-orange-50",
      items: employee.appreciations ?? [],
    },
    {
      id: "promotion",
      label: "Promotion",
      description: "Career progression",
      icon: Percent,
      color: "text-red-600 bg-red-50",
      items: employee.promotions ?? [],
    },
    {
      id: "photos",
      label: "Photos",
      description: "Professional memories",
      icon: Image,
      color: "text-emerald-600 bg-emerald-50",
      items: employee.journeys ?? [],
    },
  ];

  const [openId, setOpenId] = useState<string | null>(
    categories.find((c) => !c.comingSoon && (c.items?.length ?? 0) > 0)?.id ??
      null,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Professional journey</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {categories.map((item) => {
            const isOpen = openId === item.id;
            const count = item.items?.length ?? 0;
            const canExpand = !item.comingSoon;

            return (
              <li
                key={item.id}
                className="rounded-[var(--radius-md)] border border-[var(--color-border)]"
              >
                <button
                  type="button"
                  disabled={!canExpand}
                  aria-expanded={canExpand ? isOpen : undefined}
                  onClick={() => {
                    if (!canExpand) return;
                    setOpenId((prev) => (prev === item.id ? null : item.id));
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 px-3 py-2.5 text-left",
                    canExpand
                      ? "hover:bg-[var(--color-muted)]/60"
                      : "cursor-default opacity-90",
                  )}
                >
                  <span
                    className={`inline-flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] ${item.color}`}
                  >
                    <item.icon className="size-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[var(--color-heading)]">
                      {item.label}
                      {canExpand ? (
                        <span className="ml-1.5 font-normal text-[var(--color-text-muted)]">
                          ({count})
                        </span>
                      ) : null}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {item.description}
                    </p>
                  </div>
                  {item.comingSoon ? (
                    <span className="shrink-0 text-xs text-[var(--color-text-muted)]">
                      Coming soon
                    </span>
                  ) : (
                    <ChevronDown
                      className={cn(
                        "size-4 shrink-0 text-[var(--color-text-muted)] transition-transform",
                        isOpen && "rotate-180",
                      )}
                      aria-hidden
                    />
                  )}
                </button>
                {canExpand && isOpen ? (
                  <div className="border-t border-[var(--color-border)] px-3 py-3">
                    <EmployeeJourneyList items={item.items ?? []} />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
