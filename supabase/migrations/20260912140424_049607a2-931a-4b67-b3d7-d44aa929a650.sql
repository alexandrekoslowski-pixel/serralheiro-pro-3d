CREATE OR REPLACE FUNCTION private.ordens_oficina(_codigo uuid)
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
    AND p.status IN ('aprovado','producao','entregue')
    AND COALESCE((p.dados->>'aguardando_oficina')::boolean, false) = false;
$$;