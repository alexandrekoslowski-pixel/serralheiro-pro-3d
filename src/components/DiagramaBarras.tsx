// Diagrama de barras em escala — substitui a ideia de "etiqueta colada na peça".
// Cada barra de 6m é desenhada como um retângulo longo, com as peças cortadas
// representadas por blocos coloridos em escala, e a medida (já com folga) escrita em cima.
// O funcionário olha o diagrama, mede a barra, corta nas medidas indicadas. Pronto.
import type { PlanoCorte, PlanoCortePerfil } from "@/lib/producao";
import { FOLGA_CORTE_MM } from "@/lib/producao";

const PALETA = [
  "#ea580c", // orange-600
  "#2563eb", // blue-600
  "#16a34a", // green-600
  "#db2777", // pink-600
  "#ca8a04", // yellow-600
  "#7c3aed", // violet-600
  "#dc2626", // red-600
  "#0891b2", // cyan-600
];

// Cor estável por comprimento, pra que peças iguais fiquem da mesma cor entre barras.
function corPorComprimento(perfil: PlanoCortePerfil, comprimento_mm: number): string {
  const tamanhosUnicos = Array.from(
    new Set(perfil.barras.flatMap((b) => b.pecas.map((p) => p.comprimento_mm))),
  ).sort((a, b) => b - a);
  const idx = tamanhosUnicos.indexOf(comprimento_mm);
  return PALETA[idx % PALETA.length];
}

export function DiagramaBarras({ plano }: { plano: PlanoCorte }) {
  if (plano.perfis.length === 0) {
    return <p className="text-zinc-500 text-sm">Sem cortes a planejar.</p>;
  }
  return (
    <div className="space-y-5">
      {plano.perfis.map((perfil) => (
        <PerfilBlock key={perfil.codigo} perfil={perfil} />
      ))}
    </div>
  );
}

function PerfilBlock({ perfil }: { perfil: PlanoCortePerfil }) {
  return (
    <div className="rounded border border-zinc-800 print:border-black bg-zinc-950 print:bg-white p-3">
      <div className="flex items-baseline justify-between mb-2 gap-3 flex-wrap">
        <div className="font-mono font-bold text-white print:text-black text-lg md:text-xl">
          {perfil.codigo}
        </div>
        <div className="text-zinc-400 print:text-black text-sm">
          <span className="text-white print:text-black font-bold text-base">
            {perfil.totalBarras}
          </span>{" "}
          {perfil.totalBarras === 1 ? "barra" : "barras"} de{" "}
          <span className="font-mono">{perfil.barraMm} mm</span> · sobra{" "}
          <span className="text-orange-400 print:text-black font-semibold">
            {perfil.perda_m.toFixed(2)} m
          </span>
        </div>
      </div>
      <div className="space-y-2">
        {perfil.barras.map((barra) => (
          <BarraSVG
            key={barra.numero}
            numero={barra.numero}
            barraMm={perfil.barraMm}
            pecas={barra.pecas.map((p) => ({
              comprimento_mm: p.comprimento_mm,
              cor: corPorComprimento(perfil, p.comprimento_mm),
            }))}
            sobraMm={barra.sobra_mm}
          />
        ))}
      </div>
    </div>
  );
}

function BarraSVG({
  numero,
  barraMm,
  pecas,
  sobraMm,
}: {
  numero: number;
  barraMm: number;
  pecas: { comprimento_mm: number; cor: string }[];
  sobraMm: number;
}) {
  const W = 1000; // largura do SVG em unidades arbitrárias
  const H = 64;
  const escala = W / barraMm;
  let cursor = 0;
  return (
    <div className="flex items-center gap-2">
      <div className="shrink-0 w-7 text-zinc-500 print:text-black text-xs font-bold tabular-nums text-right">
        #{numero}
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-12 md:h-14"
        preserveAspectRatio="none"
        role="img"
        aria-label={`Barra ${numero}`}
      >
        {/* fundo da barra */}
        <rect x={0} y={4} width={W} height={H - 8} fill="#0a0a0a" stroke="#3f3f46" strokeWidth={1} />
        {pecas.map((p, i) => {
          const w = p.comprimento_mm * escala;
          const x = cursor;
          cursor += w;
          // pequeno gap visual pro kerf
          const gap = i < pecas.length - 1 ? 2 : 0;
          const wReal = Math.max(1, w - gap);
          const cortar = p.comprimento_mm + FOLGA_CORTE_MM;
          // Mostra label se couber — senão omite (o número aparece na tabela mesmo)
          const podeMostrar = w > 60;
          return (
            <g key={i}>
              <rect x={x} y={4} width={wReal} height={H - 8} fill={p.cor} opacity={0.95} />
              {podeMostrar && (
                <text
                  x={x + wReal / 2}
                  y={H / 2 + 6}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize={22}
                  fontWeight={900}
                  fontFamily="ui-monospace, SFMono-Regular, monospace"
                  style={{ paintOrder: "stroke", stroke: "#000", strokeWidth: 3 }}
                >
                  {cortar}
                </text>
              )}
            </g>
          );
        })}
        {/* sobra hachurada */}
        {sobraMm > 30 && (
          <g>
            <rect
              x={cursor}
              y={4}
              width={Math.max(1, sobraMm * escala)}
              height={H - 8}
              fill="url(#hatch)"
            />
            <defs>
              <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <rect width="6" height="6" fill="#1a1a1a" />
                <line x1="0" y1="0" x2="0" y2="6" stroke="#52525b" strokeWidth="2" />
              </pattern>
            </defs>
          </g>
        )}
      </svg>
      <div className="shrink-0 w-20 text-right text-zinc-500 print:text-black text-xs tabular-nums">
        sobra
        <div className="text-orange-400 print:text-black font-bold text-sm">
          {sobraMm} mm
        </div>
      </div>
    </div>
  );
}
