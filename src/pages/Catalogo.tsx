import { useEffect, useState } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ServicoCatalogo, listarServicos, salvarServico, excluirServico } from "@/lib/gestao";
import { TIPOS_SERVICO } from "@/lib/briefing";
import { formatarBRL } from "@/lib/storage";

const CAMPOS_SUGERIDOS = [
  "Largura", "Altura", "Quantidade", "Tipo de fechamento", "Maçaneta",
  "Motor", "Pintura", "Acabamento", "Observações",
];

export default function Catalogo() {
  const [servicos, setServicos] = useState<ServicoCatalogo[]>([]);
  const [edit, setEdit] = useState<Partial<ServicoCatalogo> | null>(null);

  const recarregar = () => listarServicos().then(setServicos).catch(() => toast.error("Não foi possível carregar"));
  useEffect(() => { void recarregar(); }, []);

  const alternarCampo = (c: string) =>
    setEdit((s) => {
      const atuais = s?.campos ?? [];
      return { ...s, campos: atuais.includes(c) ? atuais.filter((x) => x !== c) : [...atuais, c] };
    });

  const salvar = async () => {
    if (!edit?.nome?.trim()) { toast.error("Informe o nome do serviço"); return; }
    try {
      await salvarServico({ ...edit, preco_base: Number(edit.preco_base ?? 0) });
      setEdit(null); await recarregar(); toast.success("Serviço salvo");
    } catch { toast.error("Não foi possível salvar"); }
  };

  return (
    <div className="container space-y-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl">Catálogo de serviços</h1>
          <p className="text-sm text-muted-foreground">Cada serviço com seus próprios campos, usados no briefing e no orçamento.</p>
        </div>
        <Button className="bg-gradient-orange text-primary-foreground shadow-orange"
                onClick={() => setEdit({ nome: "", categoria: "portao", descricao: "", preco_base: 0, campos: ["Largura", "Altura"], ativo: true })}>
          <Plus className="mr-2 h-4 w-4" /> Novo serviço
        </Button>
      </div>

      {servicos.length === 0 ? (
        <div className="surface-card rounded-lg border border-border p-8 text-center text-sm text-muted-foreground">
          Nenhum serviço cadastrado.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {servicos.map((s) => (
            <div key={s.id} className="surface-card rounded-lg border border-border p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate font-medium">{s.nome}</div>
                  <div className="text-xs text-muted-foreground">
                    {TIPOS_SERVICO.find((t) => t.id === s.categoria)?.nome ?? s.categoria}
                  </div>
                </div>
                <span className="text-sm text-primary">{formatarBRL(Number(s.preco_base))}</span>
              </div>
              {s.descricao && <p className="mt-2 text-xs text-muted-foreground">{s.descricao}</p>}
              <div className="mt-2 flex flex-wrap gap-1">
                {(s.campos ?? []).map((c) => (
                  <span key={c} className="rounded bg-card px-2 py-0.5 text-[10px] text-muted-foreground">{c}</span>
                ))}
              </div>
              <div className="mt-3 flex gap-1.5">
                <Button size="sm" variant="soft" onClick={() => setEdit(s)}><Pencil className="mr-1 h-3.5 w-3.5" /> Editar</Button>
                <Button size="sm" variant="dangerOutline" onClick={async () => { await excluirServico(s.id); await recarregar(); }}>
                  <Trash2 className="mr-1 h-3.5 w-3.5" /> Excluir
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{edit?.id ? "Editar serviço" : "Novo serviço"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nome</Label>
              <Input className="mt-1.5" value={edit?.nome ?? ""} onChange={(e) => setEdit((s) => ({ ...s, nome: e.target.value }))} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Categoria</Label>
                <Select value={edit?.categoria ?? "portao"} onValueChange={(v) => setEdit((s) => ({ ...s, categoria: v }))}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIPOS_SERVICO.map((t) => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Preço base (R$)</Label>
                <Input className="mt-1.5" type="number" value={edit?.preco_base ?? 0}
                       onChange={(e) => setEdit((s) => ({ ...s, preco_base: Number(e.target.value) }))} />
              </div>
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea className="mt-1.5" rows={2} value={edit?.descricao ?? ""}
                        onChange={(e) => setEdit((s) => ({ ...s, descricao: e.target.value }))} />
            </div>
            <div>
              <Label>Campos deste serviço</Label>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {CAMPOS_SUGERIDOS.map((c) => (
                  <button key={c} type="button" onClick={() => alternarCampo(c)}
                    className={`rounded border px-3 py-1.5 text-sm ${(edit?.campos ?? []).includes(c) ? "border-primary bg-primary/15" : "border-border"}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEdit(null)}>Cancelar</Button>
            <Button className="bg-gradient-orange text-primary-foreground" onClick={salvar}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
