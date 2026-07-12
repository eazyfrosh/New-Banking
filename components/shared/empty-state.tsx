import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center gap-3 py-12 text-center", className)}>
      <span className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-2xl">
        <Icon className="size-5" />
      </span>
      <div>
        <p className="text-sm font-medium">{title}</p>
        {description && <p className="text-muted-foreground mt-1 text-sm">{description}</p>}
      </div>
      {action}
    </div>
  );
}
