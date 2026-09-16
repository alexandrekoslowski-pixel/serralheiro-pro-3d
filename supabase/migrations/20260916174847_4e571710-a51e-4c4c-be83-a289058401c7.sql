REVOKE ALL ON FUNCTION private.atualizar_membro_e_vendas_impl(uuid, uuid, text, public.app_role) FROM authenticated;

CREATE OR REPLACE FUNCTION public.atualizar_membro_e_vendas(
  _membro_id uuid,
  _nome text,
  _role public.app_role
)
RETURNS TABLE(nome_anterior text, nome_atual text)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, private
AS $$
DECLARE
  alvo public.user_roles%ROWTYPE;
  nome_limpo text := btrim(_nome);
BEGIN
  IF nome_limpo = '' THEN
    RAISE EXCEPTION 'Nome obrigatório';
  END IF;

  SELECT * INTO alvo
  FROM public.user_roles
  WHERE id = _membro_id;

  IF NOT FOUND
     OR alvo.dono_id <> private.dono_atual(auth.uid())
     OR NOT private.has_role(auth.uid(), 'gestor') THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  UPDATE public.user_roles
  SET nome = nome_limpo,
      role = _role
  WHERE id = _membro_id;

  IF alvo.role IN ('gestor'::public.app_role, 'vendedora'::public.app_role)
     AND _role IN ('gestor'::public.app_role, 'vendedora'::public.app_role)
     AND lower(btrim(alvo.nome)) IS DISTINCT FROM lower(nome_limpo) THEN
    UPDATE public.projetos
    SET dados = jsonb_set(dados, '{vendedora}', to_jsonb(nome_limpo), true),
        updated_at = now()
    WHERE user_id = alvo.dono_id
      AND lower(btrim(COALESCE(dados->>'vendedora', ''))) = lower(btrim(alvo.nome));
  END IF;

  RETURN QUERY SELECT alvo.nome, nome_limpo;
END;
$$;

REVOKE ALL ON FUNCTION public.atualizar_membro_e_vendas(uuid, text, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.atualizar_membro_e_vendas(uuid, text, public.app_role) TO authenticated;