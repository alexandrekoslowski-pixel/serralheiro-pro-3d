import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Save, Copy, Download, Settings2, DollarSign, Send, FileSignature, Loader2,
  RotateCw, Box as BoxIcon, Grid3x3, Ruler, Plus, Trash2, RefreshCw, EyeOff, Eye,
  Wrench, FileText, FileSpreadsheet, Smartphone, Sun, Moon, User, Car, Play, MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toggle } from "@/components/ui/toggle";
import { PainelFotos } from "@/components/FotosOrdem";
import { ChecklistPedido } from "@/components/ChecklistPedido";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import Visualizador3DClient from "@/components/Visualizador3DClient";
import type { CameraPreset } from "@/components/Visualizador3D";
import { useAnimatedNumber } from "@/hooks/useAnimatedNumber";
import { useVendedores } from "@/hooks/useVendedores";
import { type Cliente, listarClientes } from "@/lib/gestao";

import {
  TIPOLOGIAS, ACABAMENTOS, AcabamentoId, TipologiaId, tipologiaPorId,
} from "@/lib/tipologias";
import {
  ProjetoLocal, Peca, OrdemStatus, obterProjeto, salvarProjeto, duplicarProjeto,
  obterEmpresa, obterCatalogo, formatarBRL, gerarId, listarPagamentos,
} from "@/lib/storage";
import { progressoOrcamento } from "@/lib/progressoOrcamento";
import { TrilhaOrcamento } from "@/components/TrilhaOrcamento";
import { PassosOrcamento } from "@/components/PassosOrcamento";
import { DialogOrdemFinanceiro } from "@/components/DialogOrdemFinanceiro";
import { STATUS_ORDEM, STATUS_LABEL, somarDias } from "@/lib/ordens";
import {
  FIXACAO_TIPOS, FIXACAO_LADOS, FIXACAO_PADRAO, FIXACAO_LADOS_PADRAO,
  FixacaoTipo, FixacaoLados, pontosFixacao, fixacaoTipo,
} from "@/lib/fixacao";
import { calcularProjeto, ItemExtra, ItemOverride } from "@/lib/calculator";
import { planejarCorte, planejarProducao } from "@/lib/producao";
import { gerarOrcamentoPDF } from "@/lib/pdf";
import { gerarOrdemProducaoPDF } from "@/lib/pdfProducao";
import { cm, mmParaCm, cmParaMm } from "@/lib/medidas";
import { pendentesComunsChecklist, pendentesPecaChecklist } from "@/lib/checklistPedido";
import { numeroMascarado } from "@/lib/mascaras";
import { buscarCep } from "@/lib/cep";
import { gerarContratoPDF } from "@/lib/pdfContrato";
import { useSessao } from "@/lib/sessao";

const PALETA_BARRAS = [
  "hsl(18 78% 52%)", "hsl(210 60% 55%)", "hsl(140 50% 50%)",
  "hsl(320 55% 60%)", "hsl(45 90% 55%)", "hsl(260 50% 60%)",
  "hsl(0 65% 55%)", "hsl(180 55% 50%)",
];

