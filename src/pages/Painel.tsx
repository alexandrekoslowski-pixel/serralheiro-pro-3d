import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Wallet, Plus, Search, Monitor, AlertTriangle, Clock, MessageCircle, Upload, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useDados } from "@/hooks/useDados";
import {
  ProjetoLocal, listarProjetos, obterEmpresa, salvarProjeto, criarOrcamentoRapido, formatarBRL,
  listarPagamentos, totalRecebido, adicionarPagamento, removerPagamento, OrdemStatus,
} from "@/lib/storage";
import {
  STATUS_LABEL, STATUS_ORDEM, STATUS_CORES, proximoStatus, corPrazo, CLASSES_PRAZO, textoPrazo,
  diasRestantes, somarDias, dataISO, ETAPA_LABEL,
} from "@/lib/ordens";
import { tipologiaPorId } from "@/lib/tipologias";
import CalendarioEntregas from "@/components/CalendarioEntregas";
import { useVendedores } from "@/hooks/useVendedores";
import { pendentesComunsChecklist, pendentesPecaChecklist } from "@/lib/checklistPedido";
import { numeroMascarado } from "@/lib/mascaras";
import { anexarComprovante, abrirComprovante } from "@/lib/comprovantes";

const FORMAS = ["pix", "dinheiro", "cartão", "boleto", "transferência"];

