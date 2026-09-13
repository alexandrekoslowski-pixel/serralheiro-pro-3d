import { Check, Download, Send, CheckCircle2, FileSignature, Upload, Wrench, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { passosOrcamento, type PassoId } from "@/lib/progressoOrcamento";
import type { Pagamento, ProjetoLocal } from "@/lib/storage";

const ICONES: Record<PassoId, typeof Download> = {
  orcamento: Download,
  enviar: Send,
  aprovar: CheckCircle2,
  contrato: FileSignature,
  comprovante: Upload,
  oficina: Wrench,
};

interface Props {
  projeto: ProjetoLocal;
  pagamentos: Pagamento[];
  onPasso: (id: PassoId) => void;
  /** Mostra só o próximo passo (usado nos cartões da lista). */
  somenteProximo?: boolean;
  /** Passo em andamento: fica desabilitado e com girinho. */
  ocupado?: PassoId | null;
  className?: string;
}

export function PassosOrcamento({ projeto, pagamentos, onPasso, somenteProximo, ocupado, className }: Props) {
  const passos = passosOrcamento(projeto, pagamentos);
  const visiveis = somenteProximo ? passos.filter((p) => p.atual) : passos;
  if (visiveis.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {visiveis.map((p) => {
        const carregando = ocupado === p.id;
        const Icone = carregando ? Loader2 : ICONES[p.id];
        return (
          <Button
            key={p.id}
            type="button"
            size="sm"
            variant={p.atual ? "default" : "outline"}
            disabled={carregando}
            onClick={() => onPasso(p.id)}
            title={p.detalhe}
            className={cn(
              "shrink-0",
              p.atual && "bg-gradient-orange text-primary-foreground shadow-orange hover:opacity-90",
              !p.atual && p.feito && "border-dashed text-muted-foreground",
              !p.atual && !p.feito && "text-muted-foreground",
            )}
          >
            <span className="mr-1.5 text-[11px] font-semibold opacity-70">{p.numero}</span>
            {p.feito && !carregando ? <Check className="mr-1 h-4 w-4" /> : <Icone className={cn("mr-1 h-4 w-4", carregando && "animate-spin")} />}
            {carregando ? "Preparando PDF…" : p.feito ? p.labelFeito : p.label}
            {p.feito && p.detalhe && !somenteProximo && (
              <span className="ml-1.5 hidden text-[11px] opacity-70 sm:inline">{p.detalhe}</span>
            )}
          </Button>
        );
      })}
    </div>
  );
}
