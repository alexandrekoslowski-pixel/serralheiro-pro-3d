UPDATE public.empresa d
SET dados = e.dados,
    prazo_padrao_dias = e.prazo_padrao_dias,
    limite_vermelho_dias = e.limite_vermelho_dias,
    limite_amarelo_dias = e.limite_amarelo_dias,
    updated_at = now()
FROM public.empresa e
WHERE d.user_id = 'ed847f0d-c26e-49af-803e-38ea0bdf73a1'
  AND e.user_id = '3894c463-8270-4f49-bcfa-7a9acea0b53e';

DELETE FROM public.empresa WHERE user_id = '3894c463-8270-4f49-bcfa-7a9acea0b53e';

DROP POLICY IF EXISTS "dono edita empresa" ON public.empresa;
CREATE POLICY "gestor edita empresa" ON public.empresa FOR ALL TO authenticated
USING (user_id = private.dono_atual(auth.uid()) AND (user_id = auth.uid() OR private.has_role(auth.uid(), 'gestor')))
WITH CHECK (user_id = private.dono_atual(auth.uid()) AND (user_id = auth.uid() OR private.has_role(auth.uid(), 'gestor')));