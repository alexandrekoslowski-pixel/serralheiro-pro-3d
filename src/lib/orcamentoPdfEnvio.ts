// Gera PDFs (orçamento e contrato), guarda na nuvem e devolve um link curto na própria aplicação.
// O cliente abre /o/<código>, que resolve o PDF e dispara o download — a URL assinada
// enorme nunca aparece na mensagem do WhatsApp.
import { supabase } from "@/integrations/supabase/client";
import { gerarOrcamentoPDF } from "./pdf";
import { gerarContratoPDF } from "./pdfContrato";
import type { ResultadoCalculo } from "./calculator";
import type { DadosEmpresa, ProjetoLocal } from "./storage";

const BUCKET = "orcamentos-pdf";
const DIAS = 30;

function codigoCurto(): string {
  return Math.random().toString(36).slice(2, 8).padEnd(6, "0");
}

/** Sobe um PDF, registra um código curto e devolve um link limpo (/o/<código>). */
async function publicarPdf(projetoId: string, blob: Blob, nomeArquivo: string): Promise<string> {
  const { data } = await supabase.auth.getUser();
  const usuario = data.user;
  if (!usuario) throw new Error("Faça login para enviar o PDF.");
  const { data: dono } = await supabase.rpc("dono_atual", { _user_id: usuario.id });
  const caminho = `${String(dono ?? usuario.id)}/${projetoId}/${nomeArquivo}-${Date.now()}.pdf`;
  const { error } = await supabase.storage.from(BUCKET).upload(caminho, blob, {
    contentType: "application/pdf",
    upsert: false,
  });
  if (error) throw error;
  const { data: assinado, error: erroLink } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(caminho, DIAS * 24 * 60 * 60, { download: `${nomeArquivo}.pdf` });
  if (erroLink || !assinado?.signedUrl) throw erroLink ?? new Error("Não foi possível gerar o link do PDF.");

  let codigo = codigoCurto();
  for (let tentativa = 0; tentativa < 4; tentativa++) {
    const { error: insErr } = await supabase.from("orcamento_links").insert({
      codigo,
      projeto_id: projetoId,
      signed_url: assinado.signedUrl,
    });
    if (!insErr) break;
    if (insErr.code === "23505") {
      codigo = codigoCurto();
      continue;
    }
    throw insErr;
  }
  return `${window.location.origin}/o/${codigo}`;
}

/** Sobe o PDF do orçamento e devolve o link curto. */
export async function publicarOrcamentoPDF(
  projeto: ProjetoLocal,
  resultado: ResultadoCalculo,
  empresa: DadosEmpresa,
): Promise<string> {
  const blob = gerarOrcamentoPDF(projeto, resultado, empresa, undefined, true) as Blob;
  return publicarPdf(projeto.id, blob, `orcamento-${projeto.id}`);
}

/** Sobe o PDF do contrato e devolve o link curto. */
export async function publicarContratoPDF(projeto: ProjetoLocal, empresa: DadosEmpresa): Promise<{ link: string; blob: Blob }> {
  const blob = gerarContratoPDF(projeto, empresa, true) as Blob;
  const link = await publicarPdf(projeto.id, blob, `contrato-${projeto.id}`);
  return { link, blob };
}
