// Tela do serralheiro: apenas as ordens da oficina, sem nenhum valor.
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, RefreshCw, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ETAPAS_OFICINA, ETAPA_LABEL, proximaEtapa, diasRestantes, tempoNaEtapa } from "@/lib/ordens";
import type { EtapaOficina } from "@/lib/storage";
import { obterEmpresa } from "@/lib/storage";
import { useDados } from "@/hooks/useDados";
import { tipologiaPorId, acabamentoPorId } from "@/lib/tipologias";
import { cm } from "@/lib/medidas";

interface OrdemOficina {
  id: string;
  nome: string;
  cliente: string;
  etapa: EtapaOficina;
  etapa_em: string;
  prazo_entrega: string | null;
  dados: { tipologia?: string; largura_mm?: number; altura_mm?: number; cor?: string } | null;
}

const faixaPrazo = (prazo: string | null) => {
  const d = diasRestantes(prazo);
  if (d === null) return "bg-muted";
  if (d <= 3) return "bg-destructive";
  if (d <= 7) return "bg-amber-500";
  return "bg-emerald-500";
};

const textoPrazo = (prazo: string | null) => {
  if (!prazo) return "Sem prazo";
  const d = diasRestantes(prazo)!;
  const data = new Date(prazo + "T00:00:00").toLocaleDateString("pt-BR");
  if (d < 0) return `ATRASADO ${Math.abs(d)} d · ${data}`;
  if (d === 0) return `ENTREGA HOJE · ${data}`;
  return `${d} d · ${data}`;
};

export default function MinhasOrdens() {
  useDados();
  const codigo = obterEmpresa().codigoOficina;
  const [ordens, setOrdens] = useState<OrdemOficina[]>([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    if (!codigo) { setCarregando(false); return; }
    const { data } = await supabase.rpc("ordens_oficina", { _codigo: codigo });
    setOrdens((data ?? []) as unknown as OrdemOficina[]);
    setCarregando(false);
  }, [codigo]);

  useEffect(() => {
    void carregar();
    const t = setInterval(() => void carregar(), 60000);
    return () => clearInterval(t);
  }, [carregar]);

  const mover = async (o: OrdemOficina, etapa: EtapaOficina) => {
    setOrdens((lista) => lista.map((x) => (x.id === o.id ? { ...x, etapa, etapa_em: new Date().toISOString() } : x)));
    await supabase.rpc("mover_etapa_oficina", { _codigo: codigo, _projeto_id: o.id, _etapa: etapa });
    void carregar();
  };

  if (carregando) return <div className="py-16 text-center text-muted-foreground">Carregando ordens...</div>;

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl">Minhas ordens</h1>
          <p className="text-sm text-muted-foreground">O que está na oficina agora.</p>
        </div>
        <Button variant="outline" onClick={() => void carregar()}>
          <RefreshCw className="mr-2 h-4 w-4" /> Atualizar
        </Button>
      </header>

      {!ordens.length ? (
        <p className="rounded border border-border p-8 text-center text-muted-foreground">
          Nenhuma ordem na oficina no momento.
        </p>
      ) : (
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          {ETAPAS_OFICINA.map((etapa) => {
            const doGrupo = ordens.filter((o) => o.etapa === etapa);
            return (
              <section key={etapa} className="rounded border border-border bg-card/40 p-2">
                <h2 className="mb-2 flex items-center justify-between px-1 text-sm font-semibold uppercase tracking-wide">
                  {ETAPA_LABEL[etapa]}
                  <span className="rounded bg-muted px-1.5 text-xs text-muted-foreground">{doGrupo.length}</span>
                </h2>
                <div className="space-y-2">
                  {doGrupo.map((o) => {
                    const prox = proximaEtapa(o.etapa);
                    const tip = tipologiaPorId(o.dados?.tipologia ?? "");
                    const cor = acabamentoPorId(o.dados?.cor ?? "");
                    return (
                      <article key={o.id} className="overflow-hidden rounded border border-border bg-card">
                        <div className={`h-1.5 ${faixaPrazo(o.prazo_entrega)}`} />
                        <div className="space-y-1 p-2">
                          <p className="font-semibold leading-tight">{o.nome}</p>
                          <p className="text-xs text-muted-foreground">{o.cliente || "Sem cliente"}</p>
                          <p className="text-xs">
                            {tip?.nome ?? "Peça"}
                            {o.dados?.largura_mm && o.dados?.altura_mm
                              ? ` · ${cm(o.dados.largura_mm)} × ${cm(o.dados.altura_mm)} cm`
                              : ""}
                          </p>
                          {cor ? <p className="text-xs text-muted-foreground">{cor.nome}</p> : null}
                          <p className="text-xs font-medium">{textoPrazo(o.prazo_entrega)}</p>
                          <p className="text-[11px] text-muted-foreground">nesta etapa {tempoNaEtapa(o.etapa_em)}</p>
                          <div className="flex gap-1 pt-1">
                            <Button asChild size="sm" variant="outline" className="flex-1">
                              <Link to={`/oficina/${codigo}/os/${o.id}`}>
                                <FileText className="mr-1 h-3.5 w-3.5" /> OS
                              </Link>
                            </Button>
                            {prox ? (
                              <Button size="sm" className="flex-1" onClick={() => void mover(o, prox)}>
                                <ArrowRight className="mr-1 h-3.5 w-3.5" /> {ETAPA_LABEL[prox]}
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
