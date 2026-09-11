ALTER TABLE public.projetos
  ADD COLUMN IF NOT EXISTS enviado_em timestamptz,
  ADD COLUMN IF NOT EXISTS enviado_por_nome text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS followup_status text NOT NULL DEFAULT 'nao_agendado',
  ADD COLUMN IF NOT EXISTS followup_em timestamptz,
  ADD COLUMN IF NOT EXISTS followup_tentativa_em timestamptz,
  ADD COLUMN IF NOT EXISTS followup_erro text NOT NULL DEFAULT '';

ALTER TABLE public.pagamentos
  ADD COLUMN IF NOT EXISTS comprovante_caminho text,
  ADD COLUMN IF NOT EXISTS comprovante_nome text,
  ADD COLUMN IF NOT EXISTS comprovante_tipo text,
  ADD COLUMN IF NOT EXISTS comprovante_enviado_por uuid,
  ADD COLUMN IF NOT EXISTS comprovante_enviado_nome text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS comprovante_enviado_em timestamptz;

CREATE INDEX IF NOT EXISTS projetos_followup_pendente_idx
  ON public.projetos (enviado_em)
  WHERE status = 'orcamento' AND followup_em IS NULL;

CREATE POLICY "gestao acessa comprovantes da propria empresa"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'comprovantes-pagamento'
  AND (storage.foldername(name))[1] = public.dono_atual(auth.uid())::text
  AND NOT public.has_role(auth.uid(), 'serralheiro')
);

CREATE POLICY "gestao envia comprovantes da propria empresa"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'comprovantes-pagamento'
  AND (storage.foldername(name))[1] = public.dono_atual(auth.uid())::text
  AND NOT public.has_role(auth.uid(), 'serralheiro')
);

CREATE POLICY "gestao remove comprovantes da propria empresa"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'comprovantes-pagamento'
  AND (storage.foldername(name))[1] = public.dono_atual(auth.uid())::text
  AND NOT public.has_role(auth.uid(), 'serralheiro')
);