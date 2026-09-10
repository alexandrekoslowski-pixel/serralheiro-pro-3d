// Plano de produção: nesting 1D + soldas + sequência de montagem.
import { Corte } from "./calculator";
import { TipologiaId } from "./tipologias";

const KERF_MM = 3;

// Folga padrão somada a cada peça na hora de cortar (compensa lixamento e ajuste).
// Centralizada aqui pra que tela e PDF mostrem a mesma medida.
export const FOLGA_CORTE_MM = 5;

export interface PecaCorte {
  id: string;
  codigo: string;
  descricao: string;
  comprimento_mm: number;
}

export interface BarraPlano {
  numero: number;
  pecas: PecaCorte[];
  usado_mm: number;
  sobra_mm: number;
}

export interface PlanoCortePerfil {
  codigo: string;
  barraMm: number;
  barras: BarraPlano[];
  totalBarras: number;
  aproveitamentoPct: number;
  perda_m: number;
}

export interface PlanoCorte {
  perfis: PlanoCortePerfil[];
  totalBarras: number;
  aproveitamentoMedioPct: number;
  perdaTotalM: number;
}

// First-Fit Decreasing 1D bin packing
export function planejarCorte(cortes: Corte[], barraMm = 6000): PlanoCorte {
  const porPerfil = new Map<string, PecaCorte[]>();
  let pecaCounter = 1;
  for (const c of cortes) {
    const arr = porPerfil.get(c.codigo) ?? [];
    for (let i = 0; i < c.qtd; i++) {
      arr.push({
        id: `P${pecaCounter++}`,
        codigo: c.codigo,
        descricao: c.descricao,
        comprimento_mm: c.comprimento_mm,
      });
    }
    porPerfil.set(c.codigo, arr);
  }

  const perfis: PlanoCortePerfil[] = [];
  let perdaTotal = 0;
  let aproveitamentoSoma = 0;
  let totalBarras = 0;

  for (const [codigo, pecas] of porPerfil) {
    pecas.sort((a, b) => b.comprimento_mm - a.comprimento_mm);
    const barras: BarraPlano[] = [];
    for (const p of pecas) {
      let alocada = false;
      for (const b of barras) {
        const espacoNecessario = p.comprimento_mm + (b.pecas.length > 0 ? KERF_MM : 0);
        if (b.sobra_mm >= espacoNecessario) {
          b.pecas.push(p);
          b.usado_mm += espacoNecessario;
          b.sobra_mm = barraMm - b.usado_mm;
          alocada = true;
          break;
        }
      }
      if (!alocada) {
        if (p.comprimento_mm > barraMm) continue; // peça maior que barra: ignora
        barras.push({
          numero: barras.length + 1,
          pecas: [p],
          usado_mm: p.comprimento_mm,
          sobra_mm: barraMm - p.comprimento_mm,
        });
      }
    }
    const usadoTotal = barras.reduce((s, b) => s + b.usado_mm, 0);
    const capacidade = barras.length * barraMm;
    const aproveitamento = capacidade > 0 ? (usadoTotal / capacidade) * 100 : 0;
    const perda = (capacidade - usadoTotal) / 1000;
    perfis.push({
      codigo,
      barraMm,
      barras,
      totalBarras: barras.length,
      aproveitamentoPct: Number(aproveitamento.toFixed(1)),
      perda_m: Number(perda.toFixed(2)),
    });
    perdaTotal += perda;
    aproveitamentoSoma += aproveitamento;
    totalBarras += barras.length;
  }

  return {
    perfis,
    totalBarras,
    aproveitamentoMedioPct: perfis.length > 0 ? Number((aproveitamentoSoma / perfis.length).toFixed(1)) : 0,
    perdaTotalM: Number(perdaTotal.toFixed(2)),
  };
}

// ---------- Plano de produção (soldas + montagem) ----------

export type TipoSolda = "MIG" | "TIG" | "Eletrodo" | "Ponteamento";

