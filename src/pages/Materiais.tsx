import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Pencil, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Material, listarMateriais, salvarMaterial, excluirMaterial } from "@/lib/gestao";
import { formatarBRL } from "@/lib/storage";

export default function Materiais() {
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [busca, setBusca] = useState("");
  const [edit, setEdit] = useState<Partial<Material> | null>(null);

  const recarregar = () => listarMateriais().then(setMateriais).catch(() => toast.error("Não foi possível carregar"));
  useEffect(() => { void recarregar(); }, []);

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return materiais.filter((m) => !q || m.nome.toLowerCase().includes(q) || m.fornecedor.toLowerCase().includes(q));
  }, [materiais, busca]);

  const salvar = async () => {
    if (!edit?.nome?.trim()) { toast.error("Informe o nome do material"); return; }
    try {
      await salvarMaterial({ ...edit, custo: Number(edit.custo ?? 0) });
      setEdit(null); await recarregar(); toast.success("Material salvo");
    } catch { toast.error("Não foi possível salvar"); }
  };

  return (
    <div className="container space-y-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl">Materiais</h1>
          <p className="text-sm text-muted-foreground">Custo e fornecedor de cada material, usado nas compras e no comparativo.</p>
        </div>
        <Button className="bg-gradient-orange text-primary-foreground shadow-orange"
                onClick={() => setEdit({ nome: "", unidade: "un", custo: 0, fornecedor: "", observacoes: "" })}>
          <Plus className="mr-2 h-4 w-4" /> Novo material
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Buscar material ou fornecedor" value={busca} onChange={(e) => setBusca(e.target.value)} />
      </div>

      <div className="surface-card overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="p-3">Material</th><th className="p-3">Un.</th>
              <th className="p-3">Custo</th><th className="p-3">Fornecedor</th><th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {lista.length === 0 && (
              <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Nenhum material cadastrado.</td></tr>
            )}
            {lista.map((m) => (
              <tr key={m.id} className="border-b border-border/60 last:border-0">
                <td className="p-3">{m.nome}</td>
                <td className="p-3 text-muted-foreground">{m.unidade}</td>
                <td className="p-3">{formatarBRL(Number(m.custo))}</td>
                <td className="p-3 text-muted-foreground">{m.fornecedor || "—"}</td>
                <td className="p-3 text-right">
                  <Button size="sm" variant="ghost" onClick={() => setEdit(m)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="ghost" onClick={async () => { await excluirMaterial(m.id); await recarregar(); }}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{edit?.id ? "Editar material" : "Novo material"}</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Nome</Label>
              <Input className="mt-1.5" value={edit?.nome ?? ""} onChange={(e) => setEdit((m) => ({ ...m, nome: e.target.value }))} />
            </div>
            <div>
              <Label>Unidade</Label>
              <Input className="mt-1.5" value={edit?.unidade ?? "un"} onChange={(e) => setEdit((m) => ({ ...m, unidade: e.target.value }))} />
            </div>
            <div>
              <Label>Custo (R$)</Label>
              <Input className="mt-1.5" type="number" value={edit?.custo ?? 0}
                     onChange={(e) => setEdit((m) => ({ ...m, custo: Number(e.target.value) }))} />
            </div>
            <div className="sm:col-span-2">
              <Label>Fornecedor</Label>
              <Input className="mt-1.5" value={edit?.fornecedor ?? ""} onChange={(e) => setEdit((m) => ({ ...m, fornecedor: e.target.value }))} />
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
