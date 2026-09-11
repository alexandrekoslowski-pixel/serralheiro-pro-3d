// Fotos das ordens (medição, montagem, pintura, acabamento, entrega) e responsáveis por etapa.
import { supabase } from "@/integrations/supabase/client";
import type { EtapaOficina } from "./storage";

export type EtapaFoto = "medicao" | "montagem" | "pintura" | "acabamento" | "entrega";

export const ETAPAS_FOTO: { id: EtapaFoto; nome: string }[] = [
  { id: "medicao", nome: "Medição" },
  { id: "montagem", nome: "Montagem" },
  { id: "pintura", nome: "Pintura" },
  { id: "acabamento", nome: "Acabamento" },
  { id: "entrega", nome: "Entrega / instalação" },
];

/** Etapa do kanban → etapa da foto. */
export const etapaFotoDaOficina = (e: EtapaOficina): EtapaFoto => {
  if (e === "pintura") return "pintura";
  if (e === "acabamento") return "acabamento";
  if (e === "pos_venda" || e === "pronto") return "entrega";
  return "montagem";
};

export interface FotoOrdem {
  id: string;
  projeto_id: string;
  etapa: EtapaFoto;
  caminho: string;
  enviado_nome: string;
  observacao: string;
  created_at: string;
  url?: string;
}

const BUCKET = "ordem-fotos";

const donoAtual = async (uid: string): Promise<string> => {
  const { data } = await supabase.rpc("dono_atual", { _user_id: uid });
  return (data as string) ?? uid;
};

/** Reduz a imagem no navegador antes de enviar (máx. 1600 px). */
async function comprimir(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const max = 1600;
    const escala = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * escala);
    canvas.height = Math.round(bitmap.height * escala);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.82));
    return blob ?? file;
  } catch {
    return file;
  }
}

export async function listarFotos(projetoId: string): Promise<FotoOrdem[]> {
  const { data, error } = await supabase
    .from("ordem_fotos")
    .select("*")
    .eq("projeto_id", projetoId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const fotos = (data ?? []) as unknown as FotoOrdem[];
  if (!fotos.length) return [];
  const { data: urls } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(fotos.map((f) => f.caminho), 3600);
  return fotos.map((f, i) => ({ ...f, url: urls?.[i]?.signedUrl ?? undefined }));
}

export async function enviarFoto(
  projetoId: string,
  etapa: EtapaFoto,
  file: File,
  observacao = "",
): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) throw new Error("Faça login para enviar fotos.");
  const dono = await donoAtual(uid);
  const nome = (auth.user?.user_metadata?.nome as string) || auth.user?.email || "";
  const blob = await comprimir(file);
  const caminho = `${dono}/${projetoId}/${etapa}-${Date.now()}.jpg`;

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(caminho, blob, { contentType: "image/jpeg", upsert: false });
  if (upErr) throw upErr;

  const { error } = await supabase.from("ordem_fotos").insert({
    user_id: dono,
    projeto_id: projetoId,
    etapa,
    caminho,
    enviado_por: uid,
    enviado_nome: nome,
    observacao,
  } as never);
  if (error) throw error;
}

export async function excluirFoto(foto: FotoOrdem): Promise<void> {
  await supabase.storage.from(BUCKET).remove([foto.caminho]);
  const { error } = await supabase.from("ordem_fotos").delete().eq("id", foto.id);
  if (error) throw error;
}

export interface EtapaResponsavel {
  id: string;
  projeto_id: string;
  etapa: EtapaOficina;
  responsavel_nome: string;
  iniciada_em: string;
  concluida_em: string | null;
}

export async function listarResponsaveis(projetoId: string): Promise<EtapaResponsavel[]> {
  const { data } = await supabase
    .from("ordem_etapas")
    .select("*")
    .eq("projeto_id", projetoId)
    .order("iniciada_em");
  return (data ?? []) as unknown as EtapaResponsavel[];
}

/** Move a ordem de etapa já gravando quem é o responsável. */
export async function moverComResponsavel(
  codigo: string,
  projetoId: string,
  etapa: EtapaOficina,
  responsavel: string,
): Promise<void> {
  const { error } = await supabase.rpc("mover_etapa_resp", {
    _codigo: codigo,
    _projeto_id: projetoId,
    _etapa: etapa,
    _responsavel: responsavel,
  });
  if (error) throw error;
}
