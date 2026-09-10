// Sessão do usuário + carga dos dados da nuvem.
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { hidratarNuvem, limparMemoria } from "./storage";
import { meuPapel, type Papel } from "./gestao";

interface Ctx {
  session: Session | null;
  carregando: boolean;
  pronto: boolean; // dados da nuvem carregados
  papel: Papel;
  sair: () => Promise<void>;
}

const SessaoCtx = createContext<Ctx>({ session: null, carregando: true, pronto: false, papel: "gestor", sair: async () => {} });

export const useSessao = () => useContext(SessaoCtx);

export function SessaoProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [pronto, setPronto] = useState(false);
  const [papel, setPapel] = useState<Papel>("gestor");


  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setCarregando(false);
      if (!s) { limparMemoria(); setPronto(false); }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setCarregando(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user) return;
    let ativo = true;
    const uid = session.user.id;
    void meuPapel(uid).then((p) => { if (ativo) setPapel(p); }).catch(() => undefined);
    hidratarNuvem(uid)
      .catch(() => undefined)
      .finally(() => { if (ativo) setPronto(true); });
    return () => { ativo = false; };
  }, [session?.user?.id]);

  const sair = async () => {
    await supabase.auth.signOut();
    limparMemoria();
  };

  return (
    <SessaoCtx.Provider value={{ session, carregando, pronto, papel, sair }}>

      {children}
    </SessaoCtx.Provider>
  );
}

export function ExigirLogin({ children }: { children: ReactNode }) {
  const { session, carregando, pronto } = useSessao();
  const loc = useLocation();

  if (carregando || (session && !pronto)) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
        Carregando seus dados...
      </div>
    );
  }
  if (!session) return <Navigate to="/auth" state={{ from: loc.pathname }} replace />;
  return <>{children}</>;
}
