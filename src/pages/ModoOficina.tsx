// Modo Oficina v2 — uma TELA SÓ, pra serralheiro peão olhar e entender:
// 1) cabeçalho gigante (lê a 3 m): tipologia, medidas, cor;
// 2) tabela de cortes com a MEDIDA PRA SERRA (já com folga) em destaque;
// 3) diagrama de barras em escala (substitui etiqueta de peça — peça = cor + medida);
// 4) resumo de material (quantas barras comprar);
// 5) sequência curta de soldas/montagem.
// Sem preço, sem QR, sem "próxima peça", sem login.
import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Maximize2, ArrowLeft, Printer } from "lucide-react";
import { obterProjeto, obterCatalogo, ProjetoLocal } from "@/lib/storage";
import { CATALOGO_PADRAO } from "@/lib/catalogo";
import { supabase } from "@/integrations/supabase/client";
import { calcular } from "@/lib/calculator";
import { planejarCorte, planejarProducao, FOLGA_CORTE_MM } from "@/lib/producao";
import { tipologiaPorId, acabamentoPorId } from "@/lib/tipologias";
import Visualizador3DClient from "@/components/Visualizador3DClient";
import { DiagramaBarras } from "@/components/DiagramaBarras";
import { cm } from "@/lib/medidas";

export default function ModoOficina() {
  const { id = "", codigo } = useParams();
  const emMemoria = useMemo(() => obterProjeto(id), [id]);
  const [remoto, setRemoto] = useState<ProjetoLocal | null>(null);

  // Quando aberto pela tela livre da oficina (sem login), busca a ordem pelo código da serralheria.
  useEffect(() => {
    if (emMemoria || !codigo) return;
    void supabase.rpc("ordens_oficina", { _codigo: codigo }).then(({ data }) => {
      const linha = (data ?? []).find((o: { id: string }) => o.id === id) as
        | { id: string; nome: string; cliente: string; dados: Record<string, unknown> }
        | undefined;
      if (!linha) return;
      setRemoto({
        ...(linha.dados as unknown as ProjetoLocal),
        id: linha.id,
        nome: linha.nome,
        cliente: linha.cliente,
      } as ProjetoLocal);
    });
  }, [emMemoria, codigo, id]);

  const projeto = emMemoria ?? remoto;
  const catalogo = useMemo(() => (emMemoria ? obterCatalogo() : CATALOGO_PADRAO), [emMemoria]);

  const resultado = useMemo(() => {
    if (!projeto) return null;
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

  const planoProducao = useMemo(
    () => (projeto && resultado ? planejarProducao(projeto.tipologia, resultado.cortes) : null),
    [projeto, resultado],
  );

  const planoCorte = useMemo(
    () => (resultado ? planejarCorte(resultado.cortes, 6000) : null),
    [resultado],
  );

  // Agrupa cortes idênticos (mesmo perfil + mesma medida).
  const cortesAgrupados = useMemo(() => {
    if (!resultado) return [];
    const map = new Map<string, { codigo: string; descricao: string; comprimento_mm: number; qtd: number }>();
    for (const c of resultado.cortes) {
      const key = `${c.codigo}__${c.comprimento_mm}__${c.descricao}`;
      const existing = map.get(key);
      if (existing) existing.qtd += c.qtd;
      else map.set(key, { ...c });
    }
    return Array.from(map.values()).sort((a, b) => {
      if (a.codigo !== b.codigo) return a.codigo.localeCompare(b.codigo);
      return b.comprimento_mm - a.comprimento_mm;
    });
  }, [resultado]);

  // Atalhos
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "f") { e.preventDefault(); toggleFullscreen(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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
  if (!resultado || !planoProducao || !planoCorte) {
    return <div className="min-h-screen flex items-center justify-center bg-black text-white text-2xl">Carregando…</div>;
  }

  const tip = tipologiaPorId(projeto.tipologia);
  const acab = acabamentoPorId(projeto.cor);
  const totalPecas = cortesAgrupados.reduce((s, c) => s + c.qtd, 0);
  const metragemTotal = cortesAgrupados.reduce((s, c) => s + (c.comprimento_mm * c.qtd) / 1000, 0);

  return (
    <div className="min-h-screen bg-black text-white print:bg-white print:text-black">
      {/* Topbar (esconde no print) */}
      <header className="print:hidden flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-950 sticky top-0 z-10">
        <Link to={`/app/projeto/${projeto.id}`} className="flex items-center gap-2 text-zinc-400 hover:text-white text-sm">
          <ArrowLeft className="h-4 w-4" /> Sair
        </Link>
        <div className="text-zinc-400 text-sm font-mono uppercase tracking-wider truncate">
          OS {projeto.id.slice(0, 6)} · {projeto.cliente || "Sem cliente"}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 rounded text-sm bg-zinc-800 text-zinc-200 hover:bg-zinc-700 flex items-center gap-1.5"
          >
            <Printer className="h-4 w-4" /> Imprimir
          </button>
          <button
            onClick={toggleFullscreen}
            className="px-3 py-1.5 rounded text-sm bg-zinc-800 text-zinc-200 hover:bg-zinc-700 flex items-center gap-1.5"
            title="F"
          >
            <Maximize2 className="h-4 w-4" /> Tela cheia
          </button>
        </div>
      </header>

      {/* CABEÇALHO GIGANTE — lê de 3 m */}
      <section className="px-6 py-5 border-b-2 border-orange-500 print:border-black bg-zinc-950 print:bg-white">
        <div className="flex items-baseline justify-between flex-wrap gap-4">
          <h1 className="text-white print:text-black text-3xl md:text-5xl font-black uppercase tracking-tight leading-none">
            {tip.nome}
          </h1>
          <div className="flex items-center gap-3 text-white print:text-black text-lg md:text-xl">
            <span
              className="inline-block h-6 w-6 rounded-full border-2 border-zinc-600 print:border-black shrink-0"
              style={{ background: acab.hex }}
              aria-hidden
            />
            <span className="font-bold uppercase">{acab.nome}</span>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <BigStat label="Largura" value={cm(projeto.largura_mm)} unit="cm" />
          <BigStat label="Altura" value={cm(projeto.altura_mm)} unit="cm" />
          <BigStat label="Total de peças" value={`${totalPecas}`} unit="cortes" />
          <BigStat label="Folga p/ corte" value={`+${cm(FOLGA_CORTE_MM)}`} unit="cm" highlight />
        </div>
        {projeto.cliente && (
          <p className="mt-3 text-zinc-400 print:text-black text-sm">
            Cliente: <span className="text-white print:text-black font-semibold">{projeto.cliente}</span>
          </p>
        )}
      </section>

      {/* CORPO: tabela de cortes (esquerda) + diagrama de barras (direita) */}
      <main className="grid grid-cols-1 lg:grid-cols-2 gap-0">
        {/* TABELA DE CORTES — folga já embutida na coluna principal */}
        <section className="p-5 border-r border-zinc-800 print:border-black">
          <h2 className="text-orange-400 print:text-black text-sm font-black uppercase tracking-widest mb-3">
            Cortar
          </h2>
          <div className="rounded border border-zinc-800 print:border-black overflow-hidden">
            <table className="w-full">
              <thead className="bg-zinc-900 print:bg-zinc-200 text-zinc-300 print:text-black text-left">
                <tr className="text-xs uppercase tracking-wider">
                  <th className="px-3 py-2 w-16 text-center">Qtd</th>
                  <th className="px-3 py-2">Perfil</th>
                  <th className="px-3 py-2 text-right">Cortar em</th>
                </tr>
              </thead>
              <tbody className="text-white print:text-black">
                {cortesAgrupados.map((c, i) => (
                  <tr key={i} className="border-t border-zinc-800 print:border-zinc-400 even:bg-zinc-950 print:even:bg-zinc-50 align-middle">
                    <td className="px-3 py-3 text-center">
                      <span className="inline-flex items-center justify-center bg-orange-500 text-black rounded font-black tabular-nums text-2xl md:text-3xl h-12 w-12 print:bg-black print:text-white">
                        {c.qtd}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-bold text-base md:text-lg font-mono leading-tight">{c.codigo}</div>
                      <div className="text-zinc-500 print:text-black text-xs leading-tight mt-0.5">{c.descricao}</div>
                    </td>
                    <td className="px-3 py-3 text-right">
                      {/* MEDIDA PRA SERRA (já com folga) — gigante */}
                      <div className="leading-none">
                        <span className="font-black tabular-nums text-3xl md:text-5xl text-white print:text-black">
                          {cm(c.comprimento_mm + FOLGA_CORTE_MM)}
                        </span>
                        <span className="text-orange-400 print:text-black ml-1 text-base font-bold">cm</span>
                      </div>
                      {/* medida útil — pequena, só pra conferência */}
                      <div className="text-zinc-500 print:text-black text-xs mt-1 tabular-nums">
                        útil {cm(c.comprimento_mm)} cm
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-zinc-500 print:text-black text-xs">
            A medida grande já inclui +{cm(FOLGA_CORTE_MM)} cm de folga. <strong>Use essa medida na régua.</strong>
          </p>
        </section>

        {/* DIAGRAMA DE BARRAS — peça = cor + medida, sem etiqueta */}
        <section className="p-5">
          <h2 className="text-orange-400 print:text-black text-sm font-black uppercase tracking-widest mb-3">
            Aproveitamento das barras
          </h2>
          <DiagramaBarras plano={planoCorte} />
          <p className="mt-3 text-zinc-500 print:text-black text-xs leading-relaxed">
            Cada barra de 6 m mostrada em escala. Peças do mesmo tamanho têm a mesma cor.
            O número escrito é a medida pra serra (já com folga). Hachurado = sobra.
          </p>
        </section>
      </main>

      {/* MATERIAL NECESSÁRIO + PREVIEW 3D */}
      <section className="px-6 py-5 border-t border-zinc-800 print:border-black grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <h2 className="text-zinc-400 print:text-black text-xs font-bold uppercase tracking-widest mb-3">
            Material necessário (compra)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {planoCorte.perfis.map((p) => (
              <div
                key={p.codigo}
                className="rounded border border-zinc-800 print:border-black bg-zinc-950 print:bg-white px-4 py-3 flex items-baseline justify-between gap-3"
              >
                <span className="font-mono font-bold text-white print:text-black text-base md:text-lg">
                  {p.codigo}
                </span>
                <span className="text-right">
                  <span className="text-3xl font-black tabular-nums text-orange-400 print:text-black">
                    {p.totalBarras}
                  </span>
                  <span className="text-zinc-400 print:text-black text-sm ml-2">
                    {p.totalBarras === 1 ? "barra" : "barras"} de 6 m
                  </span>
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 text-zinc-400 print:text-black text-sm">
            Metragem total a cortar:{" "}
            <span className="text-white print:text-black font-bold">{metragemTotal.toFixed(2)} m</span>
            {" · "}Sobra prevista:{" "}
            <span className="text-orange-400 print:text-black font-bold">{planoCorte.perdaTotalM.toFixed(2)} m</span>
          </div>
        </div>

        <div>
          <h2 className="text-zinc-400 print:text-black text-xs font-bold uppercase tracking-widest mb-2">
            Como fica
          </h2>
          <div className="aspect-square w-full rounded overflow-hidden border border-zinc-800 print:border-black bg-black print:bg-white">
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
        </div>
      </section>

      {/* MONTAR & SOLDAR — listas curtas */}
      <section className="px-6 py-5 border-t border-zinc-800 print:border-black grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
        <div>
          <h2 className="text-orange-400 print:text-black text-sm font-black uppercase tracking-widest mb-3">
            Montar (em ordem)
          </h2>
          <ol className="space-y-2">
            {planoProducao.sequencia.map((passo, i) => (
              <li key={i} className="flex gap-3 items-start">
                <span className="shrink-0 inline-flex items-center justify-center rounded-full bg-zinc-800 text-orange-400 print:bg-black print:text-white h-8 w-8 font-black tabular-nums text-base">
                  {i + 1}
                </span>
                <span className="text-white print:text-black text-base md:text-lg leading-snug pt-0.5">{passo}</span>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <h2 className="text-orange-400 print:text-black text-sm font-black uppercase tracking-widest mb-3">
            Soldar
          </h2>
          <ul className="space-y-2">
            {planoProducao.soldas.map((s, i) => (
              <li key={i} className="flex items-baseline gap-3 border-b border-zinc-900 print:border-zinc-300 pb-2">
                <span className="font-black tabular-nums text-orange-400 print:text-black text-2xl w-12 shrink-0">
                  {s.qtd}×
                </span>
                <span className="flex-1">
                  <span className="text-white print:text-black font-semibold text-base">{s.descricao}</span>
                  <span className="text-zinc-500 print:text-black ml-2 text-xs uppercase tracking-wider">{s.tipo}</span>
                  {s.observacao && (
                    <div className="text-zinc-500 print:text-black text-xs italic mt-0.5">{s.observacao}</div>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

function BigStat({
  label,
  value,
  unit,
  highlight,
}: {
  label: string;
  value: string;
  unit?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={
        "rounded border px-4 py-3 " +
        (highlight
          ? "border-orange-500 bg-orange-500/10 print:bg-white print:border-black"
          : "border-zinc-800 bg-zinc-950 print:border-black print:bg-white")
      }
    >
      <div className="text-zinc-500 print:text-black text-[10px] md:text-xs uppercase tracking-widest font-bold">
        {label}
      </div>
      <div className="flex items-baseline gap-1.5 mt-1">
        <span className={"font-black tabular-nums leading-none " +
          (highlight ? "text-orange-400 print:text-black text-3xl md:text-4xl" : "text-white print:text-black text-3xl md:text-5xl")}>
          {value}
        </span>
        {unit && <span className="text-zinc-500 print:text-black text-sm font-semibold">{unit}</span>}
      </div>
    </div>
  );
}
