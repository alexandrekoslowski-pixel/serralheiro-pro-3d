// Geração do PDF de Ordem de Produção (sem preços).
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ProjetoLocal } from "./storage";
import { tipologiaPorId } from "./tipologias";
import { PlanoCorte, PlanoProducao } from "./producao";

const ORANGE: [number, number, number] = [232, 97, 44];
const DARK: [number, number, number] = [40, 35, 32];
const PALETA: [number, number, number][] = [
  [232, 97, 44], [70, 130, 180], [85, 170, 90], [200, 100, 150],
  [240, 180, 60], [120, 100, 200], [200, 80, 80], [60, 180, 180],
];

export function gerarOrdemProducaoPDF(
  projeto: ProjetoLocal,
  planoCorte: PlanoCorte,
  planoProducao: PlanoProducao,
): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;

  // Header
  doc.setFillColor(...ORANGE);
  doc.rect(0, 0, pageW, 4, "F");
  doc.setTextColor(...ORANGE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("ORDEM DE PRODUÇÃO", margin, 14);
  doc.setTextColor(...DARK);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const tip = tipologiaPorId(projeto.tipologia);
  doc.text(`OP nº ${projeto.id.toUpperCase()}`, pageW - margin, 14, { align: "right" });
  doc.text(`Cliente: ${projeto.cliente || "—"}`, margin, 22);
  doc.text(`Projeto: ${projeto.nome}`, margin, 27);
  doc.text(`Tipologia: ${tip.nome}`, margin, 32);
  doc.text(`Medidas: ${projeto.largura_mm} × ${projeto.altura_mm} mm`, margin, 37);
  doc.text(`Cor/Acabamento: ${projeto.cor}`, pageW - margin, 22, { align: "right" });
  doc.text(`Emissão: ${new Date().toLocaleDateString("pt-BR")}`, pageW - margin, 27, { align: "right" });

  let y = 46;

  // ===== Mapa de corte visual =====
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...ORANGE);
  doc.text("Mapa de corte", margin, y);
  y += 5;
  doc.setTextColor(...DARK);
  doc.setFontSize(9);

  const drawW = pageW - margin * 2;
  for (const perfil of planoCorte.perfis) {
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`${perfil.codigo} — ${perfil.totalBarras} barra(s) de ${perfil.barraMm} mm — aproveitamento ${perfil.aproveitamentoPct}%`, margin, y);
    y += 4;
    perfil.barras.forEach((b) => {
      if (y > 270) { doc.addPage(); y = 20; }
      // moldura da barra
      doc.setDrawColor(...DARK);
      doc.setLineWidth(0.3);
      const barH = 6;
      doc.rect(margin, y, drawW, barH);
      // peças
      let cursor = margin;
      b.pecas.forEach((p, i) => {
        const w = (p.comprimento_mm / perfil.barraMm) * drawW;
        const [r, g, bl] = PALETA[i % PALETA.length];
        doc.setFillColor(r, g, bl);
        doc.rect(cursor, y, w, barH, "F");
        if (w > 18) {
          doc.setTextColor(255);
          doc.setFontSize(6.5);
          doc.text(`${p.id} • ${p.comprimento_mm}`, cursor + 1.5, y + barH / 2 + 1.5);
        }
        cursor += w;
      });
      // sobra
      doc.setTextColor(...DARK);
      doc.setFontSize(7);
      doc.text(`Barra ${b.numero} — sobra ${b.sobra_mm} mm`, margin + drawW + 2, y + barH - 1);
      y += barH + 2;
    });
    y += 3;
  }

  // ===== Tabela de soldas =====
  if (y > 230) { doc.addPage(); y = 20; }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...ORANGE);
  doc.text("Mapa de soldas", margin, y);
  y += 2;
  autoTable(doc, {
    startY: y + 2,
    head: [["Junta", "Tipo", "Qtd", "Observação"]],
    body: planoProducao.soldas.map((s) => [s.descricao, s.tipo, s.qtd.toString(), s.observacao || ""]),
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: ORANGE, textColor: 255 },
    alternateRowStyles: { fillColor: [248, 246, 244] },
    margin: { left: margin, right: margin },
  });
  // @ts-expect-error
  y = (doc.lastAutoTable?.finalY ?? y) + 8;

  // ===== Sequência de montagem =====
  if (y > 250) { doc.addPage(); y = 20; }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...ORANGE);
  doc.text("Sequência de montagem", margin, y);
  y += 5;
  doc.setTextColor(...DARK);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  planoProducao.sequencia.forEach((passo, i) => {
    if (y > 285) { doc.addPage(); y = 20; }
    doc.text(`${i + 1}. ${passo}`, margin, y);
    y += 5;
  });

  // ===== Checklist de ferramentas =====
  if (y > 250) { doc.addPage(); y = 20; }
  y += 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...ORANGE);
  doc.text("Ferramentas / EPI", margin, y);
  y += 5;
  doc.setTextColor(...DARK);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  planoProducao.ferramentas.forEach((f) => {
    if (y > 285) { doc.addPage(); y = 20; }
    doc.rect(margin, y - 3, 3.2, 3.2);
    doc.text(f, margin + 5, y);
    y += 5;
  });

  // Observações
  if (planoProducao.observacoes.length) {
    if (y > 260) { doc.addPage(); y = 20; }
    y += 3;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...ORANGE);
    doc.text("Observações", margin, y);
    y += 5;
    doc.setTextColor(...DARK);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    planoProducao.observacoes.forEach((o) => {
      const lines = doc.splitTextToSize("• " + o, pageW - margin * 2);
      lines.forEach((l: string) => {
        if (y > 285) { doc.addPage(); y = 20; }
        doc.text(l, margin, y);
        y += 4.5;
      });
    });
  }

  doc.save(`OP-${projeto.id}.pdf`);
}
