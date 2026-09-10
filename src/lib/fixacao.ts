// Sistema de fixação de cada peça: como o quadro é preso na obra.
export type FixacaoTipo =
  | "chumbado_dentro"
  | "chumbado_fora"
  | "parafusado_dentro"
  | "parafusado_fora";

export type FixacaoLados = "um_lado" | "dois_lados";

export const FIXACAO_TIPOS: { id: FixacaoTipo; nome: string; curto: string; instrucao: string }[] = [
  {
    id: "chumbado_dentro",
    nome: "Chumbado por dentro do quadro",
    curto: "Chumbado (dentro)",
    instrucao: "Grapas soldadas na face interna do quadro; furar o vão e chumbar com argamassa.",
  },
  {
    id: "chumbado_fora",
    nome: "Chumbado por fora do quadro",
    curto: "Chumbado (fora)",
    instrucao: "Grapas soldadas na face externa do quadro, sobrepondo o vão; chumbar com argamassa.",
  },
  {
    id: "parafusado_dentro",
    nome: "Parafusado por dentro do quadro",
    curto: "Parafusado (dentro)",
    instrucao: "Furar o quadro por dentro do vão e fixar com parafuso + bucha na alvenaria.",
  },
  {
    id: "parafusado_fora",
    nome: "Parafusado por fora do quadro",
    curto: "Parafusado (fora)",
    instrucao: "Quadro sobreposto ao vão, furação pela face externa e fixação com parafuso + bucha.",
  },
];

export const FIXACAO_LADOS: { id: FixacaoLados; nome: string; curto: string }[] = [
  { id: "um_lado", nome: "Fixação apenas pelo lado de dentro", curto: "1 lado (interno)" },
  { id: "dois_lados", nome: "Fixação pelos dois lados", curto: "2 lados" },
];

export const FIXACAO_PADRAO: FixacaoTipo = "chumbado_dentro";
export const FIXACAO_LADOS_PADRAO: FixacaoLados = "um_lado";

export const fixacaoTipo = (id?: FixacaoTipo) =>
  FIXACAO_TIPOS.find((f) => f.id === id) ?? FIXACAO_TIPOS[0];

export const fixacaoLados = (id?: FixacaoLados) =>
  FIXACAO_LADOS.find((f) => f.id === id) ?? FIXACAO_LADOS[0];

export const ehChumbado = (id?: FixacaoTipo) => fixacaoTipo(id).id.startsWith("chumbado");

/**
 * Quantidade de pontos de fixação: ~1 a cada 60 cm nas laterais e no topo/base,
 * mínimo de 6. Dobra quando a fixação é pelos dois lados.
 */
export function pontosFixacao(largura_mm: number, altura_mm: number, lados?: FixacaoLados): number {
  const porLado = Math.max(2, Math.ceil(altura_mm / 600));
  const porTopo = Math.max(1, Math.ceil(largura_mm / 600));
  const base = porLado * 2 + porTopo * 2;
  return lados === "dois_lados" ? base * 2 : Math.max(6, base);
}

/** Descrição curta pra oficina: "Chumbado (dentro) · 2 lados · 12 pontos". */
export function resumoFixacao(
  largura_mm: number,
  altura_mm: number,
  tipo?: FixacaoTipo,
  lados?: FixacaoLados,
): string {
  const t = fixacaoTipo(tipo);
  const l = fixacaoLados(lados);
  return `${t.curto} · ${l.curto} · ${pontosFixacao(largura_mm, altura_mm, lados)} pontos`;
}
