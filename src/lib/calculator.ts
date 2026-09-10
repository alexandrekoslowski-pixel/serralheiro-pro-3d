// Calculadora central — gera plano de cortes e custos por tipologia.
import { TipologiaId, AcabamentoId } from "./tipologias";
import { Catalogo, perfilPorCodigo, acessorioPorCodigo } from "./catalogo";

export interface Corte {
  codigo: string;
  descricao: string;
  comprimento_mm: number;
  qtd: number;
}

export type CategoriaItem = "perfil" | "acessorio" | "vidro" | "mao_obra" | "margem" | "desconto" | "extra";

export interface ItemCusto {
  key: string;
  categoria: CategoriaItem;
  codigo?: string;
  descricao: string;
  qtd: number;
  unidade: string;
  precoUnit: number;
  descontoPct: number;
  total: number;
  oculto?: boolean;
  override?: boolean;
  peca?: string;
}

export interface ItemExtra {
  id: string;
  descricao: string;
  qtd: number;
  unidade: string;
  precoUnit: number;
}

export interface ItemOverride {
  qtd?: number;
  precoUnit?: number;
  descontoPct?: number;
  oculto?: boolean;
}

export interface CalcInput {
  tipologia: TipologiaId;
  largura_mm: number;
  altura_mm: number;
  cor: AcabamentoId;
  maoObraPct: number;
  margemPct: number;
  descontoGeralPct: number;
  catalogo: Catalogo;
  overrides?: Record<string, ItemOverride>;
  extras?: ItemExtra[];
}

export interface ResultadoCalculo {
  cortes: Corte[];
  custos: ItemCusto[];
  totalMateriais: number;
  totalGeral: number;
  resumo: { metragemPerfil: number; pesoEstimado: number };
}

const FOLGA_CORTE_MM = 5;

// ---------- Helpers de cortes por tipologia ----------

function cortesPortaoCorrer(L: number, H: number): Corte[] {
  // 4 perfis de moldura + N verticais a cada ~600mm + trilho 2L+200
  const nVert = Math.max(2, Math.ceil(L / 600) - 1);
  return [
    { codigo: "TUB-50x30", descricao: "Moldura horizontal", comprimento_mm: L, qtd: 2 },
    { codigo: "TUB-50x30", descricao: "Moldura vertical", comprimento_mm: H, qtd: 2 },
    { codigo: "TUB-30x30", descricao: "Verticais internos", comprimento_mm: H - 100, qtd: nVert },
    { codigo: "TRILHO-U", descricao: "Trilho inferior", comprimento_mm: 2 * L + 200, qtd: 1 },
  ];
}

function cortesPortaoBasculante(L: number, H: number): Corte[] {
  const nVert = Math.max(2, Math.ceil(L / 700) - 1);
  return [
    { codigo: "TUB-50x30", descricao: "Moldura horizontal", comprimento_mm: L, qtd: 2 },
    { codigo: "TUB-50x30", descricao: "Moldura vertical", comprimento_mm: H, qtd: 2 },
    { codigo: "TUB-30x30", descricao: "Verticais internos", comprimento_mm: H - 100, qtd: nVert },
    { codigo: "CHAPA-18", descricao: "Chapa de fechamento (m)", comprimento_mm: Math.round((L * H) / 1000), qtd: 1 },
  ];
}

function cortesPortaoRolo(L: number, H: number): Corte[] {
  const nLam = Math.max(2, Math.ceil(H / 80));
  return [
    { codigo: "LAM-ROLO", descricao: "Lâmina horizontal", comprimento_mm: L, qtd: nLam },
    { codigo: "TRILHO-LAT", descricao: "Trilho lateral guia", comprimento_mm: H + 200, qtd: 2 },
  ];
}

