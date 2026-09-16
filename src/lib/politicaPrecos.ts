// Política de preços da Kochinski Serralheria.
// O preço do orçamento sai desta tabela: valor da unidade x metragem, cobrando
// no mínimo uma unidade de medida. Itens "sob orçamento" têm o valor digitado.
import type { Peca } from "./storage";

export type UnidadePolitica = "m2" | "linear" | "unidade" | "hora" | "sob_orcamento";

export interface ItemPolitica {
  id: string;
  produto: string;
  modelo: string;
  unidade: UnidadePolitica;
  valor: number;
}

export const UNIDADE_LABEL: Record<UnidadePolitica, string> = {
  m2: "por m²",
  linear: "por metro",
  unidade: "por unidade",
  hora: "por hora",
  sob_orcamento: "sob orçamento",
};

export const POLITICA_PADRAO: ItemPolitica[] = [
  { id: "portao-basculante-fechado-com-chapa-frisada", produto: "Portão Basculante", modelo: "Fechado com chapa frisada", unidade: "m2", valor: 850.0 },
  { id: "portao-basculante-fechado-com-chapa-buzio", produto: "Portão Basculante", modelo: "Fechado com chapa búzio", unidade: "m2", valor: 850.0 },
  { id: "portao-basculante-fechado-com-chapa-cartola", produto: "Portão Basculante", modelo: "Fechado com chapa cartola", unidade: "m2", valor: 910.0 },
  { id: "portao-basculante-fechado-com-chapa-cartola-meta", produto: "Portão Basculante", modelo: "Fechado com chapa cartola + metalon", unidade: "m2", valor: 925.0 },
  { id: "portao-basculante-ripado-em-metalon-20x20-com-va", produto: "Portão Basculante", modelo: "Ripado em metalon 20x20 com vão inferior a 4cm", unidade: "m2", valor: 900.0 },
  { id: "portao-basculante-ripado-em-metalon-20x30-com-va", produto: "Portão Basculante", modelo: "Ripado em metalon 20x30 com vão inferior a 4cm", unidade: "m2", valor: 915.0 },
  { id: "portao-basculante-ripado-em-metalon-20x40-com-va", produto: "Portão Basculante", modelo: "Ripado em metalon 20x40 com vão inferior a 4cm", unidade: "m2", valor: 950.0 },
  { id: "portao-basculante-ripado-em-metalon-20x20-com-va-2", produto: "Portão Basculante", modelo: "Ripado em metalon 20x20 com vão superior a 4cm", unidade: "m2", valor: 870.0 },
  { id: "portao-basculante-ripado-em-metalon-20x30-com-va-2", produto: "Portão Basculante", modelo: "Ripado em metalon 20x30 com vão superior a 4cm", unidade: "m2", valor: 895.0 },
  { id: "portao-basculante-ripado-em-metalon-20x40-com-va-2", produto: "Portão Basculante", modelo: "Ripado em metalon 20x40 com vão superior a 4cm", unidade: "m2", valor: 900.0 },
  { id: "portao-basculante-em-chapa-expandida", produto: "Portão Basculante", modelo: "Em chapa expandida", unidade: "m2", valor: 885.0 },
  { id: "portao-basculante-em-chapa-perfurada-furo-redond", produto: "Portão Basculante", modelo: "Em chapa perfurada furo redondo", unidade: "m2", valor: 1025.0 },
  { id: "portao-basculante-em-tela-eletrolsoldada", produto: "Portão Basculante", modelo: "Em tela eletrolsoldada", unidade: "m2", valor: 845.0 },
  { id: "portao-basculante-em-tela-padrao-copel", produto: "Portão Basculante", modelo: "Em tela padrao copel", unidade: "m2", valor: 860.0 },
  { id: "portao-basculante-trabalhado", produto: "Portão Basculante", modelo: "Trabalhado", unidade: "m2", valor: 900.0 },
  { id: "portao-deslizante-trabalhado", produto: "Portão Deslizante", modelo: "Trabalhado", unidade: "m2", valor: 750.0 },
  { id: "portao-deslizante-fechado-com-chapa-frisada", produto: "Portão Deslizante", modelo: "Fechado com chapa frisada", unidade: "m2", valor: 490.0 },
  { id: "portao-deslizante-fechado-em-chapa-buzio", produto: "Portão Deslizante", modelo: "Fechado em chapa búzio", unidade: "m2", valor: 490.0 },
  { id: "portao-deslizante-fechado-com-chapa-cartola", produto: "Portão Deslizante", modelo: "Fechado com chapa cartola", unidade: "m2", valor: 690.0 },
  { id: "portao-deslizante-ripado-em-metalon-20x20-com-va", produto: "Portão Deslizante", modelo: "Ripado em metalon 20x20 com vão inferior a 4cm", unidade: "m2", valor: 500.0 },
  { id: "portao-deslizante-ripado-em-metalon-20x30-com-va", produto: "Portão Deslizante", modelo: "Ripado em metalon 20x30 com vão inferior a 4cm", unidade: "m2", valor: 520.0 },
  { id: "portao-deslizante-ripado-em-metalon-20x40-com-va", produto: "Portão Deslizante", modelo: "Ripado em metalon 20x40 com vão inferior a 4cm", unidade: "m2", valor: 530.0 },
  { id: "portao-deslizante-ripado-em-metalon-20x20-com-va-2", produto: "Portão Deslizante", modelo: "Ripado em metalon 20x20 com vão superior a 4cm", unidade: "m2", valor: 480.0 },
  { id: "portao-deslizante-ripado-em-metalon-20x30-com-va-2", produto: "Portão Deslizante", modelo: "Ripado em metalon 20x30 com vão superior a 4cm", unidade: "m2", valor: 495.0 },
  { id: "portao-deslizante-ripado-em-metalon-20x40-com-va-2", produto: "Portão Deslizante", modelo: "Ripado em metalon 20x40 com vão superior a 4cm", unidade: "m2", valor: 505.0 },
  { id: "portao-deslizante-em-tela-padrao-copel", produto: "Portão Deslizante", modelo: "Em tela padrao copel", unidade: "m2", valor: 400.0 },
  { id: "portao-deslizante-em-tela-eletrosoldada", produto: "Portão Deslizante", modelo: "Em tela eletrosoldada", unidade: "m2", valor: 375.0 },
  { id: "portao-pivotante-trabalhado", produto: "Portão Pivotante", modelo: "Trabalhado", unidade: "m2", valor: 580.0 },
  { id: "portao-pivotante-fechado-com-chapa-frisada", produto: "Portão Pivotante", modelo: "Fechado com chapa frisada", unidade: "m2", valor: 480.0 },
  { id: "portao-pivotante-fechado-em-chapa-buzio", produto: "Portão Pivotante", modelo: "Fechado em chapa búzio", unidade: "m2", valor: 480.0 },
  { id: "portao-pivotante-fechado-com-chapa-cartola", produto: "Portão Pivotante", modelo: "Fechado com chapa cartola", unidade: "m2", valor: 650.0 },
  { id: "portao-pivotante-ripado-em-metalon-20x20-com-vao", produto: "Portão Pivotante", modelo: "Ripado em metalon 20x20 com vão inferior a 4cm", unidade: "m2", valor: 550.0 },
  { id: "portao-pivotante-ripado-em-metalon-20x30-com-vao", produto: "Portão Pivotante", modelo: "Ripado em metalon 20x30 com vão inferior a 4cm", unidade: "m2", valor: 585.0 },
  { id: "portao-pivotante-ripado-em-metalon-20x40-com-vao", produto: "Portão Pivotante", modelo: "Ripado em metalon 20x40 com vão inferior a 4cm", unidade: "m2", valor: 635.0 },
  { id: "portao-pivotante-ripado-em-metalon-20x20-com-vao-2", produto: "Portão Pivotante", modelo: "Ripado em metalon 20x20 com vão superior a 4cm", unidade: "m2", valor: 585.0 },
  { id: "portao-pivotante-ripado-em-metalon-20x30-com-vao-2", produto: "Portão Pivotante", modelo: "Ripado em metalon 20x30 com vão superior a 4cm", unidade: "m2", valor: 600.0 },
  { id: "portao-pivotante-ripado-em-metalon-20x40-com-vao-2", produto: "Portão Pivotante", modelo: "Ripado em metalon 20x40 com vão superior a 4cm", unidade: "m2", valor: 610.0 },
  { id: "portao-pivotante-em-tela-padrao-copel", produto: "Portão Pivotante", modelo: "Em tela padrao copel", unidade: "m2", valor: 445.0 },
  { id: "portao-pivotante-em-tela-eletrosoldada", produto: "Portão Pivotante", modelo: "Em tela eletrosoldada", unidade: "m2", valor: 425.0 },
  { id: "grade-pantografica", produto: "Grade Pantográfica", modelo: "", unidade: "m2", valor: 880.0 },
  { id: "grade-fixa-balaozinho-losango", produto: "Grade Fixa", modelo: "Balãozinho/Losango", unidade: "m2", valor: 360.0 },
  { id: "grade-fixa-ripado-com-vao-inferior-a-4cm", produto: "Grade Fixa", modelo: "Ripado com vão inferior a 4cm", unidade: "m2", valor: 395.0 },
  { id: "grade-fixa-ripado-com-vao-superior-a-4cm", produto: "Grade Fixa", modelo: "Ripado com vão superior a 4cm", unidade: "m2", valor: 365.0 },
  { id: "grade-fixa-trabalhado", produto: "Grade Fixa", modelo: "Trabalhado", unidade: "m2", valor: 450.0 },
  { id: "fechadura-de-sobrepor", produto: "Fechadura de Sobrepor", modelo: "", unidade: "unidade", valor: 150.0 },
  { id: "fechadura-bico-de-papagaio", produto: "Fechadura Bico de Papagaio", modelo: "", unidade: "unidade", valor: 130.0 },
  { id: "fechadura-de-macaneta", produto: "Fechadura de Maçaneta", modelo: "", unidade: "unidade", valor: 130.0 },
  { id: "corrimao-de-parede", produto: "Corrimão de Parede", modelo: "", unidade: "linear", valor: 185.0 },
  { id: "corrimao-de-parede-com-acabamento-canopla", produto: "Corrimão de Parede", modelo: "Com acabamento (canopla)", unidade: "linear", valor: 195.0 },
  { id: "guarda-corpo-redondo-de-1-e-1-2-com-ate-3-barras", produto: "Guarda Corpo", modelo: "Redondo de 1 e 1/2 com até 3 barras de 1/2", unidade: "m2", valor: 335.0 },
  { id: "guarda-corpo-com-caida-redondo-de-1-e-1-2-com-ma", produto: "Guarda Corpo com Caída", modelo: "Redondo de 1 e 1/2 com mais de 4 barras de 1/2", unidade: "m2", valor: 400.0 },
  { id: "guarda-corpo-redondo-de-1-e-1-2-com-mais-de-4-ba", produto: "Guarda Corpo", modelo: "Redondo de 1 e 1/2 com mais de 4 barras de 1/2", unidade: "m2", valor: 415.0 },
  { id: "guarda-corpo-com-caida-redondo-de-1-e-1-2-com-ma-2", produto: "Guarda Corpo com Caída", modelo: "Redondo de 1 e 1/2 com mais de 4 barras de 1/3", unidade: "m2", valor: 450.0 },
  { id: "guarda-corpo-trabalhado", produto: "Guarda Corpo", modelo: "Trabalhado", unidade: "m2", valor: 490.0 },
  { id: "servico-externo", produto: "Servico externo", modelo: "", unidade: "sob_orcamento", valor: 0 },
  { id: "veneziana", produto: "Veneziana", modelo: "", unidade: "m2", valor: 850.0 },
  { id: "solda-externa-ate-1-hora-de-servico-contar-deslo", produto: "Solda Externa", modelo: "Até 1 hora de serviço - contar deslocamento", unidade: "hora", valor: 250.0 },
  { id: "solda-externa-mais-de-1-hora-de-servico-contar-d", produto: "Solda Externa", modelo: "Mais de 1 hora de serviço - contar deslocamento", unidade: "hora", valor: 300.0 },
  { id: "solda-externa-com-ajudante-ate-1-hora-de-servico", produto: "Solda Externa com Ajudante", modelo: "Até 1 hora de serviço - contar deslocamento", unidade: "hora", valor: 300.0 },
  { id: "solda-externa-com-ajudante-mais-de-1-hora-de-ser", produto: "Solda Externa com Ajudante", modelo: "Mais de 1 hora de serviço - contar deslocamento", unidade: "hora", valor: 350.0 },
  { id: "servico-de-solda-na-empresa-ate-15-minutos", produto: "Serviço de Solda na Empresa", modelo: "Até 15 minutos", unidade: "hora", valor: 40.0 },
  { id: "servico-de-solda-na-empresa-mais-de-15-minutos", produto: "Serviço de Solda na Empresa", modelo: "Mais de 15 minutos", unidade: "hora", valor: 40.0 },
  { id: "servico-de-balaceamento-de-portao-basculante-cab", produto: "Servico de balaceamento de portao basculante", modelo: "cabos, roldanas, contrapeso, analise técnica)", unidade: "unidade", valor: 880.0 },
  { id: "servico-de-analise-tecnica-de-motor-avaliacao-in", produto: "Servico de analise tecnica de motor", modelo: "avaliacao in loco com possivel retirada", unidade: "unidade", valor: 175.0 },
  { id: "fechadura-eletrica-ppa-uno-traver", produto: "Fechadura eletrica PPA", modelo: "UNO traver", unidade: "unidade", valor: 280.0 },
  { id: "fechadura-eletrica-ppa-traver-com-sistema-wifi", produto: "Fechadura eletrica PPA", modelo: "Traver com sistema WIFI", unidade: "unidade", valor: 595.0 },
  { id: "eletroima-par-com-acessorios-e-infra", produto: "Eletroima par", modelo: "com acessórios e infra", unidade: "unidade", valor: 900.0 },
  { id: "fechadura-de-miolo", produto: "Fechadura de miolo", modelo: "", unidade: "unidade", valor: 140.0 },
  { id: "escada-metalica", produto: "Escada metálica", modelo: "", unidade: "sob_orcamento", valor: 0 },
  { id: "estrutura-metalica", produto: "Estrutura metálica", modelo: "", unidade: "sob_orcamento", valor: 0 },
  { id: "peca-metalica", produto: "Peca metálica", modelo: "", unidade: "sob_orcamento", valor: 0 },
  { id: "reforma-conserto", produto: "Reforma/conserto", modelo: "", unidade: "sob_orcamento", valor: 0 },
  { id: "mezanino", produto: "Mezanino", modelo: "", unidade: "sob_orcamento", valor: 0 },
  { id: "movelaria", produto: "Movelaria", modelo: "", unidade: "sob_orcamento", valor: 0 },
  { id: "pergolado", produto: "Pergolado", modelo: "", unidade: "sob_orcamento", valor: 0 },
  { id: "portao-rolo-manual-manual", produto: "Portao rolo manual", modelo: "manual", unidade: "m2", valor: 550.0 },
  { id: "portao-rolo-automatico-tira-raiada-perfurada-aut", produto: "Portao rolo automático tira raiada perfurada", modelo: "automático", unidade: "m2", valor: 895.0 },
  { id: "portao-rolo-automatico-tira-raiada-fechada-autom", produto: "Portao rolo automático tira raiada fechada", modelo: "automático", unidade: "m2", valor: 850.0 },
  { id: "grelha-metalica", produto: "Grelha metálica", modelo: "", unidade: "sob_orcamento", valor: 0 },
  { id: "tela-expandida", produto: "Tela Expandida", modelo: "", unidade: "m2", valor: 500.0 },
  { id: "chapa-ondulada", produto: "Chapa Ondulada", modelo: "", unidade: "m2", valor: 450.0 },
  { id: "corrimao-de-parede-simples", produto: "Corrimão de Parede (simples)", modelo: "", unidade: "linear", valor: 180.0 },
  { id: "porta-para-vidro", produto: "Porta para Vidro", modelo: "", unidade: "m2", valor: 1200.0 },
  { id: "tela-perfurada", produto: "Tela Perfurada", modelo: "", unidade: "sob_orcamento", valor: 0 },
  { id: "cabo-aco", produto: "Cabo Aço", modelo: "", unidade: "sob_orcamento", valor: 0 },
  { id: "fotografica", produto: "Fotográfica", modelo: "", unidade: "sob_orcamento", valor: 0 },
  { id: "lixeira-basculante", produto: "Lixeira Basculante", modelo: "", unidade: "sob_orcamento", valor: 0 },
  { id: "trilho", produto: "Trilho", modelo: "", unidade: "sob_orcamento", valor: 0 },
];

