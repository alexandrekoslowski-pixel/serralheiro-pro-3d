// Camada de dados: cache em memória (leitura síncrona) sincronizado com a nuvem.
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TipologiaId, AcabamentoId, TIPOLOGIAS, tipologiaPorId } from "./tipologias";
import { ItemOverride, ItemExtra } from "./calculator";
import { Catalogo, CATALOGO_PADRAO } from "./catalogo";
import { CHECKLIST_VERSAO, normalizarRespostasChecklist, type RespostasChecklist } from "./checklistPedido";
import { POLITICA_POR_TIPOLOGIA } from "./politicaPrecos";

export type OrdemStatus = "orcamento" | "aprovado" | "producao" | "entregue" | "faturado";
export type EtapaOficina =
  | "medicao"
  | "fila"
  | "producao"
  | "acabamento"
  | "pintura"
  | "entrega"
  | "pos_venda"
  | "pronto";

/** Uma peça do orçamento (portão, janela, grade…). */
import { FixacaoTipo, FixacaoLados, FIXACAO_PADRAO, FIXACAO_LADOS_PADRAO } from "./fixacao";

export interface Peca {
  id: string;
  nome: string;
  /** Verdadeiro quando a vendedora digitou o nome — nunca renumerar esse nome. */
  nome_manual?: boolean;
  tipologia: TipologiaId;
  largura_mm: number;
  altura_mm: number;
  cor: AcabamentoId;
  fixacao: FixacaoTipo;
  fixacaoLados: FixacaoLados;
  /** Item da política de preços que define o valor desta peça. */
  politica_id?: string;
  /** Valor digitado à mão (sobrepõe a tabela). */
  preco_manual?: number | null;
  /** Automação escolhida para esta peça. */
  automacao_id?: string | null;
  automacao_valor?: number | null;
  /** Motor vindo do cadastro de materiais. */
  motor_material_id?: string | null;
  motor_nome?: string;
  motor_custo?: number | null;
  motor_valor?: number | null;
  /** Porte do motor escolhido ("1/4" ou "1/2"), para conferir se atende o vão. */
  motor_porte?: string | null;
  checklist_respostas: RespostasChecklist;

}

/** Nome completo do produto, usado para identificar peças automáticas nos documentos. */
export function categoriaNomePeca(tipologia: TipologiaId): string {
  return tipologiaPorId(tipologia).nome;
}

const NOME_PECA_LEGADO = /^(?:Peça|Portão|Janela|Grade|Estrutura|Veneziana|Item)\s+\d+$/i;

const escaparRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Diz se o nome da peça ainda é automático (gerado pelo sistema, em qualquer formato antigo ou novo). */
function nomePecaEhAutomatico(nome: string): boolean {
  const n = nome.trim();
  if (!n) return true;
  if (/\s*\((?:c[oó]pia)\)\s*$/i.test(n)) return true;
  if (NOME_PECA_LEGADO.test(n)) return true;
  const alvo = n.toLocaleLowerCase("pt-BR");
  return TIPOLOGIAS.some((t) => {
    const base = t.nome.toLocaleLowerCase("pt-BR");
    return alvo === base || new RegExp(`^${escaparRegex(base)}\\s+\\d+$`).test(alvo);
  });
}

/**
 * Numera nomes automáticos pelo nome completo do produto, sem sobrescrever nomes personalizados.
 * Quando só existe uma peça daquele produto, o nome fica sem número.
 */
export function renumerarNomesAutomaticosPecas(pecas: Peca[]): Peca[] {
  // Só as peças com nome automático participam da numeração; nomes personalizados não contam.
  const totais = new Map<string, number>();
  pecas.forEach((p) => {
    if (p.nome_manual || !nomePecaEhAutomatico(p.nome ?? "")) return;
    const categoria = categoriaNomePeca(p.tipologia);
    totais.set(categoria, (totais.get(categoria) ?? 0) + 1);
  });
  const contadores = new Map<string, number>();
  return pecas.map((peca) => {
    if (peca.nome_manual || !nomePecaEhAutomatico(peca.nome ?? "")) return peca;
    const categoria = categoriaNomePeca(peca.tipologia);
    const numero = (contadores.get(categoria) ?? 0) + 1;
    contadores.set(categoria, numero);
    const nome = (totais.get(categoria) ?? 0) > 1 ? `${categoria} ${numero}` : categoria;
    return { ...peca, nome };
  });
}

/** Medição fina feita no local (em cima das fotos anotadas). */
export interface MedicaoOS {
  largura_mm: number | null;
  altura_mm: number | null;
  observacoes: string;
}

/** Checklist de pós-venda respondido pela vendedora/gestor. */
export interface PosVendaOS {
  instalacao_ok: boolean;
  cliente_satisfeito: boolean;
  sem_problemas: boolean;
  retorno: string;
  concluido_em: string | null;
}

