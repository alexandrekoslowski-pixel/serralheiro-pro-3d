import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, FileDown, AlertCircle } from "lucide-react";

/**
 * Página pública (sem login) que recebe um código curto, resolve o link do PDF
 * no banco e dispara o download — o cliente nunca vê a URL assinada enorme.
 */
export default function DownloadOrcamento() {
  const { codigo = "" } = useParams();
  const [erro, setErro] = useState(false);

  useEffect(() => {
    let ativo = true;
    (async () => {
      const { data, error } = await supabase.rpc("link_orcamento", { _codigo: codigo });
      if (!ativo) return;
      if (error || !data) {
        setErro(true);
        return;
      }
      // O parâmetro download= na URL assinada faz o navegador baixar o arquivo
      // sem sair desta página, então a URL longa nunca aparece na barra de endereço.
      window.location.href = data as string;
    })();
    return () => {
      ativo = false;
    };
  }, [codigo]);

  return (
    <div className="grid min-h-screen place-items-center bg-background p-6 text-center">
      {erro ? (
        <div>
          <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
          <p className="mt-3 font-display text-lg">Link inválido ou expirado</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Peça à serralheria um novo link do orçamento.
          </p>
        </div>
      ) : (
        <div>
          <FileDown className="mx-auto h-10 w-10 animate-bounce text-primary" />
          <p className="mt-3 font-display text-lg">Baixando orçamento…</p>
          <Loader2 className="mx-auto mt-2 h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
