import { supabase } from "@/integrations/supabase/client";

const BUCKET = "comprovantes-pagamento";

export async function anexarComprovante(pagamentoId: string, projetoId: string, arquivo: File) {
  const { data } = await supabase.auth.getUser();
  const usuario = data.user;
  if (!usuario) throw new Error("Faça login para anexar o comprovante.");
  const { data: dono } = await supabase.rpc("dono_atual", { _user_id: usuario.id });
  const extensao = arquivo.name.split(".").pop()?.toLowerCase() || "bin";
  const caminho = `${String(dono ?? usuario.id)}/${projetoId}/${pagamentoId}-${Date.now()}.${extensao}`;
  const { error: envioErro } = await supabase.storage.from(BUCKET).upload(caminho, arquivo, {
    contentType: arquivo.type || "application/octet-stream",
    upsert: false,
  });
  if (envioErro) throw envioErro;
  const nome = (usuario.user_metadata?.nome as string) || usuario.email || "";
  const { error } = await supabase.from("pagamentos").update({
    comprovante_caminho: caminho,
    comprovante_nome: arquivo.name,
    comprovante_tipo: arquivo.type,
    comprovante_enviado_por: usuario.id,
    comprovante_enviado_nome: nome,
    comprovante_enviado_em: new Date().toISOString(),
  } as never).eq("id", pagamentoId);
  if (error) throw error;
  return caminho;
}

export async function abrirComprovante(caminho: string) {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(caminho, 300);
  if (error || !data?.signedUrl) throw error ?? new Error("Comprovante indisponível");
  window.open(data.signedUrl, "_blank", "noopener,noreferrer");
}