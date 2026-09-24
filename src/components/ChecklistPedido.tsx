import { useMemo } from "react";
import { AlertCircle, CheckCircle2, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { TipologiaId } from "@/lib/tipologias";
import {
  limparRespostasOcultasPeca, pendentesComunsChecklist, pendentesPecaChecklist,
  perguntasComunsChecklist, perguntasPecaChecklist,
  type RespostasChecklist,
} from "@/lib/checklistPedido";

interface PecaChecklist {
  id: string;
  nome: string;
  tipologia: TipologiaId;
  checklist_respostas: RespostasChecklist;
}

interface Props {
  pecas: PecaChecklist[];
  selecionadaId: string;
  respostas: RespostasChecklist;
  onChange: (respostas: RespostasChecklist) => void;
  onChangePeca: (id: string, respostas: RespostasChecklist) => void;
  onSelecionarPeca: (id: string) => void;
  mostrarPendencias?: boolean;
  /** Campos extras da peça escolhida (cor, fixação…). */
  extraPeca?: React.ReactNode;
}

export function ChecklistPedido({ pecas, selecionadaId, respostas, onChange, onChangePeca, onSelecionarPeca, mostrarPendencias = false, extraPeca }: Props) {
  const peca = pecas.find((item) => item.id === selecionadaId) ?? pecas[0];
  const perguntasComuns = useMemo(() => perguntasComunsChecklist().filter((q) => !q.comercial), []);
  const perguntasPeca = useMemo(() => perguntasPecaChecklist(peca.tipologia, peca.checklist_respostas).filter((q) => !q.comercial), [peca]);
  const pendentesComuns = pendentesComunsChecklist(respostas);
  const pendentesPecas = pecas.flatMap((item) => pendentesPecaChecklist(item.tipologia, item.checklist_respostas));
  const pendentes = [...pendentesComuns, ...pendentesPecas];
  const obrigatorias = [...perguntasComuns, ...pecas.flatMap((item) => perguntasPecaChecklist(item.tipologia, item.checklist_respostas))].filter((p) => p.obrigatoria !== false && !p.comercial);
  const respondidas = obrigatorias.length - pendentes.length;

  const atualizar = (id: string, valor: string, daPeca: boolean) => {
    if (daPeca) {
      const proximas = limparRespostasOcultasPeca(peca.tipologia, { ...peca.checklist_respostas, [id]: valor.slice(0, 500) });
      onChangePeca(peca.id, proximas);
    } else {
      onChange({ ...respostas, [id]: valor.slice(0, 500) });
    }
  };

  const alternarMultipla = (id: string, opcao: string, daPeca: boolean) => {
    const origem = daPeca ? peca.checklist_respostas : respostas;
    const atuais = (origem[id] ?? "").split(", ").filter(Boolean);
    const proximas = atuais.includes(opcao) ? atuais.filter((x) => x !== opcao) : [...atuais, opcao];
    atualizar(id, proximas.join(", "), daPeca);
  };

  const renderPerguntas = (perguntas: typeof perguntasComuns, valores: RespostasChecklist, daPeca: boolean) => (
    <div className="grid gap-4 lg:grid-cols-2">
      {perguntas.map((pergunta) => {
        const semResposta = mostrarPendencias && pergunta.obrigatoria !== false && !valores[pergunta.id]?.trim();
        return (
          <div key={pergunta.id} id={`check-${daPeca ? peca.id : "comum"}-${pergunta.id}`} className={cn("rounded-lg border p-3", semResposta ? "border-destructive/60 bg-destructive/5" : "border-border")}>
            <Label className="text-sm leading-snug">{pergunta.label}{pergunta.obrigatoria === false && <span className="ml-1 text-muted-foreground">(opcional)</span>}</Label>
            {pergunta.tipo === "texto" ? (
              <Input className="mt-2" maxLength={500} value={valores[pergunta.id] ?? ""} onChange={(e) => atualizar(pergunta.id, e.target.value, daPeca)} placeholder={pergunta.ajuda ?? "Digite a resposta"} />
            ) : (
              <div className="mt-2 flex flex-wrap gap-2">
                {pergunta.opcoes?.map((op) => {
                  const ativo = pergunta.tipo === "multipla" ? (valores[pergunta.id] ?? "").split(", ").includes(op) : valores[pergunta.id] === op;
                  return <Button key={op} type="button" size="sm" variant={ativo ? "default" : "outline"} className={cn("h-auto min-h-10 whitespace-normal text-left", ativo && "bg-primary text-primary-foreground")} onClick={() => pergunta.tipo === "multipla" ? alternarMultipla(pergunta.id, op, daPeca) : atualizar(pergunta.id, op, daPeca)}>{op}</Button>;
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-5">
      <div className={cn("flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3", pendentes.length ? "border-warning/50 bg-warning/5" : "border-success/50 bg-success/5")}>
        <div className="flex items-center gap-2">
          {pendentes.length ? <ClipboardCheck className="h-5 w-5 text-warning" /> : <CheckCircle2 className="h-5 w-5 text-success" />}
          <div>
            <p className="text-sm font-semibold">{respondidas} de {obrigatorias.length} obrigatórias respondidas</p>
            <p className="text-xs text-muted-foreground">As perguntas mudam conforme os serviços deste orçamento.</p>
          </div>
        </div>
        <span className={cn("rounded-full border px-3 py-1 text-xs font-semibold", pendentes.length ? "border-warning/50 text-warning" : "border-success/50 text-success")}>
          {pendentes.length ? `${pendentes.length} pendente${pendentes.length === 1 ? "" : "s"}` : "Completo"}
        </span>
      </div>

      {mostrarPendencias && pendentes.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/5 p-3 text-sm" role="alert">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <span>Preencha os campos destacados antes de mandar a ordem para a oficina.</span>
        </div>
      )}

      <section className="space-y-3"><h3 className="font-display text-base">Informações gerais do orçamento</h3>{renderPerguntas(perguntasComuns, respostas, false)}</section>
      <section className="space-y-3 border-t border-border pt-4">
        <h3 className="font-display text-base">Detalhes técnicos por item</h3>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {pecas.map((item, index) => <Button key={item.id} type="button" variant={item.id === peca.id ? "default" : "outline"} className="shrink-0" onClick={() => onSelecionarPeca(item.id)}>{item.nome}</Button>)}
        </div>
        {extraPeca}
        {perguntasPeca.length ? renderPerguntas(perguntasPeca, peca.checklist_respostas, true) : <p className="text-sm text-muted-foreground">Esta peça não exige perguntas técnicas adicionais.</p>}
      </section>
    </div>
  );
}