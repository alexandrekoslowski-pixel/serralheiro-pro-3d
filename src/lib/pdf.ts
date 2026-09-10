// Geração do PDF de orçamento.
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ResultadoCalculo, ItemCusto } from "./calculator";
import { ProjetoLocal, DadosEmpresa, formatarBRL } from "./storage";
import { tipologiaPorId } from "./tipologias";
import { cm } from "@/lib/medidas";

const ORANGE: [number, number, number] = [232, 97, 44];
const DARK: [number, number, number] = [40, 35, 32];
const GRAY: [number, number, number] = [110, 110, 110];

function rotuloCategoria(c: ItemCusto["categoria"]): string {
  return {
    perfil: "Perfil",
    acessorio: "Acessório",
    vidro: "Vidro",
    mao_obra: "Mão de obra",
    margem: "Margem",
    desconto: "Desconto",
    extra: "Extra",
  }[c];
}

export interface AssinaturaInfo {
  dataUrl: string;
  nome: string;
}

export function gerarOrcamentoPDF(
  projeto: ProjetoLocal,
  resultado: ResultadoCalculo,
  empresa: DadosEmpresa,
  snapshot3D?: string,
  assinatura?: AssinaturaInfo,
  retornarBlob = false,
): Blob | void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;

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
  const validade = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString("pt-BR");
  doc.text(`ORÇAMENTO Nº ${orcNum}`, pageW - margin, 16, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Emissão: ${dataEmissao}`, pageW - margin, 22, { align: "right" });
  doc.text(`Validade: ${validade} (15 dias)`, pageW - margin, 26, { align: "right" });

  // ===== Cliente / Projeto =====
  let y = 44;
  doc.setDrawColor(220);
  doc.setLineWidth(0.2);
  doc.line(margin, y - 4, pageW - margin, y - 4);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...DARK);
  doc.text("Cliente", margin, y);
  doc.setFont("helvetica", "normal");
  doc.text(projeto.cliente || "—", margin + 22, y);

  doc.setFont("helvetica", "bold");
  doc.text("Projeto", margin, y + 5);
  doc.setFont("helvetica", "normal");
  doc.text(projeto.nome, margin + 22, y + 5);

  doc.setFont("helvetica", "bold");
  doc.text("Tipologia", margin, y + 10);
  doc.setFont("helvetica", "normal");
  const tip = tipologiaPorId(projeto.tipologia);
  doc.text(`${tip.nome} — ${cm(projeto.largura_mm)} × ${cm(projeto.altura_mm)} cm — Cor: ${projeto.cor}`, margin + 22, y + 10);

  // ===== Snapshot 3D =====
  let nextY = y + 18;
  if (snapshot3D) {
    try {
      const imgW = (pageW - margin * 2) * 0.5;
      const imgH = imgW * 0.62;
      const imgX = pageW - margin - imgW;
      doc.addImage(snapshot3D, "PNG", imgX, nextY, imgW, imgH);
      doc.setTextColor(...GRAY);
      doc.setFontSize(7);
      doc.text("Visualização — não é desenho técnico", imgX + imgW, nextY + imgH + 3, { align: "right" });
      nextY = Math.max(nextY, nextY + imgH + 8);
    } catch {
      // ignora
    }
  }

  // ===== Tabela de itens =====
  const itens = resultado.custos.filter((i) => !i.oculto && i.categoria !== "mao_obra" && i.categoria !== "margem" && i.categoria !== "desconto");

  autoTable(doc, {
    startY: nextY + 4,
    head: [["Categoria", "Descrição", "Qtd", "Un", "Preço un.", "Total"]],
    body: itens.map((i) => [
      rotuloCategoria(i.categoria),
      i.descricao + (i.codigo ? ` (${i.codigo})` : ""),
      i.qtd.toLocaleString("pt-BR"),
      i.unidade,
      formatarBRL(i.precoUnit),
      formatarBRL(i.total),
    ]),
    styles: { fontSize: 9, cellPadding: 2.2 },
    headStyles: { fillColor: ORANGE, textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 246, 244] },
    columnStyles: {
      2: { halign: "right" },
      4: { halign: "right" },
      5: { halign: "right" },
    },
    margin: { left: margin, right: margin },
  });

  // ===== Totais =====
  // @ts-expect-error lastAutoTable é fornecido pelo autotable
  let yTot = (doc.lastAutoTable?.finalY ?? nextY + 50) + 6;

  const mo = resultado.custos.find((i) => i.categoria === "mao_obra" && !i.oculto);
  const mg = resultado.custos.find((i) => i.categoria === "margem" && !i.oculto);
  const desc = resultado.custos.find((i) => i.categoria === "desconto");

  doc.setFontSize(10);
  doc.setTextColor(...DARK);
  const escreverLinha = (label: string, valor: number, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.text(label, pageW - margin - 60, yTot, { align: "left" });
    doc.text(formatarBRL(valor), pageW - margin, yTot, { align: "right" });
    yTot += 5;
  };
  escreverLinha("Materiais", resultado.totalMateriais);
  if (mo) escreverLinha(mo.descricao, mo.total);
  if (mg) escreverLinha(mg.descricao, mg.total);
  if (desc) escreverLinha(desc.descricao, desc.total);

  yTot += 2;
  doc.setDrawColor(...ORANGE);
  doc.setLineWidth(0.6);
  doc.line(pageW - margin - 70, yTot, pageW - margin, yTot);
  yTot += 7;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...ORANGE);
  doc.text("TOTAL", pageW - margin - 60, yTot);
  doc.text(formatarBRL(resultado.totalGeral), pageW - margin, yTot, { align: "right" });

  // ===== Rodapé =====
  yTot += 14;
  doc.setTextColor(...GRAY);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  const condicoes = [
    "Condições: 50% na assinatura, 50% na entrega.",
    "Prazo de entrega: a combinar conforme disponibilidade de material.",
    "Garantia de 12 meses contra defeitos de fabricação.",
    "Validade desta proposta: 15 dias.",
  ];
  condicoes.forEach((c, i) => doc.text(c, margin, yTot + i * 4));

  // ===== Assinatura =====
  if (assinatura?.dataUrl) {
    try {
      const sigW = 70;
      const sigH = 25;
      const sigX = pageW - margin - sigW;
      const sigY = yTot + condicoes.length * 4 + 8;
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

  if (retornarBlob) {
    return doc.output("blob");
  }
  doc.save(`orcamento-${projeto.id}.pdf`);
}
