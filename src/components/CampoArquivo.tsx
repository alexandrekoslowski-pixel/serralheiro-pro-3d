import { useId, useRef, useState } from "react";
import { Camera, FileUp, Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Área grande e óbvia para escolher um arquivo (foto ou PDF). */
export function CampoArquivo({
  valor,
  onChange,
  titulo = "Anexar comprovante",
  ajuda = "Toque para escolher uma foto ou um PDF (até 10 MB)",
}: {
  valor: File | null;
  onChange: (f: File | null) => void;
  titulo?: string;
  ajuda?: string;
}) {
  const id = useId();
  const cameraRef = useRef<HTMLInputElement>(null);
  const [arrastando, setArrastando] = useState(false);

  if (valor) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-primary/40 bg-primary/5 p-3">
        <span className="flex min-w-0 items-center gap-2 text-sm">
          <Paperclip className="h-4 w-4 shrink-0 text-primary" />
          <span className="truncate">{valor.name}</span>
          <span className="shrink-0 text-xs text-muted-foreground">{(valor.size / 1024 / 1024).toFixed(1)} MB</span>
        </span>
        <Button type="button" size="sm" variant="outline" onClick={() => onChange(null)}>
          <X className="mr-1 h-3.5 w-3.5" /> Trocar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        onDragOver={(e) => { e.preventDefault(); setArrastando(true); }}
        onDragLeave={() => setArrastando(false)}
        onDrop={(e) => { e.preventDefault(); setArrastando(false); const f = e.dataTransfer.files?.[0]; if (f) onChange(f); }}
        className={`flex cursor-pointer flex-col items-center gap-1 rounded-xl border-2 border-dashed p-5 text-center transition ${
          arrastando ? "border-primary bg-primary/10" : "border-border hover:border-primary hover:bg-muted/50"
        }`}
      >
        <FileUp className="h-6 w-6 text-primary" />
        <span className="text-sm font-semibold">{titulo}</span>
        <span className="text-xs text-muted-foreground">{ajuda}</span>
        <input id={id} className="sr-only" type="file" accept="image/*,application/pdf"
          onChange={(e) => onChange(e.target.files?.[0] ?? null)} />
      </label>
      <div className="sm:hidden">
        <Button type="button" variant="soft" className="w-full" onClick={() => cameraRef.current?.click()}>
          <Camera className="mr-2 h-4 w-4" /> Tirar foto do comprovante
        </Button>
        <input ref={cameraRef} className="sr-only" type="file" accept="image/*" capture="environment"
          onChange={(e) => onChange(e.target.files?.[0] ?? null)} />
      </div>
    </div>
  );
}