/** Serviços de instalação da política (valores de referência, escolhidos no orçamento todo). */
export const SERVICOS_POLITICA: { id: string; nome: string; valor: number }[] = [
  { id: "instalacao-simples", nome: "Instalação simples", valor: 260 },
  { id: "instalacao-complexa", nome: "Instalação complexa", valor: 500 },
];

/** Automações escolhidas peça a peça. */
export const AUTOMACOES_POLITICA: { id: string; nome: string; valor: number }[] = [
  { id: "automacao-deslizante", nome: "Motor deslizante", valor: 380 },
  { id: "automacao-pivotante", nome: "Motor pivotante", valor: 750 },
  { id: "automacao-basculante", nome: "Motor basculante", valor: 450 },
  { id: "automacao-fechadura-eletrica", nome: "Fechadura elétrica", valor: 350 },
  { id: "automacao-eletroima", nome: "Eletroímã", valor: 400 },
];

export const automacaoPolitica = (id?: string | null) => AUTOMACOES_POLITICA.find((a) => a.id === id);

/** Margem padrão aplicada sobre o custo do motor vindo dos materiais. */
export const MARGEM_MOTOR_PADRAO = 30;

/** Deslocamento mínimo cobrado. */
export const FRETE_MINIMO = 180;


/** Aplica os valores editados pela empresa por cima da tabela padrão. */
export function politicaComValores(overrides?: Record<string, number>): ItemPolitica[] {
  if (!overrides) return POLITICA_PADRAO;
  return POLITICA_PADRAO.map((i) => (overrides[i.id] == null ? i : { ...i, valor: Number(overrides[i.id]) }));
}

