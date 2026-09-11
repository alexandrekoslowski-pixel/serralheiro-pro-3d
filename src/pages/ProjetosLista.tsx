import { useMemo, useState } from "react";
import { FIXACAO_PADRAO, FIXACAO_LADOS_PADRAO } from "@/lib/fixacao";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Copy, Trash2, FolderOpen, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  ProjetoLocal, deletarProjeto, duplicarProjeto, gerarId,
  listarProjetos, salvarProjeto, formatarBRL,
} from "@/lib/storage";
import { TIPOLOGIAS, TipologiaId, tipologiaPorId } from "@/lib/tipologias";
import { STATUS_LABEL } from "@/lib/ordens";
import { useDados } from "@/hooks/useDados";
import { cm } from "@/lib/medidas";

export default function ProjetosLista() {
  const navigate = useNavigate();
  useDados();
  const projetos = listarProjetos();
  const [busca, setBusca] = useState("");
  const [novoNome, setNovoNome] = useState("");
  const [novoCliente, setNovoCliente] = useState("");
  const [novoTipo, setNovoTipo] = useState<TipologiaId>("portao_correr");
  const [dialogOpen, setDialogOpen] = useState(false);

  const filtrados = useMemo(() => {
    const q = busca.toLowerCase().trim();
    return projetos.filter(
      (p) => !q || p.nome.toLowerCase().includes(q) || p.cliente.toLowerCase().includes(q),
    );
  }, [projetos, busca]);

  const criar = () => {
    const tip = tipologiaPorId(novoTipo);
    const novo: ProjetoLocal = {
      id: gerarId(),
      nome: novoNome.trim() || "Novo orçamento",
      cliente: novoCliente.trim(),
      vendedora: "",
      cliente_id: null,
      briefing_id: null,
      responsavel_id: null,
      prioridade_manual: null,
      cliente_documento: "",
      cliente_endereco: "",
      cliente_bairro: "",
      cliente_cidade: "",
      cliente_cep: "",
      cliente_telefone: "",
      cliente_email: "",
      local_instalacao: "",
      prazo_dias_uteis: null,
      servicos_valor: null,
      frete_valor: null,
      observacoes_proposta: "",
      tipologia: novoTipo,
      largura_mm: tip.larguraDefault,
      altura_mm: tip.alturaDefault,
      cor: "branco",
      maoObraPct: 30,
      margemPct: 25,
      descontoGeralPct: 0,
      pecas: [{
        id: gerarId(),
        nome: "Peça 1",
        tipologia: novoTipo,
        largura_mm: tip.larguraDefault,
        altura_mm: tip.alturaDefault,
        cor: "branco",
        fixacao: FIXACAO_PADRAO,
        fixacaoLados: FIXACAO_LADOS_PADRAO,
      }],
      overrides: {},
      extras: [],
      total: 0,
      status: "orcamento",
      etapa: "fila",
      etapa_em: new Date().toISOString(),
      prazo_entrega: null,
      valor_faturado: 0,
      aprovado_em: null,
      entregue_em: null,
      faturado_em: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    salvarProjeto(novo);
    setDialogOpen(false);
    setNovoNome(""); setNovoCliente("");
    navigate(`/app/projeto/${novo.id}`);
  };

  const duplicar = (id: string) => {
    if (duplicarProjeto(id)) toast.success("Projeto duplicado");
  };

  const remover = (id: string) => {
    deletarProjeto(id);
    toast.success("Orçamento excluído");
  };

  return (
    <section className="container py-6 md:py-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-2xl md:text-3xl">Orçamentos</h1>
          <p className="text-sm text-muted-foreground">Tudo salvo localmente neste navegador.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-orange text-primary-foreground shadow-orange hover:opacity-90">
              <Plus className="mr-2 h-4 w-4" /> Novo orçamento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">Novo orçamento</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Nome do orçamento</Label>
                <Input value={novoNome} onChange={(e) => setNovoNome(e.target.value)} placeholder="Ex.: Portão D. Maria" />
              </div>
              <div>
                <Label>Cliente</Label>
                <Input value={novoCliente} onChange={(e) => setNovoCliente(e.target.value)} placeholder="Nome ou referência" />
              </div>
              <div>
                <Label>Tipologia</Label>
                <Select value={novoTipo} onValueChange={(v) => setNovoTipo(v as TipologiaId)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIPOLOGIAS.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={criar} className="bg-gradient-orange text-primary-foreground">Criar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-6 relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome ou cliente" className="pl-9" />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtrados.length === 0 && (
          <div className="surface-card col-span-full grid place-items-center rounded-lg border border-dashed border-border p-12 text-center">
            <FolderOpen className="h-8 w-8 text-muted-foreground" />
            <p className="mt-3 font-display">Nenhum orçamento ainda</p>
            <p className="mt-1 text-sm text-muted-foreground">Clique em "Novo orçamento" para começar.</p>
          </div>
        )}
        {filtrados.map((p) => {
          const tip = tipologiaPorId(p.tipologia);
          return (
            <div key={p.id} className="surface-card rounded-lg border border-border p-4 transition hover:border-primary/50">
              <Link to={`/app/projeto/${p.id}`} className="block">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-display text-sm truncate">{p.nome}</h3>
                    <p className="text-xs text-muted-foreground truncate">{p.cliente || "Sem cliente"}</p>
                  </div>
                  <span className="rounded bg-card px-2 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">
                    {tip.nome.split(" ")[0]}
                  </span>
                </div>
                <div className="mt-3 text-xs text-muted-foreground">
                  {cm(p.largura_mm)} × {cm(p.altura_mm)} cm · {p.cor} · {STATUS_LABEL[p.status]}
                </div>
                <div className="mt-3 flex items-end justify-between">
                  <div>
                    <div className="text-[10px] uppercase text-muted-foreground">Total</div>
                    <div className="font-display text-lg text-gradient-orange">{formatarBRL(p.total)}</div>
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {new Date(p.updated_at).toLocaleDateString("pt-BR")}
                  </div>
                </div>
              </Link>
              <div className="mt-3 flex gap-1 border-t border-border pt-3">
                <Button size="sm" variant="ghost" onClick={() => duplicar(p.id)}>
                  <Copy className="mr-1 h-3.5 w-3.5" /> Duplicar
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                      <Trash2 className="mr-1 h-3.5 w-3.5" /> Excluir
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir orçamento?</AlertDialogTitle>
                      <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => remover(p.id)}>Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
