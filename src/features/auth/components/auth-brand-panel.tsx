import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

const highlights = [
  "One permanent FADA ID for every employee",
  "Onboard staff individually or in bulk",
  "Manage the full employment lifecycle",
];

export function AuthBrandPanel() {
  return (
    <div className="relative hidden flex-col justify-between bg-[var(--color-brand)] p-10 text-white lg:flex">
      <Link href="/login" className="flex items-center gap-2">
        <div className="flex size-9 items-center justify-center rounded-md bg-white/10 text-sm font-bold">
          F
        </div>
        <div className="leading-tight">
          <p className="text-base font-bold tracking-wide">
            FADA <span className="text-[var(--color-primary)]">ID</span>
          </p>
          <p className="text-[10px] font-medium tracking-wider text-white/60 uppercase">
            Dealer Portal
          </p>
        </div>
      </Link>

      <div className="max-w-sm">
        <h2 className="text-2xl font-semibold leading-snug">
          India&apos;s national professional identity for automobile retail.
        </h2>
        <ul className="mt-6 space-y-3">
          {highlights.map((item) => (
            <li key={item} className="flex items-start gap-3 text-sm text-white/80">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[var(--color-primary)]" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <p className="text-xs text-white/50">
        © 2026 FADA ID. All rights reserved.
      </p>
    </div>
  );
}
