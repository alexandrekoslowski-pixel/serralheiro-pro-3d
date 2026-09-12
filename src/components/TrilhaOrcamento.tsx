// Trilha visual: do orçamento criado até a ordem na oficina.
import { Check, AlertTriangle, Circle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EstadoMarco, Marco } from "@/lib/progressoOrcamento";

const CORES: Record<EstadoMarco, string> = {
  feito: "border-emerald-500/40 bg-emerald-500/10 text-emerald-500",
  pendente: "border-amber-500/40 bg-amber-500/10 text-amber-500",
  atrasado: "border-destructive/40 bg-destructive/10 text-destructive",
  neutro: "border-border bg-muted/40 text-muted-foreground",
};

const Icone = ({ estado }: { estado: EstadoMarco }) => {
  if (estado === "feito") return <Check className="h-3.5 w-3.5 shrink-0" />;
  if (estado === "atrasado") return <AlertTriangle className="h-3.5 w-3.5 shrink-0" />;
  if (estado === "pendente") return <Clock className="h-3.5 w-3.5 shrink-0" />;
  return <Circle className="h-3.5 w-3.5 shrink-0" />;
};

export function TrilhaOrcamento({
  marcos,
  compacta = false,
  className,
}: {
  marcos: Marco[];
  compacta?: boolean;
  className?: string;
}) {
  if (compacta) {
    return (
      <div className={cn("flex items-center gap-1", className)} aria-label="Progresso do orçamento">
        {marcos.map((m) => (
          <span
            key={m.id}
            title={`${m.label}: ${m.detalhe}`}
            className={cn("h-1.5 flex-1 rounded-full", {
              "bg-emerald-500": m.estado === "feito",
              "bg-amber-500": m.estado === "pendente",
              "bg-destructive": m.estado === "atrasado",
              "bg-muted": m.estado === "neutro",
            })}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {marcos.map((m) => (
        <span
          key={m.id}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium",
            CORES[m.estado],
          )}
        >
          <Icone estado={m.estado} />
          {m.label}
          <span className="font-normal opacity-80">· {m.detalhe}</span>
        </span>
      ))}
    </div>
  );
}

export default TrilhaOrcamento;
