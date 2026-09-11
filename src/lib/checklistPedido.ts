import { z } from "zod";
import type { TipologiaId } from "./tipologias";

export type RespostasChecklist = Record<string, string>;
export type TipoPerguntaChecklist = "opcao" | "multipla" | "texto";

export interface PerguntaChecklist {
  id: string;
  label: string;
  tipo: TipoPerguntaChecklist;
  opcoes?: string[];
  obrigatoria?: boolean;
  ajuda?: string;
  depende?: { de: string; valores: string[] };
  comercial?: boolean;
}

export interface SecaoChecklist {
  id: string;
  titulo: string;
  perguntas: PerguntaChecklist[];
}

const SN = ["Sim", "Não"];
const opcao = (id: string, label: string, opcoes: string[], extra: Partial<PerguntaChecklist> = {}): PerguntaChecklist =>
  ({ id, label, tipo: "opcao", opcoes, obrigatoria: true, ...extra });
const multipla = (id: string, label: string, opcoes: string[], extra: Partial<PerguntaChecklist> = {}): PerguntaChecklist =>
  ({ id, label, tipo: "multipla", opcoes, obrigatoria: true, ...extra });
const texto = (id: string, label: string, extra: Partial<PerguntaChecklist> = {}): PerguntaChecklist =>
  ({ id, label, tipo: "texto", obrigatoria: true, ...extra });

const COMUNS: PerguntaChecklist[] = [
  opcao("comum.medidas", "As medidas são estimadas ou finais?", ["Estimadas", "Finais"], { comercial: true }),
  opcao("comum.visita", "Precisa de visita para medição fina?", SN, { comercial: true }),
  opcao("comum.servico", "Qual é o tipo do serviço?", ["Fabricação nova", "Reforma", "Substituição"]),
  opcao("comum.retirada", "Precisa retirar a estrutura existente?", SN),
  opcao("comum.local", "Onde será a instalação?", ["Residência", "Comércio", "Condomínio", "Indústria"]),
  opcao("comum.altura", "Como é o acesso para instalação?", ["Térreo e livre", "Precisa de escada", "Precisa de andaime", "Acesso restrito"]),
  opcao("comum.esquadro", "O vão está no esquadro e no nível?", ["Sim", "Não", "A confirmar na medição"]),
  opcao("comum.base", "Qual é a base de fixação?", ["Alvenaria", "Concreto", "Estrutura metálica", "Madeira", "A confirmar"]),
  multipla("comum.interferencias", "Existem interferências no local?", ["Nenhuma", "Piso", "Parede", "Viga", "Forro", "Tubulação", "Outra"]),
  opcao("comum.energia", "Há energia próxima ao equipamento?", ["Sim, 127 V", "Sim, 220 V", "Não", "Não se aplica"]),
  opcao("comum.lado", "Referência do lado de abertura", ["Visto por dentro do imóvel", "Visto pela rua", "Não se aplica"]),
  opcao("comum.cor", "Acabamento e cor foram confirmados?", SN, { comercial: true }),
  multipla("comum.inclusos", "O que está incluído no pedido?", ["Frete", "Instalação", "Pedreiro", "Elétrica", "Automação", "Somente fabricação"], { comercial: true }),
  texto("comum.observacoes", "Observações e detalhes combinados", { obrigatoria: false, ajuda: "Opcional" }),
];

const MOTOR: PerguntaChecklist[] = [
  opcao("motor.origem", "Qual motor será usado?", ["PPA novo", "Outra marca nova", "Motor existente"], { depende: { de: "acionamento", valores: ["Automatizado"] } }),
  texto("motor.modelo", "Modelo e potência do motor", { depende: { de: "acionamento", valores: ["Automatizado"] } }),
  opcao("motor.tensao", "Tensão do motor", ["127 V", "220 V", "Bivolt", "A confirmar"], { depende: { de: "acionamento", valores: ["Automatizado"] } }),
  opcao("motor.controles", "Quantidade de controles", ["1", "2", "3", "4", "Mais de 4"], { depende: { de: "acionamento", valores: ["Automatizado"] } }),
  multipla("motor.seguranca", "Itens de automação", ["Fotocélula", "Botoeira", "Nobreak", "Destravamento manual", "Nenhum adicional"], { depende: { de: "acionamento", valores: ["Automatizado"] } }),
];

