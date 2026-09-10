CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  nome TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TYPE public.ordem_status AS ENUM ('orcamento','aprovado','producao','entregue','faturado');

CREATE TABLE public.projetos (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  nome TEXT NOT NULL DEFAULT 'Novo projeto',
  cliente TEXT NOT NULL DEFAULT '',
  status public.ordem_status NOT NULL DEFAULT 'orcamento',
  prazo_entrega DATE,
  total NUMERIC NOT NULL DEFAULT 0,
  valor_faturado NUMERIC NOT NULL DEFAULT 0,
  aprovado_em TIMESTAMPTZ,
  entregue_em TIMESTAMPTZ,
  faturado_em TIMESTAMPTZ,
  dados JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projetos TO authenticated;
GRANT ALL ON public.projetos TO service_role;
ALTER TABLE public.projetos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own projetos" ON public.projetos FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX projetos_user_idx ON public.projetos(user_id, updated_at DESC);

CREATE TABLE public.pagamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  projeto_id TEXT NOT NULL REFERENCES public.projetos(id) ON DELETE CASCADE,
  data DATE NOT NULL DEFAULT current_date,
  valor NUMERIC NOT NULL DEFAULT 0,
  forma TEXT NOT NULL DEFAULT 'pix',
  observacao TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pagamentos TO authenticated;
GRANT ALL ON public.pagamentos TO service_role;
ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own pagamentos" ON public.pagamentos FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX pagamentos_projeto_idx ON public.pagamentos(projeto_id);

CREATE TABLE public.empresa (
  user_id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  dados JSONB NOT NULL DEFAULT '{}'::jsonb,
  prazo_padrao_dias INTEGER NOT NULL DEFAULT 15,
  limite_vermelho_dias INTEGER NOT NULL DEFAULT 3,
  limite_amarelo_dias INTEGER NOT NULL DEFAULT 7,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.empresa TO authenticated;
GRANT ALL ON public.empresa TO service_role;
ALTER TABLE public.empresa ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own empresa" ON public.empresa FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.catalogo (
  user_id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  dados JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.catalogo TO authenticated;
GRANT ALL ON public.catalogo TO service_role;
ALTER TABLE public.catalogo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own catalogo" ON public.catalogo FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();