export interface ProjetoLocal {
  id: string;
  nome: string;
  /** Quando verdadeiro, preserva o nome digitado pela vendedora. */
  nome_manual?: boolean;
  vendedora: string;
  cliente: string;
  cliente_documento: string;
  cliente_endereco: string;
  cliente_numero: string;
  cliente_complemento: string;
  cliente_bairro: string;
  cliente_cidade: string;
  cliente_cep: string;
  cliente_telefone: string;
  cliente_email: string;
  local_instalacao: string;
  prazo_dias_uteis: number | null;
  servicos_valor: number | null;
  frete_valor: number | null;
  /** Serviços da política escolhidos (instalação, automação…). */
  servicos_politica?: { id: string; nome: string; valor: number }[];
  observacoes_proposta: string;
  checklist_versao: number;
  checklist_respostas: RespostasChecklist;
  tipologia: TipologiaId;
  largura_mm: number;
  altura_mm: number;
  cor: AcabamentoId;
  maoObraPct: number;
  margemPct: number;
  descontoGeralPct: number;
  pecas: Peca[];
  overrides: Record<string, ItemOverride>;
  extras: ItemExtra[];
  total: number;
  cliente_id: string | null;
  briefing_id: string | null;
  responsavel_id: string | null;
  prioridade_manual: string | null;
  status: OrdemStatus;

  etapa: EtapaOficina;
  etapa_em: string;
  prazo_entrega: string | null; // YYYY-MM-DD
  valor_faturado: number;
  aprovado_em: string | null;
  entregue_em: string | null;
  faturado_em: string | null;
  enviado_em: string | null;
  enviado_por_nome: string;
  followup_status: "aguardando" | "pendente" | "feito" | "erro";
  followup_em: string | null;
  followup_tentativa_em: string | null;
  followup_erro: string;
  /** Quando o PDF do orçamento foi gerado pela última vez. */
  orcamento_pdf_em: string | null;
  /** Quando o contrato foi gerado pela última vez. */
  contrato_pdf_em: string | null;
  /** Aprovado, mas ainda não liberado para a oficina. */
  aguardando_oficina: boolean;
  medicao: MedicaoOS;
  posvenda: PosVendaOS;
  created_at: string;
  updated_at: string;
}

export interface Pagamento {
  id: string;
  projeto_id: string;
  data: string; // YYYY-MM-DD
  valor: number;
  forma: string;
  observacao: string;
  comprovante_caminho: string | null;
  comprovante_nome: string | null;
  comprovante_tipo: string | null;
  comprovante_enviado_em: string | null;
}

export interface DadosEmpresa {
  nome: string;
  cnpj: string;
  telefone: string;
  email: string;
  endereco: string;
  prazoPadraoDias: number;
  limiteVermelhoDias: number;
  limiteAmareloDias: number;
  /** Meta semanal de faturamento (R$) exibida no painel do gestor. */
  metaSemanal: number;
  codigoOficina: string;
  /** Equipe de vendas */
  vendedoras: string[];
  /** Empresas parceiras de pintura */
  empresasPintura: string[];
  /** Proposta comercial */
  prazoDiasUteis: number;
  validadeDias: number;
  garantiaDias: number;
  pixChave: string;
  pixFavorecido: string;
  visitaTecnica: number;
  textoPagamento: string;
  textoTecnico: string;
  msgSolicitarDados: string;
  msgFollowUp: string;
  msgVisitaTecnica: string;
  clausulasContrato: string;
  /** Valores editados da política de preços (id do item → valor). */
  politicaValores: Record<string, number>;
  /** Margem (%) aplicada sobre o custo do motor vindo dos materiais. */
  margemMotorPct: number;
}

export const TEXTO_PAGAMENTO_PADRAO = [
  "Valores de R$ 0,00 a R$ 1.000,00 — 1x sem juros;",
  "Valores de R$ 1.000,00 até R$ 2.000,00 — em até 2x sem juros;",
  "Valores de R$ 2.000,00 até R$ 3.000,00 — em até 3x sem juros;",
  "Valores acima de R$ 3.000,00 — em até 4x sem juros;",
  "Valores acima de R$ 4.000,00 — metade no PIX e a outra metade em até 5x sem juros;",
  "À vista com 5% de desconto (sendo 50% no ato e 50% na entrega);",
  "Valor cheio em até 12x no cartão de crédito com os juros da máquina — simule.",
].join("\n");

export const TEXTO_TECNICO_PADRAO = [
  "Se os campos serviços e frete não estiverem preenchidos, não estão sendo considerados na composição do orçamento;",
  "Não inclusa mão de obra de pedreiro, se necessária;",
  "Não inclusos vidro, puxadores e caixa de correio — consulte disponibilidade e valores;",
  "Trabalhamos com pintura eletrostática epóxi, o melhor processo de pintura do nosso segmento;",
  "Garantia de fábrica de 90 dias;",
  "Se considerada automação, é necessário que a ligação de energia esteja próxima aos aparelhos; caso não esteja, validar com o técnico de automação o valor deste serviço.",
].join("\n");