const FECHAMENTOS = ["Sobrepor manual", "Sobrepor elétrica", "Maçaneta", "Bico de papagaio", "Trinco ferrolho", "Trinco de ferro chato"];
const PREENCHIMENTOS = ["Chapa lisa", "Chapa frisada", "Lambril", "Ripado", "Tela", "Vazado", "Outro"];

const BASCULANTE: PerguntaChecklist[] = [
  opcao("basculante.embutido", "O portão será embutido?", SN),
  opcao("basculante.social", "Como será a folha?", ["Inteira", "Com portão social embutido", "Com portão social lateral"]),
  opcao("basculante.social_posicao", "Posição do portão social", ["Esquerda", "Direita"], { depende: { de: "basculante.social", valores: ["Com portão social embutido", "Com portão social lateral"] } }),
  opcao("basculante.social_abertura", "Sentido de abertura do portão social", ["Para dentro", "Para fora"], { depende: { de: "basculante.social", valores: ["Com portão social embutido", "Com portão social lateral"] } }),
  opcao("basculante.movimento", "O basculamento será para qual lado?", ["Para dentro", "Para fora"]),
  opcao("basculante.contrapeso", "Onde ficará a caixa de contrapeso?", ["Esquerda", "Direita", "Ambos os lados"]),
  opcao("basculante.espaco", "Há espaço para braços, guias e contrapesos?", ["Sim", "Não", "A confirmar na medição"]),
  opcao("acionamento", "O portão será manual ou automatizado?", ["Manual", "Automatizado"]),
  ...MOTOR,
  multipla("basculante.fechamento", "Tipos de fechamento aplicáveis", FECHAMENTOS),
  opcao("basculante.preenchimento", "Tipo de preenchimento", PREENCHIMENTOS, { comercial: true }),
  multipla("basculante.preparacoes", "Preparações e reforços", ["Nenhum", "Reforço estrutural", "Travessas extras", "Vidro", "Puxador", "Caixa de correio"]),
];

const CORRER: PerguntaChecklist[] = [
  opcao("correr.folhas", "Quantidade de folhas", ["1 folha", "2 folhas"]),
  opcao("correr.recolhimento", "Lado de recolhimento visto por dentro", ["Esquerda", "Direita", "Ambos"]),
  opcao("correr.trilho", "Sistema do trilho", ["Trilho no piso", "Suspenso"]),
  opcao("correr.piso", "O piso está nivelado e pronto?", ["Sim", "Não", "A confirmar"]),
  opcao("correr.espaco", "Há espaço lateral para recolhimento total?", ["Sim", "Não", "A confirmar"]),
  opcao("acionamento", "O portão será manual ou automatizado?", ["Manual", "Automatizado"]),
  ...MOTOR,
  opcao("correr.social", "Terá portão social?", SN),
  multipla("correr.fechamento", "Tipos de fechamento aplicáveis", FECHAMENTOS),
  opcao("correr.preenchimento", "Tipo de preenchimento", PREENCHIMENTOS, { comercial: true }),
];

const PIVOTANTE: PerguntaChecklist[] = [
  opcao("pivotante.folhas", "Quantidade de folhas", ["1 folha", "2 folhas"]),
  opcao("pivotante.mao", "Mão de abertura vista por dentro", ["Esquerda", "Direita", "Duas folhas"]),
  opcao("pivotante.sentido", "Abre para dentro ou para fora?", ["Para dentro", "Para fora"]),
  opcao("pivotante.articulacao", "Sistema de articulação", ["Dobradiça", "Pivô", "Aproveitar existente"]),
  opcao("pivotante.social", "Terá folha social?", SN),
  multipla("pivotante.fechamento", "Tipos de fechamento aplicáveis", FECHAMENTOS),
  opcao("pivotante.piso", "Condição do piso e folga inferior", ["Nivelado", "Com desnível", "A confirmar"]),
  opcao("acionamento", "Será manual ou automatizado?", ["Manual", "Automatizado"]),
  ...MOTOR,
];

