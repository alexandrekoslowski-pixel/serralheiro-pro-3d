// Visualizador 3D principal — geometria por tipologia.
// Carregar via Visualizador3DClient (lazy) para evitar problemas de SSR/init.
import { useEffect, useRef, useMemo, useState } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, Grid, Html } from "@react-three/drei";
import { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import { TipologiaId, AcabamentoId, acabamentoPorId } from "@/lib/tipologias";

export type CameraPreset = "iso" | "frente" | "lateral" | "topo";
export type Ambiente = "dia" | "noite";

export interface Visualizador3DProps {
  tipologia: TipologiaId;
  largura_mm: number;
  altura_mm: number;
  cor: AcabamentoId;
  autoRotate?: boolean;
  wireframe?: boolean;
  showGrid?: boolean;
  showCotas?: boolean;
  bgColor?: string;
  preset?: CameraPreset;
  ambiente?: Ambiente;
  showPessoa?: boolean;
  showCarro?: boolean;
  abertura?: number; // 0 (fechado) → 1 (aberto)
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
}

// Tubo retangular — wrapper sobre boxGeometry.
function Tubo({
  position,
  size,
  color,
  wireframe,
  rotation,
}: {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  wireframe?: boolean;
  rotation?: [number, number, number];
}) {
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} metalness={0.6} roughness={0.45} wireframe={wireframe} />
    </mesh>
  );
}

// ============ Pessoa de escala (silhueta 1,75m) ============
function PessoaEscala({ position }: { position: [number, number, number] }) {
  const cor = "#2a2a2a";
  return (
    <group position={position}>
      {/* corpo */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <capsuleGeometry args={[0.18, 0.7, 4, 12]} />
        <meshStandardMaterial color={cor} roughness={0.9} />
      </mesh>
      {/* cabeça */}
      <mesh position={[0, 1.45, 0]} castShadow>
        <sphereGeometry args={[0.13, 16, 16]} />
        <meshStandardMaterial color={cor} roughness={0.9} />
      </mesh>
      {/* pernas */}
      <mesh position={[-0.07, 0.07, 0]} castShadow>
        <capsuleGeometry args={[0.07, 0.55, 4, 8]} />
        <meshStandardMaterial color={cor} roughness={0.9} />
      </mesh>
      <mesh position={[0.07, 0.07, 0]} castShadow>
        <capsuleGeometry args={[0.07, 0.55, 4, 8]} />
        <meshStandardMaterial color={cor} roughness={0.9} />
      </mesh>
      {/* legenda */}
      <Html position={[0, 1.85, 0]} center>
        <div className="px-1.5 py-0.5 rounded bg-zinc-800 text-white text-[9px] font-semibold whitespace-nowrap">
          1,75 m
        </div>
      </Html>
    </group>
  );
}

// ============ Carro de escala (silhueta 4,5 × 1,5 m) ============
function CarroEscala({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* corpo */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[4.3, 0.5, 1.7]} />
        <meshStandardMaterial color="#3a4a5a" metalness={0.4} roughness={0.5} />
      </mesh>
      {/* cabine */}
      <mesh position={[-0.2, 1.0, 0]} castShadow>
        <boxGeometry args={[2.4, 0.55, 1.55]} />
        <meshStandardMaterial color="#2a3a4a" metalness={0.3} roughness={0.5} />
      </mesh>
      {/* rodas (4) */}
      {[[-1.5, -0.7], [1.5, -0.7], [-1.5, 0.7], [1.5, 0.7]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.32, z]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.32, 0.32, 0.22, 16]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
        </mesh>
      ))}
      <Html position={[0, 1.6, 0]} center>
        <div className="px-1.5 py-0.5 rounded bg-zinc-800 text-white text-[9px] font-semibold whitespace-nowrap">
          carro 4,5 m
        </div>
      </Html>
    </group>
  );
}