export const itemPolitica = (id?: string | null, lista: ItemPolitica[] = POLITICA_PADRAO) =>
  lista.find((i) => i.id === id);

/** Produtos únicos, na ordem da planilha. */
export function produtosPolitica(lista: ItemPolitica[] = POLITICA_PADRAO): string[] {
  const vistos: string[] = [];
  lista.forEach((i) => { if (!vistos.includes(i.produto)) vistos.push(i.produto); });
  return vistos;
}

export const modelosPolitica = (produto: string, lista: ItemPolitica[] = POLITICA_PADRAO) =>
  lista.filter((i) => i.produto === produto);

/** Produto sugerido para cada tipologia antiga do sistema. */
export const POLITICA_POR_TIPOLOGIA: Record<string, string> = {
  portao_correr: "portao-deslizante-fechado-com-chapa-frisada",
  portao_basculante: "portao-basculante-fechado-com-chapa-frisada",
  portao_rolo: "portao-rolo-manual-manual",
  portao_pantografico: "grade-pantografica",
  portao_pivotante: "portao-pivotante-fechado-com-chapa-frisada",
  janela_correr_2f: "veneziana",
  estrutura_metalica: "estrutura-metalica",
  veneziana_metalica: "veneziana",
  grade_fixa_balaozinho: "grade-fixa-balaozinho-losango",
  grade_fixa_tijolinho: "grade-fixa-ripado-com-vao-inferior-a-4cm",
  grade_fixa_trabalhada: "grade-fixa-trabalhado",
};

