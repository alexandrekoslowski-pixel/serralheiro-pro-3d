CREATE OR REPLACE FUNCTION private.eh_serralheiro(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, private AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'serralheiro'::app_role)
$$;

DROP POLICY IF EXISTS "projetos da serralheria" ON public.projetos;
CREATE POLICY "projetos da serralheria" ON public.projetos FOR ALL TO authenticated
USING (user_id = private.dono_atual(auth.uid()) AND NOT private.eh_serralheiro(auth.uid()))
WITH CHECK (user_id = private.dono_atual(auth.uid()) AND NOT private.eh_serralheiro(auth.uid()));

DROP POLICY IF EXISTS "clientes da serralheria" ON public.clientes;
CREATE POLICY "clientes da serralheria" ON public.clientes FOR ALL TO authenticated
USING (user_id = private.dono_atual(auth.uid()) AND NOT private.eh_serralheiro(auth.uid()))
WITH CHECK (user_id = private.dono_atual(auth.uid()) AND NOT private.eh_serralheiro(auth.uid()));

DROP POLICY IF EXISTS "briefings da serralheria" ON public.briefings;
CREATE POLICY "briefings da serralheria" ON public.briefings FOR ALL TO authenticated
USING (user_id = private.dono_atual(auth.uid()) AND NOT private.eh_serralheiro(auth.uid()))
WITH CHECK (user_id = private.dono_atual(auth.uid()) AND NOT private.eh_serralheiro(auth.uid()));

DROP POLICY IF EXISTS "servicos da serralheria" ON public.servicos_catalogo;
CREATE POLICY "servicos da serralheria" ON public.servicos_catalogo FOR ALL TO authenticated
USING (user_id = private.dono_atual(auth.uid()) AND NOT private.eh_serralheiro(auth.uid()))
WITH CHECK (user_id = private.dono_atual(auth.uid()) AND NOT private.eh_serralheiro(auth.uid()));

DROP POLICY IF EXISTS "catalogo da serralheria" ON public.catalogo;
CREATE POLICY "catalogo da serralheria" ON public.catalogo FOR ALL TO authenticated
USING (user_id = private.dono_atual(auth.uid()) AND NOT private.eh_serralheiro(auth.uid()))
WITH CHECK (user_id = private.dono_atual(auth.uid()) AND NOT private.eh_serralheiro(auth.uid()));

DROP POLICY IF EXISTS "equipe consulta materiais" ON public.materiais;
CREATE POLICY "equipe consulta materiais" ON public.materiais FOR SELECT TO authenticated
USING (user_id = private.dono_atual(auth.uid()) AND NOT private.eh_serralheiro(auth.uid()));