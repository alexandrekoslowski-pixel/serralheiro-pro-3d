// Regras de situação e prazo das ordens de serviço.
import { OrdemStatus, ProjetoLocal, DadosEmpresa, EtapaOficina } from "./storage";

export const ETAPAS_OFICINA: EtapaOficina[] = [
  "fila",
  "producao",
  "acabamento",
  "pintura",
  "entrega",
  "pos_venda",
  "pronto",
];

export const ETAPA_LABEL: Record<EtapaOficina, string> = {
  fila: "Fila",
  producao: "Produção / montagem",
  acabamento: "Acabamento",
  pintura: "Pintura",
  entrega: "Entrega",
  pos_venda: "Pós-venda",
  pronto: "Pronto",
};

export const proximaEtapa = (e: EtapaOficina): EtapaOficina | null => {
  const i = ETAPAS_OFICINA.indexOf(e);
  return i >= 0 && i < ETAPAS_OFICINA.length - 1 ? ETAPAS_OFICINA[i + 1] : null;
};

/** Ex.: "há 2 d" / "há 5 h" desde que entrou na etapa. */
export function tempoNaEtapa(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const h = Math.floor(ms / 3600000);
  if (h < 1) return "agora";
  if (h < 24) return `há ${h} h`;
  return `há ${Math.floor(h / 24)} d`;
}

export const STATUS_ORDEM: OrdemStatus[] = ["orcamento", "aprovado", "producao", "entregue", "faturado"];

export const STATUS_LABEL: Record<OrdemStatus, string> = {
  orcamento: "Orçamento",
  aprovado: "Aprovado",
  producao: "Produção",
  entregue: "Entregue",
  faturado: "Faturado",
};

export const STATUS_CORES: Record<OrdemStatus, { badge: string; chip: string; chipAtivo: string }> = {
  orcamento: {
    badge: "bg-sky-500/15 text-sky-400",
    chip: "border-sky-500/40 text-sky-400",
    chipAtivo: "border-sky-500 bg-sky-500/15 text-sky-400",
  },
  aprovado: {
    badge: "bg-violet-500/15 text-violet-400",
    chip: "border-violet-500/40 text-violet-400",
    chipAtivo: "border-violet-500 bg-violet-500/15 text-violet-400",
  },
  producao: {
    badge: "bg-orange-500/15 text-orange-400",
    chip: "border-orange-500/40 text-orange-400",
    chipAtivo: "border-orange-500 bg-orange-500/15 text-orange-400",
  },
  entregue: {
    badge: "bg-emerald-500/15 text-emerald-400",
    chip: "border-emerald-500/40 text-emerald-400",
    chipAtivo: "border-emerald-500 bg-emerald-500/15 text-emerald-400",
  },
  faturado: {
    badge: "bg-muted text-muted-foreground",
    chip: "border-border text-muted-foreground",
    chipAtivo: "border-foreground/50 bg-muted text-foreground",
  },
};

export const proximoStatus = (s: OrdemStatus): OrdemStatus | null => {
  const i = STATUS_ORDEM.indexOf(s);
  return i >= 0 && i < STATUS_ORDEM.length - 1 ? STATUS_ORDEM[i + 1] : null;
};

export type CorPrazo = "vermelho" | "amarelo" | "verde" | "neutro";

export const diasRestantes = (prazo: string | null): number | null => {
  if (!prazo) return null;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const d = new Date(prazo + "T00:00:00");
  return Math.round((d.getTime() - hoje.getTime()) / 86400000);
};

export function corPrazo(p: ProjetoLocal, empresa: DadosEmpresa): CorPrazo {
  if (p.status === "entregue" || p.status === "faturado") return "neutro";
  const dias = diasRestantes(p.prazo_entrega);
  if (dias === null) return "neutro";
  if (dias <= empresa.limiteVermelhoDias) return "vermelho";
  if (dias <= empresa.limiteAmareloDias) return "amarelo";
  return "verde";
}

export const CLASSES_PRAZO: Record<CorPrazo, { faixa: string; texto: string; badge: string }> = {
  vermelho: { faixa: "bg-destructive", texto: "text-destructive", badge: "bg-destructive/15 text-destructive" },
  amarelo: { faixa: "bg-amber-500", texto: "text-amber-500", badge: "bg-amber-500/15 text-amber-500" },
  verde: { faixa: "bg-emerald-500", texto: "text-emerald-500", badge: "bg-emerald-500/15 text-emerald-500" },
  neutro: { faixa: "bg-muted", texto: "text-muted-foreground", badge: "bg-muted text-muted-foreground" },
};

export function textoPrazo(p: ProjetoLocal): string {
  if (!p.prazo_entrega) return "Sem prazo";
  const d = diasRestantes(p.prazo_entrega)!;
  const data = new Date(p.prazo_entrega + "T00:00:00").toLocaleDateString("pt-BR");
  if (p.status === "entregue" || p.status === "faturado") return data;
  if (d < 0) return `Atrasado ${Math.abs(d)} d · ${data}`;
  if (d === 0) return `Vence hoje · ${data}`;
  return `Faltam ${d} d · ${data}`;
}

export const dataISO = (d: Date): string => d.toISOString().slice(0, 10);

export const somarDias = (dias: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return dataISO(d);
};
