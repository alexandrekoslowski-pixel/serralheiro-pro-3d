// Modo Oficina — uma TELA SÓ, sem navegação, sem etiquetas.
// Pensado pro funcionário olhar uma vez e entender tudo:
// 1) o que é a peça (3D + dimensões),
// 2) lista de cortes agrupada por perfil (codigo, medida, qtd, folga),
// 3) sequência de montagem.
// Sem preço. Sem botão "próxima". Sem QR. Pode imprimir (Ctrl+P).
import { useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Maximize2, ArrowLeft, Printer } from "lucide-react";
import { obterProjeto, obterCatalogo } from "@/lib/storage";
import { calcular } from "@/lib/calculator";
import { planejarProducao } from "@/lib/producao";
import { tipologiaPorId } from "@/lib/tipologias";
import Visualizador3DClient from "@/components/Visualizador3DClient";

const FOLGA_MM = 5; // mesma constante usada no calculator.ts

export default function ModoOficina() {
  const { id = "" } = useParams();
  const projeto = useMemo(() => obterProjeto(id), [id]);
  const catalogo = useMemo(() => obterCatalogo(), []);

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

  // Agrupa os cortes por código de perfil, somando peças idênticas.
  const cortesAgrupados = useMemo(() => {
    if (!resultado) return [];
    const map = new Map<string, { codigo: string; descricao: string; comprimento_mm: number; qtd: number }>();
    for (const c of resultado.cortes) {
      const key = `${c.codigo}__${c.comprimento_mm}__${c.descricao}`;
      const existing = map.get(key);
      if (existing) existing.qtd += c.qtd;
      else map.set(key, { ...c });
    }
    // ordena por código, depois maior comprimento
    const arr = Array.from(map.values()).sort((a, b) => {
      if (a.codigo !== b.codigo) return a.codigo.localeCompare(b.codigo);
      return b.comprimento_mm - a.comprimento_mm;
    });
    return arr;
  }, [resultado]);

  // Atalhos de teclado
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "f") { e.preventDefault(); toggleFullscreen(); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") { /* deixa o navegador imprimir */ }
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
  if (!resultado || !planoProducao) {
    return <div className="min-h-screen flex items-center justify-center bg-black text-white text-2xl">Carregando…</div>;
  }

  const tip = tipologiaPorId(projeto.tipologia);
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
          OS {projeto.id.slice(0, 6)} · {projeto.cliente || "Sem cliente"} · {tip.nome}
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

      {/* Cabeçalho da OS (visível na tela e no print) */}
      <div className="px-6 py-4 border-b border-zinc-800 print:border-black grid grid-cols-4 gap-4">
        <Big label="Largura" value={`${projeto.largura_mm} mm`} />
        <Big label="Altura" value={`${projeto.altura_mm} mm`} />
        <Big label="Cor / acabamento" value={projeto.cor.toUpperCase()} />
        <Big label="Total de peças" value={String(totalPecas)} />
      </div>

      {/* Conteúdo principal: 3D à esquerda + Lista de cortes à direita */}
      <main className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-0">
        {/* 3D */}
        <section className="bg-zinc-950 print:bg-white p-4 border-r border-zinc-800 print:border-black">
          <h2 className="text-zinc-400 print:text-black text-xs font-bold uppercase tracking-widest mb-2">Como fica a peça</h2>
          <div className="aspect-square w-full rounded overflow-hidden border border-zinc-900 print:border-zinc-400 bg-black print:bg-white">
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
          <div className="mt-3 text-zinc-400 print:text-black text-sm space-y-1">
            <div>Metragem total de perfil: <span className="text-white print:text-black font-bold">{metragemTotal.toFixed(2)} m</span></div>
            <div>Folga padrão de corte: <span className="text-orange-400 print:text-black font-bold">+{FOLGA_MM} mm</span> em cada peça</div>
          </div>
        </section>

        {/* Lista de cortes — a estrela do show */}
        <section className="p-4 print:p-2">
          <h2 className="text-zinc-400 print:text-black text-xs font-bold uppercase tracking-widest mb-2">Lista de cortes</h2>
          <div className="rounded border border-zinc-800 print:border-black overflow-hidden">
            <table className="w-full">
              <thead className="bg-zinc-900 print:bg-zinc-200 text-zinc-300 print:text-black text-left">
                <tr className="text-sm uppercase tracking-wider">
                  <th className="px-3 py-2 w-16 text-center">Qtd</th>
                  <th className="px-3 py-2">Perfil</th>
                  <th className="px-3 py-2">Função</th>
                  <th className="px-3 py-2 text-right">Cortar em</th>
                  <th className="px-3 py-2 text-right hidden md:table-cell print:table-cell">c/ folga</th>
                </tr>
              </thead>
              <tbody className="text-white print:text-black">
                {cortesAgrupados.map((c, i) => (
                  <tr key={i} className="border-t border-zinc-800 print:border-zinc-400 even:bg-zinc-950 print:even:bg-zinc-50">
                    <td className="px-3 py-3 text-center">
                      <span className="inline-flex items-center justify-center bg-orange-500 text-black rounded font-black tabular-nums text-2xl md:text-3xl h-12 w-12 print:bg-black print:text-white">
                        {c.qtd}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-bold text-lg md:text-xl font-mono">{c.codigo}</div>
                    </td>
                    <td className="px-3 py-3 text-zinc-300 print:text-black text-base md:text-lg">{c.descricao}</td>
                    <td className="px-3 py-3 text-right">
                      <span className="font-black tabular-nums text-3xl md:text-5xl">
                        {c.comprimento_mm}
                      </span>
                      <span className="text-zinc-500 print:text-black ml-1 text-base">mm</span>
                    </td>
                    <td className="px-3 py-3 text-right hidden md:table-cell print:table-cell">
                      <span className="font-bold tabular-nums text-xl text-orange-400 print:text-black">
                        {c.comprimento_mm + FOLGA_MM}
                      </span>
                      <span className="text-zinc-500 print:text-black ml-1 text-sm">mm</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-zinc-500 print:text-black text-sm">
            * "c/ folga" já inclui +{FOLGA_MM} mm pra ajuste/lixamento. Use essa medida na régua.
          </p>
        </section>
      </main>

      {/* Sequência de montagem — abaixo, em tela inteira */}
      <section className="px-6 py-5 border-t border-zinc-800 print:border-black">
        <h2 className="text-zinc-400 print:text-black text-xs font-bold uppercase tracking-widest mb-3">Sequência de montagem</h2>
        <ol className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
          {planoProducao.sequencia.map((passo, i) => (
            <li key={i} className="flex gap-3 items-start">
              <span className="shrink-0 inline-flex items-center justify-center rounded-full bg-zinc-800 text-orange-400 print:bg-black print:text-white h-9 w-9 font-black tabular-nums text-lg">
                {i + 1}
              </span>
              <span className="text-white print:text-black text-lg leading-snug pt-1">{passo}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* Soldas + ferramentas + observações */}
      <section className="px-6 py-5 border-t border-zinc-800 print:border-black grid grid-cols-1 md:grid-cols-3 gap-6 pb-10">
        <div>
          <h3 className="text-zinc-400 print:text-black text-xs font-bold uppercase tracking-widest mb-2">Soldas</h3>
          <ul className="space-y-1.5">
            {planoProducao.soldas.map((s, i) => (
              <li key={i} className="flex items-baseline gap-2 text-white print:text-black">
                <span className="font-black tabular-nums text-orange-400 print:text-black w-8">{s.qtd}×</span>
                <span className="flex-1">
                  <span className="font-semibold">{s.descricao}</span>
                  <span className="text-zinc-500 print:text-black ml-1 text-sm">({s.tipo})</span>
                  {s.observacao && <div className="text-zinc-500 print:text-black text-xs italic">{s.observacao}</div>}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-zinc-400 print:text-black text-xs font-bold uppercase tracking-widest mb-2">Ferramentas</h3>
          <ul className="space-y-1 text-white print:text-black text-sm">
            {planoProducao.ferramentas.map((f, i) => (
              <li key={i} className="flex gap-2"><span className="text-orange-400 print:text-black">•</span> {f}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-zinc-400 print:text-black text-xs font-bold uppercase tracking-widest mb-2">Observações</h3>
          <ul className="space-y-1.5 text-white print:text-black text-sm">
            {planoProducao.observacoes.map((o, i) => (
              <li key={i} className="flex gap-2"><span className="text-orange-400 print:text-black">!</span> {o}</li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

function Big({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-zinc-800 print:border-black bg-zinc-950 print:bg-white px-4 py-3">
      <div className="text-zinc-500 print:text-black text-xs uppercase tracking-widest font-bold">{label}</div>
      <div className="text-white print:text-black text-3xl md:text-4xl font-black tabular-nums leading-tight mt-1">{value}</div>
    </div>
  );
}
