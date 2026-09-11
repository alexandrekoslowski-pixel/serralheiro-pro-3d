// Cena: iluminação de estúdio local (sem CDN), chão, sombra de contato e muro de contexto.
import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import { materialAco } from "./materiais";

/** Iluminação local — nunca busca HDR externo. */
export function Ambiente({ noite }: { noite?: boolean }) {
  return (
    <Environment resolution={128}>
      <Lightformer
        intensity={noite ? 0.5 : 1.3}
        color={noite ? "#93b6ff" : "#ffffff"}
        position={[0, 6, 2]}
        rotation-x={Math.PI / 2}
        scale={[14, 14, 1]}
      />
      <Lightformer
        intensity={noite ? 0.3 : 0.7}
        color={noite ? "#5c7bb5" : "#dfe9f5"}
        position={[-6, 2, 2]}
        rotation-y={Math.PI / 2}
        scale={[16, 6, 1]}
      />
      <Lightformer
        intensity={noite ? 0.25 : 0.6}
        color={noite ? "#3d4f77" : "#ffe9d2"}
        position={[6, 2, -2]}
        rotation-y={-Math.PI / 2}
        scale={[16, 6, 1]}
      />
    </Environment>
  );
}

export function LuzesDia({ larguraCena }: { larguraCena: number }) {
  const d = Math.max(6, larguraCena * 1.4);
  return (
    <>
      <hemisphereLight args={["#dceaff", "#5b5348", 0.55]} />
      <ambientLight intensity={0.25} />
      <directionalLight
        position={[d * 0.6, d, d * 0.5]}
        intensity={1.5}
        color="#fff3e2"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-d}
        shadow-camera-right={d}
        shadow-camera-top={d}
        shadow-camera-bottom={-d}
        shadow-bias={-0.0006}
      />
      {/* preenchimento frio do lado oposto, para o metal não ficar chapado */}
      <directionalLight position={[-d * 0.7, d * 0.5, -d * 0.4]} intensity={0.5} color="#cfe0ff" />
    </>
  );
}

export function LuzesNoite({ larguraCena, altura }: { larguraCena: number; altura: number }) {
  return (
    <>
      <ambientLight intensity={0.12} color="#9fb6e0" />
      <spotLight
        position={[0, altura + 2.2, 2.4]}
        angle={0.8}
        penumbra={0.7}
        intensity={22}
        distance={18}
        color="#ffd9a0"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight position={[-larguraCena * 0.5, 1.2, 2]} intensity={4} distance={10} color="#7ea6ff" />
    </>
  );
}

/** Piso + sombra de contato (dá o "assentamento" da peça no chão). */
export function Chao({ larguraCena, noite }: { larguraCena: number; noite?: boolean }) {
  const tam = Math.max(14, larguraCena * 3);
  return (
    <>
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.002, 0]} receiveShadow>
        <planeGeometry args={[tam, tam]} />
        <meshStandardMaterial color={noite ? "#1b1e24" : "#6f6c66"} roughness={1} metalness={0} />
      </mesh>
      <ContactShadows
        position={[0, 0.004, 0]}
        opacity={noite ? 0.5 : 0.65}
        scale={tam}
        blur={2.2}
        far={4}
        resolution={512}
        frames={1}
      />
    </>
  );
}

/** Muro de contexto atrás da peça — ajuda o cliente a entender a escala. */
export function Muro({ larguraCena, altura }: { larguraCena: number; altura: number }) {
  const larg = larguraCena + 3;
  const h = Math.min(Math.max(altura * 0.85, 1.6), 2.3);
  return (
    <group position={[0, 0, -0.28]}>
      <mesh position={[-(larguraCena / 2 + larg / 4 + 0.1), h / 2, 0]} receiveShadow castShadow>
        <boxGeometry args={[larg / 2, h, 0.2]} />
        <meshStandardMaterial color="#a79f92" roughness={0.95} />
      </mesh>
      <mesh position={[larguraCena / 2 + larg / 4 + 0.1, h / 2, 0]} receiveShadow castShadow>
        <boxGeometry args={[larg / 2, h, 0.2]} />
        <meshStandardMaterial color="#a79f92" roughness={0.95} />
      </mesh>
      {/* rufo / acabamento superior */}
      <mesh position={[0, h + 0.04, 0]} material={materialAco("#b8b2a6", 0.85)}>
        <boxGeometry args={[larg + larguraCena, 0.08, 0.26]} />
      </mesh>
    </group>
  );
}