export const MSG_SOLICITAR_DADOS_PADRAO = [
  "Boa tarde, tudo bem?",
  "Para seguirmos com o orçamento, solicito as seguintes informações:",
  "• CPF ou CNPJ",
  "• Endereço completo",
  "• Nome e sobrenome",
].join("\n");

export const MSG_FOLLOWUP_PADRAO =
  "Olá, espero que esteja bem! Enviei uma proposta há alguns dias e gostaria de saber se teve a oportunidade de analisá-la. Estou à disposição para esclarecer qualquer dúvida ou discutir detalhes. Aguardo seu retorno!";

export const MSG_VISITA_PADRAO =
  "A visita técnica tem um custo de R$ 50,00 e, em caso de fechamento da OS, esse valor é descontado do total. Confirma o interesse? Você também pode nos mandar as medidas para uma estimativa de custo e, se lhe interessar, marcamos a visita para retirar as medidas finas.";

const K_PROJETOS = "spro:projetos";
const K_EMPRESA = "spro:empresa";
const K_CATALOGO = "spro:catalogo";

const safe = <T,>(fn: () => T, fallback: T): T => {
  try { return fn(); } catch { return fallback; }
};

export const gerarId = (): string =>
  Math.random().toString(36).slice(2, 7) + Date.now().toString(36).slice(-4);

export const EMPRESA_PADRAO: DadosEmpresa = {
  nome: "Sua Serralheria",
  cnpj: "",
  telefone: "",
  email: "",
  endereco: "",
  prazoPadraoDias: 15,
  limiteVermelhoDias: 3,
  limiteAmareloDias: 7,
  metaSemanal: 40000,
  codigoOficina: "",
  vendedoras: [],
  empresasPintura: [],
  prazoDiasUteis: 22,
  validadeDias: 5,
  garantiaDias: 90,
  pixChave: "",
  pixFavorecido: "",
  visitaTecnica: 50,
  textoPagamento: TEXTO_PAGAMENTO_PADRAO,
  textoTecnico: TEXTO_TECNICO_PADRAO,
  msgSolicitarDados: MSG_SOLICITAR_DADOS_PADRAO,
  msgFollowUp: MSG_FOLLOWUP_PADRAO,
  msgVisitaTecnica: MSG_VISITA_PADRAO,
  clausulasContrato: "A contratada executará os serviços conforme as especificações aprovadas. O contratante deverá garantir acesso ao local, condições adequadas para instalação e os pagamentos acordados. Alterações solicitadas após a aprovação poderão mudar valor e prazo. A garantia não cobre mau uso, intervenção de terceiros ou alterações no local.",
  politicaValores: {},
  margemMotorPct: 30,
};

// ---------- estado em memória ----------
let userId: string | null = null;
/** Dono do cadastro único da serralheria (a linha de empresa usada por toda a equipe). */
let empresaUserId: string | null = null;
/** Conta dona da serralheria: todas as gravações usam esse id, mesmo para membros da equipe. */
let donoId: string | null = null;
const idDono = () => donoId ?? empresaUserId ?? userId;
let projetos: ProjetoLocal[] = [];
let pagamentos: Pagamento[] = [];
let empresa: DadosEmpresa = { ...EMPRESA_PADRAO };
let catalogo: Catalogo = CATALOGO_PADRAO;