function cortesPortaoPantografico(L: number, H: number): Corte[] {
  const nMod = Math.max(3, Math.ceil(L / 500));
  const w = L / nMod;
  const diag = Math.round(Math.sqrt(w * w + H * H));
  return [
    { codigo: "TRILHO-U", descricao: "Trilho superior", comprimento_mm: L, qtd: 1 },
    { codigo: "TRILHO-U", descricao: "Trilho inferior", comprimento_mm: L, qtd: 1 },
    { codigo: "CHATA-3/16", descricao: "Diagonais X", comprimento_mm: diag, qtd: nMod * 2 },
    { codigo: "TUB-30x30", descricao: "Montantes", comprimento_mm: H, qtd: nMod + 1 },
  ];
}

function cortesPortaoPivotante(L: number, H: number): Corte[] {
  const nVert = Math.max(2, Math.ceil(L / 700) - 1);
  return [
    { codigo: "TUB-50x30", descricao: "Moldura horizontal", comprimento_mm: L, qtd: 2 },
    { codigo: "TUB-50x30", descricao: "Moldura vertical", comprimento_mm: H, qtd: 2 },
    { codigo: "TUB-30x30", descricao: "Verticais internos", comprimento_mm: H - 100, qtd: nVert },
    { codigo: "CHAPA-18", descricao: "Chapa de fechamento (m)", comprimento_mm: Math.round((L * H) / 1000), qtd: 1 },
  ];
}

function cortesJanelaCorrer2f(L: number, H: number): Corte[] {
  return [
    { codigo: "TUB-40x40", descricao: "Moldura externa horizontal", comprimento_mm: L, qtd: 2 },
    { codigo: "TUB-40x40", descricao: "Moldura externa vertical", comprimento_mm: H, qtd: 2 },
    { codigo: "TUB-20x20", descricao: "Esquadro folha horizontal", comprimento_mm: Math.round(L / 2) - 20, qtd: 4 },
    { codigo: "TUB-20x20", descricao: "Esquadro folha vertical", comprimento_mm: H - 60, qtd: 4 },
  ];
}

function cortesEstrutura(L: number, H: number): Corte[] {
  const nVert = Math.max(2, Math.ceil(L / 800) - 1);
  const nHoriz = Math.max(1, Math.ceil(H / 800) - 1);
  return [
    { codigo: "TUB-50x30", descricao: "Moldura horizontal", comprimento_mm: L, qtd: 2 },
    { codigo: "TUB-50x30", descricao: "Moldura vertical", comprimento_mm: H, qtd: 2 },
    { codigo: "TUB-30x30", descricao: "Travessas verticais", comprimento_mm: H - 100, qtd: nVert },
    { codigo: "TUB-30x30", descricao: "Travessas horizontais", comprimento_mm: L - 100, qtd: nHoriz },
  ];
}

function cortesVeneziana(L: number, H: number): Corte[] {
  const nLam = Math.max(2, Math.ceil(H / 60));
  return [
    { codigo: "TUB-30x30", descricao: "Moldura horizontal", comprimento_mm: L, qtd: 2 },
    { codigo: "TUB-30x30", descricao: "Moldura vertical", comprimento_mm: H, qtd: 2 },
    { codigo: "LAM-25", descricao: "Lâmina inclinada", comprimento_mm: L - 60, qtd: nLam },
  ];
}

// Grades fixas: moldura + preenchimento conforme o modelo.
function cortesGradeBalaozinho(L: number, H: number): Corte[] {
  // Tubos verticais balãozinho a cada ~150mm
  const nVert = Math.max(2, Math.ceil(L / 150) - 1);
  return [
    { codigo: "TUB-30x30", descricao: "Moldura horizontal", comprimento_mm: L, qtd: 2 },
    { codigo: "TUB-30x30", descricao: "Moldura vertical", comprimento_mm: H, qtd: 2 },
    { codigo: "TUB-20x20", descricao: "Tubo balãozinho vertical", comprimento_mm: H - 60, qtd: nVert },
  ];
}

function cortesGradeTijolinho(L: number, H: number): Corte[] {
  // Padrão tijolinho: barras horizontais a cada ~150mm + verticais a cada ~300mm
  const nHoriz = Math.max(2, Math.ceil(H / 150) - 1);
  const nVert = Math.max(2, Math.ceil(L / 300) - 1);
  return [
    { codigo: "TUB-30x30", descricao: "Moldura horizontal", comprimento_mm: L, qtd: 2 },
    { codigo: "TUB-30x30", descricao: "Moldura vertical", comprimento_mm: H, qtd: 2 },
    { codigo: "TUB-20x20", descricao: "Barra horizontal tijolinho", comprimento_mm: L - 60, qtd: nHoriz },
    { codigo: "TUB-20x20", descricao: "Barra vertical tijolinho", comprimento_mm: H - 60, qtd: nVert },
  ];
}

