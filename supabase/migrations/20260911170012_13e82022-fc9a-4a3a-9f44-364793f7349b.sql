CREATE OR REPLACE FUNCTION public.usuario_por_email(_email text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
  SELECT p.id FROM public.profiles p
  WHERE lower(p.email) = lower(trim(_email))
    AND (auth.uid() IS NOT NULL AND (private.has_role(auth.uid(), 'gestor') OR NOT EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid())))
  LIMIT 1;
$$;