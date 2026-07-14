import { Info } from "lucide-react";

export function DemoBanner() {
  return (
    <div className="bg-warning/15 text-warning-foreground border-warning/20 flex items-center justify-center gap-2 border-b px-4 py-2 text-center text-xs font-medium sm:text-sm">
      <Info className="size-3.5 shrink-0" />
      <span>
        Demo project for portfolio purposes only — Novaofficial is not a real financial
        institution. Please do not enter real banking credentials or sensitive financial
        information.
      </span>
    </div>
  );
}