function cortesGradeTrabalhada(L: number, H: number): Corte[] {
  // Verticais a cada ~200mm + diagonais trabalhadas (barra chata) em cada vão
  const nVert = Math.max(2, Math.ceil(L / 200) - 1);
  const nVaos = nVert + 1;
  const w = L / nVaos;
  const diag = Math.round(Math.sqrt(w * w + (H - 60) * (H - 60)));
  return [
    { codigo: "TUB-30x30", descricao: "Moldura horizontal", comprimento_mm: L, qtd: 2 },
    { codigo: "TUB-30x30", descricao: "Moldura vertical", comprimento_mm: H, qtd: 2 },
    { codigo: "TUB-20x20", descricao: "Tubo vertical", comprimento_mm: H - 60, qtd: nVert },
    { codigo: "CHATA-3/16", descricao: "Diagonal trabalhada", comprimento_mm: diag, qtd: nVaos * 2 },
  ];
}

function gerarCortes(tipo: TipologiaId, L: number, H: number): Corte[] {
  switch (tipo) {
    case "portao_correr": return cortesPortaoCorrer(L, H);
    case "portao_basculante": return cortesPortaoBasculante(L, H);
    case "portao_rolo": return cortesPortaoRolo(L, H);
    case "portao_pantografico": return cortesPortaoPantografico(L, H);
    case "portao_pivotante": return cortesPortaoPivotante(L, H);
    case "janela_correr_2f": return cortesJanelaCorrer2f(L, H);
    case "estrutura_metalica": return cortesEstrutura(L, H);
    case "veneziana_metalica": return cortesVeneziana(L, H);
    case "grade_fixa_balaozinho": return cortesGradeBalaozinho(L, H);
    case "grade_fixa_tijolinho": return cortesGradeTijolinho(L, H);
    case "grade_fixa_trabalhada": return cortesGradeTrabalhada(L, H);
  }
}

// ---------- Acessórios por tipologia ----------

function acessoriosPorTipologia(tipo: TipologiaId): { codigo: string; qtd: number }[] {
  switch (tipo) {
    case "portao_correr": return [
      { codigo: "ROLDANA-DUPLA", qtd: 4 },
      { codigo: "FECHADURA-PORTAO", qtd: 1 },
      { codigo: "PARAFUSO-AUTO", qtd: 40 },
    ];
    case "portao_basculante": return [
      { codigo: "MOLA-AEREA", qtd: 2 },
      { codigo: "FECHADURA-PORTAO", qtd: 1 },
      { codigo: "PARAFUSO-AUTO", qtd: 40 },
    ];
    case "portao_rolo": return [
      { codigo: "EIXO-ROLO", qtd: 1 },
      { codigo: "FECHADURA-PORTAO", qtd: 1 },
      { codigo: "PARAFUSO-AUTO", qtd: 30 },
    ];
    case "portao_pantografico": return [
      { codigo: "KIT-PANTO", qtd: 6 },
      { codigo: "FECHADURA-PORTAO", qtd: 1 },
      { codigo: "PARAFUSO-AUTO", qtd: 30 },
    ];
    case "portao_pivotante": return [
      { codigo: "KIT-PIVOT", qtd: 1 },
      { codigo: "FECHADURA-PORTAO", qtd: 1 },
      { codigo: "PARAFUSO-AUTO", qtd: 30 },
    ];
    case "janela_correr_2f": return [
      { codigo: "TRINCO-JANELA", qtd: 1 },
      { codigo: "BATENTE-BORR", qtd: 6 },
      { codigo: "PARAFUSO-AUTO", qtd: 16 },
    ];
    case "estrutura_metalica": return [
      { codigo: "PARAFUSO-AUTO", qtd: 24 },
    ];
    case "veneziana_metalica": return [
      { codigo: "PARAFUSO-AUTO", qtd: 20 },
    ];
    case "grade_fixa_balaozinho":
    case "grade_fixa_tijolinho":
    case "grade_fixa_trabalhada": return [
      { codigo: "PARAFUSO-AUTO", qtd: 12 },
    ];
  }
}

