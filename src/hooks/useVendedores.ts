// Lista de vendedores disponíveis: equipe (gestores e vendedoras)
// e nomes já usados em orçamentos.
import { useEffect, useMemo, useState } from "react";
import { listarEquipe } from "@/lib/gestao";
import { listarProjetos, assinarDados } from "@/lib/storage";

export function useVendedores(): string[] {
  const [equipe, setEquipe] = useState<string[]>([]);
  const [projetos, setProjetos] = useState(listarProjetos());

  const recarregarEquipe = () => {
    void listarEquipe()
      .then((membros) => {
        setEquipe(
          membros
            .filter((m) => m.role === "gestor" || m.role === "vendedora")
            .map((m) => (m.nome ?? "").trim())
            .filter(Boolean),
        );
      })
      .catch(() => undefined);
  };

  useEffect(() => {
    recarregarEquipe();
    // Re-carrega a equipe e projetos quando houver mudanças no storage local
    return assinarDados(() => {
      setProjetos(listarProjetos());
      recarregarEquipe();
    });
  }, []);

  return useMemo(() => {
    const set = new Set<string>(equipe);
    projetos.forEach((p) => {
      if (p.vendedora) set.add(p.vendedora.trim());
    });
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [equipe, projetos]);
}
