import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
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
  ProjetoLocal, listarProjetos, obterEmpresa, salvarProjeto, formatarBRL,
  listarPagamentos, totalRecebido, adicionarPagamento, removerPagamento, OrdemStatus,
} from "@/lib/storage";
import {
  STATUS_LABEL, STATUS_ORDEM, proximoStatus, corPrazo, CLASSES_PRAZO, textoPrazo,
  diasRestantes, somarDias, dataISO,
} from "@/lib/ordens";
import { tipologiaPorId } from "@/lib/tipologias";

const FORMAS = ["pix", "dinheiro", "cartão", "boleto", "transferência"];

export default function Painel() {
  useDados();
  const projetos = listarProjetos();
  const empresa = obterEmpresa();
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<"todos" | OrdemStatus | "abertos">("abertos");
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

  const lista = useMemo(() => {
    const q = busca.toLowerCase().trim();
    const filtrados = projetos.filter((p) => {
      const okBusca = !q || p.nome.toLowerCase().includes(q) || p.cliente.toLowerCase().includes(q);
      const okStatus =
        filtro === "todos" ? true :
        filtro === "abertos" ? p.status !== "faturado" && p.status !== "entregue" :
        p.status === filtro;
      return okBusca && okStatus;
    });
    const peso = (p: ProjetoLocal) => {
      if (p.status === "entregue" || p.status === "faturado") return 9999;
      const d = diasRestantes(p.prazo_entrega);
      return d === null ? 9000 : d;
    };
    return [...filtrados].sort((a, b) => peso(a) - peso(b));
  }, [projetos, busca, filtro]);

  const avancar = (p: ProjetoLocal) => {
    const prox = proximoStatus(p.status);
    if (!prox) return;
    const agora = new Date().toISOString();
    const patch: Partial<ProjetoLocal> = { status: prox };
    if (prox === "aprovado") {
      patch.aprovado_em = agora;
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

  return (
    <section className="container py-6 md:py-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-2xl md:text-3xl">Painel de ordens</h1>
          <p className="text-sm text-muted-foreground">Vermelho é urgente, amarelo merece atenção, verde tem folga.</p>
        </div>
        <Button asChild className="bg-gradient-orange text-primary-foreground shadow-orange">
          <Link to="/app/projetos"><Plus className="mr-2 h-4 w-4" /> Novo orçamento</Link>
        </Button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          { l: "Orçado", v: totais.orcado },
          { l: "Aprovado", v: totais.aprovado },
          { l: "Faturado", v: totais.faturado },
          { l: "Recebido", v: totais.recebido },
          { l: "A receber", v: totais.saldo },
        ].map((c) => (
          <div key={c.l} className="surface-card rounded-lg border border-border p-4">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{c.l}</div>
            <div className="font-display text-lg md:text-xl">{formatarBRL(c.v)}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por projeto ou cliente" className="pl-9" />
        </div>
        <Select value={filtro} onValueChange={(v) => setFiltro(v as typeof filtro)}>
          <SelectTrigger className="sm:w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="abertos">Em andamento</SelectItem>
            <SelectItem value="todos">Todas</SelectItem>
            {STATUS_ORDEM.map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}
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
            <div key={p.id} className="surface-card overflow-hidden rounded-lg border border-border">
              <div className={`h-1.5 w-full ${cls.faixa}`} />
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link to={`/app/projeto/${p.id}`} className="font-display text-sm hover:underline">{p.nome}</Link>
                    <p className="truncate text-xs text-muted-foreground">{p.cliente || "Sem cliente"} · {tipologiaPorId(p.tipologia).nome}</p>
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

                <div className="mt-3 flex flex-wrap gap-1 border-t border-border pt-3">
                  {prox && (
                    <Button size="sm" variant="ghost" onClick={() => avancar(p)}>
                      {STATUS_LABEL[prox]} <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => setDetalhe(p)}>
                    <Wallet className="mr-1 h-3.5 w-3.5" /> Financeiro
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => window.open(`/op/${p.id}`, "_blank")}>
                    <Monitor className="mr-1 h-3.5 w-3.5" /> Oficina
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
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
