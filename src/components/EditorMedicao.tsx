// Editor de medição: anota a foto com cotas (setas com medida em cm), linhas e textos.
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeftRight, ArrowUpDown, Minus, Type, Undo2, Trash2, Loader2, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { enviarFotoBlob } from "@/lib/fotos";

type Ferramenta = "setaH" | "setaV" | "linha" | "texto";

interface Forma {
  tipo: Ferramenta;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  rotulo: string;
}

interface Props {
  projetoId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

const COR = "#f97316"; // laranja da marca, bem visível sobre a foto

function desenharSetaDupla(ctx: CanvasRenderingContext2D, f: Forma) {
  const horizontal = f.tipo === "setaH";
  const x1 = horizontal ? f.x1 : f.x1;
  const y1 = horizontal ? f.y1 : f.y1;
  const x2 = horizontal ? f.x2 : f.x1;
  const y2 = horizontal ? f.y1 : f.y2;
  const cabeca = 12;

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  const pontas: [number, number, number][] = [
    [x1, y1, horizontal ? 0 : Math.PI / 2],
    [x2, y2, horizontal ? Math.PI : -Math.PI / 2],
  ];
  for (const [px, py, ang] of pontas) {
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + cabeca * Math.cos(ang - 0.4), py + cabeca * Math.sin(ang - 0.4));
    ctx.moveTo(px, py);
    ctx.lineTo(px + cabeca * Math.cos(ang + 0.4), py + cabeca * Math.sin(ang + 0.4));
    ctx.stroke();
  }

  if (f.rotulo) {
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    ctx.font = "bold 28px sans-serif";
    const larg = ctx.measureText(f.rotulo).width + 16;
    ctx.fillStyle = "rgba(0,0,0,0.75)";
    ctx.fillRect(mx - larg / 2, my - 22, larg, 34);
    ctx.fillStyle = COR;
    ctx.fillText(f.rotulo, mx - larg / 2 + 8, my + 4);
  }
}

