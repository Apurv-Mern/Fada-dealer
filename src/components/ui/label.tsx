import * as React from "react";

import { cn } from "@/lib/utils/cn";

export type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement> & {
  required?: boolean;
};

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, children, required, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          "mb-1.5 block text-sm font-medium text-[var(--color-text)]",
          className,
        )}
        {...props}
      >
        {children}
        {required ? (
          <span className="ml-0.5 text-[var(--color-danger)]" aria-hidden>
            *
          </span>
        ) : null}
      </label>
    );
  },
);

Label.displayName = "Label";
