// Modo Atendimento — wizard 3 passos para o vendedor usar na casa do cliente.
// Tela cheia, mobile-first, sem tabelas técnicas, sem plano de corte.
// Passos: Medidas → Acabamento → Resumo (com assinatura + compartilhar).
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, X, Share2, Pencil, Download, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Visualizador3DClient from "@/components/Visualizador3DClient";

/** Desenho 3D temporariamente desativado. */
const MOSTRAR_3D = false;
import { TecladoNumerico } from "@/components/TecladoNumerico";
import { AssinaturaCanvas } from "@/components/AssinaturaCanvas";
import { useAnimatedNumber } from "@/hooks/useAnimatedNumber";

import {
  TIPOLOGIAS, ACABAMENTOS, AcabamentoId, TipologiaId, tipologiaPorId,
} from "@/lib/tipologias";
import {
  ProjetoLocal, obterProjeto, salvarProjeto, obterEmpresa, obterCatalogo, formatarBRL,
} from "@/lib/storage";
import { calcularProjeto } from "@/lib/calculator";
import { gerarOrcamentoPDF, AssinaturaInfo } from "@/lib/pdf";
import { cm, mmParaCm, cmParaMm } from "@/lib/medidas";

type Passo = 0 | 1 | 2;
const PASSOS = ["Medidas", "Acabamento", "Resumo"];