const ROLO: PerguntaChecklist[] = [
  opcao("acionamento", "O portão será manual ou automatizado?", ["Manual", "Automatizado"]),
  ...MOTOR,
  opcao("rolo.lamina", "Tipo de lâmina", ["Fechada", "Transvision", "Perfurada", "A definir"]),
  opcao("rolo.enrolamento", "Posição do enrolamento", ["Interno", "Externo"]),
  opcao("rolo.caixa", "Eixo e caixa ficarão como?", ["Aparentes", "Embutidos"]),
  opcao("rolo.espaco", "Há espaço superior suficiente?", ["Sim", "Não", "A confirmar"]),
  opcao("rolo.trava", "Fechamento inferior", ["Trava lateral", "Fechadura central", "Trava automática", "Outro"]),
  opcao("rolo.emergencia", "Existe outro acesso em caso de falta de energia?", SN),
];

const PANTOGRAFICO: PerguntaChecklist[] = [
  opcao("pantografico.recolhimento", "Lado de recolhimento", ["Esquerda", "Direita", "Ambos"]),
  opcao("pantografico.trilho", "Trilhos", ["Superior", "Inferior", "Superior e inferior"]),
  opcao("pantografico.removivel", "O trilho inferior deve ser removível?", SN),
  opcao("pantografico.folhas", "Quantidade de folhas", ["1 folha", "2 folhas"]),
  opcao("pantografico.espaco", "Há espaço lateral livre para recolhimento?", ["Sim", "Não", "A confirmar"]),
  multipla("pantografico.fechamento", "Tipos de fechamento aplicáveis", FECHAMENTOS),
];

const GRADE: PerguntaChecklist[] = [
  opcao("grade.posicao", "Instalação em relação ao vão", ["Por dentro", "Por fora", "Dentro do vão"]),
  opcao("grade.removivel", "A grade será fixa ou removível?", ["Fixa", "Removível"]),
  opcao("grade.abertura", "Precisa abrir para limpeza ou manutenção?", SN),
  texto("grade.espacamento", "Espaçamento desejado entre barras (cm)"),
  multipla("grade.seguranca", "Requisitos de segurança", ["Crianças", "Animais", "Antifurto", "Nenhum específico"]),
  opcao("grade.complemento", "Terá algum complemento?", ["Nenhum", "Tela", "Chapa", "Vidro", "Outro"]),
];

const JANELA: PerguntaChecklist[] = [
  opcao("janela.folhas", "Configuração das folhas", ["2 móveis", "1 móvel e 1 fixa", "2 móveis e 2 fixas"]),
  opcao("janela.sentido", "Sentido principal de abertura", ["Esquerda", "Direita", "Ambos"]),
  opcao("janela.vidro", "O vidro está incluso?", ["Sim", "Não, será do cliente", "Sem vidro"]),
  texto("janela.vidro_tipo", "Tipo e espessura do vidro", { depende: { de: "janela.vidro", valores: ["Sim", "Não, será do cliente"] } }),
  multipla("janela.itens", "Itens aplicáveis", ["Fecho", "Puxador", "Tela", "Grade de proteção", "Nenhum"]),
  multipla("janela.base", "Condições do vão", ["Peitoril", "Pingadeira", "Desnível", "Precisa vedação", "Sem particularidades"]),
];

const ESTRUTURA: PerguntaChecklist[] = [
  opcao("estrutura.uso", "Uso da estrutura", ["Interno", "Externo"]),
  opcao("estrutura.tipo", "Tipo principal", ["Cobertura", "Mezanino", "Escada", "Quadro", "Outro"]),
  opcao("estrutura.base", "Onde será fixada?", ["Piso", "Parede", "Estrutura existente", "Base a executar"]),
  opcao("estrutura.condicao", "A base foi verificada?", ["Sim", "Não", "Precisa de visita técnica"]),
  opcao("estrutura.fechamento", "Tipo de fechamento", ["Sem fechamento", "Barras", "Chapa", "Tela", "Vidro", "Telha"]),
  multipla("estrutura.cobertura", "Itens de cobertura", ["Não se aplica", "Telha", "Caimento", "Calha", "Rufos"]),
  texto("estrutura.vaos", "Vãos livres, apoios e interferências"),
  opcao("estrutura.validacao", "Precisa de projeto ou validação estrutural?", ["Sim", "Não", "A confirmar"]),
];

