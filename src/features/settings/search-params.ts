export type SettingsTab = "staff" | "roles";

export function parseSettingsTab(value: string | null): SettingsTab {
  return value === "roles" ? "roles" : "staff";
}

export function buildSettingsTabHref(tab: SettingsTab): string {
  return tab === "staff" ? "/settings/" : "/settings/?tab=roles";
}