export default function ModoAtendimento() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [projeto, setProjeto] = useState<ProjetoLocal | null>(null);
  const [passo, setPasso] = useState<Passo>(0);
  const [tecladoOpen, setTecladoOpen] = useState<"largura" | "altura" | null>(null);
  const [assinaturaOpen, setAssinaturaOpen] = useState(false);
  const [assinatura, setAssinatura] = useState<AssinaturaInfo | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const p = obterProjeto(id);
    if (!p) { toast.error("Orçamento não encontrado"); navigate("/app"); return; }
    setProjeto(p);
  }, [id, navigate]);

  const empresa = useMemo(() => obterEmpresa(), []);
  const catalogo = useMemo(() => obterCatalogo(), []);

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

  const totalAnimado = useAnimatedNumber(resultado?.totalGeral ?? 0);

  // Auto-save
  useEffect(() => {
    if (!projeto || !resultado) return;
    const t = setTimeout(() => salvarProjeto({ ...projeto, total: resultado.totalGeral }), 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projeto, resultado?.totalGeral]);

  if (!projeto || !resultado) return null;
  const tip = tipologiaPorId(projeto.tipologia);

  // No atendimento rápido edita-se a primeira peça (as demais ficam no configurador).
  const upd = <K extends keyof ProjetoLocal>(k: K, v: ProjetoLocal[K]) => {
    const next = { ...projeto, [k]: v } as ProjetoLocal;
    if (k === "tipologia" || k === "largura_mm" || k === "altura_mm" || k === "cor") {
      next.pecas = projeto.pecas.map((pc, i) => (i === 0 ? { ...pc, [k]: v } : pc));
    }
    setProjeto(next);
  };

  const proximo = () => setPasso((p) => Math.min(2, (p + 1)) as Passo);
  const anterior = () => setPasso((p) => Math.max(0, (p - 1)) as Passo);

  const gerarBlob = (): Blob | null => {
    const blob = gerarOrcamentoPDF(projeto, resultado, empresa, assinatura ?? undefined, true);
    return (blob as Blob) ?? null;
  };

  const baixarPDF = () => {
    gerarOrcamentoPDF(projeto, resultado, empresa, assinatura ?? undefined, false);
    toast.success("Orçamento baixado");
  };

  const compartilhar = async () => {
    const blob = gerarBlob();
    if (!blob) return;
    const file = new File([blob], `orcamento-${projeto.id}.pdf`, { type: "application/pdf" });
    const texto = `Orçamento ${tip.nome} — ${empresa.nome || "Serralheria"}\nTotal: ${formatarBRL(resultado.totalGeral)}`;
    // navigator.canShare existe em Chrome/Safari modernos
    const navAny = navigator as any;
    if (navAny.canShare?.({ files: [file] })) {
      try {
        await navAny.share({ files: [file], title: "Orçamento", text: texto });
        toast.success("Compartilhado");
        return;
      } catch (e: any) {
        if (e?.name !== "AbortError") toast.error("Falha ao compartilhar");
        return;
      }
    }
    // Fallback: WhatsApp Web/App via wa.me (sem anexo, com texto)
    const url = `https://wa.me/?text=${encodeURIComponent(texto + "\n(PDF baixado no celular)")}`;
    window.open(url, "_blank");
    baixarPDF();
  };

  return (
    <div className="fixed inset-0 z-40 bg-background flex flex-col">
      {/* Topbar */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <Link to={`/app/projeto/${projeto.id}`} className="text-muted-foreground hover:text-foreground">
          <X className="h-6 w-6" />
        </Link>
        <div className="flex-1 mx-3">
          <div className="text-xs text-muted-foreground text-center">{tip.nome}</div>
          {/* Stepper */}
          <div className="flex items-center justify-center gap-1.5 mt-1">
            {PASSOS.map((p, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === passo ? "w-8 bg-primary" : i < passo ? "w-4 bg-primary/60" : "w-4 bg-border",
                )} />
              </div>
            ))}
          </div>
        </div>
        <div className="text-xs font-mono text-muted-foreground tabular-nums w-12 text-right">
          {passo + 1}/3
        </div>
      </header>

      {/* 3D fixo no topo (desativado por enquanto) */}
      {MOSTRAR_3D && (
      <div className="h-[34vh] sm:h-[40vh] border-b border-border bg-black touch-none">
        <Visualizador3DClient
          pecas={projeto.pecas}
          tipologia={projeto.tipologia}
          largura_mm={projeto.largura_mm}
          altura_mm={projeto.altura_mm}
          cor={projeto.cor}
          autoRotate={passo === 2}
          wireframe={false}
          showGrid={false}
          showCotas={true}
          bgColor="#0a0a0a"
          preset="iso"
          onCanvasReady={(c) => { canvasRef.current = c; }}
        />
      </div>
      )}

      {/* Conteúdo do passo */}
      <main className="flex-1 overflow-y-auto p-4 pb-32">
        <h2 className="font-display text-2xl mb-1">{PASSOS[passo]}</h2>
        <p className="text-sm text-muted-foreground mb-5">{
          passo === 0 ? "Toque nos campos para editar com o teclado grande." :
          passo === 1 ? "Escolha a cor e o modelo." :
          "Confira, mostre ao cliente e finalize."
        }</p>

        {/* PASSO 0: MEDIDAS */}
        {passo === 0 && (
          <div className="space-y-4">
            <BotaoMedida
              label="Largura"
              valor={projeto.largura_mm}
              min={tip.larguraMin}
              max={tip.larguraMax}
              onClick={() => setTecladoOpen("largura")}
            />
            <BotaoMedida
              label="Altura"
              valor={projeto.altura_mm}
              min={tip.alturaMin}
              max={tip.alturaMax}
              onClick={() => setTecladoOpen("altura")}
            />
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Modelo</div>
              <select
                value={projeto.tipologia}
                onChange={(e) => {
                  const novo = tipologiaPorId(e.target.value as TipologiaId);
                  const tipo = e.target.value as TipologiaId;
                  const larg = Math.min(Math.max(projeto.largura_mm, novo.larguraMin), novo.larguraMax);
                  const alt = Math.min(Math.max(projeto.altura_mm, novo.alturaMin), novo.alturaMax);
                  setProjeto({
                    ...projeto,
                    tipologia: tipo,
                    largura_mm: larg,
                    altura_mm: alt,
                    pecas: projeto.pecas.map((pc, i) =>
                      i === 0 ? { ...pc, tipologia: tipo, largura_mm: larg, altura_mm: alt } : pc,
                    ),
                  });
                }}
                className="w-full h-14 px-4 rounded-xl border-2 border-border bg-card text-lg"
              >
                {TIPOLOGIAS.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* PASSO 1: ACABAMENTO */}
        {passo === 1 && (
          <div className="space-y-5">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Cor / acabamento</div>
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
                {ACABAMENTOS.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => upd("cor", a.id as AcabamentoId)}
                    className={cn(
                      "relative h-11 w-11 shrink-0 rounded-full border-2 transition active:scale-90",
                      projeto.cor === a.id ? "border-primary ring-2 ring-primary/40 scale-110" : "border-border",
                    )}
                    style={{ backgroundColor: a.hex }}
                    title={a.nome}
                  >
                    {projeto.cor === a.id && (
                      <Check className="absolute inset-0 m-auto h-5 w-5 text-white drop-shadow" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Cliente</div>
              <input
                value={projeto.cliente}
                onChange={(e) => upd("cliente", e.target.value)}
                placeholder="Nome do cliente"
                className="w-full h-14 px-4 rounded-xl border-2 border-border bg-card text-lg"
              />
            </div>
          </div>
        )}

        {/* PASSO 2: RESUMO */}
        {passo === 2 && (
          <div className="space-y-4">
            <div className="rounded-2xl border-2 border-primary bg-primary/5 p-5 text-center">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Total</div>
              <div className="font-display text-5xl font-bold text-primary tabular-nums mt-1">
                {formatarBRL(totalAnimado)}
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                {resultado.resumo.metragemPerfil.toFixed(1)} m de perfil • {resultado.resumo.pesoEstimado.toFixed(1)} kg
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <ResumoCard label="Cliente" valor={projeto.cliente || "—"} />
              <ResumoCard label="Modelo" valor={tip.nome} />
              <ResumoCard label="Largura" valor={`${cm(projeto.largura_mm)} cm`} />
              <ResumoCard label="Altura" valor={`${cm(projeto.altura_mm)} cm`} />
              <ResumoCard label="Cor" valor={projeto.cor.toUpperCase()} />
              <ResumoCard label="Validade" valor="15 dias" />
            </div>

            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold">Assinatura do cliente</div>
                {assinatura && <span className="text-xs text-success">✓ assinado</span>}
              </div>
              {assinatura ? (
                <div className="space-y-2">
                  <img src={assinatura.dataUrl} alt="Assinatura" className="h-20 mx-auto bg-white rounded border border-border" />
                  <div className="text-xs text-center text-muted-foreground">{assinatura.nome || "Cliente"}</div>
                  <Button variant="soft" size="sm" className="w-full" onClick={() => setAssinaturaOpen(true)}>
                    <Pencil className="mr-2 h-4 w-4" /> Refazer
                  </Button>
                </div>
              ) : (
                <Button variant="outline" className="w-full h-12" onClick={() => setAssinaturaOpen(true)}>
                  <Pencil className="mr-2 h-4 w-4" /> Coletar assinatura
                </Button>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer fixo de navegação */}
      <footer className="fixed bottom-0 inset-x-0 border-t border-border bg-card/95 backdrop-blur-sm p-3">
        {passo < 2 ? (
          <div className="flex gap-2">
            <Button variant="outline" size="lg" className="flex-1 h-14 text-base" onClick={anterior} disabled={passo === 0}>
              <ChevronLeft className="mr-1 h-5 w-5" /> Voltar
            </Button>
            <Button size="lg" className="flex-[2] h-14 text-base font-bold bg-gradient-orange text-primary-foreground shadow-orange" onClick={proximo}>
              Próximo <ChevronRight className="ml-1 h-5 w-5" />
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Button size="lg" className="w-full h-14 text-base font-bold bg-gradient-orange text-primary-foreground shadow-orange" onClick={compartilhar}>
              <Share2 className="mr-2 h-5 w-5" /> Compartilhar (WhatsApp / Email)
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" size="lg" className="flex-1 h-12" onClick={anterior}>
                <ChevronLeft className="mr-1 h-4 w-4" /> Voltar
              </Button>
              <Button variant="outline" size="lg" className="flex-1 h-12" onClick={baixarPDF}>
                <Download className="mr-1 h-4 w-4" /> Baixar PDF
              </Button>
            </div>
          </div>
        )}
      </footer>

      {/* Modais */}
      <TecladoNumerico
        open={tecladoOpen === "largura"}
        label="Largura"
        initial={mmParaCm(projeto.largura_mm)}
        min={mmParaCm(tip.larguraMin)}
        max={mmParaCm(tip.larguraMax)}
        onConfirm={(v) => { upd("largura_mm", cmParaMm(v)); setTecladoOpen(null); }}
        onCancel={() => setTecladoOpen(null)}
      />
      <TecladoNumerico
        open={tecladoOpen === "altura"}
        label="Altura"
        initial={mmParaCm(projeto.altura_mm)}
        min={mmParaCm(tip.alturaMin)}
        max={mmParaCm(tip.alturaMax)}
        onConfirm={(v) => { upd("altura_mm", cmParaMm(v)); setTecladoOpen(null); }}
        onCancel={() => setTecladoOpen(null)}
      />
      <AssinaturaCanvas
        open={assinaturaOpen}
        nomeInicial={projeto.cliente}
        onConfirm={(dataUrl, nome) => { setAssinatura({ dataUrl, nome }); setAssinaturaOpen(false); toast.success("Assinatura registrada"); }}
        onCancel={() => setAssinaturaOpen(false)}
      />
    </div>
  );
}

function BotaoMedida({ label, valor, min, max, onClick }: { label: string; valor: number; min: number; max: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-2xl border-2 border-border bg-card p-4 flex items-center justify-between active:scale-[0.98] transition"
    >
      <div className="text-left">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="text-[10px] text-muted-foreground">min {cm(min)} · max {cm(max)} cm</div>
      </div>
      <div className="font-display text-3xl font-bold tabular-nums">
        {cm(valor)}<span className="text-base text-muted-foreground ml-1">cm</span>
      </div>
    </button>
  );
}

function ResumoCard({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-base font-semibold mt-0.5 truncate">{valor}</div>
    </div>
  );
}
