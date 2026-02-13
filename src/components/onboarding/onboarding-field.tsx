"use client";

import { cn } from "@/lib/utils";

interface OnboardingFieldProps {
  label: string;
  description?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function OnboardingField({
  label,
  description,
  required,
  children,
  className,
}: OnboardingFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="block text-sm font-medium text-foreground/80">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {children}
    </div>
  );
}

// Shared input class
export const inputClassName =
  "w-full px-4 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors";

export const textareaClassName =
  "w-full px-4 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors resize-none";

export const selectClassName =
  "w-full px-4 py-2.5 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors";
