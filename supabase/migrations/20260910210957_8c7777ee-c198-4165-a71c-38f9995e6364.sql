CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.dono_atual(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT dono_id FROM public.user_roles WHERE user_id = _user_id LIMIT 1), _user_id);
$$;
REVOKE ALL ON FUNCTION private.dono_atual(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.dono_atual(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;
REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;

ALTER POLICY "clientes da serralheria" ON public.clientes
  USING (user_id = private.dono_atual(auth.uid()))
  WITH CHECK (user_id = private.dono_atual(auth.uid()));
ALTER POLICY "briefings da serralheria" ON public.briefings
  USING (user_id = private.dono_atual(auth.uid()))
  WITH CHECK (user_id = private.dono_atual(auth.uid()));
ALTER POLICY "servicos da serralheria" ON public.servicos_catalogo
  USING (user_id = private.dono_atual(auth.uid()))
  WITH CHECK (user_id = private.dono_atual(auth.uid()));
ALTER POLICY "projetos da serralheria" ON public.projetos
  USING (user_id = private.dono_atual(auth.uid()))
  WITH CHECK (user_id = private.dono_atual(auth.uid()));
ALTER POLICY "pagamentos da serralheria" ON public.pagamentos
  USING (user_id = private.dono_atual(auth.uid()) AND private.dono_atual(auth.uid()) = auth.uid())
  WITH CHECK (user_id = private.dono_atual(auth.uid()) AND private.dono_atual(auth.uid()) = auth.uid());
ALTER POLICY "empresa da serralheria" ON public.empresa
  USING (user_id = private.dono_atual(auth.uid()));
ALTER POLICY "catalogo da serralheria" ON public.catalogo
  USING (user_id = private.dono_atual(auth.uid()))
  WITH CHECK (user_id = private.dono_atual(auth.uid()));
ALTER POLICY "ver equipe da serralheria" ON public.user_roles
  USING (dono_id = private.dono_atual(auth.uid()));
ALTER POLICY "equipe consulta materiais" ON public.materiais
  USING (user_id = private.dono_atual(auth.uid()));
ALTER POLICY "gestor cadastra materiais" ON public.materiais
  WITH CHECK (user_id = auth.uid() AND private.has_role(auth.uid(), 'gestor'));
ALTER POLICY "gestor altera materiais" ON public.materiais
  USING (user_id = auth.uid() AND private.has_role(auth.uid(), 'gestor'))
  WITH CHECK (user_id = auth.uid() AND private.has_role(auth.uid(), 'gestor'));
ALTER POLICY "gestor exclui materiais" ON public.materiais
  USING (user_id = auth.uid() AND private.has_role(auth.uid(), 'gestor'));
ALTER POLICY "gestor gerencia importacoes" ON public.material_importacoes
  USING (user_id = auth.uid() AND private.has_role(auth.uid(), 'gestor'))
  WITH CHECK (user_id = auth.uid() AND private.has_role(auth.uid(), 'gestor'));
ALTER POLICY "gestor gerencia precos" ON public.material_precos
  USING (user_id = auth.uid() AND private.has_role(auth.uid(), 'gestor'))
  WITH CHECK (user_id = auth.uid() AND private.has_role(auth.uid(), 'gestor'));
ALTER POLICY "equipe consulta cores" ON public.cores_catalogo
  USING (user_id = private.dono_atual(auth.uid()));
ALTER POLICY "gestor cadastra cores" ON public.cores_catalogo
  WITH CHECK (user_id = auth.uid() AND private.has_role(auth.uid(), 'gestor'));
ALTER POLICY "gestor altera cores" ON public.cores_catalogo
  USING (user_id = auth.uid() AND private.has_role(auth.uid(), 'gestor'))
  WITH CHECK (user_id = auth.uid() AND private.has_role(auth.uid(), 'gestor'));
ALTER POLICY "gestor exclui cores" ON public.cores_catalogo
  USING (user_id = auth.uid() AND private.has_role(auth.uid(), 'gestor'));

CREATE POLICY "membro consulta proprio papel"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

REVOKE ALL ON FUNCTION public.dono_atual(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
CREATE OR REPLACE FUNCTION public.dono_atual(_user_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public, private
AS $$ SELECT private.dono_atual(_user_id); $$;
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public, private
AS $$ SELECT private.has_role(_user_id, _role); $$;
GRANT EXECUTE ON FUNCTION public.dono_atual(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;