// Cadastros da gestão: clientes, briefings, catálogo de serviços, materiais e equipe.
import { supabase } from "@/integrations/supabase/client";
import { ruaComNumero } from "@/lib/endereco";

export type Papel = "gestor" | "vendedora" | "serralheiro";

export interface Cliente {
  id: string;
  user_id: string;
  nome: string;
  documento: string;
  email: string;
  telefone: string;
  whatsapp: string;
  endereco: string;
  bairro: string;
  cidade: string;
  cep: string;
  origem: string;
  estrategico: boolean;
  observacoes: string;
  created_at: string;
  updated_at: string;
}

export interface Briefing {
  id: string;
  user_id: string;
  cliente_id: string | null;
  tipo_servico: string;
  respostas: Record<string, string>;
  observacoes: string;
  created_at: string;
  updated_at: string;
}

export interface ServicoCatalogo {
  id: string;
  user_id: string;
  nome: string;
  categoria: string;
  descricao: string;
  preco_base: number;
  campos: string[];
  ativo: boolean;
}

export interface Material {
  id: string;
  user_id: string;
  nome: string;
  unidade: string;
  custo: number;
  fornecedor: string;
  observacoes: string;
  codigo_fornecedor: string;
  categoria: string;
  subtipo: string;
  descricao_original: string;
  largura_mm: number | null;
  altura_mm: number | null;
  espessura_mm: number | null;
  comprimento_comercial_mm: number | null;
  acabamento: string;
  unidade_compra: string;
  ativo: boolean;
  codigo_calculo: string;
  preco_atual?: number;
  preco_referencia?: string;
  preco_unidade?: string;
}

export interface MaterialPreco {
  id: string;
  material_id: string;
  fornecedor: string;
  valor: number;
  unidade: string;
  referencia: string;
  origem: string;
  promocional: boolean;
  observacoes: string;
  created_at: string;
}

export interface MembroEquipe {
  id: string;
  user_id: string;
  dono_id: string;
  role: Papel;
  nome: string;
  email?: string | null;
}

export const ORIGENS = [
  { id: "whatsapp", nome: "WhatsApp" },
  { id: "presencial", nome: "Presencial" },
  { id: "indicacao", nome: "Indicação" },
  { id: "instagram", nome: "Instagram" },
  { id: "site", nome: "Site" },
  { id: "outro", nome: "Outro" },
];

export const PAPEIS: { id: Papel; nome: string; descricao: string }[] = [
  { id: "gestor", nome: "Gestor", descricao: "Vê tudo, inclusive custos e margem" },
  { id: "vendedora", nome: "Vendedora", descricao: "Clientes, orçamentos e pós-venda" },
  { id: "serralheiro", nome: "Serralheiro", descricao: "Apenas as ordens dele, no celular" },
];

export const EQUIPE_ATUALIZADA_EVENTO = "spro:equipe-atualizada";

const dono = async (): Promise<string> => {
  const { data } = await supabase.auth.getUser();
  const uid = data.user?.id as string;
  const { data: r } = await supabase.rpc("dono_atual", { _user_id: uid });
  return (r as string) ?? uid;
};

// ---------- clientes ----------
export async function listarClientes(): Promise<Cliente[]> {
  const { data, error } = await supabase.from("clientes").select("*").order("nome");
  if (error) throw error;
  return (data ?? []) as Cliente[];
}

export async function obterCliente(id: string): Promise<Cliente | null> {
  const { data } = await supabase.from("clientes").select("*").eq("id", id).maybeSingle();
  return (data as Cliente) ?? null;
}

export async function salvarCliente(c: Partial<Cliente>): Promise<Cliente> {
  const payload = { ...c, user_id: c.user_id ?? (await dono()) };
  const { data, error } = await supabase.from("clientes").upsert(payload as never).select().single();
  if (error) throw error;
  return data as Cliente;
}

export async function excluirCliente(id: string): Promise<void> {
  const { error } = await supabase.from("clientes").delete().eq("id", id);
  if (error) throw error;
}

/** Dados de cliente que vivem dentro do orçamento. */
export interface ClienteDoOrcamento {
  cliente_id: string | null;
  cliente: string;
  cliente_documento?: string;
  cliente_email?: string;
  cliente_telefone?: string;
  cliente_endereco?: string;
  cliente_numero?: string;
  cliente_complemento?: string;
  cliente_bairro?: string;
  cliente_cidade?: string;
  cliente_cep?: string;
}

const soDigitos = (v?: string | null) => (v ?? "").replace(/\D+/g, "");

