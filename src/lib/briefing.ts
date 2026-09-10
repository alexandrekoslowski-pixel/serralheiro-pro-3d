// Modelo de perguntas do briefing, com perguntas condicionais.

export interface Pergunta {
  id: string;
  label: string;
  opcoes: string[];
  /** só aparece quando outra pergunta tiver um destes valores */
  depende?: { de: string; valores: string[] };
  texto?: boolean;
}

export const TIPOS_SERVICO = [
  { id: "portao", nome: "Portão" },
  { id: "porta", nome: "Porta" },
  { id: "grade", nome: "Grade" },
  { id: "corrimao", nome: "Corrimão" },
  { id: "estrutura", nome: "Estrutura metálica" },
  { id: "outro", nome: "Outro" },
];

const SIM_NAO = ["Sim", "Não"];

const COMUNS: Pergunta[] = [
  { id: "local", label: "Local da instalação", opcoes: ["Residência", "Comércio", "Condomínio", "Indústria"] },
  { id: "medidas_no_local", label: "Precisa de visita para medir?", opcoes: SIM_NAO },
  { id: "prazo_cliente", label: "Urgência do cliente", opcoes: ["Sem pressa", "Normal", "Urgente"] },
];

const PORTAO: Pergunta[] = [
  { id: "abertura", label: "Tipo de abertura", opcoes: ["Basculante", "Pivotante", "Deslizante", "Rolo", "Outro"] },
  { id: "social", label: "Possui portão social?", opcoes: SIM_NAO },
  { id: "social_tipo", label: "Tipo do portão social", opcoes: ["Abrir", "Embutido", "Lateral"], depende: { de: "social", valores: ["Sim"] } },
  { id: "fechamento", label: "Tipo de fechamento", opcoes: ["Fechadura comum", "Fechadura elétrica", "Magnética", "Outro"] },
  { id: "macaneta", label: "Maçaneta", opcoes: ["Tradicional", "Alavanca", "Outro"] },
  { id: "automacao", label: "Portão automatizado?", opcoes: SIM_NAO },
  { id: "motor_marca", label: "Marca do motor", opcoes: ["PPA", "Garen", "Rossi", "Outro"], depende: { de: "automacao", valores: ["Sim"] } },
  { id: "motor_modelo", label: "Modelo do motor", opcoes: [], texto: true, depende: { de: "automacao", valores: ["Sim"] } },
  { id: "motor_alimentacao", label: "Alimentação de energia próxima?", opcoes: SIM_NAO, depende: { de: "automacao", valores: ["Sim"] } },
  { id: "motor_controle", label: "Quantidade de controles", opcoes: ["2", "4", "6"], depende: { de: "automacao", valores: ["Sim"] } },
  { id: "chapa", label: "Fechamento da folha", opcoes: ["Chapa lisa", "Chapa perfurada", "Ripado", "Vazado"] },
];

const PORTA: Pergunta[] = [
  { id: "porta_tipo", label: "Tipo de porta", opcoes: ["Abrir", "Correr", "Lambril", "Grade"] },
  { id: "fechamento", label: "Tipo de fechamento", opcoes: ["Fechadura comum", "Fechadura elétrica", "Magnética", "Outro"] },
  { id: "macaneta", label: "Maçaneta", opcoes: ["Tradicional", "Alavanca", "Outro"] },
  { id: "vidro", label: "Leva vidro?", opcoes: SIM_NAO },
];

const GRADE: Pergunta[] = [
  { id: "modelo", label: "Modelo da grade", opcoes: ["Balãozinho", "Tijolinho", "Trabalhada", "Simples"] },
  { id: "removivel", label: "Precisa ser removível?", opcoes: SIM_NAO },
];

const CORRIMAO: Pergunta[] = [
  { id: "material", label: "Material", opcoes: ["Ferro", "Inox", "Alumínio"] },
  { id: "lances", label: "Quantidade de lances", opcoes: ["1", "2", "3", "4+"] },
];

const ESTRUTURA: Pergunta[] = [
  { id: "estrutura_tipo", label: "Tipo de estrutura", opcoes: ["Cobertura", "Mezanino", "Escada", "Outro"] },
  { id: "telha", label: "Leva telha?", opcoes: SIM_NAO },
  { id: "telha_tipo", label: "Tipo de telha", opcoes: ["Galvanizada", "Termoacústica", "Policarbonato"], depende: { de: "telha", valores: ["Sim"] } },
];

const FIM: Pergunta[] = [
  { id: "pintura", label: "Pintura", opcoes: ["Eletrostática", "Esmalte", "Sem pintura"] },
  { id: "fixacao", label: "Fixação", opcoes: ["Chumbado", "Parafusado", "A definir"] },
];

export function perguntasDo(tipo: string): Pergunta[] {
  const mapa: Record<string, Pergunta[]> = {
    portao: PORTAO, porta: PORTA, grade: GRADE, corrimao: CORRIMAO, estrutura: ESTRUTURA, outro: [],
  };
  return [...COMUNS, ...(mapa[tipo] ?? []), ...FIM];
}

/** Perguntas visíveis conforme as respostas atuais. */
export function perguntasVisiveis(tipo: string, respostas: Record<string, string>): Pergunta[] {
  return perguntasDo(tipo).filter(
    (p) => !p.depende || p.depende.valores.includes(respostas[p.depende.de] ?? ""),
  );
}

/** Resumo em texto do briefing, para colar no orçamento ou na OS. */
export function resumoBriefing(tipo: string, respostas: Record<string, string>): string {
  return perguntasVisiveis(tipo, respostas)
    .filter((p) => respostas[p.id])
    .map((p) => `${p.label}: ${respostas[p.id]}`)
    .join("\n");
}
