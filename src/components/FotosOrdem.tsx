// Álbum de fotos da ordem: medição, montagem, pintura, acabamento e entrega.
import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ETAPAS_FOTO, EtapaFoto, FotoOrdem, listarFotos, enviarFoto, excluirFoto } from "@/lib/fotos";

interface Props {
  projetoId: string;
  etapaInicial?: EtapaFoto;
  /** Mostra só as fotos de uma etapa (ex.: medição). */
  somenteEtapa?: EtapaFoto;
}

export function PainelFotos({ projetoId, etapaInicial = "medicao", somenteEtapa }: Props) {
  const { toast } = useToast();
  const [fotos, setFotos] = useState<FotoOrdem[]>([]);
  const [etapa, setEtapa] = useState<EtapaFoto>(somenteEtapa ?? etapaInicial);
  const [obs, setObs] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [ampliada, setAmpliada] = useState<FotoOrdem | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const carregar = useCallback(async () => {
    try {
      setFotos(await listarFotos(projetoId));
    } catch {
      /* sem fotos */
    }
  }, [projetoId]);

  useEffect(() => { void carregar(); }, [carregar]);

  const escolher = async (files: FileList | null) => {
    if (!files?.length) return;
    setEnviando(true);
    try {
      for (const f of Array.from(files)) await enviarFoto(projetoId, etapa, f, obs);
      setObs("");
      await carregar();
      toast({ title: "Foto anexada à ordem." });
    } catch (e) {
      toast({ title: "Não foi possível enviar a foto", description: (e as Error).message, variant: "destructive" });
    } finally {
      setEnviando(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const apagar = async (f: FotoOrdem) => {
    try {
      await excluirFoto(f);
      await carregar();
    } catch {
      toast({ title: "Não foi possível excluir a foto", variant: "destructive" });
    }
  };

  const visiveis = somenteEtapa ? fotos.filter((f) => f.etapa === somenteEtapa) : fotos;

  return (
    <div className="space-y-3">
      {!somenteEtapa && (
        <div className="flex flex-wrap gap-1">
          {ETAPAS_FOTO.map((e) => (
            <Button
              key={e.id}
              size="sm"
              variant={etapa === e.id ? "default" : "soft"}
              onClick={() => setEtapa(e.id)}
            >
              {e.nome}
            </Button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Input
          maxLength={500}
          placeholder="Observação da foto (opcional)"
          value={obs}
          onChange={(ev) => setObs(ev.target.value)}
          className="max-w-xs"
        />
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          className="hidden"
          onChange={(ev) => void escolher(ev.target.files)}
        />
        <Button onClick={() => inputRef.current?.click()} disabled={enviando}>
          {enviando ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Camera className="mr-1 h-4 w-4" />}
          Tirar / enviar foto
        </Button>
      </div>

      {!visiveis.length ? (
        <p className="rounded border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Nenhuma foto anexada ainda.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {visiveis.map((f) => (
            <figure key={f.id} className="overflow-hidden rounded-lg border border-border bg-card">
              <button type="button" className="block w-full" onClick={() => setAmpliada(f)}>
                {f.url ? (
                  <img src={f.url} alt={`Foto da etapa ${f.etapa}`} loading="lazy" className="h-28 w-full object-cover" />
                ) : (
                  <div className="grid h-28 place-items-center text-xs text-muted-foreground">sem prévia</div>
                )}
              </button>
              <figcaption className="space-y-1 p-2 text-[11px] text-muted-foreground">
                <span className="block font-medium text-foreground">
                  {ETAPAS_FOTO.find((e) => e.id === f.etapa)?.nome ?? f.etapa}
                </span>
                {f.observacao ? <span className="block">{f.observacao}</span> : null}
                <span className="block">
                  {f.enviado_nome} · {new Date(f.created_at).toLocaleDateString("pt-BR")}
                </span>
                <Button size="sm" variant="dangerOutline" className="w-full" onClick={() => void apagar(f)}>
                  <Trash2 className="mr-1 h-3.5 w-3.5" /> Excluir
                </Button>
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      <Dialog open={!!ampliada} onOpenChange={(o) => !o && setAmpliada(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{ampliada?.observacao || "Foto da ordem"}</DialogTitle>
          </DialogHeader>
          {ampliada?.url ? <img src={ampliada.url} alt="Foto da ordem ampliada" className="w-full rounded" /> : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function FotosOrdemDialog({ projetoId, etapaInicial, total }: Props & { total?: number }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="soft" className="flex-1">
          <Camera className="mr-1 h-3.5 w-3.5" /> Fotos{total ? ` (${total})` : ""}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Fotos da ordem</DialogTitle>
        </DialogHeader>
        <PainelFotos projetoId={projetoId} etapaInicial={etapaInicial} />
      </DialogContent>
    </Dialog>
  );
}
