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
}

export interface MembroEquipe {
  id: string;
  user_id: string;
  dono_id: string;
  role: Papel;
  nome: string;
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
export async function listarMateriais(): Promise<Material[]> {
  const { data, error } = await supabase.from("materiais").select("*").order("nome");
  if (error) throw error;
  return (data ?? []) as Material[];
}

export async function salvarMaterial(m: Partial<Material>): Promise<void> {
  const payload = { ...m, user_id: m.user_id ?? (await dono()) };
  const { error } = await supabase.from("materiais").upsert(payload as never);
  if (error) throw error;
}

export async function excluirMaterial(id: string): Promise<void> {
  await supabase.from("materiais").delete().eq("id", id);
}

// ---------- equipe ----------
export async function listarEquipe(): Promise<MembroEquipe[]> {
  const { data, error } = await supabase.from("user_roles").select("*").order("created_at");
  if (error) throw error;
  return (data ?? []) as MembroEquipe[];
}

export async function meuPapel(uid: string): Promise<Papel> {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid).limit(1).maybeSingle();
  return ((data as { role?: Papel } | null)?.role ?? "gestor") as Papel;
}

export async function definirPapel(m: { user_id: string; role: Papel; nome: string }): Promise<void> {
  const donoId = (await supabase.auth.getUser()).data.user?.id as string;
  const { error } = await supabase
    .from("user_roles")
    .upsert({ ...m, dono_id: donoId } as never, { onConflict: "user_id,role" });
  if (error) throw error;
}

export async function removerMembro(id: string): Promise<void> {
  await supabase.from("user_roles").delete().eq("id", id);
}
