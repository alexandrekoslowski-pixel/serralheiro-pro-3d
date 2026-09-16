REVOKE EXECUTE ON FUNCTION public.atualizar_membro_e_vendas(uuid, text, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.atualizar_membro_e_vendas(uuid, text, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.atualizar_membro_e_vendas(uuid, text, public.app_role) TO authenticated;