// Geometria por tipologia. Trabalha em metros: L_m, H_m. abertura: 0–1.
function GeometriaTipologia({
  tipologia,
  L_m,
  H_m,
  cor,
  wireframe,
  abertura,
}: {
  tipologia: TipologiaId;
  L_m: number;
  H_m: number;
  cor: string;
  wireframe?: boolean;
  abertura: number;
}) {
  const t = 0.05;
  const tThin = 0.03;
  const halfL = L_m / 2;

  switch (tipologia) {
    case "portao_correr":
    case "portao_basculante":
    case "portao_pivotante":
    case "estrutura_metalica": {
      const nVert = Math.max(2, Math.ceil((L_m * 1000) / 600) - 1);
      const verticais = Array.from({ length: nVert }, (_, i) => {
        const x = -halfL + (L_m * (i + 1)) / (nVert + 1);
        return <Tubo key={`v${i}`} position={[x, H_m / 2, 0]} size={[tThin, H_m - 0.1, tThin]} color={cor} wireframe={wireframe} />;
      });

      // Animação por tipologia
      let groupTransform: { position?: [number, number, number]; rotation?: [number, number, number] } = {};
      if (tipologia === "portao_correr") {
        groupTransform.position = [-L_m * abertura * 0.95, 0, 0];
      } else if (tipologia === "portao_basculante") {
        groupTransform.position = [0, abertura * H_m * 0.6, 0];
        groupTransform.rotation = [-abertura * Math.PI / 3, 0, 0];
      } else if (tipologia === "portao_pivotante") {
        // gira em torno do eixo descentralizado (1/3)
        const pivotX = -halfL + L_m / 3;
        return (
          <group position={[pivotX, 0, 0]} rotation={[0, abertura * (Math.PI / 2.2), 0]}>
            <group position={[-pivotX, 0, 0]}>
              <Tubo position={[0, t / 2, 0]} size={[L_m, t, t]} color={cor} wireframe={wireframe} />
              <Tubo position={[0, H_m - t / 2, 0]} size={[L_m, t, t]} color={cor} wireframe={wireframe} />
              <Tubo position={[-halfL + t / 2, H_m / 2, 0]} size={[t, H_m, t]} color={cor} wireframe={wireframe} />
              <Tubo position={[halfL - t / 2, H_m / 2, 0]} size={[t, H_m, t]} color={cor} wireframe={wireframe} />
              {verticais}
            </group>
          </group>
        );
      }

      return (
        <group {...groupTransform}>
          <Tubo position={[0, t / 2, 0]} size={[L_m, t, t]} color={cor} wireframe={wireframe} />
          <Tubo position={[0, H_m - t / 2, 0]} size={[L_m, t, t]} color={cor} wireframe={wireframe} />
          <Tubo position={[-halfL + t / 2, H_m / 2, 0]} size={[t, H_m, t]} color={cor} wireframe={wireframe} />
          <Tubo position={[halfL - t / 2, H_m / 2, 0]} size={[t, H_m, t]} color={cor} wireframe={wireframe} />
          {verticais}
          {tipologia === "portao_correr" && (
            <Tubo position={[L_m * abertura * 0.95, -0.04, 0]} size={[L_m * 1.1, 0.04, 0.06]} color="#444" wireframe={wireframe} />
          )}
        </group>
      );
    }
    case "portao_rolo": {
      // Animação: cortina enrola no topo (altura visível diminui)
      const visivel = Math.max(0.05, 1 - abertura);
      const Hvis = H_m * visivel;
      const nLam = Math.max(2, Math.ceil((Hvis * 1000) / 80));
      const lamH = Hvis / nLam;
      const lams = Array.from({ length: nLam }, (_, i) => (
        <Tubo
          key={`l${i}`}
          position={[0, lamH / 2 + i * lamH, 0]}
          size={[L_m, lamH * 0.92, 0.02]}
          color={cor}
          wireframe={wireframe}
        />
      ));
      const rolDiam = 0.08 + abertura * 0.18;
      return (
        <group>
          {lams}
          <mesh position={[0, H_m + 0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[rolDiam, rolDiam, L_m * 1.1, 24]} />
            <meshStandardMaterial color="#666" metalness={0.8} roughness={0.3} wireframe={wireframe} />
          </mesh>
          <Tubo position={[-halfL - 0.04, H_m / 2, 0]} size={[0.04, H_m + 0.2, 0.05]} color="#555" wireframe={wireframe} />
          <Tubo position={[halfL + 0.04, H_m / 2, 0]} size={[0.04, H_m + 0.2, 0.05]} color="#555" wireframe={wireframe} />
        </group>
      );
    }
    case "portao_pantografico": {
      // Animação: comprime lateralmente (encolhe) para a esquerda
      const fator = 1 - abertura * 0.85;
      const Lvis = L_m * fator;
      const halfLvis = Lvis / 2;
      const nMod = Math.max(3, Math.ceil((L_m * 1000) / 500));
      const w = Lvis / nMod;
      const diag = Math.sqrt(w * w + H_m * H_m);
      const angle = Math.atan2(H_m, w);
      const xs = Array.from({ length: nMod }, (_, i) => -halfLvis + w / 2 + i * w);
      const diags: JSX.Element[] = [];
      xs.forEach((x, i) => {
        diags.push(<Tubo key={`d1-${i}`} position={[x, H_m / 2, 0]} size={[diag, 0.025, 0.025]} color={cor} rotation={[0, 0, angle]} wireframe={wireframe} />);
        diags.push(<Tubo key={`d2-${i}`} position={[x, H_m / 2, 0]} size={[diag, 0.025, 0.025]} color={cor} rotation={[0, 0, -angle]} wireframe={wireframe} />);
      });
      const montantes = Array.from({ length: nMod + 1 }, (_, i) => (
        <Tubo key={`m${i}`} position={[-halfLvis + i * w, H_m / 2, 0]} size={[tThin, H_m, tThin]} color={cor} wireframe={wireframe} />
      ));
      // Trilhos completos (não comprimem)
      return (
        <group>
          <Tubo position={[0, H_m, 0]} size={[L_m, 0.05, 0.05]} color="#555" wireframe={wireframe} />
          <Tubo position={[0, 0, 0]} size={[L_m, 0.05, 0.05]} color="#555" wireframe={wireframe} />
          {/* deslocar as peças que comprimem para a esquerda */}
          <group position={[halfL - halfLvis, 0, 0]}>
            {diags}
            {montantes}
          </group>
        </group>
      );
    }
    case "janela_correr_2f": {
      // Folha direita desliza para a esquerda sobre a esquerda
      const desloc = abertura * (L_m / 2 - t);
      return (
        <group>
          <Tubo position={[0, t / 2, 0]} size={[L_m, t, t]} color={cor} wireframe={wireframe} />
          <Tubo position={[0, H_m - t / 2, 0]} size={[L_m, t, t]} color={cor} wireframe={wireframe} />
          <Tubo position={[-halfL + t / 2, H_m / 2, 0]} size={[t, H_m, t]} color={cor} wireframe={wireframe} />
          <Tubo position={[halfL - t / 2, H_m / 2, 0]} size={[t, H_m, t]} color={cor} wireframe={wireframe} />
          <Tubo position={[0, H_m / 2, 0]} size={[t * 0.6, H_m - 2 * t, t * 0.6]} color={cor} wireframe={wireframe} />
          <mesh position={[-L_m / 4, H_m / 2, 0]} >
            <boxGeometry args={[L_m / 2 - t, H_m - 2 * t, 0.008]} />
            <meshPhysicalMaterial color="#a8d8e8" transparent opacity={0.35} roughness={0.05} metalness={0} transmission={0.85} />
          </mesh>
          <mesh position={[L_m / 4 - desloc, H_m / 2, 0.005]} >
            <boxGeometry args={[L_m / 2 - t, H_m - 2 * t, 0.008]} />
            <meshPhysicalMaterial color="#a8d8e8" transparent opacity={0.35} roughness={0.05} metalness={0} transmission={0.85} />
          </mesh>
        </group>
      );
    }
    case "veneziana_metalica": {
      // Lâminas giram (abrem inclinação)
      const nLam = Math.max(2, Math.ceil((H_m * 1000) / 60));
      const space = H_m / nLam;
      const inclin = Math.PI / 6 + abertura * (Math.PI / 3);
      const lams = Array.from({ length: nLam }, (_, i) => (
        <Tubo
          key={`vl${i}`}
          position={[0, space / 2 + i * space, 0]}
          size={[L_m - 0.1, 0.025, 0.04]}
          color={cor}
          rotation={[inclin, 0, 0]}
          wireframe={wireframe}
        />
      ));
      return (
        <group>
          <Tubo position={[0, t / 2, 0]} size={[L_m, t, t]} color={cor} wireframe={wireframe} />
          <Tubo position={[0, H_m - t / 2, 0]} size={[L_m, t, t]} color={cor} wireframe={wireframe} />
          <Tubo position={[-halfL + t / 2, H_m / 2, 0]} size={[t, H_m, t]} color={cor} wireframe={wireframe} />
          <Tubo position={[halfL - t / 2, H_m / 2, 0]} size={[t, H_m, t]} color={cor} wireframe={wireframe} />
          {lams}
        </group>
      );
    }
  }
}

// Câmera — recoloca conforme preset/dimensões.
function CameraRig({
  preset,
  L_m,
  H_m,
  controlsRef,
}: {
  preset: CameraPreset;
  L_m: number;
  H_m: number;
  controlsRef: React.MutableRefObject<OrbitControlsImpl | null>;
}) {
  const { camera } = useThree();
  useEffect(() => {
    const target = new THREE.Vector3(0, H_m / 2, 0);
    const dist = Math.max(L_m, H_m) * 1.6 + 1.5;
    let pos: [number, number, number];
    switch (preset) {
      case "frente": pos = [0, H_m / 2, dist]; break;
      case "lateral": pos = [dist, H_m / 2, 0]; break;
      case "topo": pos = [0, dist * 1.2, 0.001]; break;
      case "iso":
      default: pos = [dist * 0.85, H_m * 0.9 + 0.5, dist * 0.85]; break;
    }
    camera.position.set(...pos);
    camera.lookAt(target);
    camera.updateProjectionMatrix();
    if (controlsRef.current) {
      (controlsRef.current as any).target.copy(target);
      controlsRef.current.update();
    }
  }, [preset, L_m, H_m, camera, controlsRef]);
  return null;
}

function CanvasReadyHook({ onReady }: { onReady?: (c: HTMLCanvasElement) => void }) {
  const { gl } = useThree();
  useEffect(() => { onReady?.(gl.domElement); }, [gl, onReady]);
  return null;
}

// Suaviza a transição da abertura (lerp via useFrame)
function AberturaSuave({ alvo, onChange }: { alvo: number; onChange: (v: number) => void }) {
  const atual = useRef(alvo);
  useFrame((_, delta) => {
    const next = THREE.MathUtils.damp(atual.current, alvo, 4, delta);
    if (Math.abs(next - atual.current) > 0.0005) {
      atual.current = next;
      onChange(next);
    }
  });
  return null;
}

export default function Visualizador3D({
  tipologia,
  largura_mm,
  altura_mm,
  cor,
  autoRotate = false,
  wireframe = false,
  showGrid = true,
  showCotas = true,
  bgColor = "#1a1614",
  preset = "iso",
  ambiente = "dia",
  showPessoa = false,
  showCarro = false,
  abertura = 0,
  onCanvasReady,
}: Visualizador3DProps) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const L_m = largura_mm / 1000;
  const H_m = altura_mm / 1000;
  const acab = useMemo(() => acabamentoPorId(cor), [cor]);
  const aberturaRef = useRef(abertura);
  // Pequeno hack: re-render quando aberturaRef mudar via state
  const [, setTick] = useMemo(() => {
    let t = 0; const setters = new Set<(n: number) => void>();
    return [t, (n: number) => setters.forEach((s) => s(n))];
  }, []);

  // Iluminação por ambiente
  const isNoite = ambiente === "noite";
  const fundoFinal = isNoite ? "#08070a" : bgColor;

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{ preserveDrawingBuffer: true, antialias: true }}
      camera={{ position: [4, 3, 4], fov: 45, near: 0.1, far: 100 }}
      style={{ background: fundoFinal }}
    >
      <CanvasReadyHook onReady={onCanvasReady} />

      {/* Iluminação dia/noite */}
      {isNoite ? (
        <>
          <ambientLight intensity={0.15} color="#3a4a6a" />
          <directionalLight position={[3, 5, 2]} intensity={0.25} color="#6a7aa0" />
          {/* Spot frontal cor quente — efeito vitrine */}
          <spotLight
            position={[0, H_m * 1.5 + 1, 3]}
            angle={0.6}
            penumbra={0.6}
            intensity={2.2}
            color="#ffd6a0"
            castShadow
            target-position={[0, H_m / 2, 0]}
          />
          <pointLight position={[L_m, H_m * 0.4, 2]} intensity={0.6} color="#ffb060" />
        </>
      ) : (
        <>
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 8, 5]} intensity={1.1} castShadow />
          <directionalLight position={[-5, 4, -5]} intensity={0.4} />
          <Environment preset="warehouse" />
        </>
      )}

      {showGrid && (
        <Grid
          args={[20, 20]}
          cellColor={isNoite ? "#1a1a25" : "#3a3530"}
          sectionColor={isNoite ? "#2a2a40" : "#5a4a3a"}
          fadeDistance={25}
          fadeStrength={1.5}
          infiniteGrid
          position={[0, 0, 0]}
        />
      )}

      <AberturaSuave alvo={abertura} onChange={(v) => { aberturaRef.current = v; }} />
      <GeometriaWrapper
        tipologia={tipologia} L_m={L_m} H_m={H_m} cor={acab.hex} wireframe={wireframe} aberturaRef={aberturaRef}
      />

      {/* Escala humana e carro */}
      {showPessoa && <PessoaEscala position={[L_m / 2 + 0.6, 0, 0]} />}
      {showCarro && <CarroEscala position={[0, 0, -L_m / 2 - 1.2]} />}

      {showCotas && (
        <>
          <Html position={[0, -0.25, 0]} center>
            <div className="px-2 py-1 rounded bg-primary text-primary-foreground text-[10px] font-semibold whitespace-nowrap shadow-orange">
              {largura_mm} mm
            </div>
          </Html>
          <Html position={[L_m / 2 + 0.25, H_m / 2, 0]} center>
            <div className="px-2 py-1 rounded bg-primary text-primary-foreground text-[10px] font-semibold whitespace-nowrap shadow-orange">
              {altura_mm} mm
            </div>
          </Html>
        </>
      )}
      <OrbitControls
        ref={controlsRef as any}
        enablePan
        autoRotate={autoRotate}
        autoRotateSpeed={1.2}
        minDistance={2}
        maxDistance={30}
        target={[0, H_m / 2, 0]}
      />
      <CameraRig preset={preset} L_m={L_m} H_m={H_m} controlsRef={controlsRef} />
    </Canvas>
  );
}

// Wrapper que re-renderiza a geometria a cada frame com a abertura suavizada
function GeometriaWrapper({
  tipologia, L_m, H_m, cor, wireframe, aberturaRef,
}: {
  tipologia: TipologiaId;
  L_m: number;
  H_m: number;
  cor: string;
  wireframe?: boolean;
  aberturaRef: React.MutableRefObject<number>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  // Usamos um state interno re-rendado por useFrame
  const [, force] = useReducerLite();
  useFrame(() => {
    force();
  });
  return (
    <group ref={groupRef}>
      <GeometriaTipologia
        tipologia={tipologia}
        L_m={L_m}
        H_m={H_m}
        cor={cor}
        wireframe={wireframe}
        abertura={aberturaRef.current}
      />
    </group>
  );
}

// Mini hook para forçar re-render sem importar useState (evita reorder)
function useReducerLite(): [number, () => void] {
  const ref = useRef(0);
  const setter = useRef<(n: number) => void>(() => {});
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [v, setV] = (require("react") as typeof import("react")).useState(0);
  setter.current = setV;
  ref.current = v;
  return [v, () => setter.current(ref.current + 1)];
}
