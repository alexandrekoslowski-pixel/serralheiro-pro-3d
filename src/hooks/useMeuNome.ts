// Nome do usuário logado (para filtrar o que é dele no sistema).
import { useEffect, useState } from "react";
import { useSessao } from "@/lib/sessao";
import { meuPerfil } from "@/lib/gestao";

export function useMeuNome(): string {
  const { session } = useSessao();
  const [nome, setNome] = useState("");

  useEffect(() => {
    const uid = session?.user?.id;
    if (!uid) return;
    let vivo = true;
    void meuPerfil(uid)
      .then((p) => { if (vivo) setNome((p.nome ?? "").trim()); })
      .catch(() => undefined);
    return () => { vivo = false; };
  }, [session?.user?.id]);

  return nome;
}
