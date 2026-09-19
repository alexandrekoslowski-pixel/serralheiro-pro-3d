import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Wallet, Plus, Search, Monitor, AlertTriangle, Clock, MessageCircle, Target, Send } from "lucide-react";
import { useSessao } from "@/lib/sessao";
import { useMeuNome } from "@/hooks/useMeuNome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useDados } from "@/hooks/useDados";
import {
  ProjetoLocal, listarProjetos, obterEmpresa, salvarProjeto, criarOrcamentoRapido, formatarBRL,
  listarPagamentos, OrdemStatus,
} from "@/lib/storage";
import {
  STATUS_LABEL, STATUS_ORDEM, STATUS_CORES, proximoStatus, corPrazo, CLASSES_PRAZO, textoPrazo,
  diasRestantes, ETAPA_LABEL, totalComServicos,
} from "@/lib/ordens";
import { datasSobrecarregadas, proximaDataLivre, dataEntregaSugerida, dataBR, capacidadeDia } from "@/lib/agenda";
import { tipologiaPorId } from "@/lib/tipologias";
import CalendarioEntregas from "@/components/CalendarioEntregas";
import { useVendedores } from "@/hooks/useVendedores";
import { pendentesComunsChecklist, pendentesPecaChecklist } from "@/lib/checklistPedido";
import { progressoOrcamento, ROTULO_PENDENCIA } from "@/lib/progressoOrcamento";
import { TrilhaOrcamento } from "@/components/TrilhaOrcamento";
import { DialogOrdemFinanceiro } from "@/components/DialogOrdemFinanceiro";
import { recebidoDe, saldoDe, valorACobrar } from "@/lib/financeiro";