export function EditorMedicao({ projetoId, open, onOpenChange, onSaved }: Props) {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const imagemRef = useRef<ImageBitmap | null>(null);
  const [pronta, setPronta] = useState(false);
  const [ferramenta, setFerramenta] = useState<Ferramenta>("setaH");
  const [medida, setMedida] = useState("");
  const [texto, setTexto] = useState("");
  const [formas, setFormas] = useState<Forma[]>([]);
  const [rascunho, setRascunho] = useState<Forma | null>(null);
  const [salvando, setSalvando] = useState(false);
  const desenho = useRef<{ x: number; y: number } | null>(null);

  const redesenhar = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imagemRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = COR;
    ctx.fillStyle = COR;
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    for (const f of [...formas, ...(rascunho ? [rascunho] : [])]) {
      if (f.tipo === "setaH" || f.tipo === "setaV") {
        desenharSetaDupla(ctx, f);
      } else if (f.tipo === "linha") {
        ctx.beginPath();
        ctx.moveTo(f.x1, f.y1);
        ctx.lineTo(f.x2, f.y2);
        ctx.stroke();
      } else if (f.rotulo) {
        ctx.font = "bold 28px sans-serif";
        const larg = ctx.measureText(f.rotulo).width + 16;
        ctx.fillStyle = "rgba(0,0,0,0.75)";
        ctx.fillRect(f.x1 - 8, f.y1 - 30, larg, 38);
        ctx.fillStyle = COR;
        ctx.fillText(f.rotulo, f.x1, f.y1);
      }
    }
  }, [formas, rascunho]);

  useEffect(() => { redesenhar(); }, [redesenhar]);

  const carregarFoto = async (file: File | null) => {
    if (!file) return;
    try {
      const bitmap = await createImageBitmap(file);
      const max = 1600;
      const escala = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = Math.round(bitmap.width * escala);
      canvas.height = Math.round(bitmap.height * escala);
      imagemRef.current = bitmap;
      setFormas([]);
      setPronta(true);
    } catch {
      toast({ title: "Não foi possível abrir a foto", variant: "destructive" });
    }
  };

  const ponto = (ev: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((ev.clientX - rect.left) / rect.width) * canvas.width,
      y: ((ev.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const aoPressionar = (ev: React.PointerEvent<HTMLCanvasElement>) => {
    if (!pronta) return;
    ev.preventDefault();
    const p = ponto(ev);
    if (ferramenta === "texto") {
      if (!texto.trim()) {
        toast({ title: "Digite o texto antes de tocar na foto", variant: "destructive" });
        return;
      }
      setFormas((f) => [...f, { tipo: "texto", x1: p.x, y1: p.y, x2: p.x, y2: p.y, rotulo: texto.trim() }]);
      setTexto("");
      return;
    }
    desenho.current = p;
    setRascunho({ tipo: ferramenta, x1: p.x, y1: p.y, x2: p.x, y2: p.y, rotulo: "" });
  };

  const aoMover = (ev: React.PointerEvent<HTMLCanvasElement>) => {
    if (!desenho.current) return;
    const p = ponto(ev);
    const ini = desenho.current;
    setRascunho((r) => (r ? { ...r, x2: p.x, y2: p.y } : r));
    void ini;
  };

  const aoSoltar = () => {
    if (!desenho.current || !rascunho) return;
    desenho.current = null;
    const dist = Math.hypot(rascunho.x2 - rascunho.x1, rascunho.y2 - rascunho.y1);
    if (dist > 10) {
      const rotulo =
        rascunho.tipo === "setaH" || rascunho.tipo === "setaV"
          ? medida.trim()
            ? `${medida.trim()} cm`
            : ""
          : "";
      setFormas((f) => [...f, { ...rascunho, rotulo }]);
      if (rotulo) setMedida("");
    }
    setRascunho(null);
  };

  const salvar = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !pronta) return;
    setSalvando(true);
    try {
      const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.85));
      if (!blob) throw new Error("Falha ao gerar a imagem.");
      await enviarFotoBlob(projetoId, "medicao", blob, "Foto anotada da medição");
      toast({ title: "Foto de medição salva na ordem." });
      onSaved();
      fechar();
    } catch (e) {
      toast({ title: "Não foi possível salvar", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSalvando(false);
    }
  };

  const fechar = () => {
    onOpenChange(false);
    setPronta(false);
    setFormas([]);
    setRascunho(null);
    imagemRef.current = null;
    if (inputRef.current) inputRef.current.value = "";
  };

  const botoes: { id: Ferramenta; nome: string; icon: typeof Minus }[] = [
    { id: "setaH", nome: "Cota ↔", icon: ArrowLeftRight },
    { id: "setaV", nome: "Cota ↕", icon: ArrowUpDown },
    { id: "linha", nome: "Linha", icon: Minus },
    { id: "texto", nome: "Texto", icon: Type },
  ];

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : fechar())}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Anotar foto da medição</DialogTitle>
        </DialogHeader>

        {!pronta ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Tire uma foto do local ou escolha uma imagem. Depois desenhe as medidas por cima.
            </p>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(ev) => void carregarFoto(ev.target.files?.[0] ?? null)}
            />
            <Button className="w-full" onClick={() => inputRef.current?.click()}>
              <Camera className="mr-2 h-4 w-4" /> Tirar / escolher foto
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {botoes.map((b) => (
                <Button
                  key={b.id}
                  size="sm"
                  variant={ferramenta === b.id ? "default" : "soft"}
                  onClick={() => setFerramenta(b.id)}
                >
                  <b.icon className="mr-1 h-4 w-4" /> {b.nome}
                </Button>
              ))}
              <Button size="sm" variant="outline" onClick={() => setFormas((f) => f.slice(0, -1))} disabled={!formas.length}>
                <Undo2 className="mr-1 h-4 w-4" /> Desfazer
              </Button>
              <Button size="sm" variant="dangerOutline" onClick={() => setFormas([])} disabled={!formas.length}>
                <Trash2 className="mr-1 h-4 w-4" /> Limpar
              </Button>
            </div>

            <div className="flex flex-wrap items-end gap-3">
              <div>
                <Label>Medida da cota (cm)</Label>
                <Input
                  mask="decimal"
                  className="w-28"
                  placeholder="ex.: 260"
                  value={medida}
                  onChange={(e) => setMedida(e.target.value)}
                />
              </div>
              {ferramenta === "texto" && (
                <div className="flex-1 min-w-40">
                  <Label>Texto a inserir</Label>
                  <Input maxLength={60} placeholder="ex.: vão livre" value={texto} onChange={(e) => setTexto(e.target.value)} />
                </div>
              )}
              <p className="flex-1 text-xs text-muted-foreground">
                Arraste sobre a foto para desenhar. A cota usa a medida digitada acima.
              </p>
            </div>

            <canvas
              ref={canvasRef}
              className="w-full touch-none rounded border border-border"
              onPointerDown={aoPressionar}
              onPointerMove={aoMover}
              onPointerUp={aoSoltar}
              onPointerLeave={aoSoltar}
            />

            <div className="flex justify-end gap-2">
              <Button variant="soft" onClick={fechar}>Cancelar</Button>
              <Button onClick={() => void salvar()} disabled={salvando}>
                {salvando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Salvar foto anotada
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
