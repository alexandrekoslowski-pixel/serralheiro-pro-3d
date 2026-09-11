ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

UPDATE public.profiles p SET email = u.email FROM auth.users u WHERE u.id = p.id AND (p.email IS DISTINCT FROM u.email);

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', ''), NEW.email)
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.usuario_por_email(_email text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT id FROM public.profiles WHERE lower(email) = lower(trim(_email)) LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.usuario_por_email(text) FROM public;
GRANT EXECUTE ON FUNCTION public.usuario_por_email(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.equipe_detalhada()
RETURNS TABLE(id uuid, user_id uuid, dono_id uuid, role app_role, nome text, email text, created_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
  SELECT r.id, r.user_id, r.dono_id, r.role, r.nome, p.email, r.created_at
  FROM public.user_roles r
  LEFT JOIN public.profiles p ON p.id = r.user_id
  WHERE r.dono_id = private.dono_atual(auth.uid())
  ORDER BY r.created_at;
$$;

REVOKE ALL ON FUNCTION public.equipe_detalhada() FROM public;
GRANT EXECUTE ON FUNCTION public.equipe_detalhada() TO authenticated;