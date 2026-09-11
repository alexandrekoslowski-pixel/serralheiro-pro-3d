// Cadastros da gestão: clientes, briefings, catálogo de serviços, materiais e equipe.
import { supabase } from "@/integrations/supabase/client";

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
async function buscarTudo<T>(tabela: string, ordem?: string): Promise<T[]> {
  const passo = 1000;
  const todos: T[] = [];
  for (let inicio = 0; ; inicio += passo) {
    let q = supabase.from(tabela).select("*").range(inicio, inicio + passo - 1);
    if (ordem) q = q.order(ordem);
    const { data, error } = await q;
    if (error) throw error;
    const lote = (data ?? []) as T[];
    todos.push(...lote);
    if (lote.length < passo) break;
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

export async function atualizarMembro(id: string, patch: { nome?: string; role?: Papel }): Promise<void> {
  const { error } = await supabase.from("user_roles").update(patch as never).eq("id", id);
  if (error) throw error;
}

export async function removerMembro(id: string): Promise<void> {
  await supabase.from("user_roles").delete().eq("id", id);
}
