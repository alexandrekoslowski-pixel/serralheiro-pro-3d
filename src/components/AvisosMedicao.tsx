// Sino de avisos: ordens aprovadas que estão esperando a medição do Eduardo.
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, MapPin, Phone, Ruler } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeProjetos } from "@/hooks/useRealtimeProjetos";
import { tempoNaEtapa } from "@/lib/ordens";
import { cn } from "@/lib/utils";

type AvisoMedicao = {
  id: string;
  nome: string;
  cliente: string;
  telefone: string;
  endereco: string;
  desde: string;
  prazo: string | null;
};

const montarEndereco = (d: Record<string, unknown>): string => {
  const parte = (k: string) => String(d[k] ?? "").trim();
  const rua = [parte("cliente_endereco"), parte("cliente_numero")].filter(Boolean).join(", ");
  return [rua, parte("cliente_complemento"), parte("cliente_bairro"), parte("cliente_cidade")]
    .filter(Boolean)
    .join(" · ");
};

export function AvisosMedicao({ mobile = false }: { mobile?: boolean }) {
  const navigate = useNavigate();
  const [itens, setItens] = useState<AvisoMedicao[]>([]);
  const [aberto, setAberto] = useState(false);
  const vistos = useRef<Set<string> | null>(null);

  const carregar = useCallback(async () => {
    const { data } = await supabase
      .from("projetos")
      .select("id, nome, cliente, prazo_entrega, etapa_em, dados")
      .eq("etapa", "medicao")
      .order("etapa_em", { ascending: true });

    const lista: AvisoMedicao[] = (data ?? []).map((row) => {
      const d = (row.dados ?? {}) as Record<string, unknown>;
      return {
        id: row.id as string,
        nome: (row.nome as string) ?? "",
        cliente: (row.cliente as string) ?? "",
        telefone: String(d.cliente_telefone ?? ""),
        endereco: montarEndereco(d),
        desde: (row.etapa_em as string) ?? new Date().toISOString(),
        prazo: (row.prazo_entrega as string) ?? null,
      };
    });

    setItens(lista);

    // Avisa só quando surge uma medição nova (não avisa no primeiro carregamento).
    const atuais = new Set(lista.map((x) => x.id));
    if (vistos.current) {
      const novas = lista.filter((x) => !vistos.current!.has(x.id));
      for (const n of novas) {
        toast.info("Nova medição para fazer", {
          description: `${n.cliente || n.nome}${n.endereco ? ` · ${n.endereco}` : ""}`,
          action: { label: "Ver", onClick: () => navigate("/app/oficina") },
        });
      }
    }
    vistos.current = atuais;
  }, [navigate]);

  useEffect(() => { void carregar(); }, [carregar]);
  useRealtimeProjetos(() => void carregar());

  const total = itens.length;

  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger asChild>
        <Button
          variant="soft"
          size={mobile ? "icon" : "icon"}
          className={cn("relative", !mobile && "w-full")}
          aria-label={`Avisos de medição${total ? ` (${total})` : ""}`}
          title="Avisos de medição"
        >
          <Bell className="h-4 w-4" />
          {total > 0 && (
            <span className="absolute -right-1 -top-1 grid min-h-4 min-w-4 place-items-center rounded-full bg-warning px-1 text-[9px] font-bold text-warning-foreground">
              {total}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align={mobile ? "end" : "start"} side={mobile ? "bottom" : "right"} className="w-80 p-0">
        <div className="border-b border-border px-3 py-2">
          <p className="font-display text-sm">Medições para fazer</p>
          <p className="text-xs text-muted-foreground">
            {total === 0 ? "Nenhuma medição pendente" : `${total} obra(s) esperando medição`}
          </p>
        </div>
        <div className="max-h-80 overflow-y-auto divide-y divide-border">
          {itens.map((i) => (
            <div key={i.id} className="space-y-1.5 px-3 py-2.5">
              <p className="truncate text-sm font-medium">{i.cliente || i.nome}</p>
              {i.endereco && (
                <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" /> <span>{i.endereco}</span>
                </p>
              )}
              {i.telefone && (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Phone className="h-3.5 w-3.5 shrink-0" /> {i.telefone}
                </p>
              )}
              <p className="text-[11px] text-muted-foreground">
                Aprovado {tempoNaEtapa(i.desde)}
                {i.prazo ? ` · entrega ${new Date(`${i.prazo}T00:00:00`).toLocaleDateString("pt-BR")}` : ""}
              </p>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                <Button size="sm" variant="soft" onClick={() => { setAberto(false); navigate("/app/oficina"); }}>
                  <Ruler className="mr-1 h-3.5 w-3.5" /> Fazer medição
                </Button>
                {i.endereco && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(i.endereco)}`, "_blank", "noopener,noreferrer")}
                  >
                    <MapPin className="mr-1 h-3.5 w-3.5" /> Mapa
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
