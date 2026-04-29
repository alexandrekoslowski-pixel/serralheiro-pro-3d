// Visualizador 3D principal — geometria por tipologia.
// Carregar via Visualizador3DClient (lazy) para evitar problemas de SSR/init.
import { useEffect, useRef, useMemo } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Environment, Grid, Html } from "@react-three/drei";
import { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import { TipologiaId, AcabamentoId, acabamentoPorId } from "@/lib/tipologias";

export type CameraPreset = "iso" | "frente" | "lateral" | "topo";

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

// Geometria por tipologia. Trabalha em metros: L_m, H_m.
function GeometriaTipologia({
  tipologia,
  L_m,
  H_m,
  cor,
  wireframe,
}: {
  tipologia: TipologiaId;
  L_m: number;
  H_m: number;
  cor: string;
  wireframe?: boolean;
}) {
  const t = 0.05;       // espessura padrão dos perfis (5cm visual)
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
      return (
        <group>
          {/* Moldura */}
          <Tubo position={[0, t / 2, 0]} size={[L_m, t, t]} color={cor} wireframe={wireframe} />
          <Tubo position={[0, H_m - t / 2, 0]} size={[L_m, t, t]} color={cor} wireframe={wireframe} />
          <Tubo position={[-halfL + t / 2, H_m / 2, 0]} size={[t, H_m, t]} color={cor} wireframe={wireframe} />
          <Tubo position={[halfL - t / 2, H_m / 2, 0]} size={[t, H_m, t]} color={cor} wireframe={wireframe} />
          {verticais}
          {tipologia === "portao_correr" && (
            <Tubo position={[0, -0.04, 0]} size={[L_m * 1.1, 0.04, 0.06]} color="#444" wireframe={wireframe} />
          )}
        </group>
      );
    }
    case "portao_rolo": {
      const nLam = Math.max(2, Math.ceil((H_m * 1000) / 80));
      const lamH = H_m / nLam;
      const lams = Array.from({ length: nLam }, (_, i) => (
        <Tubo
          key={`l${i}`}
          position={[0, lamH / 2 + i * lamH, 0]}
          size={[L_m, lamH * 0.92, 0.02]}
          color={cor}
          wireframe={wireframe}
        />
      ));
      return (
        <group>
          {lams}
          <mesh position={[0, H_m + 0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.08, 0.08, L_m * 1.1, 24]} />
            <meshStandardMaterial color="#666" metalness={0.8} roughness={0.3} wireframe={wireframe} />
          </mesh>
          <Tubo position={[-halfL - 0.04, H_m / 2, 0]} size={[0.04, H_m + 0.2, 0.05]} color="#555" wireframe={wireframe} />
          <Tubo position={[halfL + 0.04, H_m / 2, 0]} size={[0.04, H_m + 0.2, 0.05]} color="#555" wireframe={wireframe} />
        </group>
      );
    }
    case "portao_pantografico": {
      const nMod = Math.max(3, Math.ceil((L_m * 1000) / 500));
      const w = L_m / nMod;
      const diag = Math.sqrt(w * w + H_m * H_m);
      const angle = Math.atan2(H_m, w);
      const xs = Array.from({ length: nMod }, (_, i) => -halfL + w / 2 + i * w);
      const diags: JSX.Element[] = [];
      xs.forEach((x, i) => {
        diags.push(<Tubo key={`d1-${i}`} position={[x, H_m / 2, 0]} size={[diag, 0.025, 0.025]} color={cor} rotation={[0, 0, angle]} wireframe={wireframe} />);
        diags.push(<Tubo key={`d2-${i}`} position={[x, H_m / 2, 0]} size={[diag, 0.025, 0.025]} color={cor} rotation={[0, 0, -angle]} wireframe={wireframe} />);
      });
      const montantes = Array.from({ length: nMod + 1 }, (_, i) => (
        <Tubo key={`m${i}`} position={[-halfL + i * w, H_m / 2, 0]} size={[tThin, H_m, tThin]} color={cor} wireframe={wireframe} />
      ));
      return (
        <group>
          <Tubo position={[0, H_m, 0]} size={[L_m, 0.05, 0.05]} color="#555" wireframe={wireframe} />
          <Tubo position={[0, 0, 0]} size={[L_m, 0.05, 0.05]} color="#555" wireframe={wireframe} />
          {diags}
          {montantes}
        </group>
      );
    }
    case "janela_correr_2f": {
      return (
        <group>
          {/* Moldura externa */}
          <Tubo position={[0, t / 2, 0]} size={[L_m, t, t]} color={cor} wireframe={wireframe} />
          <Tubo position={[0, H_m - t / 2, 0]} size={[L_m, t, t]} color={cor} wireframe={wireframe} />
          <Tubo position={[-halfL + t / 2, H_m / 2, 0]} size={[t, H_m, t]} color={cor} wireframe={wireframe} />
          <Tubo position={[halfL - t / 2, H_m / 2, 0]} size={[t, H_m, t]} color={cor} wireframe={wireframe} />
          {/* Divisória central */}
          <Tubo position={[0, H_m / 2, 0]} size={[t * 0.6, H_m - 2 * t, t * 0.6]} color={cor} wireframe={wireframe} />
          {/* Vidros (2) */}
          <mesh position={[-L_m / 4, H_m / 2, 0]} >
            <boxGeometry args={[L_m / 2 - t, H_m - 2 * t, 0.008]} />
            <meshPhysicalMaterial color="#a8d8e8" transparent opacity={0.35} roughness={0.05} metalness={0} transmission={0.85} />
          </mesh>
          <mesh position={[L_m / 4, H_m / 2, 0.005]} >
            <boxGeometry args={[L_m / 2 - t, H_m - 2 * t, 0.008]} />
            <meshPhysicalMaterial color="#a8d8e8" transparent opacity={0.35} roughness={0.05} metalness={0} transmission={0.85} />
          </mesh>
        </group>
      );
    }
    case "veneziana_metalica": {
      const nLam = Math.max(2, Math.ceil((H_m * 1000) / 60));
      const space = H_m / nLam;
      const lams = Array.from({ length: nLam }, (_, i) => (
        <Tubo
          key={`vl${i}`}
          position={[0, space / 2 + i * space, 0]}
          size={[L_m - 0.1, 0.025, 0.04]}
          color={cor}
          rotation={[Math.PI / 6, 0, 0]}
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
  onCanvasReady,
}: Visualizador3DProps) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const L_m = largura_mm / 1000;
  const H_m = altura_mm / 1000;
  const acab = useMemo(() => acabamentoPorId(cor), [cor]);

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{ preserveDrawingBuffer: true, antialias: true }}
      camera={{ position: [4, 3, 4], fov: 45, near: 0.1, far: 100 }}
      style={{ background: bgColor }}
    >
      <CanvasReadyHook onReady={onCanvasReady} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 8, 5]} intensity={1.1} castShadow />
      <directionalLight position={[-5, 4, -5]} intensity={0.4} />
      <Environment preset="warehouse" />
      {showGrid && (
        <Grid
          args={[20, 20]}
          cellColor="#3a3530"
          sectionColor="#5a4a3a"
          fadeDistance={25}
          fadeStrength={1.5}
          infiniteGrid
          position={[0, 0, 0]}
        />
      )}
      <GeometriaTipologia tipologia={tipologia} L_m={L_m} H_m={H_m} cor={acab.hex} wireframe={wireframe} />
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
