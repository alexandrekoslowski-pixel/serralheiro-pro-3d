// Medição da ordem: medidas finas + fotos anotadas desenhadas por cima.
import { useEffect, useState } from "react";
import { Ruler, Save, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { obterProjeto, salvarProjeto } from "@/lib/storage";
import { useDados } from "@/hooks/useDados";
import { numeroMascarado } from "@/lib/mascaras";
import { PainelFotos } from "@/components/FotosOrdem";
import { EditorMedicao } from "@/components/EditorMedicao";

export function MedicaoDialog({ projetoId }: { projetoId: string }) {
  const { toast } = useToast();
  const [aberto, setAberto] = useState(false);
  const [editor, setEditor] = useState(false);
  const [recarregar, setRecarregar] = useState(0);

  useDados(); // acompanha o carregamento das ordens vindas da nuvem
  const projeto = obterProjeto(projetoId);
  const [largura, setLargura] = useState("");
  const [altura, setAltura] = useState("");
  const [obs, setObs] = useState("");
  const [carregado, setCarregado] = useState(false);

  // Só preenche quando a ordem já chegou, para não apagar a medição salva antes.
  useEffect(() => {
    if (!aberto || carregado || !projeto) return;
    setLargura(projeto.medicao.largura_mm ? String(projeto.medicao.largura_mm / 10).replace(".", ",") : "");
    setAltura(projeto.medicao.altura_mm ? String(projeto.medicao.altura_mm / 10).replace(".", ",") : "");
    setObs(projeto.medicao.observacoes ?? "");
    setCarregado(true);
  }, [aberto, carregado, projeto]);

  const abrir = (o: boolean) => setAberto(o);

  const salvar = () => {
    if (!projeto) {
      toast({ title: "Ordem ainda carregando", description: "Aguarde um instante e salve de novo." });
      return;
    }
    salvarProjeto({
      ...projeto,
      medicao: {
        largura_mm: largura.trim() ? Math.round(numeroMascarado(largura) * 10) : null,
        altura_mm: altura.trim() ? Math.round(numeroMascarado(altura) * 10) : null,
        observacoes: obs.trim(),
      },
    });
    toast({ title: "Medição salva na ordem." });
  };

  return (
    <Dialog open={aberto} onOpenChange={abrir}>
      <DialogTrigger asChild>
        <Button size="sm" variant="soft" className="flex-1">
          <Ruler className="mr-1 h-3.5 w-3.5" /> Medição
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Medição da ordem</DialogTitle>
        </DialogHeader>

        <div className="form-grid">
          <div className="form-field-measure">
            <Label>Largura medida (cm)</Label>
            <Input mask="decimal" placeholder="ex.: 260" value={largura} onChange={(e) => setLargura(e.target.value)} />
          </div>
          <div className="form-field-measure">
            <Label>Altura medida (cm)</Label>
            <Input mask="decimal" placeholder="ex.: 220" value={altura} onChange={(e) => setAltura(e.target.value)} />
          </div>
        </div>
        <div>
          <Label>Observações da medição</Label>
          <Textarea rows={2} maxLength={1000} placeholder="Vãos, nível, interferências, tomadas..."
            value={obs} onChange={(e) => setObs(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={salvar} className="flex-1">
            <Save className="mr-1 h-4 w-4" /> Salvar medidas
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => setEditor(true)}>
            <Pencil className="mr-1 h-4 w-4" /> Anotar foto com medidas
          </Button>
        </div>

        <div className="border-t border-border pt-3">
          <h3 className="mb-2 text-sm font-semibold">Fotos da medição</h3>
          <PainelFotos key={recarregar} projetoId={projetoId} somenteEtapa="medicao" />
        </div>

        <EditorMedicao
          projetoId={projetoId}
          open={editor}
          onOpenChange={setEditor}
          onSaved={() => setRecarregar((n) => n + 1)}
        />
      </DialogContent>
    </Dialog>
  );
}