export interface JuntaSolda {
  descricao: string;
  tipo: TipoSolda;
  qtd: number;
  observacao?: string;
}

export interface PlanoProducao {
  soldas: JuntaSolda[];
  sequencia: string[];
  ferramentas: string[];
  observacoes: string[];
}

export function planejarProducao(tipo: TipologiaId, cortes: Corte[]): PlanoProducao {
  const totalPecas = cortes.reduce((s, c) => s + c.qtd, 0);

  const ferramentasComuns = [
    "Máscara de solda automática",
    "Luva de raspa",
    "Esmerilhadeira 4½\" + disco de corte",
    "Disco de desbaste",
    "Esquadro 90°",
    "Trena 5m",
    "Prumo",
    "Furadeira + broca 8mm",
  ];

  const obsBase = [
    "Conferir esquadro nas diagonais com tolerância ±1mm.",
    "Pontear toda a estrutura antes de soldar definitivo (evita empenamento).",
    "Soldar em ordem cruzada para distribuir o calor.",
    "Limpar respingos com escova de aço antes da pintura.",
  ];

  switch (tipo) {
    case "portao_correr":
      return {
        soldas: [
          { descricao: "Cantos da moldura externa", tipo: "MIG", qtd: 4, observacao: "Solda em chanfro 45°" },
          { descricao: "Verticais internos na moldura", tipo: "MIG", qtd: cortes.find(c => c.descricao.includes("Verticais"))?.qtd ?? 0 },
          { descricao: "Suporte de roldanas", tipo: "MIG", qtd: 4 },
          { descricao: "Ponteamento geral", tipo: "Ponteamento", qtd: totalPecas },
        ],
        sequencia: [
          "Conferir medidas das peças cortadas e marcar com giz.",
          "Posicionar moldura externa sobre gabarito plano.",
          "Pontear os 4 cantos e verificar esquadro.",
          "Posicionar verticais internos a cada 600mm.",
          "Pontear verticais e conferir alinhamento.",
          "Soldar definitivamente (MIG) começando pelos cantos.",
          "Esmerilhar todas as soldas.",
          "Soldar suportes de roldanas na base.",
          "Furar pontos de fechadura.",
          "Limpar e preparar para pintura.",
        ],
        ferramentas: ferramentasComuns,
        observacoes: obsBase,
      };
    case "portao_basculante":
      return {
        soldas: [
          { descricao: "Cantos da moldura", tipo: "MIG", qtd: 4 },
          { descricao: "Verticais internos", tipo: "MIG", qtd: cortes.find(c => c.descricao.includes("Verticais"))?.qtd ?? 0 },
          { descricao: "Fixação da chapa de fechamento", tipo: "Ponteamento", qtd: 20, observacao: "Pontos espaçados 200mm" },
          { descricao: "Suporte de mola", tipo: "MIG", qtd: 4 },
        ],
        sequencia: [
          "Cortar e conferir todas as peças.",
          "Montar moldura no gabarito.",
          "Pontear cantos e verificar esquadro.",
          "Soldar moldura definitivamente.",
          "Adicionar verticais internos.",
          "Posicionar e pontear chapa de fechamento.",
          "Soldar suportes de mola.",
          "Esmerilhar e limpar.",
        ],
        ferramentas: ferramentasComuns,
        observacoes: obsBase,
      };
    case "portao_rolo":
      return {
        soldas: [
          { descricao: "União de lâminas (encaixe)", tipo: "Ponteamento", qtd: cortes.find(c => c.codigo === "LAM-ROLO")?.qtd ?? 0, observacao: "Apenas pontos de fixação" },
          { descricao: "Suportes do eixo nas laterais", tipo: "MIG", qtd: 4 },
          { descricao: "Trilhos laterais na parede", tipo: "Eletrodo", qtd: 8, observacao: "Eletrodo 6013" },
        ],
        sequencia: [
          "Encaixar lâminas formando a cortina.",
          "Pontear extremidades das lâminas.",
          "Montar suportes do eixo.",
          "Soldar suportes nas paredes laterais.",
          "Instalar eixo com mola.",
          "Fixar trilhos laterais.",
          "Conectar cortina ao eixo e testar movimento.",
        ],
        ferramentas: [...ferramentasComuns, "Chave de fenda grande", "Escada"],
        observacoes: obsBase,
      };
    case "portao_pantografico":
      return {
        soldas: [
          { descricao: "Diagonais nos pontos de cruzamento", tipo: "MIG", qtd: (cortes.find(c => c.descricao.includes("Diagonais"))?.qtd ?? 0) / 2, observacao: "Pino articulado, não solda fixa" },
          { descricao: "Montantes nas extremidades", tipo: "MIG", qtd: cortes.find(c => c.descricao.includes("Montantes"))?.qtd ?? 0 },
          { descricao: "Trilhos superior e inferior", tipo: "Eletrodo", qtd: 6 },
        ],
        sequencia: [
          "Furar pontos de articulação nas chatas.",
          "Montar pantógrafo sobre gabarito esticado.",
          "Pinar todas as articulações.",
          "Soldar montantes nas extremidades.",
          "Instalar trilhos superior e inferior.",
          "Inserir roletes nos kits pantográficos.",
          "Testar abertura/fechamento.",
        ],
        ferramentas: [...ferramentasComuns, "Punção", "Martelo"],
        observacoes: obsBase,
      };
    case "portao_pivotante":
      return {
        soldas: [
          { descricao: "Cantos da moldura", tipo: "MIG", qtd: 4 },
          { descricao: "Verticais internos", tipo: "MIG", qtd: cortes.find(c => c.descricao.includes("Verticais"))?.qtd ?? 0 },
          { descricao: "Fixação da chapa", tipo: "Ponteamento", qtd: 20 },
          { descricao: "Reforço do eixo do pivô", tipo: "TIG", qtd: 2, observacao: "Solda de penetração" },
        ],
        sequencia: [
          "Marcar posição do eixo pivô (descentralizado 1/3).",
          "Montar moldura e pontear.",
          "Soldar definitivamente.",
          "Adicionar verticais internos.",
          "Soldar reforços onde fica o eixo.",
          "Fixar chapa de fechamento.",
          "Instalar kit pivô (rolamento + base).",
        ],
        ferramentas: ferramentasComuns,
        observacoes: [...obsBase, "Atenção: o eixo descentralizado deve ficar a 1/3 da largura."],
      };
    case "janela_correr_2f":
      return {
        soldas: [
          { descricao: "Cantos da moldura externa", tipo: "TIG", qtd: 4, observacao: "Acabamento fino" },
          { descricao: "Cantos das folhas internas", tipo: "TIG", qtd: 8 },
        ],
        sequencia: [
          "Cortar e conferir peças.",
          "Montar moldura externa.",
          "Soldar TIG nos cantos.",
          "Montar folhas internas.",
          "Esmerilhar e lixar todas as soldas.",
          "Instalar borrachas de vedação.",
          "Encaixar vidros e trincos.",
        ],
        ferramentas: [...ferramentasComuns, "Lixa fina P220", "Ventosas para vidro"],
        observacoes: [...obsBase, "Vidro temperado: nunca cortar após têmpera."],
      };
    case "estrutura_metalica":
      return {
        soldas: [
          { descricao: "Cantos da moldura", tipo: "MIG", qtd: 4 },
          { descricao: "Travessas verticais", tipo: "MIG", qtd: cortes.find(c => c.descricao.includes("verticais"))?.qtd ?? 0 },
          { descricao: "Travessas horizontais", tipo: "MIG", qtd: cortes.find(c => c.descricao.includes("horizontais"))?.qtd ?? 0 },
        ],
        sequencia: [
          "Conferir peças.",
          "Montar moldura no gabarito.",
          "Soldar cantos.",
          "Posicionar travessas (distribuir igualmente).",
          "Soldar todas as junções.",
          "Esmerilhar e limpar.",
        ],
        ferramentas: ferramentasComuns,
        observacoes: obsBase,
      };
    case "veneziana_metalica":
      return {
        soldas: [
          { descricao: "Cantos da moldura", tipo: "MIG", qtd: 4 },
          { descricao: "Lâminas inclinadas nas laterais", tipo: "Ponteamento", qtd: (cortes.find(c => c.codigo === "LAM-25")?.qtd ?? 0) * 2, observacao: "Inclinação 30°" },
        ],
        sequencia: [
          "Marcar posição das lâminas (60mm de espaçamento).",
          "Montar moldura.",
          "Soldar cantos.",
          "Posicionar lâminas inclinadas a 30°.",
          "Pontear cada lâmina nas duas extremidades.",
          "Esmerilhar.",
        ],
        ferramentas: [...ferramentasComuns, "Transferidor / esquadro de 30°"],
        observacoes: obsBase,
      };
    case "grade_fixa_balaozinho":
      return {
        soldas: [
          { descricao: "Cantos da moldura", tipo: "MIG", qtd: 4 },
          { descricao: "Tubos balãozinho na moldura", tipo: "MIG", qtd: (cortes.find(c => c.descricao.includes("balãozinho"))?.qtd ?? 0) * 2 },
        ],
        sequencia: [
          "Conferir peças cortadas.",
          "Montar moldura no gabarito.",
          "Soldar cantos.",
          "Marcar espaçamento dos tubos (~150mm).",
          "Posicionar e soldar tubos balãozinho.",
          "Esmerilhar e limpar.",
        ],
        ferramentas: ferramentasComuns,
        observacoes: obsBase,
      };
    case "grade_fixa_tijolinho":
      return {
        soldas: [
          { descricao: "Cantos da moldura", tipo: "MIG", qtd: 4 },
          { descricao: "Barras horizontais", tipo: "MIG", qtd: (cortes.find(c => c.descricao.includes("horizontal tijolinho"))?.qtd ?? 0) * 2 },
          { descricao: "Barras verticais (amarração)", tipo: "Ponteamento", qtd: (cortes.find(c => c.descricao.includes("vertical tijolinho"))?.qtd ?? 0) * 2, observacao: "Alternar a cada vão (padrão tijolinho)" },
        ],
        sequencia: [
          "Conferir peças cortadas.",
          "Montar moldura no gabarito.",
          "Soldar cantos.",
          "Marcar espaçamento das barras horizontais (~150mm).",
          "Soldar barras horizontais.",
          "Pontear verticais alternando a amarração (padrão tijolinho).",
          "Esmerilhar e limpar.",
        ],
        ferramentas: ferramentasComuns,
        observacoes: obsBase,
      };
    case "grade_fixa_trabalhada":
      return {
        soldas: [
          { descricao: "Cantos da moldura", tipo: "MIG", qtd: 4 },
          { descricao: "Tubos verticais", tipo: "MIG", qtd: (cortes.find(c => c.descricao === "Tubo vertical")?.qtd ?? 0) * 2 },
          { descricao: "Diagonais trabalhadas", tipo: "Ponteamento", qtd: (cortes.find(c => c.descricao.includes("Diagonal"))?.qtd ?? 0) * 2 },
        ],
        sequencia: [
          "Conferir peças cortadas.",
          "Montar moldura no gabarito.",
          "Soldar cantos.",
          "Marcar e soldar tubos verticais (~200mm).",
          "Posicionar diagonais trabalhadas em cada vão.",
          "Pontear e conferir o desenho.",
          "Esmerilhar e limpar.",
        ],
        ferramentas: ferramentasComuns,
        observacoes: obsBase,
      };
  }
}
