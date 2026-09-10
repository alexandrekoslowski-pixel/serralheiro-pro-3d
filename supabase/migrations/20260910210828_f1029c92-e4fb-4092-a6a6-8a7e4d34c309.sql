ALTER TABLE public.materiais
  ADD COLUMN IF NOT EXISTS codigo_fornecedor text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS categoria text NOT NULL DEFAULT 'outros',
  ADD COLUMN IF NOT EXISTS subtipo text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS descricao_original text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS largura_mm numeric,
  ADD COLUMN IF NOT EXISTS altura_mm numeric,
  ADD COLUMN IF NOT EXISTS espessura_mm numeric,
  ADD COLUMN IF NOT EXISTS comprimento_comercial_mm numeric,
  ADD COLUMN IF NOT EXISTS acabamento text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS unidade_compra text NOT NULL DEFAULT 'un',
  ADD COLUMN IF NOT EXISTS ativo boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS codigo_calculo text NOT NULL DEFAULT '';

CREATE UNIQUE INDEX IF NOT EXISTS materiais_user_codigo_fornecedor_idx
  ON public.materiais(user_id, fornecedor, codigo_fornecedor)
  WHERE codigo_fornecedor <> '';
CREATE INDEX IF NOT EXISTS materiais_user_categoria_idx ON public.materiais(user_id, categoria);
CREATE INDEX IF NOT EXISTS materiais_user_ativo_idx ON public.materiais(user_id, ativo);

DROP POLICY IF EXISTS "materiais da serralheria" ON public.materiais;
CREATE POLICY "equipe consulta materiais"
  ON public.materiais FOR SELECT TO authenticated
  USING (user_id = public.dono_atual(auth.uid()));
CREATE POLICY "gestor cadastra materiais"
  ON public.materiais FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.has_role(auth.uid(), 'gestor'));
CREATE POLICY "gestor altera materiais"
  ON public.materiais FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND public.has_role(auth.uid(), 'gestor'))
  WITH CHECK (user_id = auth.uid() AND public.has_role(auth.uid(), 'gestor'));
CREATE POLICY "gestor exclui materiais"
  ON public.materiais FOR DELETE TO authenticated
  USING (user_id = auth.uid() AND public.has_role(auth.uid(), 'gestor'));

CREATE TABLE public.material_importacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  fornecedor text NOT NULL DEFAULT '',
  referencia date NOT NULL,
  nome_arquivo text NOT NULL DEFAULT '',
  observacoes text NOT NULL DEFAULT '',
  total_itens integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.material_importacoes TO authenticated;
GRANT ALL ON public.material_importacoes TO service_role;
ALTER TABLE public.material_importacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gestor gerencia importacoes"
  ON public.material_importacoes FOR ALL TO authenticated
  USING (user_id = auth.uid() AND public.has_role(auth.uid(), 'gestor'))
  WITH CHECK (user_id = auth.uid() AND public.has_role(auth.uid(), 'gestor'));
CREATE TRIGGER material_importacoes_updated_at
  BEFORE UPDATE ON public.material_importacoes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.material_precos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  material_id uuid NOT NULL REFERENCES public.materiais(id) ON DELETE CASCADE,
  importacao_id uuid REFERENCES public.material_importacoes(id) ON DELETE SET NULL,
  fornecedor text NOT NULL DEFAULT '',
  valor numeric NOT NULL DEFAULT 0,
  unidade text NOT NULL DEFAULT 'un',
  referencia date NOT NULL,
  origem text NOT NULL DEFAULT '',
  promocional boolean NOT NULL DEFAULT false,
  observacoes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (material_id, fornecedor, referencia)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.material_precos TO authenticated;
GRANT ALL ON public.material_precos TO service_role;
ALTER TABLE public.material_precos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gestor gerencia precos"
  ON public.material_precos FOR ALL TO authenticated
  USING (user_id = auth.uid() AND public.has_role(auth.uid(), 'gestor'))
  WITH CHECK (user_id = auth.uid() AND public.has_role(auth.uid(), 'gestor'));
CREATE INDEX material_precos_material_referencia_idx
  ON public.material_precos(material_id, referencia DESC, created_at DESC);
CREATE INDEX material_precos_user_referencia_idx
  ON public.material_precos(user_id, referencia DESC);

CREATE TABLE public.cores_catalogo (
  id text NOT NULL,
  user_id uuid NOT NULL,
  nome text NOT NULL,
  codigo text NOT NULL DEFAULT '',
  hex_aproximado text NOT NULL DEFAULT '#737373',
  multiplicador numeric NOT NULL DEFAULT 1,
  ativo boolean NOT NULL DEFAULT true,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, id),
  UNIQUE (user_id, nome)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cores_catalogo TO authenticated;
GRANT ALL ON public.cores_catalogo TO service_role;
ALTER TABLE public.cores_catalogo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "equipe consulta cores"
  ON public.cores_catalogo FOR SELECT TO authenticated
  USING (user_id = public.dono_atual(auth.uid()));
CREATE POLICY "gestor cadastra cores"
  ON public.cores_catalogo FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.has_role(auth.uid(), 'gestor'));
CREATE POLICY "gestor altera cores"
  ON public.cores_catalogo FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND public.has_role(auth.uid(), 'gestor'))
  WITH CHECK (user_id = auth.uid() AND public.has_role(auth.uid(), 'gestor'));
CREATE POLICY "gestor exclui cores"
  ON public.cores_catalogo FOR DELETE TO authenticated
  USING (user_id = auth.uid() AND public.has_role(auth.uid(), 'gestor'));
CREATE TRIGGER cores_catalogo_updated_at
  BEFORE UPDATE ON public.cores_catalogo
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE VIEW public.materiais_precos_atuais
WITH (security_invoker = true)
AS
SELECT DISTINCT ON (m.id)
  m.id AS material_id,
  p.valor,
  p.unidade,
  p.referencia,
  p.fornecedor,
  p.promocional,
  p.observacoes
FROM public.materiais m
JOIN public.material_precos p ON p.material_id = m.id
ORDER BY m.id, p.referencia DESC, p.created_at DESC;
GRANT SELECT ON public.materiais_precos_atuais TO authenticated;
GRANT ALL ON public.materiais_precos_atuais TO service_role;