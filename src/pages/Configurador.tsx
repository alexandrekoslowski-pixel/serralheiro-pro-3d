import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Save, Download, Settings2, DollarSign, Send, FileSignature, Loader2,
  RotateCw, Box as BoxIcon, Grid3x3, Ruler, Plus, Trash2, RefreshCw, EyeOff, Eye,
  Wrench, FileText, FileSpreadsheet, Sun, Moon, User, Car, Play,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { useMeuNome } from "@/hooks/useMeuNome";
import { type Cliente, type Material, listarClientes, listarMateriais, nomeClienteValido, sincronizarClienteDoOrcamento } from "@/lib/gestao";

import {
  TIPOLOGIAS, ACABAMENTOS, AcabamentoId, TipologiaId, tipologiaPorId,
} from "@/lib/tipologias";
import {
  ProjetoLocal, Peca, obterProjeto, salvarProjeto, nomeSugeridoOrcamento,
  obterEmpresa, obterCatalogo, formatarBRL, gerarId, listarPagamentos,
  categoriaNomePeca, renumerarNomesAutomaticosPecas,
} from "@/lib/storage";
import { progressoOrcamento, pendenciasOrdem } from "@/lib/progressoOrcamento";
import { valorACobrar } from "@/lib/financeiro";

import { TrilhaOrcamento } from "@/components/TrilhaOrcamento";
import { PassosOrcamento } from "@/components/PassosOrcamento";
import { DialogOrdemFinanceiro } from "@/components/DialogOrdemFinanceiro";
import { STATUS_LABEL, somarDias } from "@/lib/ordens";
import { abrirWhatsApp, linkWhatsApp, numeroWhatsApp, textoContrato, textoOrcamento } from "@/lib/whatsapp";
import {
  FIXACAO_TIPOS, FIXACAO_LADOS, FIXACAO_PADRAO, FIXACAO_LADOS_PADRAO,
  FixacaoTipo, FixacaoLados, pontosFixacao, fixacaoTipo,
} from "@/lib/fixacao";
import { calcularProjeto, ItemExtra, ItemOverride } from "@/lib/calculator";
import { planejarCorte, planejarProducao } from "@/lib/producao";
import { gerarOrcamentoPDF } from "@/lib/pdf";
import {
  FRETE_MINIMO, SERVICOS_POLITICA, SERVICO_MINIMO, servicoTemMinimo, AUTOMACOES_POLITICA, UNIDADE_LABEL, politicaComValores,
  precoPeca, produtosPolitica, modelosPolitica, totalPecasPolitica, totalPeca,
  precoAutomacaoPeca, precoMotorPeca, precoMotorSugerido, tipologiaDoItem, automacaoPolitica,
  porteMotorRecomendado, porteDoMotor, motorSubdimensionado,
} from "@/lib/politicaPrecos";
import { gerarOrdemProducaoPDF } from "@/lib/pdfProducao";
import { cm, mmParaCm, cmParaMm } from "@/lib/medidas";
import { pendentesComunsChecklist, pendentesPecaChecklist } from "@/lib/checklistPedido";
import { numeroMascarado, nomeProprio, cidadeUf, emailNormalizado, frasePrimeiraMaiuscula } from "@/lib/mascaras";
import { publicarContratoPDF, publicarOrcamentoPDF } from "@/lib/orcamentoPdfEnvio";
import { buscarCep } from "@/lib/cep";
import { gerarContratoPDF } from "@/lib/pdfContrato";
import { useSessao } from "@/lib/sessao";

