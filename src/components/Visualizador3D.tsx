// Visualizador 3D principal — geometria por tipologia.
// Carregar via Visualizador3DClient (lazy) para evitar problemas de SSR/init.
import { useEffect, useRef, useMemo, useState } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { OrbitControls, Grid, Html, AdaptiveDpr, AdaptiveEvents, Bvh } from "@react-three/drei";
import { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import { TipologiaId, AcabamentoId, acabamentoPorId } from "@/lib/tipologias";
import { TipoFixacao, LadosFixacao } from "@/lib/fixacao";
import { Tubo, TuboMoldura, perfisTipologia } from "./viz/perfis";
import { materialVidro } from "./viz/materiais";
import { Ambiente as AmbienteHDR, LuzesDia, LuzesNoite, Chao, Muro } from "./viz/cena";
import { Cota } from "./viz/cotas";
import { AcessoriosTipologia, Fixacoes } from "./viz/acessorios";
import { PessoaEscala, CarroEscala } from "./viz/escala";

export type CameraPreset = "iso" | "frente" | "lateral" | "topo";
export type Ambiente = "dia" | "noite";

export interface PecaVisual {
  id?: string;
  nome?: string;
  tipologia: TipologiaId;
  largura_mm: number;
  altura_mm: number;
  cor: AcabamentoId;
  fixacao?: TipoFixacao;
  fixacaoLados?: LadosFixacao;
}

export interface Visualizador3DProps {
  tipologia: TipologiaId;
  largura_mm: number;
  altura_mm: number;
  cor: AcabamentoId;
  /** Quando informado, desenha todas as peças lado a lado. */
  pecas?: PecaVisual[];
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
  /** Peça destacada no desenho (sincroniza com o cartão selecionado). */
  selecionadaId?: string;
  /** Clique na peça dentro do 3D. */
  onSelecionar?: (id: string) => void;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
}

/** Quadro da peça: 4 barras da moldura com o perfil real. */
function Moldura({
  L,
  H,
  w,
  d,
  cor,
  wireframe,
}: {
  L: number;
  H: number;
  w: number;
  d: number;
  cor: string;
  wireframe?: boolean;
}) {
  const half = L / 2;
  return (
    <>
      <TuboMoldura position={[0, w / 2, 0]} size={[L, w, d]} color={cor} wireframe={wireframe} />
      <TuboMoldura position={[0, H - w / 2, 0]} size={[L, w, d]} color={cor} wireframe={wireframe} />
      <TuboMoldura position={[-half + w / 2, H / 2, 0]} size={[w, H, d]} color={cor} wireframe={wireframe} />
      <TuboMoldura position={[half - w / 2, H / 2, 0]} size={[w, H, d]} color={cor} wireframe={wireframe} />
    </>
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
  // Seções reais dos perfis (as mesmas da lista de corte).
  const pf = perfisTipologia(tipologia);
  const t = pf.moldura.w;
  const tp = pf.moldura.d;
  const tThin = pf.interno.w;
  const tThinP = pf.interno.d;
  const halfL = L_m / 2;

  switch (tipologia) {
    case "portao_correr":
    case "portao_basculante":
    case "portao_pivotante":
    case "estrutura_metalica": {
      const nVert = Math.max(2, Math.ceil((L_m * 1000) / 600) - 1);
      const verticais = Array.from({ length: nVert }, (_, i) => {
        const x = -halfL + (L_m * (i + 1)) / (nVert + 1);
        return <Tubo key={`v${i}`} position={[x, H_m / 2, 0]} size={[tThin, H_m - 0.1, tThinP]} color={cor} wireframe={wireframe} />;
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
              <Moldura L={L_m} H={H_m} w={t} d={tp} cor={cor} wireframe={wireframe} />
              {verticais}
            </group>
          </group>
        );
      }

      return (
        <group {...groupTransform}>
          <Moldura L={L_m} H={H_m} w={t} d={tp} cor={cor} wireframe={wireframe} />
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
      // Ancorada no topo: a base sobe à medida que abertura aumenta (enrola pra cima)
      const baseY = H_m - Hvis;
      const lams = Array.from({ length: nLam }, (_, i) => (
        <Tubo
          key={`l${i}`}
          position={[0, baseY + lamH / 2 + i * lamH, 0]}
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
          <Moldura L={L_m} H={H_m} w={t} d={tp} cor={cor} wireframe={wireframe} />
          <Tubo position={[0, H_m / 2, 0]} size={[t * 0.6, H_m - 2 * t, t * 0.6]} color={cor} wireframe={wireframe} />
          <mesh position={[-L_m / 4, H_m / 2, 0]} material={materialVidro()}>
            <boxGeometry args={[L_m / 2 - t, H_m - 2 * t, 0.008]} />
          </mesh>
          <mesh position={[L_m / 4 - desloc, H_m / 2, 0.005]} material={materialVidro()}>
            <boxGeometry args={[L_m / 2 - t, H_m - 2 * t, 0.008]} />
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
          <Moldura L={L_m} H={H_m} w={t} d={tp} cor={cor} wireframe={wireframe} />
          {lams}
        </group>
      );
    }
    case "grade_fixa_balaozinho":
    case "grade_fixa_tijolinho":
    case "grade_fixa_trabalhada": {
      const moldura = (
        <>
          <Moldura L={L_m} H={H_m} w={t} d={tp} cor={cor} wireframe={wireframe} />
        </>
      );

      if (tipologia === "grade_fixa_balaozinho") {
        // Tubos verticais a cada ~150mm com o "balão" no meio
        const nVert = Math.max(2, Math.ceil((L_m * 1000) / 150) - 1);
        const esp = (L_m - 0.12) / (nVert + 1);
        const tubos = Array.from({ length: nVert }, (_, i) => {
          const x = -halfL + 0.06 + esp * (i + 1);
          return (
            <group key={`b${i}`}>
              <Tubo position={[x, H_m / 2, 0]} size={[0.022, H_m - 0.06, 0.022]} color={cor} wireframe={wireframe} />
              <mesh position={[x, H_m / 2, 0]}>
                <sphereGeometry args={[0.055, 12, 10]} />
                <meshStandardMaterial color={cor} metalness={0.6} roughness={0.4} wireframe={wireframe} />
              </mesh>
            </group>
          );
        });
        return <group>{moldura}{tubos}</group>;
      }

      if (tipologia === "grade_fixa_tijolinho") {
        // Barras horizontais + verticais com amarração alternada
        const nHoriz = Math.max(2, Math.ceil((H_m * 1000) / 150) - 1);
        const nVert = Math.max(2, Math.ceil((L_m * 1000) / 300) - 1);
        const espH = (H_m - 0.12) / (nHoriz + 1);
        const espV = (L_m - 0.12) / (nVert + 1);
        const horizontais = Array.from({ length: nHoriz }, (_, i) => (
          <Tubo key={`th${i}`} position={[0, 0.06 + espH * (i + 1), 0]} size={[L_m - 0.06, 0.022, 0.022]} color={cor} wireframe={wireframe} />
        ));
        const verticais = Array.from({ length: nVert }, (_, i) => {
          const x = -halfL + 0.06 + espV * (i + 1);
          const z = i % 2 === 0 ? 0.015 : -0.015; // alterna frente/trás
          return <Tubo key={`tv${i}`} position={[x, H_m / 2, z]} size={[0.022, H_m - 0.06, 0.022]} color={cor} wireframe={wireframe} />;
        });
        return <group>{moldura}{horizontais}{verticais}</group>;
      }

      // Trabalhada: verticais a cada ~200mm + diagonais cruzadas em cada vão
      const nVert = Math.max(2, Math.ceil((L_m * 1000) / 200) - 1);
      const esp = (L_m - 0.12) / (nVert + 1);
      const verticais = Array.from({ length: nVert }, (_, i) => {
        const x = -halfL + 0.06 + esp * (i + 1);
        return <Tubo key={`tr${i}`} position={[x, H_m / 2, 0]} size={[0.022, H_m - 0.06, 0.022]} color={cor} wireframe={wireframe} />;
      });
      const hUtil = H_m - 0.06;
      const diag = Math.sqrt(esp * esp + hUtil * hUtil);
      const ang = Math.atan2(hUtil, esp);
      const diagonais: JSX.Element[] = [];
      for (let i = 0; i <= nVert; i++) {
        const xc = -halfL + 0.06 + esp * (i + 0.5);
        diagonais.push(<Tubo key={`td1-${i}`} position={[xc, H_m / 2, 0.014]} size={[diag, 0.018, 0.018]} color={cor} rotation={[0, 0, ang]} wireframe={wireframe} />);
        diagonais.push(<Tubo key={`td2-${i}`} position={[xc, H_m / 2, -0.014]} size={[diag, 0.018, 0.018]} color={cor} rotation={[0, 0, -ang]} wireframe={wireframe} />);
      }
      return <group>{moldura}{verticais}{diagonais}</group>;
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

// Geometria com abertura suavizada (lerp via useFrame).
// Mantém estado próprio dentro do Canvas para re-render por frame.
function AnimatedGeometria({
  tipologia, L_m, H_m, cor, wireframe, aberturaAlvo,
}: {
  tipologia: TipologiaId;
  L_m: number;
  H_m: number;
  cor: string;
  wireframe?: boolean;
  aberturaAlvo: number;
}) {
  const [aberturaAtual, setAberturaAtual] = useState(aberturaAlvo);
  const ref = useRef(aberturaAlvo);
  useFrame((_, delta) => {
    const next = THREE.MathUtils.damp(ref.current, aberturaAlvo, 4, delta);
    if (Math.abs(next - ref.current) > 0.0005) {
      ref.current = next;
      setAberturaAtual(next);
    }
  });
  return (
    <GeometriaTipologia
      tipologia={tipologia}
      L_m={L_m}
      H_m={H_m}
      cor={cor}
      wireframe={wireframe}
      abertura={aberturaAtual}
    />
  );
}

export default function Visualizador3D({
  tipologia,
  largura_mm,
  altura_mm,
  cor,
  pecas,
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
  selecionadaId,
  onSelecionar,
  onCanvasReady,
}: Visualizador3DProps) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  const lista: PecaVisual[] = useMemo(
    () => (pecas && pecas.length ? pecas : [{ tipologia, largura_mm, altura_mm, cor }]),
    [pecas, tipologia, largura_mm, altura_mm, cor],
  );

  // Distribui as peças lado a lado no eixo X, centralizadas.
  const layout = useMemo(() => {
    const GAP = 0.5;
    const larguras = lista.map((p) => p.largura_mm / 1000);
    const total = larguras.reduce((s, l) => s + l, 0) + GAP * (lista.length - 1);
    let x = -total / 2;
    return lista.map((p, i) => {
      const L = larguras[i];
      const centro = x + L / 2;
      x += L + GAP;
      return {
        peca: p,
        x: centro,
        L_m: L,
        H_m: p.altura_mm / 1000,
        hex: acabamentoPorId(p.cor).hex,
      };
    });
  }, [lista]);

  const larguraTotal = useMemo(() => {
    const GAP = 0.5;
    return lista.reduce((s, p) => s + p.largura_mm / 1000, 0) + GAP * (lista.length - 1);
  }, [lista]);
  const alturaMax = useMemo(() => Math.max(...lista.map((p) => p.altura_mm / 1000)), [lista]);

  const L_m = larguraTotal;
  const H_m = alturaMax;

  // Iluminação por ambiente
  const isNoite = ambiente === "noite";
  const fundoFinal = isNoite ? "#08070a" : bgColor;

  // Pausa a renderização quando a aba não está visível (economia no celular).
  const [ativo, setAtivo] = useState(true);
  useEffect(() => {
    const onVis = () => setAtivo(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const fmt = (mm: number) => `${(mm / 10).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} cm`;

  return (
    <Canvas
      shadows
      dpr={[1, isMobile ? 1.4 : 2]}
      frameloop={ativo ? "always" : "demand"}
      gl={{ preserveDrawingBuffer: true, antialias: !isMobile, powerPreference: "high-performance" }}
      camera={{ position: [4, 3, 4], fov: 45, near: 0.1, far: 200 }}
      style={{ background: fundoFinal }}
    >
      <CanvasReadyHook onReady={onCanvasReady} />
      <AdaptiveDpr pixelated />
      <AdaptiveEvents />

      <AmbienteHDR noite={isNoite} />
      {isNoite ? <LuzesNoite larguraCena={L_m} altura={H_m} /> : <LuzesDia larguraCena={L_m} />}
      <Chao larguraCena={L_m} noite={isNoite} />
      {preset !== "topo" && <Muro larguraCena={L_m} altura={H_m} />}

      {showGrid && (
        <Grid
          args={[20, 20]}
          cellColor={isNoite ? "#1a1a25" : "#6d6862"}
          sectionColor={isNoite ? "#2a2a40" : "#8a7b6a"}
          fadeDistance={40}
          fadeStrength={1.5}
          infiniteGrid
          position={[0, 0.006, 0]}
        />
      )}

      <Bvh firstHitOnly>
        {layout.map((item, i) => {
          const pf = perfisTipologia(item.peca.tipologia);
          const sel = !!selecionadaId && item.peca.id === selecionadaId;
          return (
            <group
              key={item.peca.id ?? i}
              position={[item.x, 0, 0]}
              onClick={
                onSelecionar
                  ? (e) => {
                      e.stopPropagation();
                      if (item.peca.id) onSelecionar(item.peca.id);
                    }
                  : undefined
              }
            >
              <AnimatedGeometria
                tipologia={item.peca.tipologia}
                L_m={item.L_m}
                H_m={item.H_m}
                cor={item.hex}
                wireframe={wireframe}
                aberturaAlvo={abertura}
              />
              <AcessoriosTipologia
                tipologia={item.peca.tipologia}
                L={item.L_m}
                H={item.H_m}
                prof={pf.moldura.d}
              />
              {item.peca.fixacao && (
                <Fixacoes
                  tipo={item.peca.fixacao}
                  lados={item.peca.fixacaoLados ?? "um_lado"}
                  L={item.L_m}
                  H={item.H_m}
                  prof={pf.moldura.d}
                />
              )}

              {sel && (
                <mesh position={[0, item.H_m / 2, 0]}>
                  <boxGeometry args={[item.L_m + 0.16, item.H_m + 0.16, 0.34]} />
                  <meshBasicMaterial color="#f97316" wireframe transparent opacity={0.6} />
                </mesh>
              )}

              {showCotas && (
                <>
                  <Cota
                    eixo="x"
                    de={-item.L_m / 2}
                    ate={item.L_m / 2}
                    nivel={-0.35}
                    texto={fmt(item.peca.largura_mm)}
                  />
                  <Cota
                    eixo="y"
                    de={0}
                    ate={item.H_m}
                    nivel={item.L_m / 2 + 0.35}
                    texto={fmt(item.peca.altura_mm)}
                  />
                </>
              )}

              {lista.length > 1 && item.peca.nome && (
                <Html position={[0, item.H_m + 0.28, 0]} center distanceFactor={9}>
                  <div
                    className={`whitespace-nowrap rounded border px-2 py-0.5 text-[10px] font-semibold ${
                      sel ? "border-orange-500 bg-orange-500 text-white" : "border-border bg-background/85"
                    }`}
                  >
                    {item.peca.nome}
                  </div>
                </Html>
              )}
            </group>
          );
        })}
      </Bvh>

      {showPessoa && <PessoaEscala position={[L_m / 2 + 0.7, 0, 0.3]} />}
      {showCarro && <CarroEscala position={[0, 0, -H_m / 2 - 2.6]} />}

      <OrbitControls
        ref={controlsRef as any}
        enablePan
        autoRotate={autoRotate}
        autoRotateSpeed={1.2}
        enableDamping
        dampingFactor={0.08}
        minDistance={1.5}
        maxDistance={80}
        maxPolarAngle={Math.PI / 2 - 0.02}
        target={[0, H_m / 2, 0]}
      />
      <CameraRig preset={preset} L_m={L_m} H_m={H_m} controlsRef={controlsRef} />
    </Canvas>
  );
}
