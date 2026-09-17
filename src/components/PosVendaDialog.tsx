// Pós-venda: checklist da vendedora + ocorrências antes de concluir a ordem.
import { useCallback, useEffect, useState } from "react";
import { ClipboardCheck, Plus, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { obterProjeto, salvarProjeto, ProjetoLocal } from "@/lib/storage";
import { listarOcorrencias, criarOcorrencia, resolverOcorrencia, Ocorrencia } from "@/lib/ocorrencias";

/** Checklist completo = as três respostas positivas. */
export const posVendaLiberada = (p: ProjetoLocal | undefined): boolean =>
  !!p && p.posvenda.instalacao_ok && p.posvenda.cliente_satisfeito && p.posvenda.sem_problemas;

const PERGUNTAS = [
  { campo: "instalacao_ok", texto: "A instalação ficou conforme o combinado?" },
  { campo: "cliente_satisfeito", texto: "O cliente ficou satisfeito?" },
  { campo: "sem_problemas", texto: "Não surgiu nenhum problema?" },
] as const;

export function PosVendaDialog({ projetoId }: { projetoId: string }) {
  const { toast } = useToast();
  const [aberto, setAberto] = useState(false);
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [ocorrenciasOk, setOcorrenciasOk] = useState(true);
  const [descricao, setDescricao] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [prazo, setPrazo] = useState("");
  const [resolucao, setResolucao] = useState<Record<string, string>>({});
  const [retorno, setRetorno] = useState("");
  const [salvando, setSalvando] = useState(false);

  const projeto = obterProjeto(projetoId);

  const carregar = useCallback(async () => {
    try {
      setOcorrencias(await listarOcorrencias(projetoId));
      setOcorrenciasOk(true);
    } catch {
      setOcorrenciasOk(false);
    }
  }, [projetoId]);

  useEffect(() => {
    if (aberto) {
      void carregar();
      setRetorno(obterProjeto(projetoId)?.posvenda.retorno ?? "");
    }
  }, [aberto, carregar, projetoId]);

  if (!projeto) return null;
  const pv = projeto.posvenda;

  const marcar = (campo: (typeof PERGUNTAS)[number]["campo"], valor: boolean) => {
    const posvenda = { ...pv, [campo]: valor };
    posvenda.concluido_em =
      posvenda.instalacao_ok && posvenda.cliente_satisfeito && posvenda.sem_problemas
        ? new Date().toISOString()
        : null;
    salvarProjeto({ ...projeto, posvenda });
  };

  const salvarRetorno = () => {
    const atual = obterProjeto(projetoId);
    if (!atual || atual.posvenda.retorno === retorno) return;
    salvarProjeto({ ...atual, posvenda: { ...atual.posvenda, retorno } });
    toast({ title: "Retorno salvo." });
  };

  const abrirOcorrencia = async () => {
    if (!descricao.trim()) {
      toast({ title: "Descreva o problema", variant: "destructive" });
      return;
    }
    setSalvando(true);
    try {
      await criarOcorrencia(projetoId, {
        descricao: descricao.trim(),
        responsavel_nome: responsavel.trim(),
        prazo: prazo || null,
      });
      setDescricao("");
      setResponsavel("");
      setPrazo("");
      await carregar();
      toast({ title: "Ocorrência registrada." });
    } catch (e) {
      toast({ title: "Não foi possível registrar", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSalvando(false);
    }
  };

  const resolver = async (o: Ocorrencia) => {
    const texto = (resolucao[o.id] ?? "").trim();
    if (!texto) {
      toast({ title: "Descreva como foi resolvido", variant: "destructive" });
      return;
    }
    try {
      await resolverOcorrencia(o.id, texto);
      await carregar();
      toast({ title: "Ocorrência resolvida." });
    } catch (e) {
      toast({ title: "Não foi possível resolver", description: (e as Error).message, variant: "destructive" });
    }
  };

  const abertas = ocorrencias.filter((o) => o.status === "aberta");

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        <Button size="sm" variant="soft" className="flex-1">
          <ClipboardCheck className="mr-1 h-3.5 w-3.5" /> Pós-venda
          {abertas.length > 0 ? ` (${abertas.length})` : ""}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pós-venda — {projeto.nome}</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          {PERGUNTAS.map((p) => (
            <div key={p.campo} className="flex items-center justify-between gap-3 rounded border border-border p-3">
              <p className="text-sm">{p.texto}</p>
              <div className="flex shrink-0 gap-1">
                <Button size="sm" variant={pv[p.campo] ? "default" : "soft"} onClick={() => marcar(p.campo, true)}>
                  Sim
                </Button>
                <Button size="sm" variant={!pv[p.campo] ? "dangerOutline" : "soft"} onClick={() => marcar(p.campo, false)}>
                  Não
                </Button>
              </div>
            </div>
          ))}
          <div>
            <Label>Retorno do cliente</Label>
            <Textarea
              rows={2}
              maxLength={2000}
              placeholder="O que o cliente falou?"
              value={retorno}
              onChange={(e) => setRetorno(e.target.value)}
              onBlur={salvarRetorno}
            />
          </div>
          {posVendaLiberada(projeto) ? (
            <p className="flex items-center gap-2 rounded border border-emerald-500/40 bg-emerald-500/10 p-2 text-sm text-emerald-500">
              <CheckCircle2 className="h-4 w-4" /> Checklist completo — a ordem pode ir para Pronto.
            </p>
          ) : (
            <p className="flex items-center gap-2 rounded border border-amber-500/40 bg-amber-500/10 p-2 text-sm text-amber-500">
              <AlertTriangle className="h-4 w-4" /> Responda as três perguntas com “Sim” para liberar o Pronto.
            </p>
          )}
        </div>

        <div className="space-y-3 border-t border-border pt-3">
          <h3 className="text-sm font-semibold">Ocorrências {abertas.length > 0 ? `— ${abertas.length} aberta(s)` : ""}</h3>

          {!ocorrenciasOk ? (
            <p className="text-sm text-muted-foreground">Sem acesso às ocorrências neste perfil.</p>
          ) : (
            <>
              {ocorrencias.map((o) => (
                <div key={o.id} className={`space-y-2 rounded border p-3 ${o.status === "aberta" ? "border-destructive/40 bg-destructive/5" : "border-border"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium">{o.descricao}</p>
                    <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-semibold ${o.status === "aberta" ? "bg-destructive text-destructive-foreground" : "bg-emerald-500/20 text-emerald-500"}`}>
                      {o.status === "aberta" ? "Aberta" : "Resolvida"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {o.responsavel_nome ? `Responsável: ${o.responsavel_nome} · ` : ""}
                    {o.prazo ? `Prazo: ${new Date(o.prazo + "T00:00:00").toLocaleDateString("pt-BR")} · ` : ""}
                    por {o.criado_por_nome} em {new Date(o.created_at).toLocaleDateString("pt-BR")}
                  </p>
                  {o.status === "aberta" ? (
                    <div className="flex gap-2">
                      <Input
                        maxLength={1000}
                        placeholder="Como foi resolvido?"
                        value={resolucao[o.id] ?? ""}
                        onChange={(e) => setResolucao((r) => ({ ...r, [o.id]: e.target.value }))}
                      />
                      <Button size="sm" onClick={() => void resolver(o)}>Resolver</Button>
                    </div>
                  ) : (
                    <p className="text-xs text-emerald-500">Resolução: {o.resolucao}</p>
                  )}
                </div>
              ))}

              <div className="space-y-2 rounded border border-dashed border-border p-3">
                <Label>Nova ocorrência</Label>
                <Textarea rows={2} maxLength={2000} placeholder="Descreva o problema relatado"
                  value={descricao} onChange={(e) => setDescricao(e.target.value)} />
                <div className="form-grid">
                  <div className="form-field-long"><Input maxLength={100} placeholder="Responsável" value={responsavel} onChange={(e) => setResponsavel(e.target.value)} /></div>
                  <div className="form-field-date"><Input type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)} /></div>
                </div>
                <Button size="sm" onClick={() => void abrirOcorrencia()} disabled={salvando}>
                  {salvando ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Plus className="mr-1 h-4 w-4" />}
                  Registrar ocorrência
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
