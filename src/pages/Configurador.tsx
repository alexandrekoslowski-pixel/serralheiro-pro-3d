import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Save, Copy, Download, Settings2, DollarSign,
  RotateCw, Box as BoxIcon, Grid3x3, Ruler, Plus, Trash2, RefreshCw, EyeOff, Eye,
  Wrench, FileText, FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toggle } from "@/components/ui/toggle";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CollapsiblePanel } from "@/components/CollapsiblePanel";
import Visualizador3DClient from "@/components/Visualizador3DClient";
import type { CameraPreset } from "@/components/Visualizador3D";
import { useAnimatedNumber } from "@/hooks/useAnimatedNumber";

import {
  TIPOLOGIAS, ACABAMENTOS, AcabamentoId, TipologiaId, tipologiaPorId,
} from "@/lib/tipologias";
import {
  ProjetoLocal, obterProjeto, salvarProjeto, duplicarProjeto,
  obterEmpresa, obterCatalogo, formatarBRL, gerarId,
} from "@/lib/storage";
import { calcular, ItemExtra, ItemOverride } from "@/lib/calculator";
import { planejarCorte, planejarProducao } from "@/lib/producao";
import { gerarOrcamentoPDF } from "@/lib/pdf";
import { gerarOrdemProducaoPDF } from "@/lib/pdfProducao";

const PALETA_BARRAS = [
  "hsl(18 78% 52%)", "hsl(210 60% 55%)", "hsl(140 50% 50%)",
  "hsl(320 55% 60%)", "hsl(45 90% 55%)", "hsl(260 50% 60%)",
  "hsl(0 65% 55%)", "hsl(180 55% 50%)",
];