/** Só vira ficha quando houver nome e sobrenome. */
export function nomeClienteValido(nome: string): boolean {
  return nome.trim().split(/\s+/).filter((p) => p.length >= 2).length >= 2;
}

/**
 * Cria ou atualiza a ficha do cliente a partir do orçamento.
 * Reaproveita fichas com mesmo documento, telefone ou nome para não duplicar.
 */
export async function sincronizarClienteDoOrcamento(d: ClienteDoOrcamento): Promise<string | null> {
  if (!nomeClienteValido(d.cliente)) return d.cliente_id ?? null;

  let alvo: Cliente | null = null;
  if (d.cliente_id) alvo = await obterCliente(d.cliente_id);

  if (!alvo) {
    const doc = soDigitos(d.cliente_documento);
    const tel = soDigitos(d.cliente_telefone);
    const nome = d.cliente.trim().toLowerCase();
    const lista = await listarClientes();
    alvo =
      (doc ? lista.find((c) => soDigitos(c.documento) === doc) : undefined)
      ?? (tel ? lista.find((c) => soDigitos(c.telefone) === tel || soDigitos(c.whatsapp) === tel) : undefined)
      ?? lista.find((c) => c.nome.trim().toLowerCase() === nome)
      ?? null;
  }

  const manter = (novo: string | undefined, atual: string | undefined) =>
    (novo ?? "").trim() ? (novo as string).trim() : (atual ?? "");

  const salvo = await salvarCliente({
    ...(alvo ? { id: alvo.id, user_id: alvo.user_id } : {}),
    nome: d.cliente.trim(),
    documento: manter(d.cliente_documento, alvo?.documento),
    email: manter(d.cliente_email, alvo?.email),
    telefone: manter(d.cliente_telefone, alvo?.telefone),
    whatsapp: manter(d.cliente_telefone, alvo?.whatsapp),
    endereco: manter(ruaComNumero(d.cliente_endereco, d.cliente_numero, d.cliente_complemento), alvo?.endereco),
    bairro: manter(d.cliente_bairro, alvo?.bairro),
    cidade: manter(d.cliente_cidade, alvo?.cidade),
    cep: manter(d.cliente_cep, alvo?.cep),
    origem: alvo?.origem ?? "",
    estrategico: alvo?.estrategico ?? false,
    observacoes: alvo?.observacoes ?? "",
  });
  return salvo.id;
}