export default function Configurador() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [projeto, setProjeto] = useState<ProjetoLocal | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const clienteNomeRef = useRef<HTMLInputElement | null>(null);
  const focoInicialFeito = useRef(false);

  // Controles 3D
  const [preset, setPreset] = useState<CameraPreset>("iso");
  const [autoRotate, setAutoRotate] = useState(false);
  const [wireframe, setWireframe] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [showCotas, setShowCotas] = useState(true);
  const [bgColor, setBgColor] = useState("#1a1614");
  const [ambiente, setAmbiente] = useState<"dia" | "noite">("dia");
  const [showPessoa, setShowPessoa] = useState(false);
  const [showCarro, setShowCarro] = useState(false);
  const [aberto, setAberto] = useState(false);
  const [pecaSelId, setPecaSelId] = useState<string | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const abrirChecklist = Boolean((location.state as { abrirChecklist?: boolean } | null)?.abrirChecklist);
  const [abaCadastro, setAbaCadastro] = useState(abrirChecklist ? "checklist" : "cliente");
  const [mostrarPendencias, setMostrarPendencias] = useState(abrirChecklist);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [financeiroAberto, setFinanceiroAberto] = useState(false);
  const { session } = useSessao();

  useEffect(() => { void listarClientes().then(setClientes).catch(() => undefined); }, []);

  // Carrega projeto
  useEffect(() => {
    const p = obterProjeto(id);
    if (!p) {
      toast.error("Orçamento não encontrado");
      navigate("/app");
      return;
    }
    setProjeto(p);
  }, [id, navigate]);

  useEffect(() => {
    if (
      !projeto
      || focoInicialFeito.current
      || !(location.state as { novoOrcamento?: boolean } | null)?.novoOrcamento
    ) return;
    focoInicialFeito.current = true;
    const timer = window.setTimeout(() => clienteNomeRef.current?.focus(), 80);
    return () => window.clearTimeout(timer);
  }, [location.state, projeto]);


  const empresa = useMemo(() => obterEmpresa(), []);
  const catalogo = useMemo(() => obterCatalogo(), []);
  const vendedores = useVendedores();

  const resultado = useMemo(() => {
    if (!projeto) return null;
    return calcularProjeto({
      pecas: projeto.pecas,
      maoObraPct: projeto.maoObraPct,
      margemPct: projeto.margemPct,
      descontoGeralPct: projeto.descontoGeralPct,
      catalogo,
      overrides: projeto.overrides,
      extras: projeto.extras,
    });
  }, [projeto, catalogo]);

  // Auto-save 800ms
  useEffect(() => {
    if (!projeto || !resultado) return;
    setSalvo(false);
    setSalvando(true);
    const t = setTimeout(() => {
      salvarProjeto({ ...projeto, total: resultado.totalGeral });
      setSalvando(false);
      setSalvo(true);
    }, 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projeto, resultado?.totalGeral]);

  const totalAnimado = useAnimatedNumber(resultado?.totalGeral ?? 0);

  // Plano de corte / produção (hooks must be called before any early return)
  const [barraMm, setBarraMm] = useState<number>(6000);
  const planoCorte = useMemo(
    () => (resultado ? planejarCorte(resultado.cortes, barraMm) : null),
    [resultado, barraMm],
  );
  const planoProducao = useMemo(
    () => (projeto && resultado ? planejarProducao(projeto.pecas[0].tipologia, resultado.cortes) : null),
    [projeto, resultado],
  );

  if (!projeto || !resultado || !planoCorte || !planoProducao) return null;

  // ---- peças do orçamento ----
  const pecaSel: Peca = projeto.pecas.find((x) => x.id === pecaSelId) ?? projeto.pecas[0];
  const tip = tipologiaPorId(pecaSel.tipologia);

  const updPeca = (patch: Partial<Peca>) =>
    setProjeto({
      ...projeto,
      pecas: projeto.pecas.map((x) => (x.id === pecaSel.id ? { ...x, ...patch } : x)),
    });

  const addPeca = () => {
    const t = tipologiaPorId(pecaSel.tipologia);
    const nova: Peca = {
      id: gerarId(),
      nome: `Peça ${projeto.pecas.length + 1}`,
      tipologia: pecaSel.tipologia,
      largura_mm: t.larguraDefault,
      altura_mm: t.alturaDefault,
      cor: pecaSel.cor,
      fixacao: pecaSel.fixacao ?? FIXACAO_PADRAO,
      fixacaoLados: pecaSel.fixacaoLados ?? FIXACAO_LADOS_PADRAO,
      checklist_respostas: {},
    };
    setProjeto({ ...projeto, pecas: [...projeto.pecas, nova] });
    setPecaSelId(nova.id);
  };

  const duplicarPeca = () => {
    const nova: Peca = { ...pecaSel, id: gerarId(), nome: `${pecaSel.nome} (cópia)`, checklist_respostas: { ...pecaSel.checklist_respostas } };
    setProjeto({ ...projeto, pecas: [...projeto.pecas, nova] });
    setPecaSelId(nova.id);
  };

  const delPeca = (id: string) => {
    if (projeto.pecas.length <= 1) { toast.error("O orçamento precisa de ao menos uma peça"); return; }
    const restantes = projeto.pecas.filter((x) => x.id !== id);
    setProjeto({
      ...projeto,
      pecas: restantes,
      overrides: Object.fromEntries(Object.entries(projeto.overrides).filter(([k]) => !k.startsWith(`${id}::`))),
    });
    if (pecaSelId === id) setPecaSelId(restantes[0].id);
  };

  const upd = <K extends keyof ProjetoLocal>(k: K, v: ProjetoLocal[K]) =>
    setProjeto({ ...projeto, [k]: v });

  const setOverride = (key: string, ov: Partial<ItemOverride>) => {
    const cur = projeto.overrides[key] ?? {};
    setProjeto({ ...projeto, overrides: { ...projeto.overrides, [key]: { ...cur, ...ov } } });
  };
  const resetOverride = (key: string) => {
    const next = { ...projeto.overrides };
    delete next[key];
    setProjeto({ ...projeto, overrides: next });
  };

  const addExtra = () => {
    const ex: ItemExtra = { id: gerarId(), descricao: "Novo item", qtd: 1, unidade: "un", precoUnit: 0 };
    setProjeto({ ...projeto, extras: [...projeto.extras, ex] });
  };
  const updExtra = (id: string, patch: Partial<ItemExtra>) =>
    setProjeto({ ...projeto, extras: projeto.extras.map((e) => (e.id === id ? { ...e, ...patch } : e)) });
  const delExtra = (id: string) =>
    setProjeto({ ...projeto, extras: projeto.extras.filter((e) => e.id !== id) });

  const duplicar = () => {
    salvarProjeto({ ...projeto, total: resultado.totalGeral });
    const novo = duplicarProjeto(projeto.id);
    if (novo) {
      toast.success("Duplicado");
      navigate(`/app/projeto/${novo.id}`);
    }
  };

  const aplicar = (patch: Partial<ProjetoLocal>) => {
    const atualizado: ProjetoLocal = { ...projeto, total: resultado.totalGeral, ...patch };
    setProjeto(atualizado);
    salvarProjeto(atualizado);
    return atualizado;
  };

  const checklistPendente = () => {
    const pendentes = [
      ...pendentesComunsChecklist(projeto.checklist_respostas),
      ...projeto.pecas.flatMap((p) => pendentesPecaChecklist(p.tipologia, p.checklist_respostas ?? {})),
    ];
    if (pendentes.length === 0) return false;
    setMostrarPendencias(true);
    setAbaCadastro("checklist");
    window.setTimeout(() => document.querySelector<HTMLElement>(`[id$="-${pendentes[0].id}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
    toast.error(`Complete o checklist: ${pendentes.length} resposta${pendentes.length === 1 ? "" : "s"} pendente${pendentes.length === 1 ? "" : "s"}`);
    return true;
  };

  const aprovar = () => {
    const agora = new Date().toISOString();
    aplicar({
      status: "aprovado",
      aprovado_em: projeto.aprovado_em ?? agora,
      aguardando_oficina: true,
      etapa: "fila",
      etapa_em: agora,
      prazo_entrega: projeto.prazo_entrega ?? somarDias(empresa.prazoPadraoDias),
    });
    toast.success("Orçamento aprovado — gere o contrato e siga os passos");
  };

  const mandarParaOficina = () => {
    if (checklistPendente()) return;
    const agora = new Date().toISOString();
    aplicar({
      status: projeto.status === "orcamento" ? "aprovado" : projeto.status,
      aprovado_em: projeto.aprovado_em ?? agora,
      aguardando_oficina: false,
      etapa: "fila",
      etapa_em: agora,
      prazo_entrega: projeto.prazo_entrega ?? somarDias(empresa.prazoPadraoDias),
    });
    toast.success("Ordem liberada para a oficina");
  };

  const exportarOrcamento = () => {
    const atualizado = aplicar({ orcamento_pdf_em: new Date().toISOString() });
    gerarOrcamentoPDF(atualizado, resultado, empresa);
    toast.success("Orçamento gerado");
  };

  const exportarContrato = () => {
    const atualizado = aplicar({ contrato_pdf_em: new Date().toISOString() });
    gerarContratoPDF(atualizado, empresa);
    toast.success("Contrato gerado");
  };

  const marcarEnviado = () => {
    const agora = new Date().toISOString();
    const nome = (session?.user.user_metadata?.nome as string) || session?.user.email || projeto.vendedora || "";
    aplicar({ enviado_em: agora, enviado_por_nome: nome, followup_status: "aguardando" as const, followup_em: null });
    toast.success("Envio registrado; retorno em 3 dias se necessário");
  };

  const consultarCep = async (cep: string) => {
    if (cep.replace(/\D/g, "").length !== 8) return;
    setBuscandoCep(true);
    try {
      const endereco = await buscarCep(cep);
      setProjeto({ ...projeto, cliente_endereco: endereco.logradouro || projeto.cliente_endereco, cliente_bairro: endereco.bairro || projeto.cliente_bairro, cliente_cidade: endereco.cidadeUf || projeto.cliente_cidade });
      toast.success("Endereço preenchido pelo CEP");
    } catch (erro) { toast.error(erro instanceof Error ? erro.message : "CEP não encontrado"); }
    finally { setBuscandoCep(false); }
  };



  const exportarOP = () => {
    gerarOrdemProducaoPDF(projeto, planoCorte, planoProducao);
    toast.success("Ordem de produção gerada");
  };

  return (
    <div className="container py-4 md:py-6 space-y-4">
      {/* Top bar */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 min-w-0">
          <Button asChild variant="soft" size="sm" className="shrink-0">
            <Link to="/app"><ArrowLeft className="mr-1 h-4 w-4" /> Orçamentos</Link>
          </Button>
          <div className="min-w-0">
            <h1 className="font-display text-base md:text-xl truncate">{projeto.nome || "Orçamento"}</h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="truncate">{tip.nome}</span>
              <span>·</span>
              <span className="font-mono uppercase">{projeto.id.slice(0, 6)}</span>
              <span>·</span>
              <span className={cn("flex items-center gap-1", salvo ? "text-success" : "text-warning")}>
                <span className={cn("h-1.5 w-1.5 rounded-full", salvo ? "bg-success" : "bg-warning animate-pulse")} />
                {salvando ? "salvando…" : "✓ salvo"}
              </span>
            </div>
          </div>
        </div>
        <TrilhaOrcamento marcos={progressoOrcamento(projeto, listarPagamentos(projeto.id)).marcos} />
        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
          <PassosOrcamento
            projeto={projeto}
            pagamentos={listarPagamentos(projeto.id)}
            onPasso={(id) => {
              if (id === "orcamento") exportarOrcamento();
              else if (id === "enviar") marcarEnviado();
              else if (id === "aprovar") aprovar();
              else if (id === "contrato") exportarContrato();
              else if (id === "comprovante") setFinanceiroAberto(true);
              else mandarParaOficina();
            }}
          />
          <Button variant="outline" size="sm" className="shrink-0" onClick={() => { salvarProjeto({ ...projeto, total: resultado.totalGeral }); toast.success("Salvo"); }}>
            <Save className="mr-1 h-4 w-4" /> Salvar
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="soft" size="sm" className="shrink-0">
                <MoreHorizontal className="mr-1 h-4 w-4" /> Mais ações
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={duplicar}>
                <Copy className="mr-2 h-4 w-4" /> Duplicar orçamento
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { salvarProjeto({ ...projeto, total: resultado.totalGeral }); navigate(`/app/projeto/${projeto.id}/atender`); }}>
                <Smartphone className="mr-2 h-4 w-4" /> Abrir atendimento
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportarOP}>
                <FileSpreadsheet className="mr-2 h-4 w-4" /> Imprimir OS
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { salvarProjeto({ ...projeto, total: resultado.totalGeral }); window.open(`/op/${projeto.id}`, "_blank"); }}>
                <Wrench className="mr-2 h-4 w-4" /> Abrir modo TV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Cadastro do orçamento */}
      <div className="surface-card rounded-lg border border-border">
        <Tabs value={abaCadastro} onValueChange={setAbaCadastro}>
          <TabsList className="w-full justify-start overflow-x-auto rounded-b-none border-b border-border bg-transparent p-0">
            <TabsTrigger value="cliente">1 · Cliente</TabsTrigger>
            <TabsTrigger value="proposta">2 · Proposta</TabsTrigger>
            <TabsTrigger value="checklist">3 · Checklist do pedido</TabsTrigger>
            <TabsTrigger value="ordem">4 · Ordem de serviço</TabsTrigger>
          </TabsList>

          <TabsContent value="cliente" className="mt-0 p-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

              <div className="relative sm:col-span-2">
                <Label className="text-xs">Cliente (nome e sobrenome)</Label>
                <Input
                  ref={clienteNomeRef}
                  className="h-9"
                  value={projeto.cliente}
                  autoComplete="off"
                  onChange={(e) => { upd("cliente", e.target.value); setSugestoesAbertas(true); }}
                  onFocus={() => setSugestoesAbertas(true)}
                  onBlur={() => window.setTimeout(() => setSugestoesAbertas(false), 150)}
                  placeholder="Maria Silva"
                />
                {sugestoesAbertas && sugestoesCliente.length > 0 && (
                  <ul className="absolute left-0 right-0 top-full z-30 mt-1 max-h-56 overflow-y-auto rounded-md border border-border bg-popover shadow-md">
                    {sugestoesCliente.map((c) => (
                      <li key={c.id}>
                        <button
                          type="button"
                          className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setProjeto({
                              ...projeto,
                              cliente_id: c.id,
                              cliente: c.nome,
                              cliente_documento: c.documento,
                              cliente_email: c.email,
                              cliente_telefone: c.telefone || c.whatsapp,
                              cliente_endereco: c.endereco,
                              cliente_bairro: c.bairro,
                              cliente_cidade: c.cidade,
                              cliente_cep: c.cep,
                            });
                            setSugestoesAbertas(false);
                            setSalvo(false);
                          }}
                        >
                          <span className="font-medium">{c.nome}</span>
                          {(c.telefone || c.cidade) && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              {[c.telefone || c.whatsapp, c.cidade].filter(Boolean).join(" · ")}
                            </span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Comece a digitar para reaproveitar um cliente. Cliente novo é cadastrado sozinho ao salvar.
                </p>
              </div>
              <div>
                <Label className="text-xs">RG ou CPF</Label>
                <Input className="h-9" mask="rgCpf" value={projeto.cliente_documento ?? ""} onChange={(e) => upd("cliente_documento", e.target.value)} placeholder="RG ou CPF" />
              </div>
              <div>
                <Label className="text-xs">Telefone / WhatsApp</Label>
                <Input className="h-9" type="tel" mask="telefone" value={projeto.cliente_telefone ?? ""} onChange={(e) => upd("cliente_telefone", e.target.value)} placeholder="(00) 00000-0000" />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs">E-mail</Label>
                <Input className="h-9" type="email" value={projeto.cliente_email ?? ""} onChange={(e) => upd("cliente_email", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">CEP</Label>
                <div className="relative">
                  <Input className="h-9" mask="cep" value={projeto.cliente_cep ?? ""} onChange={(e) => upd("cliente_cep", e.target.value)} onBlur={(e) => void consultarCep(e.target.value)} placeholder="00000-000" />
                  {buscandoCep && <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />}
                </div>
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs">Endereço (rua, número, complemento)</Label>
                <Input className="h-9" value={projeto.cliente_endereco ?? ""} onChange={(e) => upd("cliente_endereco", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Bairro</Label>
                <Input className="h-9" value={projeto.cliente_bairro ?? ""} onChange={(e) => upd("cliente_bairro", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Cidade/UF</Label>
                <Input className="h-9" value={projeto.cliente_cidade ?? ""} onChange={(e) => upd("cliente_cidade", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Local de instalação</Label>
                <Input className="h-9" placeholder="se for outro endereço" value={projeto.local_instalacao ?? ""} onChange={(e) => upd("local_instalacao", e.target.value)} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="proposta" className="mt-0 p-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="sm:col-span-2">
                <Label className="text-xs">Nome do orçamento</Label>
                <Input className="h-9" value={projeto.nome} onChange={(e) => upd("nome", e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs">Vendedor(a) responsável</Label>
                {vendedores.length > 0 ? (
                  <Select
                    value={projeto.vendedora || "__nenhuma__"}
                    onValueChange={(v) => upd("vendedora", v === "__nenhuma__" ? "" : v)}
                  >
                    <SelectTrigger className="h-9"><SelectValue placeholder="Selecionar" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__nenhuma__">Sem vendedor(a)</SelectItem>
                      {vendedores.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    className="h-9"
                    placeholder="Cadastre a equipe em Empresa & Catálogo"
                    value={projeto.vendedora ?? ""}
                    onChange={(e) => upd("vendedora", e.target.value)}
                  />
                )}
              </div>
              <div>
                <Label className="text-xs">Prazo (dias úteis)</Label>
                <Input
                  className="h-9"
                  mask="inteiro"
                  placeholder={String(empresa.prazoDiasUteis ?? 22)}
                  value={projeto.prazo_dias_uteis ?? ""}
                  onChange={(e) => upd("prazo_dias_uteis", e.target.value === "" ? null : Math.max(1, Number(e.target.value)))}
                />
              </div>
              <div>
                <Label className="text-xs">Serviços (R$)</Label>
                <Input
                  className="h-9"
                  mask="moeda"
                  placeholder="não incluso"
                  value={projeto.servicos_valor == null ? "" : String(projeto.servicos_valor).replace(".", ",")}
                  onChange={(e) => upd("servicos_valor", e.target.value === "" ? null : numeroMascarado(e.target.value))}
                />
              </div>
              <div>
                <Label className="text-xs">Frete (R$)</Label>
                <Input
                  className="h-9"
                  mask="moeda"
                  placeholder="não incluso"
                  value={projeto.frete_valor == null ? "" : String(projeto.frete_valor).replace(".", ",")}
                  onChange={(e) => upd("frete_valor", e.target.value === "" ? null : numeroMascarado(e.target.value))}
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-4">
                <Label className="text-xs">Observações da proposta</Label>
                <Textarea
                  rows={3}
                  maxLength={2000}
                  value={projeto.observacoes_proposta ?? ""}
                  onChange={(e) => upd("observacoes_proposta", e.target.value)}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="checklist" className="mt-0 p-4">
            <ChecklistPedido
              pecas={projeto.pecas}
              selecionadaId={pecaSel.id}
              respostas={projeto.checklist_respostas}
              onSelecionarPeca={setPecaSelId}
              onChangePeca={(pecaId, checklist_respostas) => {
                setProjeto({ ...projeto, pecas: projeto.pecas.map((p) => p.id === pecaId ? { ...p, checklist_respostas } : p) });
                setMostrarPendencias(false);
              }}
              mostrarPendencias={mostrarPendencias}
              onChange={(checklist_respostas) => {
                setProjeto({ ...projeto, checklist_respostas });
                setMostrarPendencias(false);
              }}
            />
          </TabsContent>

          <TabsContent value="ordem" className="mt-0 p-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <Label className="text-xs">Situação</Label>
                <Select value={projeto.status} onValueChange={(v) => upd("status", v as OrdemStatus)}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_ORDEM.map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Prazo de entrega</Label>
                <Input className="h-9" type="date" value={projeto.prazo_entrega ?? ""} onChange={(e) => upd("prazo_entrega", e.target.value || null)} />
              </div>
              <div>
                <Label className="text-xs">Valor faturado (R$)</Label>
                <Input className="h-9" mask="moeda" value={String(projeto.valor_faturado || 0).replace(".", ",")} onChange={(e) => upd("valor_faturado", numeroMascarado(e.target.value))} />
              </div>
              <div>
                <Label className="text-xs">Total orçado</Label>
                <Input className="h-9" readOnly value={formatarBRL(resultado.totalGeral)} />
              </div>
            </div>

            <div className="mt-5 border-t border-border pt-4">
              <h3 className="font-display text-base">Fotos da ordem</h3>
              <p className="mb-3 text-sm text-muted-foreground">
                Fotos da medição no local, da produção e da instalação.
              </p>
              <PainelFotos projetoId={projeto.id} etapaInicial="medicao" />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Peças e medidas */}
      <div className="surface-card rounded-lg border border-border p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="font-display text-sm flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-primary" /> Peças do orçamento ({projeto.pecas.length})
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={duplicarPeca}>Duplicar peça</Button>
            <Button size="sm" className="bg-gradient-orange text-primary-foreground shadow-orange" onClick={addPeca}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Peça
            </Button>
          </div>
        </div>

        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {projeto.pecas.map((pc, i) => (
            <div
              key={pc.id}
              onClick={() => setPecaSelId(pc.id)}
              className={cn(
                "relative min-w-[170px] shrink-0 cursor-pointer rounded-lg border-2 p-3 transition",
                pc.id === pecaSel.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/40",
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Peça {i + 1}</span>
                <span
                  className="h-3 w-3 rounded-full border border-border"
                  style={{ backgroundColor: ACABAMENTOS.find((a) => a.id === pc.cor)?.hex }}
                />
              </div>
              <div className="truncate text-sm font-medium">{pc.nome}</div>
              <div className="text-xs text-muted-foreground">
                {cm(pc.largura_mm)} × {cm(pc.altura_mm)} cm
              </div>
              {projeto.pecas.length > 1 && (
                <button
                  type="button"
                  className="absolute right-1.5 top-1 text-muted-foreground hover:text-destructive"
                  onClick={(e) => { e.stopPropagation(); delPeca(pc.id); }}
                  title="Remover peça"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="grid gap-4 border-t border-border pt-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Label>Nome da peça</Label>
            <Input className="mt-2" value={pecaSel.nome} onChange={(e) => updPeca({ nome: e.target.value })} />
          </div>

          <div className="sm:col-span-2">
            <Label>Tipologia</Label>
            <Select value={pecaSel.tipologia} onValueChange={(v) => {
              const novo = tipologiaPorId(v as TipologiaId);
              updPeca({
                tipologia: v as TipologiaId,
                largura_mm: Math.min(Math.max(pecaSel.largura_mm, novo.larguraMin), novo.larguraMax),
                altura_mm: Math.min(Math.max(pecaSel.altura_mm, novo.alturaMin), novo.alturaMax),
              });
            }}>
              <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIPOLOGIAS.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-1 text-[11px] text-muted-foreground">{tip.descricao}</p>
          </div>

          <div className="sm:col-span-2 lg:col-span-4 min-w-0">
            <Label>Acabamento / cor</Label>
            <div className="mt-2 flex w-full gap-1.5 overflow-x-auto px-1 py-1 scrollbar-thin">
              {ACABAMENTOS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => updPeca({ cor: a.id as AcabamentoId })}
                  className={cn(
                    "h-8 w-8 shrink-0 rounded-full border-2 transition",
                    pecaSel.cor === a.id ? "border-primary scale-110 shadow-orange" : "border-border",
                  )}
                  style={{ backgroundColor: a.hex }}
                  title={a.nome}
                />
              ))}
            </div>
          </div>


          <div className="sm:col-span-2">
            <SliderMm
              label="Largura"
              value={pecaSel.largura_mm}
              min={tip.larguraMin} max={tip.larguraMax}
              onChange={(v) => updPeca({ largura_mm: v })}
            />
          </div>
          <div className="sm:col-span-2">
            <SliderMm
              label="Altura"
              value={pecaSel.altura_mm}
              min={tip.alturaMin} max={tip.alturaMax}
              onChange={(v) => updPeca({ altura_mm: v })}
            />
          </div>

          <div className="sm:col-span-2">
            <Label>Sistema de fixação</Label>
            <Select
              value={pecaSel.fixacao ?? FIXACAO_PADRAO}
              onValueChange={(v) => updPeca({ fixacao: v as FixacaoTipo })}
            >
              <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
              <SelectContent>
                {FIXACAO_TIPOS.map((f) => (
                  <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="sm:col-span-2">
            <Label>Lados da fixação</Label>
            <Select
              value={pecaSel.fixacaoLados ?? FIXACAO_LADOS_PADRAO}
              onValueChange={(v) => updPeca({ fixacaoLados: v as FixacaoLados })}
            >
              <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
              <SelectContent>
                {FIXACAO_LADOS.map((f) => (
                  <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-2 text-xs text-muted-foreground">
              {fixacaoTipo(pecaSel.fixacao).instrucao} ·{" "}
              {pontosFixacao(pecaSel.largura_mm, pecaSel.altura_mm, pecaSel.fixacaoLados)} pontos de fixação.
            </p>
          </div>
        </div>
      </div>

      {/* Desenho e detalhamento */}
      <div className="space-y-4 min-w-0">
          {/* Card 3D */}
          <div className="surface-card rounded-lg border border-border overflow-hidden">
            <div className="flex flex-col gap-2 border-b border-border px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="font-display text-sm flex items-center gap-2">
                <BoxIcon className="h-4 w-4 text-primary" /> Visualização 3D
              </div>
              <div className="flex items-center gap-2 overflow-x-auto -mx-1 px-1">
                {(["iso", "frente", "lateral", "topo"] as CameraPreset[]).map((p) => (
                  <Button
                    key={p}
                    size="sm"
                    variant={preset === p ? "default" : "outline"}
                    className={cn("shrink-0 h-7 px-2 text-xs", preset === p && "bg-gradient-orange text-primary-foreground")}
                    onClick={() => setPreset(p)}
                  >
                    {p.toUpperCase()}
                  </Button>
                ))}
                <span className="mx-1 h-5 w-px bg-border shrink-0" />
                <Toggle pressed={autoRotate} onPressedChange={setAutoRotate} size="sm" className="shrink-0" title="Rotação automática"><RotateCw className="h-3.5 w-3.5" /></Toggle>
                <Toggle pressed={ambiente === "noite"} onPressedChange={(v) => setAmbiente(v ? "noite" : "dia")} size="sm" className="shrink-0" title="Dia / Noite">
                  {ambiente === "noite" ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
                </Toggle>
                <Toggle pressed={showPessoa} onPressedChange={setShowPessoa} size="sm" className="shrink-0" title="Pessoa de escala (1,75 m)"><User className="h-3.5 w-3.5" /></Toggle>
                <Toggle pressed={showCarro} onPressedChange={setShowCarro} size="sm" className="shrink-0" title="Carro de escala (4,5 m)"><Car className="h-3.5 w-3.5" /></Toggle>
                <Toggle pressed={aberto} onPressedChange={setAberto} size="sm" className={cn("shrink-0", aberto && "bg-primary text-primary-foreground")} title={aberto ? "Fechar" : "Abrir"}>
                  <Play className="h-3.5 w-3.5" />
                </Toggle>
                <Toggle pressed={wireframe} onPressedChange={setWireframe} size="sm" className="shrink-0" title="Wireframe"><BoxIcon className="h-3.5 w-3.5" /></Toggle>
                <Toggle pressed={showGrid} onPressedChange={setShowGrid} size="sm" className="shrink-0" title="Grid"><Grid3x3 className="h-3.5 w-3.5" /></Toggle>
                <Toggle pressed={showCotas} onPressedChange={setShowCotas} size="sm" className="shrink-0" title="Cotas"><Ruler className="h-3.5 w-3.5" /></Toggle>
                <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="h-7 w-7 shrink-0 cursor-pointer rounded border border-border bg-transparent" title="Cor de fundo" disabled={ambiente === "noite"} />
              </div>
            </div>
            <div className="h-[320px] sm:h-[420px] lg:h-[520px] touch-none">
              <Visualizador3DClient
                pecas={projeto.pecas}
                tipologia={pecaSel.tipologia}
                largura_mm={pecaSel.largura_mm}
                altura_mm={pecaSel.altura_mm}
                cor={pecaSel.cor}
                autoRotate={autoRotate}
                wireframe={wireframe}
                showGrid={showGrid}
                showCotas={showCotas}
                bgColor={bgColor}
                preset={preset}
                ambiente={ambiente}
                showPessoa={showPessoa}
                showCarro={showCarro}
                abertura={aberto ? 1 : 0}
                selecionadaId={pecaSel?.id}
                onSelecionar={(id) => setPecaSelId(id)}
                onCanvasReady={(c) => { canvasRef.current = c; }}
              />
            </div>
          </div>

          {/* Resumo */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <CardResumo label="Total geral" valor={formatarBRL(totalAnimado)} highlight />
            <CardResumo label="Materiais" valor={formatarBRL(resultado.totalMateriais)} />
            <CardResumo label="Metragem perfil" valor={`${resultado.resumo.metragemPerfil.toFixed(2)} m`} />
            <CardResumo label="Peso estimado" valor={`${resultado.resumo.pesoEstimado.toFixed(1)} kg`} />
          </div>

          {/* Percentuais */}
          <div className="surface-card rounded-lg border border-border p-4">
            <div className="mb-3 flex items-center gap-2 font-display text-sm">
              <DollarSign className="h-4 w-4 text-primary" /> Composição do preço
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <SliderPct label="Mão de obra" value={projeto.maoObraPct} onChange={(v) => upd("maoObraPct", v)} />
              <SliderPct label="Margem" value={projeto.margemPct} onChange={(v) => upd("margemPct", v)} />
              <SliderPct label="Desconto geral" value={projeto.descontoGeralPct} onChange={(v) => upd("descontoGeralPct", v)} max={50} />
            </div>
          </div>



          {/* Tabs */}
          <Tabs defaultValue="materiais">
            <TabsList className="overflow-x-auto w-max min-w-full justify-start">
              <TabsTrigger value="materiais">Materiais</TabsTrigger>
              <TabsTrigger value="corte">Plano de corte</TabsTrigger>
              <TabsTrigger value="producao">Produção</TabsTrigger>
              <TabsTrigger value="orcamento">Orçamento</TabsTrigger>
            </TabsList>

            {/* Materiais */}
            <TabsContent value="materiais" className="surface-card rounded-lg border border-border p-4 space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase text-muted-foreground">
                      <th className="text-left py-2 pr-2">Item</th>
                      <th className="text-right py-2 pr-2 w-24">Qtd</th>
                      <th className="text-left py-2 pr-2 w-16">Un</th>
                      <th className="text-right py-2 pr-2 w-32">Preço un.</th>
                      <th className="text-right py-2 pr-2 w-24">% desc</th>
                      <th className="text-right py-2 pr-2 w-32">Total</th>
                      <th className="w-20"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultado.custos.filter((i) => !["mao_obra", "margem", "desconto", "extra"].includes(i.categoria)).map((it) => (
                      <tr key={it.key} className={cn("border-b border-border/40", it.oculto && "opacity-40")}>
                        <td className="py-1.5 pr-2">
                          <div className="font-medium">
                            {it.peca && projeto.pecas.length > 1 && (
                              <span className="mr-1 text-[10px] uppercase text-muted-foreground">{it.peca} ·</span>
                            )}
                            {it.descricao}
                          </div>
                          {it.codigo && <div className="text-[10px] text-muted-foreground">{it.codigo}</div>}
                        </td>
                        <td className="py-1.5 pr-2"><Input className="h-8 text-right" mask="decimal" value={String(it.qtd).replace(".", ",")} onChange={(e) => setOverride(it.key, { qtd: numeroMascarado(e.target.value) })} /></td>
                        <td className="py-1.5 pr-2 text-muted-foreground">{it.unidade}</td>
                        <td className="py-1.5 pr-2"><Input className="h-8 text-right" mask="moeda" value={String(it.precoUnit).replace(".", ",")} onChange={(e) => setOverride(it.key, { precoUnit: numeroMascarado(e.target.value) })} /></td>
                        <td className="py-1.5 pr-2"><Input className="h-8 text-right" mask="inteiro" value={it.descontoPct} onChange={(e) => setOverride(it.key, { descontoPct: Math.min(100, Number(e.target.value)) })} /></td>
                        <td className="py-1.5 pr-2 text-right font-medium">{formatarBRL(it.total)}</td>
                        <td className="py-1.5 text-right">
                          <Button size="icon" variant="soft" className="h-7 w-7" onClick={() => setOverride(it.key, { oculto: !it.oculto })} title={it.oculto ? "Mostrar" : "Ocultar"}>
                            {it.oculto ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                          </Button>
                          {it.override && (
                            <Button size="icon" variant="soft" className="h-7 w-7" onClick={() => resetOverride(it.key)} title="Resetar override">
                              <RefreshCw className="h-3.5 w-3.5 text-warning" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Extras */}
              <div className="border-t border-border pt-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-display text-sm">Itens extras</h3>
                  <Button size="sm" variant="outline" onClick={addExtra}>
                    <Plus className="mr-1 h-3.5 w-3.5" /> Adicionar
                  </Button>
                </div>
                {projeto.extras.length === 0 && (
                  <p className="text-xs text-muted-foreground">Adicione frete, instalação, taxas, etc.</p>
                )}
                <div className="space-y-2">
                  {projeto.extras.map((ex) => (
                    <div key={ex.id} className="grid grid-cols-12 gap-2 items-center">
                      <Input className="h-8 col-span-12 sm:col-span-5" placeholder="Descrição" value={ex.descricao} onChange={(e) => updExtra(ex.id, { descricao: e.target.value })} />
                      <Input className="h-8 col-span-3 sm:col-span-2 text-right" mask="decimal" value={String(ex.qtd).replace(".", ",")} onChange={(e) => updExtra(ex.id, { qtd: numeroMascarado(e.target.value) })} />
                      <Input className="h-8 col-span-3 sm:col-span-1" placeholder="un" value={ex.unidade} onChange={(e) => updExtra(ex.id, { unidade: e.target.value })} />
                      <Input className="h-8 col-span-4 sm:col-span-3 text-right" mask="moeda" placeholder="0,00" value={String(ex.precoUnit).replace(".", ",")} onChange={(e) => updExtra(ex.id, { precoUnit: numeroMascarado(e.target.value) })} />
                      <Button size="icon" variant="dangerOutline" title="Excluir" className="col-span-2 sm:col-span-1" onClick={() => delExtra(ex.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Plano de corte */}
            <TabsContent value="corte" className="surface-card rounded-lg border border-border p-4">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase text-muted-foreground">
                      <th className="text-left py-2 pr-2">Cód.</th>
                      <th className="text-left py-2 pr-2">Descrição</th>
                      <th className="text-right py-2 pr-2">Comp. (cm)</th>
                      <th className="text-right py-2 pr-2">Qtd</th>
                      <th className="text-right py-2 pr-2">Total (cm)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultado.cortes.map((c, i) => (
                      <tr key={i} className="border-b border-border/40">
                        <td className="py-1.5 pr-2 font-mono text-xs">{c.codigo}</td>
                        <td className="py-1.5 pr-2">{c.descricao}</td>
                        <td className="py-1.5 pr-2 text-right">{cm(c.comprimento_mm)}</td>
                        <td className="py-1.5 pr-2 text-right">{c.qtd}</td>
                        <td className="py-1.5 pr-2 text-right font-medium">{cm(c.comprimento_mm * c.qtd)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            {/* Produção */}
            <TabsContent value="producao" className="surface-card rounded-lg border border-border p-4 space-y-5">
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <CardResumo label="Barras a comprar" valor={planoCorte.totalBarras.toString()} />
                <CardResumo label="Aproveitamento" valor={`${planoCorte.aproveitamentoMedioPct}%`} />
                <CardResumo label="Soldas" valor={planoProducao.soldas.reduce((s, x) => s + x.qtd, 0).toString()} />
                <CardResumo label="Etapas" valor={planoProducao.sequencia.length.toString()} />
              </div>

              <div className="flex items-center gap-2">
                <Label className="shrink-0">Tamanho da barra</Label>
                <Select value={String(barraMm)} onValueChange={(v) => setBarraMm(Number(v))}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[3000, 5000, 6000, 12000].map((n) => <SelectItem key={n} value={String(n)}>{cm(n)} cm</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button size="sm" variant="outline" className="ml-auto" onClick={exportarOP}>
                  <FileText className="mr-1 h-4 w-4" /> Gerar OP (PDF)
                </Button>
              </div>

              {/* Mapa de corte visual */}
              <div className="space-y-4">
                {planoCorte.perfis.map((perf) => (
                  <div key={perf.codigo}>
                    <div className="flex items-baseline justify-between text-xs mb-1">
                      <span className="font-mono">{perf.codigo}</span>
                      <span className="text-muted-foreground">{perf.totalBarras} barra(s) · {perf.aproveitamentoPct}% aprov · perda {perf.perda_m}m</span>
                    </div>
                    <div className="space-y-1">
                      {perf.barras.map((b) => (
                        <div key={b.numero} className="flex items-center gap-2">
                          <span className="text-[10px] w-12 text-muted-foreground shrink-0">B{b.numero}</span>
                          <div className="flex h-6 flex-1 overflow-hidden rounded border border-border">
                            {b.pecas.map((p, i) => {
                              const w = (p.comprimento_mm / perf.barraMm) * 100;
                              return (
                                <div
                                  key={p.id}
                                  className="flex items-center justify-center text-[9px] text-white font-medium border-r border-background/30"
                                  style={{ width: `${w}%`, backgroundColor: PALETA_BARRAS[i % PALETA_BARRAS.length] }}
                                  title={`${p.id} · ${p.descricao} · ${cm(p.comprimento_mm)} cm`}
                                >
                                  {w > 6 ? p.id : ""}
                                </div>
                              );
                            })}
                            <div className="bg-muted flex-1" title={`Sobra ${cm(b.sobra_mm)} cm`} />
                          </div>
                          <span className="text-[10px] text-muted-foreground w-16 text-right shrink-0">↳ {cm(b.sobra_mm)} cm</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Soldas */}
              <div>
                <h3 className="font-display text-sm mb-2 flex items-center gap-2"><Wrench className="h-4 w-4 text-primary" /> Mapa de soldas</h3>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[480px] text-sm">
                    <thead>
                      <tr className="border-b border-border text-xs uppercase text-muted-foreground">
                        <th className="text-left py-2 pr-2">Junta</th>
                        <th className="text-left py-2 pr-2">Tipo</th>
                        <th className="text-right py-2 pr-2">Qtd</th>
                        <th className="text-left py-2 pr-2">Obs</th>
                      </tr>
                    </thead>
                    <tbody>
                      {planoProducao.soldas.map((s, i) => (
                        <tr key={i} className="border-b border-border/40">
                          <td className="py-1.5 pr-2">{s.descricao}</td>
                          <td className="py-1.5 pr-2"><BadgeSolda tipo={s.tipo} /></td>
                          <td className="py-1.5 pr-2 text-right">{s.qtd}</td>
                          <td className="py-1.5 pr-2 text-xs text-muted-foreground">{s.observacao || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sequência */}
              <div>
                <h3 className="font-display text-sm mb-2">Sequência de montagem</h3>
                <div className="space-y-2">
                  {planoProducao.sequencia.map((s, i) => (
                    <div key={i} className="flex items-start gap-3 rounded border border-border p-2.5">
                      <div className="grid h-6 w-6 place-items-center rounded-full bg-gradient-orange text-primary-foreground text-xs font-bold shrink-0">
                        {i + 1}
                      </div>
                      <p className="text-sm">{s}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ferramentas */}
              <div>
                <h3 className="font-display text-sm mb-2">Ferramentas / EPI</h3>
                <div className="grid gap-1.5 sm:grid-cols-2">
                  {planoProducao.ferramentas.map((f, i) => (
                    <label key={i} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" className="h-3.5 w-3.5 accent-primary" /> {f}
                    </label>
                  ))}
                </div>
              </div>

              {/* Observações */}
              {planoProducao.observacoes.length > 0 && (
                <div className="rounded border border-warning/30 bg-warning/10 p-3 text-sm">
                  <h3 className="font-display text-xs uppercase text-warning mb-1">Observações</h3>
                  <ul className="list-disc list-inside space-y-1 text-foreground/90">
                    {planoProducao.observacoes.map((o, i) => <li key={i}>{o}</li>)}
                  </ul>
                </div>
              )}
            </TabsContent>

            {/* Orçamento */}
            <TabsContent value="orcamento" className="surface-card rounded-lg border border-border p-4 space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase text-muted-foreground">
                      <th className="text-left py-2 pr-2">Categoria</th>
                      <th className="text-left py-2 pr-2">Descrição</th>
                      <th className="text-right py-2 pr-2">Qtd</th>
                      <th className="text-right py-2 pr-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultado.custos.filter((i) => !i.oculto).map((it) => (
                      <tr key={it.key} className="border-b border-border/40">
                        <td className="py-1.5 pr-2 text-xs uppercase text-muted-foreground">{it.categoria.replace("_", " ")}</td>
                        <td className="py-1.5 pr-2">{it.descricao}</td>
                        <td className="py-1.5 pr-2 text-right">{it.qtd} {it.unidade}</td>
                        <td className="py-1.5 pr-2 text-right font-medium">{formatarBRL(it.total)}</td>
                      </tr>
                    ))}
                    <tr className="bg-card">
                      <td colSpan={3} className="py-3 pr-2 text-right font-display text-sm uppercase">Total geral</td>
                      <td className="py-3 pr-2 text-right font-display text-xl text-gradient-orange">{formatarBRL(resultado.totalGeral)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={exportarOrcamento} className="bg-gradient-orange text-primary-foreground shadow-orange">
                  <FileSpreadsheet className="mr-2 h-4 w-4" /> Gerar PDF do orçamento
                </Button>
                <Button variant="outline" onClick={exportarOP}>
                  <FileText className="mr-2 h-4 w-4" /> Gerar PDF da OP
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      {financeiroAberto && (
        <DialogOrdemFinanceiro projeto={projeto} foco="comprovante" onClose={() => setFinanceiroAberto(false)} />
      )}
    </div>
  );
}

// ---------- helpers visuais ----------

function CardResumo({ label, valor, highlight }: { label: string; valor: string; highlight?: boolean }) {
  return (
    <div className={cn(
      "rounded-lg border border-border p-3",
      highlight ? "bg-gradient-orange text-primary-foreground shadow-orange border-transparent" : "surface-card",
    )}>
      <div className={cn("text-[10px] uppercase tracking-wider", highlight ? "text-primary-foreground/80" : "text-muted-foreground")}>
        {label}
      </div>
      <div className={cn("font-display mt-1", highlight ? "text-2xl" : "text-lg")}>{valor}</div>
    </div>
  );
}

function SliderMm({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  const [texto, setTexto] = useState<string | null>(null);
  const exibido = texto ?? String(mmParaCm(value));
  const maxCm = mmParaCm(max);

  const confirmar = () => {
    const n = Number(String(exibido).replace(",", "."));
    if (Number.isFinite(n) && n > 0 && exibido.trim() !== "") {
      // Digitou um número grande demais para centímetros? Interpreta como milímetros.
      const mm = n > maxCm ? Math.round(n) : cmParaMm(n);
      onChange(mm);
    }
    setTexto(null);
  };

  const sliderMax = Math.max(max, value);
  const sliderMin = Math.min(min, value);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <Label>{label}</Label>
        <div className="flex items-center gap-1">
          <Input
            type="text"
            inputMode="decimal"
            className="h-7 w-24 text-right text-xs"
            value={exibido}
            mask="decimal"
            onChange={(e) => setTexto(e.target.value)}
            onFocus={(e) => e.currentTarget.select()}
            onBlur={confirmar}
            onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
          />
          <span className="text-[10px] text-muted-foreground">cm</span>
        </div>
      </div>
      <Slider min={sliderMin} max={sliderMax} step={10} value={[value]} onValueChange={([v]) => { setTexto(null); onChange(v); }} />
      <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
        <span>{cm(sliderMin)} cm</span><span>{cm(sliderMax)} cm</span>
      </div>
    </div>
  );
}

function SliderPct({ label, value, onChange, max = 100 }: { label: string; value: number; onChange: (v: number) => void; max?: number }) {
  const [texto, setTexto] = useState<string | null>(null);
  const exibido = texto ?? String(value);

  const confirmar = () => {
    const n = Number(String(exibido).replace(",", "."));
    if (Number.isFinite(n) && exibido.trim() !== "") {
      onChange(Math.min(max, Math.max(0, n)));
    }
    setTexto(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <Label>{label}</Label>
        <Input
          type="text"
          inputMode="decimal"
          className="h-7 w-16 text-right text-xs"
          value={exibido}
          mask="decimal"
          onChange={(e) => setTexto(e.target.value)}
          onFocus={(e) => e.currentTarget.select()}
          onBlur={confirmar}
          onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
        />
      </div>
      <Slider min={0} max={max} step={1} value={[value]} onValueChange={([v]) => { setTexto(null); onChange(v); }} />
    </div>
  );
}

function BadgeSolda({ tipo }: { tipo: string }) {
  const cores: Record<string, string> = {
    MIG: "bg-primary/20 text-primary border-primary/30",
    TIG: "bg-success/20 text-success border-success/30",
    Eletrodo: "bg-warning/20 text-warning border-warning/30",
    Ponteamento: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span className={cn("inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase", cores[tipo] ?? cores.Ponteamento)}>
      {tipo}
    </span>
  );
}
