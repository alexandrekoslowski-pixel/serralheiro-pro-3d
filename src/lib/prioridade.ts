// Pontuação de prioridade das ordens.
import type { ProjetoLocal } from "./storage";

export type NivelPrioridade = "critica" | "alta" | "normal" | "baixa";

export const NIVEIS: Record<NivelPrioridade, { nome: string; cor: string; emoji: string }> = {
  critica: { nome: "Crítica", cor: "text-destructive", emoji: "🔴" },
  alta: { nome: "Alta", cor: "text-amber-500", emoji: "🟠" },
  normal: { nome: "Normal", cor: "text-yellow-400", emoji: "🟡" },
  baixa: { nome: "Baixa", cor: "text-muted-foreground", emoji: "⚪" },
};

const diasAte = (data: string | null): number | null => {
  if (!data) return null;
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const alvo = new Date(`${data}T00:00:00`);
  return Math.round((alvo.getTime() - hoje.getTime()) / 86400000);
};

export interface Prioridade {
  nivel: NivelPrioridade;
  pontos: number;
  motivos: string[];
}

export function prioridadeDa(p: ProjetoLocal, opts?: { clienteEstrategico?: boolean }): Prioridade {
  if (p.prioridade_manual && p.prioridade_manual in NIVEIS) {
    return { nivel: p.prioridade_manual as NivelPrioridade, pontos: 0, motivos: ["Definida pelo gestor"] };
  }

  let pontos = 0;
  const motivos: string[] = [];
  const d = diasAte(p.prazo_entrega);

  if (d !== null) {
    if (d < 0) { pontos += 60; motivos.push(`Atrasada há ${Math.abs(d)} dia(s)`); }
    else if (d <= 3) { pontos += 40; motivos.push("Entrega em até 3 dias"); }
    else if (d <= 7) { pontos += 20; motivos.push("Entrega nesta semana"); }
    else { pontos += 5; }
  }

  if (p.total >= 100000) { pontos += 25; motivos.push("Contrato de alto valor"); }
  else if (p.total >= 30000) { pontos += 15; motivos.push("Contrato relevante"); }
  else if (p.total >= 10000) { pontos += 8; }

  if (opts?.clienteEstrategico) { pontos += 15; motivos.push("Cliente estratégico"); }

  const complexidade = p.pecas?.length ?? 1;
  if (complexidade >= 5) { pontos += 10; motivos.push("Muitas peças"); }
  else if (complexidade >= 3) { pontos += 5; }

  if (p.status === "producao") { pontos += 5; }

  const nivel: NivelPrioridade =
    pontos >= 60 ? "critica" : pontos >= 40 ? "alta" : pontos >= 20 ? "normal" : "baixa";

  return { nivel, pontos, motivos };
}
