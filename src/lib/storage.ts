// Camada de dados: cache em memória (leitura síncrona) sincronizado com a nuvem.
import { supabase } from "@/integrations/supabase/client";
import { TipologiaId, AcabamentoId } from "./tipologias";
import { ItemOverride, ItemExtra } from "./calculator";
import { Catalogo, CATALOGO_PADRAO } from "./catalogo";

export type OrdemStatus = "orcamento" | "aprovado" | "producao" | "entregue" | "faturado";
export type EtapaOficina =
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
  tipologia: TipologiaId;
  largura_mm: number;
  altura_mm: number;
  cor: AcabamentoId;
  fixacao: FixacaoTipo;
  fixacaoLados: FixacaoLados;
}

export interface ProjetoLocal {
  id: string;
  nome: string;
  vendedora: string;
  cliente: string;
  cliente_documento: string;
  cliente_endereco: string;
  cliente_bairro: string;
  cliente_cidade: string;
  cliente_cep: string;
  cliente_telefone: string;
  cliente_email: string;
  local_instalacao: string;
  prazo_dias_uteis: number | null;
  servicos_valor: number | null;
  frete_valor: number | null;
  observacoes_proposta: string;
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
  "• RG ou CPF",
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
};

// ---------- estado em memória ----------
let userId: string | null = null;
/** Dono do cadastro único da serralheria (a linha de empresa usada por toda a equipe). */
let empresaUserId: string | null = null;
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
  overrides: {},
  extras: [],
  total: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  pecas: [],
  vendedora: "",
  cliente_documento: "",
  cliente_endereco: "",
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
  ...(p as ProjetoLocal),
  } as ProjetoLocal;

  // Orçamentos antigos (uma peça só) viram uma lista com uma peça.
  if (!Array.isArray(base.pecas) || base.pecas.length === 0) {
    base.pecas = [{
      id: gerarId(),
      nome: "Peça 1",
      tipologia: base.tipologia,
      largura_mm: base.largura_mm,
      altura_mm: base.altura_mm,
      cor: base.cor,
      fixacao: FIXACAO_PADRAO,
      fixacaoLados: FIXACAO_LADOS_PADRAO,
    }];
  }
  // Peças antigas sem sistema de fixação recebem o padrão.
  base.pecas = base.pecas.map((pc) => ({
    ...pc,
    fixacao: pc.fixacao ?? FIXACAO_PADRAO,
    fixacaoLados: pc.fixacaoLados ?? FIXACAO_LADOS_PADRAO,
  }));
  // Campos antigos continuam refletindo a primeira peça (compatibilidade).
  const p0 = base.pecas[0];
  base.tipologia = p0.tipologia;
  base.largura_mm = p0.largura_mm;
  base.altura_mm = p0.altura_mm;
  base.cor = p0.cor;
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
    cliente_id: (row.cliente_id as string) ?? null,
    briefing_id: (row.briefing_id as string) ?? null,
    responsavel_id: (row.responsavel_id as string) ?? null,
    prioridade_manual: (row.prioridade_manual as string) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  } as Partial<ProjetoLocal>);

const projetoParaLinha = (p: ProjetoLocal) => ({
  id: p.id,
  user_id: userId,
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
  cliente_id: p.cliente_id,
  briefing_id: p.briefing_id,
  responsavel_id: p.responsavel_id,
  prioridade_manual: p.prioridade_manual,
  dados: {
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
    cliente_bairro: p.cliente_bairro,
    cliente_cidade: p.cliente_cidade,
    cliente_cep: p.cliente_cep,
    cliente_telefone: p.cliente_telefone,
    cliente_email: p.cliente_email,
    local_instalacao: p.local_instalacao,
    prazo_dias_uteis: p.prazo_dias_uteis,
    servicos_valor: p.servicos_valor,
    frete_valor: p.frete_valor,
    observacoes_proposta: p.observacoes_proposta,
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

  const [proj, pag, emp, cat] = await Promise.all([
    supabase.from("projetos").select("*").order("updated_at", { ascending: false }),
    supabase.from("pagamentos").select("*").order("data", { ascending: false }),
    supabase.from("empresa").select("*").order("updated_at", { ascending: false }).limit(1),
    supabase.from("catalogo").select("*").maybeSingle(),
  ]);

  projetos = (proj.data ?? []).map((r) => linhaParaProjeto(r as Record<string, unknown>));
  pagamentos = (pag.data ?? []).map((r) => ({
    id: r.id as string,
    projeto_id: r.projeto_id as string,
    data: r.data as string,
    valor: Number(r.valor ?? 0),
    forma: r.forma as string,
    observacao: (r.observacao as string) ?? "",
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

export async function adicionarPagamento(p: Omit<Pagamento, "id">): Promise<void> {
  if (!userId) return;
  const { data, error } = await supabase
    .from("pagamentos")
    .insert({ ...p, user_id: userId } as never)
    .select()
    .single();
  if (error) throw error;
  pagamentos = [{ ...p, id: (data as { id: string }).id }, ...pagamentos];
  notificar();
}

export async function removerPagamento(id: string): Promise<void> {
  pagamentos = pagamentos.filter((p) => p.id !== id);
  notificar();
  await supabase.from("pagamentos").delete().eq("id", id);
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
      user_id: userId, dados: c as unknown as Record<string, unknown>,
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
