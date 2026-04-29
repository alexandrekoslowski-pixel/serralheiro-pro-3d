// Canvas touch para assinatura do cliente. Sem dependências externas —
// usa pointer events nativos pra funcionar em iPhone, Android e desktop.
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Eraser, Check } from "lucide-react";

interface Props {
  open: boolean;
  onConfirm: (dataUrl: string, nome: string) => void;
  onCancel: () => void;
  nomeInicial?: string;
}

export function AssinaturaCanvas({ open, onConfirm, onCancel, nomeInicial = "" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [vazio, setVazio] = useState(true);
  const [nome, setNome] = useState(nomeInicial);

  useEffect(() => {
    if (!open) return;
    const c = canvasRef.current;
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = c.getBoundingClientRect();
    c.width = rect.width * dpr;
    c.height = rect.height * dpr;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#1a1a1a";
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, rect.width, rect.height);
    setVazio(true);
    setNome(nomeInicial);
  }, [open, nomeInicial]);

  const pos = (e: React.PointerEvent) => {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const start = (e: React.PointerEvent) => {
    e.preventDefault();
    drawing.current = true;
    last.current = pos(e);
    canvasRef.current?.setPointerCapture(e.pointerId);
  };
  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !last.current) return;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
    setVazio(false);
  };
  const end = (e: React.PointerEvent) => {
    drawing.current = false;
    last.current = null;
    canvasRef.current?.releasePointerCapture(e.pointerId);
  };

  const limpar = () => {
    const c = canvasRef.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const r = c.getBoundingClientRect();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, r.width, r.height);
    setVazio(true);
  };

  const confirmar = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL("image/png");
    onConfirm(dataUrl, nome.trim());
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onCancel}>
      <div
        className="w-full max-w-lg rounded-2xl bg-card border border-border shadow-2xl p-4 space-y-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <div className="font-display text-lg">Assinatura do cliente</div>
          <div className="text-xs text-muted-foreground">Assine no quadro abaixo com o dedo ou caneta.</div>
        </div>

        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Nome do cliente"
          className="w-full h-11 px-3 rounded border border-border bg-background"
        />

        <div className="relative rounded-lg border-2 border-dashed border-border overflow-hidden bg-white">
          <canvas
            ref={canvasRef}
            className="block w-full h-[220px] touch-none cursor-crosshair"
            onPointerDown={start}
            onPointerMove={move}
            onPointerUp={end}
            onPointerCancel={end}
          />
          {vazio && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-muted-foreground text-sm">
              Assine aqui
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 h-12" onClick={limpar}>
            <Eraser className="mr-2 h-4 w-4" /> Limpar
          </Button>
          <Button
            className="flex-1 h-12 bg-gradient-orange text-primary-foreground shadow-orange"
            disabled={vazio}
            onClick={confirmar}
          >
            <Check className="mr-2 h-4 w-4" /> Confirmar
          </Button>
        </div>
      </div>
    </div>
  );
}
