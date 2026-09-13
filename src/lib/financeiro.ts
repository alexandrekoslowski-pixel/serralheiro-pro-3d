// Uma única conta de dinheiro para todo o sistema: a cobrar, recebido e em aberto.
import { ProjetoLocal, Pagamento, totalRecebido } from "./storage";
import { totalComServicos } from "./ordens";

const CENTAVO = 0.01;

/**
 * Valor que a ordem deve gerar de caixa.
 * Usa o valor faturado quando lançado; senão o valor do orçamento (peças + serviços + frete)
 * a partir da aprovação. Orçamento ainda não aprovado não entra no financeiro.
 */
export function valorACobrar(p: ProjetoLocal): number {
  if (p.valor_faturado > 0) return p.valor_faturado;
  return p.status === "orcamento" ? 0 : totalComServicos(p);
}

export const recebidoDe = (projetoId: string): number => totalRecebido(projetoId);

/** Quanto ainda falta entrar nessa ordem (nunca negativo). */
export function saldoDe(p: ProjetoLocal): number {
  return Math.max(0, Number((valorACobrar(p) - recebidoDe(p.id)).toFixed(2)));
}

export function quitado(p: ProjetoLocal): boolean {
  const alvo = valorACobrar(p);
  return alvo > 0 && recebidoDe(p.id) >= alvo - CENTAVO;
}

/** Entrou dinheiro sem comprovante anexado. */
export const recebidoSemComprovante = (pagamentos: Pagamento[]): boolean =>
  pagamentos.some((x) => x.valor > 0 && !x.comprovante_caminho);
