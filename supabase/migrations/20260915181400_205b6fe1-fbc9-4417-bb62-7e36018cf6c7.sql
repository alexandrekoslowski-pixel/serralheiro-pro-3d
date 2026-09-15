DROP POLICY IF EXISTS "equipe insere links de orcamento" ON public.orcamento_links;

CREATE POLICY "equipe insere links de orcamento"
ON public.orcamento_links
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projetos p
    WHERE p.id = orcamento_links.projeto_id
      AND p.user_id = public.dono_atual(auth.uid())
  )
);