import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Copy, Trash2, FolderOpen, Search, Send, MessageCircle, Upload, Wrench, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  deletarProjeto, duplicarProjeto, criarOrcamentoRapido,
  listarProjetos, formatarBRL, listarPagamentos, obterEmpresa, salvarProjeto, type ProjetoLocal,
} from "@/lib/storage";
import { progressoOrcamento, ROTULO_PENDENCIA, type TipoPendencia } from "@/lib/progressoOrcamento";
import { TrilhaOrcamento } from "@/components/TrilhaOrcamento";
import { PassosOrcamento } from "@/components/PassosOrcamento";
import { tipologiaPorId } from "@/lib/tipologias";
import { STATUS_LABEL, somarDias, totalComServicos } from "@/lib/ordens";
import { useDados } from "@/hooks/useDados";
import { cm } from "@/lib/medidas";
import { DialogOrdemFinanceiro } from "@/components/DialogOrdemFinanceiro";
import { pendentesComunsChecklist, pendentesPecaChecklist } from "@/lib/checklistPedido";
import { useSessao } from "@/lib/sessao";

export default function ProjetosLista() {
  const navigate = useNavigate();
  const { session } = useSessao();
  useDados();
  const projetos = listarProjetos();
  const [busca, setBusca] = useState("");
  const [pend, setPend] = useState<TipoPendencia | null>(null);
  const [ordem, setOrdem] = useState<"recentes" | "parados">("recentes");
  const [detalhe, setDetalhe] = useState<ProjetoLocal | null>(null);
  const pagamentos = listarPagamentos();
  const empresa = obterEmpresa();

  const progressos = useMemo(() => {
    const porOrdem = new Map<string, typeof pagamentos>();
    for (const x of pagamentos) {
      const atual = porOrdem.get(x.projeto_id) ?? [];
      atual.push(x);
      porOrdem.set(x.projeto_id, atual);
    }
    return new Map(projetos.map((p) => [p.id, progressoOrcamento(p, porOrdem.get(p.id) ?? [])]));
  }, [projetos, pagamentos]);

  const contagemPend = useMemo(() => {
    const c: Record<TipoPendencia, number> = { enviar: 0, retorno: 0, comprovante: 0, fila: 0 };
    for (const prog of progressos.values()) for (const t of prog.pendencias) c[t] += 1;
    return c;
  }, [progressos]);

  const pendencias = useMemo(() => {
    const itens: { tipo: TipoPendencia; projeto: ProjetoLocal; dias: number }[] = [];
    for (const projeto of projetos) {
      const progresso = progressos.get(projeto.id);
      if (!progresso) continue;
      for (const tipo of progresso.pendencias) itens.push({ tipo, projeto, dias: progresso.diasParado });
    }
    return itens.sort((a, b) => b.dias - a.dias);
  }, [projetos, progressos]);

  const pendenciasVisiveis = pend ? pendencias.filter((item) => item.tipo === pend) : pendencias;

  const marcarEnviado = (p: ProjetoLocal) => {
    salvarProjeto({ ...p, enviado_em: new Date().toISOString(), followup_status: "aguardando", followup_em: null });
    toast.success("Envio registrado — retorno em 3 dias, se precisar");
  };

  const abrirFollowup = (p: ProjetoLocal) => {
    const telefone = p.cliente_telefone.replace(/\D/g, "");
    if (!telefone) { toast.error("Cadastre o WhatsApp do cliente"); return; }
    window.open(`https://wa.me/55${telefone}?text=${encodeURIComponent(empresa.msgFollowUp)}`, "_blank", "noopener,noreferrer");
    salvarProjeto({ ...p, followup_status: "feito", followup_em: new Date().toISOString(), followup_tentativa_em: new Date().toISOString(), followup_erro: "" });
  };

  const mandarParaOficina = (p: ProjetoLocal) => {
    const pendentes = [
      ...pendentesComunsChecklist(p.checklist_respostas ?? {}),
      ...p.pecas.flatMap((peca) => pendentesPecaChecklist(peca.tipologia, peca.checklist_respostas ?? {})),
    ];
    if (pendentes.length > 0) {
      toast.error(`Complete o checklist antes de aprovar (${pendentes.length} pendente${pendentes.length === 1 ? "" : "s"})`);
      navigate(`/app/projeto/${p.id}`, { state: { abrirChecklist: true } });
      return;
    }
    const agora = new Date().toISOString();
    salvarProjeto({
      ...p,
      status: "aprovado",
      aprovado_em: p.aprovado_em ?? agora,
      aguardando_oficina: false,
      etapa: "fila",
      etapa_em: agora,
      prazo_entrega: p.prazo_entrega ?? somarDias(empresa.prazoPadraoDias),
    });
    toast.success("Ordem enviada para a oficina");
  };

  const aprovar = (p: ProjetoLocal) => {
    const agora = new Date().toISOString();
    salvarProjeto({
      ...p,
      status: "aprovado",
      aprovado_em: p.aprovado_em ?? agora,
      aguardando_oficina: true,
      etapa: "fila",
      etapa_em: agora,
      prazo_entrega: p.prazo_entrega ?? somarDias(empresa.prazoPadraoDias),
    });
    toast.success("Orçamento aprovado");
  };

  const filtrados = useMemo(() => {
    const q = busca.toLowerCase().trim();
    const lista = projetos.filter((p) => {
      const okBusca = !q || p.nome.toLowerCase().includes(q) || p.cliente.toLowerCase().includes(q);
      const okPend = !pend || (progressos.get(p.id)?.pendencias.includes(pend) ?? false);
      return okBusca && okPend;
    });
    if (ordem === "parados") {
      return [...lista].sort((a, b) => (progressos.get(b.id)?.diasParado ?? 0) - (progressos.get(a.id)?.diasParado ?? 0));
    }
    return lista;
  }, [projetos, busca, pend, ordem, progressos]);

  const criar = () => {
    const vendedor = (session?.user.user_metadata?.nome as string | undefined) ?? session?.user.email ?? "";
    const novo = criarOrcamentoRapido(vendedor);
    navigate(`/app/projeto/${novo.id}`, { state: { novoOrcamento: true } });
  };

  const duplicar = (id: string) => {
    if (duplicarProjeto(id)) toast.success("Orçamento duplicado");
  };

  const remover = (id: string) => {
    deletarProjeto(id);
    toast.success("Orçamento excluído");
  };

  return (
    <section className="container py-6 md:py-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-2xl md:text-3xl">Orçamentos</h1>
          <p className="text-sm text-muted-foreground">Tudo salvo localmente neste navegador.</p>
        </div>
        <Button onClick={criar} className="bg-gradient-orange text-primary-foreground shadow-orange hover:opacity-90">
          <Plus className="mr-2 h-4 w-4" /> Novo orçamento
        </Button>
      </div>

      <div className="mt-6 relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome ou cliente" className="pl-9" />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        {(["enviar", "retorno", "comprovante", "fila"] as TipoPendencia[])
          .filter((t) => contagemPend[t] > 0)
          .map((t) => (
            <Button
              key={t}
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setPend((f) => (f === t ? null : t))}
              className={pend === t ? "border-primary bg-primary/15 text-foreground" : "text-muted-foreground"}
            >
              {ROTULO_PENDENCIA[t]} <strong className="ml-1">{contagemPend[t]}</strong>
            </Button>
          ))}
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setOrdem((o) => (o === "parados" ? "recentes" : "parados"))}
          className={ordem === "parados" ? "border-primary bg-primary/15 text-foreground" : "text-muted-foreground"}
        >
          Parados há mais tempo
        </Button>
      </div>

      <section className="mt-4 border-y border-border py-4" aria-labelledby="tarefas-vendas">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 id="tarefas-vendas" className="font-display text-lg">O que falta fazer</h2>
            <p className="text-xs text-muted-foreground">Mais antigos primeiro</p>
          </div>
          <span className="text-sm font-medium text-muted-foreground">{pendenciasVisiveis.length} pendência(s)</span>
        </div>

        {pendenciasVisiveis.length === 0 ? (
          <p className="mt-4 flex items-center gap-2 text-sm text-emerald-500">
            <CheckCircle2 className="h-4 w-4" /> Tudo em dia — nenhum orçamento parado.
          </p>
        ) : (
          <div className="mt-3 divide-y divide-border border-y border-border">
            {pendenciasVisiveis.map(({ tipo, projeto: p, dias }) => (
              <div key={`${tipo}-${p.id}`} className="grid gap-3 py-3 md:grid-cols-[minmax(0,1.5fr)_minmax(120px,.7fr)_auto_auto] md:items-center">
                <div className="min-w-0">
                  <Link to={`/app/projeto/${p.id}`} className="block truncate font-medium hover:underline">{p.cliente || p.nome}</Link>
                  <p className="truncate text-xs text-muted-foreground">{p.nome}{p.vendedora ? ` · Venda: ${p.vendedora}` : " · Sem vendedor(a)"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">{ROTULO_PENDENCIA[tipo]}</p>
                  <p className="text-xs text-muted-foreground">{formatarBRL(totalComServicos(p))}</p>
                </div>
                <span className={`w-fit rounded px-2 py-1 text-xs ${dias >= 3 ? "bg-destructive/15 text-destructive" : "bg-muted text-muted-foreground"}`}>
                  parado há {dias} {dias === 1 ? "dia" : "dias"}
                </span>
                <div className="flex md:justify-end">
                  {tipo === "enviar" && <Button size="sm" variant="soft" onClick={() => marcarEnviado(p)}><Send className="mr-1 h-3.5 w-3.5" /> Marcar como enviado</Button>}
                  {tipo === "retorno" && <Button size="sm" variant="outline" onClick={() => abrirFollowup(p)}><MessageCircle className="mr-1 h-3.5 w-3.5" /> Retomar no WhatsApp</Button>}
                  {tipo === "comprovante" && <Button size="sm" variant="soft" onClick={() => setDetalhe(p)}><Upload className="mr-1 h-3.5 w-3.5" /> Anexar comprovante</Button>}
                  {tipo === "fila" && <Button size="sm" variant="soft" onClick={() => mandarParaOficina(p)}><Wrench className="mr-1 h-3.5 w-3.5" /> Mandar para a oficina</Button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtrados.length === 0 && (
          <div className="surface-card col-span-full grid place-items-center rounded-lg border border-dashed border-border p-12 text-center">
            <FolderOpen className="h-8 w-8 text-muted-foreground" />
            <p className="mt-3 font-display">Nenhum orçamento ainda</p>
            <p className="mt-1 text-sm text-muted-foreground">Clique em "Novo orçamento" para começar.</p>
          </div>
        )}
        {filtrados.map((p) => {
          const tip = tipologiaPorId(p.tipologia);
          return (
            <div key={p.id} className="surface-card rounded-lg border border-border p-4 transition hover:-translate-y-0.5 hover:border-primary hover:shadow-lg">
              <Link to={`/app/projeto/${p.id}`} className="block">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-display text-sm truncate">{p.nome}</h3>
                    <p className="text-xs text-muted-foreground truncate">{p.cliente || "Sem cliente"}</p>
                  </div>
                  <span className="rounded bg-card px-2 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">
                    {tip.nome.split(" ")[0]}
                  </span>
                </div>
                <div className="mt-3 text-xs text-muted-foreground">
                  {cm(p.largura_mm)} × {cm(p.altura_mm)} cm · {p.cor} · {STATUS_LABEL[p.status]}
                </div>
                <div className="mt-3 flex items-end justify-between">
                  <div>
                    <div className="text-[10px] uppercase text-muted-foreground">Total</div>
                    <div className="font-display text-lg text-gradient-orange">{formatarBRL(totalComServicos(p))}</div>
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {new Date(p.updated_at).toLocaleDateString("pt-BR")}
                  </div>
                </div>
                <TrilhaOrcamento compacta className="mt-3" marcos={progressos.get(p.id)?.marcos ?? []} />
                {(progressos.get(p.id)?.pendencias.length ?? 0) > 0 && (
                  <p className="mt-1.5 text-[11px] font-medium text-amber-500">
                    Falta: {progressos.get(p.id)!.pendencias.map((t) => ROTULO_PENDENCIA[t]).join(" · ")}
                  </p>
                )}
              </Link>
              <PassosOrcamento
                className="mt-3"
                somenteProximo
                projeto={p}
                pagamentos={pagamentos.filter((x) => x.projeto_id === p.id)}
                onPasso={(id) => {
                  if (id === "enviar") marcarEnviado(p);
                  else if (id === "aprovar") aprovar(p);
                  else if (id === "comprovante") setDetalhe(p);
                  else if (id === "oficina") mandarParaOficina(p);
                  else navigate(`/app/projeto/${p.id}`);
                }}
              />
              <div className="mt-3 flex gap-1 border-t border-border pt-3">
                <Button size="sm" variant="soft" onClick={() => duplicar(p.id)}>
                  <Copy className="mr-1 h-3.5 w-3.5" /> Duplicar
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="dangerOutline">
                      <Trash2 className="mr-1 h-3.5 w-3.5" /> Excluir
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir orçamento?</AlertDialogTitle>
                      <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => remover(p.id)}>Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          );
        })}
      </div>
      <DialogOrdemFinanceiro projeto={detalhe} foco="comprovante" onClose={() => setDetalhe(null)} />
    </section>
  );
}
