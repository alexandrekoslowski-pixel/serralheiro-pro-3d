import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Star, Trash2, Pencil, ClipboardList, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  Cliente, ORIGENS, listarClientes, salvarCliente, excluirCliente,
} from "@/lib/gestao";

const VAZIO: Partial<Cliente> = {
  nome: "", documento: "", email: "", telefone: "", whatsapp: "",
  endereco: "", bairro: "", cidade: "", cep: "", origem: "whatsapp",
  estrategico: false, observacoes: "",
};

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busca, setBusca] = useState("");
  const [edit, setEdit] = useState<Partial<Cliente> | null>(null);
  const [carregando, setCarregando] = useState(true);

  const recarregar = () =>
    listarClientes()
      .then(setClientes)
      .catch(() => toast.error("Não foi possível carregar os clientes"))
      .finally(() => setCarregando(false));

  useEffect(() => { void recarregar(); }, []);

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return clientes.filter((c) =>
      !q || c.nome.toLowerCase().includes(q) || c.telefone.includes(q) || c.cidade.toLowerCase().includes(q));
  }, [clientes, busca]);

  const salvar = async () => {
    if (!edit?.nome?.trim()) { toast.error("Informe o nome do cliente"); return; }
    try {
      await salvarCliente(edit);
      setEdit(null);
      await recarregar();
      toast.success("Cliente salvo");
    } catch { toast.error("Não foi possível salvar"); }
  };

  const remover = async (c: Cliente) => {
    if (!confirm(`Excluir ${c.nome}?`)) return;
    try { await excluirCliente(c.id); await recarregar(); } catch { toast.error("Não foi possível excluir"); }
  };

  const campo = (k: keyof Cliente, label: string, tipo = "text") => (
    <div>
      <Label>{label}</Label>
      <Input
        className="mt-1.5"
        type={tipo}
        value={(edit?.[k] as string) ?? ""}
        onChange={(e) => setEdit((v) => ({ ...v, [k]: e.target.value }))}
      />
    </div>
  );

  return (
    <div className="container py-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl">Clientes</h1>
          <p className="text-sm text-muted-foreground">Cadastro único, reaproveitado no orçamento e na ordem de serviço.</p>
        </div>
        <Button className="bg-gradient-orange text-primary-foreground shadow-orange" onClick={() => setEdit({ ...VAZIO })}>
          <Plus className="mr-2 h-4 w-4" /> Novo cliente
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Buscar por nome, telefone ou cidade" value={busca} onChange={(e) => setBusca(e.target.value)} />
      </div>

      {carregando ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : lista.length === 0 ? (
        <div className="surface-card rounded-lg border border-border p-8 text-center text-sm text-muted-foreground">
          Nenhum cliente cadastrado ainda.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {lista.map((c) => (
            <div key={c.id} className="surface-card rounded-lg border border-border p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    {c.estrategico && <Star className="h-3.5 w-3.5 fill-primary text-primary" />}
                    <span className="truncate font-medium">{c.nome}</span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {[c.bairro, c.cidade].filter(Boolean).join(" · ") || "Sem endereço"}
                  </p>
                </div>
                <span className="shrink-0 rounded bg-card px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                  {ORIGENS.find((o) => o.id === c.origem)?.nome ?? c.origem}
                </span>
              </div>

              <div className="mt-3 space-y-0.5 text-xs text-muted-foreground">
                {c.telefone && <div>{c.telefone}</div>}
                {c.email && <div className="truncate">{c.email}</div>}
                {c.documento && <div>{c.documento}</div>}
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                <Button size="sm" variant="outline" asChild>
                  <Link to={`/app/clientes/${c.id}`}><ClipboardList className="mr-1 h-3.5 w-3.5" /> Briefing</Link>
                </Button>
                {(c.whatsapp || c.telefone) && (
                  <Button size="sm" variant="outline" asChild>
                    <a target="_blank" rel="noreferrer"
                       href={`https://wa.me/55${(c.whatsapp || c.telefone).replace(/\D/g, "")}`}>
                      <MessageCircle className="mr-1 h-3.5 w-3.5" /> WhatsApp
                    </a>
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => setEdit(c)}><Pencil className="h-3.5 w-3.5" /></Button>
                <Button size="sm" variant="ghost" onClick={() => remover(c)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle>{edit?.id ? "Editar cliente" : "Novo cliente"}</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">{campo("nome", "Nome / razão social")}</div>
            {campo("documento", "CPF / CNPJ")}
            {campo("email", "E-mail", "email")}
            {campo("telefone", "Telefone")}
            {campo("whatsapp", "WhatsApp")}
            <div className="sm:col-span-2">{campo("endereco", "Endereço")}</div>
            {campo("bairro", "Bairro")}
            {campo("cidade", "Cidade")}
            {campo("cep", "CEP")}
            <div>
              <Label>Origem</Label>
              <Select value={edit?.origem ?? "whatsapp"} onValueChange={(v) => setEdit((c) => ({ ...c, origem: v }))}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ORIGENS.map((o) => <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label>Observações</Label>
              <Textarea className="mt-1.5" rows={3} value={edit?.observacoes ?? ""}
                        onChange={(e) => setEdit((c) => ({ ...c, observacoes: e.target.value }))} />
            </div>
            <button
              type="button"
              onClick={() => setEdit((c) => ({ ...c, estrategico: !c?.estrategico }))}
              className={cn("flex items-center gap-2 rounded border border-border px-3 py-2 text-sm sm:col-span-2",
                edit?.estrategico ? "border-primary bg-primary/10" : "")}
            >
              <Star className={cn("h-4 w-4", edit?.estrategico && "fill-primary text-primary")} />
              Cliente estratégico (ganha prioridade nas ordens)
            </button>
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