export default function Painel() {
  const navigate = useNavigate();
  useDados();
  const projetos = listarProjetos();
  const empresa = obterEmpresa();
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<"todos" | OrdemStatus | "abertos">("abertos");
  const [vendedora, setVendedora] = useState("todas");
  const [filtroPrazo, setFiltroPrazo] = useState<"todos" | "atrasadas" | "urgentes">("todos");
  const [detalhe, setDetalhe] = useState<ProjetoLocal | null>(null);

  const precisaFollowup = (p: ProjetoLocal) => p.status === "orcamento" && !!p.enviado_em && p.followup_status !== "feito" && Date.now() - new Date(p.enviado_em).getTime() >= 3 * 86400000;

  const abrirFollowup = (p: ProjetoLocal) => {
    const telefone = p.cliente_telefone.replace(/\D/g, "");
    if (!telefone) { toast.error("Cadastre o WhatsApp do cliente"); return; }
    window.open(`https://wa.me/55${telefone}?text=${encodeURIComponent(empresa.msgFollowUp)}`, "_blank", "noopener,noreferrer");
    salvarProjeto({ ...p, followup_status: "feito", followup_em: new Date().toISOString(), followup_tentativa_em: new Date().toISOString(), followup_erro: "" });
  };

  const pagamentos = listarPagamentos();

  // Tudo do topo (resumos, contadores e alertas) respeita o filtro de vendedor(a).
  const base = useMemo(() => projetos.filter((p) =>
    vendedora === "todas" ? true :
    vendedora === "__sem__" ? !(p.vendedora ?? "").trim() :
    (p.vendedora ?? "").trim().toLowerCase() === vendedora.trim().toLowerCase()
  ), [projetos, vendedora]);
  const idsBase = useMemo(() => new Set(base.map((p) => p.id)), [base]);
  const pagamentosBase = useMemo(
    () => pagamentos.filter((x) => idsBase.has(x.projeto_id)),
    [pagamentos, idsBase],
  );

  // Resumo do mês (e do mês anterior, para comparar).
  const resumo = useMemo(() => {
    const chave = (iso: string | null) => (iso ? iso.slice(0, 7) : "");
    const agora = new Date();
    const mesAtual = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}`;
    const ant = new Date(agora.getFullYear(), agora.getMonth() - 1, 1);
    const mesAnterior = `${ant.getFullYear()}-${String(ant.getMonth() + 1).padStart(2, "0")}`;

    const calc = (mes: string) => {
      const criados = base.filter((p) => chave(p.created_at) === mes);
      const orcado = criados.reduce((s, p) => s + p.total, 0);
      const aprovado = base
        .filter((p) => chave(p.aprovado_em) === mes)
        .reduce((s, p) => s + p.total, 0);
      const faturado = base
        .filter((p) => chave(p.faturado_em) === mes)
        .reduce((s, p) => s + (p.valor_faturado || 0), 0);
      const recebido = pagamentosBase.filter((p) => p.data.slice(0, 7) === mes).reduce((s, p) => s + p.valor, 0);
      const ticket = criados.length ? orcado / criados.length : 0;
      return { orcado, aprovado, faturado, recebido, ticket, qtd: criados.length };
    };

    const aReceber = base.reduce(
      (s, p) => s + Math.max(0, (p.valor_faturado || 0) - totalRecebido(p.id)),
      0,
    );
    return { atual: calc(mesAtual), anterior: calc(mesAnterior), aReceber };
  }, [base, pagamentosBase]);

  const contagem = useMemo(() => {
    const c: Record<string, number> = {};
    for (const p of base) c[p.status] = (c[p.status] ?? 0) + 1;
    return c;
  }, [base]);

  const alertas = useMemo(() => {
    const abertas = base.filter((p) => p.status !== "entregue" && p.status !== "faturado");
    const atrasadas = abertas
      .filter((p) => (diasRestantes(p.prazo_entrega) ?? 99) < 0)
      .sort((a, b) => (diasRestantes(a.prazo_entrega) ?? 0) - (diasRestantes(b.prazo_entrega) ?? 0));
    const urgentes = abertas
      .filter((p) => {
        const d = diasRestantes(p.prazo_entrega);
        return d !== null && d >= 0 && d <= empresa.limiteVermelhoDias;
      })
      .sort((a, b) => (diasRestantes(a.prazo_entrega) ?? 99) - (diasRestantes(b.prazo_entrega) ?? 99));
    return { atrasadas, urgentes };
  }, [base, empresa]);

  const nomesVendedores = useVendedores();

  const lista = useMemo(() => {
    const q = busca.toLowerCase().trim();
    const filtrados = base.filter((p) => {
      const okBusca = !q || p.nome.toLowerCase().includes(q) || p.cliente.toLowerCase().includes(q);
      const okStatus =
        filtro === "todos" ? true :
        filtro === "abertos" ? p.status !== "faturado" && p.status !== "entregue" :
        p.status === filtro;
      const d = diasRestantes(p.prazo_entrega);
      const aberta = p.status !== "faturado" && p.status !== "entregue";
      const okPrazo =
        filtroPrazo === "todos" ? true :
        filtroPrazo === "atrasadas" ? aberta && d !== null && d < 0 :
        aberta && d !== null && d >= 0 && d <= empresa.limiteVermelhoDias;
      return okBusca && okStatus && okPrazo;
    });
    const peso = (p: ProjetoLocal) => {
      if (p.status === "entregue" || p.status === "faturado") return 9999;
      const d = diasRestantes(p.prazo_entrega);
      return d === null ? 9000 : d;
    };
    return [...filtrados].sort((a, b) => peso(a) - peso(b));
  }, [base, busca, filtro, filtroPrazo, empresa]);

  const avancar = (p: ProjetoLocal) => {
    const prox = proximoStatus(p.status);
    if (!prox) return;
    if (prox === "aprovado") {
      const pendentes = [
        ...pendentesComunsChecklist(p.checklist_respostas ?? {}),
        ...p.pecas.flatMap((peca) => pendentesPecaChecklist(peca.tipologia, peca.checklist_respostas ?? {})),
      ];
      if (pendentes.length > 0) {
        toast.error(`Complete o checklist antes de aprovar (${pendentes.length} pendente${pendentes.length === 1 ? "" : "s"})`);
        navigate(`/app/projeto/${p.id}`, { state: { abrirChecklist: true } });
        return;
      }
    }
    const agora = new Date().toISOString();
    const patch: Partial<ProjetoLocal> = { status: prox };
    if (prox === "aprovado") {
      patch.aprovado_em = agora;
      patch.etapa = "fila";
      patch.etapa_em = agora;
      if (!p.prazo_entrega) patch.prazo_entrega = somarDias(empresa.prazoPadraoDias);
    }
    if (prox === "entregue") patch.entregue_em = agora;
    if (prox === "faturado") {
      patch.faturado_em = agora;
      if (!p.valor_faturado) patch.valor_faturado = p.total;
    }
    salvarProjeto({ ...p, ...patch });
    toast.success(`Ordem em ${STATUS_LABEL[prox]}`);
  };

  const criar = () => {
    const novo = criarOrcamentoRapido();
    navigate(`/app/projeto/${novo.id}`, { state: { novoOrcamento: true } });
  };

  return (
    <section className="container py-6 md:py-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-2xl md:text-3xl">Painel de ordens</h1>
          <p className="text-sm text-muted-foreground">Vermelho é urgente, amarelo merece atenção, verde tem folga.</p>
        </div>
        <Button onClick={criar} className="bg-gradient-orange text-primary-foreground shadow-orange">
          <Plus className="mr-2 h-4 w-4" /> Novo orçamento
        </Button>
      </div>

      {(alertas.atrasadas.length > 0 || alertas.urgentes.length > 0) && (
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          {alertas.atrasadas.length > 0 && (
            <button
              onClick={() => setFiltroPrazo((f) => (f === "atrasadas" ? "todos" : "atrasadas"))}
              className={`rounded-md px-3 py-2 font-medium transition ${
                filtroPrazo === "atrasadas"
                  ? "bg-destructive text-destructive-foreground"
                  : "bg-destructive/15 text-destructive hover:bg-destructive/25"
              }`}
            >
              {alertas.atrasadas.length} ordem(ns) atrasada(s)
            </button>
          )}
          {alertas.urgentes.length > 0 && (
            <button
              onClick={() => setFiltroPrazo((f) => (f === "urgentes" ? "todos" : "urgentes"))}
              className={`rounded-md px-3 py-2 font-medium transition ${
                filtroPrazo === "urgentes"
                  ? "bg-amber-500 text-white"
                  : "bg-amber-500/15 text-amber-500 hover:bg-amber-500/25"
              }`}
            >
              {alertas.urgentes.length} com prazo apertado
            </button>
          )}
        </div>
      )}

      {(alertas.atrasadas.length > 0 || alertas.urgentes.length > 0) && (
        <div className="surface-card mt-4 rounded-lg border border-border p-4">
          <h2 className="font-display text-sm uppercase tracking-wide text-muted-foreground">Prioridades</h2>

          {alertas.atrasadas.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {alertas.atrasadas.map((p) => {
                const d = diasRestantes(p.prazo_entrega) ?? 0;
                return (
                  <Link
                    key={p.id}
                    to={`/app/projeto/${p.id}`}
                    className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm transition hover:border-destructive hover:bg-destructive/15"
                  >
                    <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
                    <span className="min-w-0 flex-1 truncate font-medium">{p.nome}</span>
                    <span className="hidden truncate text-xs text-muted-foreground sm:inline">
                      {p.cliente || "Sem cliente"} · {ETAPA_LABEL[p.etapa]}
                    </span>
                    <span className="shrink-0 rounded bg-destructive px-2 py-0.5 text-xs font-semibold text-destructive-foreground">
                      atrasada há {Math.abs(d)} {Math.abs(d) === 1 ? "dia" : "dias"}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}

          {alertas.urgentes.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {alertas.urgentes.map((p) => {
                const d = diasRestantes(p.prazo_entrega) ?? 0;
                return (
                  <Link
                    key={p.id}
                    to={`/app/projeto/${p.id}`}
                    className="flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm transition hover:border-amber-500 hover:bg-amber-500/15"
                  >
                    <Clock className="h-4 w-4 shrink-0 text-amber-500" />
                    <span className="min-w-0 flex-1 truncate font-medium">{p.nome}</span>
                    <span className="hidden truncate text-xs text-muted-foreground sm:inline">
                      {p.cliente || "Sem cliente"} · {ETAPA_LABEL[p.etapa]}
                    </span>
                    <span className="shrink-0 rounded bg-amber-500 px-2 py-0.5 text-xs font-semibold text-white">
                      {d === 0 ? "vence hoje" : `faltam ${d} ${d === 1 ? "dia" : "dias"}`}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-6">
        {[
          { l: "Orçado no mês", v: resumo.atual.orcado, ant: resumo.anterior.orcado },
          { l: "Aprovado no mês", v: resumo.atual.aprovado, ant: resumo.anterior.aprovado },
          { l: "Faturado no mês", v: resumo.atual.faturado, ant: resumo.anterior.faturado },
          { l: "Recebido no mês", v: resumo.atual.recebido, ant: resumo.anterior.recebido },
          { l: "Ticket médio", v: resumo.atual.ticket, ant: resumo.anterior.ticket },
          { l: "A receber (total)", v: resumo.aReceber, ant: null as number | null },
        ].map((c) => {
          const varia = c.ant && c.ant > 0 ? ((c.v - c.ant) / c.ant) * 100 : null;
          return (
            <div key={c.l} className="surface-card rounded-lg border border-border p-4">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{c.l}</div>
              <div className="font-display text-lg md:text-xl">{formatarBRL(c.v)}</div>
              {varia !== null && (
                <div className={`mt-1 text-[11px] ${varia >= 0 ? "text-emerald-500" : "text-destructive"}`}>
                  {varia >= 0 ? "▲" : "▼"} {Math.abs(varia).toFixed(0)}% vs mês anterior
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {STATUS_ORDEM.map((s) => (
          <button
            key={s}
            onClick={() => setFiltro(s)}
            className={`rounded-md border px-3 py-1.5 text-xs font-medium transition ${
              filtro === s ? STATUS_CORES[s].chipAtivo : `${STATUS_CORES[s].chip} hover:bg-card`
            }`}
          >
            {STATUS_LABEL[s]} <strong className="ml-1">{contagem[s] ?? 0}</strong>
          </button>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por orçamento ou cliente" className="pl-9" />
        </div>
        <Select value={filtro} onValueChange={(v) => setFiltro(v as typeof filtro)}>
          <SelectTrigger className="sm:w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="abertos">Em andamento</SelectItem>
            <SelectItem value="todos">Todas</SelectItem>
            {STATUS_ORDEM.map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={vendedora} onValueChange={setVendedora}>
          <SelectTrigger className="sm:w-56"><SelectValue placeholder="Vendedor(a)" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todos os vendedores</SelectItem>
            <SelectItem value="__sem__">Sem vendedor(a)</SelectItem>
            {nomesVendedores.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {lista.length === 0 && (
          <div className="col-span-full rounded-lg border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
            Nenhuma ordem nesse filtro.
          </div>
        )}
        {lista.map((p) => {
          const cor = corPrazo(p, empresa);
          const cls = CLASSES_PRAZO[cor];
          const recebido = totalRecebido(p.id);
          const prox = proximoStatus(p.status);
          return (
            <div key={p.id} className="surface-card relative cursor-pointer overflow-hidden rounded-lg border border-border transition hover:-translate-y-0.5 hover:border-primary hover:shadow-lg">
              <div className={`h-1.5 w-full ${cls.faixa}`} />
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link to={`/app/projeto/${p.id}`} className="after:absolute after:inset-0 font-display text-sm hover:underline">{p.nome}</Link>
                    <p className="truncate text-xs text-muted-foreground">{p.cliente || "Sem cliente"} · {tipologiaPorId(p.tipologia).nome}</p>
                    {p.vendedora && <p className="truncate text-[11px] text-muted-foreground">Venda: {p.vendedora}</p>}
                    {p.enviado_em && <p className="truncate text-[11px] text-muted-foreground">Enviado em {new Date(p.enviado_em).toLocaleDateString("pt-BR")}</p>}
                  </div>
                  <span className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-medium uppercase ${STATUS_CORES[p.status].badge}`}>
                    {STATUS_LABEL[p.status]}
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <span className={`text-xs font-medium ${cls.texto}`}>{textoPrazo(p)}</span>
                  {(() => {
                    const d = diasRestantes(p.prazo_entrega);
                    if (d === null || p.status === "entregue" || p.status === "faturado") return null;
                    if (d < 0)
                      return (
                        <span className="rounded bg-destructive px-1.5 py-0.5 text-[10px] font-bold uppercase text-destructive-foreground">
                          {Math.abs(d)} d de atraso
                        </span>
                      );
                    if (d <= empresa.limiteVermelhoDias)
                      return (
                        <span className="rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
                          {d === 0 ? "vence hoje" : `faltam ${d} d`}
                        </span>
                      );
                    return null;
                  })()}
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <div><div className="text-[10px] uppercase text-muted-foreground">Orçado</div><div>{formatarBRL(p.total)}</div></div>
                  <div><div className="text-[10px] uppercase text-muted-foreground">Faturado</div><div>{formatarBRL(p.valor_faturado || 0)}</div></div>
                  <div><div className="text-[10px] uppercase text-muted-foreground">Recebido</div><div>{formatarBRL(recebido)}</div></div>
                </div>

                <div className="relative z-10 mt-3 flex flex-wrap gap-1 border-t border-border pt-3">
                  {p.status === "orcamento" ? (
                    <Button size="sm" onClick={() => avancar(p)} className="bg-gradient-orange text-primary-foreground">
                      Aprovar e mandar para a oficina <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  ) : prox ? (
                    <Button size="sm" variant="soft" onClick={() => avancar(p)}>
                      {STATUS_LABEL[prox]} <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  ) : null}

                  <Button size="sm" variant="soft" onClick={() => setDetalhe(p)}>
                    <Wallet className="mr-1 h-3.5 w-3.5" /> Financeiro
                  </Button>
                  <Button size="sm" variant="soft" onClick={() => window.open(`/op/${p.id}`, "_blank")}>
                    <Monitor className="mr-1 h-3.5 w-3.5" /> Oficina
                  </Button>
                  {precisaFollowup(p) && (
                    <Button size="sm" variant="outline" onClick={() => abrirFollowup(p)}>
                      <MessageCircle className="mr-1 h-3.5 w-3.5" /> Retomar no WhatsApp
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8">
        <CalendarioEntregas />
      </div>

      <DialogOrdem projeto={detalhe} onClose={() => setDetalhe(null)} />
    </section>
  );
}

function DialogOrdem({ projeto, onClose }: { projeto: ProjetoLocal | null; onClose: () => void }) {
  useDados();
  const [valor, setValor] = useState("");
  const [data, setData] = useState(dataISO(new Date()));
  const [forma, setForma] = useState("pix");
  const [obs, setObs] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);

  if (!projeto) return null;
  const atual = listarProjetos().find((p) => p.id === projeto.id) ?? projeto;
  const pagos = listarPagamentos(atual.id);
  const recebido = pagos.reduce((s, p) => s + p.valor, 0);
  const saldo = (atual.valor_faturado || 0) - recebido;

  const lancar = async () => {
    const v = numeroMascarado(valor);
    if (!v || v <= 0) { toast.error("Informe o valor recebido"); return; }
    try {
      const pagamento = await adicionarPagamento({ projeto_id: atual.id, data, valor: v, forma, observacao: obs, comprovante_caminho: null, comprovante_nome: null, comprovante_tipo: null, comprovante_enviado_em: null });
      if (arquivo) await anexarComprovante(pagamento.id, atual.id, arquivo);
      setValor(""); setObs("");
      setArquivo(null);
      toast.success("Pagamento lançado");
    } catch { toast.error("Não foi possível lançar o pagamento"); }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-display">{atual.nome}</DialogTitle></DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Situação</Label>
            <Select value={atual.status} onValueChange={(v) => salvarProjeto({ ...atual, status: v as OrdemStatus })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_ORDEM.map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Prazo de entrega</Label>
            <Input type="date" value={atual.prazo_entrega ?? ""} onChange={(e) => salvarProjeto({ ...atual, prazo_entrega: e.target.value || null })} />
          </div>
          <div>
            <Label>Valor orçado</Label>
            <Input value={formatarBRL(atual.total)} readOnly />
          </div>
          <div>
            <Label>Valor faturado</Label>
            <Input
              mask="moeda" value={String(atual.valor_faturado || 0).replace(".", ",")}
              onChange={(e) => salvarProjeto({ ...atual, valor_faturado: numeroMascarado(e.target.value) })}
            />
          </div>
        </div>

        <div className="rounded-lg border border-border p-3 text-sm">
          Recebido <strong>{formatarBRL(recebido)}</strong> · Em aberto{" "}
          <strong className={saldo > 0 ? "text-amber-500" : "text-emerald-500"}>{formatarBRL(saldo)}</strong>
        </div>

        <div className="space-y-2">
          <Label>Lançar pagamento</Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
            <Input mask="moeda" placeholder="0,00" value={valor} onChange={(e) => setValor(e.target.value)} />
            <Select value={forma} onValueChange={setForma}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{FORMAS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
            </Select>
            <Button onClick={lancar} className="bg-gradient-orange text-primary-foreground">Lançar</Button>
          </div>
          <Input maxLength={500} placeholder="Observação (opcional)" value={obs} onChange={(e) => setObs(e.target.value)} />
          <div>
            <Label htmlFor="comprovante">Comprovante de pagamento (pode anexar depois)</Label>
            <Input id="comprovante" type="file" accept="image/*,application/pdf" onChange={(e) => setArquivo(e.target.files?.[0] ?? null)} />
          </div>
        </div>

        {pagos.length > 0 && (
          <div className="space-y-1 text-sm">
            {pagos.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded border border-border px-3 py-1.5">
                <span>{new Date(p.data + "T00:00:00").toLocaleDateString("pt-BR")} · {p.forma}{p.observacao ? ` · ${p.observacao}` : ""}</span>
                <span className="flex items-center gap-2">
                  <strong>{formatarBRL(p.valor)}</strong>
                  {p.comprovante_caminho ? (
                    <Button size="sm" variant="outline" onClick={() => void abrirComprovante(p.comprovante_caminho ?? "")}><ExternalLink className="mr-1 h-3.5 w-3.5" /> Ver</Button>
                  ) : (
                    <label className="inline-flex min-h-9 cursor-pointer items-center rounded border border-border px-2 text-xs font-medium hover:border-primary">
                      <Upload className="mr-1 h-3.5 w-3.5" /> Anexar
                      <input className="sr-only" type="file" accept="image/*,application/pdf" onChange={(e) => { const f = e.target.files?.[0]; if (f) void anexarComprovante(p.id, atual.id, f).then(() => toast.success("Comprovante anexado")).catch(() => toast.error("Não foi possível anexar")); }} />
                    </label>
                  )}
                  <Button size="sm" variant="dangerOutline" onClick={() => removerPagamento(p.id)}>Excluir</Button>
                </span>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
