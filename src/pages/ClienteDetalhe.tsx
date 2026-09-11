import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Briefing, Cliente, listarBriefings, obterCliente, salvarBriefing, excluirBriefing } from "@/lib/gestao";
import { TIPOS_SERVICO, perguntasVisiveis } from "@/lib/briefing";
import { listarProjetos, formatarBRL } from "@/lib/storage";

export default function ClienteDetalhe() {
  const { id = "" } = useParams();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [briefings, setBriefings] = useState<Briefing[]>([]);
  const [rascunho, setRascunho] = useState<Partial<Briefing> | null>(null);

  const recarregar = () => listarBriefings(id).then(setBriefings).catch(() => undefined);

  useEffect(() => {
    void obterCliente(id).then(setCliente);
    void recarregar();
  }, [id]);

  const projetos = listarProjetos().filter((p) => p.cliente_id === id || (cliente && p.cliente === cliente.nome));

  const respostas = (rascunho?.respostas ?? {}) as Record<string, string>;
  const tipo = rascunho?.tipo_servico ?? "portao";
  const perguntas = perguntasVisiveis(tipo, respostas);

  const responder = (k: string, v: string) =>
    setRascunho((b) => ({ ...b, respostas: { ...(b?.respostas ?? {}), [k]: v } }));

  const salvar = async () => {
    try {
      await salvarBriefing({ ...rascunho, cliente_id: id, tipo_servico: tipo });
      setRascunho(null);
      await recarregar();
      toast.success("Briefing salvo");
    } catch { toast.error("Não foi possível salvar o briefing"); }
  };

  if (!cliente) return <div className="container py-10 text-sm text-muted-foreground">Carregando…</div>;

  return (
    <div className="container space-y-4 py-6">
      <Button variant="soft" size="sm" asChild><Link to="/app/clientes"><ArrowLeft className="mr-2 h-4 w-4" /> Clientes</Link></Button>

      <div className="surface-card rounded-lg border border-border p-4">
        <h1 className="font-display text-xl">{cliente.nome}</h1>
        <div className="mt-2 grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
          <span>{cliente.documento || "Sem documento"}</span>
          <span>{cliente.telefone || "Sem telefone"}</span>
          <span>{cliente.email || "Sem e-mail"}</span>
          <span>{[cliente.endereco, cliente.bairro, cliente.cidade].filter(Boolean).join(", ") || "Sem endereço"}</span>
        </div>
        {cliente.observacoes && <p className="mt-2 text-sm">{cliente.observacoes}</p>}
      </div>

      {/* Briefings */}
      <div className="surface-card rounded-lg border border-border p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-sm">Briefings</h2>
          {!rascunho && (
            <Button size="sm" className="bg-gradient-orange text-primary-foreground"
                    onClick={() => setRascunho({ tipo_servico: "portao", respostas: {}, observacoes: "" })}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Novo briefing
            </Button>
          )}
        </div>

        {rascunho && (
          <div className="space-y-4 rounded-lg border border-primary/40 bg-primary/5 p-4">
            <div>
              <Label>Tipo de serviço</Label>
              <Select value={tipo} onValueChange={(v) => setRascunho((b) => ({ ...b, tipo_servico: v, respostas: {} }))}>
                <SelectTrigger className="mt-1.5 sm:max-w-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPOS_SERVICO.map((t) => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {perguntas.map((p) => (
                <div key={p.id}>
                  <Label>{p.label}</Label>
                  {p.texto ? (
                    <Input className="mt-1.5" value={respostas[p.id] ?? ""} onChange={(e) => responder(p.id, e.target.value)} />
                  ) : (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {p.opcoes.map((o) => (
                        <button key={o} type="button" onClick={() => responder(p.id, o)}
                          className={cn("rounded border px-3 py-1.5 text-sm transition",
                            respostas[p.id] === o ? "border-primary bg-primary/15" : "border-border hover:border-primary/40")}>
                          {o}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div>
              <Label>Observações</Label>
              <Textarea className="mt-1.5" rows={3} value={rascunho.observacoes ?? ""}
                        onChange={(e) => setRascunho((b) => ({ ...b, observacoes: e.target.value }))} />
            </div>

            <div className="flex gap-2">
              <Button className="bg-gradient-orange text-primary-foreground" onClick={salvar}>Salvar briefing</Button>
              <Button variant="outline" onClick={() => setRascunho(null)}>Cancelar</Button>
            </div>
          </div>
        )}

        {briefings.length === 0 && !rascunho && (
          <p className="text-sm text-muted-foreground">Nenhum briefing registrado para este cliente.</p>
        )}

        {briefings.map((b) => {
          const r = (b.respostas ?? {}) as Record<string, string>;
          return (
            <div key={b.id} className="rounded border border-border p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">
                  {TIPOS_SERVICO.find((t) => t.id === b.tipo_servico)?.nome ?? b.tipo_servico}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {new Date(b.created_at).toLocaleDateString("pt-BR")}
                  </span>
                  <Button size="sm" variant="soft" onClick={async () => { await excluirBriefing(b.id); await recarregar(); }}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
              <div className="mt-2 grid gap-x-4 gap-y-1 text-xs text-muted-foreground sm:grid-cols-2">
                {perguntasVisiveis(b.tipo_servico, r).filter((p) => r[p.id]).map((p) => (
                  <span key={p.id}><span className="text-foreground">{p.label}:</span> {r[p.id]}</span>
                ))}
              </div>
              {b.observacoes && <p className="mt-2 text-xs">{b.observacoes}</p>}
            </div>
          );
        })}
      </div>

      {/* Histórico */}
      <div className="surface-card rounded-lg border border-border p-4">
        <h2 className="mb-2 font-display text-sm">Orçamentos e ordens deste cliente</h2>
        {projetos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum orçamento ainda.</p>
        ) : (
          <div className="space-y-1.5">
            {projetos.map((p) => (
              <Link key={p.id} to={`/app/projeto/${p.id}`}
                    className="flex items-center justify-between rounded border border-border px-3 py-2 text-sm hover:border-primary/50">
                <span className="truncate">{p.nome}</span>
                <span className="text-muted-foreground">{formatarBRL(p.total)}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
