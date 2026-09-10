CREATE TYPE public.etapa_oficina AS ENUM ('fila','producao','pintura','acabamento','pos_venda','pronto');

ALTER TABLE public.projetos
  ADD COLUMN etapa etapa_oficina NOT NULL DEFAULT 'fila',
  ADD COLUMN etapa_em timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.empresa
  ADD COLUMN codigo_oficina uuid NOT NULL DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX empresa_codigo_oficina_key ON public.empresa (codigo_oficina);

CREATE OR REPLACE FUNCTION public.ordens_oficina(_codigo uuid)
RETURNS TABLE (
  id text,
  nome text,
  cliente text,
  status ordem_status,
  etapa etapa_oficina,
  etapa_em timestamptz,
  prazo_entrega date,
  dados jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.nome, p.cliente, p.status, p.etapa, p.etapa_em, p.prazo_entrega,
         jsonb_build_object(
           'tipologia', p.dados->'tipologia',
           'largura_mm', p.dados->'largura_mm',
           'altura_mm', p.dados->'altura_mm',
           'cor', p.dados->'cor',
           'overrides', COALESCE(p.dados->'overrides', '{}'::jsonb)
         )
  FROM public.projetos p
  JOIN public.empresa e ON e.user_id = p.user_id
  WHERE e.codigo_oficina = _codigo
    AND p.status IN ('aprovado','producao','entregue');
$$;

GRANT EXECUTE ON FUNCTION public.ordens_oficina(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.mover_etapa_oficina(_codigo uuid, _projeto_id text, _etapa etapa_oficina)
RETURNS void
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.projetos p
  SET etapa = _etapa,
      etapa_em = now(),
      status = CASE
        WHEN _etapa = 'fila' THEN 'aprovado'::ordem_status
        WHEN _etapa = 'pronto' THEN p.status
        ELSE 'producao'::ordem_status
      END,
      updated_at = now()
  FROM public.empresa e
  WHERE e.user_id = p.user_id
    AND e.codigo_oficina = _codigo
    AND p.id = _projeto_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mover_etapa_oficina(uuid, text, etapa_oficina) TO anon, authenticated;