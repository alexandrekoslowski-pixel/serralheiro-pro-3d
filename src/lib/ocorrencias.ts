// Ocorrências de pós-venda: problema relatado, responsável, prazo e resolução.
import { supabase } from "@/integrations/supabase/client";

export interface Ocorrencia {
  id: string;
  projeto_id: string;
  descricao: string;
  responsavel_nome: string;
  prazo: string | null;
  status: "aberta" | "resolvida";
  resolucao: string;
  resolvida_em: string | null;
  criado_por_nome: string;
  created_at: string;
}

const donoAtual = async (uid: string): Promise<string> => {
  const { data } = await supabase.rpc("dono_atual", { _user_id: uid });
  return (data as string) ?? uid;
};

export async function listarOcorrencias(projetoId: string): Promise<Ocorrencia[]> {
  const { data, error } = await supabase
    .from("ocorrencias")
    .select("*")
    .eq("projeto_id", projetoId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Ocorrencia[];
}

export async function criarOcorrencia(
  projetoId: string,
  o: { descricao: string; responsavel_nome: string; prazo: string | null },
): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) throw new Error("Faça login para registrar a ocorrência.");
  const dono = await donoAtual(uid);
  const nome = (auth.user?.user_metadata?.nome as string) || auth.user?.email || "";
  const { error } = await supabase.from("ocorrencias").insert({
    user_id: dono,
    projeto_id: projetoId,
    descricao: o.descricao,
    responsavel_nome: o.responsavel_nome,
    prazo: o.prazo,
    criado_por_nome: nome,
  } as never);
  if (error) throw error;
}

export async function resolverOcorrencia(id: string, resolucao: string): Promise<void> {
  const { error } = await supabase
    .from("ocorrencias")
    .update({ status: "resolvida", resolucao, resolvida_em: new Date().toISOString() } as never)
    .eq("id", id);
  if (error) throw error;
}

/** true se ainda existe ocorrência aberta na ordem. Erro (ex.: serralheiro sem acesso) também bloqueia. */
export async function temOcorrenciaAberta(projetoId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("ocorrencias")
    .select("id")
    .eq("projeto_id", projetoId)
    .eq("status", "aberta")
    .limit(1);
  if (error) throw error;
  return (data ?? []).length > 0;
}
