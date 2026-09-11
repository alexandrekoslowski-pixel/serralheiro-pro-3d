UPDATE public.projetos
SET etapa = CASE etapa
      WHEN 'pos_venda' THEN 'entrega'::public.etapa_oficina
      WHEN 'pronto' THEN 'pos_venda'::public.etapa_oficina
      ELSE etapa END
WHERE etapa IN ('pos_venda','pronto');

UPDATE public.ordem_etapas
SET etapa = CASE etapa
      WHEN 'pos_venda' THEN 'entrega'::public.etapa_oficina
      WHEN 'pronto' THEN 'pos_venda'::public.etapa_oficina
      ELSE etapa END
WHERE etapa IN ('pos_venda','pronto');

CREATE OR REPLACE FUNCTION private.mover_etapa_oficina(_codigo uuid, _projeto_id text, _etapa etapa_oficina)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.projetos p
  SET etapa = _etapa,
      etapa_em = now(),
      status = CASE
        WHEN _etapa = 'fila' THEN 'aprovado'::public.ordem_status
        WHEN _etapa = 'entrega' THEN 'entregue'::public.ordem_status
        WHEN _etapa IN ('pos_venda','pronto') THEN p.status
        ELSE 'producao'::public.ordem_status
      END,
      entregue_em = CASE WHEN _etapa = 'entrega' THEN COALESCE(p.entregue_em, now()) ELSE p.entregue_em END,
      updated_at = now()
  FROM public.empresa e
  WHERE e.user_id = p.user_id
    AND e.codigo_oficina = _codigo
    AND p.id = _projeto_id;
END;
$function$;

CREATE OR REPLACE FUNCTION private.mover_etapa_resp(_codigo uuid, _projeto_id text, _etapa etapa_oficina, _responsavel text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _dono uuid;
BEGIN
  SELECT p.user_id INTO _dono
  FROM public.projetos p JOIN public.empresa e ON e.user_id = p.user_id
  WHERE e.codigo_oficina = _codigo AND p.id = _projeto_id;
  IF _dono IS NULL THEN RETURN; END IF;

  UPDATE public.projetos p
  SET etapa = _etapa, etapa_em = now(),
      status = CASE WHEN _etapa = 'fila' THEN 'aprovado'::public.ordem_status
                    WHEN _etapa = 'entrega' THEN 'entregue'::public.ordem_status
                    WHEN _etapa IN ('pos_venda','pronto') THEN p.status
                    ELSE 'producao'::public.ordem_status END,
      entregue_em = CASE WHEN _etapa = 'entrega' THEN COALESCE(p.entregue_em, now()) ELSE p.entregue_em END,
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
$function$;