export default function Painel() {
  const navigate = useNavigate();
  useDados();
  const { papel, session } = useSessao();
  const projetos = listarProjetos();
  const empresa = obterEmpresa();
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<"todos" | OrdemStatus | "abertos">("abertos");
  const [vendedora, setVendedora] = useState("todas");
  const meuNome = useMeuNome();
  const soMinhas = papel === "vendedora";
  const filtroVendedor = soMinhas ? (meuNome || "__sem__") : vendedora;
  const [filtroPrazo, setFiltroPrazo] = useState<"todos" | "atrasadas" | "urgentes">("todos");
  const [detalhe, setDetalhe] = useState<ProjetoLocal | null>(null);

  const marcarEnviado = (p: ProjetoLocal) => {
    salvarProjeto({ ...p, enviado_em: new Date().toISOString(), followup_status: "aguardando", followup_em: null });
    toast.success("Envio registrado — retorno em 3 dias, se precisar");
  };

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
    filtroVendedor === "todas" ? true :
    filtroVendedor === "__sem__" ? !(p.vendedora ?? "").trim() :
    (p.vendedora ?? "").trim().toLowerCase() === filtroVendedor.trim().toLowerCase()
  ), [projetos, filtroVendedor]);
  const idsBase = useMemo(() => new Set(base.map((p) => p.id)), [base]);
  const pagamentosBase = useMemo(
    () => pagamentos.filter((x) => idsBase.has(x.projeto_id)),
    [pagamentos, idsBase],
  );

  // Progresso de cada orçamento (enviado → retorno → comprovante → oficina).
  const progressos = useMemo(() => {
    const porOrdem = new Map<string, typeof pagamentos>();
    for (const x of pagamentosBase) {
      const atual = porOrdem.get(x.projeto_id) ?? [];
      atual.push(x);
      porOrdem.set(x.projeto_id, atual);
    }
    return new Map(base.map((p) => [p.id, progressoOrcamento(p, porOrdem.get(p.id) ?? [])]));
  }, [base, pagamentosBase]);

  // Resumo do mês (e do mês anterior, para comparar).
  const resumo = useMemo(() => {
    const chave = (iso: string | null) => (iso ? iso.slice(0, 7) : "");
    const agora = new Date();
    const mesAtual = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}`;
    const ant = new Date(agora.getFullYear(), agora.getMonth() - 1, 1);
    const mesAnterior = `${ant.getFullYear()}-${String(ant.getMonth() + 1).padStart(2, "0")}`;

    const calc = (mes: string) => {
      const criados = base.filter((p) => chave(p.created_at) === mes);
      const orcado = criados.reduce((s, p) => s + totalComServicos(p), 0);
      const aprovado = base
        .filter((p) => chave(p.aprovado_em) === mes)
        .reduce((s, p) => s + totalComServicos(p), 0);
      const faturado = base
        .filter((p) => chave(p.faturado_em ?? p.aprovado_em) === mes)
        .reduce((s, p) => s + valorACobrar(p), 0);
      const recebido = pagamentosBase.filter((p) => p.data.slice(0, 7) === mes).reduce((s, p) => s + p.valor, 0);
      const ticket = criados.length ? orcado / criados.length : 0;
      return { orcado, aprovado, faturado, recebido, ticket, qtd: criados.length };
    };

    const aReceber = base.reduce((s, p) => s + saldoDe(p), 0);
    return { atual: calc(mesAtual), anterior: calc(mesAnterior), aReceber };
  }, [base, pagamentosBase]);

  // Meta semanal: segunda-feira 00:00 até agora.
  const metaSemana = useMemo(() => {
    const agora = new Date();
    const dia = (agora.getDay() + 6) % 7; // segunda = 0
    const seg = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() - dia);
    const inicio = `${seg.getFullYear()}-${String(seg.getMonth() + 1).padStart(2, "0")}-${String(seg.getDate()).padStart(2, "0")}`;
    const recebido = pagamentosBase.filter((p) => p.data >= inicio).reduce((s, p) => s + p.valor, 0);
    const faturado = base
      .filter((p) => (p.faturado_em ?? p.aprovado_em ?? "") >= inicio)
      .reduce((s, p) => s + valorACobrar(p), 0);
    const meta = empresa.metaSemanal || 0;
    const pct = meta > 0 ? Math.min(100, (recebido / meta) * 100) : 0;
    return { recebido, faturado, meta, pct };
  }, [base, pagamentosBase, empresa.metaSemanal]);

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

  // Dias com mais entregas do que a oficina aguenta.
  const diasCheios = useMemo(() => datasSobrecarregadas(projetos, empresa), [projetos, empresa]);

  const remarcar = (p: ProjetoLocal, nova: string) => {
    salvarProjeto({ ...p, prazo_entrega: nova });
    toast.success(`Entrega de ${p.nome} remarcada para ${dataBR(nova)}`);
  };

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
      patch.etapa = "medicao";
      patch.etapa_em = agora;
      if (!p.prazo_entrega) patch.prazo_entrega = dataEntregaSugerida(projetos, empresa, p.id);
    }
    if (prox === "entregue") patch.entregue_em = agora;
    if (prox === "faturado") {
      patch.faturado_em = agora;
      if (!p.valor_faturado) patch.valor_faturado = totalComServicos(p);
    }
    salvarProjeto({ ...p, ...patch });
    toast.success(`Ordem em ${STATUS_LABEL[prox]}`);
  };

  const criar = () => {
    const vendedor = meuNome || session?.user.email || "";
    const novo = criarOrcamentoRapido(vendedor);
    navigate(`/app/projeto/${novo.id}`, { state: { novoOrcamento: true } });
  };

  return (
    <section className="container py-6 md:py-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-2xl md:text-3xl">Painel de ordens</h1>
          <p className="text-sm text-muted-foreground">Cada ordem mostra por escrito quantos dias faltam para a entrega.</p>
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

      {papel === "gestor" && diasCheios.length > 0 && (
        <div className="surface-card mt-4 rounded-lg border border-amber-500/40 p-4">
          <h2 className="flex items-center gap-2 font-display text-sm uppercase tracking-wide text-muted-foreground">
            <CalendarClock className="h-4 w-4 text-amber-500" /> Entregas concentradas
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            A oficina entrega até {capacidadeDia(empresa)} por dia (segunda a {empresa.entregaSabado === false ? "sexta" : "sábado"}).
          </p>
          <div className="mt-3 space-y-3">
            {diasCheios.map((dia) => (
              <div key={dia.data}>
                <p className="text-sm font-semibold">
                  {dataBR(dia.data)} · {dia.ordens.length} entrega{dia.ordens.length === 1 ? "" : "s"} marcada{dia.ordens.length === 1 ? "" : "s"}
                </p>
                <div className="mt-1.5 space-y-1.5">
                  {dia.ordens.map((p, i) => {
                    const sugerida = proximaDataLivre(dia.data, projetos, empresa, p.id);
                    const precisaMover = i >= dia.capacidade || sugerida !== dia.data;
                    return (
                      <div key={p.id} className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm">
                        <Link to={`/app/projeto/${p.id}`} className="min-w-0 flex-1 truncate font-medium hover:underline">{p.nome}</Link>
                        <span className="truncate text-xs text-muted-foreground">{p.cliente || "Sem cliente"} · {ETAPA_LABEL[p.etapa]}</span>
                        {precisaMover && sugerida !== dia.data && (
                          <Button size="sm" variant="outline" onClick={() => remarcar(p, sugerida)}>
                            Remarcar para {dataBR(sugerida)}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-6">
        {[
          { l: "Orçado no mês", v: resumo.atual.orcado, ant: resumo.anterior.orcado },
          { l: "Aprovado no mês", v: resumo.atual.aprovado, ant: resumo.anterior.aprovado },
          { l: "A cobrar no mês", v: resumo.atual.faturado, ant: resumo.anterior.faturado },
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

      {papel === "gestor" && metaSemana.meta > 0 && (
        <div className="surface-card mt-3 rounded-lg border border-border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 font-display text-sm uppercase tracking-wide text-muted-foreground">
              <Target className="h-4 w-4 text-primary" /> Meta da semana
            </h2>
            <p className="text-sm">
              <span className="font-semibold">{formatarBRL(metaSemana.recebido)}</span>
              <span className="text-muted-foreground"> de {formatarBRL(metaSemana.meta)} recebidos</span>
            </p>
          </div>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all ${metaSemana.pct >= 100 ? "bg-emerald-500" : "bg-primary"}`}
              style={{ width: `${metaSemana.pct}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {metaSemana.pct >= 100
              ? "Meta batida esta semana!"
              : `${metaSemana.pct.toFixed(0)}% da meta · faltam ${formatarBRL(Math.max(0, metaSemana.meta - metaSemana.recebido))}`}
            {" · "}faturado na semana: {formatarBRL(metaSemana.faturado)}
          </p>
        </div>
      )}

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
        {!soMinhas && (
        <Select value={vendedora} onValueChange={setVendedora}>
          <SelectTrigger className="sm:w-56"><SelectValue placeholder="Vendedor(a)" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todos os vendedores</SelectItem>
            <SelectItem value="__sem__">Sem vendedor(a)</SelectItem>
            {nomesVendedores.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        )}
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
          const recebido = recebidoDe(p.id);
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
                    {(progressos.get(p.id)?.pendencias.length ?? 0) > 0 && (
                      <p className="text-[11px] font-medium text-amber-500">
                        Falta: {progressos.get(p.id)!.pendencias.map((t) => ROTULO_PENDENCIA[t]).join(" · ")}
                      </p>
                    )}
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
                  <div><div className="text-[10px] uppercase text-muted-foreground">Orçado</div><div>{formatarBRL(totalComServicos(p))}</div></div>
                  <div><div className="text-[10px] uppercase text-muted-foreground">Recebido</div><div className={recebido > 0 ? "text-emerald-500" : ""}>{formatarBRL(recebido)}</div></div>
                  <div><div className="text-[10px] uppercase text-muted-foreground">Em aberto</div><div className={saldoDe(p) > 0 ? "text-amber-500" : "text-emerald-500"}>{formatarBRL(saldoDe(p))}</div></div>
                </div>

                <TrilhaOrcamento compacta className="mt-3" marcos={progressos.get(p.id)?.marcos ?? []} />

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
                  {p.status === "orcamento" && !p.enviado_em && (
                    <Button size="sm" variant="outline" onClick={() => marcarEnviado(p)}>
                      <Send className="mr-1 h-3.5 w-3.5" /> Marcar como enviado
                    </Button>
                  )}
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

      <DialogOrdemFinanceiro projeto={detalhe} onClose={() => setDetalhe(null)} />
    </section>
  );
}
