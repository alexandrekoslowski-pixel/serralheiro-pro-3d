import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { type DadosEmpresa, type ProjetoLocal, formatarBRL } from "./storage";
import { cm } from "./medidas";
import { tipologiaPorId } from "./tipologias";

export function gerarContratoPDF(projeto: ProjetoLocal, empresa: DadosEmpresa) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margem = 16;
  const largura = doc.internal.pageSize.getWidth() - margem * 2;
  let y = 18;
  const titulo = (texto: string) => {
    doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.text(texto, margem, y); y += 7;
  };
  const texto = (valor: string) => {
    doc.setFont("helvetica", "normal"); doc.setFontSize(9.5);
    const linhas = doc.splitTextToSize(valor, largura) as string[];
    if (y + linhas.length * 4.5 > 276) { doc.addPage(); y = 18; }
    doc.text(linhas, margem, y); y += linhas.length * 4.5 + 4;
  };

  doc.setFont("helvetica", "bold"); doc.setFontSize(16);
  doc.text("CONTRATO DE PRESTAÇÃO DE SERVIÇOS", doc.internal.pageSize.getWidth() / 2, y, { align: "center" });
  y += 12;
  texto(`CONTRATADA: ${empresa.nome}, CNPJ ${empresa.cnpj || "não informado"}, com endereço em ${empresa.endereco || "não informado"}.`);
  texto(`CONTRATANTE: ${projeto.cliente || "não informado"}, RG/CPF ${projeto.cliente_documento || "não informado"}, com endereço em ${[projeto.cliente_endereco, projeto.cliente_bairro, projeto.cliente_cidade, projeto.cliente_cep].filter(Boolean).join(", ") || "não informado"}.`);
  titulo("1. OBJETO");
  texto("Prestação dos serviços de fabricação, acabamento, transporte e/ou instalação descritos abaixo, conforme condições confirmadas entre as partes.");
  autoTable(doc, {
    startY: y,
    head: [["Item", "Serviço / peça", "Medidas"]],
    body: projeto.pecas.map((p, i) => [String(i + 1), `${p.nome} — ${tipologiaPorId(p.tipologia).nome}`, `${cm(p.largura_mm)} × ${cm(p.altura_mm)}`]),
    theme: "grid", styles: { fontSize: 9 }, margin: { left: margem, right: margem },
  });
  y = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y) + 8;
  titulo("2. VALOR E PAGAMENTO");
  texto(`O valor total contratado é de ${formatarBRL(projeto.total + (projeto.servicos_valor ?? 0) + (projeto.frete_valor ?? 0))}. ${empresa.textoPagamento}`);
  titulo("3. PRAZO");
  texto(`O prazo estimado é de ${projeto.prazo_dias_uteis ?? empresa.prazoDiasUteis ?? 22} dias úteis, contado da confirmação da entrada e da liberação das medidas finais.`);
  titulo("4. OBRIGAÇÕES E GARANTIA");
  texto(empresa.clausulasContrato || `A contratada executará os serviços conforme as especificações aprovadas. O contratante deverá garantir acesso ao local, condições adequadas para instalação e os pagamentos acordados. A garantia é de ${empresa.garantiaDias || 90} dias, ressalvado mau uso, intervenção de terceiros e alterações no local.`);
  titulo("5. ACEITE");
  texto("As partes declaram que leram e concordam com as condições deste contrato e da proposta aprovada.");
  y = Math.max(y + 12, 235);
  doc.line(margem, y, margem + 75, y); doc.line(doc.internal.pageSize.getWidth() - margem - 75, y, doc.internal.pageSize.getWidth() - margem, y);
  doc.setFontSize(8); doc.text(empresa.nome || "CONTRATADA", margem + 37.5, y + 5, { align: "center" });
  doc.text(projeto.cliente || "CONTRATANTE", doc.internal.pageSize.getWidth() - margem - 37.5, y + 5, { align: "center" });
  doc.text(`Emitido em ${new Date().toLocaleDateString("pt-BR")}`, margem, 286);
  doc.save(`contrato-${projeto.id}.pdf`);
}