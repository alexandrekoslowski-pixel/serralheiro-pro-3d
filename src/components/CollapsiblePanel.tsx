// Painel colapsável — só colabora abaixo de lg; em desktop o conteúdo é sempre visível.
import { useState, ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface CollapsiblePanelProps {
  icon?: ReactNode;
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
}

export function CollapsiblePanel({ icon, title, defaultOpen = true, children, className }: CollapsiblePanelProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={cn("rounded-lg border border-border bg-card", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left lg:cursor-default"
      >
        <div className="flex items-center gap-2 font-display text-sm tracking-wide">
          {icon}
          <span>{title}</span>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform lg:hidden",
            open ? "rotate-180" : ""
          )}
        />
      </button>
      <div className={cn("border-t border-border px-4 py-4 space-y-4", !open && "hidden lg:block")}>
        {children}
      </div>
    </div>
  );
}
