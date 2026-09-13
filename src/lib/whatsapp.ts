// Abertura de conversa no WhatsApp Web/App com o texto do orçamento.
import type { DadosEmpresa, ProjetoLocal } from "./storage";
import { formatarBRL } from "./storage";
import { cm } from "./medidas";
import { tipologiaPorId } from "./tipologias";

/** Só os dígitos, já com DDI 55 quando o número é nacional. */
export function numeroWhatsApp(telefone: string | null | undefined): string | null {
  const d = (telefone ?? "").replace(/\D/g, "");
  if (d.length < 10) return null;
  return d.startsWith("55") ? d : `55${d}`;
}

/** Mensagem padrão do envio do orçamento, com resumo das peças, total e link do PDF. */
export function textoOrcamento(projeto: ProjetoLocal, total: number, empresa: DadosEmpresa, linkPdf?: string): string {
  const pecas = projeto.pecas
    .map((p) => `• ${p.nome} — ${tipologiaPorId(p.tipologia).nome} ${cm(p.largura_mm)} × ${cm(p.altura_mm)} cm`)
    .join("\n");
  const prazo = projeto.prazo_dias_uteis ?? empresa.prazoDiasUteis ?? 22;
  const primeiroNome = (projeto.cliente || "").trim().split(" ")[0];
  return [
    `Olá${primeiroNome ? ` ${primeiroNome}` : ""}, tudo bem? Aqui é da ${empresa.nome || "serralheria"}.`,
    "",
    `Segue o orçamento ${projeto.nome || ""} (nº ${projeto.id.slice(0, 6).toUpperCase()}):`,
    pecas,
    "",
    `Total: ${formatarBRL(total)}`,
    `Prazo de entrega: aproximadamente ${prazo} dias úteis após a confirmação do pagamento da entrada.`,
    `Validade do orçamento: ${empresa.validadeDias ?? 5} dias corridos.`,
    "",
    linkPdf ? `Orçamento em PDF: ${linkPdf}` : "Vou enviar o PDF completo em seguida.",
    "Qualquer dúvida, estou à disposição!",
  ].filter((l) => l !== undefined).join("\n");
}

export function linkWhatsApp(numero: string, texto: string): string {
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
}

export function abrirWhatsApp(numero: string, texto: string): void {
  window.open(linkWhatsApp(numero, texto), "_blank", "noopener,noreferrer");
}
