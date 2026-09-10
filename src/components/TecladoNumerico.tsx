// Teclado numérico custom para medidas (cm) — botões grandes, mobile-first.
// Funciona com luva, sem precisar do teclado do iOS.
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Delete, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  label: string;
  initial: number;
  min: number;
  max: number;
  onConfirm: (value: number) => void;
  onCancel: () => void;
}

export function TecladoNumerico({ open, label, initial, min, max, onConfirm, onCancel }: Props) {
  const [valor, setValor] = useState<string>(String(initial));

  useEffect(() => {
    if (open) setValor(String(initial));
  }, [open, initial]);

  if (!open) return null;

  const num = Number(valor) || 0;
  const valido = num >= min && num <= max;

  const append = (d: string) => {
    if (valor.length >= 5) return;
    const next = valor === "0" ? d : valor + d;
    setValor(next);
  };
  const back = () => setValor((v) => (v.length > 1 ? v.slice(0, -1) : "0"));
  const ajustar = (delta: number) => {
    const novo = Math.max(min, Math.min(max, num + delta));
    setValor(String(novo));
  };
  const clamp = () => Math.max(min, Math.min(max, num));

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center" onClick={onCancel}>
      <div
        className="w-full sm:w-[420px] sm:rounded-2xl rounded-t-2xl bg-card border border-border shadow-2xl p-4 space-y-3 animate-in slide-in-from-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
            <div className="text-[10px] text-muted-foreground">min {min} · max {max} cm</div>
          </div>
          <Button variant="ghost" size="icon" onClick={onCancel}><X className="h-5 w-5" /></Button>
        </div>

        {/* Display */}
        <div className={cn(
          "rounded-xl border-2 px-4 py-5 text-center transition-colors",
          valido ? "border-primary bg-primary/5" : "border-destructive bg-destructive/5",
        )}>
          <div className="font-display tabular-nums text-5xl sm:text-6xl font-bold">
            {Number(valor).toLocaleString("pt-BR")}
            <span className="text-2xl text-muted-foreground ml-2">cm</span>
          </div>
          {!valido && (
            <div className="text-xs text-destructive mt-1">Valor fora do intervalo</div>
          )}
        </div>

        {/* Ajustes finos */}
        <div className="grid grid-cols-4 gap-2">
          {[-100, -50, +50, +100].map((d) => (
            <Button key={d} variant="outline" size="lg" className="h-12 font-mono text-base" onClick={() => ajustar(d)}>
              {d > 0 ? `+${d}` : d}
            </Button>
          ))}
        </div>

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-2">
          {["1","2","3","4","5","6","7","8","9"].map((d) => (
            <Button
              key={d}
              variant="secondary"
              className="h-14 text-2xl font-bold tabular-nums"
              onClick={() => append(d)}
            >
              {d}
            </Button>
          ))}
          <Button variant="ghost" className="h-14 text-base" onClick={() => setValor("0")}>C</Button>
          <Button variant="secondary" className="h-14 text-2xl font-bold tabular-nums" onClick={() => append("0")}>0</Button>
          <Button variant="ghost" className="h-14" onClick={back}><Delete className="h-6 w-6" /></Button>
        </div>

        {/* Confirmar */}
        <Button
          size="lg"
          className="w-full h-14 text-lg font-bold bg-gradient-orange text-primary-foreground shadow-orange"
          onClick={() => onConfirm(clamp())}
        >
          <Check className="mr-2 h-5 w-5" /> Confirmar
        </Button>
      </div>
    </div>
  );
}
