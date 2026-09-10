// Geração do PDF de Ordem de Serviço (oficina) — sem preços, fonte grande,
// etiquetas destacáveis, checkboxes pra riscar com lápis. P&B otimizado.
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ProjetoLocal } from "./storage";
import { tipologiaPorId } from "./tipologias";
import { PlanoCorte, PlanoProducao } from "./producao";
import { cm } from "@/lib/medidas";

const BLACK: [number, number, number] = [0, 0, 0];
const GRAY: [number, number, number] = [110, 110, 110];
const LIGHT: [number, number, number] = [220, 220, 220];

export function gerarOrdemProducaoPDF(
  projeto: ProjetoLocal,
  planoCorte: PlanoCorte,
  planoProducao: PlanoProducao,
): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 12;
  const p0 = projeto.pecas[0];
  const tip = tipologiaPorId(p0.tipologia);

  // ============ Helper: cabeçalho de página ============
  const drawHeader = (title: string, page: number, totalPages: number) => {
    doc.setFillColor(...BLACK);
    doc.rect(0, 0, pageW, 10, "F");
    doc.setTextColor(255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("ORDEM DE SERVIÇO", margin, 7);
    doc.setFontSize(10);
    doc.text(`OP ${projeto.id.toUpperCase().slice(0, 6)}`, pageW - margin, 7, { align: "right" });
    doc.setTextColor(...BLACK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(title.toUpperCase(), margin, 16);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text(`Página ${page}/${totalPages}  •  SEM VALORES — APENAS PRODUÇÃO`, pageW - margin, 16, { align: "right" });
    doc.setDrawColor(...LIGHT);
    doc.setLineWidth(0.3);
    doc.line(margin, 18, pageW - margin, 18);
    doc.setTextColor(...BLACK);
  };

  const drawFooter = () => {
    doc.setFontSize(7);
    doc.setTextColor(...GRAY);
    doc.text("Documento de produção — não contém valores comerciais.", margin, pageH - 6);
    doc.text(new Date().toLocaleDateString("pt-BR"), pageW - margin, pageH - 6, { align: "right" });
  };

  // Conta total de páginas dinâmico — usaremos placeholder e reescrevemos no final
  const totalEstimado = 5;

  // ============================================================
  // PÁGINA 1 — RESUMO
  // ============================================================
  drawHeader("Resumo da peça", 1, totalEstimado);
  let y = 26;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.text(tip.nome, margin, y + 8);
  y += 14;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.setTextColor(...GRAY);
  doc.text(`Cliente: ${projeto.cliente || "—"}`, margin, y);
  y += 7;
  doc.text(`Projeto: ${projeto.nome}`, margin, y);
  y += 12;

  // Box dimensões — gigante
  doc.setTextColor(...BLACK);
  doc.setDrawColor(...BLACK);
  doc.setLineWidth(0.6);
  const boxW = (pageW - margin * 2 - 6) / 3;
  const boxH = 38;
  const boxes: Array<[string, string]> = [
    ["LARGURA", `${cm(p0.largura_mm)} cm`],
    ["ALTURA", `${cm(p0.altura_mm)} cm`],
    projeto.pecas.length > 1
      ? ["PEÇAS", `${projeto.pecas.length}`]
      : ["COR", p0.cor.toUpperCase()],
  ];
  boxes.forEach(([label, value], i) => {
    const x = margin + i * (boxW + 3);
    doc.rect(x, y, boxW, boxH);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...GRAY);
    doc.text(label, x + 3, y + 6);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(...BLACK);
    doc.text(value, x + boxW / 2, y + boxH / 2 + 6, { align: "center" });
  });
  y += boxH + 10;

  // Totais de produção
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Material necessário", margin, y);
  y += 8;

  const totalPecas = planoCorte.perfis.reduce(
    (s, p) => s + p.barras.reduce((s2, b) => s2 + b.pecas.length, 0), 0,
  );
  const totalSoldas = planoProducao.soldas.reduce((s, x) => s + x.qtd, 0);

  autoTable(doc, {
    startY: y,
    head: [["Perfil", "Barras (6m)", "Aproveitamento", "Sobra"]],
    body: planoCorte.perfis.map((p) => [
      p.codigo,
      `${p.totalBarras}`,
      `${p.aproveitamentoPct}%`,
      `${p.perda_m.toFixed(2)} m`,
    ]),
    foot: [[`TOTAL`, `${planoCorte.totalBarras} barras`, `${planoCorte.aproveitamentoMedioPct}% médio`, `${planoCorte.perdaTotalM.toFixed(2)} m`]],
    styles: { fontSize: 13, cellPadding: 3, textColor: BLACK, lineColor: LIGHT, lineWidth: 0.2 },
    headStyles: { fillColor: BLACK, textColor: 255, fontSize: 11 },
    footStyles: { fillColor: LIGHT, textColor: BLACK, fontStyle: "bold", fontSize: 12 },
    margin: { left: margin, right: margin },
  });
  // @ts-expect-error
  y = (doc.lastAutoTable?.finalY ?? y) + 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Resumo geral", margin, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  const linhas = [
    `• ${totalPecas} peças a cortar`,
    `• ${planoCorte.totalBarras} barra(s) de 6 metros`,
    `• ${totalSoldas} soldas previstas`,
    `• ${planoProducao.sequencia.length} etapas de montagem`,
  ];
  linhas.forEach((l) => { doc.text(l, margin, y); y += 7; });
  drawFooter();

  // ============================================================
  // PÁGINA 2 — MAPA DE CORTE
  // ============================================================
  doc.addPage();
  drawHeader("Mapa de corte", 2, totalEstimado);
  y = 26;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...GRAY);
  doc.text(`Cada barra mede ${planoCorte.perfis[0]?.barraMm ?? 6000} mm. Ordem da esquerda → direita.`, margin, y);
  y += 8;
  doc.setTextColor(...BLACK);

  const drawW = pageW - margin * 2;
  for (const perfil of planoCorte.perfis) {
    if (y > pageH - 30) { doc.addPage(); drawHeader("Mapa de corte (cont.)", 2, totalEstimado); y = 26; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(`${perfil.codigo}`, margin, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`${perfil.totalBarras} barra(s)  •  aproveitamento ${perfil.aproveitamentoPct}%`, margin + 50, y);
    y += 4;

    perfil.barras.forEach((b) => {
      if (y > pageH - 28) { doc.addPage(); drawHeader("Mapa de corte (cont.)", 2, totalEstimado); y = 26; }
      // Barra
      doc.setDrawColor(...BLACK);
      doc.setLineWidth(0.4);
      const barH = 11;
      doc.setFillColor(245, 245, 245);
      doc.rect(margin, y, drawW, barH, "F");
      doc.rect(margin, y, drawW, barH);
      // Peças
      let cursor = margin;
      b.pecas.forEach((p, i) => {
        const w = (p.comprimento_mm / perfil.barraMm) * drawW;
        // contorno + hatching alternado pra distinguir em P&B
        if (i % 2 === 0) {
          doc.setFillColor(0, 0, 0);
          doc.rect(cursor, y, w, barH, "F");
          doc.setTextColor(255);
        } else {
          doc.setFillColor(255, 255, 255);
          doc.rect(cursor, y, w, barH, "F");
          doc.rect(cursor, y, w, barH);
          doc.setTextColor(...BLACK);
        }
        if (w > 14) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          doc.text(p.id, cursor + 1.5, y + 5);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.text(`${cm(p.comprimento_mm)}`, cursor + 1.5, y + 9);
        }
        cursor += w;
      });
      // Sobra
      doc.setTextColor(...GRAY);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Barra ${b.numero} — sobra ${cm(b.sobra_mm)} cm`, margin, y + barH + 4);
      y += barH + 7;
      doc.setTextColor(...BLACK);
    });
    y += 4;
  }
  drawFooter();

  // ============================================================
  // PÁGINA 3+ — ETIQUETAS DESTACÁVEIS (8 por página)
  // ============================================================
  // Lista flat de peças (mesma ordem do mapa)
  const todasPecas: Array<{ id: string; codigo: string; descricao: string; comprimento_mm: number }> = [];
  planoCorte.perfis.forEach((p) => p.barras.forEach((b) => b.pecas.forEach((pc) => todasPecas.push(pc))));

  const POR_PAGINA = 8;
  const cols = 2;
  const rows = 4;
  const totalEtiqPaginas = Math.ceil(todasPecas.length / POR_PAGINA);
  for (let pageEtiq = 0; pageEtiq < totalEtiqPaginas; pageEtiq++) {
    doc.addPage();
    drawHeader(`Etiquetas de peça — corte e cole na peça (${pageEtiq + 1}/${totalEtiqPaginas})`, 3 + pageEtiq, totalEstimado);
    const top = 22;
    const usableH = pageH - top - 12;
    const usableW = pageW - margin * 2;
    const cw = usableW / cols;
    const ch = usableH / rows;

    for (let i = 0; i < POR_PAGINA; i++) {
      const idx = pageEtiq * POR_PAGINA + i;
      if (idx >= todasPecas.length) break;
      const peca = todasPecas[idx];
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = margin + col * cw;
      const yy = top + row * ch;

      // borda tracejada (pra cortar)
      doc.setDrawColor(...GRAY);
      doc.setLineDashPattern([1.5, 1.5], 0);
      doc.setLineWidth(0.3);
      doc.rect(x + 2, yy + 2, cw - 4, ch - 4);
      doc.setLineDashPattern([], 0);

      // ID gigante
      doc.setFont("helvetica", "bold");
      doc.setFontSize(48);
      doc.setTextColor(...BLACK);
      doc.text(peca.id, x + 6, yy + 24);

      // Comprimento gigante (à direita)
      doc.setFontSize(36);
      doc.text(`${cm(peca.comprimento_mm)}`, x + cw - 6, yy + 22, { align: "right" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.setTextColor(...GRAY);
      doc.text("mm", x + cw - 6, yy + 30, { align: "right" });

      // Código + descrição
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(...BLACK);
      doc.text(peca.codigo, x + 6, yy + ch - 14);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(...GRAY);
      doc.text(peca.descricao, x + 6, yy + ch - 7, { maxWidth: cw - 12 });
    }
    drawFooter();
  }

  // ============================================================
  // PÁGINA — SOLDAS + SEQUÊNCIA
  // ============================================================
  doc.addPage();
  const pageSequencia = 3 + totalEtiqPaginas;
  drawHeader("Soldas e sequência de montagem", pageSequencia, totalEstimado);
  y = 26;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Mapa de soldas", margin, y);
  y += 4;
  autoTable(doc, {
    startY: y,
    head: [["Junta", "Tipo", "Qtd", "Observação"]],
    body: planoProducao.soldas.map((s) => [s.descricao, s.tipo, s.qtd.toString(), s.observacao || ""]),
    styles: { fontSize: 11, cellPadding: 2.5, textColor: BLACK, lineColor: LIGHT, lineWidth: 0.2 },
    headStyles: { fillColor: BLACK, textColor: 255, fontSize: 10 },
    margin: { left: margin, right: margin },
  });
  // @ts-expect-error
  y = (doc.lastAutoTable?.finalY ?? y) + 10;

  if (y > pageH - 50) { doc.addPage(); drawHeader("Sequência (cont.)", pageSequencia, totalEstimado); y = 26; }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Sequência de montagem", margin, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);

  planoProducao.sequencia.forEach((passo, i) => {
    if (y > pageH - 16) { doc.addPage(); drawHeader("Sequência (cont.)", pageSequencia, totalEstimado); y = 26; }
    // checkbox 6mm
    doc.setDrawColor(...BLACK);
    doc.setLineWidth(0.5);
    doc.rect(margin, y - 5, 6, 6);
    doc.text(`${i + 1}.`, margin + 9, y);
    const lines = doc.splitTextToSize(passo, pageW - margin * 2 - 16);
    doc.text(lines, margin + 18, y);
    y += Math.max(8, lines.length * 6 + 2);
  });
  drawFooter();

  // ============================================================
  // PÁGINA FINAL — FERRAMENTAS + OBSERVAÇÕES
  // ============================================================
  doc.addPage();
  const pageFerr = pageSequencia + 1;
  drawHeader("Ferramentas e observações", pageFerr, totalEstimado);
  y = 26;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Ferramentas / EPI", margin, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  planoProducao.ferramentas.forEach((f) => {
    if (y > pageH - 16) { doc.addPage(); drawHeader("Ferramentas (cont.)", pageFerr, totalEstimado); y = 26; }
    doc.setDrawColor(...BLACK);
    doc.setLineWidth(0.5);
    doc.rect(margin, y - 5, 6, 6);
    doc.text(f, margin + 10, y);
    y += 8;
  });

  if (planoProducao.observacoes.length) {
    if (y > pageH - 40) { doc.addPage(); drawHeader("Observações", pageFerr, totalEstimado); y = 26; }
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Observações", margin, y);
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    planoProducao.observacoes.forEach((o) => {
      const lines = doc.splitTextToSize("• " + o, pageW - margin * 2);
      lines.forEach((l: string) => {
        if (y > pageH - 16) { doc.addPage(); drawHeader("Observações (cont.)", pageFerr, totalEstimado); y = 26; }
        doc.text(l, margin, y);
        y += 6;
      });
    });
  }
  drawFooter();

  doc.save(`OS-${projeto.id}.pdf`);
}
