// Catálogo de tipologias suportadas pelo Serralheiro Pro 3D.
export type AcabamentoId = "branco" | "preto" | "natural" | "bronze";

export type TipologiaId =
  | "portao_correr"
  | "portao_basculante"
  | "portao_rolo"
  | "portao_pantografico"
  | "portao_pivotante"
  | "janela_correr_2f"
  | "estrutura_metalica"
  | "veneziana_metalica";

export interface Tipologia {
  id: TipologiaId;
  nome: string;
  descricao: string;
  larguraMin: number;
  larguraMax: number;
  larguraDefault: number;
  alturaMin: number;
  alturaMax: number;
  alturaDefault: number;
}

export const TIPOLOGIAS: Tipologia[] = [
  {
    id: "portao_correr",
    nome: "Portão de Correr",
    descricao: "Portão deslizante sobre trilho inferior, ideal para garagens.",
    larguraMin: 1500, larguraMax: 6000, larguraDefault: 3500,
    alturaMin: 1800, alturaMax: 2500, alturaDefault: 2000,
  },
  {
    id: "portao_basculante",
    nome: "Portão Basculante",
    descricao: "Folha única articulada que bascula para cima.",
    larguraMin: 2000, larguraMax: 5000, larguraDefault: 3000,
    alturaMin: 1800, alturaMax: 2400, alturaDefault: 2100,
  },
  {
    id: "portao_rolo",
    nome: "Portão de Rolo",
    descricao: "Lâminas horizontais que enrolam em eixo superior.",
    larguraMin: 1500, larguraMax: 5000, larguraDefault: 3000,
    alturaMin: 2000, alturaMax: 3000, alturaDefault: 2500,
  },
  {
    id: "portao_pantografico",
    nome: "Portão Pantográfico",
    descricao: "Sistema retrátil em X que dobra lateralmente.",
    larguraMin: 1500, larguraMax: 5000, larguraDefault: 3000,
    alturaMin: 1800, alturaMax: 2400, alturaDefault: 2000,
  },
  {
    id: "portao_pivotante",
    nome: "Portão Pivotante",
    descricao: "Folha que gira em eixo vertical descentralizado.",
    larguraMin: 2500, larguraMax: 6000, larguraDefault: 3500,
    alturaMin: 1800, alturaMax: 2400, alturaDefault: 2100,
  },
  {
    id: "janela_correr_2f",
    nome: "Janela de Correr 2 Folhas",
    descricao: "Janela com duas folhas deslizantes e vidro temperado.",
    larguraMin: 800, larguraMax: 2400, larguraDefault: 1500,
    alturaMin: 600, alturaMax: 1500, alturaDefault: 1000,
  },
  {
    id: "estrutura_metalica",
    nome: "Estrutura Metálica",
    descricao: "Quadro de montantes e travessas para fechamentos.",
    larguraMin: 1000, larguraMax: 6000, larguraDefault: 3000,
    alturaMin: 1500, alturaMax: 4000, alturaDefault: 2500,
  },
  {
    id: "veneziana_metalica",
    nome: "Veneziana Metálica",
    descricao: "Lâminas inclinadas para ventilação e proteção.",
    larguraMin: 600, larguraMax: 3000, larguraDefault: 1500,
    alturaMin: 600, alturaMax: 2400, alturaDefault: 1200,
  },
];

export const tipologiaPorId = (id: TipologiaId): Tipologia => {
  const t = TIPOLOGIAS.find((x) => x.id === id);
  if (!t) throw new Error(`Tipologia desconhecida: ${id}`);
  return t;
};

export const ACABAMENTOS: { id: AcabamentoId; nome: string; hex: string; multiplicador: number }[] = [
  { id: "branco", nome: "Branco", hex: "#f5f5f0", multiplicador: 1.0 },
  { id: "preto", nome: "Preto", hex: "#1a1a1a", multiplicador: 1.05 },
  { id: "natural", nome: "Natural", hex: "#b8b8b8", multiplicador: 1.0 },
  { id: "bronze", nome: "Bronze", hex: "#5a3a1f", multiplicador: 1.15 },
];

export const acabamentoPorId = (id: AcabamentoId) =>
  ACABAMENTOS.find((a) => a.id === id) ?? ACABAMENTOS[0];
