import { useState } from "react";
import { ExternalLink, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  adicionarPagamento,
  formatarBRL,
  listarPagamentos,
  listarProjetos,
  registrarComprovanteLocal,
  removerPagamento,
  salvarProjeto,

  type ProjetoLocal,
} from "@/lib/storage";
import { STATUS_LABEL, dataISO, proximoStatus } from "@/lib/ordens";
import { numeroMascarado } from "@/lib/mascaras";
import { anexarComprovante, abrirComprovante } from "@/lib/comprovantes";
import { useDados } from "@/hooks/useDados";
import { CampoArquivo } from "@/components/CampoArquivo";

const FORMAS = ["pix", "dinheiro", "cartão", "boleto", "transferência"];

export function DialogOrdemFinanceiro({ projeto, onClose, foco }: { projeto: ProjetoLocal | null; onClose: () => void; foco?: "comprovante" }) {
  useDados();
  const [valor, setValor] = useState("");
  const [data, setData] = useState(dataISO(new Date()));
  const [forma, setForma] = useState("pix");
  const [obs, setObs] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);

  if (!projeto) return null;
  const atual = listarProjetos().find((p) => p.id === projeto.id) ?? projeto;
  const pagos = listarPagamentos(atual.id);
  const recebido = pagos.reduce((s, p) => s + p.valor, 0);
  const saldo = (atual.valor_faturado || 0) - recebido;

  const lancar = async () => {
    const v = numeroMascarado(valor);
    if (!v || v <= 0) { toast.error("Informe o valor recebido"); return; }
    setEnviando(true);
    try {
      const pagamento = await adicionarPagamento({ projeto_id: atual.id, data, valor: v, forma, observacao: obs, comprovante_caminho: null, comprovante_nome: null, comprovante_tipo: null, comprovante_enviado_em: null });
      if (arquivo) {
        const caminho = await anexarComprovante(pagamento.id, atual.id, arquivo);
        registrarComprovanteLocal(pagamento.id, caminho, arquivo.name, arquivo.type);
      }
      setValor(""); setObs(""); setArquivo(null);
      toast.success(arquivo ? "Pagamento lançado com comprovante" : "Pagamento lançado");
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível lançar o pagamento");
    } finally {
      setEnviando(false);
    }
  };

  const anexarEm = async (pagamentoId: string, f: File) => {
    try {
      const caminho = await anexarComprovante(pagamentoId, atual.id, f);
      registrarComprovanteLocal(pagamentoId, caminho, f.name, f.type);
      toast.success("Comprovante anexado");
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível anexar o comprovante");
    }
  };

  const avancar = proximoStatus(atual.status);
  const blocoSituacao = (
    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <Label>Situação</Label>
        <div className="flex h-10 items-center rounded-md border border-border bg-muted/40 px-3 text-sm">
          {STATUS_LABEL[atual.status]}
        </div>
        {avancar && (
          <Button
            size="sm"
            variant="soft"
            className="mt-2 w-full"
            onClick={() => salvarProjeto({ ...atual, status: avancar })}
          >
            Marcar como {STATUS_LABEL[avancar].toLowerCase()}
          </Button>
        )}
      </div>
      <div>
        <Label>Prazo de entrega</Label>
        <Input type="date" value={atual.prazo_entrega ?? ""} onChange={(e) => salvarProjeto({ ...atual, prazo_entrega: e.target.value || null })} />
      </div>
      <div><Label>Valor orçado</Label><Input value={formatarBRL(atual.total)} readOnly /></div>
      <div>
        <Label>Valor faturado</Label>
        <Input mask="moeda" value={String(atual.valor_faturado || 0).replace(".", ",")} onChange={(e) => salvarProjeto({ ...atual, valor_faturado: numeroMascarado(e.target.value) })} />
      </div>
    </div>
  );

  const blocoResumo = (
    <div className="rounded-lg border border-border p-3 text-sm">
      Recebido <strong>{formatarBRL(recebido)}</strong> · Em aberto{" "}
      <strong className={saldo > 0 ? "text-amber-500" : "text-emerald-500"}>{formatarBRL(saldo)}</strong>
    </div>
  );

  const blocoPagamento = (
    <div className="space-y-3 rounded-xl border border-border p-3">
      <div>
        <p className="font-display text-sm font-semibold">Registrar entrada e comprovante</p>
        <p className="text-xs text-muted-foreground">Informe o valor recebido, anexe a foto ou o PDF do comprovante e clique em Lançar.</p>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <div><Label className="text-xs">Data</Label><Input type="date" value={data} onChange={(e) => setData(e.target.value)} /></div>
        <div><Label className="text-xs">Valor recebido</Label><Input mask="moeda" placeholder="0,00" value={valor} onChange={(e) => setValor(e.target.value)} /></div>
        <div>
          <Label className="text-xs">Forma</Label>
          <Select value={forma} onValueChange={setForma}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{FORMAS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <Input maxLength={500} placeholder="Observação (opcional)" value={obs} onChange={(e) => setObs(e.target.value)} />
      <CampoArquivo valor={arquivo} onChange={setArquivo} ajuda="Toque para escolher a foto ou o PDF do comprovante (até 10 MB)" />
      <Button onClick={lancar} disabled={enviando} className="w-full bg-gradient-orange text-primary-foreground">
        {enviando ? "Enviando..." : arquivo ? "Lançar pagamento e enviar comprovante" : "Lançar pagamento"}
      </Button>
    </div>
  );

  const blocoLista = pagos.length > 0 && (
    <div className="space-y-1 text-sm">
      {pagos.map((p) => (
        <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-border px-3 py-1.5">
          <span>{new Date(p.data + "T00:00:00").toLocaleDateString("pt-BR")} · {p.forma}{p.observacao ? ` · ${p.observacao}` : ""}</span>
          <span className="flex items-center gap-2">
            <strong>{formatarBRL(p.valor)}</strong>
            {p.comprovante_caminho ? (
              <Button size="sm" variant="outline" onClick={() => void abrirComprovante(p.comprovante_caminho ?? "")}><ExternalLink className="mr-1 h-3.5 w-3.5" /> Ver comprovante</Button>
            ) : (
              <label className="inline-flex min-h-9 cursor-pointer items-center rounded-md border border-primary/50 bg-primary/10 px-3 text-xs font-semibold text-primary hover:bg-primary/20">
                <Upload className="mr-1 h-3.5 w-3.5" /> Anexar comprovante
                <input className="sr-only" type="file" accept="image/*,application/pdf" onChange={(e) => { const f = e.target.files?.[0]; if (f) void anexarEm(p.id, f); }} />
              </label>
            )}
            <Button size="sm" variant="dangerOutline" onClick={() => removerPagamento(p.id)}>Excluir</Button>
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-display">{atual.nome}</DialogTitle></DialogHeader>
        {foco === "comprovante" ? (
          <>{blocoPagamento}{blocoLista}{blocoResumo}</>
        ) : (
          <>{blocoSituacao}{blocoResumo}{blocoPagamento}{blocoLista}</>
        )}
        <DialogFooter><Button variant="outline" onClick={onClose}>Fechar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}