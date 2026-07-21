"use client";

import * as React from "react";
import { Eye, EyeOff, Lock } from "lucide-react";

import { Input, type InputProps } from "@/components/ui/input";

export type PasswordInputProps = Omit<
  InputProps,
  "type" | "rightAddon" | "leftAddon"
> & {
  showLockIcon?: boolean;
};

export const PasswordInput = React.forwardRef<
  HTMLInputElement,
  PasswordInputProps
>(({ showLockIcon = true, ...props }, ref) => {
  const [visible, setVisible] = React.useState(false);

  return (
    <Input
      ref={ref}
      type={visible ? "text" : "password"}
      leftAddon={showLockIcon ? <Lock /> : undefined}
      rightAddon={
        <button
          type="button"
          onClick={() => setVisible((prev) => !prev)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="pointer-events-auto flex items-center text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      }
      {...props}
    />
  );
});

PasswordInput.displayName = "PasswordInput";