const listeners = new Set<() => void>();
export function assinarDados(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
const notificar = () => listeners.forEach((f) => f());

const normalizarProjeto = (p: Partial<ProjetoLocal>): ProjetoLocal => {
  const base = {
  status: "orcamento",
  etapa: "fila",
  etapa_em: new Date().toISOString(),
  prazo_entrega: null,
  valor_faturado: 0,
  cliente_id: null,
  briefing_id: null,
  responsavel_id: null,
  prioridade_manual: null,
  aprovado_em: null,
  entregue_em: null,
  faturado_em: null,
  enviado_em: null,
  enviado_por_nome: "",
  followup_status: "aguardando",
  followup_em: null,
  followup_tentativa_em: null,
  followup_erro: "",
  orcamento_pdf_em: null,
  contrato_pdf_em: null,
  aguardando_oficina: false,
  medicao: { largura_mm: null, altura_mm: null, observacoes: "" },
  posvenda: { instalacao_ok: false, cliente_satisfeito: false, sem_problemas: false, retorno: "", concluido_em: null },
  overrides: {},
  extras: [],
  checklist_versao: CHECKLIST_VERSAO,
  checklist_respostas: {},
  total: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  pecas: [],
  vendedora: "",
  cliente_documento: "",
  cliente_endereco: "",
  cliente_numero: "",
  cliente_complemento: "",
  cliente_bairro: "",
  cliente_cidade: "",
  cliente_cep: "",
  cliente_telefone: "",
  cliente_email: "",
  local_instalacao: "",
  prazo_dias_uteis: null,
  servicos_valor: null,
  frete_valor: null,
  observacoes_proposta: "",
  nome_manual: false,
  ...(p as ProjetoLocal),
  } as ProjetoLocal;

  // Orçamentos antigos (uma peça só) viram uma lista com uma peça.
  if (!Array.isArray(base.pecas) || base.pecas.length === 0) {
    base.pecas = [{
      id: gerarId(),
      nome: categoriaNomePeca(base.tipologia),
      tipologia: base.tipologia,
      largura_mm: base.largura_mm,
      altura_mm: base.altura_mm,
      cor: base.cor,
      fixacao: FIXACAO_PADRAO,
      fixacaoLados: FIXACAO_LADOS_PADRAO,
      checklist_respostas: {},
    }];
  }
  base.pecas = base.pecas.map((peca, index) => {
    const respostas = normalizarRespostasChecklist(peca.checklist_respostas);
    if (index === 0 && Object.keys(respostas).length === 0) {
      const prefixo = `${peca.tipologia}.`;
      Object.entries(base.checklist_respostas ?? {}).forEach(([chave, valor]) => {
        if (chave.startsWith(prefixo)) respostas[chave.slice(prefixo.length)] = valor;
      });
    }
    return { ...peca, checklist_respostas: respostas };
  });
  base.pecas = renumerarNomesAutomaticosPecas(base.pecas);
  // Peças antigas sem sistema de fixação / produto da política recebem o padrão.
  base.pecas = base.pecas.map((pc) => ({
    ...pc,
    fixacao: pc.fixacao ?? FIXACAO_PADRAO,
    fixacaoLados: pc.fixacaoLados ?? FIXACAO_LADOS_PADRAO,
    politica_id: pc.politica_id ?? POLITICA_POR_TIPOLOGIA[pc.tipologia] ?? "",
    preco_manual: pc.preco_manual ?? null,
    automacao_id: pc.automacao_id ?? null,
    automacao_valor: pc.automacao_valor ?? null,
    motor_material_id: pc.motor_material_id ?? null,
    motor_nome: pc.motor_nome ?? "",
    motor_custo: pc.motor_custo ?? null,
    motor_valor: pc.motor_valor ?? null,
    motor_porte: pc.motor_porte ?? null,
  }));

  base.servicos_politica = Array.isArray(base.servicos_politica) ? base.servicos_politica : [];
  // Campos antigos continuam refletindo a primeira peça (compatibilidade).
  const p0 = base.pecas[0];
  base.tipologia = p0.tipologia;
  base.largura_mm = p0.largura_mm;
  base.altura_mm = p0.altura_mm;
  base.cor = p0.cor;
  base.checklist_versao = Number(base.checklist_versao || CHECKLIST_VERSAO);
  base.checklist_respostas = normalizarRespostasChecklist(base.checklist_respostas);
  base.medicao = { largura_mm: null, altura_mm: null, observacoes: "", ...(base.medicao ?? {}) };
  base.posvenda = { instalacao_ok: false, cliente_satisfeito: false, sem_problemas: false, retorno: "", concluido_em: null, ...(base.posvenda ?? {}) };
  return base;
};

// ---------- sincronização ----------
const linhaParaProjeto = (row: Record<string, unknown>): ProjetoLocal =>
  normalizarProjeto({
    ...(row.dados as Record<string, unknown>),
    id: row.id as string,
    nome: row.nome as string,
    cliente: (row.cliente as string) ?? "",
    status: row.status as OrdemStatus,
    etapa: ((row.etapa as EtapaOficina) ?? "fila"),
    etapa_em: (row.etapa_em as string) ?? new Date().toISOString(),
    prazo_entrega: (row.prazo_entrega as string) ?? null,
    total: Number(row.total ?? 0),
    valor_faturado: Number(row.valor_faturado ?? 0),
    aprovado_em: (row.aprovado_em as string) ?? null,
    entregue_em: (row.entregue_em as string) ?? null,
    faturado_em: (row.faturado_em as string) ?? null,
    enviado_em: (row.enviado_em as string) ?? null,
    enviado_por_nome: (row.enviado_por_nome as string) ?? "",
    followup_status: (row.followup_status as ProjetoLocal["followup_status"]) ?? "aguardando",
    followup_em: (row.followup_em as string) ?? null,
    followup_tentativa_em: (row.followup_tentativa_em as string) ?? null,
    followup_erro: (row.followup_erro as string) ?? "",
    cliente_id: (row.cliente_id as string) ?? null,
    briefing_id: (row.briefing_id as string) ?? null,
    responsavel_id: (row.responsavel_id as string) ?? null,
    prioridade_manual: (row.prioridade_manual as string) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  } as Partial<ProjetoLocal>);

const projetoParaLinha = (p: ProjetoLocal) => ({
  id: p.id,
  user_id: idDono(),
  nome: p.nome,
  cliente: p.cliente,
  status: p.status,
  etapa: p.etapa,
  etapa_em: p.etapa_em,
  prazo_entrega: p.prazo_entrega,
  total: p.total,
  valor_faturado: p.valor_faturado,
  aprovado_em: p.aprovado_em,
  entregue_em: p.entregue_em,
  faturado_em: p.faturado_em,
  enviado_em: p.enviado_em,
  enviado_por_nome: p.enviado_por_nome,
  followup_status: p.followup_status,
  followup_em: p.followup_em,
  followup_tentativa_em: p.followup_tentativa_em,
  followup_erro: p.followup_erro,
  cliente_id: p.cliente_id,
  briefing_id: p.briefing_id,
  responsavel_id: p.responsavel_id,
  prioridade_manual: p.prioridade_manual,
  dados: {
    nome_manual: p.nome_manual ?? false,
    tipologia: p.tipologia,
    largura_mm: p.largura_mm,
    altura_mm: p.altura_mm,
    cor: p.cor,
    maoObraPct: p.maoObraPct,
    margemPct: p.margemPct,
    descontoGeralPct: p.descontoGeralPct,
    overrides: p.overrides,
    extras: p.extras,
    pecas: p.pecas,
    vendedora: p.vendedora,
    cliente_documento: p.cliente_documento,
    cliente_endereco: p.cliente_endereco,
    cliente_numero: p.cliente_numero,
    cliente_complemento: p.cliente_complemento,
    cliente_bairro: p.cliente_bairro,
    cliente_cidade: p.cliente_cidade,
    cliente_cep: p.cliente_cep,
    cliente_telefone: p.cliente_telefone,
    cliente_email: p.cliente_email,
    local_instalacao: p.local_instalacao,
    prazo_dias_uteis: p.prazo_dias_uteis,
    servicos_valor: p.servicos_valor,
    frete_valor: p.frete_valor,
    servicos_politica: p.servicos_politica ?? [],
    observacoes_proposta: p.observacoes_proposta,
    checklist_versao: p.checklist_versao,
    checklist_respostas: p.checklist_respostas,
    medicao: p.medicao,
    posvenda: p.posvenda,
    orcamento_pdf_em: p.orcamento_pdf_em,
    contrato_pdf_em: p.contrato_pdf_em,
    aguardando_oficina: p.aguardando_oficina,
  },
  updated_at: p.updated_at,
});

const lerLocais = (): ProjetoLocal[] =>
  safe(() => {
    const raw = localStorage.getItem(K_PROJETOS);
    return raw ? (JSON.parse(raw) as ProjetoLocal[]).map(normalizarProjeto) : [];
  }, []);

/** Carrega tudo da nuvem para a memória. Deve rodar antes de exibir o app. */
export async function hidratarNuvem(uid: string): Promise<void> {
  userId = uid;
  const { data: donoRpc } = await supabase.rpc("dono_atual", { _user_id: uid });
  donoId = (donoRpc as string | null) ?? uid;

  const [proj, pag, emp, cat, vinc] = await Promise.all([
    supabase.from("projetos").select("*").order("updated_at", { ascending: false }),
    supabase.from("pagamentos").select("*").order("data", { ascending: false }),
    supabase.from("empresa").select("*").order("updated_at", { ascending: false }).limit(1),
    supabase.from("catalogo").select("*").maybeSingle(),
    supabase.from("materiais").select("codigo_calculo,custo,unidade_compra,comprimento_comercial_mm").neq("codigo_calculo", ""),
  ]);

  projetos = (proj.data ?? []).map((r) => linhaParaProjeto(r as Record<string, unknown>));
  pagamentos = (pag.data ?? []).map((r) => ({
    id: r.id as string,
    projeto_id: r.projeto_id as string,
    data: r.data as string,
    valor: Number(r.valor ?? 0),
    forma: r.forma as string,
    observacao: (r.observacao as string) ?? "",
    comprovante_caminho: (r.comprovante_caminho as string) ?? null,
    comprovante_nome: (r.comprovante_nome as string) ?? null,
    comprovante_tipo: (r.comprovante_tipo as string) ?? null,
    comprovante_enviado_em: (r.comprovante_enviado_em as string) ?? null,
  }));

  const linhaEmpresa = (emp.data ?? [])[0];
  empresaUserId = (linhaEmpresa as { user_id?: string } | undefined)?.user_id ?? uid;
  if (linhaEmpresa) {
    const d = (linhaEmpresa.dados ?? {}) as Partial<DadosEmpresa>;
    empresa = {
      ...EMPRESA_PADRAO,
      ...d,
      prazoPadraoDias: linhaEmpresa.prazo_padrao_dias ?? 15,
      limiteVermelhoDias: linhaEmpresa.limite_vermelho_dias ?? 3,
      limiteAmareloDias: linhaEmpresa.limite_amarelo_dias ?? 7,
      codigoOficina: (linhaEmpresa as { codigo_oficina?: string }).codigo_oficina ?? "",
    };
  } else {
    empresa = safe(() => {
      const raw = localStorage.getItem(K_EMPRESA);
      return raw ? { ...EMPRESA_PADRAO, ...JSON.parse(raw) } : { ...EMPRESA_PADRAO };
    }, { ...EMPRESA_PADRAO });
    // cria a linha da empresa já com o código da oficina
    const criada = await supabase
      .from("empresa")
      .upsert({ user_id: uid } as never)
      .select()
      .maybeSingle();
    if (criada.data) {
      empresa.codigoOficina = (criada.data as { codigo_oficina?: string }).codigo_oficina ?? "";
    }
  }

  if (cat.data) {
    const d = (cat.data.dados ?? {}) as Partial<Catalogo>;
    catalogo = {
      perfis: d.perfis ?? CATALOGO_PADRAO.perfis,
      acessorios: d.acessorios ?? CATALOGO_PADRAO.acessorios,
      vidroPorM2: d.vidroPorM2 ?? CATALOGO_PADRAO.vidroPorM2,
      multiplicadoresCor: d.multiplicadoresCor ?? CATALOGO_PADRAO.multiplicadoresCor,
    };
  } else {
    catalogo = CATALOGO_PADRAO;
  }

  // Aplica os preços reais dos materiais ligados a um código de cálculo.
  const vinculos = (vinc.data ?? []) as { codigo_calculo: string; custo: number; comprimento_comercial_mm: number | null }[];
  if (vinculos.length) {
    catalogo = {
      ...catalogo,
      perfis: catalogo.perfis.map((p) => {
        const m = vinculos.find((v) => v.codigo_calculo === p.codigo);
        if (!m || !Number(m.custo)) return p;
        const compM = (Number(m.comprimento_comercial_mm) || 6000) / 1000;
        return { ...p, precoPorMetro: Number((Number(m.custo) / compM).toFixed(2)) };
      }),
      acessorios: catalogo.acessorios.map((a) => {
        const m = vinculos.find((v) => v.codigo_calculo === a.codigo);
        return m && Number(m.custo) ? { ...a, preco: Number(m.custo) } : a;
      }),
      vidroPorM2: Number(vinculos.find((v) => v.codigo_calculo === "VIDRO-M2")?.custo) || catalogo.vidroPorM2,
    };
  }

  notificar();
}

/** Quantos projetos antigos ainda estão só neste navegador. */
export function projetosLocaisPendentes(): number {
  if (!userId) return 0;
  const locais = lerLocais();
  const idsNuvem = new Set(projetos.map((p) => p.id));
  return locais.filter((p) => !idsNuvem.has(p.id)).length;
}

/** Envia os projetos antigos deste navegador para a conta na nuvem. */
export async function importarLocaisParaNuvem(): Promise<number> {
  if (!userId) return 0;
  const idsNuvem = new Set(projetos.map((p) => p.id));
  const pendentes = lerLocais().filter((p) => !idsNuvem.has(p.id));
  if (!pendentes.length) return 0;
  const { error } = await supabase.from("projetos").upsert(pendentes.map(projetoParaLinha) as never);
  if (error) throw error;
  projetos = [...pendentes, ...projetos];
  localStorage.removeItem(K_PROJETOS);
  notificar();
  return pendentes.length;
}

export function limparMemoria(): void {
  userId = null;
  donoId = null;
  empresaUserId = null;
  projetos = [];
  pagamentos = [];
  empresa = { ...EMPRESA_PADRAO };
  catalogo = CATALOGO_PADRAO;
  notificar();
}

// ----- Projetos -----
export function listarProjetos(): ProjetoLocal[] {
  return projetos;
}

export function obterProjeto(id: string): ProjetoLocal | undefined {
  return projetos.find((p) => p.id === id);
}

/** Cria um orçamento padrão e o disponibiliza imediatamente para preenchimento. */
export function criarOrcamentoRapido(vendedora = ""): ProjetoLocal {
  const agora = new Date().toISOString();
  const tipologia: TipologiaId = "portao_correr";
  const tip = tipologiaPorId(tipologia);
  const novo: ProjetoLocal = {
    id: gerarId(),
    nome: tipologiaPorId(tipologia).nome.replace(" de ", " ").slice(0, 40),
    nome_manual: false,
    vendedora,
    cliente: "",
    cliente_documento: "",
    cliente_endereco: "",
    cliente_numero: "",
    cliente_complemento: "",
    cliente_bairro: "",
    cliente_cidade: "",
    cliente_cep: "",
    cliente_telefone: "",
    cliente_email: "",
    local_instalacao: "",
    prazo_dias_uteis: null,
    servicos_valor: null,
    frete_valor: null,
    observacoes_proposta: "",
    checklist_versao: CHECKLIST_VERSAO,
    checklist_respostas: {},
    tipologia,
    largura_mm: tip.larguraDefault,
    altura_mm: tip.alturaDefault,
    cor: "branco",
    maoObraPct: 30,
    margemPct: 25,
    descontoGeralPct: 0,
    pecas: [{
      id: gerarId(),
      nome: categoriaNomePeca(tipologia),
      tipologia,
      largura_mm: tip.larguraDefault,
      altura_mm: tip.alturaDefault,
      cor: "branco",
      fixacao: FIXACAO_PADRAO,
      fixacaoLados: FIXACAO_LADOS_PADRAO,
      politica_id: POLITICA_POR_TIPOLOGIA[tipologia] ?? "",
      preco_manual: null,
      checklist_respostas: {},
    }],
    overrides: {},
    extras: [],
    total: 0,
    cliente_id: null,
    briefing_id: null,
    responsavel_id: null,
    prioridade_manual: null,
    status: "orcamento",
    etapa: "fila",
    etapa_em: agora,
    prazo_entrega: null,
    valor_faturado: 0,
    aprovado_em: null,
    entregue_em: null,
    faturado_em: null,
    enviado_em: null,
    enviado_por_nome: "",
    followup_status: "aguardando",
    followup_em: null,
    followup_tentativa_em: null,
    followup_erro: "",
    orcamento_pdf_em: null,
    contrato_pdf_em: null,
    aguardando_oficina: false,
    medicao: { largura_mm: null, altura_mm: null, observacoes: "" },
    posvenda: { instalacao_ok: false, cliente_satisfeito: false, sem_problemas: false, retorno: "", concluido_em: null },
    created_at: agora,
    updated_at: agora,
  };
  salvarProjeto(novo);
  return novo;
}

/** Nome curto para cartões, Kanban e tela da oficina. */
export function nomeSugeridoOrcamento(projeto: Pick<ProjetoLocal, "cliente" | "pecas">): string {
  const primeiroNome = projeto.cliente.trim().split(/\s+/)[0] ?? "";
  const primeira = projeto.pecas[0];
  const tipo = primeira
    ? tipologiaPorId(primeira.tipologia).nome.replace(/\b(de|da|do|das|dos)\b/gi, "").replace(/\s+/g, " ").trim()
    : "Orçamento";
  const restantes = Math.max(0, projeto.pecas.length - 1);
  const partes = [primeiroNome, tipo, restantes ? `+${restantes}` : ""].filter(Boolean);
  const nome = partes.join(" · ");
  return nome.length <= 40 ? nome : `${nome.slice(0, 39).trimEnd()}…`;
}

export function salvarProjeto(p: ProjetoLocal): void {
  const atualizado = normalizarProjeto({ ...p, updated_at: new Date().toISOString() });
  const idx = projetos.findIndex((x) => x.id === p.id);
  if (idx >= 0) projetos[idx] = atualizado;
  else projetos = [atualizado, ...projetos];
  notificar();
  if (userId) {
    void supabase
      .from("projetos")
      .upsert(projetoParaLinha(atualizado) as never)
      .then(({ error }) => { if (error) console.error("Falha ao salvar projeto", error); });
  }
}


export function renomearVendedor(antigo: string, novo: string): void {
  if (!antigo || !novo || antigo === novo) return;

  // 1. Empresa
  if (empresa.vendedoras?.includes(antigo)) {
    empresa.vendedoras = empresa.vendedoras.map(v => v === antigo ? novo : v);
    salvarEmpresa(empresa);
  }

  // 2. Projetos
  let mudouQualquer = false;
  projetos = projetos.map(p => {
    if ((p.vendedora || '').trim() === antigo.trim()) {
      mudouQualquer = true;
      const atualizado = { ...p, vendedora: novo, updated_at: new Date().toISOString() };
      // Sincroniza cada um na nuvem
      if (userId) {
        void supabase.from('projetos')
          .upsert(projetoParaLinha(atualizado) as never)
          .then(({ error }) => { if (error) console.error('Falha ao sincronizar renomeação', error); });
      }
      return atualizado;
    }
    return p;
  });

  if (mudouQualquer) notificar();
}
export function deletarProjeto(id: string): void {
  projetos = projetos.filter((p) => p.id !== id);
  pagamentos = pagamentos.filter((x) => x.projeto_id !== id);
  notificar();
  if (userId) {
    void supabase.from("projetos").delete().eq("id", id)
      .then(({ error }) => { if (error) console.error("Falha ao excluir projeto", error); });
  }
}

export function duplicarProjeto(id: string): ProjetoLocal | undefined {
  const orig = obterProjeto(id);
  if (!orig) return;
  const novo: ProjetoLocal = {
    ...orig,
    id: gerarId(),
    nome: orig.nome + " (cópia)",
    status: "orcamento",
    valor_faturado: 0,
    aprovado_em: null,
    entregue_em: null,
    faturado_em: null,
    enviado_em: null,
    enviado_por_nome: "",
    followup_status: "aguardando",
    followup_em: null,
    followup_tentativa_em: null,
    followup_erro: "",
    orcamento_pdf_em: null,
    contrato_pdf_em: null,
    aguardando_oficina: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  salvarProjeto(novo);
  return novo;
}

// ----- Pagamentos -----
export function listarPagamentos(projetoId?: string): Pagamento[] {
  return projetoId ? pagamentos.filter((p) => p.projeto_id === projetoId) : pagamentos;
}

export function totalRecebido(projetoId: string): number {
  return listarPagamentos(projetoId).reduce((s, p) => s + p.valor, 0);
}

/**
 * Dinheiro que entrou reflete na ordem: define o valor a cobrar quando ainda está zerado
 * e registra a quitação assim que o recebido cobre o total.
 */
export function reconciliarFinanceiro(projetoId: string): void {
  const p = obterProjeto(projetoId);
  if (!p || p.status === "orcamento") return;
  const recebido = totalRecebido(projetoId);
  if (recebido <= 0) return;

  const orcado = Number((p.total + (p.servicos_valor ?? 0) + (p.frete_valor ?? 0)).toFixed(2));
  const alvo = p.valor_faturado > 0 ? p.valor_faturado : orcado;
  if (alvo <= 0) return;

  const patch: ProjetoLocal = { ...p };
  let mudou = false;

  if (!p.valor_faturado) { patch.valor_faturado = alvo; mudou = true; }

  if (recebido >= alvo - 0.01) {
    if (!p.faturado_em) { patch.faturado_em = new Date().toISOString(); mudou = true; }
    // Só muda a situação quando a ordem já foi entregue — a produção segue seu curso.
    if (p.status === "entregue") { patch.status = "faturado"; mudou = true; }
  }

  if (mudou) salvarProjeto(patch);
}

export async function adicionarPagamento(p: Omit<Pagamento, "id">): Promise<Pagamento> {
  if (!userId) return;
  const { data, error } = await supabase
    .from("pagamentos")
    .insert({ ...p, user_id: idDono() } as never)
    .select()
    .single();
  if (error) throw error;
  const criado = { ...p, id: (data as { id: string }).id };
  pagamentos = [criado, ...pagamentos];
  reconciliarFinanceiro(p.projeto_id);
  notificar();
  return criado;
}

export async function removerPagamento(id: string): Promise<void> {
  const alvo = pagamentos.find((p) => p.id === id);
  pagamentos = pagamentos.filter((p) => p.id !== id);
  if (alvo) reconciliarFinanceiro(alvo.projeto_id);
  notificar();
  await supabase.from("pagamentos").delete().eq("id", id);
}

export function registrarComprovanteLocal(id: string, caminho: string, nome: string, tipo: string): void {
  pagamentos = pagamentos.map((p) => p.id === id ? {
    ...p,
    comprovante_caminho: caminho,
    comprovante_nome: nome,
    comprovante_tipo: tipo,
    comprovante_enviado_em: new Date().toISOString(),
  } : p);
  const alvo = pagamentos.find((p) => p.id === id);
  if (alvo) reconciliarFinanceiro(alvo.projeto_id);
  notificar();
}

// ----- Empresa -----
export function obterEmpresa(): DadosEmpresa {
  return empresa;
}

export function salvarEmpresa(e: DadosEmpresa): void {
  empresa = { ...EMPRESA_PADRAO, ...e };
  notificar();
  if (userId) {
    void supabase.from("empresa").upsert({
      user_id: empresaUserId ?? userId,
      dados: {
        nome: empresa.nome, cnpj: empresa.cnpj, telefone: empresa.telefone,
        email: empresa.email, endereco: empresa.endereco,
        vendedoras: empresa.vendedoras,
        empresasPintura: empresa.empresasPintura,
        prazoDiasUteis: empresa.prazoDiasUteis,
        validadeDias: empresa.validadeDias,
        garantiaDias: empresa.garantiaDias,
        pixChave: empresa.pixChave,
        pixFavorecido: empresa.pixFavorecido,
        visitaTecnica: empresa.visitaTecnica,
        textoPagamento: empresa.textoPagamento,
        textoTecnico: empresa.textoTecnico,
        msgSolicitarDados: empresa.msgSolicitarDados,
        msgFollowUp: empresa.msgFollowUp,
        msgVisitaTecnica: empresa.msgVisitaTecnica,
        clausulasContrato: empresa.clausulasContrato,
        politicaValores: empresa.politicaValores ?? {},
        margemMotorPct: empresa.margemMotorPct ?? 30,
        metaSemanal: empresa.metaSemanal,
      },
      prazo_padrao_dias: empresa.prazoPadraoDias,
      limite_vermelho_dias: empresa.limiteVermelhoDias,
      limite_amarelo_dias: empresa.limiteAmareloDias,
      updated_at: new Date().toISOString(),
    } as never).then(({ error }) => { if (error) console.error("Falha ao salvar empresa", error); });
  }
}

// ----- Catálogo -----
export function obterCatalogo(): Catalogo {
  return catalogo;
}

export function salvarCatalogo(c: Catalogo): void {
  catalogo = c;
  notificar();
  if (userId) {
    void supabase.from("catalogo").upsert({
      user_id: idDono(), dados: c as unknown as Record<string, unknown>,
      updated_at: new Date().toISOString(),
    } as never).then(({ error }) => { if (error) console.error("Falha ao salvar catálogo", error); });
  }
}

export function restaurarCatalogoPadrao(): Catalogo {
  localStorage.removeItem(K_CATALOGO);
  salvarCatalogo(CATALOGO_PADRAO);
  return CATALOGO_PADRAO;
}

// ----- Formatação -----
export const formatarBRL = (n: number): string =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
