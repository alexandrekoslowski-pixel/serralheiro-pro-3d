import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Pencil, Search, History, PackageCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Material, MaterialPreco, listarMateriais, listarHistoricoMaterial, salvarMaterial, excluirMaterial } from "@/lib/gestao";
import { formatarBRL } from "@/lib/storage";
import { numeroMascarado } from "@/lib/mascaras";
import { CATALOGO_PADRAO } from "@/lib/catalogo";

const CODIGOS_CALCULO = [
  ...CATALOGO_PADRAO.perfis.map((p) => ({ codigo: p.codigo, descricao: p.descricao })),
  ...CATALOGO_PADRAO.acessorios.map((a) => ({ codigo: a.codigo, descricao: a.descricao })),
  { codigo: "VIDRO-M2", descricao: "Vidro temperado (preço por m²)" },
];

const NOMES_CATEGORIAS: Record<string, string> = {
  "automatizadores": "Automatizadores",
  "chapas": "Chapas",
  "chapas-buzios": "Chapas Búzios",
  "chapas-frisadas": "Chapas frisadas",
  "consumiveis": "Consumíveis",
  "epi": "EPI",
  "ferragens": "Ferragens",
  "ferramentas": "Ferramentas",
  "fixadores": "Fixadores",
  "kits-basculantes": "Kits basculantes",
  "laminados": "Laminados",
  "perfis": "Perfis",
  "telas-expandidas": "Telas expandidas",
  "tubos-galvanizados": "Tubos galvanizados",
  "tubos-pretos": "Tubos pretos",
  "vigas-u": "Vigas",
};

function nomeCategoria(categoria: string) {
  return NOMES_CATEGORIAS[categoria] ?? categoria;
}

