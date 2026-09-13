// Gera o PDF do orçamento, guarda na nuvem e devolve um link temporário para o cliente.
import { supabase } from "@/integrations/supabase/client";
import { gerarOrcamentoPDF } from "./pdf";
import type { ResultadoCalculo } from "./calculator";
import type { DadosEmpresa, ProjetoLocal } from "./storage";

const BUCKET = "orcamentos-pdf";
const DIAS = 30;

/** Sobe o PDF do orçamento e devolve uma URL assinada válida por 30 dias. */
export async function publicarOrcamentoPDF(
  projeto: ProjetoLocal,
  resultado: ResultadoCalculo,
  empresa: DadosEmpresa,
): Promise<string> {
  const blob = gerarOrcamentoPDF(projeto, resultado, empresa, undefined, true) as Blob;
  const { data } = await supabase.auth.getUser();
  const usuario = data.user;
  if (!usuario) throw new Error("Faça login para enviar o orçamento.");
  const { data: dono } = await supabase.rpc("dono_atual", { _user_id: usuario.id });
  const caminho = `${String(dono ?? usuario.id)}/${projeto.id}/orcamento-${Date.now()}.pdf`;
  const { error } = await supabase.storage.from(BUCKET).upload(caminho, blob, {
    contentType: "application/pdf",
    upsert: false,
  });
  if (error) throw error;
  const { data: assinado, error: erroLink } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(caminho, DIAS * 24 * 60 * 60, { download: `orcamento-${projeto.id}.pdf` });
  if (erroLink || !assinado?.signedUrl) throw erroLink ?? new Error("Não foi possível gerar o link do PDF.");
  return assinado.signedUrl;
}
