// Modo TV / Oficina — kiosco em tela cheia, sem preço, sem menu.
// Pensado para ser exibido em uma TV/monitor na bancada do serralheiro.
// Lê o projeto do localStorage (mesma fonte do Configurador).
import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Pause, Play, Maximize2, ArrowLeft } from "lucide-react";
import { obterProjeto, obterCatalogo } from "@/lib/storage";
import { calcular } from "@/lib/calculator";
import { planejarCorte, planejarProducao, PecaCorte } from "@/lib/producao";
import { tipologiaPorId } from "@/lib/tipologias";
import Visualizador3DClient from "@/components/Visualizador3DClient";
import { cn } from "@/lib/utils";

const AUTO_INTERVAL_MS = 8000;

export default function ModoOficina() {
  const { id = "" } = useParams();
  const projeto = useMemo(() => obterProjeto(id), [id]);
  const catalogo = useMemo(() => obterCatalogo(), []);

  const resultado = useMemo(() => {
    if (!projeto) return null;
    // calcular sem expor preço — ignoramos custos, usamos só os cortes
    return calcular({
      tipologia: projeto.tipologia,
      largura_mm: projeto.largura_mm,
      altura_mm: projeto.altura_mm,
      cor: projeto.cor,
      maoObraPct: 0,
      margemPct: 0,
      descontoGeralPct: 0,
      catalogo,
      overrides: projeto.overrides,
      extras: [],
    });
  }, [projeto, catalogo]);

  const planoCorte = useMemo(
    () => (resultado ? planejarCorte(resultado.cortes, 6000) : null),
    [resultado],
  );
  const planoProducao = useMemo(
    () => (projeto && resultado ? planejarProducao(projeto.tipologia, resultado.cortes) : null),
    [projeto, resultado],
  );

  // Lista flat de peças (cada peça única, na ordem do plano de corte)
  const pecas = useMemo<PecaCorte[]>(() => {
    if (!planoCorte) return [];
    const out: PecaCorte[] = [];
    for (const perfil of planoCorte.perfis) {
      for (const barra of perfil.barras) {
        for (const p of barra.pecas) out.push(p);
      }
    }
    return out;
  }, [planoCorte]);

  const [idx, setIdx] = useState(0);
  const [auto, setAuto] = useState(false);

  const next = useCallback(() => setIdx((i) => (pecas.length ? (i + 1) % pecas.length : 0)), [pecas.length]);
  const prev = useCallback(() => setIdx((i) => (pecas.length ? (i - 1 + pecas.length) % pecas.length : 0)), [pecas.length]);

  // Auto-avanço
  useEffect(() => {
    if (!auto || pecas.length === 0) return;
    const t = setInterval(next, AUTO_INTERVAL_MS);
    return () => clearInterval(t);
  }, [auto, next, pecas.length]);

  // Setas do teclado / espaço
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); next(); }
      else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); prev(); }
      else if (e.key === " ") { e.preventDefault(); setAuto((a) => !a); }
      else if (e.key.toLowerCase() === "f") { e.preventDefault(); toggleFullscreen(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  };

  if (!projeto) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center space-y-4">
          <p className="text-2xl">Projeto não encontrado</p>
          <Link to="/app" className="text-orange-400 underline">Voltar</Link>
        </div>
      </div>
    );
  }
  if (!resultado || !planoCorte || !planoProducao || pecas.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white text-2xl">
        Carregando ordem de produção…
      </div>
    );
  }

  const tip = tipologiaPorId(projeto.tipologia);
  const peca = pecas[idx];

  // Próximos passos: pega 3 da sequência baseado no progresso
  const totalPecas = pecas.length;
  const progresso = idx + 1;
  const etapaAtualIdx = Math.min(
    Math.floor((progresso / totalPecas) * planoProducao.sequencia.length),
    planoProducao.sequencia.length - 1,
  );
  const proximosPassos = planoProducao.sequencia.slice(etapaAtualIdx, etapaAtualIdx + 3);
  const totalSoldas = planoProducao.soldas.reduce((s, x) => s + x.qtd, 0);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col overflow-hidden select-none">
      {/* Topbar fina — discreto, mas dá pra voltar */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-950">
        <Link to={`/app/projeto/${projeto.id}`} className="flex items-center gap-2 text-zinc-500 hover:text-white text-sm">
          <ArrowLeft className="h-4 w-4" /> Sair do modo TV
        </Link>
        <div className="text-zinc-400 text-sm font-mono uppercase tracking-wider">
          OP {projeto.id.slice(0, 6)} · {projeto.cliente || "Sem cliente"} · {tip.nome}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAuto((a) => !a)}
            className={cn(
              "px-3 py-1.5 rounded text-sm font-semibold flex items-center gap-1.5",
              auto ? "bg-orange-500 text-black" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700",
            )}
            title="Espaço"
          >
            {auto ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {auto ? "Auto" : "Pausado"}
          </button>
          <button
            onClick={toggleFullscreen}
            className="px-3 py-1.5 rounded text-sm bg-zinc-800 text-zinc-300 hover:bg-zinc-700 flex items-center gap-1.5"
            title="F"
          >
            <Maximize2 className="h-4 w-4" /> Tela cheia
          </button>
        </div>
      </header>

      {/* 4 quadrantes */}
      <main className="flex-1 grid grid-cols-2 grid-rows-2 gap-1 bg-zinc-800 p-1 min-h-0">
        {/* Q1: 3D + dimensões */}
        <section className="bg-black p-4 flex flex-col min-h-0">
          <h2 className="text-zinc-500 text-xl font-semibold uppercase tracking-wider mb-2">Peça</h2>
          <div className="flex-1 min-h-0 rounded overflow-hidden border border-zinc-900">
            <Visualizador3DClient
              tipologia={projeto.tipologia}
              largura_mm={projeto.largura_mm}
              altura_mm={projeto.altura_mm}
              cor={projeto.cor}
              autoRotate={false}
              wireframe={false}
              showGrid={false}
              showCotas={true}
              bgColor="#000000"
              preset="iso"
            />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Stat label="Largura" value={`${projeto.largura_mm} mm`} />
            <Stat label="Altura" value={`${projeto.altura_mm} mm`} />
          </div>
        </section>

        {/* Q2: peça atual GIGANTE */}
        <section className="bg-black p-6 flex flex-col justify-between min-h-0">
          <div>
            <h2 className="text-zinc-500 text-xl font-semibold uppercase tracking-wider mb-2">Peça atual</h2>
            <div className="text-orange-400 font-black tabular-nums leading-none" style={{ fontSize: "clamp(4rem, 12vw, 11rem)" }}>
              {peca.id}
            </div>
            <div className="mt-3 text-white text-3xl xl:text-4xl font-bold">{peca.codigo}</div>
            <div className="text-zinc-400 text-xl mt-1">{peca.descricao}</div>
          </div>
          <div className="space-y-2">
            <div className="text-zinc-500 text-lg uppercase tracking-wide">Cortar</div>
            <div className="text-white font-black tabular-nums leading-none" style={{ fontSize: "clamp(3rem, 10vw, 9rem)" }}>
              {peca.comprimento_mm}<span className="text-zinc-500 text-4xl xl:text-5xl ml-3">mm</span>
            </div>
          </div>
        </section>

        {/* Q3: próximos passos */}
        <section className="bg-black p-6 flex flex-col min-h-0">
          <h2 className="text-zinc-500 text-xl font-semibold uppercase tracking-wider mb-3">Próximos passos</h2>
          <ol className="space-y-3 flex-1">
            {proximosPassos.map((passo, i) => (
              <li key={i} className={cn(
                "flex gap-3 items-start",
                i === 0 ? "text-white" : "text-zinc-500",
              )}>
                <span className={cn(
                  "shrink-0 inline-flex items-center justify-center rounded-full font-black tabular-nums",
                  i === 0 ? "bg-orange-500 text-black h-12 w-12 text-2xl" : "bg-zinc-800 text-zinc-400 h-10 w-10 text-xl",
                )}>
                  {etapaAtualIdx + i + 1}
                </span>
                <span className={cn(
                  "leading-tight pt-1",
                  i === 0 ? "text-2xl xl:text-3xl font-semibold" : "text-xl",
                )}>{passo}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* Q4: progresso */}
        <section className="bg-black p-6 flex flex-col justify-between min-h-0">
          <div>
            <h2 className="text-zinc-500 text-xl font-semibold uppercase tracking-wider mb-3">Progresso</h2>
            <ProgressBar label="Peça" current={progresso} total={totalPecas} />
            <div className="mt-4">
              <ProgressBar label="Barras" current={Math.ceil((progresso / totalPecas) * planoCorte.totalBarras)} total={planoCorte.totalBarras} />
            </div>
            <div className="mt-4">
              <ProgressBar label="Soldas previstas" current={0} total={totalSoldas} muted />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Cor" value={projeto.cor.toUpperCase()} />
            <Stat label="Aprov. corte" value={`${planoCorte.aproveitamentoMedioPct}%`} />
          </div>
        </section>
      </main>

      {/* Controles inferiores — botões grandes pra mouse/presenter */}
      <footer className="flex items-stretch border-t border-zinc-800 bg-zinc-950">
        <button
          onClick={prev}
          className="flex-1 flex items-center justify-center gap-3 py-5 text-2xl font-bold text-zinc-300 hover:bg-zinc-900 active:bg-zinc-800 border-r border-zinc-800"
        >
          <ChevronLeft className="h-8 w-8" /> Anterior
        </button>
        <div className="flex items-center justify-center px-8 py-5 text-zinc-400 font-mono text-xl tabular-nums">
          {progresso} / {totalPecas}
        </div>
        <button
          onClick={next}
          className="flex-1 flex items-center justify-center gap-3 py-5 text-2xl font-bold bg-orange-500 text-black hover:bg-orange-400 active:bg-orange-600"
        >
          Próxima <ChevronRight className="h-8 w-8" />
        </button>
      </footer>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-zinc-900 bg-zinc-950 px-3 py-2">
      <div className="text-zinc-500 text-sm uppercase tracking-wider">{label}</div>
      <div className="text-white text-2xl font-bold tabular-nums">{value}</div>
    </div>
  );
}

function ProgressBar({ label, current, total, muted = false }: { label: string; current: number; total: number; muted?: boolean }) {
  const pct = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
  return (
    <div>
      <div className="flex justify-between text-lg mb-1">
        <span className="text-zinc-400 uppercase tracking-wider text-sm">{label}</span>
        <span className={cn("font-black tabular-nums", muted ? "text-zinc-500" : "text-white")}>
          {current} / {total}
        </span>
      </div>
      <div className="h-3 bg-zinc-900 rounded-full overflow-hidden">
        <div
          className={cn("h-full transition-all duration-500", muted ? "bg-zinc-600" : "bg-orange-500")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
