// Cronograma de entregas: quantas entregas cabem por dia e qual a próxima data livre.
import type { ProjetoLocal, DadosEmpresa } from "./storage";
import { dataISO } from "./ordens";

/** Ordens que ainda vão ser entregues (entregue/faturado não ocupam agenda). */
export const ordemAberta = (p: ProjetoLocal): boolean =>
  p.status !== "entregue" && p.status !== "faturado";

export const capacidadeDia = (empresa: DadosEmpresa): number =>
  Math.max(1, Math.floor(empresa.entregasPorDia ?? 2));

/** Domingo nunca entrega; sábado depende da configuração. */
export function diaUtil(iso: string, empresa: DadosEmpresa): boolean {
  const dia = new Date(`${iso}T00:00:00`).getDay();
  if (dia === 0) return false;
  if (dia === 6) return empresa.entregaSabado !== false;
  return true;
}

/** Mapa data → ordens abertas marcadas para aquele dia. */
export function entregasPorDia(projetos: ProjetoLocal[]): Map<string, ProjetoLocal[]> {
  const mapa = new Map<string, ProjetoLocal[]>();
  for (const p of projetos) {
    if (!p.prazo_entrega || !ordemAberta(p)) continue;
    const lista = mapa.get(p.prazo_entrega) ?? [];
    lista.push(p);
    mapa.set(p.prazo_entrega, lista);
  }
  return mapa;
}

const somar = (iso: string, dias: number): string => {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + dias);
  return dataISO(d);
};

export const emDias = (dias: number): string => somar(dataISO(new Date()), dias);

/**
 * A partir de uma data desejada, devolve o primeiro dia útil com vaga.
 * `ignorarId` deixa de contar a própria ordem ao remarcar.
 */
export function proximaDataLivre(
  desejada: string,
  projetos: ProjetoLocal[],
  empresa: DadosEmpresa,
  ignorarId?: string,
): string {
  const capacidade = capacidadeDia(empresa);
  const ocupacao = entregasPorDia(projetos.filter((p) => p.id !== ignorarId));
  let data = desejada;
  for (let i = 0; i < 365; i++) {
    const ocupado = (ocupacao.get(data) ?? []).length;
    if (diaUtil(data, empresa) && ocupado < capacidade) return data;
    data = somar(data, 1);
  }
  return desejada;
}

/** Data de entrega sugerida ao aprovar: prazo padrão empurrado para o próximo dia com vaga. */
export function dataEntregaSugerida(
  projetos: ProjetoLocal[],
  empresa: DadosEmpresa,
  ignorarId?: string,
): string {
  return proximaDataLivre(emDias(empresa.prazoPadraoDias), projetos, empresa, ignorarId);
}

export interface DiaCheio {
  data: string;
  ordens: ProjetoLocal[];
  capacidade: number;
}

/** Dias com mais entregas do que a oficina aguenta, do mais próximo ao mais distante. */
export function datasSobrecarregadas(projetos: ProjetoLocal[], empresa: DadosEmpresa): DiaCheio[] {
  const capacidade = capacidadeDia(empresa);
  const cheios: DiaCheio[] = [];
  for (const [data, ordens] of entregasPorDia(projetos)) {
    if (ordens.length > capacidade || !diaUtil(data, empresa)) {
      cheios.push({ data, ordens, capacidade });
    }
  }
  return cheios.sort((a, b) => a.data.localeCompare(b.data));
}

export const dataBR = (iso: string): string =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR");
