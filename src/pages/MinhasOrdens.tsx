// Tela do serralheiro: apenas as ordens da oficina, sem nenhum valor.
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, RefreshCw, FileText, User, Camera, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ETAPAS_OFICINA, ETAPA_LABEL, proximaEtapa, diasRestantes, tempoNaEtapa } from "@/lib/ordens";
import type { EtapaOficina } from "@/lib/storage";
import { obterEmpresa } from "@/lib/storage";
import { useDados } from "@/hooks/useDados";
import { useRealtimeProjetos } from "@/hooks/useRealtimeProjetos";
import { useSessao } from "@/lib/sessao";
import { listarEquipe, MembroEquipe } from "@/lib/gestao";
import { moverComResponsavel, etapaFotoDaOficina } from "@/lib/fotos";
import { PainelFotos, FotosOrdemDialog } from "@/components/FotosOrdem";
import { tipologiaPorId, acabamentoPorId } from "@/lib/tipologias";
import { cm } from "@/lib/medidas";

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
  const { papel } = useSessao();
  const empresa = obterEmpresa();
  const codigo = empresa.codigoOficina;
  const [ordens, setOrdens] = useState<OrdemOficina[]>([]);
  const [equipe, setEquipe] = useState<MembroEquipe[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [alvo, setAlvo] = useState<EtapaOficina | null>(null);
  const [mover, setMover] = useState<{ ordem: OrdemOficina; etapa: EtapaOficina } | null>(null);
  const [responsavel, setResponsavel] = useState("");
  const [retorno, setRetorno] = useState("");

  const carregar = useCallback(async () => {
    if (!codigo) { setCarregando(false); return; }
    const { data } = await supabase.rpc("ordens_oficina", { _codigo: codigo });
    setOrdens((data ?? []) as unknown as OrdemOficina[]);
    setCarregando(false);
  }, [codigo]);

  useEffect(() => {
    void carregar();
    listarEquipe().then(setEquipe).catch(() => setEquipe([]));
    const t = setInterval(() => void carregar(), 20000);
    return () => clearInterval(t);
  }, [carregar]);

  useRealtimeProjetos(() => void carregar());

  const abrirMover = (o: OrdemOficina, etapa: EtapaOficina) => {
    setResponsavel(o.responsavel ?? "");
    setRetorno("");
    setMover({ ordem: o, etapa });
  };

  const confirmarMover = async () => {
    if (!mover) return;
    const { ordem, etapa } = mover;
    setOrdens((lista) =>
      lista.map((x) =>
        x.id === ordem.id ? { ...x, etapa, etapa_em: new Date().toISOString(), responsavel } : x,
      ),
    );
    setMover(null);
    await moverComResponsavel(codigo, ordem.id, etapa, responsavel.trim(), retorno);
    void carregar();
  };

  const sugestoes = mover?.etapa === "pintura" ? (empresa.empresasPintura ?? []) : equipe.map((m) => m.nome).filter(Boolean);
  const pedirFoto = mover?.etapa === "entrega";
  const pedirRetorno = mover?.etapa === "pos_venda";

  if (carregando) return <div className="py-16 text-center text-muted-foreground">Carregando ordens...</div>;

  return (
    <div className="container mx-auto space-y-4 px-4 py-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl">{papel === "serralheiro" ? "Minhas ordens" : "Oficina"}</h1>
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
        <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2 xl:mx-0 xl:grid xl:grid-cols-7 xl:overflow-visible xl:px-0">
          {ETAPAS_OFICINA.map((etapa) => {
            const doGrupo = ordens.filter((o) => o.etapa === etapa);
            return (
              <section
                key={etapa}
                className={`w-[290px] shrink-0 rounded border p-2 transition xl:w-auto xl:min-w-0 ${alvo === etapa ? "border-primary bg-primary/10" : "border-border bg-card/40"}`}
                onDragOver={(e) => { e.preventDefault(); setAlvo(etapa); }}
                onDragLeave={() => setAlvo((a) => (a === etapa ? null : a))}
                onDrop={(e) => {
                  e.preventDefault();
                  setAlvo(null);
                  const id = e.dataTransfer.getData("text/plain");
                  const o = ordens.find((x) => x.id === id);
                  if (o && o.etapa !== etapa) abrirMover(o, etapa);
                }}
              >
                <h2 className="mb-2 flex items-center justify-between px-1 text-sm font-semibold uppercase tracking-wide">
                  {ETAPA_LABEL[etapa]}
                  <span className="rounded bg-muted px-1.5 text-xs text-muted-foreground">{doGrupo.length}</span>
                </h2>
                <div className="space-y-2">
                  {doGrupo.map((o) => {
                    const prox = proximaEtapa(o.etapa);
                    const tip = tipologiaPorId((o.dados?.tipologia ?? "") as never);
                    const cor = o.dados?.cor ? acabamentoPorId(o.dados.cor as never) : null;
                    return (
                      <article
                        key={o.id}
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData("text/plain", o.id)}
                        title="Arraste para outra coluna"
                        className="cursor-grab overflow-hidden rounded-lg border border-border bg-card shadow-sm transition hover:border-primary hover:shadow-lg active:cursor-grabbing"
                      >
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
                          <p className="flex items-center gap-1 text-[11px]">
                            <User className="h-3 w-3 shrink-0 text-muted-foreground" />
                            <span className={o.responsavel ? "font-medium" : "text-muted-foreground"}>
                              {o.responsavel || "sem responsável"}
                            </span>
                          </p>
                          {["entrega", "pos_venda", "pronto"].includes(o.etapa) && o.endereco ? (
                            <p className="flex items-start gap-1 text-[11px] text-muted-foreground">
                              <MapPin className="mt-0.5 h-3 w-3 shrink-0" /> {o.endereco}
                            </p>
                          ) : null}
                          <p className="text-[11px] text-muted-foreground">nesta etapa {tempoNaEtapa(o.etapa_em)}</p>
                          <div className="flex flex-wrap gap-1 pt-1">
                            <Button asChild size="sm" variant="outline" className="flex-1">
                              <Link to={`/oficina/${codigo}/os/${o.id}`}>
                                <FileText className="mr-1 h-3.5 w-3.5" /> Ver ordem
                              </Link>
                            </Button>
                            <FotosOrdemDialog
                              projetoId={o.id}
                              etapaInicial={etapaFotoDaOficina(o.etapa)}
                              total={o.fotos ?? 0}
                            />
                            {prox ? (
                              <Button size="sm" className="w-full" onClick={() => abrirMover(o, prox)}>
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

      <Dialog open={!!mover} onOpenChange={(o) => !o && setMover(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Mover para {mover ? ETAPA_LABEL[mover.etapa] : ""}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="resp">
                {mover?.etapa === "pintura" ? "Empresa responsável pela pintura" : "Responsável por esta etapa"}
              </Label>
              <Input
                id="resp"
                value={responsavel}
                onChange={(e) => setResponsavel(e.target.value)}
                placeholder={mover?.etapa === "pintura" ? "Nome da empresa" : "Nome de quem vai executar"}
              />
              {sugestoes.length ? (
                <div className="flex flex-wrap gap-1 pt-1">
                  {sugestoes.map((s) => (
                    <Button key={s} size="sm" variant="soft" onClick={() => setResponsavel(s)}>
                      {s}
                    </Button>
                  ))}
                </div>
              ) : null}
            </div>

            {mover?.ordem.endereco && ["entrega", "pos_venda", "pronto"].includes(mover.etapa) ? (
              <p className="flex items-start gap-1 rounded border border-border bg-muted/30 p-2 text-sm">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" /> {mover.ordem.endereco}
              </p>
            ) : null}

            {pedirFoto && mover ? (
              <div className="space-y-2 rounded border border-amber-500/40 bg-amber-500/10 p-2">
                <p className="flex items-center gap-1 text-sm font-medium">
                  <Camera className="h-4 w-4" /> Anexe a foto da instalação
                </p>
                <PainelFotos projetoId={mover.ordem.id} somenteEtapa="entrega" />
              </div>
            ) : null}

            {pedirRetorno ? (
              <div className="space-y-1">
                <Label htmlFor="retorno">Retorno do cliente (pós-venda)</Label>
                <Textarea
                  id="retorno"
                  rows={3}
                  maxLength={2000}
                  value={retorno}
                  onChange={(e) => setRetorno(e.target.value)}
                  placeholder="Cliente aprovou a instalação? Alguma pendência, ajuste ou reclamação?"
                />
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button variant="soft" onClick={() => setMover(null)}>Cancelar</Button>
            <Button onClick={() => void confirmarMover()}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