/** Desenho 3D temporariamente desativado — mude para true para religar. */
const MOSTRAR_3D = false;

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
  const campoNumero = useRef<HTMLInputElement | null>(null);

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
  const [sugestoesAbertas, setSugestoesAbertas] = useState(false);
  const abrirChecklist = Boolean((location.state as { abrirChecklist?: boolean } | null)?.abrirChecklist);
  const [abaCadastro, setAbaCadastro] = useState(abrirChecklist ? "checklist" : "cliente");
  const [mostrarPendencias, setMostrarPendencias] = useState(abrirChecklist);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [ajustandoValor, setAjustandoValor] = useState(false);

  const [enviandoWhats, setEnviandoWhats] = useState(false);
  const [enviandoContrato, setEnviandoContrato] = useState(false);
  const [financeiroAberto, setFinanceiroAberto] = useState(false);
  const [pendenciasFila, setPendenciasFila] = useState<string[] | null>(null);
  const { session, papel } = useSessao();
  const podeVerCustos = papel === "gestor";
  const digitosDocumento = (projeto?.cliente_documento ?? "").replace(/\D/g, "").length;
  const documentoIncompleto = digitosDocumento > 0 && digitosDocumento !== 11 && digitosDocumento !== 14;
  const digitosTelefone = (projeto?.cliente_telefone ?? "").replace(/\D/g, "").length;
  const telefoneIncompleto = digitosTelefone > 0 && digitosTelefone < 10;

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
  const meuNome = useMeuNome();

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

  // ---- preço pela política da Kochinski ----
  const politica = useMemo(() => politicaComValores(empresa.politicaValores), [empresa.politicaValores]);
  const margemMotor = empresa.margemMotorPct ?? 30;
  const totalPecas = useMemo(
    () => (projeto ? totalPecasPolitica(projeto.pecas, politica, margemMotor) : 0),
    [projeto, politica, margemMotor],
  );

  // Motores e kits cadastrados em Materiais, para escolher na peça
  const [motores, setMotores] = useState<Material[]>([]);
  const [buscaMotor, setBuscaMotor] = useState("");
  const [motorAberto, setMotorAberto] = useState<Record<string, boolean>>({});
  useEffect(() => {
    let vivo = true;
    void listarMateriais()
      .then((lista) => {
        if (!vivo) return;
        setMotores(lista.filter((m) => m.ativo !== false && ["automatizadores", "kits-basculantes"].includes(m.categoria)));
      })
      .catch(() => undefined);
    return () => { vivo = false; };
  }, []);

  const servicosEscolhidos = projeto?.servicos_politica ?? [];
  const servicosTotal = servicosEscolhidos.reduce((s, x) => s + Number(x.valor || 0), 0);
  const totalProposta = Number((totalPecas + servicosTotal + (projeto?.frete_valor ?? 0)).toFixed(2));

  // Auto-save 800ms
  useEffect(() => {
    if (!projeto || !resultado) return;
    setSalvo(false);
    setSalvando(true);
    const t = setTimeout(() => {
      salvarProjeto({ ...projeto, total: totalPecas, servicos_valor: servicosTotal || null });
      setSalvando(false);
      setSalvo(true);
    }, 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projeto, totalPecas, servicosTotal]);

  // Sugestões de clientes já cadastrados enquanto digita o nome
  const sugestoesCliente = useMemo(() => {
    const termo = (projeto?.cliente ?? "").trim().toLowerCase();
    const base = termo ? clientes.filter((c) => c.nome.toLowerCase().includes(termo)) : clientes;
    return base.slice(0, 6);
  }, [clientes, projeto?.cliente]);

  // Cadastra/atualiza a ficha do cliente automaticamente a partir do orçamento
  const chaveCliente = projeto
    ? [
      projeto.cliente, projeto.cliente_documento, projeto.cliente_telefone, projeto.cliente_email,
      projeto.cliente_endereco, projeto.cliente_bairro, projeto.cliente_cidade, projeto.cliente_cep,
    ].join("|")
    : "";
  const ultimaChaveCliente = useRef<string | null>(null);

  useEffect(() => {
    if (!projeto || !nomeClienteValido(projeto.cliente)) return;
    if (ultimaChaveCliente.current === chaveCliente) return;
    const t = window.setTimeout(() => {
      ultimaChaveCliente.current = chaveCliente;
      void sincronizarClienteDoOrcamento({
        cliente_id: projeto.cliente_id,
        cliente: projeto.cliente,
        cliente_documento: projeto.cliente_documento,
        cliente_email: projeto.cliente_email,
        cliente_telefone: projeto.cliente_telefone,
        cliente_endereco: projeto.cliente_endereco,
        cliente_bairro: projeto.cliente_bairro,
        cliente_cidade: projeto.cliente_cidade,
        cliente_cep: projeto.cliente_cep,
      })
        .then((idCliente) => {
          if (!idCliente) return;
          setProjeto((atual) => (atual && atual.cliente_id !== idCliente ? { ...atual, cliente_id: idCliente } : atual));
          void listarClientes().then(setClientes).catch(() => undefined);
        })
        .catch(() => undefined);
    }, 1500);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chaveCliente]);

  // Mantém um título curto e útil enquanto a vendedora não escolher um nome próprio.
  useEffect(() => {
    if (!projeto || projeto.nome_manual) return;
    const sugerido = nomeSugeridoOrcamento(projeto);
    if (projeto.nome !== sugerido) setProjeto({ ...projeto, nome: sugerido });
  }, [projeto]);

  const totalAnimado = useAnimatedNumber(totalProposta);

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

  // Para o cliente, o total vem da política de preços (não do custo de materiais).
  const resultadoCliente = { ...resultado, totalGeral: totalPecas };

  // ---- peças do orçamento ----
  const pecaSel: Peca = projeto.pecas.find((x) => x.id === pecaSelId) ?? projeto.pecas[0];
  const tip = tipologiaPorId(pecaSel.tipologia);
  const precoSel = precoPeca(pecaSel, politica);
  const automacaoSel = precoAutomacaoPeca(pecaSel);
  const motorSel = precoMotorPeca(pecaSel, margemMotor);
  const totalPecaSel = totalPeca(pecaSel, politica, margemMotor);
  // Motor do basculante: porte recomendado pelo vão e lista com os compatíveis primeiro.
  const porteRecomendado = porteMotorRecomendado(pecaSel.largura_mm, pecaSel.altura_mm);
  const motorEscolhido = motores.find((m) => m.id === pecaSel.motor_material_id);
  const motorAbaixoDoVao = motorSubdimensionado(
    pecaSel.largura_mm, pecaSel.altura_mm, motorEscolhido?.porte_motor ?? pecaSel.motor_porte,
  );
  const mostrarMotor = !!pecaSel.motor_material_id || !!motorAberto[pecaSel.id];
  const compativel = (m: Material) => {
    const porte = porteDoMotor(m.porte_motor);
    if (!porte) return false;
    return porteRecomendado === "1/4" ? true : porte === "1/2";
  };
  const motoresFiltrados = (buscaMotor.trim()
    ? motores.filter((m) => m.nome.toLowerCase().includes(buscaMotor.trim().toLowerCase()))
    : motores)
    .slice()
    .sort((a, b) => Number(compativel(b)) - Number(compativel(a)))
    .slice(0, 60);

  const updPeca = (patch: Partial<Peca>) =>
    setProjeto({
      ...projeto,
      pecas: projeto.pecas.map((x) => (x.id === pecaSel.id ? { ...x, ...patch } : x)),
    });

  /** Troca o item da tabela: ajusta a tipologia técnica e limpa o valor manual. */
  const escolherPolitica = (id: string) => {
    const tipoNovo = tipologiaDoItem(id, politica) as TipologiaId | undefined;
    const patch: Partial<Peca> = { politica_id: id, preco_manual: null };
    if (tipoNovo && tipoNovo !== pecaSel.tipologia) {
      const novo = tipologiaPorId(tipoNovo);
      patch.tipologia = tipoNovo;
      patch.largura_mm = Math.min(Math.max(pecaSel.largura_mm, novo.larguraMin), novo.larguraMax);
      patch.altura_mm = Math.min(Math.max(pecaSel.altura_mm, novo.alturaMin), novo.alturaMax);
    }
    setProjeto({
      ...projeto,
      pecas: renumerarNomesAutomaticosPecas(
        projeto.pecas.map((x) => x.id === pecaSel.id ? { ...x, ...patch } : x),
      ),
    });
  };


  const addPeca = () => {
    const t = tipologiaPorId(pecaSel.tipologia);
    const nova: Peca = {
      id: gerarId(),
      nome: categoriaNomePeca(pecaSel.tipologia),
      tipologia: pecaSel.tipologia,
      largura_mm: t.larguraDefault,
      altura_mm: t.alturaDefault,
      cor: pecaSel.cor,
      fixacao: pecaSel.fixacao ?? FIXACAO_PADRAO,
      fixacaoLados: pecaSel.fixacaoLados ?? FIXACAO_LADOS_PADRAO,
      checklist_respostas: {},
    };
    setProjeto({ ...projeto, pecas: renumerarNomesAutomaticosPecas([...projeto.pecas, nova]) });
    setPecaSelId(nova.id);
  };

  const duplicarPeca = () => {
    const nova: Peca = {
      ...pecaSel,
      id: gerarId(),
      nome: categoriaNomePeca(pecaSel.tipologia),
      checklist_respostas: { ...pecaSel.checklist_respostas },
    };
    setProjeto({ ...projeto, pecas: renumerarNomesAutomaticosPecas([...projeto.pecas, nova]) });
    setPecaSelId(nova.id);
  };

  const delPeca = (id: string) => {
    if (projeto.pecas.length <= 1) { toast.error("O orçamento precisa de ao menos uma peça"); return; }
    const restantes = renumerarNomesAutomaticosPecas(projeto.pecas.filter((x) => x.id !== id));
    setProjeto({
      ...projeto,
      pecas: restantes,
      overrides: Object.fromEntries(Object.entries(projeto.overrides).filter(([k]) => !k.startsWith(`${id}::`))),
    });
    if (pecaSelId === id) setPecaSelId(restantes[0].id);
  };

  const upd = <K extends keyof ProjetoLocal>(k: K, v: ProjetoLocal[K]) =>
    setProjeto({ ...projeto, [k]: v });

  /** Arruma o texto do campo ao sair dele (maiúsculas, espaços, etc.). */
  const arrumar = (k: keyof ProjetoLocal, fn: (v: string) => string) => (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const limpo = fn(e.target.value ?? "");
    if (limpo !== (e.target.value ?? "")) upd(k, limpo as never);
  };

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

  const aplicar = (patch: Partial<ProjetoLocal>) => {
    const atualizado: ProjetoLocal = { ...projeto, total: totalPecas, servicos_valor: servicosTotal || null, ...patch };
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
      etapa: "medicao",
      etapa_em: agora,
      prazo_entrega: projeto.prazo_entrega ?? somarDias(empresa.prazoPadraoDias),
    });
    toast.success("Orçamento aprovado — gere o contrato e siga os passos");
  };

  const liberarOficina = () => {
    const agora = new Date().toISOString();
    aplicar({
      status: projeto.status === "orcamento" ? "aprovado" : projeto.status,
      aprovado_em: projeto.aprovado_em ?? agora,
      aguardando_oficina: false,
      etapa: "medicao",
      etapa_em: agora,
      prazo_entrega: projeto.prazo_entrega ?? somarDias(empresa.prazoPadraoDias),
    });
    toast.success("Ordem liberada para a oficina");
  };

  const mandarParaOficina = () => {
    const faltas = pendenciasOrdem(projeto, listarPagamentos(projeto.id));
    if (faltas.length > 0) { setPendenciasFila(faltas); return; }
    liberarOficina();
  };

  const exportarOrcamento = () => {
    const atualizado = aplicar({ orcamento_pdf_em: new Date().toISOString() });
    gerarOrcamentoPDF(atualizado, resultadoCliente, empresa);
    toast.success("Orçamento gerado");
  };

  const enviarContrato = async () => {
    const numero = numeroWhatsApp(projeto.cliente_telefone);
    if (!numero) {
      toast.error("Cadastre o telefone/WhatsApp do cliente para enviar o contrato");
      setAbaCadastro("cliente");
      return;
    }
    // Abre a aba antes do upload para não ser bloqueada pelo navegador.
    const aba = window.open("about:blank", "_blank");
    setEnviandoContrato(true);
    const atualizado = aplicar({ contrato_pdf_em: new Date().toISOString() });
    let link: string | undefined;
    try {
      const publicado = await publicarContratoPDF(atualizado, empresa);
      link = publicado.link;
      // Também baixa o PDF para a vendedora ter o arquivo em mãos.
      const url = URL.createObjectURL(publicado.blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `contrato-${projeto.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.warning("Não consegui subir o PDF — anexe o contrato na conversa");
      gerarContratoPDF(atualizado, empresa);
    } finally {
      setEnviandoContrato(false);
    }
    const texto = textoContrato(atualizado, empresa, link);
    if (aba) aba.location.href = linkWhatsApp(numero, texto);
    else abrirWhatsApp(numero, texto);
    toast.success(link ? "WhatsApp aberto com o contrato no texto" : "WhatsApp aberto");
  };

  const marcarEnviado = async () => {
    const numero = numeroWhatsApp(projeto.cliente_telefone);
    if (!numero) {
      toast.error("Cadastre o telefone/WhatsApp do cliente para enviar");
      setAbaCadastro("cliente");
      return;
    }
    // Abre a aba antes do envio do arquivo para não ser bloqueada pelo navegador.
    const aba = window.open("about:blank", "_blank");
    setEnviandoWhats(true);
    let link: string | undefined;
    try {
      link = await publicarOrcamentoPDF(projeto, resultadoCliente, empresa);
    } catch {
      toast.warning("Não consegui subir o PDF — anexe o arquivo na conversa");
    } finally {
      setEnviandoWhats(false);
    }
    const url = linkWhatsApp(numero, textoOrcamento(projeto, totalProposta, empresa, link));
    if (aba) aba.location.href = url;
    else abrirWhatsApp(numero, textoOrcamento(projeto, totalProposta, empresa, link));
    const agora = new Date().toISOString();
    const nome = meuNome || projeto.vendedora || session?.user.email || "";
    aplicar({
      enviado_em: agora,
      enviado_por_nome: nome,
      followup_status: "aguardando" as const,
      followup_em: null,
      orcamento_pdf_em: projeto.orcamento_pdf_em ?? agora,
    });
    toast.success(link ? "WhatsApp aberto com o PDF no texto" : "WhatsApp aberto");
  };

  const consultarCep = async (cep: string) => {
    if (cep.replace(/\D/g, "").length !== 8) return;
    setBuscandoCep(true);
    try {
      const endereco = await buscarCep(cep);
      setProjeto({ ...projeto, cliente_endereco: endereco.logradouro || projeto.cliente_endereco, cliente_bairro: endereco.bairro || projeto.cliente_bairro, cliente_cidade: endereco.cidadeUf || projeto.cliente_cidade });
      toast.success("Endereço preenchido pelo CEP");
      setTimeout(() => campoNumero.current?.focus(), 50);
    } catch (erro) { toast.error(erro instanceof Error ? erro.message : "CEP não encontrado"); }
    finally { setBuscandoCep(false); }
  };



  const exportarOP = () => {
    gerarOrdemProducaoPDF(projeto, planoCorte, planoProducao);
    toast.success("Ordem de produção gerada");
  };

  return (
    <div className="container space-y-4 py-4 md:pb-28 md:pt-6">
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
            ocupado={enviandoWhats ? "enviar" : enviandoContrato ? "contrato" : null}
            onPasso={(id) => {
              if (id === "orcamento") exportarOrcamento();
              else if (id === "enviar") void marcarEnviado();
              else if (id === "aprovar") aprovar();
              else if (id === "contrato") void enviarContrato();
              else if (id === "comprovante") setFinanceiroAberto(true);
              else mandarParaOficina();
            }}
          />
          <Button variant="outline" size="sm" className="shrink-0" onClick={() => { salvarProjeto({ ...projeto, total: totalPecas, servicos_valor: servicosTotal || null }); toast.success("Salvo"); }}>
            <Save className="mr-1 h-4 w-4" /> Salvar
          </Button>
        </div>
      </div>

      {/* Cadastro do orçamento */}
      <div className="surface-card rounded-lg border border-border">
        <Tabs value={abaCadastro} onValueChange={setAbaCadastro}>
          <TabsList className="w-full justify-start overflow-x-auto rounded-b-none border-b border-border bg-transparent p-0">
            <TabsTrigger value="cliente">1 · Cliente</TabsTrigger>
            <TabsTrigger value="checklist">2 · Checklist do pedido</TabsTrigger>
            <TabsTrigger value="ordem">3 · Ordem de serviço</TabsTrigger>
          </TabsList>

          <TabsContent value="cliente" className="mt-0 p-4">
            <div className="form-grid">

              <div className="relative form-field-long">
                <Label className="text-xs">Cliente (nome e sobrenome)</Label>
                <Input
                  ref={clienteNomeRef}
                  className="h-9"
                  value={projeto.cliente}
                  autoComplete="off"
                  onChange={(e) => { upd("cliente", e.target.value); setSugestoesAbertas(true); }}
                  onFocus={(e) => setSugestoesAbertas(e.target.value.trim().length > 0)}
                  onBlur={(e) => {
                    const arrumado = nomeProprio(e.target.value);
                    if (arrumado !== e.target.value) upd("cliente", arrumado);
                    window.setTimeout(() => setSugestoesAbertas(false), 150);
                  }}
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
                               cliente_documento: projeto.cliente_documento || c.documento,
                               cliente_email: projeto.cliente_email || c.email,
                               cliente_telefone: projeto.cliente_telefone || c.telefone || c.whatsapp,
                               cliente_endereco: projeto.cliente_endereco || c.endereco,
                               cliente_bairro: projeto.cliente_bairro || c.bairro,
                               cliente_cidade: projeto.cliente_cidade || c.cidade,
                               cliente_cep: projeto.cliente_cep || c.cep,
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
              <div className="form-field-document">
                <Label className="text-xs">CPF / CNPJ</Label>
                <Input className="h-9" mask="cpfCnpj" inputMode="numeric" value={projeto.cliente_documento ?? ""} onChange={(e) => upd("cliente_documento", e.target.value)} placeholder="000.000.000-00" />
                {documentoIncompleto && <p className="mt-1 text-[11px] text-amber-500">Faltam números para o CPF (11) ou o CNPJ (14).</p>}
              </div>
              <div className="form-field-phone">
                <Label className="text-xs">Telefone / WhatsApp</Label>
                <Input className="h-9" type="tel" mask="telefone" value={projeto.cliente_telefone ?? ""} onChange={(e) => upd("cliente_telefone", e.target.value)} placeholder="(00) 00000-0000" />
                {telefoneIncompleto && <p className="mt-1 text-[11px] text-amber-500">Faltam números — inclua o DDD.</p>}
              </div>
              <div className="form-field-long">
                <Label className="text-xs">E-mail</Label>
                <Input className="h-9" type="email" value={projeto.cliente_email ?? ""} onChange={(e) => upd("cliente_email", e.target.value)} onBlur={arrumar("cliente_email", emailNormalizado)} />
              </div>
              <div className="form-field-cep">
                <Label className="text-xs">CEP</Label>
                <div className="relative">
                  <Input className="h-9" mask="cep" value={projeto.cliente_cep ?? ""} onChange={(e) => upd("cliente_cep", e.target.value)} onBlur={(e) => void consultarCep(e.target.value)} placeholder="00000-000" />
                  {buscandoCep && <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />}
                </div>
              </div>
              <div className="form-field-wide">
                <Label className="text-xs">Rua</Label>
                <Input className="h-9" value={projeto.cliente_endereco ?? ""} onChange={(e) => upd("cliente_endereco", e.target.value)} onBlur={arrumar("cliente_endereco", nomeProprio)} placeholder="Rua / avenida" />
              </div>
              <div className="form-field-number">
                <Label className="text-xs">Número</Label>
                <Input ref={campoNumero} className="h-9" inputMode="numeric" maxLength={10} value={projeto.cliente_numero ?? ""} onChange={(e) => upd("cliente_numero", e.target.value)} placeholder="123" />
              </div>
              <div className="form-field-medium">
                <Label className="text-xs">Complemento</Label>
                <Input className="h-9" maxLength={60} value={projeto.cliente_complemento ?? ""} onChange={(e) => upd("cliente_complemento", e.target.value)} onBlur={arrumar("cliente_complemento", frasePrimeiraMaiuscula)} placeholder="apto, bloco, fundos" />
              </div>
              <div className="form-field-medium">
                <Label className="text-xs">Bairro</Label>
                <Input className="h-9" value={projeto.cliente_bairro ?? ""} onChange={(e) => upd("cliente_bairro", e.target.value)} onBlur={arrumar("cliente_bairro", nomeProprio)} />
              </div>
              <div className="form-field-medium">
                <Label className="text-xs">Cidade/UF</Label>
                <Input className="h-9" value={projeto.cliente_cidade ?? ""} onChange={(e) => upd("cliente_cidade", e.target.value)} onBlur={arrumar("cliente_cidade", cidadeUf)} />
              </div>
              <div className="form-field-full">
                <Label className="text-xs">Local de instalação</Label>
                <Input className="h-9" placeholder="se for outro endereço" value={projeto.local_instalacao ?? ""} onChange={(e) => upd("local_instalacao", e.target.value)} onBlur={arrumar("local_instalacao", nomeProprio)} />
                <p className="mt-1 text-[11px] text-muted-foreground">Deixe vazio se for no endereço do cliente.</p>
              </div>

              <div className="form-field-full border-t border-border pt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Dados do orçamento
              </div>
              <div className="form-field-long">
                <Label className="text-xs">Nome do orçamento</Label>
                <div className="flex gap-2">
                  <Input
                    className="h-9"
                    maxLength={40}
                    value={projeto.nome}
                    onChange={(e) => setProjeto({ ...projeto, nome: e.target.value, nome_manual: true })}
                    onBlur={arrumar("nome", frasePrimeiraMaiuscula)}
                  />
                  {projeto.nome_manual && (
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="h-9 w-9 shrink-0"
                      title="Voltar ao nome automático"
                      onClick={() => setProjeto({ ...projeto, nome_manual: false, nome: nomeSugeridoOrcamento(projeto) })}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">Gerado automaticamente com cliente e peças.</p>
              </div>
              <div className="form-field-medium">
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
                    placeholder="Cadastre a pessoa no menu Equipe"
                    value={projeto.vendedora ?? ""}
                    onChange={(e) => upd("vendedora", e.target.value)}
                  />
                )}
              </div>
              <div className="form-field-number">
                <Label className="text-xs">Prazo (dias úteis)</Label>
                <Input
                  className="h-9"
                  mask="inteiro"
                  placeholder={String(empresa.prazoDiasUteis ?? 22)}
                  value={projeto.prazo_dias_uteis ?? ""}
                  onChange={(e) => upd("prazo_dias_uteis", e.target.value === "" ? null : Math.max(1, Number(e.target.value)))}
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
              extraPeca={(
                <div className="grid gap-4 rounded-lg border border-border p-3 lg:grid-cols-2">
                  <div className="lg:col-span-2 min-w-0">
                    <Label className="text-sm">Cor / acabamento</Label>
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
                    <p className="mt-1 text-[11px] text-muted-foreground">{ACABAMENTOS.find((a) => a.id === pecaSel.cor)?.nome}</p>
                  </div>
                  <div>
                    <Label className="text-sm">Sistema de fixação</Label>
                    <Select value={pecaSel.fixacao ?? FIXACAO_PADRAO} onValueChange={(v) => updPeca({ fixacao: v as FixacaoTipo })}>
                      <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {FIXACAO_TIPOS.map((f) => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm">Lados da fixação</Label>
                    <Select value={pecaSel.fixacaoLados ?? FIXACAO_LADOS_PADRAO} onValueChange={(v) => updPeca({ fixacaoLados: v as FixacaoLados })}>
                      <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {FIXACAO_LADOS.map((f) => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="lg:col-span-2 text-xs text-muted-foreground">
                    {fixacaoTipo(pecaSel.fixacao).instrucao} ·{" "}
                    {pontosFixacao(pecaSel.largura_mm, pecaSel.altura_mm, pecaSel.fixacaoLados)} pontos de fixação.
                  </p>
                </div>
              )}
            />
          </TabsContent>

          <TabsContent value="ordem" className="mt-0 p-4">
            <div className="form-grid">
              <div className="form-field-medium">
                <Label className="text-xs">Situação</Label>
                <div className="flex h-9 items-center rounded-md border border-border bg-muted/40 px-3 text-sm">
                  {STATUS_LABEL[projeto.status]}
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">Muda sozinha conforme os passos.</p>
              </div>
              <div className="form-field-date">
                <Label className="text-xs">Prazo de entrega</Label>
                <Input className="h-9" type="date" value={projeto.prazo_entrega ?? ""} onChange={(e) => upd("prazo_entrega", e.target.value || null)} />
              </div>
              <div className="form-field-money">
                <Label className="text-xs">Valor a cobrar (R$)</Label>
                {ajustandoValor ? (
                  <Input className="h-9" autoFocus mask="moeda" value={String(projeto.valor_faturado || 0).replace(".", ",")} onChange={(e) => upd("valor_faturado", numeroMascarado(e.target.value))} />
                ) : (
                  <div className="flex h-9 items-center rounded-md border border-border bg-muted/40 px-3 text-sm">
                    {formatarBRL(valorACobrar(projeto) || totalProposta)}
                  </div>
                )}
                <Button type="button" size="sm" variant="outline" className="mt-1 h-7 w-full text-[11px]" onClick={() => setAjustandoValor((v) => !v)}>
                  {ajustandoValor ? "Pronto" : "Ajustar (desconto ou acréscimo)"}
                </Button>
              </div>

              <div className="form-field-money">
                <Label className="text-xs">Total orçado</Label>
                <Input className="h-9" readOnly value={formatarBRL(totalProposta)} />
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
          {projeto.pecas.map((pc, i) => {
            const sel = pc.id === pecaSel.id;
            return (
              <div
                key={pc.id}
                onClick={() => setPecaSelId(pc.id)}
                className={cn(
                  "relative min-w-[210px] shrink-0 cursor-pointer rounded-xl border-2 p-3 transition",
                  sel ? "border-primary bg-primary/10 shadow-orange" : "border-border hover:border-primary/40",
                )}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-4 w-4 shrink-0 rounded-full border border-border"
                    style={{ backgroundColor: ACABAMENTOS.find((a) => a.id === pc.cor)?.hex }}
                  />
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Peça {i + 1}</span>
                </div>
                <div className="mt-1 truncate text-sm font-semibold">{pc.nome}</div>
                <div className="truncate text-xs text-muted-foreground">{tipologiaPorId(pc.tipologia).nome}</div>
                <div className="mt-1 text-xs font-medium">{cm(pc.largura_mm)} × {cm(pc.altura_mm)} cm</div>
                {sel && projeto.pecas.length > 1 && (
                  <button
                    type="button"
                    className="absolute right-1.5 top-1.5 rounded p-0.5 text-muted-foreground hover:text-destructive"
                    onClick={(e) => { e.stopPropagation(); delPeca(pc.id); }}
                    title="Remover peça"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Campos da peça escolhida, em blocos */}
        <div className="space-y-4 border-t border-border pt-4">
          <section className="rounded-lg border border-border p-3">
            <h4 className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Produto, medidas e valor</h4>
            <div className="form-grid">
              <div className="form-field-long">
                <Label>Produto</Label>
                <Select
                  value={precoSel.item?.produto ?? ""}
                  onValueChange={(produto) => {
                    const primeiro = modelosPolitica(produto, politica)[0];
                    escolherPolitica(primeiro?.id ?? "");
                  }}
                >
                  <SelectTrigger className="mt-2"><SelectValue placeholder="Escolha o produto" /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    {produtosPolitica(politica).map((pr) => <SelectItem key={pr} value={pr}>{pr}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="form-field-long">
                <Label>Modelo</Label>
                <Select
                  value={pecaSel.politica_id || ""}
                  onValueChange={(v) => escolherPolitica(v)}
                  disabled={!precoSel.item}
                >
                  <SelectTrigger className="mt-2"><SelectValue placeholder="Escolha o modelo" /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    {modelosPolitica(precoSel.item?.produto ?? "", politica).map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.modelo || "Padrão"}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="form-field-long">
                <Label>Nome da peça</Label>
                <Input className="mt-2" value={pecaSel.nome} onChange={(e) => updPeca({ nome: e.target.value })} />
                <p className="mt-1 text-[11px] text-muted-foreground">Aparece na oficina e nos documentos.</p>
              </div>
              <div className="form-field-full grid gap-3 border-t border-border pt-3 sm:grid-cols-2">
                <SliderMm
                  label="Largura"
                  value={pecaSel.largura_mm}
                  min={tip.larguraMin} max={tip.larguraMax}
                  onChange={(v) => updPeca({ largura_mm: v })}
                />
                <SliderMm
                  label="Altura"
                  value={pecaSel.altura_mm}
                  min={tip.alturaMin} max={tip.alturaMax}
                  onChange={(v) => updPeca({ altura_mm: v })}
                />
              </div>
              <div className="form-field-money">
                <Label>Valor desta peça (R$)</Label>
                <Input
                  className="mt-2"
                  mask="moeda"
                  placeholder={formatarBRL(precoSel.sugerido)}
                  value={pecaSel.preco_manual == null ? "" : String(pecaSel.preco_manual).replace(".", ",")}
                  onChange={(e) => updPeca({ preco_manual: e.target.value === "" ? null : numeroMascarado(e.target.value) })}
                />
                {precoSel.manual && (
                  <Button type="button" size="sm" variant="outline" className="mt-1 h-7 text-[11px]" onClick={() => updPeca({ preco_manual: null })}>
                    Voltar ao valor da tabela
                  </Button>
                )}
              </div>
              <div className="form-field-long self-end rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
                {precoSel.item ? (
                  precoSel.item.unidade === "sob_orcamento" ? (
                    <>Item sob orçamento — digite o valor desta peça.</>
                  ) : (
                    <>
                      {formatarBRL(precoSel.item.valor)} {UNIDADE_LABEL[precoSel.item.unidade]} ×{" "}
                      {precoSel.quantidade.toLocaleString("pt-BR")} = <strong>{formatarBRL(precoSel.sugerido)}</strong>
                      {precoSel.manual && <span className="ml-1 text-warning">(valor ajustado à mão)</span>}
                    </>
                  )
                ) : (
                  <>Escolha o produto da tabela para calcular o preço.</>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-border p-3">
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Automação e motor desta peça</h4>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button" size="sm"
                variant={pecaSel.automacao_id ? "outline" : "default"}
                className={cn("h-auto min-h-10", !pecaSel.automacao_id && "bg-primary text-primary-foreground")}
                onClick={() => updPeca({ automacao_id: null, automacao_valor: null })}
              >
                Sem automação
              </Button>
              {AUTOMACOES_POLITICA.map((a) => {
                const ativo = pecaSel.automacao_id === a.id;
                return (
                  <Button
                    key={a.id}
                    type="button" size="sm"
                    variant={ativo ? "default" : "outline"}
                    className={cn("h-auto min-h-10 whitespace-normal text-left", ativo && "bg-primary text-primary-foreground")}
                    onClick={() => updPeca({ automacao_id: a.id, automacao_valor: null })}
                  >
                    {a.nome} · {formatarBRL(a.valor)}
                  </Button>
                );
              })}
            </div>

            {pecaSel.automacao_id && (
              <div className="mt-3">
                <Label>Valor da instalação da automação (R$)</Label>
                <Input
                  className="mt-2 sm:max-w-xs"
                  mask="moeda"
                  placeholder={formatarBRL(automacaoPolitica(pecaSel.automacao_id)?.valor ?? 0)}
                  value={pecaSel.automacao_valor == null ? "" : String(pecaSel.automacao_valor).replace(".", ",")}
                  onChange={(e) => updPeca({ automacao_valor: e.target.value === "" ? null : numeroMascarado(e.target.value) })}
                />
              </div>
            )}

            {/* Motor: opcional, com porte recomendado pelo tamanho do portão */}
            <div className="mt-4 rounded-lg border border-border/70 bg-muted/20 p-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-primary"
                  checked={mostrarMotor}
                  onChange={(e) => {
                    setMotorAberto((a) => ({ ...a, [pecaSel.id]: e.target.checked }));
                    if (!e.target.checked) updPeca({ motor_material_id: null, motor_nome: "", motor_custo: null, motor_valor: null, motor_porte: null });
                  }}
                />
                Deseja incluir motor?
              </label>

              {mostrarMotor && (
                <div className="mt-3 form-grid">
                  <div className="form-field-full text-xs text-muted-foreground">
                    Vão de {cm(pecaSel.largura_mm)} × {cm(pecaSel.altura_mm)} cm · recomendado <strong>PPA {porteRecomendado}</strong>
                  </div>
                  <div className="form-field-long">
                    <Label>Motor (cadastro de materiais)</Label>
                    <Input
                      className="mt-2"
                      placeholder="Buscar motor ou kit"
                      value={buscaMotor}
                      onChange={(e) => setBuscaMotor(e.target.value)}
                    />
                    <Select
                      value={pecaSel.motor_material_id ?? ""}
                      onValueChange={(id) => {
                        const m = motores.find((x) => x.id === id);
                        updPeca({
                          motor_material_id: id,
                          motor_nome: m?.nome ?? "",
                          motor_custo: m?.custo ?? null,
                          motor_valor: null,
                          motor_porte: m?.porte_motor ?? null,
                        });
                      }}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder={motores.length ? "Escolha o motor" : "Carregando motores…"} />
                      </SelectTrigger>
                      <SelectContent className="max-h-72">
                        {motoresFiltrados.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {porteDoMotor(m.porte_motor) ? `[${m.porte_motor}] ` : ""}{m.nome}
                            {compativel(m) ? " · indicado" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {pecaSel.motor_material_id && (
                    <>
                      <div className="form-field-medium">
                        <Label>Valor do motor para o cliente (R$)</Label>
                        <Input
                          className="mt-2"
                          mask="moeda"
                          placeholder={formatarBRL(precoMotorSugerido(pecaSel.motor_custo, margemMotor))}
                          value={pecaSel.motor_valor == null ? "" : String(pecaSel.motor_valor).replace(".", ",")}
                          onChange={(e) => updPeca({ motor_valor: e.target.value === "" ? null : numeroMascarado(e.target.value) })}
                        />
                        {pecaSel.motor_valor != null && (
                          <Button type="button" size="sm" variant="outline" className="mt-1 h-7 text-[11px]" onClick={() => updPeca({ motor_valor: null })}>
                            Voltar ao valor sugerido
                          </Button>
                        )}
                      </div>
                      <div className="form-field-medium flex flex-col justify-end gap-1 text-sm">
                        <span className="truncate">{pecaSel.motor_nome}</span>
                        {podeVerCustos && (
                          <span className="text-xs text-muted-foreground">
                            Custo {formatarBRL(pecaSel.motor_custo ?? 0)} · margem {margemMotor}%
                          </span>
                        )}
                        <Button
                          type="button" size="sm" variant="dangerOutline" className="h-8 w-fit"
                          onClick={() => updPeca({ motor_material_id: null, motor_nome: "", motor_custo: null, motor_valor: null, motor_porte: null })}
                        >
                          Remover motor
                        </Button>
                      </div>
                    </>
                  )}
                  {motorAbaixoDoVao && (
                    <p className="form-field-full rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
                      Motor subdimensionado para {cm(pecaSel.largura_mm)} × {cm(pecaSel.altura_mm)} cm — recomendado PPA 1/2.
                    </p>
                  )}
                </div>
              )}
            </div>
          </section>

          <p className="rounded-lg bg-muted/40 px-3 py-2 text-sm">
            <strong>{pecaSel.nome || tip.nome}</strong> · {cm(pecaSel.largura_mm)} × {cm(pecaSel.altura_mm)} cm ·{" "}
            {ACABAMENTOS.find((a) => a.id === pecaSel.cor)?.nome} ·{" "}
            {fixacaoTipo(pecaSel.fixacao).nome}
            {pecaSel.automacao_id && <> · {automacaoPolitica(pecaSel.automacao_id)?.nome}</>}
            {pecaSel.motor_material_id && <> · motor</>}
            {" · "}
            <strong>{formatarBRL(totalPecaSel)}</strong>
            {(automacaoSel > 0 || motorSel > 0) && (
              <span className="ml-1 text-xs text-muted-foreground">
                (peça {formatarBRL(precoSel.valor)}
                {automacaoSel > 0 && ` + automação ${formatarBRL(automacaoSel)}`}
                {motorSel > 0 && ` + motor ${formatarBRL(motorSel)}`})
              </span>
            )}
          </p>

        </div>
      </div>

      {/* Desenho e detalhamento */}
      <div className="space-y-4 min-w-0">
          {/* Card 3D (desativado por enquanto) */}
          {MOSTRAR_3D && (
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
          )}

          {/* Serviços e deslocamento da política */}
          <div className="surface-card rounded-lg border border-border p-4">
            <div className="mb-3 flex items-center gap-2 font-display text-sm">
              <DollarSign className="h-4 w-4 text-primary" /> Serviços e deslocamento
            </div>
            <div className="flex flex-wrap gap-2">
              {SERVICOS_POLITICA.map((s) => {
                const ativo = servicosEscolhidos.some((x) => x.id === s.id);
                return (
                  <Button
                    key={s.id}
                    type="button"
                    size="sm"
                    variant={ativo ? "default" : "outline"}
                    className={cn("h-auto min-h-10 whitespace-normal text-left", ativo && "bg-primary text-primary-foreground")}
                    onClick={() => upd(
                      "servicos_politica",
                      ativo
                        ? servicosEscolhidos.filter((x) => x.id !== s.id)
                        : [...servicosEscolhidos, { id: s.id, nome: s.nome, valor: s.valor }],
                    )}
                  >
                    {s.nome} · {formatarBRL(s.valor)}
                  </Button>
                );
              })}
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-auto min-h-10"
                onClick={() => upd("servicos_politica", [
                  ...servicosEscolhidos,
                  { id: `extra-${Date.now()}`, nome: "", valor: 0 },
                ])}
              >
                <Plus className="mr-1 h-4 w-4" /> Outro serviço
              </Button>
            </div>

            {servicosEscolhidos.length > 0 && (
              <div className="mt-3 space-y-2">
                {servicosEscolhidos.map((s) => {
                  const livre = s.id.startsWith("extra-");
                  const comMinimo = servicoTemMinimo(s.id);
                  return (
                  <div key={s.id}>
                    <div className="grid grid-cols-12 items-center gap-2">
                      {livre ? (
                        <Input
                          className="col-span-7 h-9 sm:col-span-9"
                          placeholder="Nome do serviço"
                          maxLength={60}
                          value={s.nome}
                          onChange={(e) => upd("servicos_politica", servicosEscolhidos.map((x) => x.id === s.id ? { ...x, nome: e.target.value } : x))}
                          onBlur={() => {
                            if (!s.nome.trim()) {
                              upd("servicos_politica", servicosEscolhidos.map((x) => x.id === s.id ? { ...x, nome: "Serviço adicional" } : x));
                            }
                          }}
                        />
                      ) : (
                        <span className="col-span-7 truncate text-sm sm:col-span-9">{s.nome}</span>
                      )}
                      <Input
                        className="col-span-4 h-9 text-right sm:col-span-2"
                        mask="moeda"
                        value={String(s.valor).replace(".", ",")}
                        onChange={(e) => upd("servicos_politica", servicosEscolhidos.map((x) => x.id === s.id ? { ...x, valor: Math.max(0, numeroMascarado(e.target.value)) } : x))}
                        onBlur={() => {
                          if (comMinimo && Number(s.valor || 0) < SERVICO_MINIMO) {
                            upd("servicos_politica", servicosEscolhidos.map((x) => x.id === s.id ? { ...x, valor: SERVICO_MINIMO } : x));
                            toast.info(`${s.nome}: taxa mínima de ${formatarBRL(SERVICO_MINIMO)}`);
                          }
                        }}
                      />
                      <Button
                        size="icon" variant="dangerOutline" className="col-span-1" title="Remover serviço"
                        onClick={() => upd("servicos_politica", servicosEscolhidos.filter((x) => x.id !== s.id))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {comMinimo && (
                      <div className="mt-0.5 text-[11px] text-muted-foreground">
                        Taxa mínima de {formatarBRL(SERVICO_MINIMO)} — pode aumentar o valor.
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
            )}

            <div className="mt-4 form-grid border-t border-border pt-4">
              <div className="form-field-money">
                <Label className="text-xs">Deslocamento / frete (R$)</Label>
                <Input
                  className="h-9"
                  mask="moeda"
                  placeholder={`mínimo ${formatarBRL(FRETE_MINIMO)}`}
                  value={projeto.frete_valor == null ? "" : String(projeto.frete_valor).replace(".", ",")}
                  onChange={(e) => upd("frete_valor", e.target.value === "" ? null : numeroMascarado(e.target.value))}
                />
                <Button type="button" size="sm" variant="outline" className="mt-1 h-7 text-[11px]" onClick={() => upd("frete_valor", FRETE_MINIMO)}>
                  Usar mínimo {formatarBRL(FRETE_MINIMO)}
                </Button>
              </div>
              <div className="form-field-full">
                <Label className="text-xs">Observações da proposta</Label>
                <Textarea
                  rows={3}
                  maxLength={2000}
                  value={projeto.observacoes_proposta ?? ""}
                  onChange={(e) => upd("observacoes_proposta", e.target.value)}
                  onBlur={arrumar("observacoes_proposta", frasePrimeiraMaiuscula)}
                />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue={podeVerCustos ? "materiais" : "orcamento"}>
            <TabsList className="overflow-x-auto w-max min-w-full justify-start">
              {podeVerCustos && <TabsTrigger value="materiais">Materiais</TabsTrigger>}
              {podeVerCustos && <TabsTrigger value="corte">Plano de corte</TabsTrigger>}
              {podeVerCustos && <TabsTrigger value="producao">Produção</TabsTrigger>}
              <TabsTrigger value="orcamento">Orçamento</TabsTrigger>
            </TabsList>

            {/* Materiais */}
            <TabsContent value="materiais" className="surface-card rounded-lg border border-border p-4 space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <CardResumo label="Materiais" valor={formatarBRL(resultado.totalMateriais)} />
                <CardResumo label="Metragem perfil" valor={`${resultado.resumo.metragemPerfil.toFixed(2)} m`} />
                <CardResumo label="Peso estimado" valor={`${resultado.resumo.pesoEstimado.toFixed(1)} kg`} />
              </div>
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
                      <th className="text-left py-2 pr-2">Item</th>
                      <th className="text-left py-2 pr-2">Tabela</th>
                      <th className="text-right py-2 pr-2">Qtd</th>
                      <th className="text-right py-2 pr-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projeto.pecas.map((pc) => {
                      const pr = precoPeca(pc, politica);
                      return (
                        <tr key={pc.id} className="border-b border-border/40">
                          <td className="py-1.5 pr-2">
                            <div className="font-medium">{pc.nome}</div>
                            <div className="text-[10px] text-muted-foreground">{cm(pc.largura_mm)} × {cm(pc.altura_mm)} cm</div>
                          </td>
                          <td className="py-1.5 pr-2">
                            {pr.item ? `${pr.item.produto}${pr.item.modelo ? ` · ${pr.item.modelo}` : ""}` : "—"}
                          </td>
                          <td className="py-1.5 pr-2 text-right">
                            {pr.item && pr.item.unidade !== "sob_orcamento"
                              ? `${pr.quantidade.toLocaleString("pt-BR")} ${UNIDADE_LABEL[pr.item.unidade].replace("por ", "")}`
                              : "—"}
                          </td>
                          <td className="py-1.5 pr-2 text-right font-medium">{formatarBRL(pr.valor)}</td>
                        </tr>
                      );
                    })}
                    {servicosEscolhidos.map((s) => (
                      <tr key={s.id} className="border-b border-border/40">
                        <td className="py-1.5 pr-2">{s.nome}</td>
                        <td className="py-1.5 pr-2 text-muted-foreground">Serviço</td>
                        <td className="py-1.5 pr-2 text-right">1</td>
                        <td className="py-1.5 pr-2 text-right font-medium">{formatarBRL(s.valor)}</td>
                      </tr>
                    ))}
                    {(projeto.frete_valor ?? 0) > 0 && (
                      <tr className="border-b border-border/40">
                        <td className="py-1.5 pr-2">Deslocamento</td>
                        <td className="py-1.5 pr-2 text-muted-foreground">Frete</td>
                        <td className="py-1.5 pr-2 text-right">1</td>
                        <td className="py-1.5 pr-2 text-right font-medium">{formatarBRL(projeto.frete_valor ?? 0)}</td>
                      </tr>
                    )}
                    <tr className="bg-card">
                      <td colSpan={3} className="py-3 pr-2 text-right font-display text-sm uppercase">Total geral</td>
                      <td className="py-3 pr-2 text-right font-display text-xl text-gradient-orange">{formatarBRL(totalProposta)}</td>
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

      <aside className="fixed inset-x-0 bottom-0 z-30 hidden border-t border-primary/40 bg-card/95 shadow-[0_-8px_24px_hsl(var(--background)/0.45)] backdrop-blur md:block lg:left-[5.5rem]" aria-label="Total congelado do orçamento">
        <div className="container flex min-h-20 items-center justify-between gap-6 py-3">
          <div className="flex min-w-0 items-center gap-6 text-sm">
            <div className="min-w-0">
              <div className="text-[10px] font-semibold uppercase text-muted-foreground">Peça selecionada</div>
              <div className="max-w-56 truncate font-semibold">{pecaSel.nome}</div>
            </div>
            <div className="hidden xl:block">
              <div className="text-[10px] font-semibold uppercase text-muted-foreground">Valor da peça</div>
              <strong>{formatarBRL(totalPecaSel)}</strong>
            </div>
            <div className="hidden xl:block">
              <div className="text-[10px] font-semibold uppercase text-muted-foreground">Serviços + frete</div>
              <strong>{formatarBRL(servicosTotal + (projeto.frete_valor ?? 0))}</strong>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-4 border-l border-border pl-6">
            <div className="text-right">
              <div className="text-[10px] font-semibold uppercase text-muted-foreground">Total atualizado</div>
              <div className="font-display text-2xl text-primary">{formatarBRL(totalAnimado)}</div>
            </div>
            <Button size="sm" onClick={() => { salvarProjeto({ ...projeto, total: totalPecas, servicos_valor: servicosTotal || null }); toast.success("Salvo"); }}>
              <Save className="mr-1 h-4 w-4" /> Salvar
            </Button>
          </div>
        </div>
      </aside>
      {financeiroAberto && (
        <DialogOrdemFinanceiro projeto={projeto} foco="comprovante" onClose={() => setFinanceiroAberto(false)} onMandarOficina={mandarParaOficina} />
      )}

      <AlertDialog open={pendenciasFila !== null} onOpenChange={(o) => !o && setPendenciasFila(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Falta informação para a oficina</AlertDialogTitle>
            <AlertDialogDescription>
              Você pode mandar assim mesmo, mas o serralheiro vai começar sem estes dados:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {(pendenciasFila ?? []).map((f) => <li key={f}>{f}</li>)}
          </ul>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setPendenciasFila(null); checklistPendente(); }}>
              Voltar e completar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-gradient-orange text-primary-foreground"
              onClick={() => { setPendenciasFila(null); liberarOficina(); }}
            >
              Mandar assim mesmo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
  const minCm = mmParaCm(min);

  const confirmar = () => {
    const n = Number(String(exibido).replace(",", "."));
    if (Number.isFinite(n) && n > 0 && exibido.trim() !== "") {
      // Digitou um número grande demais para centímetros? Interpreta como milímetros.
      const mm = n > maxCm ? Math.round(n) : cmParaMm(n);
      onChange(mm);
    }
    setTexto(null);
  };

  const ajustar = (deltaCm: number) => {
    setTexto(null);
    const atual = mmParaCm(value);
    onChange(cmParaMm(Math.max(1, atual + deltaCm)));
  };

  const foraDoLimite = value < min || value > max;

  return (
    <div>
      <Label className="mb-1 block">{label}</Label>
      <div className="flex items-stretch gap-2">
        <Button
          type="button" variant="outline" size="icon"
          className="h-14 w-12 shrink-0 text-lg font-bold"
          aria-label={`Diminuir ${label} 10 cm`}
          onClick={() => ajustar(-10)}
        >
          −
        </Button>
        <div className="relative flex-1">
          <Input
            type="text"
            inputMode="decimal"
            className="h-14 pr-12 text-center text-2xl font-semibold tabular-nums"
            value={exibido}
            mask="decimal"
            onChange={(e) => setTexto(e.target.value)}
            onFocus={(e) => e.currentTarget.select()}
            onBlur={confirmar}
            onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">cm</span>
        </div>
        <Button
          type="button" variant="outline" size="icon"
          className="h-14 w-12 shrink-0 text-lg font-bold"
          aria-label={`Aumentar ${label} 10 cm`}
          onClick={() => ajustar(10)}
        >
          +
        </Button>
      </div>
      <div className={cn("mt-1 text-[11px]", foraDoLimite ? "text-warning" : "text-muted-foreground")}>
        {foraDoLimite
          ? `Fora do usual (${minCm} a ${maxCm} cm) — confirme a medida.`
          : `Digite em centímetros. Usual: ${minCm} a ${maxCm} cm.`}
      </div>
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