const VENEZIANA: PerguntaChecklist[] = [
  opcao("veneziana.uso", "Uso da veneziana", ["Ventilação", "Fechamento", "Proteção visual", "Outro"]),
  opcao("veneziana.fixa", "Será fixa ou móvel?", ["Fixa", "Móvel"]),
  opcao("veneziana.laminas", "Orientação das lâminas", ["Ventilação para cima", "Ventilação para baixo", "A definir"]),
  opcao("veneziana.tela", "Precisa de tela interna?", SN),
  opcao("veneziana.chuva", "Ficará exposta à chuva?", SN),
];

const POR_TIPO: Record<TipologiaId, { titulo: string; perguntas: PerguntaChecklist[] }> = {
  portao_basculante: { titulo: "Portão basculante", perguntas: BASCULANTE },
  portao_correr: { titulo: "Portão de correr", perguntas: CORRER },
  portao_pivotante: { titulo: "Portão pivotante / porta de abrir", perguntas: PIVOTANTE },
  portao_rolo: { titulo: "Portão de rolo", perguntas: ROLO },
  portao_pantografico: { titulo: "Portão pantográfico", perguntas: PANTOGRAFICO },
  janela_correr_2f: { titulo: "Janelas", perguntas: JANELA },
  estrutura_metalica: { titulo: "Estruturas metálicas", perguntas: ESTRUTURA },
  veneziana_metalica: { titulo: "Venezianas", perguntas: VENEZIANA },
  grade_fixa_balaozinho: { titulo: "Grades fixas", perguntas: GRADE },
  grade_fixa_tijolinho: { titulo: "Grades fixas", perguntas: GRADE },
  grade_fixa_trabalhada: { titulo: "Grades fixas", perguntas: GRADE },
};

export const CHECKLIST_VERSAO = 1;
const respostaSchema = z.record(z.string().max(500));

export function normalizarRespostasChecklist(valor: unknown): RespostasChecklist {
  const parsed = respostaSchema.safeParse(valor);
  if (!parsed.success) return {};
  return Object.fromEntries(Object.entries(parsed.data).map(([k, v]) => [k, v.trim()]));
}

export function secoesChecklist(tipos: TipologiaId[], respostas: RespostasChecklist): SecaoChecklist[] {
  const unicos = Array.from(new Set(tipos));
  const grupos = new Map<string, SecaoChecklist>();
  grupos.set("comum", { id: "comum", titulo: "Informações gerais", perguntas: COMUNS });
  unicos.forEach((tipo) => {
    const grupo = POR_TIPO[tipo];
    if (!grupo) return;
    if (Array.from(grupos.values()).some((secao) => secao.titulo === grupo.titulo)) return;
    const perguntas = grupo.perguntas.map((pergunta) => ({
      ...pergunta,
      id: `${tipo}.${pergunta.id}`,
      depende: pergunta.depende
        ? { ...pergunta.depende, de: `${tipo}.${pergunta.depende.de}` }
        : undefined,
    }));
    grupos.set(tipo, { id: tipo, titulo: grupo.titulo, perguntas });
  });
  return Array.from(grupos.values()).map((secao) => ({
    ...secao,
    perguntas: secao.perguntas.filter((p) => !p.depende || p.depende.valores.includes(respostas[p.depende.de] ?? "")),
  }));
}

export function perguntasPendentes(tipos: TipologiaId[], respostas: RespostasChecklist): PerguntaChecklist[] {
  return secoesChecklist(tipos, respostas).flatMap((s) => s.perguntas).filter((p) => p.obrigatoria !== false && !respostas[p.id]?.trim());
}

export function limparRespostasOcultas(tipos: TipologiaId[], respostas: RespostasChecklist): RespostasChecklist {
  const visiveis = new Set(secoesChecklist(tipos, respostas).flatMap((s) => s.perguntas.map((p) => p.id)));
  return Object.fromEntries(Object.entries(respostas).filter(([id]) => visiveis.has(id)));
}

export function linhasChecklist(tipos: TipologiaId[], respostas: RespostasChecklist, somenteComercial = false) {
  return secoesChecklist(tipos, respostas).flatMap((secao) => secao.perguntas
    .filter((p) => respostas[p.id] && (!somenteComercial || p.comercial))
    .map((p) => ({ secao: secao.titulo, pergunta: p.label, resposta: respostas[p.id] })));
}