/** Tipologia técnica correspondente a cada item da tabela (deriva do mapa acima). */
export const TIPOLOGIA_POR_POLITICA: Record<string, string> = Object.fromEntries(
  Object.entries(POLITICA_POR_TIPOLOGIA).map(([tip, id]) => [id, tip]),
);

/** Tipologia técnica de um item da tabela, caindo no produto quando não houver mapa direto. */
export function tipologiaDoItem(politicaId?: string | null, lista: ItemPolitica[] = POLITICA_PADRAO): string | undefined {
  if (!politicaId) return undefined;
  if (TIPOLOGIA_POR_POLITICA[politicaId]) return TIPOLOGIA_POR_POLITICA[politicaId];
  const produto = itemPolitica(politicaId, lista)?.produto;
  if (!produto) return undefined;
  const irmao = lista.find((i) => i.produto === produto && TIPOLOGIA_POR_POLITICA[i.id]);
  return irmao ? TIPOLOGIA_POR_POLITICA[irmao.id] : undefined;
}

/** Nome curto sugerido para a peça a partir do item da tabela. */
export function nomeSugeridoPeca(politicaId?: string | null, lista: ItemPolitica[] = POLITICA_PADRAO): string {
  const item = itemPolitica(politicaId, lista);
  return item ? item.produto : "";
}


