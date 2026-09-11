
CREATE TABLE public.ordem_etapas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  projeto_id text NOT NULL REFERENCES public.projetos(id) ON DELETE CASCADE,
  etapa public.etapa_oficina NOT NULL,
  responsavel_id uuid,
  responsavel_nome text NOT NULL DEFAULT '',
  iniciada_em timestamptz NOT NULL DEFAULT now(),
  concluida_em timestamptz,
  observacao text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (projeto_id, etapa)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ordem_etapas TO authenticated;
GRANT ALL ON public.ordem_etapas TO service_role;
ALTER TABLE public.ordem_etapas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "equipe gerencia etapas" ON public.ordem_etapas FOR ALL TO authenticated
  USING (user_id = private.dono_atual(auth.uid()))
  WITH CHECK (user_id = private.dono_atual(auth.uid()));
CREATE TRIGGER ordem_etapas_updated_at BEFORE UPDATE ON public.ordem_etapas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.ordem_fotos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  projeto_id text NOT NULL REFERENCES public.projetos(id) ON DELETE CASCADE,
  etapa text NOT NULL DEFAULT 'medicao',
  caminho text NOT NULL,
  enviado_por uuid,
  enviado_nome text NOT NULL DEFAULT '',
  observacao text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ordem_fotos TO authenticated;
GRANT ALL ON public.ordem_fotos TO service_role;
ALTER TABLE public.ordem_fotos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "equipe ve fotos" ON public.ordem_fotos FOR SELECT TO authenticated
  USING (user_id = private.dono_atual(auth.uid()));
CREATE POLICY "equipe envia fotos" ON public.ordem_fotos FOR INSERT TO authenticated
  WITH CHECK (user_id = private.dono_atual(auth.uid()) AND enviado_por = auth.uid());
CREATE POLICY "autor ou gestor exclui fotos" ON public.ordem_fotos FOR DELETE TO authenticated
  USING (user_id = private.dono_atual(auth.uid()) AND (enviado_por = auth.uid() OR auth.uid() = user_id));

CREATE INDEX ordem_fotos_projeto_idx ON public.ordem_fotos (projeto_id);
CREATE INDEX ordem_etapas_projeto_idx ON public.ordem_etapas (projeto_id);

-- kanban: responsável atual + total de fotos
DROP FUNCTION IF EXISTS public.ordens_oficina(uuid);
DROP FUNCTION IF EXISTS private.ordens_oficina(uuid);

CREATE FUNCTION private.ordens_oficina(_codigo uuid)
RETURNS TABLE(id text, nome text, cliente text, status ordem_status, etapa etapa_oficina,
              etapa_em timestamptz, prazo_entrega date, dados jsonb,
              responsavel text, fotos integer, endereco text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT p.id, p.nome, p.cliente, p.status, p.etapa, p.etapa_em, p.prazo_entrega,
         jsonb_build_object(
           'tipologia', p.dados->'tipologia',
           'largura_mm', p.dados->'largura_mm',
           'altura_mm', p.dados->'altura_mm',
           'cor', p.dados->'cor',
           'pecas', COALESCE(p.dados->'pecas', '[]'::jsonb),
           'overrides', COALESCE(p.dados->'overrides', '{}'::jsonb)
         ),
         COALESCE((SELECT oe.responsavel_nome FROM public.ordem_etapas oe
                    WHERE oe.projeto_id = p.id AND oe.etapa = p.etapa), ''),
         (SELECT count(*)::int FROM public.ordem_fotos f WHERE f.projeto_id = p.id),
         COALESCE(NULLIF(p.dados->>'local_instalacao',''), p.dados->>'cliente_endereco', '')
  FROM public.projetos p
  JOIN public.empresa e ON e.user_id = p.user_id
  WHERE e.codigo_oficina = _codigo
    AND p.status IN ('aprovado','producao','entregue');
$$;

CREATE FUNCTION public.ordens_oficina(_codigo uuid)
RETURNS TABLE(id text, nome text, cliente text, status ordem_status, etapa etapa_oficina,
              etapa_em timestamptz, prazo_entrega date, dados jsonb,
              responsavel text, fotos integer, endereco text)
LANGUAGE sql STABLE SET search_path TO 'public', 'private'
AS $$ SELECT * FROM private.ordens_oficina(_codigo); $$;

-- mover etapa registrando o responsável
CREATE OR REPLACE FUNCTION private.mover_etapa_resp(_codigo uuid, _projeto_id text, _etapa etapa_oficina, _responsavel text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE _dono uuid;
BEGIN
  SELECT p.user_id INTO _dono
  FROM public.projetos p JOIN public.empresa e ON e.user_id = p.user_id
  WHERE e.codigo_oficina = _codigo AND p.id = _projeto_id;
  IF _dono IS NULL THEN RETURN; END IF;

  UPDATE public.projetos p
  SET etapa = _etapa, etapa_em = now(),
      status = CASE WHEN _etapa = 'fila' THEN 'aprovado'::public.ordem_status
                    WHEN _etapa = 'pronto' THEN p.status
                    ELSE 'producao'::public.ordem_status END,
      updated_at = now()
  WHERE p.id = _projeto_id AND p.user_id = _dono;

  UPDATE public.ordem_etapas SET concluida_em = now()
  WHERE projeto_id = _projeto_id AND etapa <> _etapa AND concluida_em IS NULL;

  INSERT INTO public.ordem_etapas (user_id, projeto_id, etapa, responsavel_nome)
  VALUES (_dono, _projeto_id, _etapa, COALESCE(_responsavel, ''))
  ON CONFLICT (projeto_id, etapa) DO UPDATE
  SET responsavel_nome = CASE WHEN COALESCE(EXCLUDED.responsavel_nome,'') <> ''
                              THEN EXCLUDED.responsavel_nome
                              ELSE public.ordem_etapas.responsavel_nome END,
      concluida_em = NULL,
      iniciada_em = now(),
      updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.mover_etapa_resp(_codigo uuid, _projeto_id text, _etapa etapa_oficina, _responsavel text)
RETURNS void LANGUAGE sql SET search_path TO 'public', 'private'
AS $$ SELECT private.mover_etapa_resp(_codigo, _projeto_id, _etapa, _responsavel); $$;
