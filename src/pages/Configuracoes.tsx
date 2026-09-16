import { useEffect, useState } from "react";
import { Building2, Save, Plus, Trash2, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { obterEmpresa, salvarEmpresa, DadosEmpresa } from "@/lib/storage";
import { numeroMascarado } from "@/lib/mascaras";
import { UNIDADE_LABEL, politicaComValores } from "@/lib/politicaPrecos";
import { documentoOpcionalSchema, emailOpcionalSchema, primeiraMensagem, telefoneOpcionalSchema } from "@/lib/validacao";

export default function Configuracoes() {
  const navigate = useNavigate();
  const [empresa, setEmpresa] = useState<DadosEmpresa>(obterEmpresa());
  const [buscaPreco, setBuscaPreco] = useState("");
  const politicaAtual = politicaComValores(empresa.politicaValores);

  useEffect(() => {
    setEmpresa(obterEmpresa());
  }, []);

  const salvarTudo = () => {
    const campos = [documentoOpcionalSchema.safeParse(empresa.cnpj), telefoneOpcionalSchema.safeParse(empresa.telefone), emailOpcionalSchema.safeParse(empresa.email)];
    const mensagem = campos.map(primeiraMensagem).find(Boolean);
    if (mensagem) { toast.error(mensagem); return; }
    if (!empresa.nome.trim()) { toast.error("Informe o nome da empresa"); return; }
    const empresaLimpa = { ...empresa, nome: empresa.nome.trim(), email: empresa.email.trim().toLowerCase() };
    salvarEmpresa(empresaLimpa);
    toast.success("Configurações salvas");
  };

  return (
    <section className="container py-6 md:py-10 space-y-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-2xl md:text-3xl flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" /> Empresa & Catálogo
          </h1>
          <p className="text-sm text-muted-foreground">Esses dados aparecem nos PDFs e influenciam os cálculos.</p>
        </div>
        <Button onClick={salvarTudo} className="bg-gradient-orange text-primary-foreground shadow-orange">
          <Save className="mr-2 h-4 w-4" /> Salvar
        </Button>
      </div>

      {/* Empresa */}
      <div className="surface-card rounded-lg border border-border p-5">
        <h2 className="font-display text-lg mb-4">Dados da empresa</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div><Label>Nome</Label><Input value={empresa.nome} onChange={(e) => setEmpresa({ ...empresa, nome: e.target.value })} /></div>
          <div><Label>CNPJ</Label><Input mask="cpfCnpj" value={empresa.cnpj} onChange={(e) => setEmpresa({ ...empresa, cnpj: e.target.value })} /></div>
          <div><Label>Telefone</Label><Input type="tel" mask="telefone" value={empresa.telefone} onChange={(e) => setEmpresa({ ...empresa, telefone: e.target.value })} /></div>
          <div><Label>E-mail</Label><Input type="email" value={empresa.email} onChange={(e) => setEmpresa({ ...empresa, email: e.target.value })} /></div>
          <div className="md:col-span-2"><Label>Endereço</Label><Input value={empresa.endereco} onChange={(e) => setEmpresa({ ...empresa, endereco: e.target.value })} /></div>
        </div>


        <h2 className="font-display text-lg mt-6 mb-2">Empresas de pintura</h2>
        <p className="text-sm text-muted-foreground mb-3">
          Aparecem como sugestão ao mandar a ordem para a etapa de pintura.
        </p>
        <div className="space-y-2 md:max-w-md">
          {(empresa.empresasPintura ?? []).map((v, i) => (
            <div key={i} className="flex gap-2">
              <Input
                value={v}
                placeholder="Nome da empresa de pintura"
                onChange={(e) => {
                  const next = [...(empresa.empresasPintura ?? [])];
                  next[i] = e.target.value;
                  setEmpresa({ ...empresa, empresasPintura: next });
                }}
              />
              <Button size="icon" variant="dangerOutline" title="Excluir"
                onClick={() => setEmpresa({ ...empresa, empresasPintura: (empresa.empresasPintura ?? []).filter((_, idx) => idx !== i) })}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button size="sm" variant="outline"
            onClick={() => setEmpresa({ ...empresa, empresasPintura: [...(empresa.empresasPintura ?? []), ""] })}>
            <Plus className="mr-1 h-3.5 w-3.5" /> Adicionar empresa
          </Button>
        </div>

        <h2 className="font-display text-lg mt-6 mb-4">Prazos das ordens</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <Label>Prazo padrão ao aprovar (dias)</Label>
            <Input mask="inteiro" value={empresa.prazoPadraoDias}
              onChange={(e) => setEmpresa({ ...empresa, prazoPadraoDias: Math.max(1, Number(e.target.value)) })} />
          </div>
          <div>
            <Label>Vermelho quando faltar até (dias)</Label>
            <Input mask="inteiro" value={empresa.limiteVermelhoDias}
              onChange={(e) => setEmpresa({ ...empresa, limiteVermelhoDias: Number(e.target.value) })} />
          </div>
          <div>
            <Label>Amarelo quando faltar até (dias)</Label>
            <Input mask="inteiro" value={empresa.limiteAmareloDias}
              onChange={(e) => setEmpresa({ ...empresa, limiteAmareloDias: Number(e.target.value) })} />
          </div>
          <div>
            <Label>Meta semanal de faturamento (R$)</Label>
            <Input mask="moeda" value={String(empresa.metaSemanal ?? 40000).replace(".", ",")}
              onChange={(e) => setEmpresa({ ...empresa, metaSemanal: numeroMascarado(e.target.value) })} />
          </div>
        </div>

        <h2 className="font-display text-lg mt-6 mb-4">Proposta comercial (PDF do orçamento)</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <Label>Prazo padrão (dias úteis)</Label>
            <Input mask="inteiro" value={empresa.prazoDiasUteis}
              onChange={(e) => setEmpresa({ ...empresa, prazoDiasUteis: Math.max(1, Number(e.target.value)) })} />
          </div>
          <div>
            <Label>Validade do orçamento (dias)</Label>
            <Input mask="inteiro" value={empresa.validadeDias}
              onChange={(e) => setEmpresa({ ...empresa, validadeDias: Math.max(1, Number(e.target.value)) })} />
          </div>
          <div>
            <Label>Garantia (dias)</Label>
            <Input mask="inteiro" value={empresa.garantiaDias}
              onChange={(e) => setEmpresa({ ...empresa, garantiaDias: Number(e.target.value) })} />
          </div>
          <div>
            <Label>Chave PIX</Label>
            <Input value={empresa.pixChave} onChange={(e) => setEmpresa({ ...empresa, pixChave: e.target.value })} />
          </div>
          <div>
            <Label>Favorecido do PIX</Label>
            <Input value={empresa.pixFavorecido} onChange={(e) => setEmpresa({ ...empresa, pixFavorecido: e.target.value })} />
          </div>
          <div>
            <Label>Visita técnica (R$)</Label>
            <Input mask="moeda" value={String(empresa.visitaTecnica).replace(".", ",")}
              onChange={(e) => setEmpresa({ ...empresa, visitaTecnica: numeroMascarado(e.target.value) })} />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 mt-4">
          <div>
            <Label>Formas de pagamento (uma por linha)</Label>
            <Textarea rows={7} maxLength={5000} value={empresa.textoPagamento}
              onChange={(e) => setEmpresa({ ...empresa, textoPagamento: e.target.value })} />
          </div>
          <div>
            <Label>Informações técnicas (uma por linha)</Label>
            <Textarea rows={7} maxLength={5000} value={empresa.textoTecnico}
              onChange={(e) => setEmpresa({ ...empresa, textoTecnico: e.target.value })} />
          </div>
        </div>

        <h2 className="font-display text-lg mt-6 mb-2">Contrato de prestação de serviço</h2>
        <p className="text-sm text-muted-foreground mb-3">Texto usado no contrato, sem lista de materiais ou custos internos.</p>
        <Textarea rows={7} maxLength={6000} value={empresa.clausulasContrato}
          onChange={(e) => setEmpresa({ ...empresa, clausulasContrato: e.target.value })} />

        <h2 className="font-display text-lg mt-6 mb-2">Mensagens para o cliente</h2>
        <p className="text-sm text-muted-foreground mb-3">Modelos prontos para copiar e enviar no WhatsApp.</p>
        <div className="grid gap-4 md:grid-cols-3">
          {([
            ["msgSolicitarDados", "Solicitar dados"],
            ["msgFollowUp", "Retomar contato"],
            ["msgVisitaTecnica", "Visita técnica"],
          ] as const).map(([campo, titulo]) => (
            <div key={campo}>
              <div className="flex items-center justify-between">
                <Label>{titulo}</Label>
                <Button variant="soft" size="sm" className="h-6 px-2 text-xs"
                  onClick={() => { void navigator.clipboard.writeText(empresa[campo]); toast.success("Mensagem copiada"); }}>
                  Copiar
                </Button>
              </div>
              <Textarea rows={5} maxLength={3000} value={empresa[campo]}
                onChange={(e) => setEmpresa({ ...empresa, [campo]: e.target.value })} />
            </div>
          ))}
        </div>

        <h2 className="font-display text-lg mt-6 mb-2">Tela da oficina</h2>
        <p className="text-sm text-muted-foreground mb-2">
          Abra este endereço na TV ou tablet da oficina. Ele mostra o quadro das ordens sem nenhum valor.
        </p>
        {empresa.codigoOficina ? (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input readOnly value={`${window.location.origin}/oficina/${empresa.codigoOficina}`} />
            <Button
              variant="outline"
              onClick={() => {
                void navigator.clipboard.writeText(`${window.location.origin}/oficina/${empresa.codigoOficina}`);
                toast.success("Link copiado");
              }}
            >
              Copiar link
            </Button>
            <Button variant="outline" onClick={() => window.open(`/oficina/${empresa.codigoOficina}`, "_blank")}>
              Abrir
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Salve os dados da empresa para gerar o link.</p>
        )}
      </div>

      {/* Materiais usados no cálculo */}
      <div className="surface-card rounded-lg border border-border p-5">
        <h2 className="font-display text-lg flex items-center gap-2"><Package className="h-5 w-5 text-primary" /> Perfis e acessórios do cálculo</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Os materiais agora ficam na tela <strong>Materiais</strong>, com preço vigente e histórico do fornecedor.
          Para o orçamento usar o preço real, edite o material lá e escolha o <strong>código de cálculo</strong> correspondente.
        </p>
        <Button className="mt-3" onClick={() => navigate("/app/materiais")}>Abrir materiais</Button>
      </div>

      {/* Tabela de preços */}
      <div className="surface-card rounded-lg border border-border p-5">
        <h2 className="font-display text-lg flex items-center gap-2"><Package className="h-5 w-5 text-primary" /> Tabela de preços</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          É esta tabela que define o preço de cada peça no orçamento. Altere o valor e clique em salvar.
        </p>
        <div className="mt-3 max-w-xs">
          <Label>Margem sobre o motor (%)</Label>
          <Input
            className="mt-2"
            inputMode="numeric"
            value={String(empresa.margemMotorPct ?? 30)}
            onChange={(e) => setEmpresa({ ...empresa, margemMotorPct: Number(e.target.value.replace(/\D/g, "")) || 0 })}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Aplicada sobre o custo do motor cadastrado em Materiais para sugerir o preço ao cliente.
          </p>
        </div>
        <Input
          className="mt-3 max-w-sm"
          placeholder="Buscar produto ou modelo"
          value={buscaPreco}
          onChange={(e) => setBuscaPreco(e.target.value)}
        />
        <div className="mt-3 max-h-[420px] overflow-y-auto rounded-lg border border-border">
          <table className="w-full min-w-[520px] text-sm">
            <thead className="sticky top-0 bg-card">
              <tr className="border-b border-border text-xs uppercase text-muted-foreground">
                <th className="py-2 pl-3 text-left">Produto</th>
                <th className="py-2 text-left">Modelo</th>
                <th className="py-2 text-left">Unidade</th>
                <th className="py-2 pr-3 text-right w-32">Valor</th>
              </tr>
            </thead>
            <tbody>
              {politicaAtual
                .filter((i) => `${i.produto} ${i.modelo}`.toLowerCase().includes(buscaPreco.trim().toLowerCase()))
                .map((i) => (
                  <tr key={i.id} className="border-b border-border/40">
                    <td className="py-1.5 pl-3">{i.produto}</td>
                    <td className="py-1.5 text-muted-foreground">{i.modelo || "—"}</td>
                    <td className="py-1.5 text-muted-foreground">{UNIDADE_LABEL[i.unidade]}</td>
                    <td className="py-1.5 pr-3">
                      <Input
                        className="h-8 text-right"
                        mask="moeda"
                        disabled={i.unidade === "sob_orcamento"}
                        value={String(i.valor).replace(".", ",")}
                        onChange={(e) => setEmpresa({
                          ...empresa,
                          politicaValores: { ...(empresa.politicaValores ?? {}), [i.id]: numeroMascarado(e.target.value) },
                        })}
                      />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
