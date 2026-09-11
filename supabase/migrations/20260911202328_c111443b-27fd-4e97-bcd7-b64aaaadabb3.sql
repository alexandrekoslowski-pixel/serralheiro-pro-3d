GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.equipe_detalhada_impl(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.usuario_por_email_impl(uuid, text) TO authenticated;