export default function Materiais() {
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [busca, setBusca] = useState("");
  const [edit, setEdit] = useState<Partial<Material> | null>(null);
  const [categoria, setCategoria] = useState("todas");
  const [historico, setHistorico] = useState<{ material: Material; precos: MaterialPreco[] } | null>(null);

  const recarregar = async () => {
    // Tenta de novo após 1s — cobre oscilações de conexão e de sessão.
    for (let tentativa = 0; tentativa < 2; tentativa++) {
      try { setMateriais(await listarMateriais()); return; } catch { /* tenta novamente */ }
      await new Promise((r) => setTimeout(r, 1000));
    }
    try { setMateriais(await listarMateriais()); } catch { toast.error("Não foi possível carregar"); }
  };
  useEffect(() => { void recarregar(); }, []);

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return materiais.filter((m) => {
      const texto = `${m.nome} ${m.codigo_fornecedor} ${m.fornecedor} ${m.subtipo} ${m.categoria} ${nomeCategoria(m.categoria)}`.toLowerCase();
      return (categoria === "todas" || m.categoria === categoria) && (!q || texto.includes(q));
    });
  }, [materiais, busca, categoria]);
  const categorias = useMemo(() => Array.from(new Set(materiais.map((m) => m.categoria).filter(Boolean))).sort(), [materiais]);

  const salvar = async () => {
    if (!edit?.nome?.trim()) { toast.error("Informe o nome do material"); return; }
    try {
      await salvarMaterial({ ...edit, custo: Number(edit.preco_atual ?? edit.custo ?? 0), preco_atual: Number(edit.preco_atual ?? edit.custo ?? 0) });
      setEdit(null); await recarregar(); toast.success("Material salvo");
    } catch { toast.error("Não foi possível salvar"); }
  };

  return (
    <div className="container space-y-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl">Materiais</h1>
          <p className="text-sm text-muted-foreground">{materiais.length} itens técnicos com preço vigente e histórico.</p>
        </div>
        <Button className="bg-gradient-orange text-primary-foreground shadow-orange"
                onClick={() => setEdit({ nome: "", unidade: "un", unidade_compra: "un", custo: 0, preco_atual: 0, fornecedor: "", categoria: "outros", subtipo: "", codigo_fornecedor: "", ativo: true, observacoes: "" })}>
          <Plus className="mr-2 h-4 w-4" /> Novo material
        </Button>
      </div>

      <div className="grid gap-2 sm:grid-cols-[1fr_240px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar nome, código, tipo ou fornecedor" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <Select value={categoria} onValueChange={setCategoria}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="todas">Todas as categorias</SelectItem>{categorias.map((c) => <SelectItem key={c} value={c}>{nomeCategoria(c)}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="surface-card overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
               <th className="p-3">Código / material</th><th className="p-3">Categoria</th>
               <th className="p-3">Medida</th><th className="p-3">Preço vigente</th><th className="p-3">Referência</th><th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {lista.length === 0 && (
               <tr><td colSpan={6} className="p-8 text-center text-muted-foreground"><PackageCheck className="mx-auto mb-2 h-6 w-6" />Nenhum material encontrado.</td></tr>
            )}
            {lista.map((m) => (
              <tr key={m.id} className="border-b border-border/60 last:border-0">
                 <td className="p-3"><div className="font-mono text-xs text-muted-foreground">{m.codigo_fornecedor || "SEM CÓDIGO"}</div><div className="font-medium">{m.nome}</div><div className="text-xs text-muted-foreground">{m.fornecedor || "—"}</div>{m.codigo_calculo ? <div className="mt-1"><span className="rounded bg-primary/15 px-1.5 py-0.5 text-[11px] font-medium text-primary">Cálculo: {m.codigo_calculo}</span></div> : null}</td>
                 <td className="p-3"><span className="rounded bg-card px-2 py-1 text-xs">{nomeCategoria(m.categoria)}</span><div className="mt-1 text-xs text-muted-foreground">{m.subtipo}</div></td>
                 <td className="p-3 text-muted-foreground">{m.comprimento_comercial_mm ? `${Number(m.comprimento_comercial_mm) / 1000} m` : m.largura_mm ? `${Number(m.largura_mm) / 1000} m` : "—"}<div className="text-xs">{m.espessura_mm ? `${m.espessura_mm} mm` : m.unidade_compra}</div></td>
                 <td className="p-3 font-medium">{formatarBRL(Number(m.preco_atual ?? m.custo))}<div className="text-xs font-normal text-muted-foreground">por {m.preco_unidade || m.unidade_compra || m.unidade}</div></td>
                 <td className="p-3 text-muted-foreground">{m.preco_referencia ? new Date(`${m.preco_referencia}T12:00:00`).toLocaleDateString("pt-BR") : "—"}</td>
                <td className="p-3 text-right">
                  <div className="flex flex-wrap justify-end gap-1.5">
                    <Button size="sm" variant="soft" onClick={async () => setHistorico({ material: m, precos: await listarHistoricoMaterial(m.id) })}>
                      <History className="mr-1 h-3.5 w-3.5" /> Preços
                    </Button>
                    <Button size="sm" variant="soft" onClick={() => setEdit(m)}>
                      <Pencil className="mr-1 h-3.5 w-3.5" /> Editar
                    </Button>
                    <Button size="sm" variant="dangerOutline" onClick={async () => { await excluirMaterial(m.id); await recarregar(); }}>
                      <Trash2 className="mr-1 h-3.5 w-3.5" /> Excluir
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
         <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle>{edit?.id ? "Editar material" : "Novo material"}</DialogTitle></DialogHeader>
           <div className="form-grid">
              <div className="form-field-medium">
               <Label>Código do fornecedor</Label>
                <Input className="mt-1.5" mask="codigo" value={edit?.codigo_fornecedor ?? ""} onChange={(e) => setEdit((m) => ({ ...m, codigo_fornecedor: e.target.value }))} />
             </div>
              <div className="form-field-medium">
               <Label>Categoria</Label>
               <Input className="mt-1.5" value={edit?.categoria ?? "outros"} onChange={(e) => setEdit((m) => ({ ...m, categoria: e.target.value }))} />
             </div>
              <div className="form-field-full">
              <Label>Nome</Label>
              <Input className="mt-1.5" value={edit?.nome ?? ""} onChange={(e) => setEdit((m) => ({ ...m, nome: e.target.value }))} />
            </div>
             <div className="form-field-long">
               <Label>Tipo / subtipo</Label>
               <Input className="mt-1.5" value={edit?.subtipo ?? ""} onChange={(e) => setEdit((m) => ({ ...m, subtipo: e.target.value }))} />
            </div>
             <div className="form-field-medium">
               <Label>Preço vigente (R$)</Label>
                <Input className="mt-1.5" mask="moeda" value={String(edit?.preco_atual ?? edit?.custo ?? 0).replace(".", ",")}
                       onChange={(e) => setEdit((m) => ({ ...m, preco_atual: numeroMascarado(e.target.value) }))} />
            </div>
              <div className="form-field-short"><Label>Unidade de compra</Label><Input className="mt-1.5" value={edit?.unidade_compra ?? "un"} onChange={(e) => setEdit((m) => ({ ...m, unidade_compra: e.target.value, unidade: e.target.value }))} /></div>
               <div className="form-field-medium"><Label>Comprimento comercial (mm)</Label><Input className="mt-1.5" mask="inteiro" value={edit?.comprimento_comercial_mm ?? ""} onChange={(e) => setEdit((m) => ({ ...m, comprimento_comercial_mm: e.target.value ? Number(e.target.value) : null }))} /></div>
              <div className="form-field-full">
                <Label>Código de cálculo (liga este material ao orçamento)</Label>
                <Select value={edit?.codigo_calculo || "nenhum"} onValueChange={(v) => setEdit((m) => ({ ...m, codigo_calculo: v === "nenhum" ? "" : v }))}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nenhum">Nenhum — não entra no cálculo</SelectItem>
                    {CODIGOS_CALCULO.map((c) => <SelectItem key={c.codigo} value={c.codigo}>{c.codigo} — {c.descricao}</SelectItem>)}
                  </SelectContent>
                </Select>
                <p className="mt-1 text-xs text-muted-foreground">Quando ligado, o orçamento usa o preço vigente deste material automaticamente.</p>
              </div>
               <div className="form-field-long">
                <Label>Porte do motor (portão basculante)</Label>
                <Select value={edit?.porte_motor || "nenhum"} onValueChange={(v) => setEdit((m) => ({ ...m, porte_motor: v === "nenhum" ? "" : v }))}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nenhum">Não se aplica</SelectItem>
                    <SelectItem value="1/4">1/4 — até 3,00 m x 2,50 m</SelectItem>
                    <SelectItem value="1/2">1/2 — acima de 3,00 m x 2,50 m</SelectItem>
                  </SelectContent>
                </Select>
              </div>
               <div className="form-field-short"><Label>Espessura (mm)</Label><Input className="mt-1.5" mask="decimal" value={edit?.espessura_mm == null ? "" : String(edit.espessura_mm).replace(".", ",")} onChange={(e) => setEdit((m) => ({ ...m, espessura_mm: e.target.value ? numeroMascarado(e.target.value) : null }))} /></div>
             <div className="form-field-long">
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

      <Dialog open={!!historico} onOpenChange={(o) => !o && setHistorico(null)}>
        <DialogContent><DialogHeader><DialogTitle>Histórico — {historico?.material.nome}</DialogTitle></DialogHeader>
          <div className="space-y-2">{historico?.precos.map((p) => <div key={p.id} className="flex items-center justify-between border-b border-border py-2 text-sm"><div><div>{new Date(`${p.referencia}T12:00:00`).toLocaleDateString("pt-BR")}</div><div className="text-xs text-muted-foreground">{p.fornecedor} · {p.origem}</div></div><div className="font-medium">{formatarBRL(Number(p.valor))} / {p.unidade}</div></div>)}</div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
