import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useSessao } from "@/lib/sessao";

export default function Auth() {
  const navigate = useNavigate();
  const { session } = useSessao();
  const [modo, setModo] = useState<"entrar" | "criar">("entrar");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => { if (session) navigate("/app", { replace: true }); }, [session, navigate]);

  const submeter = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    try {
      if (modo === "entrar") {
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
        if (error) throw error;
        navigate("/app", { replace: true });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: senha,
          options: { emailRedirectTo: window.location.origin + "/app", data: { nome } },
        });
        if (error) throw error;
        if (data.session) navigate("/app", { replace: true });
        else toast.success("Conta criada. Confirme o e-mail que enviamos para entrar.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível continuar");
    } finally {
      setEnviando(false);
    }
  };

  const google = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/app" });
    if (r.error) { toast.error("Não foi possível entrar com Google"); return; }
    if (r.redirected) return;
    navigate("/app", { replace: true });
  };

  return (
    <main className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded bg-gradient-orange shadow-orange">
            <Wrench className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display text-lg">Serralheiro Pro 3D</span>
        </div>

        <div className="surface-card rounded-lg border border-border p-6">
          <h1 className="font-display text-xl">{modo === "entrar" ? "Entrar" : "Criar conta"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Seus orçamentos e ordens ficam salvos na nuvem, em qualquer aparelho.
          </p>

          <form onSubmit={submeter} className="mt-5 space-y-3">
            {modo === "criar" && (
              <div>
                <Label>Seu nome</Label>
                <Input maxLength={100} autoComplete="name" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome da serralheria ou seu nome" />
              </div>
            )}
            <div>
              <Label>E-mail</Label>
              <Input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label>Senha</Label>
              <Input type="password" required minLength={6} maxLength={128} autoComplete={modo === "entrar" ? "current-password" : "new-password"} value={senha} onChange={(e) => setSenha(e.target.value)} />
            </div>
            <Button type="submit" disabled={enviando} className="w-full bg-gradient-orange text-primary-foreground shadow-orange">
              {enviando ? "Aguarde..." : modo === "entrar" ? "Entrar" : "Criar conta"}
            </Button>
          </form>

          <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> ou <div className="h-px flex-1 bg-border" />
          </div>

          <Button variant="outline" className="w-full" onClick={google}>Continuar com Google</Button>

          <button
            type="button"
            onClick={() => setModo(modo === "entrar" ? "criar" : "entrar")}
            className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground"
          >
            {modo === "entrar" ? "Não tem conta? Criar agora" : "Já tenho conta. Entrar"}
          </button>
        </div>
      </div>
    </main>
  );
}
