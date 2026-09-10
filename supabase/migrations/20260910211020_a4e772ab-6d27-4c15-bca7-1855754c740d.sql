CREATE OR REPLACE FUNCTION private.ordens_oficina(_codigo uuid)
RETURNS TABLE(id text, nome text, cliente text, status public.ordem_status, etapa public.etapa_oficina, etapa_em timestamptz, prazo_entrega date, dados jsonb)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.id, p.nome, p.cliente, p.status, p.etapa, p.etapa_em, p.prazo_entrega,
         jsonb_build_object(
           'tipologia', p.dados->'tipologia',
           'largura_mm', p.dados->'largura_mm',
           'altura_mm', p.dados->'altura_mm',
           'cor', p.dados->'cor',
           'pecas', COALESCE(p.dados->'pecas', '[]'::jsonb),
           'overrides', COALESCE(p.dados->'overrides', '{}'::jsonb)
         )
  FROM public.projetos p
  JOIN public.empresa e ON e.user_id = p.user_id
  WHERE e.codigo_oficina = _codigo
    AND p.status IN ('aprovado','producao','entregue');
$$;
REVOKE ALL ON FUNCTION private.ordens_oficina(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.ordens_oficina(uuid) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION private.mover_etapa_oficina(_codigo uuid, _projeto_id text, _etapa public.etapa_oficina)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.projetos p
  SET etapa = _etapa,
      etapa_em = now(),
      status = CASE
        WHEN _etapa = 'fila' THEN 'aprovado'::public.ordem_status
        WHEN _etapa = 'pronto' THEN p.status
        ELSE 'producao'::public.ordem_status
      END,
      updated_at = now()
  FROM public.empresa e
  WHERE e.user_id = p.user_id
    AND e.codigo_oficina = _codigo
    AND p.id = _projeto_id;
END;
$$;
REVOKE ALL ON FUNCTION private.mover_etapa_oficina(uuid, text, public.etapa_oficina) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.mover_etapa_oficina(uuid, text, public.etapa_oficina) TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA private TO anon;

CREATE OR REPLACE FUNCTION public.ordens_oficina(_codigo uuid)
RETURNS TABLE(id text, nome text, cliente text, status public.ordem_status, etapa public.etapa_oficina, etapa_em timestamptz, prazo_entrega date, dados jsonb)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public, private
AS $$ SELECT * FROM private.ordens_oficina(_codigo); $$;

CREATE OR REPLACE FUNCTION public.mover_etapa_oficina(_codigo uuid, _projeto_id text, _etapa public.etapa_oficina)
RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path = public, private
AS $$ SELECT private.mover_etapa_oficina(_codigo, _projeto_id, _etapa); $$;

REVOKE ALL ON FUNCTION public.ordens_oficina(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mover_etapa_oficina(uuid, text, public.etapa_oficina) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ordens_oficina(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.mover_etapa_oficina(uuid, text, public.etapa_oficina) TO anon, authenticated, service_role;