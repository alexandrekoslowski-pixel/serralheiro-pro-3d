// Catálogo de tipologias suportadas pelo Serralheiro Pro 3D.
export type AcabamentoId = string;

export type TipologiaId =
  | "portao_correr"
  | "portao_basculante"
  | "portao_rolo"
  | "portao_pantografico"
  | "portao_pivotante"
  | "janela_correr_2f"
  | "estrutura_metalica"
  | "veneziana_metalica"
  | "grade_fixa_balaozinho"
  | "grade_fixa_tijolinho"
  | "grade_fixa_trabalhada";

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
    larguraMin: 1500, larguraMax: 10000, larguraDefault: 3500,
    alturaMin: 1800, alturaMax: 10000, alturaDefault: 2000,
  },
  {
    id: "portao_basculante",
    nome: "Portão Basculante",
    descricao: "Folha única articulada que bascula para cima.",
    larguraMin: 2000, larguraMax: 10000, larguraDefault: 3000,
    alturaMin: 1800, alturaMax: 10000, alturaDefault: 2100,
  },
  {
    id: "portao_rolo",
    nome: "Portão de Rolo",
    descricao: "Lâminas horizontais que enrolam em eixo superior.",
    larguraMin: 1500, larguraMax: 10000, larguraDefault: 3000,
    alturaMin: 2000, alturaMax: 10000, alturaDefault: 2500,
  },
  {
    id: "portao_pantografico",
    nome: "Portão Pantográfico",
    descricao: "Sistema retrátil em X que dobra lateralmente.",
    larguraMin: 1500, larguraMax: 10000, larguraDefault: 3000,
    alturaMin: 1800, alturaMax: 10000, alturaDefault: 2000,
  },
  {
    id: "portao_pivotante",
    nome: "Portão Pivotante",
    descricao: "Folha que gira em eixo vertical descentralizado.",
    larguraMin: 2500, larguraMax: 10000, larguraDefault: 3500,
    alturaMin: 1800, alturaMax: 10000, alturaDefault: 2100,
  },
  {
    id: "janela_correr_2f",
    nome: "Janela de Correr 2 Folhas",
    descricao: "Janela com duas folhas deslizantes e vidro temperado.",
    larguraMin: 800, larguraMax: 10000, larguraDefault: 1500,
    alturaMin: 600, alturaMax: 10000, alturaDefault: 1000,
  },
  {
    id: "estrutura_metalica",
    nome: "Estrutura Metálica",
    descricao: "Quadro de montantes e travessas para fechamentos.",
    larguraMin: 1000, larguraMax: 10000, larguraDefault: 3000,
    alturaMin: 1500, alturaMax: 10000, alturaDefault: 2500,
  },
  {
    id: "veneziana_metalica",
    nome: "Veneziana Metálica",
    descricao: "Lâminas inclinadas para ventilação e proteção.",
    larguraMin: 600, larguraMax: 10000, larguraDefault: 1500,
    alturaMin: 600, alturaMax: 10000, alturaDefault: 1200,
  },
  {
    id: "grade_fixa_balaozinho",
    nome: "Grade Fixa Balãozinho",
    descricao: "Grade de proteção fixa com tubos verticais em balãozinho.",
    larguraMin: 400, larguraMax: 10000, larguraDefault: 1200,
    alturaMin: 400, alturaMax: 10000, alturaDefault: 1200,
  },
  {
    id: "grade_fixa_tijolinho",
    nome: "Grade Fixa Tijolinho",
    descricao: "Grade de proteção fixa em padrão tijolinho (amarração alternada).",
    larguraMin: 400, larguraMax: 10000, larguraDefault: 1200,
    alturaMin: 400, alturaMax: 10000, alturaDefault: 1200,
  },
  {
    id: "grade_fixa_trabalhada",
    nome: "Grade Fixa Trabalhada",
    descricao: "Grade de proteção fixa com desenhos trabalhados e diagonais.",
    larguraMin: 400, larguraMax: 10000, larguraDefault: 1200,
    alturaMin: 400, alturaMax: 10000, alturaDefault: 1200,
  },
];

export const tipologiaPorId = (id: TipologiaId): Tipologia => {
  const t = TIPOLOGIAS.find((x) => x.id === id);
  if (!t) throw new Error(`Tipologia desconhecida: ${id}`);
  return t;
};

