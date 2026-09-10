-- ---------- papéis ----------
CREATE TYPE public.app_role AS ENUM ('gestor','vendedora','serralheiro');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dono_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  nome text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- dono da serralheria a que o usuário pertence (ele mesmo, se não for membro)
CREATE OR REPLACE FUNCTION public.dono_atual(_user_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT dono_id FROM public.user_roles WHERE user_id = _user_id LIMIT 1), _user_id);
$$;

CREATE POLICY "ver equipe da serralheria" ON public.user_roles
  FOR SELECT TO authenticated USING (dono_id = public.dono_atual(auth.uid()));
CREATE POLICY "dono gerencia equipe" ON public.user_roles
  FOR ALL TO authenticated
  USING (dono_id = auth.uid()) WITH CHECK (dono_id = auth.uid());

-- ---------- updated_at ----------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ---------- clientes ----------
CREATE TABLE public.clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nome text NOT NULL DEFAULT '',
  documento text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  telefone text NOT NULL DEFAULT '',
  whatsapp text NOT NULL DEFAULT '',
  endereco text NOT NULL DEFAULT '',
  bairro text NOT NULL DEFAULT '',
  cidade text NOT NULL DEFAULT '',
  cep text NOT NULL DEFAULT '',
  origem text NOT NULL DEFAULT 'whatsapp',
  estrategico boolean NOT NULL DEFAULT false,
  observacoes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clientes TO authenticated;
GRANT ALL ON public.clientes TO service_role;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clientes da serralheria" ON public.clientes FOR ALL TO authenticated
  USING (user_id = public.dono_atual(auth.uid())) WITH CHECK (user_id = public.dono_atual(auth.uid()));
CREATE TRIGGER clientes_updated_at BEFORE UPDATE ON public.clientes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX clientes_user_idx ON public.clientes(user_id);

-- ---------- briefings ----------
CREATE TABLE public.briefings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  cliente_id uuid REFERENCES public.clientes(id) ON DELETE CASCADE,
  tipo_servico text NOT NULL DEFAULT 'portao',
  respostas jsonb NOT NULL DEFAULT '{}'::jsonb,
  observacoes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.briefings TO authenticated;
GRANT ALL ON public.briefings TO service_role;
ALTER TABLE public.briefings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "briefings da serralheria" ON public.briefings FOR ALL TO authenticated
  USING (user_id = public.dono_atual(auth.uid())) WITH CHECK (user_id = public.dono_atual(auth.uid()));
CREATE TRIGGER briefings_updated_at BEFORE UPDATE ON public.briefings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- catálogo de serviços ----------
CREATE TABLE public.servicos_catalogo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nome text NOT NULL DEFAULT '',
  categoria text NOT NULL DEFAULT 'portao',
  descricao text NOT NULL DEFAULT '',
  preco_base numeric NOT NULL DEFAULT 0,
  campos jsonb NOT NULL DEFAULT '[]'::jsonb,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.servicos_catalogo TO authenticated;
GRANT ALL ON public.servicos_catalogo TO service_role;
ALTER TABLE public.servicos_catalogo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "servicos da serralheria" ON public.servicos_catalogo FOR ALL TO authenticated
  USING (user_id = public.dono_atual(auth.uid())) WITH CHECK (user_id = public.dono_atual(auth.uid()));
CREATE TRIGGER servicos_updated_at BEFORE UPDATE ON public.servicos_catalogo
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- materiais ----------
CREATE TABLE public.materiais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nome text NOT NULL DEFAULT '',
  unidade text NOT NULL DEFAULT 'un',
  custo numeric NOT NULL DEFAULT 0,
  fornecedor text NOT NULL DEFAULT '',
  observacoes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.materiais TO authenticated;
GRANT ALL ON public.materiais TO service_role;
ALTER TABLE public.materiais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "materiais da serralheria" ON public.materiais FOR ALL TO authenticated
  USING (user_id = public.dono_atual(auth.uid())) WITH CHECK (user_id = public.dono_atual(auth.uid()));
CREATE TRIGGER materiais_updated_at BEFORE UPDATE ON public.materiais
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- projetos ligados a cliente/briefing ----------
ALTER TABLE public.projetos
  ADD COLUMN cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL,
  ADD COLUMN briefing_id uuid REFERENCES public.briefings(id) ON DELETE SET NULL,
  ADD COLUMN responsavel_id uuid,
  ADD COLUMN prioridade_manual text;

-- acesso por serralheria (não só pelo próprio usuário)
DROP POLICY IF EXISTS "own projetos" ON public.projetos;
CREATE POLICY "projetos da serralheria" ON public.projetos FOR ALL TO authenticated
  USING (user_id = public.dono_atual(auth.uid())) WITH CHECK (user_id = public.dono_atual(auth.uid()));

DROP POLICY IF EXISTS "own pagamentos" ON public.pagamentos;
CREATE POLICY "pagamentos da serralheria" ON public.pagamentos FOR ALL TO authenticated
  USING (user_id = public.dono_atual(auth.uid()) AND public.dono_atual(auth.uid()) = auth.uid())
  WITH CHECK (user_id = public.dono_atual(auth.uid()) AND public.dono_atual(auth.uid()) = auth.uid());

DROP POLICY IF EXISTS "own empresa" ON public.empresa;
CREATE POLICY "empresa da serralheria" ON public.empresa FOR SELECT TO authenticated
  USING (user_id = public.dono_atual(auth.uid()));
CREATE POLICY "dono edita empresa" ON public.empresa FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "own catalogo" ON public.catalogo;
CREATE POLICY "catalogo da serralheria" ON public.catalogo FOR ALL TO authenticated
  USING (user_id = public.dono_atual(auth.uid())) WITH CHECK (user_id = public.dono_atual(auth.uid()));