// ---------- Vidro (apenas janela 2f) ----------
function metragemVidro(tipo: TipologiaId, L: number, H: number): number {
  if (tipo !== "janela_correr_2f") return 0;
  // 2 folhas de vidro
  return ((L / 1000) * (H / 1000));
}

// ---------- Aplicar override ----------
function aplicarOverride(item: ItemCusto, ov?: ItemOverride): ItemCusto {
  if (!ov) return item;
  const qtd = ov.qtd ?? item.qtd;
  const precoUnit = ov.precoUnit ?? item.precoUnit;
  const descontoPct = ov.descontoPct ?? item.descontoPct;
  const oculto = ov.oculto ?? item.oculto;
  const total = oculto ? 0 : qtd * precoUnit * (1 - descontoPct / 100);
  return { ...item, qtd, precoUnit, descontoPct, oculto, total, override: true };
}

// ---------- Calculadora principal ----------

export function calcular(input: CalcInput): ResultadoCalculo {
  const { tipologia, largura_mm: L, altura_mm: H, cor, catalogo, overrides = {}, extras = [] } = input;
  const cortes = gerarCortes(tipologia, L, H);

  // Agrupa cortes por código de perfil → metragem total (com folga)
  const metragemPorPerfil = new Map<string, { metros: number; pecas: number }>();
  for (const c of cortes) {
    const m = ((c.comprimento_mm + FOLGA_CORTE_MM) * c.qtd) / 1000;
    const cur = metragemPorPerfil.get(c.codigo) ?? { metros: 0, pecas: 0 };
    cur.metros += m;
    cur.pecas += c.qtd;
    metragemPorPerfil.set(c.codigo, cur);
  }

  const corMult = catalogo.multiplicadoresCor[cor] ?? 1;
  const custos: ItemCusto[] = [];
  let metragemTotal = 0;
  let pesoTotal = 0;

  // Perfis
  for (const [codigo, info] of metragemPorPerfil) {
    const perfil = perfilPorCodigo(catalogo, codigo);
    if (!perfil) continue;
    const precoUnit = perfil.precoPorMetro * corMult;
    metragemTotal += info.metros;
    pesoTotal += info.metros * perfil.pesoLinear;
    const key = `perfil:${codigo}`;
    const base: ItemCusto = {
      key,
      categoria: "perfil",
      codigo,
      descricao: perfil.descricao,
      qtd: Number(info.metros.toFixed(2)),
      unidade: "m",
      precoUnit: Number(precoUnit.toFixed(2)),
      descontoPct: 0,
      total: Number((info.metros * precoUnit).toFixed(2)),
    };
    custos.push(aplicarOverride(base, overrides[key]));
  }

  // Acessórios
  for (const a of acessoriosPorTipologia(tipologia)) {
    const ac = acessorioPorCodigo(catalogo, a.codigo);
    if (!ac) continue;
    const key = `acessorio:${a.codigo}`;
    const base: ItemCusto = {
      key,
      categoria: "acessorio",
      codigo: a.codigo,
      descricao: ac.descricao,
      qtd: a.qtd,
      unidade: ac.unidade,
      precoUnit: ac.preco,
      descontoPct: 0,
      total: Number((a.qtd * ac.preco).toFixed(2)),
    };
    custos.push(aplicarOverride(base, overrides[key]));
  }

  // Vidro
  const m2v = metragemVidro(tipologia, L, H);
  if (m2v > 0) {
    const key = "vidro:temperado";
    const base: ItemCusto = {
      key,
      categoria: "vidro",
      descricao: "Vidro temperado 8mm",
      qtd: Number(m2v.toFixed(2)),
      unidade: "m²",
      precoUnit: catalogo.vidroPorM2,
      descontoPct: 0,
      total: Number((m2v * catalogo.vidroPorM2).toFixed(2)),
    };
    custos.push(aplicarOverride(base, overrides[key]));
  }

  // Extras (linhas livres)
  for (const ex of extras) {
    const key = `extra:${ex.id}`;
    const base: ItemCusto = {
      key,
      categoria: "extra",
      descricao: ex.descricao || "Item extra",
      qtd: ex.qtd,
      unidade: ex.unidade || "un",
      precoUnit: ex.precoUnit,
      descontoPct: 0,
      total: Number((ex.qtd * ex.precoUnit).toFixed(2)),
    };
    custos.push(aplicarOverride(base, overrides[key]));
  }

  const totalMateriais = custos.reduce((s, i) => s + (i.oculto ? 0 : i.total), 0);

  // Mão de obra (% sobre materiais)
  const moKey = "mao_obra:padrao";
  const moBase: ItemCusto = {
    key: moKey,
    categoria: "mao_obra",
    descricao: `Mão de obra (${input.maoObraPct}%)`,
    qtd: 1,
    unidade: "vb",
    precoUnit: Number((totalMateriais * input.maoObraPct / 100).toFixed(2)),
    descontoPct: 0,
    total: Number((totalMateriais * input.maoObraPct / 100).toFixed(2)),
  };
  const mo = aplicarOverride(moBase, overrides[moKey]);
  custos.push(mo);

  const subtotal = totalMateriais + (mo.oculto ? 0 : mo.total);

  // Margem
  const mgKey = "margem:padrao";
  const mgBase: ItemCusto = {
    key: mgKey,
    categoria: "margem",
    descricao: `Margem (${input.margemPct}%)`,
    qtd: 1,
    unidade: "vb",
    precoUnit: Number((subtotal * input.margemPct / 100).toFixed(2)),
    descontoPct: 0,
    total: Number((subtotal * input.margemPct / 100).toFixed(2)),
  };
  const mg = aplicarOverride(mgBase, overrides[mgKey]);
  custos.push(mg);

  const comMargem = subtotal + (mg.oculto ? 0 : mg.total);

  // Desconto geral (negativo)
  const desc = comMargem * input.descontoGeralPct / 100;
  if (input.descontoGeralPct > 0) {
    custos.push({
      key: "desconto:geral",
      categoria: "desconto",
      descricao: `Desconto geral (${input.descontoGeralPct}%)`,
      qtd: 1,
      unidade: "vb",
      precoUnit: -Number(desc.toFixed(2)),
      descontoPct: 0,
      total: -Number(desc.toFixed(2)),
    });
  }

  const totalGeral = Number((comMargem - desc).toFixed(2));

  return {
    cortes,
    custos,
    totalMateriais: Number(totalMateriais.toFixed(2)),
    totalGeral,
    resumo: {
      metragemPerfil: Number(metragemTotal.toFixed(2)),
      pesoEstimado: Number(pesoTotal.toFixed(2)),
    },
  };
}

