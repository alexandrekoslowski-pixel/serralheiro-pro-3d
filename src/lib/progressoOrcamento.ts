// Progresso do orçamento até virar ordem na oficina (para as vendedoras).
import { ProjetoLocal, Pagamento } from "./storage";
import { pendentesComunsChecklist, pendentesPecaChecklist } from "./checklistPedido";
import { motorSubdimensionado } from "./politicaPrecos";

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

/** Todo dinheiro que entrou tem comprovante anexado. */
export function temComprovante(pagamentos: Pagamento[]): boolean {
  return pagamentos.some((x) => !!x.comprovante_caminho) && !pagamentos.some((x) => x.valor > 0 && !x.comprovante_caminho);
}

/**
 * Calcula os marcos e o que falta fazer.
 * `pagamentos` deve ser a lista de pagamentos dessa ordem.
 */
export function progressoOrcamento(p: ProjetoLocal, pagamentos: Pagamento[]): Progresso {
  const aprovado = p.status !== "orcamento";
  const naOficina = aprovado && !p.aguardando_oficina;
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

  let fila: Marco;
  if (naOficina) {
    fila = { id: "fila", label: "Na oficina", estado: "feito", detalhe: dataBR(p.aprovado_em) };
  } else if (aprovado) {
    const d = dias(p.aprovado_em);
    fila = { id: "fila", label: "Na oficina", estado: d >= 1 ? "atrasado" : "pendente", detalhe: "falta liberar" };
    pendencias.push("fila");
    diasParado = Math.max(diasParado, d);
  } else {
    fila = { id: "fila", label: "Na oficina", estado: "neutro", detalhe: "após aprovar" };
  }

  return { marcos: [criado, enviado, retorno, comprovante, fila], pendencias, diasParado };
}

// ---------- passos cronológicos da vendedora ----------
export type PassoId = "orcamento" | "enviar" | "aprovar" | "contrato" | "comprovante" | "oficina";

export interface Passo {
  id: PassoId;
  numero: number;
  label: string;
  /** Rótulo quando já foi feito e pode repetir. */
  labelFeito: string;
  feito: boolean;
  detalhe: string;
  atual: boolean;
}

/** Sequência de passos do orçamento até a ordem entrar na oficina. */
export function passosOrcamento(p: ProjetoLocal, pagamentos: Pagamento[]): Passo[] {
  const aprovado = p.status !== "orcamento";
  const base: Omit<Passo, "numero" | "atual">[] = [
    { id: "orcamento", label: "Baixar orçamento", labelFeito: "Baixar de novo", feito: !!p.orcamento_pdf_em, detalhe: dataBR(p.orcamento_pdf_em) },
    { id: "enviar", label: "Enviar no WhatsApp", labelFeito: "Enviar de novo", feito: !!p.enviado_em, detalhe: dataBR(p.enviado_em) },
    { id: "aprovar", label: "Aprovar", labelFeito: "Aprovado", feito: aprovado, detalhe: dataBR(p.aprovado_em) },
    { id: "contrato", label: "Enviar contrato", labelFeito: "Enviar de novo", feito: !!p.contrato_pdf_em, detalhe: dataBR(p.contrato_pdf_em) },
    { id: "comprovante", label: "Anexar comprovante", labelFeito: "Ver comprovante", feito: temComprovante(pagamentos), detalhe: temComprovante(pagamentos) ? "anexado" : "opcional" },
    { id: "oficina", label: "Mandar para a oficina", labelFeito: "Na oficina", feito: aprovado && !p.aguardando_oficina, detalhe: aprovado && !p.aguardando_oficina ? dataBR(p.aprovado_em) : "" },
  ];
  const atualIdx = base.findIndex((x) => !x.feito);
  return base.map((x, i) => ({ ...x, numero: i + 1, atual: i === atualIdx }));
}

/** O que ainda falta na ordem antes de mandar para a oficina (apenas aviso, não bloqueia). */
export function pendenciasOrdem(p: ProjetoLocal, pagamentos: Pagamento[]): string[] {
  const faltas: string[] = [];
  const checklist = [
    ...pendentesComunsChecklist(p.checklist_respostas),
    ...p.pecas.flatMap((pc) => pendentesPecaChecklist(pc.tipologia, pc.checklist_respostas ?? {})),
  ];
  if (checklist.length > 0) faltas.push(`Checklist do pedido com ${checklist.length} resposta(s) em branco`);
  if (pagamentos.some((x) => x.valor > 0 && !x.comprovante_caminho)) faltas.push("Pagamento recebido sem comprovante anexado");
  else if (!temComprovante(pagamentos)) faltas.push("Comprovante de pagamento não anexado");
  if (!p.prazo_entrega) faltas.push("Prazo de entrega não definido");
  if (!(p.cliente_telefone ?? "").trim()) faltas.push("Telefone do cliente em branco");
  if (!(p.cliente_endereco ?? "").trim()) faltas.push("Endereço de instalação em branco");
  if (!p.orcamento_pdf_em) faltas.push("Orçamento em PDF ainda não foi gerado");
  p.pecas.forEach((pc) => {
    if (motorSubdimensionado(pc.largura_mm, pc.altura_mm, pc.motor_porte)) {
      faltas.push(`${pc.nome || "Peça"}: motor subdimensionado para o vão — recomendado PPA 1/2`);
    }
  });
  return faltas;
}