export const ACABAMENTOS: { id: AcabamentoId; nome: string; hex: string; multiplicador: number }[] = [
  { id: "amarelo-lb-1003-inat", nome: "Amarelo LB 1003 INAT", hex: "#e0a916", multiplicador: 1 },
  { id: "azul-5005-w3", nome: "Azul 5005 W3", hex: "#174a74", multiplicador: 1 },
  { id: "bege-7032-txt-w3", nome: "Bege 7032 TXT W3", hex: "#aaa58d", multiplicador: 1 },
  { id: "bege-marfim-w3", nome: "Bege Marfim W3", hex: "#d7c7a4", multiplicador: 1 },
  { id: "branco", nome: "Branco 40112 W3", hex: "#f2f1eb", multiplicador: 1 },
  { id: "branco-mtx-weg", nome: "Branco MTX WEG", hex: "#e8e8e3", multiplicador: 1 },
  { id: "champagne-lfosco-inat", nome: "Champagne LFosco INAT", hex: "#c1a77b", multiplicador: 1 },
  { id: "cinza-carvao-7016-lf-inat", nome: "Cinza Carvão 7016 LF INAT", hex: "#383e42", multiplicador: 1 },
  { id: "cinza-grafite-txt-w3", nome: "Cinza Grafite TXT W3", hex: "#4e5150", multiplicador: 1 },
  { id: "cinza-n65-liso-w3", nome: "Cinza N6,5 Liso W3", hex: "#85898a", multiplicador: 1 },
  { id: "dourado-renner", nome: "Dourado Renner", hex: "#a88138", multiplicador: 1 },
  { id: "grafite-7024-w3", nome: "Grafite 7024 W3", hex: "#474a4d", multiplicador: 1 },
  { id: "laranja-2004-w3", nome: "Laranja 2004 W3", hex: "#d6531d", multiplicador: 1 },
  { id: "laranja-lb-2008-w3", nome: "Laranja LB 2008 W3", hex: "#e56622", multiplicador: 1 },
  { id: "marrom-8014-brasilux", nome: "Marrom 8014 Brasilux", hex: "#49372b", multiplicador: 1 },
  { id: "bronze", nome: "Marrom Bronze W3", hex: "#604b3a", multiplicador: 1.15 },
  { id: "marrom-cafe-w3", nome: "Marrom Café W3", hex: "#3f2d25", multiplicador: 1 },
  { id: "marrom-pinhao-renner", nome: "Marrom Pinhão Renner", hex: "#57382d", multiplicador: 1 },
  { id: "prata-w3", nome: "Prata W3", hex: "#aeb3b5", multiplicador: 1 },
  { id: "preto", nome: "Preto Acetinado W3", hex: "#252525", multiplicador: 1.05 },
  { id: "preto-craqueado-inat", nome: "Preto Craqueado INAT", hex: "#1c1c1c", multiplicador: 1 },
  { id: "preto-sb-w3", nome: "Preto SB W3", hex: "#141414", multiplicador: 1 },
  { id: "preto-texturizado-w3", nome: "Preto Texturizado W3", hex: "#303030", multiplicador: 1 },
  { id: "rose-gold-w3", nome: "Rose Gold W3", hex: "#b77b71", multiplicador: 1 },
  { id: "verde-6005-w3", nome: "Verde 6005 W3", hex: "#17483b", multiplicador: 1 },
  { id: "verde-folha-w3", nome: "Verde Folha W3", hex: "#347139", multiplicador: 1 },
  { id: "verde-oliva-6003-lsf-inat", nome: "Verde Oliva 6003 LSF INAT", hex: "#4b5435", multiplicador: 1 },
  { id: "vermelho-3001-w3", nome: "Vermelho 3001 W3", hex: "#9b242d", multiplicador: 1 },
  { id: "violeta-lb-inat", nome: "Violeta LB INAT", hex: "#633a64", multiplicador: 1 },
  { id: "natural", nome: "Natural", hex: "#a8abad", multiplicador: 1 },
];

export const acabamentoPorId = (id: AcabamentoId) =>
  ACABAMENTOS.find((a) => a.id === id) ?? ACABAMENTOS[0];
