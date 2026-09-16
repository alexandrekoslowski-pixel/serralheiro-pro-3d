import { useEffect, useState } from "react";
import { Plus, Trash2, ShieldCheck, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MembroEquipe, PAPEIS, Papel, listarEquipe, definirPapel, atualizarMembro, atualizarEmailMembro, removerMembro, ContaNaoEncontrada, EmailEmUso } from "@/lib/gestao";
import { renomearVendedor } from "@/lib/storage";
import { useSessao } from "@/lib/sessao";
import { emailOpcionalSchema, primeiraMensagem } from "@/lib/validacao";

export default function Equipe() {
  const { session, papel } = useSessao();
  const [equipe, setEquipe] = useState<MembroEquipe[]>([]);
  const [novo, setNovo] = useState<{ email: string; nome: string; role: Papel } | null>(null);
  const [edicao, setEdicao] = useState<{ id: string; nome: string; role: Papel; email: string; emailOriginal: string } | null>(null);

  const recarregar = () => listarEquipe().then(setEquipe).catch(() => toast.error("Não foi possível carregar a equipe"));
  useEffect(() => { void recarregar(); }, []);

  const salvar = async () => {
    if (!novo?.nome.trim()) { toast.error("Informe o nome da pessoa"); return; }
    if (!novo?.email.trim()) { toast.error("Informe o e-mail da pessoa"); return; }
    const mensagem = primeiraMensagem(emailOpcionalSchema.safeParse(novo.email));
    if (mensagem) { toast.error(mensagem); return; }
    try {
      await definirPapel({ ...novo, nome: novo.nome.trim(), email: novo.email.trim().toLowerCase() });
      setNovo(null); await recarregar(); toast.success("Acesso liberado");
    } catch (e) {
      if (e instanceof ContaNaoEncontrada) {
        toast.error("Essa pessoa ainda não criou a conta. Peça para ela entrar com e-mail e senha e tente de novo.");
      } else {
        toast.error("Não foi possível salvar o acesso");
      }
    }
  };

  const salvarEdicao = async () => {
    if (!edicao) return;
    if (!edicao.nome.trim()) { toast.error("Informe o nome"); return; }
    const novoEmail = edicao.email.trim().toLowerCase();
    const trocouEmail = novoEmail !== edicao.emailOriginal.trim().toLowerCase();
    if (trocouEmail) {
      if (!novoEmail) { toast.error("Informe o e-mail"); return; }
      const mensagem = primeiraMensagem(emailOpcionalSchema.safeParse(novoEmail));
      if (mensagem) { toast.error(mensagem); return; }
    }
    try {
      const antigo = equipe.find(m => m.id === edicao.id)?.nome || '';
      await atualizarMembro(edicao.id, { nome: edicao.nome.trim(), role: edicao.role });
      if (antigo && antigo !== edicao.nome.trim()) renomearVendedor(antigo, edicao.nome.trim());
      if (trocouEmail) await atualizarEmailMembro(edicao.id, novoEmail);
      setEdicao(null); await recarregar();
      toast.success(trocouEmail ? "Dados atualizados. Ela passa a entrar com o novo e-mail." : "Nome atualizado");
    } catch (e) {
      if (e instanceof EmailEmUso) toast.error("Esse e-mail já está em uso por outra conta");
      else toast.error("Não foi possível salvar");
    }
  };

  if (papel !== "gestor") {
    return <div className="container py-10 text-sm text-muted-foreground">Somente o gestor pode gerenciar a equipe.</div>;
  }

  return (
    <div className="container space-y-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl">Equipe e acessos</h1>
          <p className="text-sm text-muted-foreground">Cada pessoa entra com a própria conta e vê só o que precisa.</p>
        </div>
        <Button className="bg-gradient-orange text-primary-foreground shadow-orange"
                onClick={() => setNovo({ email: "", nome: "", role: "vendedora" })}>
          <Plus className="mr-2 h-4 w-4" /> Liberar acesso
        </Button>
      </div>

      <div className="surface-card rounded-lg border border-border p-4">
        <p className="text-xs text-muted-foreground">
          A pessoa cria a conta dela na tela de entrada com e-mail e senha. Depois é só informar aqui o nome, o e-mail
          que ela usou e escolher o papel.
        </p>
      </div>

      <div className="space-y-2">
        {equipe.map((m) => (
          <div key={m.id} className="surface-card flex items-center justify-between gap-3 rounded-lg border border-border p-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ShieldCheck className="h-4 w-4 text-primary" />
                {m.nome || "Sem nome"}
                {m.user_id === session?.user?.id && <span className="text-xs text-muted-foreground">(você)</span>}
              </div>
              <div className="truncate text-xs text-muted-foreground">{m.email || "e-mail não informado"}</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-card px-2 py-1 text-xs">{PAPEIS.find((p) => p.id === m.role)?.nome}</span>
              <Button size="sm" variant="soft" onClick={() => setEdicao({ id: m.id, nome: m.nome, role: m.role, email: m.email ?? "", emailOriginal: m.email ?? "" })}>
                <Pencil className="mr-1 h-3.5 w-3.5" /> Editar
              </Button>
              {m.user_id !== session?.user?.id && (
                <Button size="sm" variant="dangerOutline" onClick={async () => { await removerMembro(m.id); await recarregar(); }}>
                  <Trash2 className="mr-1 h-3.5 w-3.5" /> Remover
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!edicao} onOpenChange={(o) => !o && setEdicao(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar pessoa</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nome da pessoa</Label>
              <Input className="mt-1.5" maxLength={100} value={edicao?.nome ?? ""} onChange={(e) => setEdicao((n) => n && { ...n, nome: e.target.value })} />
            </div>
            <div>
              <Label>Papel</Label>
              <Select value={edicao?.role ?? "vendedora"} onValueChange={(v) => setEdicao((n) => n && { ...n, role: v as Papel })}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAPEIS.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome} — {p.descricao}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEdicao(null)}>Cancelar</Button>
            <Button className="bg-gradient-orange text-primary-foreground" onClick={salvarEdicao}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!novo} onOpenChange={(o) => !o && setNovo(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Liberar acesso</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nome da pessoa</Label>
              <Input className="mt-1.5" maxLength={100} value={novo?.nome ?? ""} onChange={(e) => setNovo((n) => n && { ...n, nome: e.target.value })} />
            </div>
            <div>
              <Label>E-mail da conta</Label>
              <Input className="mt-1.5" type="email" placeholder="nome@email.com" value={novo?.email ?? ""}
                     onChange={(e) => setNovo((n) => n && { ...n, email: e.target.value })} />
              <p className="mt-1 text-xs text-muted-foreground">Use o mesmo e-mail com que a pessoa entra no sistema.</p>
            </div>
            <div>
              <Label>Papel</Label>
              <Select value={novo?.role ?? "vendedora"} onValueChange={(v) => setNovo((n) => n && { ...n, role: v as Papel })}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAPEIS.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome} — {p.descricao}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNovo(null)}>Cancelar</Button>
            <Button className="bg-gradient-orange text-primary-foreground" onClick={salvar}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
