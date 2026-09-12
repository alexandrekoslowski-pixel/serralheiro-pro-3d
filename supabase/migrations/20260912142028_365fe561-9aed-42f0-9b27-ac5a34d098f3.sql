DROP POLICY IF EXISTS "pagamentos da serralheria" ON public.pagamentos;
CREATE POLICY "pagamentos da serralheria" ON public.pagamentos
FOR ALL TO authenticated
USING (user_id = private.dono_atual(auth.uid()) AND NOT private.eh_serralheiro(auth.uid()))
WITH CHECK (user_id = private.dono_atual(auth.uid()) AND NOT private.eh_serralheiro(auth.uid()));