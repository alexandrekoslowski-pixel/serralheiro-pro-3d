// Geração do PDF da proposta comercial (orçamento + condições).
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ResultadoCalculo } from "./calculator";
import { ProjetoLocal, DadosEmpresa, formatarBRL } from "./storage";
import { acabamentoPorId, tipologiaPorId } from "./tipologias";
import { cm } from "@/lib/medidas";
import { fixacaoTipo, fixacaoLados } from "./fixacao";
import { linhasChecklistProjeto } from "./checklistPedido";
import { enderecoCompleto } from "@/lib/endereco";
import { automacaoPolitica } from "./politicaPrecos";

const ORANGE: [number, number, number] = [232, 97, 44];
const DARK: [number, number, number] = [40, 35, 32];
const GRAY: [number, number, number] = [110, 110, 110];



export interface AssinaturaInfo {
  dataUrl: string;
  nome: string;
}

/** Soma dias úteis (pula sábado e domingo) a partir de hoje. */
export function somarDiasUteis(dias: number, base = new Date()): Date {
  const d = new Date(base);
  let restantes = Math.max(0, Math.round(dias));
  while (restantes > 0) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) restantes--;
  }
  return d;
}

/** Faixa de parcelamento aplicável ao total da proposta. */
export function faixaParcelamento(total: number): string {
  if (total > 4000) return "Acima de R$ 4.000,00: metade no PIX e a outra metade em até 5x sem juros.";
  if (total > 3000) return "Acima de R$ 3.000,00: em até 4x sem juros.";
  if (total > 2000) return "De R$ 2.000,00 a R$ 3.000,00: em até 3x sem juros.";
  if (total > 1000) return "De R$ 1.000,00 a R$ 2.000,00: em até 2x sem juros.";
  return "Até R$ 1.000,00: 1x sem juros.";
}

