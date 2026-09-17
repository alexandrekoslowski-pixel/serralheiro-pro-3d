// Nome do usuário logado (para filtrar o que é dele no sistema).
import { useEffect, useState } from "react";
import { useSessao } from "@/lib/sessao";
import { EQUIPE_ATUALIZADA_EVENTO, meuPerfil } from "@/lib/gestao";

export function useMeuNome(): string {
  const { session } = useSessao();
  const [perfil, setPerfil] = useState<{ uid: string; nome: string } | null>(null);

  useEffect(() => {
    const uid = session?.user?.id;
    if (!uid) {
      setPerfil(null);
      return;
    }
    let vivo = true;
    const recarregar = () => void meuPerfil(uid)
      .then((p) => { if (vivo) setPerfil({ uid, nome: (p.nome ?? "").trim() }); })
      .catch(() => undefined);
    recarregar();
    window.addEventListener(EQUIPE_ATUALIZADA_EVENTO, recarregar);
    const intervalo = window.setInterval(recarregar, 30_000);
    return () => {
      vivo = false;
      window.clearInterval(intervalo);
      window.removeEventListener(EQUIPE_ATUALIZADA_EVENTO, recarregar);
    };
  }, [session?.user?.id]);

  // Nunca devolve por um instante o nome da conta que estava conectada antes.
  return perfil?.uid === session?.user?.id ? perfil.nome : "";
}
