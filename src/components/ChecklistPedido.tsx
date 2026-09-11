import { useMemo } from "react";
import { AlertCircle, CheckCircle2, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { TipologiaId } from "@/lib/tipologias";
import {
  limparRespostasOcultas, perguntasPendentes, secoesChecklist,
  type RespostasChecklist,
} from "@/lib/checklistPedido";

interface Props {
  tipos: TipologiaId[];
  respostas: RespostasChecklist;
  onChange: (respostas: RespostasChecklist) => void;
  mostrarPendencias?: boolean;
}

export function ChecklistPedido({ tipos, respostas, onChange, mostrarPendencias = false }: Props) {
  const secoes = useMemo(() => secoesChecklist(tipos, respostas), [tipos, respostas]);
  const todas = secoes.flatMap((s) => s.perguntas);
  const pendentes = perguntasPendentes(tipos, respostas);
  const obrigatorias = todas.filter((p) => p.obrigatoria !== false);
  const respondidas = obrigatorias.length - pendentes.length;

  const atualizar = (id: string, valor: string) => {
    const proximas = limparRespostasOcultas(tipos, { ...respostas, [id]: valor.slice(0, 500) });
    onChange(proximas);
  };

  const alternarMultipla = (id: string, opcao: string) => {
    const atuais = (respostas[id] ?? "").split(", ").filter(Boolean);
    const proximas = atuais.includes(opcao) ? atuais.filter((x) => x !== opcao) : [...atuais, opcao];
    atualizar(id, proximas.join(", "));
  };

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

      {secoes.map((secao) => (
        <section key={secao.id} className="space-y-3 border-t border-border pt-4 first:border-0 first:pt-0">
          <h3 className="font-display text-base">{secao.titulo}</h3>
          <div className="grid gap-4 lg:grid-cols-2">
            {secao.perguntas.map((pergunta) => {
              const semResposta = mostrarPendencias && pergunta.obrigatoria !== false && !respostas[pergunta.id]?.trim();
              return (
                <div key={pergunta.id} id={`check-${pergunta.id}`} className={cn("rounded-lg border p-3", semResposta ? "border-destructive/60 bg-destructive/5" : "border-border")}>
                  <Label className="text-sm leading-snug">
                    {pergunta.label}{pergunta.obrigatoria === false && <span className="ml-1 text-muted-foreground">(opcional)</span>}
                  </Label>
                  {pergunta.tipo === "texto" ? (
                    <Input
                      className="mt-2"
                      maxLength={500}
                      value={respostas[pergunta.id] ?? ""}
                      onChange={(e) => atualizar(pergunta.id, e.target.value)}
                      placeholder={pergunta.ajuda ?? "Digite a resposta"}
                    />
                  ) : (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {pergunta.opcoes?.map((op) => {
                        const ativo = pergunta.tipo === "multipla"
                          ? (respostas[pergunta.id] ?? "").split(", ").includes(op)
                          : respostas[pergunta.id] === op;
                        return (
                          <Button
                            key={op}
                            type="button"
                            size="sm"
                            variant={ativo ? "default" : "outline"}
                            className={cn("h-auto min-h-10 whitespace-normal text-left", ativo && "bg-primary text-primary-foreground")}
                            onClick={() => pergunta.tipo === "multipla" ? alternarMultipla(pergunta.id, op) : atualizar(pergunta.id, op)}
                          >
                            {op}
                          </Button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}