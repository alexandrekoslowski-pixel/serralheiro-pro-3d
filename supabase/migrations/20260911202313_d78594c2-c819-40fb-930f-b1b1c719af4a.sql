CREATE OR REPLACE FUNCTION private.equipe_detalhada_impl(_usuario uuid)
RETURNS TABLE(id uuid, user_id uuid, dono_id uuid, role public.app_role, nome text, email text, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, private
AS $$
  SELECT r.id, r.user_id, r.dono_id, r.role, r.nome, p.email, r.created_at
  FROM public.user_roles r
  LEFT JOIN public.profiles p ON p.id = r.user_id
  WHERE r.dono_id = private.dono_atual(_usuario)
    AND private.has_role(_usuario, 'gestor')
  ORDER BY r.created_at;
$$;
REVOKE ALL ON FUNCTION private.equipe_detalhada_impl(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.equipe_detalhada_impl(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.equipe_detalhada()
RETURNS TABLE(id uuid, user_id uuid, dono_id uuid, role public.app_role, nome text, email text, created_at timestamptz)
LANGUAGE sql STABLE SECURITY INVOKER
SET search_path = public, private
AS $$ SELECT * FROM private.equipe_detalhada_impl(auth.uid()); $$;

CREATE OR REPLACE FUNCTION private.usuario_por_email_impl(_usuario uuid, _email text)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, private
AS $$
  SELECT p.id FROM public.profiles p
  WHERE lower(p.email) = lower(trim(_email))
    AND (_usuario IS NOT NULL AND (private.has_role(_usuario, 'gestor') OR NOT EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = _usuario)))
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION private.usuario_por_email_impl(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.usuario_por_email_impl(uuid, text) TO service_role;

CREATE OR REPLACE FUNCTION public.usuario_por_email(_email text)
RETURNS uuid
LANGUAGE sql STABLE SECURITY INVOKER
SET search_path = public, private
AS $$ SELECT private.usuario_por_email_impl(auth.uid(), _email); $$;