/**
 * Quantidade cobrada conforme a unidade de medida, sempre com o mínimo de uma
 * unidade cheia (regra geral do orçamento, válida para qualquer produto da tabela).
 */
export function quantidadeCobrada(unidade: UnidadePolitica, largura_mm: number, altura_mm: number): number {
  if (unidade === "m2") return Math.max(1, Number(((largura_mm / 1000) * (altura_mm / 1000)).toFixed(3)));
  if (unidade === "linear") return Math.max(1, Number((largura_mm / 1000).toFixed(3)));
  // unidade, hora e sob orçamento: sempre ao menos uma unidade cheia.
  return 1;
}

// ---- Regra do motor do portão basculante ----

export type PorteMotor = "1/4" | "1/2";

/** Limite do motor 1/4: até 3,00 m de largura e 2,50 m de altura. */
export const LIMITE_MOTOR_QUARTO = { largura_mm: 3000, altura_mm: 2500 };

/** Porte de motor recomendado para o vão do portão. */
export function porteMotorRecomendado(largura_mm: number, altura_mm: number): PorteMotor {
  return largura_mm <= LIMITE_MOTOR_QUARTO.largura_mm && altura_mm <= LIMITE_MOTOR_QUARTO.altura_mm ? "1/4" : "1/2";
}

