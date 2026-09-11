import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Wallet, Plus, Search, Monitor } from "lucide-react";
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
  STATUS_LABEL, STATUS_ORDEM, proximoStatus, corPrazo, CLASSES_PRAZO, textoPrazo,
  diasRestantes, somarDias, dataISO,
} from "@/lib/ordens";
import { tipologiaPorId } from "@/lib/tipologias";
import CalendarioEntregas from "@/components/CalendarioEntregas";
import { useVendedores } from "@/hooks/useVendedores";

const FORMAS = ["pix", "dinheiro", "cartão", "boleto", "transferência"];

export default function Painel() {
  const navigate = useNavigate();
  useDados();
  const projetos = listarProjetos();
  const empresa = obterEmpresa();
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<"todos" | OrdemStatus | "abertos">("abertos");
  const [vendedora, setVendedora] = useState("todas");
  const [detalhe, setDetalhe] = useState<ProjetoLocal | null>(null);

  const pagamentos = listarPagamentos();

  // Resumo do mês (e do mês anterior, para comparar).
  const resumo = useMemo(() => {
    const chave = (iso: string | null) => (iso ? iso.slice(0, 7) : "");
    const agora = new Date();
    const mesAtual = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}`;
    const ant = new Date(agora.getFullYear(), agora.getMonth() - 1, 1);
    const mesAnterior = `${ant.getFullYear()}-${String(ant.getMonth() + 1).padStart(2, "0")}`;

    const calc = (mes: string) => {
      const criados = projetos.filter((p) => chave(p.created_at) === mes);
      const orcado = criados.reduce((s, p) => s + p.total, 0);
      const aprovado = projetos
        .filter((p) => chave(p.aprovado_em) === mes)
        .reduce((s, p) => s + p.total, 0);
      const faturado = projetos
        .filter((p) => chave(p.faturado_em) === mes)
        .reduce((s, p) => s + (p.valor_faturado || 0), 0);
      const recebido = pagamentos.filter((p) => p.data.slice(0, 7) === mes).reduce((s, p) => s + p.valor, 0);
      const ticket = criados.length ? orcado / criados.length : 0;
      return { orcado, aprovado, faturado, recebido, ticket, qtd: criados.length };
    };

    const aReceber = projetos.reduce(
      (s, p) => s + Math.max(0, (p.valor_faturado || 0) - totalRecebido(p.id)),
      0,
    );
    return { atual: calc(mesAtual), anterior: calc(mesAnterior), aReceber };
  }, [projetos, pagamentos]);

  const contagem = useMemo(() => {
    const c: Record<string, number> = {};
    for (const p of projetos) c[p.status] = (c[p.status] ?? 0) + 1;
    return c;
  }, [projetos]);

  const alertas = useMemo(() => {
    const abertos = projetos.filter((p) => p.status !== "entregue" && p.status !== "faturado");
    const atrasadas = abertos.filter((p) => (diasRestantes(p.prazo_entrega) ?? 99) < 0).length;
    const urgentes = abertos.filter((p) => {
      const d = diasRestantes(p.prazo_entrega);
      return d !== null && d >= 0 && d <= empresa.limiteVermelhoDias;
    }).length;
    return { atrasadas, urgentes };
  }, [projetos, empresa]);

  const nomesVendedores = useVendedores();

  const lista = useMemo(() => {
    const q = busca.toLowerCase().trim();
    const filtrados = projetos.filter((p) => {
      const okBusca = !q || p.nome.toLowerCase().includes(q) || p.cliente.toLowerCase().includes(q);
      const okStatus =
        filtro === "todos" ? true :
        filtro === "abertos" ? p.status !== "faturado" && p.status !== "entregue" :
        p.status === filtro;
      const okVend =
        vendedora === "todas" ? true :
        vendedora === "__sem__" ? !(p.vendedora ?? "").trim() :
        (p.vendedora ?? "").trim().toLowerCase() === vendedora.trim().toLowerCase();
      return okBusca && okStatus && okVend;
    });
    const peso = (p: ProjetoLocal) => {
      if (p.status === "entregue" || p.status === "faturado") return 9999;
      const d = diasRestantes(p.prazo_entrega);
      return d === null ? 9000 : d;
    };
    return [...filtrados].sort((a, b) => peso(a) - peso(b));
  }, [projetos, busca, filtro, vendedora]);

  const avancar = (p: ProjetoLocal) => {
    const prox = proximoStatus(p.status);
    if (!prox) return;
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

      {(alertas.atrasadas > 0 || alertas.urgentes > 0) && (
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          {alertas.atrasadas > 0 && (
            <button
              onClick={() => setFiltro("abertos")}
              className="rounded-md bg-destructive/15 px-3 py-2 font-medium text-destructive"
            >
              {alertas.atrasadas} ordem(ns) atrasada(s)
            </button>
          )}
          {alertas.urgentes > 0 && (
            <button
              onClick={() => setFiltro("abertos")}
              className="rounded-md bg-amber-500/15 px-3 py-2 font-medium text-amber-500"
            >
              {alertas.urgentes} com prazo apertado
            </button>
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
            className={`rounded-md border px-3 py-1.5 text-xs transition ${
              filtro === s ? "border-primary bg-card" : "border-border text-muted-foreground hover:bg-card"
            }`}
          >
            {STATUS_LABEL[s]} <strong className="ml-1 text-foreground">{contagem[s] ?? 0}</strong>
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
                  </div>
                  <span className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-medium uppercase ${cls.badge}`}>
                    {STATUS_LABEL[p.status]}
                  </span>
                </div>

                <div className={`mt-3 text-xs font-medium ${cls.texto}`}>{textoPrazo(p)}</div>

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

  if (!projeto) return null;
  const atual = listarProjetos().find((p) => p.id === projeto.id) ?? projeto;
  const pagos = listarPagamentos(atual.id);
  const recebido = pagos.reduce((s, p) => s + p.valor, 0);
  const saldo = (atual.valor_faturado || 0) - recebido;

  const lancar = async () => {
    const v = Number(valor.replace(",", "."));
    if (!v || v <= 0) { toast.error("Informe o valor recebido"); return; }
    try {
      await adicionarPagamento({ projeto_id: atual.id, data, valor: v, forma, observacao: obs });
      setValor(""); setObs("");
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
              type="number" step="0.01" value={atual.valor_faturado || 0}
              onChange={(e) => salvarProjeto({ ...atual, valor_faturado: Number(e.target.value) })}
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
            <Input placeholder="Valor" value={valor} onChange={(e) => setValor(e.target.value)} />
            <Select value={forma} onValueChange={setForma}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{FORMAS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
            </Select>
            <Button onClick={lancar} className="bg-gradient-orange text-primary-foreground">Lançar</Button>
          </div>
          <Input placeholder="Observação (opcional)" value={obs} onChange={(e) => setObs(e.target.value)} />
        </div>

        {pagos.length > 0 && (
          <div className="space-y-1 text-sm">
            {pagos.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded border border-border px-3 py-1.5">
                <span>{new Date(p.data + "T00:00:00").toLocaleDateString("pt-BR")} · {p.forma}{p.observacao ? ` · ${p.observacao}` : ""}</span>
                <span className="flex items-center gap-2">
                  <strong>{formatarBRL(p.valor)}</strong>
                  <button className="text-xs text-destructive" onClick={() => removerPagamento(p.id)}>excluir</button>
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
