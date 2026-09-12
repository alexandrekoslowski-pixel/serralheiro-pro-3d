// Progresso do orçamento até virar ordem na oficina (para as vendedoras).
import { ProjetoLocal, Pagamento } from "./storage";

export type EstadoMarco = "feito" | "pendente" | "atrasado" | "neutro";

export type TipoPendencia = "enviar" | "retorno" | "comprovante" | "fila";

export interface Marco {
  id: "criado" | "enviado" | "retorno" | "comprovante" | "fila";
  label: string;
  estado: EstadoMarco;
  detalhe: string;
}

export interface Progresso {
  marcos: Marco[];
  pendencias: TipoPendencia[];
  /** Há quantos dias a ordem está parada no ponto pendente. */
  diasParado: number;
}

export const ROTULO_PENDENCIA: Record<TipoPendencia, string> = {
  enviar: "Enviar ao cliente",
  retorno: "Retorno de 3 dias",
  comprovante: "Anexar comprovante",
  fila: "Mandar para a oficina",
};

const DIA = 86400000;

const dias = (iso: string | null | undefined): number =>
  iso ? Math.floor((Date.now() - new Date(iso).getTime()) / DIA) : 0;

const dataBR = (iso: string | null | undefined): string =>
  iso ? new Date(iso).toLocaleDateString("pt-BR") : "";

/** Retorno de 3 dias vencido e ainda não feito. */
export function retornoVencido(p: ProjetoLocal): boolean {
  return (
    p.status === "orcamento" &&
    !!p.enviado_em &&
    p.followup_status !== "feito" &&
    dias(p.enviado_em) >= 3
  );
}

export function temComprovante(pagamentos: Pagamento[]): boolean {
  return pagamentos.some((x) => !!x.comprovante_caminho);
}

/**
 * Calcula os marcos e o que falta fazer.
 * `pagamentos` deve ser a lista de pagamentos dessa ordem.
 */
export function progressoOrcamento(p: ProjetoLocal, pagamentos: Pagamento[]): Progresso {
  const aprovado = p.status !== "orcamento";
  const naOficina = aprovado;
  const comprovanteOk = temComprovante(pagamentos);
  const pendencias: TipoPendencia[] = [];
  let diasParado = 0;

  const criado: Marco = { id: "criado", label: "Criado", estado: "feito", detalhe: dataBR(p.created_at) };

  const enviado: Marco = p.enviado_em
    ? { id: "enviado", label: "Enviado", estado: "feito", detalhe: dataBR(p.enviado_em) }
    : aprovado
      ? { id: "enviado", label: "Enviado", estado: "neutro", detalhe: "não registrado" }
      : { id: "enviado", label: "Enviado", estado: "pendente", detalhe: "falta enviar" };
  if (!p.enviado_em && !aprovado) {
    pendencias.push("enviar");
    diasParado = Math.max(diasParado, dias(p.created_at));
  }

  let retorno: Marco;
  if (aprovado) {
    retorno = { id: "retorno", label: "Retorno", estado: "neutro", detalhe: "não precisa" };
  } else if (p.followup_status === "feito") {
    retorno = { id: "retorno", label: "Retorno", estado: "feito", detalhe: dataBR(p.followup_em) };
  } else if (retornoVencido(p)) {
    const d = dias(p.enviado_em);
    retorno = { id: "retorno", label: "Retorno", estado: "atrasado", detalhe: `enviado há ${d} d` };
    pendencias.push("retorno");
    diasParado = Math.max(diasParado, d);
  } else if (p.enviado_em) {
    const faltam = 3 - dias(p.enviado_em);
    retorno = { id: "retorno", label: "Retorno", estado: "pendente", detalhe: `em ${Math.max(0, faltam)} d` };
  } else {
    retorno = { id: "retorno", label: "Retorno", estado: "neutro", detalhe: "após o envio" };
  }

  let comprovante: Marco;
  if (!aprovado) {
    comprovante = { id: "comprovante", label: "Comprovante", estado: "neutro", detalhe: "após aprovar" };
  } else if (comprovanteOk) {
    comprovante = { id: "comprovante", label: "Comprovante", estado: "feito", detalhe: "anexado" };
  } else {
    const d = dias(p.aprovado_em);
    comprovante = { id: "comprovante", label: "Comprovante", estado: d >= 2 ? "atrasado" : "pendente", detalhe: "falta anexar" };
    pendencias.push("comprovante");
    diasParado = Math.max(diasParado, d);
  }

  const fila: Marco = naOficina
    ? { id: "fila", label: "Na oficina", estado: "feito", detalhe: dataBR(p.aprovado_em) }
    : { id: "fila", label: "Na oficina", estado: "neutro", detalhe: "após aprovar" };

  return { marcos: [criado, enviado, retorno, comprovante, fila], pendencias, diasParado };
}