export function gerarOrcamentoPDF(
  projeto: ProjetoLocal,
  resultado: ResultadoCalculo,
  empresa: DadosEmpresa,
  assinatura?: AssinaturaInfo,
  retornarBlob = false,
): Blob | void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  const larguraUtil = pageW - margin * 2;

  const validadeDias = empresa.validadeDias || 5;
  const prazoDias = projeto.prazo_dias_uteis ?? empresa.prazoDiasUteis ?? 22;
  const checklistComercial = linhasChecklistProjeto(projeto.pecas, projeto.checklist_respostas ?? {}, true);

  // ===== Header =====
  doc.setFillColor(...ORANGE);
  doc.rect(0, 0, pageW, 4, "F");
  doc.setTextColor(...ORANGE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(empresa.nome || "Sua Serralheria", margin, 16);

  doc.setTextColor(...GRAY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const empresaLines = [
    empresa.cnpj ? `CNPJ: ${empresa.cnpj}` : null,
    empresa.telefone ? `Tel: ${empresa.telefone}` : null,
    empresa.email || null,
    empresa.endereco || null,
  ].filter(Boolean) as string[];
  empresaLines.forEach((l, i) => doc.text(l, margin, 22 + i * 4));

  doc.setTextColor(...DARK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  const orcNum = projeto.id.toUpperCase();
  const dataEmissao = new Date().toLocaleDateString("pt-BR");
  const validade = new Date(Date.now() + validadeDias * 24 * 60 * 60 * 1000).toLocaleDateString("pt-BR");
  doc.text(`ORÇAMENTO Nº ${orcNum}`, pageW - margin, 16, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Emissão: ${dataEmissao}`, pageW - margin, 22, { align: "right" });
  doc.text(`Validade: ${validade} (${validadeDias} dias corridos)`, pageW - margin, 26, { align: "right" });

  // ===== Dados do cliente =====
  let y = 42;
  doc.setDrawColor(220);
  doc.setLineWidth(0.2);
  doc.line(margin, y - 4, pageW - margin, y - 4);

  const enderecoLinha = enderecoCompleto(projeto);

  const camposCliente: [string, string][] = [
    ["Cliente", projeto.cliente || "—"],
    ["CPF / CNPJ", projeto.cliente_documento || "—"],
    ["Endereço", enderecoLinha || "—"],
    ["Contato", [projeto.cliente_telefone, projeto.cliente_email].filter(Boolean).join(" · ") || "—"],
  ];
  if (projeto.local_instalacao) camposCliente.push(["Instalação", projeto.local_instalacao]);
  if (projeto.vendedora) camposCliente.push(["Consultora", projeto.vendedora]);

  const alturaBloco = camposCliente.length * 5 + 6;
  doc.setFillColor(248, 246, 244);
  doc.rect(margin, y - 1, larguraUtil, alturaBloco, "F");
  doc.setFontSize(9.5);
  camposCliente.forEach(([label, valor], i) => {
    const ly = y + 4 + i * 5;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK);
    doc.text(label, margin + 3, ly);
    doc.setFont("helvetica", "normal");
    const linhas = doc.splitTextToSize(valor, larguraUtil - 32) as string[];
    doc.text(linhas[0] ?? "—", margin + 27, ly);
  });

  let nextY = y + alturaBloco + 6;

  // ===== Peças =====
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...DARK);
  doc.text("Peças do orçamento", margin, nextY);
  nextY += 2;

  autoTable(doc, {
    startY: nextY + 2,
    head: [["Peça", "Tipologia", "Medidas (cm)", "Cor", "Fixação", "Automação"]],
    body: projeto.pecas.map((pc) => [
      pc.nome,
      tipologiaPorId(pc.tipologia).nome,
      `${cm(pc.largura_mm)} × ${cm(pc.altura_mm)}`,
      acabamentoPorId(pc.cor).nome,
      `${fixacaoTipo(pc.fixacao).curto} · ${fixacaoLados(pc.fixacaoLados).curto}`,
      [pc.automacao_id ? automacaoPolitica(pc.automacao_id)?.nome ?? "" : "", pc.motor_nome || ""]
        .filter(Boolean).join(" · ") || "—",
    ]),
    styles: { fontSize: 8.5, cellPadding: 2 },
    headStyles: { fillColor: DARK, textColor: 255, fontStyle: "bold" },
    margin: { left: margin, right: margin },
  });

  // @ts-expect-error lastAutoTable é fornecido pelo autotable
  nextY = (doc.lastAutoTable?.finalY ?? nextY) + 6;

  // ===== Totais =====
  // O orçamento do cliente mostra apenas o total — sem detalhar perfis, acessórios,
  // vidros, mão de obra ou margem (essas são composições internas de custo).
  // @ts-expect-error lastAutoTable é fornecido pelo autotable
  let yTot = (doc.lastAutoTable?.finalY ?? nextY + 50) + 6;

  doc.setFontSize(10);
  doc.setTextColor(...DARK);
  const escreverLinha = (label: string, valor: number | string, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.text(label, pageW - margin - 70, yTot, { align: "left" });
    doc.text(typeof valor === "number" ? formatarBRL(valor) : valor, pageW - margin, yTot, { align: "right" });
    yTot += 5;
  };
  
  // Serviços aparecem item a item (inclusive os digitados livremente pela vendedora),
  // para o cliente entender cada taxa cobrada.
  const servicos = projeto.servicos_politica ?? [];
  if (servicos.length > 0) {
    servicos.forEach((s) => escreverLinha(s.nome?.trim() || "Serviço adicional", Number(s.valor || 0)));
  } else {
    escreverLinha("Serviços", projeto.servicos_valor != null ? projeto.servicos_valor : "não incluso");
  }
  escreverLinha("Frete", projeto.frete_valor != null ? projeto.frete_valor : "não incluso");

  const totalProposta =
    resultado.totalGeral + (projeto.servicos_valor ?? 0) + (projeto.frete_valor ?? 0);

  yTot += 2;
  doc.setDrawColor(...ORANGE);
  doc.setLineWidth(0.6);
  doc.line(pageW - margin - 70, yTot, pageW - margin, yTot);
  yTot += 7;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...ORANGE);
  doc.text("TOTAL", pageW - margin - 70, yTot);
  doc.text(formatarBRL(totalProposta), pageW - margin, yTot, { align: "right" });

  // ===== Prazo em destaque =====
  yTot += 10;
  const previsao = somarDiasUteis(prazoDias).toLocaleDateString("pt-BR");
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  const prazoLinhas = doc.splitTextToSize(
    `Prazo de entrega: aproximadamente ${prazoDias} dias úteis após a confirmação do pagamento da entrada (previsão ${previsao}).`,
    larguraUtil - 6,
  ) as string[];
  const prazoAlt = 4 + prazoLinhas.length * 4.5;
  doc.setFillColor(248, 246, 244);
  doc.rect(margin, yTot - 4, larguraUtil, prazoAlt, "F");
  doc.setTextColor(...DARK);
  doc.text(prazoLinhas, margin + 3, yTot + 1);
  yTot += prazoAlt + 5;

  // ===== Observações da proposta =====
  if (projeto.observacoes_proposta) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.text("Observações", margin, yTot);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GRAY);
    const obs = doc.splitTextToSize(projeto.observacoes_proposta, larguraUtil) as string[];
    doc.text(obs, margin, yTot + 5);
    yTot += 5 + obs.length * 4 + 4;
  }

  if (checklistComercial.length > 0 && yTot < pageH - 35) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...DARK);
    doc.text("Informações confirmadas", margin, yTot);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GRAY);
    checklistComercial.forEach((item) => {
      const linhas = doc.splitTextToSize(`${item.pergunta}: ${item.resposta}`, larguraUtil) as string[];
      if (yTot + 5 + linhas.length * 4 < pageH - 15) {
        doc.text(linhas, margin, yTot + 5);
        yTot += 5 + linhas.length * 4;
      }
    });
  }

  // ===== Assinatura =====
  if (assinatura?.dataUrl) {
    try {
      const sigW = 70;
      const sigH = 25;
      const sigX = pageW - margin - sigW;
      const sigY = Math.min(yTot + 4, pageH - 45);
      doc.addImage(assinatura.dataUrl, "PNG", sigX, sigY, sigW, sigH);
      doc.setDrawColor(...DARK);
      doc.setLineWidth(0.3);
      doc.line(sigX, sigY + sigH + 1, sigX + sigW, sigY + sigH + 1);
      doc.setTextColor(...DARK);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(assinatura.nome || "Cliente", sigX + sigW / 2, sigY + sigH + 5, { align: "center" });
      doc.setTextColor(...GRAY);
      doc.setFontSize(7);
      doc.text(`Assinado em ${new Date().toLocaleString("pt-BR")}`, sigX + sigW / 2, sigY + sigH + 9, { align: "center" });
    } catch {
      // ignora
    }
  }

  // ===== Página 2: condições =====
  doc.addPage();
  doc.setFillColor(...ORANGE);
  doc.rect(0, 0, pageW, 4, "F");
  let y2 = 18;

  const titulo = (t: string) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...ORANGE);
    doc.text(t.toUpperCase(), margin, y2);
    y2 += 5;
    doc.setDrawColor(230);
    doc.setLineWidth(0.2);
    doc.line(margin, y2 - 2, pageW - margin, y2 - 2);
    y2 += 2;
  };

  const paragrafos = (texto: string, bullet = true) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...DARK);
    texto.split("\n").map((l) => l.trim()).filter(Boolean).forEach((linha) => {
      const prefixo = bullet && !linha.startsWith("•") ? "• " : "";
      const linhas = doc.splitTextToSize(prefixo + linha, larguraUtil) as string[];
      if (y2 + linhas.length * 4.4 > pageH - 18) {
        doc.addPage();
        y2 = 18;
      }
      doc.text(linhas, margin, y2);
      y2 += linhas.length * 4.4 + 1.5;
    });
    y2 += 4;
  };

  titulo("Formas de pagamento");
  paragrafos(empresa.textoPagamento || "");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...ORANGE);
  const faixa = doc.splitTextToSize(`Para este orçamento: ${faixaParcelamento(totalProposta)}`, larguraUtil) as string[];
  doc.text(faixa, margin, y2);
  y2 += faixa.length * 4.4 + 8;

  if (empresa.pixChave) {
    titulo("Pagamento à vista (PIX)");
    paragrafos(
      [
        `Chave PIX: ${empresa.pixChave}`,
        empresa.pixFavorecido ? `Favorecido: ${empresa.pixFavorecido}` : "",
        "Enviar o comprovante de pagamento para o nosso número de atendimento.",
      ].filter(Boolean).join("\n"),
    );
  }

  titulo("Prazo e validade");
  paragrafos(
    [
      `Prazo de entrega de aproximadamente ${prazoDias} dias úteis após a confirmação do pagamento da entrada.`,
      `Orçamento válido por ${validadeDias} dias corridos.`,
      empresa.garantiaDias ? `Garantia de fábrica de ${empresa.garantiaDias} dias.` : "",
      empresa.visitaTecnica
        ? `Visita técnica: ${formatarBRL(empresa.visitaTecnica)}, descontado do total em caso de fechamento da OS.`
        : "",
    ].filter(Boolean).join("\n"),
  );

  titulo("Informações técnicas");
  paragrafos(empresa.textoTecnico || "");

  doc.setTextColor(...GRAY);
  doc.setFontSize(8);
  doc.text(
    `${empresa.nome || "Sua Serralheria"}${empresa.telefone ? " · " + empresa.telefone : ""}${empresa.cnpj ? " · CNPJ " + empresa.cnpj : ""}`,
    margin,
    pageH - 10,
  );

  if (retornarBlob) {
    return doc.output("blob");
  }
  doc.save(`orcamento-${projeto.id}.pdf`);
}
