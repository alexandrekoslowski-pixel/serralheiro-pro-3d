// Lista de vendedores disponíveis: equipe (gestores e vendedoras), nomes
// cadastrados na empresa e nomes já usados em orçamentos.
import { useEffect, useMemo, useState } from "react";
import { listarEquipe } from "@/lib/gestao";
import { listarProjetos, obterEmpresa } from "@/lib/storage";

export function useVendedores(): string[] {
  const [equipe, setEquipe] = useState<string[]>([]);
  const projetos = listarProjetos();
  const empresa = obterEmpresa();

  useEffect(() => {
    let vivo = true;
    void listarEquipe()
      .then((membros) => {
        if (!vivo) return;
        setEquipe(
          membros
            .filter((m) => m.role === "gestor" || m.role === "vendedora")
            .map((m) => (m.nome ?? "").trim())
            .filter(Boolean),
        );
      })
      .catch(() => undefined);
    return () => { vivo = false; };
  }, []);

  return useMemo(() => {
    const set = new Set<string>(equipe);
    (empresa.vendedoras ?? []).filter(Boolean).forEach((v) => set.add(v.trim()));
    projetos.forEach((p) => { if (p.vendedora) set.add(p.vendedora.trim()); });
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [equipe, empresa, projetos]);
}
