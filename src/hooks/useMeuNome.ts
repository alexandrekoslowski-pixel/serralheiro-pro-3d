// Nome do usuário logado (para filtrar o que é dele no sistema).
import { useEffect, useState } from "react";
import { useSessao } from "@/lib/sessao";
import { meuPerfil } from "@/lib/gestao";
import { assinarDados } from "@/lib/storage";

export function useMeuNome(): string {
  const { session } = useSessao();
  const [nome, setNome] = useState("");

  const recarregar = () => {
    const uid = session?.user?.id;
    if (!uid) return;
    void meuPerfil(uid)
      .then((p) => { setNome((p.nome ?? "").trim()); })
      .catch(() => undefined);
  };

  useEffect(() => {
    recarregar();
    // Re-carrega se houver mudanças nos dados (ex: renomeação na Equipe)
    return assinarDados(recarregar);
  }, [session?.user?.id]);

  return nome;
}
