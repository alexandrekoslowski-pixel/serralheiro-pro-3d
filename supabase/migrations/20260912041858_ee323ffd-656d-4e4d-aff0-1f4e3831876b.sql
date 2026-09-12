CREATE TABLE public.ocorrencias (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  projeto_id text NOT NULL REFERENCES public.projetos(id) ON DELETE CASCADE,
  descricao text NOT NULL DEFAULT '',
  responsavel_nome text NOT NULL DEFAULT '',
  prazo date,
  status text NOT NULL DEFAULT 'aberta',
  resolucao text NOT NULL DEFAULT '',
  resolvida_em timestamptz,
  criado_por_nome text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ocorrencias TO authenticated;
GRANT ALL ON public.ocorrencias TO service_role;
ALTER TABLE public.ocorrencias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "empresa gerencia ocorrencias" ON public.ocorrencias FOR ALL TO authenticated
  USING (user_id = public.dono_atual(auth.uid()) AND NOT public.has_role(auth.uid(), 'serralheiro'))
  WITH CHECK (user_id = public.dono_atual(auth.uid()) AND NOT public.has_role(auth.uid(), 'serralheiro'));
CREATE TRIGGER ocorrencias_updated_at BEFORE UPDATE ON public.ocorrencias FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX ocorrencias_projeto_idx ON public.ocorrencias (projeto_id);