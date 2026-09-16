// Lista de vendedores disponíveis: gestores e vendedoras cadastrados na Equipe.
import { useCallback, useEffect, useState } from "react";
import { EQUIPE_ATUALIZADA_EVENTO, listarEquipe } from "@/lib/gestao";

export function useVendedores(): string[] {
  const [equipe, setEquipe] = useState<string[]>([]);

  const recarregarEquipe = useCallback(() => {
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
  }, []);

  useEffect(() => {
    recarregarEquipe();
    window.addEventListener(EQUIPE_ATUALIZADA_EVENTO, recarregarEquipe);
    return () => window.removeEventListener(EQUIPE_ATUALIZADA_EVENTO, recarregarEquipe);
  }, [recarregarEquipe]);

  return [...new Set(equipe)].sort((a, b) => a.localeCompare(b));
}
