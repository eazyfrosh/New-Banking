import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  iconOnly = false,
}: {
  className?: string;
  iconOnly?: boolean;
}) {
  return (
    <Link
      href="/"
      className={cn("flex items-center gap-2 font-semibold", className)}
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground font-bold text-xs tracking-tight">
        NO
      </span>
      {!iconOnly && <span className="text-lg tracking-tight">Novaofficial</span>}
    </Link>
  );
}