export default function Configurador() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [projeto, setProjeto] = useState<ProjetoLocal | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Controles 3D
  const [preset, setPreset] = useState<CameraPreset>("iso");
  const [autoRotate, setAutoRotate] = useState(false);
  const [wireframe, setWireframe] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [showCotas, setShowCotas] = useState(true);
  const [bgColor, setBgColor] = useState("#1a1614");

  // Carrega projeto
  useEffect(() => {
    const p = obterProjeto(id);
    if (!p) {
      toast.error("Projeto não encontrado");
      navigate("/app");
      return;
    }
    setProjeto(p);
  }, [id, navigate]);

  const empresa = useMemo(() => obterEmpresa(), []);
  const catalogo = useMemo(() => obterCatalogo(), []);

  const resultado = useMemo(() => {
    if (!projeto) return null;
    return calcular({
      tipologia: projeto.tipologia,
      largura_mm: projeto.largura_mm,
      altura_mm: projeto.altura_mm,
      cor: projeto.cor,
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
    () => (projeto && resultado ? planejarProducao(projeto.tipologia, resultado.cortes) : null),
    [projeto, resultado],
  );

  if (!projeto || !resultado || !planoCorte || !planoProducao) return null;

  const tip = tipologiaPorId(projeto.tipologia);

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

  const exportarOrcamento = () => {
    salvarProjeto({ ...projeto, total: resultado.totalGeral });
    const snap = canvasRef.current ? canvasRef.current.toDataURL("image/png") : undefined;
    gerarOrcamentoPDF(projeto, resultado, empresa, snap);
    toast.success("Orçamento gerado");
  };

  // Plano de corte / produção
  const [barraMm, setBarraMm] = useState<number>(6000);
  const planoCorte = useMemo(() => planejarCorte(resultado.cortes, barraMm), [resultado.cortes, barraMm]);
  const planoProducao = useMemo(() => planejarProducao(projeto.tipologia, resultado.cortes), [projeto.tipologia, resultado.cortes]);

  const exportarOP = () => {
    gerarOrdemProducaoPDF(projeto, planoCorte, planoProducao);
    toast.success("Ordem de produção gerada");
  };

  return (
    <div className="container py-4 md:py-6 space-y-4">
      {/* Top bar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <Button asChild variant="ghost" size="sm" className="shrink-0">
            <Link to="/app"><ArrowLeft className="mr-1 h-4 w-4" /> Projetos</Link>
          </Button>
          <div className="min-w-0">
            <h1 className="font-display text-base md:text-xl truncate">{projeto.nome || "Projeto"}</h1>
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
        <div className="flex gap-2 overflow-x-auto -mx-1 px-1 md:overflow-visible">
          <Button variant="outline" size="sm" className="shrink-0" onClick={duplicar}>
            <Copy className="mr-1 h-4 w-4" /> Duplicar
          </Button>
          <Button variant="outline" size="sm" className="shrink-0" onClick={() => { salvarProjeto({ ...projeto, total: resultado.totalGeral }); toast.success("Salvo"); }}>
            <Save className="mr-1 h-4 w-4" /> Salvar
          </Button>
          <Button size="sm" className="shrink-0 bg-gradient-orange text-primary-foreground shadow-orange" onClick={exportarOrcamento}>
            <Download className="mr-1 h-4 w-4" /> Exportar PDF
          </Button>
        </div>
      </div>

      {/* Layout: sidebar + central */}
      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        {/* Sidebar */}
        <aside className="space-y-3">
          <CollapsiblePanel icon={<Settings2 className="h-4 w-4 text-primary" />} title="Configuração">
            <div className="space-y-3">
              <div>
                <Label>Nome do projeto</Label>
                <Input value={projeto.nome} onChange={(e) => upd("nome", e.target.value)} />
              </div>
              <div>
                <Label>Cliente</Label>
                <Input value={projeto.cliente} onChange={(e) => upd("cliente", e.target.value)} />
              </div>
              <div>
                <Label>Tipologia</Label>
                <Select value={projeto.tipologia} onValueChange={(v) => {
                  const novo = tipologiaPorId(v as TipologiaId);
                  setProjeto({
                    ...projeto,
                    tipologia: v as TipologiaId,
                    largura_mm: Math.min(Math.max(projeto.largura_mm, novo.larguraMin), novo.larguraMax),
                    altura_mm: Math.min(Math.max(projeto.altura_mm, novo.alturaMin), novo.alturaMax),
                  });
                }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIPOLOGIAS.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="mt-1 text-[11px] text-muted-foreground">{tip.descricao}</p>
              </div>

              <SliderMm
                label="Largura"
                value={projeto.largura_mm}
                min={tip.larguraMin} max={tip.larguraMax}
                onChange={(v) => upd("largura_mm", v)}
              />
              <SliderMm
                label="Altura"
                value={projeto.altura_mm}
                min={tip.alturaMin} max={tip.alturaMax}
                onChange={(v) => upd("altura_mm", v)}
              />

              <div>
                <Label>Acabamento / cor</Label>
                <div className="mt-2 flex gap-2 flex-wrap">
                  {ACABAMENTOS.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => upd("cor", a.id as AcabamentoId)}
                      className={cn(
                        "h-10 w-10 md:h-9 md:w-9 rounded border-2 transition",
                        projeto.cor === a.id ? "border-primary scale-110 shadow-orange" : "border-border",
                      )}
                      style={{ backgroundColor: a.hex }}
                      title={a.nome}
                    />
                  ))}
                </div>
              </div>
            </div>
          </CollapsiblePanel>

          <CollapsiblePanel icon={<DollarSign className="h-4 w-4 text-primary" />} title="Orçamento">
            <SliderPct label="Mão de obra" value={projeto.maoObraPct} onChange={(v) => upd("maoObraPct", v)} />
            <SliderPct label="Margem" value={projeto.margemPct} onChange={(v) => upd("margemPct", v)} />
            <SliderPct label="Desconto geral" value={projeto.descontoGeralPct} onChange={(v) => upd("descontoGeralPct", v)} max={50} />
          </CollapsiblePanel>
        </aside>

        {/* Painel central */}
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
                <Toggle pressed={wireframe} onPressedChange={setWireframe} size="sm" className="shrink-0" title="Wireframe"><BoxIcon className="h-3.5 w-3.5" /></Toggle>
                <Toggle pressed={showGrid} onPressedChange={setShowGrid} size="sm" className="shrink-0" title="Grid"><Grid3x3 className="h-3.5 w-3.5" /></Toggle>
                <Toggle pressed={showCotas} onPressedChange={setShowCotas} size="sm" className="shrink-0" title="Cotas"><Ruler className="h-3.5 w-3.5" /></Toggle>
                <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="h-7 w-7 shrink-0 cursor-pointer rounded border border-border bg-transparent" title="Cor de fundo" />
              </div>
            </div>
            <div className="h-[280px] sm:h-[360px] lg:h-[420px] touch-none">
              <Visualizador3DClient
                tipologia={projeto.tipologia}
                largura_mm={projeto.largura_mm}
                altura_mm={projeto.altura_mm}
                cor={projeto.cor}
                autoRotate={autoRotate}
                wireframe={wireframe}
                showGrid={showGrid}
                showCotas={showCotas}
                bgColor={bgColor}
                preset={preset}
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
                          <div className="font-medium">{it.descricao}</div>
                          {it.codigo && <div className="text-[10px] text-muted-foreground">{it.codigo}</div>}
                        </td>
                        <td className="py-1.5 pr-2"><Input className="h-8 text-right" type="number" step="0.01" value={it.qtd} onChange={(e) => setOverride(it.key, { qtd: Number(e.target.value) })} /></td>
                        <td className="py-1.5 pr-2 text-muted-foreground">{it.unidade}</td>
                        <td className="py-1.5 pr-2"><Input className="h-8 text-right" type="number" step="0.01" value={it.precoUnit} onChange={(e) => setOverride(it.key, { precoUnit: Number(e.target.value) })} /></td>
                        <td className="py-1.5 pr-2"><Input className="h-8 text-right" type="number" step="1" value={it.descontoPct} onChange={(e) => setOverride(it.key, { descontoPct: Number(e.target.value) })} /></td>
                        <td className="py-1.5 pr-2 text-right font-medium">{formatarBRL(it.total)}</td>
                        <td className="py-1.5 text-right">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setOverride(it.key, { oculto: !it.oculto })} title={it.oculto ? "Mostrar" : "Ocultar"}>
                            {it.oculto ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                          </Button>
                          {it.override && (
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => resetOverride(it.key)} title="Resetar override">
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
                      <Input className="h-8 col-span-3 sm:col-span-2 text-right" type="number" step="0.01" value={ex.qtd} onChange={(e) => updExtra(ex.id, { qtd: Number(e.target.value) })} />
                      <Input className="h-8 col-span-3 sm:col-span-1" placeholder="un" value={ex.unidade} onChange={(e) => updExtra(ex.id, { unidade: e.target.value })} />
                      <Input className="h-8 col-span-4 sm:col-span-3 text-right" type="number" step="0.01" placeholder="Preço" value={ex.precoUnit} onChange={(e) => updExtra(ex.id, { precoUnit: Number(e.target.value) })} />
                      <Button size="icon" variant="ghost" className="col-span-2 sm:col-span-1" onClick={() => delExtra(ex.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
                      <th className="text-right py-2 pr-2">Comp. (mm)</th>
                      <th className="text-right py-2 pr-2">Qtd</th>
                      <th className="text-right py-2 pr-2">Total (mm)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultado.cortes.map((c, i) => (
                      <tr key={i} className="border-b border-border/40">
                        <td className="py-1.5 pr-2 font-mono text-xs">{c.codigo}</td>
                        <td className="py-1.5 pr-2">{c.descricao}</td>
                        <td className="py-1.5 pr-2 text-right">{c.comprimento_mm}</td>
                        <td className="py-1.5 pr-2 text-right">{c.qtd}</td>
                        <td className="py-1.5 pr-2 text-right font-medium">{(c.comprimento_mm * c.qtd).toLocaleString("pt-BR")}</td>
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
                    {[3000, 5000, 6000, 12000].map((n) => <SelectItem key={n} value={String(n)}>{n} mm</SelectItem>)}
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
                                  title={`${p.id} · ${p.descricao} · ${p.comprimento_mm}mm`}
                                >
                                  {w > 6 ? p.id : ""}
                                </div>
                              );
                            })}
                            <div className="bg-muted flex-1" title={`Sobra ${b.sobra_mm}mm`} />
                          </div>
                          <span className="text-[10px] text-muted-foreground w-16 text-right shrink-0">↳ {b.sobra_mm}mm</span>
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
      </div>
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
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <Label>{label}</Label>
        <div className="flex items-center gap-1">
          <Input type="number" className="h-7 w-20 text-right text-xs" value={value} min={min} max={max} step={10} onChange={(e) => onChange(Math.min(max, Math.max(min, Number(e.target.value))))} />
          <span className="text-[10px] text-muted-foreground">mm</span>
        </div>
      </div>
      <Slider min={min} max={max} step={10} value={[value]} onValueChange={([v]) => onChange(v)} />
      <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
        <span>{min}</span><span>{max}</span>
      </div>
    </div>
  );
}

function SliderPct({ label, value, onChange, max = 100 }: { label: string; value: number; onChange: (v: number) => void; max?: number }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <Label>{label}</Label>
        <Input type="number" className="h-7 w-16 text-right text-xs" value={value} min={0} max={max} step={1} onChange={(e) => onChange(Math.min(max, Math.max(0, Number(e.target.value))))} />
      </div>
      <Slider min={0} max={max} step={1} value={[value]} onValueChange={([v]) => onChange(v)} />
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
