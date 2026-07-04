import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";

type NoticeVariant = "info" | "success" | "warning" | "error";

type NoticeProps = {
  children: ReactNode;
  className?: string;
  title?: string;
  variant?: NoticeVariant;
};

const noticeStyles: Record<
  NoticeVariant,
  { icon: LucideIcon; role: "status" | "alert"; classes: string }
> = {
  info: {
    icon: Info,
    role: "status",
    classes: "border-sky-200 bg-sky-50 text-sky-950",
  },
  success: {
    icon: CheckCircle2,
    role: "status",
    classes: "border-emerald-200 bg-emerald-50 text-emerald-950",
  },
  warning: {
    icon: AlertTriangle,
    role: "status",
    classes: "border-amber-200 bg-amber-50 text-amber-950",
  },
  error: {
    icon: XCircle,
    role: "alert",
    classes: "border-rose-200 bg-rose-50 text-rose-950",
  },
};

export function Notice({ children, className, title, variant = "info" }: NoticeProps) {
  const { icon: Icon, role, classes } = noticeStyles[variant];

  return (
    <div
      aria-live={role === "alert" ? "assertive" : "polite"}
      className={cn("panel-card flex gap-3 p-4", classes, className)}
      role={role}
    >
      <Icon
        className={cn(
          "mt-0.5 size-5 shrink-0",
          variant === "info" && "text-sky-600",
          variant === "success" && "text-emerald-600",
          variant === "warning" && "text-amber-600",
          variant === "error" && "text-rose-600",
        )}
        aria-hidden="true"
      />
      <div className="grid gap-1">
        {title ? <p className="text-sm font-semibold tracking-tight">{title}</p> : null}
        <div className="text-sm leading-6">{children}</div>
      </div>
    </div>
  );
}
