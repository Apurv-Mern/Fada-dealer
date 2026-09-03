import {
  BarChart3,
  ClipboardCheck,
  LineChart,
  UserCheck,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { DealerReportKey } from "@/features/reports/types";

export type ReportTabTheme = {
  icon: LucideIcon;
  /** Accent color token used for selected state ring, border, and icon fill. */
  accent: string;
  accentSoft: string;
  accentBorder: string;
  accentText: string;
};

export const REPORT_TAB_THEMES: Record<DealerReportKey, ReportTabTheme> = {
  "employee-master": {
    icon: Users,
    accent: "var(--color-info)",
    accentSoft: "var(--color-info-soft)",
    accentBorder: "var(--color-info)",
    accentText: "var(--color-info)",
  },
  "onboarding-verification": {
    icon: UserCheck,
    accent: "var(--color-primary)",
    accentSoft: "var(--color-primary-soft)",
    accentBorder: "var(--color-primary)",
    accentText: "var(--color-primary)",
  },
  "employee-movement": {
    icon: ClipboardCheck,
    accent: "var(--color-success)",
    accentSoft: "var(--color-success-soft)",
    accentBorder: "var(--color-success)",
    accentText: "var(--color-success)",
  },
  "workforce-analytics": {
    icon: LineChart,
    accent: "var(--color-purple)",
    accentSoft: "var(--color-purple-soft)",
    accentBorder: "var(--color-purple)",
    accentText: "var(--color-purple)",
  },
  "adoption-compliance": {
    icon: BarChart3,
    accent: "var(--color-warning)",
    accentSoft: "var(--color-warning-soft)",
    accentBorder: "var(--color-warning)",
    accentText: "var(--color-warning)",
  },
};
