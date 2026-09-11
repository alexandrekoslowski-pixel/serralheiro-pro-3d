// Kanban da oficina — tela aberta (sem senha, sem valores).
// Acesso por link com o código da serralheria: /oficina/:codigo
import { useCallback, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowRight, RefreshCw, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ETAPAS_OFICINA, ETAPA_LABEL, proximaEtapa, diasRestantes, tempoNaEtapa } from "@/lib/ordens";
import type { EtapaOficina } from "@/lib/storage";
import { tipologiaPorId, acabamentoPorId } from "@/lib/tipologias";
import { cm } from "@/lib/medidas";
import { useRealtimeProjetos } from "@/hooks/useRealtimeProjetos";

interface OrdemOficina {
  id: string;
  nome: string;
  cliente: string;
  etapa: EtapaOficina;
  etapa_em: string;
  prazo_entrega: string | null;
  responsavel: string | null;
  fotos: number | null;
  endereco: string | null;
  dados: { tipologia?: string; largura_mm?: number; altura_mm?: number; cor?: string } | null;
}

const corPrazoSimples = (prazo: string | null) => {
  const d = diasRestantes(prazo);
  if (d === null) return "bg-muted";
  if (d <= 3) return "bg-destructive";
  if (d <= 7) return "bg-amber-500";
  return "bg-emerald-500";
};

const textoPrazoSimples = (prazo: string | null) => {
  if (!prazo) return "Sem prazo";
  const d = diasRestantes(prazo)!;
  const data = new Date(prazo + "T00:00:00").toLocaleDateString("pt-BR");
  if (d < 0) return `ATRASADO ${Math.abs(d)} d · ${data}`;
  if (d === 0) return `ENTREGA HOJE · ${data}`;
  return `${d} d · ${data}`;
};

export default function KanbanOficina() {
  const { codigo = "" } = useParams();
  const [ordens, setOrdens] = useState<OrdemOficina[]>([]);
  const [erro, setErro] = useState(false);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    const { data, error } = await supabase.rpc("ordens_oficina", { _codigo: codigo });
    if (error) setErro(true);
    else setOrdens((data ?? []) as unknown as OrdemOficina[]);
    setCarregando(false);
  }, [codigo]);

  useEffect(() => {
    void carregar();
    const t = setInterval(() => void carregar(), 15000);
    return () => clearInterval(t);
  }, [carregar]);

  useRealtimeProjetos(() => void carregar());

  const mover = async (o: OrdemOficina, etapa: EtapaOficina) => {
    setOrdens((lista) => lista.map((x) => (x.id === o.id ? { ...x, etapa, etapa_em: new Date().toISOString() } : x)));
    await supabase.rpc("mover_etapa_oficina", { _codigo: codigo, _projeto_id: o.id, _etapa: etapa });
    void carregar();
  };

  if (carregando) return <div className="grid min-h-screen place-items-center text-lg">Carregando ordens...</div>;
  if (erro) return <div className="grid min-h-screen place-items-center text-lg">Link da oficina inválido.</div>;

  return (
    <div className="min-h-screen bg-background p-4">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-2xl md:text-3xl">Oficina · ordens de serviço</h1>
        <Button variant="outline" onClick={() => void carregar()}>
          <RefreshCw className="mr-2 h-4 w-4" /> Atualizar
        </Button>
      </header>

      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2 xl:mx-0 xl:grid xl:grid-cols-7 xl:overflow-visible xl:px-0">
        {ETAPAS_OFICINA.map((etapa) => {
          const doGrupo = ordens.filter((o) => o.etapa === etapa);
          return (
            <div
              key={etapa}
              className="w-[290px] shrink-0 rounded-lg border border-border bg-card/40 p-2 xl:w-auto xl:min-w-0"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const id = e.dataTransfer.getData("text/plain");
                const o = ordens.find((x) => x.id === id);
                if (o && o.etapa !== etapa) void mover(o, etapa);
              }}
            >
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="font-display text-base uppercase tracking-wide">{ETAPA_LABEL[etapa]}</span>
                <span className="rounded bg-muted px-2 text-sm text-muted-foreground">{doGrupo.length}</span>
              </div>

              <div className="space-y-2">
                {doGrupo.map((o) => {
                  const d = o.dados ?? {};
                  const prox = proximaEtapa(o.etapa);
                  return (
                    <div
                      key={o.id}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData("text/plain", o.id)}
                      className="overflow-hidden rounded-md border border-border bg-card"
                    >
                      <div className={`h-1.5 w-full ${corPrazoSimples(o.prazo_entrega)}`} />
                      <div className="space-y-1 p-3">
                        <div className="font-display text-lg leading-tight">{o.cliente || o.nome}</div>
                        <div className="text-sm text-muted-foreground">
                          {tipologiaPorId(d.tipologia as never)?.nome ?? o.nome}
                        </div>
                        <div className="font-display text-xl">
                          {d.largura_mm ? cm(d.largura_mm) : "?"} × {d.altura_mm ? cm(d.altura_mm) : "?"} cm
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {acabamentoPorId(d.cor as never)?.nome ?? ""}
                        </div>
                        <div className="text-sm font-medium">{textoPrazoSimples(o.prazo_entrega)}</div>
                        <div className="text-sm">
                          Responsável: <strong>{o.responsavel || "—"}</strong>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {ETAPA_LABEL[o.etapa]} {tempoNaEtapa(o.etapa_em)}
                        </div>

                        <div className="flex flex-wrap gap-1 pt-2">
                          {prox && (
                            <Button size="sm" onClick={() => void mover(o, prox)} className="bg-gradient-orange text-primary-foreground">
                              {ETAPA_LABEL[prox]} <ArrowRight className="ml-1 h-4 w-4" />
                            </Button>
                          )}
                          <Button size="sm" variant="outline" asChild>
                            <Link to={`/oficina/${codigo}/os/${o.id}`} target="_blank">
                              <FileText className="mr-1 h-4 w-4" /> OS
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {doGrupo.length === 0 && (
                  <div className="rounded border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                    vazio
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
