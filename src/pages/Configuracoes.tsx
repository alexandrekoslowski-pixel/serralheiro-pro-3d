import { useEffect, useState } from "react";
import { Building2, Save, Plus, Trash2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  obterEmpresa, salvarEmpresa, obterCatalogo, salvarCatalogo,
  restaurarCatalogoPadrao, DadosEmpresa,
} from "@/lib/storage";
import { Catalogo, Perfil, Acessorio } from "@/lib/catalogo";
import { numeroMascarado } from "@/lib/mascaras";
import { documentoOpcionalSchema, emailOpcionalSchema, primeiraMensagem, telefoneOpcionalSchema } from "@/lib/validacao";

export default function Configuracoes() {
  const [empresa, setEmpresa] = useState<DadosEmpresa>(obterEmpresa());
  const [cat, setCat] = useState<Catalogo>(obterCatalogo());

  useEffect(() => {
    setEmpresa(obterEmpresa());
    setCat(obterCatalogo());
  }, []);

  const salvarTudo = () => {
    const campos = [documentoOpcionalSchema.safeParse(empresa.cnpj), telefoneOpcionalSchema.safeParse(empresa.telefone), emailOpcionalSchema.safeParse(empresa.email)];
    const mensagem = campos.map(primeiraMensagem).find(Boolean);
    if (mensagem) { toast.error(mensagem); return; }
    if (!empresa.nome.trim()) { toast.error("Informe o nome da empresa"); return; }
    const empresaLimpa = { ...empresa, nome: empresa.nome.trim(), email: empresa.email.trim().toLowerCase() };
    salvarEmpresa(empresaLimpa);
    salvarCatalogo(cat);
    toast.success("Configurações salvas");
  };

  const restaurar = () => {
    const padrao = restaurarCatalogoPadrao();
    setCat(padrao);
    toast.success("Catálogo restaurado para o padrão");
  };

  const updPerfil = (i: number, patch: Partial<Perfil>) => {
    const next = [...cat.perfis];
    next[i] = { ...next[i], ...patch };
    setCat({ ...cat, perfis: next });
  };
  const addPerfil = () =>
    setCat({ ...cat, perfis: [...cat.perfis, { codigo: "NOVO", descricao: "Novo perfil", precoPorMetro: 0, pesoLinear: 0 }] });
  const delPerfil = (i: number) =>
    setCat({ ...cat, perfis: cat.perfis.filter((_, idx) => idx !== i) });

  const updAce = (i: number, patch: Partial<Acessorio>) => {
    const next = [...cat.acessorios];
    next[i] = { ...next[i], ...patch };
    setCat({ ...cat, acessorios: next });
  };
  const addAce = () =>
    setCat({ ...cat, acessorios: [...cat.acessorios, { codigo: "NOVO", descricao: "Novo acessório", preco: 0, unidade: "un" }] });
  const delAce = (i: number) =>
    setCat({ ...cat, acessorios: cat.acessorios.filter((_, idx) => idx !== i) });

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

        <h2 className="font-display text-lg mt-6 mb-2">Equipe de vendas</h2>
        <p className="text-sm text-muted-foreground mb-3">
          Nomes extras que aparecem na lista de vendedores do orçamento. A equipe cadastrada já entra automaticamente.
        </p>
        <div className="space-y-2 md:max-w-md">
          {(empresa.vendedoras ?? []).map((v, i) => (
            <div key={i} className="flex gap-2">
              <Input
                value={v}
                placeholder="Nome do vendedor(a)"
                onChange={(e) => {
                  const next = [...(empresa.vendedoras ?? [])];
                  next[i] = e.target.value;
                  setEmpresa({ ...empresa, vendedoras: next });
                }}
              />
              <Button size="icon" variant="dangerOutline" title="Excluir"
                onClick={() => setEmpresa({ ...empresa, vendedoras: (empresa.vendedoras ?? []).filter((_, idx) => idx !== i) })}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button size="sm" variant="outline"
            onClick={() => setEmpresa({ ...empresa, vendedoras: [...(empresa.vendedoras ?? []), ""] })}>
            <Plus className="mr-1 h-3.5 w-3.5" /> Adicionar vendedor(a)
          </Button>
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

      {/* Perfis */}
      <div className="surface-card rounded-lg border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg">Perfis</h2>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={restaurar}>
              <RotateCcw className="mr-1 h-3.5 w-3.5" /> Restaurar padrão
            </Button>
            <Button size="sm" onClick={addPerfil} className="bg-primary text-primary-foreground">
              <Plus className="mr-1 h-3.5 w-3.5" /> Adicionar
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase text-muted-foreground">
                <th className="text-left py-2 pr-2">Código</th>
                <th className="text-left py-2 pr-2">Descrição</th>
                <th className="text-right py-2 pr-2">R$/m</th>
                <th className="text-right py-2 pr-2">kg/m</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {cat.perfis.map((p, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-1 pr-2"><Input className="h-8" mask="codigo" value={p.codigo} onChange={(e) => updPerfil(i, { codigo: e.target.value })} /></td>
                  <td className="py-1 pr-2"><Input className="h-8" value={p.descricao} onChange={(e) => updPerfil(i, { descricao: e.target.value })} /></td>
                  <td className="py-1 pr-2"><Input className="h-8 text-right" mask="moeda" value={String(p.precoPorMetro).replace(".", ",")} onChange={(e) => updPerfil(i, { precoPorMetro: numeroMascarado(e.target.value) })} /></td>
                  <td className="py-1 pr-2"><Input className="h-8 text-right" mask="decimal" value={String(p.pesoLinear).replace(".", ",")} onChange={(e) => updPerfil(i, { pesoLinear: numeroMascarado(e.target.value) })} /></td>
                  <td className="py-1"><Button size="icon" variant="dangerOutline" title="Excluir" onClick={() => delPerfil(i)}><Trash2 className="h-4 w-4" /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Acessórios */}
      <div className="surface-card rounded-lg border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg">Acessórios</h2>
          <Button size="sm" onClick={addAce} className="bg-primary text-primary-foreground">
            <Plus className="mr-1 h-3.5 w-3.5" /> Adicionar
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase text-muted-foreground">
                <th className="text-left py-2 pr-2">Código</th>
                <th className="text-left py-2 pr-2">Descrição</th>
                <th className="text-right py-2 pr-2">Preço</th>
                <th className="text-left py-2 pr-2">Unidade</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {cat.acessorios.map((a, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-1 pr-2"><Input className="h-8" mask="codigo" value={a.codigo} onChange={(e) => updAce(i, { codigo: e.target.value })} /></td>
                  <td className="py-1 pr-2"><Input className="h-8" value={a.descricao} onChange={(e) => updAce(i, { descricao: e.target.value })} /></td>
                  <td className="py-1 pr-2"><Input className="h-8 text-right" mask="moeda" value={String(a.preco).replace(".", ",")} onChange={(e) => updAce(i, { preco: numeroMascarado(e.target.value) })} /></td>
                  <td className="py-1 pr-2"><Input className="h-8" value={a.unidade} onChange={(e) => updAce(i, { unidade: e.target.value })} /></td>
                  <td className="py-1"><Button size="icon" variant="dangerOutline" title="Excluir" onClick={() => delAce(i)}><Trash2 className="h-4 w-4" /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vidro */}
      <div className="surface-card rounded-lg border border-border p-5 md:max-w-md">
        <h2 className="font-display text-lg mb-3">Vidro temperado</h2>
        <Label>Preço por m² (R$)</Label>
        <Input mask="moeda" value={String(cat.vidroPorM2).replace(".", ",")} onChange={(e) => setCat({ ...cat, vidroPorM2: numeroMascarado(e.target.value) })} />
      </div>
    </section>
  );
}