/** Porte anotado no material (vazio quando o motor não foi classificado). */
export const porteDoMotor = (porte?: string | null): PorteMotor | null =>
  porte === "1/4" || porte === "1/2" ? porte : null;

/** True quando o motor escolhido é menor do que o recomendado para o vão. */
export function motorSubdimensionado(largura_mm: number, altura_mm: number, porte?: string | null): boolean {
  const escolhido = porteDoMotor(porte);
  if (!escolhido) return false;
  return porteMotorRecomendado(largura_mm, altura_mm) === "1/2" && escolhido === "1/4";
}

export interface PrecoPeca {
  item?: ItemPolitica;
  quantidade: number;
  sugerido: number;
  valor: number;
  manual: boolean;
}

/** Preço de uma peça pela política (ou o valor digitado quando houver). */
export function precoPeca(peca: Peca, lista: ItemPolitica[] = POLITICA_PADRAO): PrecoPeca {
  const item = itemPolitica(peca.politica_id, lista);
  const quantidade = item ? quantidadeCobrada(item.unidade, peca.largura_mm, peca.altura_mm) : 1;
  const sugerido = item && item.unidade !== "sob_orcamento"
    ? Number((item.valor * quantidade).toFixed(2))
    : 0;
  const manual = peca.preco_manual != null;
  return { item, quantidade, sugerido, valor: manual ? Number(peca.preco_manual) : sugerido, manual };
}

/** Valor da automação escolhida na peça (editável). */
export function precoAutomacaoPeca(peca: Peca): number {
  if (!peca.automacao_id) return 0;
  if (peca.automacao_valor != null) return Number(peca.automacao_valor);
  return automacaoPolitica(peca.automacao_id)?.valor ?? 0;
}

/** Preço de venda sugerido do motor: custo do material + margem da empresa. */
export function precoMotorSugerido(custo?: number | null, margemPct = MARGEM_MOTOR_PADRAO): number {
  if (!custo) return 0;
  return Number((Number(custo) * (1 + Number(margemPct || 0) / 100)).toFixed(2));
}

/** Valor do motor da peça (digitado ou sugerido pelo custo + margem). */
export function precoMotorPeca(peca: Peca, margemPct = MARGEM_MOTOR_PADRAO): number {
  if (!peca.motor_material_id) return 0;
  if (peca.motor_valor != null) return Number(peca.motor_valor);
  return precoMotorSugerido(peca.motor_custo, margemPct);
}

/** Total cobrado por uma peça: tabela + automação + motor. */
export function totalPeca(peca: Peca, lista: ItemPolitica[] = POLITICA_PADRAO, margemPct = MARGEM_MOTOR_PADRAO): number {
  return Number((precoPeca(peca, lista).valor + precoAutomacaoPeca(peca) + precoMotorPeca(peca, margemPct)).toFixed(2));
}

/** Soma das peças pela política, já com automação e motor. */
export const totalPecasPolitica = (pecas: Peca[], lista: ItemPolitica[] = POLITICA_PADRAO, margemPct = MARGEM_MOTOR_PADRAO): number =>
  Number(pecas.reduce((s, p) => s + totalPeca(p, lista, margemPct), 0).toFixed(2));

