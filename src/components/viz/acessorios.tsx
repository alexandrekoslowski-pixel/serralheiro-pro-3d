// Acessórios e fixação desenhados conforme o cadastro da peça.
import { TipologiaId } from "@/lib/tipologias";
import { TipoFixacao, LadosFixacao } from "@/lib/fixacao";
import { GEO_CIL } from "./perfis";
import { materialAco } from "./materiais";

type P3 = [number, number, number];

function Cilindro({ pos, r, h, rot, cor = "#8a8f96" }: { pos: P3; r: number; h: number; rot?: P3; cor?: string }) {
  return <mesh position={pos} rotation={rot} scale={[r, h, r]} geometry={GEO_CIL} material={materialAco(cor)} castShadow />;
}

/** Dobradiças no lado do eixo (portões e janelas de abrir). */
function Dobradicas({ x, H, prof }: { x: number; H: number; prof: number }) {
  const alturas = [H * 0.15, H * 0.5, H * 0.85];
  return (
    <>
      {alturas.map((y, i) => (
        <group key={i}>
          <Cilindro pos={[x, y, prof / 2 + 0.012]} r={0.014} h={0.09} />
          <mesh position={[x, y, prof / 2 + 0.002]} material={materialAco("#6f757d")} castShadow>
            <boxGeometry args={[0.06, 0.09, 0.006]} />
          </mesh>
        </group>
      ))}
    </>
  );
}

/** Fechadura + puxador. */
function Fechadura({ x, y, prof }: { x: number; y: number; prof: number }) {
  return (
    <group>
      <mesh position={[x, y, prof / 2 + 0.008]} material={materialAco("#b9c0c7", 0.25)} castShadow>
        <boxGeometry args={[0.05, 0.12, 0.014]} />
      </mesh>
      <Cilindro pos={[x, y - 0.04, prof / 2 + 0.02]} r={0.011} h={0.03} rot={[Math.PI / 2, 0, 0]} cor="#cfd6dd" />
      <mesh position={[x - 0.09, y, prof / 2 + 0.03]} material={materialAco("#cfd6dd", 0.22)} castShadow>
        <boxGeometry args={[0.16, 0.022, 0.022]} />
      </mesh>
    </group>
  );
}

/** Roldanas e trilho do portão de correr. */
function Roldanas({ L, prof }: { L: number; prof: number }) {
  const xs = [-L / 2 + 0.25, L / 2 - 0.25];
  return (
    <>
      {xs.map((x, i) => (
        <Cilindro key={i} pos={[x, 0.055, 0]} r={0.055} h={prof * 0.7} rot={[Math.PI / 2, 0, 0]} cor="#70767e" />
      ))}
    </>
  );
}

/** Eixo com mola do portão de rolo. */
function EixoRolo({ L, H }: { L: number; H: number }) {
  return <Cilindro pos={[0, H + 0.11, 0]} r={0.1} h={L + 0.12} rot={[0, 0, Math.PI / 2]} cor="#6b7079" />;
}

export function AcessoriosTipologia({
  tipologia,
  L,
  H,
  prof,
}: {
  tipologia: TipologiaId;
  L: number;
  H: number;
  prof: number;
}) {
  switch (tipologia) {
    case "portao_correr":
      return (
        <>
          <Roldanas L={L} prof={prof} />
          <Fechadura x={L / 2 - 0.12} y={H * 0.45} prof={prof} />
        </>
      );
    case "portao_pivotante":
      return (
        <>
          <Dobradicas x={-L / 2 + 0.02} H={H} prof={prof} />
          <Fechadura x={L / 2 - 0.12} y={H * 0.45} prof={prof} />
        </>
      );
    case "portao_basculante":
      return <Fechadura x={0} y={H * 0.35} prof={prof} />;
    case "portao_rolo":
      return <EixoRolo L={L} H={H} />;
    case "portao_pantografico":
      return <Roldanas L={L} prof={prof} />;
    case "janela_correr_2f":
      return <Fechadura x={0} y={H * 0.5} prof={prof} />;
    default:
      return null;
  }
}

/** Grapas de chumbar ou parafuso+bucha, dentro ou fora do quadro, 1 ou 2 lados. */
export function Fixacoes({
  tipo,
  lados,
  L,
  H,
  prof,
}: {
  tipo: TipoFixacao;
  lados: LadosFixacao;
  L: number;
  H: number;
  prof: number;
}) {
  const chumbado = tipo === "chumbado_dentro" || tipo === "chumbado_fora";
  const dentro = tipo === "chumbado_dentro" || tipo === "parafusado_dentro";
  const nY = Math.max(2, Math.round(H / 0.7));
  const ys = Array.from({ length: nY }, (_, i) => ((i + 1) * H) / (nY + 1));
  const xs = [-L / 2, L / 2];
  const zs: number[] = lados === "dois_lados" ? [prof / 2 + 0.01, -(prof / 2 + 0.01)] : [prof / 2 + 0.01];

  return (
    <group>
      {ys.map((y) =>
        xs.map((x, xi) =>
          zs.map((z, zi) => {
            const sinal = x < 0 ? -1 : 1;
            const desloc = dentro ? -sinal * 0.045 : sinal * 0.055;
            const key = `${y}-${xi}-${zi}`;
            return chumbado ? (
              // grapa chata saindo do montante para dentro da alvenaria
              <mesh
                key={key}
                position={[x + desloc, y, z * 0]}
                material={materialAco("#7c828a", 0.6)}
                castShadow
              >
                <boxGeometry args={[0.11, 0.025, 0.005]} />
              </mesh>
            ) : (
              <mesh key={key} position={[x + desloc, y, z]} rotation={[Math.PI / 2, 0, 0]} material={materialAco("#c2c8cf", 0.25)} castShadow>
                <cylinderGeometry args={[0.008, 0.008, 0.03, 10]} />
              </mesh>
            );
          }),
        ),
      )}
    </group>
  );
}
