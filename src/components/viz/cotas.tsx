// Cotas 3D com linha de chamada e setas (substituem as etiquetas soltas).
import { Html, Line } from "@react-three/drei";

type P3 = [number, number, number];

function Seta({ pos, dir }: { pos: P3; dir: "x+" | "x-" | "y+" | "y-" }) {
  const rot: P3 =
    dir === "x+" ? [0, 0, -Math.PI / 2] : dir === "x-" ? [0, 0, Math.PI / 2] : dir === "y+" ? [0, 0, 0] : [Math.PI, 0, 0];
  return (
    <mesh position={pos} rotation={rot}>
      <coneGeometry args={[0.022, 0.075, 10]} />
      <meshBasicMaterial color="#38bdf8" />
    </mesh>
  );
}

/**
 * Cota entre dois pontos no eixo X (horizontal) ou Y (vertical).
 * `texto` já vem formatado (cm) pela página.
 */
export function Cota({
  eixo,
  de,
  ate,
  nivel,
  z = 0,
  texto,
}: {
  eixo: "x" | "y";
  /** início da medida no eixo */
  de: number;
  /** fim da medida no eixo */
  ate: number;
  /** posição da linha de cota no eixo perpendicular */
  nivel: number;
  z?: number;
  texto: string;
}) {
  const a: P3 = eixo === "x" ? [de, nivel, z] : [nivel, de, z];
  const b: P3 = eixo === "x" ? [ate, nivel, z] : [nivel, ate, z];
  const meio: P3 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, z];
  const ext = 0.12;
  const chamadaA: [P3, P3] =
    eixo === "x" ? [[de, nivel - ext, z], [de, nivel + ext, z]] : [[nivel - ext, de, z], [nivel + ext, de, z]];
  const chamadaB: [P3, P3] =
    eixo === "x" ? [[ate, nivel - ext, z], [ate, nivel + ext, z]] : [[nivel - ext, ate, z], [nivel + ext, ate, z]];

  return (
    <group>
      <Line points={[a, b]} color="#38bdf8" lineWidth={1.6} />
      <Line points={chamadaA} color="#38bdf8" lineWidth={1} opacity={0.7} transparent />
      <Line points={chamadaB} color="#38bdf8" lineWidth={1} opacity={0.7} transparent />
      <Seta pos={a} dir={eixo === "x" ? "x-" : "y-"} />
      <Seta pos={b} dir={eixo === "x" ? "x+" : "y+"} />
      <Html position={meio} center distanceFactor={8} zIndexRange={[10, 0]}>
        <div className="pointer-events-none select-none whitespace-nowrap rounded-md bg-sky-500 px-2 py-0.5 text-[11px] font-semibold text-white shadow-lg">
          {texto}
        </div>
      </Html>
    </group>
  );
}