// ============ Orçamento com várias peças ============

export interface PecaCalc {
  id: string;
  nome: string;
  tipologia: TipologiaId;
  largura_mm: number;
  altura_mm: number;
  cor: AcabamentoId;
}

export interface CalcProjetoInput {
  pecas: PecaCalc[];
  maoObraPct: number;
  margemPct: number;
  descontoGeralPct: number;
  catalogo: Catalogo;
  overrides?: Record<string, ItemOverride>;
  extras?: ItemExtra[];
}

export interface ResultadoProjeto extends ResultadoCalculo {
  porPeca: { peca: PecaCalc; cortes: Corte[]; custos: ItemCusto[] }[];
}

/**
 * Calcula o orçamento inteiro: materiais de cada peça somados, mais extras,
 * mão de obra, margem e desconto aplicados uma vez sobre o total.
 */
export function calcularProjeto(input: CalcProjetoInput): ResultadoProjeto {
  const { pecas, catalogo, overrides = {}, extras = [] } = input;
  const varias = pecas.length > 1;

  const porPeca: ResultadoProjeto["porPeca"] = [];
  const cortes: Corte[] = [];
  const custos: ItemCusto[] = [];
  let metragemTotal = 0;
  let pesoTotal = 0;

  pecas.forEach((peca, idx) => {
    const nome = peca.nome || `Peça ${idx + 1}`;
    const r = calcular({
      tipologia: peca.tipologia,
      largura_mm: peca.largura_mm,
      altura_mm: peca.altura_mm,
      cor: peca.cor,
      maoObraPct: 0,
      margemPct: 0,
      descontoGeralPct: 0,
      catalogo,
      // overrides já vêm com o prefixo da peça
      overrides: Object.fromEntries(
        Object.entries(overrides)
          .filter(([k]) => k.startsWith(`${peca.id}::`))
          .map(([k, v]) => [k.slice(peca.id.length + 2), v]),
      ),
      extras: [],
    });

    const cortesPeca = r.cortes.map((c) => ({
      ...c,
      descricao: varias ? `${nome} — ${c.descricao}` : c.descricao,
    }));
    const custosPeca = r.custos
      .filter((i) => !["mao_obra", "margem", "desconto"].includes(i.categoria))
      .map((i) => ({ ...i, key: `${peca.id}::${i.key}`, peca: nome }));

    cortes.push(...cortesPeca);
    custos.push(...custosPeca);
    metragemTotal += r.resumo.metragemPerfil;
    pesoTotal += r.resumo.pesoEstimado;
    porPeca.push({ peca, cortes: cortesPeca, custos: custosPeca });
  });

  // Extras do orçamento (frete, instalação…)
  for (const ex of extras) {
    const key = `extra:${ex.id}`;
    custos.push(aplicarOverride({
      key,
      categoria: "extra",
      descricao: ex.descricao || "Item extra",
      qtd: ex.qtd,
      unidade: ex.unidade || "un",
      precoUnit: ex.precoUnit,
      descontoPct: 0,
      total: Number((ex.qtd * ex.precoUnit).toFixed(2)),
    }, overrides[key]));
  }

  const totalMateriais = custos.reduce((s, i) => s + (i.oculto ? 0 : i.total), 0);

  const moKey = "mao_obra:padrao";
  const mo = aplicarOverride({
    key: moKey, categoria: "mao_obra", descricao: `Mão de obra (${input.maoObraPct}%)`,
    qtd: 1, unidade: "vb",
    precoUnit: Number((totalMateriais * input.maoObraPct / 100).toFixed(2)),
    descontoPct: 0,
    total: Number((totalMateriais * input.maoObraPct / 100).toFixed(2)),
  }, overrides[moKey]);
  custos.push(mo);

  const subtotal = totalMateriais + (mo.oculto ? 0 : mo.total);

  const mgKey = "margem:padrao";
  const mg = aplicarOverride({
    key: mgKey, categoria: "margem", descricao: `Margem (${input.margemPct}%)`,
    qtd: 1, unidade: "vb",
    precoUnit: Number((subtotal * input.margemPct / 100).toFixed(2)),
    descontoPct: 0,
    total: Number((subtotal * input.margemPct / 100).toFixed(2)),
  }, overrides[mgKey]);
  custos.push(mg);

  const comMargem = subtotal + (mg.oculto ? 0 : mg.total);
  const desc = comMargem * input.descontoGeralPct / 100;
  if (input.descontoGeralPct > 0) {
    custos.push({
      key: "desconto:geral", categoria: "desconto",
      descricao: `Desconto geral (${input.descontoGeralPct}%)`,
      qtd: 1, unidade: "vb",
      precoUnit: -Number(desc.toFixed(2)), descontoPct: 0, total: -Number(desc.toFixed(2)),
    });
  }

  return {
    porPeca,
    cortes,
    custos,
    totalMateriais: Number(totalMateriais.toFixed(2)),
    totalGeral: Number((comMargem - desc).toFixed(2)),
    resumo: {
      metragemPerfil: Number(metragemTotal.toFixed(2)),
      pesoEstimado: Number(pesoTotal.toFixed(2)),
    },
  };
}