// ---------- briefings ----------
export async function listarBriefings(clienteId?: string): Promise<Briefing[]> {
  let q = supabase.from("briefings").select("*").order("created_at", { ascending: false });
  if (clienteId) q = q.eq("cliente_id", clienteId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Briefing[];
}

export async function salvarBriefing(b: Partial<Briefing>): Promise<Briefing> {
  const payload = { ...b, user_id: b.user_id ?? (await dono()) };
  const { data, error } = await supabase.from("briefings").upsert(payload as never).select().single();
  if (error) throw error;
  return data as Briefing;
}

export async function excluirBriefing(id: string): Promise<void> {
  await supabase.from("briefings").delete().eq("id", id);
}

// ---------- catálogo de serviços ----------
export async function listarServicos(): Promise<ServicoCatalogo[]> {
  const { data, error } = await supabase.from("servicos_catalogo").select("*").order("nome");
  if (error) throw error;
  return (data ?? []) as ServicoCatalogo[];
}

export async function salvarServico(s: Partial<ServicoCatalogo>): Promise<void> {
  const payload = { ...s, user_id: s.user_id ?? (await dono()) };
  const { error } = await supabase.from("servicos_catalogo").upsert(payload as never);
  if (error) throw error;
}

export async function excluirServico(id: string): Promise<void> {
  await supabase.from("servicos_catalogo").delete().eq("id", id);
}

// ---------- materiais ----------
async function buscarTudo<T>(tabela: "materiais" | "materiais_precos_atuais", ordem?: string): Promise<T[]> {
  const passo = 1000;
  // A view de preços não tem coluna "id" — usa material_id para ordenar/paginar.
  const colunaOrdem = tabela === "materiais_precos_atuais" ? "material_id" : "id";
  const todos: T[] = [];
  for (let inicio = 0; ; inicio += passo) {
    let consulta = (supabase as any).from(tabela).select("*");
    consulta = ordem ? consulta.order(ordem).order(colunaOrdem) : consulta.order(colunaOrdem);
    const { data, error } = await consulta.range(inicio, inicio + passo - 1);
    if (error) throw error;
    todos.push(...((data ?? []) as T[]));
    if (!data || data.length < passo) break;
  }
  return todos;
}

export async function listarMateriais(): Promise<Material[]> {
  const [linhas, precos] = await Promise.all([
    buscarTudo<any>("materiais", "nome"),
    buscarTudo<any>("materiais_precos_atuais"),
  ]);
  const porMaterial = new Map(precos.map((p) => [p.material_id, p]));
  return linhas.map((m) => {
    const p = porMaterial.get(m.id);
    return { ...m, preco_atual: Number(p?.valor ?? m.custo), preco_referencia: p?.referencia, preco_unidade: p?.unidade };
  }) as Material[];
}


export async function salvarMaterial(m: Partial<Material>): Promise<void> {
  const { preco_atual, preco_referencia, preco_unidade, ...campos } = m;
  const payload = { ...campos, user_id: m.user_id ?? (await dono()) };
  const { data, error } = await supabase.from("materiais").upsert(payload as never).select("id,user_id,fornecedor").single();
  if (error) throw error;
  if (preco_atual != null && data) {
    const { error: precoError } = await supabase.from("material_precos").upsert({
      user_id: data.user_id,
      material_id: data.id,
      fornecedor: data.fornecedor,
      valor: Number(preco_atual),
      unidade: preco_unidade || m.unidade_compra || m.unidade || "un",
      referencia: preco_referencia || new Date().toISOString().slice(0, 10),
      origem: "Cadastro manual",
    } as never, { onConflict: "material_id,fornecedor,referencia" });
    if (precoError) throw precoError;
  }
}

export async function listarHistoricoMaterial(materialId: string): Promise<MaterialPreco[]> {
  const { data, error } = await supabase.from("material_precos").select("*").eq("material_id", materialId).order("referencia", { ascending: false });
  if (error) throw error;
  return (data ?? []) as MaterialPreco[];
}

export async function excluirMaterial(id: string): Promise<void> {
  await supabase.from("materiais").delete().eq("id", id);
}

// ---------- equipe ----------
export async function listarEquipe(): Promise<MembroEquipe[]> {
  const detalhada = await supabase.rpc("equipe_detalhada");
  if (!detalhada.error) return (detalhada.data ?? []) as MembroEquipe[];
  const { data, error } = await supabase.from("user_roles").select("*").order("created_at");
  if (error) throw error;
  return (data ?? []) as MembroEquipe[];
}

export async function meuPapel(uid: string): Promise<Papel> {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid).limit(1).maybeSingle();
  return ((data as { role?: Papel } | null)?.role ?? "gestor") as Papel;
}

export async function meuPerfil(uid: string): Promise<{ nome: string; role: Papel }> {
  const { data } = await supabase.from("user_roles").select("nome,role").eq("user_id", uid).limit(1).maybeSingle();
  const d = data as { nome?: string; role?: Papel } | null;
  return { nome: d?.nome ?? "", role: (d?.role ?? "gestor") as Papel };
}

export class ContaNaoEncontrada extends Error {}

export async function definirPapel(m: { email: string; role: Papel; nome: string }): Promise<void> {
  const donoId = (await supabase.auth.getUser()).data.user?.id as string;
  const { data: encontrado, error: buscaErro } = await supabase.rpc("usuario_por_email", { _email: m.email });
  if (buscaErro) throw buscaErro;
  if (!encontrado) throw new ContaNaoEncontrada();
  const { error } = await supabase
    .from("user_roles")
    .upsert({ user_id: encontrado as string, nome: m.nome, role: m.role, dono_id: donoId } as never, { onConflict: "user_id,role" });
  if (error) throw error;
}

export async function atualizarMembro(id: string, patch: { nome: string; role: Papel }): Promise<void> {
  const { error } = await supabase.rpc("atualizar_membro_e_vendas", {
    _membro_id: id,
    _nome: patch.nome,
    _role: patch.role,
  });
  if (error) throw error;
  window.dispatchEvent(new Event(EQUIPE_ATUALIZADA_EVENTO));
}

export class EmailEmUso extends Error {}

/** Troca o e-mail de acesso de alguém da equipe (somente gestor). */
export async function atualizarEmailMembro(id: string, email: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke("atualizar-email-membro", {
    body: { membro_id: id, email: email.trim().toLowerCase() },
  });
  const resposta = data as { ok?: boolean; erro?: string } | null;
  if (resposta?.erro === "email_em_uso") throw new EmailEmUso();
  if (error || !resposta?.ok) throw error ?? new Error(resposta?.erro ?? "falha");
  window.dispatchEvent(new Event(EQUIPE_ATUALIZADA_EVENTO));
}

export async function removerMembro(id: string): Promise<void> {
  await supabase.from("user_roles").delete().eq("id", id);
}
