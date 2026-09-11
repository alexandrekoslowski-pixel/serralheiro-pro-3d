// Referências de escala: pessoa (1,75 m) e carro (4,5 m).
// Modelos próprios, sem download externo — carregam sempre, inclusive offline.
import { Html } from "@react-three/drei";

function Etiqueta({ y, texto }: { y: number; texto: string }) {
  return (
    <Html position={[0, y, 0]} center distanceFactor={9}>
      <div className="pointer-events-none select-none whitespace-nowrap rounded bg-zinc-900/85 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow">
        {texto}
      </div>
    </Html>
  );
}

export function PessoaEscala({ position }: { position: [number, number, number] }) {
  const pele = "#c98d63";
  const camisa = "#22456b";
  const calca = "#2b2f3a";
  const sapato = "#101014";
  const cabelo = "#241812";
  return (
    <group position={position} rotation={[0, -Math.PI / 8, 0]}>
      {/* sapatos */}
      {[-0.095, 0.095].map((x, i) => (
        <mesh key={i} position={[x, 0.03, 0.03]} castShadow>
          <boxGeometry args={[0.085, 0.06, 0.24]} />
          <meshStandardMaterial color={sapato} roughness={0.6} />
        </mesh>
      ))}
      {/* pernas */}
      {[-0.095, 0.095].map((x, i) => (
        <group key={i}>
          <mesh position={[x, 0.24, 0]} castShadow>
            <capsuleGeometry args={[0.055, 0.32, 6, 12]} />
            <meshStandardMaterial color={calca} roughness={0.9} />
          </mesh>
          <mesh position={[x, 0.63, 0]} castShadow>
            <capsuleGeometry args={[0.07, 0.3, 6, 12]} />
            <meshStandardMaterial color={calca} roughness={0.9} />
          </mesh>
        </group>
      ))}
      {/* quadril */}
      <mesh position={[0, 0.86, 0]} castShadow>
        <capsuleGeometry args={[0.145, 0.1, 6, 14]} />
        <meshStandardMaterial color={calca} roughness={0.9} />
      </mesh>
      {/* tronco em V */}
      <mesh position={[0, 1.12, 0]} castShadow>
        <capsuleGeometry args={[0.165, 0.3, 8, 18]} />
        <meshStandardMaterial color={camisa} roughness={0.75} />
      </mesh>
      <mesh position={[0, 1.32, 0]} scale={[1.25, 0.8, 0.85]} castShadow>
        <sphereGeometry args={[0.2, 20, 14]} />
        <meshStandardMaterial color={camisa} roughness={0.75} />
      </mesh>
      {/* braços com cotovelo */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * 0.245, 1.16, 0.01]} rotation={[0, 0, s * 0.12]} castShadow>
            <capsuleGeometry args={[0.05, 0.24, 6, 12]} />
            <meshStandardMaterial color={camisa} roughness={0.75} />
          </mesh>
          <mesh position={[s * 0.27, 0.9, 0.02]} rotation={[0, 0, s * 0.08]} castShadow>
            <capsuleGeometry args={[0.042, 0.22, 6, 12]} />
            <meshStandardMaterial color={pele} roughness={0.85} />
          </mesh>
          <mesh position={[s * 0.285, 0.74, 0.02]} castShadow>
            <sphereGeometry args={[0.05, 12, 10]} />
            <meshStandardMaterial color={pele} roughness={0.85} />
          </mesh>
        </group>
      ))}
      {/* pescoço + cabeça */}
      <mesh position={[0, 1.47, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.055, 0.08, 12]} />
        <meshStandardMaterial color={pele} roughness={0.85} />
      </mesh>
      <mesh position={[0, 1.6, 0]} scale={[0.95, 1.12, 1]} castShadow>
        <sphereGeometry args={[0.105, 24, 20]} />
        <meshStandardMaterial color={pele} roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.645, -0.008]} scale={[1.02, 0.95, 1.03]} castShadow>
        <sphereGeometry args={[0.108, 22, 18, 0, Math.PI * 2, 0, Math.PI / 2.1]} />
        <meshStandardMaterial color={cabelo} roughness={0.95} />
      </mesh>
      <Etiqueta y={1.95} texto="1,75 m" />
    </group>
  );
}

export function CarroEscala({ position }: { position: [number, number, number] }) {
  const corpo = "#b8352c";
  const escuro = "#2a2a2e";
  const vidro = "#16202c";
  const cromo = "#c8cdd3";
  return (
    <group position={position}>
      {/* saia inferior */}
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
        <boxGeometry args={[4.3, 0.34, 1.78]} />
        <meshPhysicalMaterial color={corpo} metalness={0.5} roughness={0.28} clearcoat={0.9} clearcoatRoughness={0.12} />
      </mesh>
      {/* ombro do capô/porta-malas (mais arredondado) */}
      <mesh position={[0, 0.72, 0]} scale={[1, 0.42, 1]} castShadow>
        <sphereGeometry args={[1.05, 26, 18]} />
        <meshPhysicalMaterial color={corpo} metalness={0.5} roughness={0.28} clearcoat={0.9} clearcoatRoughness={0.12} />
      </mesh>
      <mesh position={[1.45, 0.7, 0]} scale={[0.75, 0.16, 0.86]} castShadow>
        <sphereGeometry args={[1, 22, 16]} />
        <meshPhysicalMaterial color={corpo} metalness={0.5} roughness={0.28} clearcoat={0.9} clearcoatRoughness={0.12} />
      </mesh>
      <mesh position={[-1.55, 0.72, 0]} scale={[0.65, 0.18, 0.86]} castShadow>
        <sphereGeometry args={[1, 22, 16]} />
        <meshPhysicalMaterial color={corpo} metalness={0.5} roughness={0.28} clearcoat={0.9} clearcoatRoughness={0.12} />
      </mesh>
      {/* cabine arredondada */}
      <mesh position={[-0.2, 1.0, 0]} scale={[1.25, 0.42, 0.84]} castShadow>
        <sphereGeometry args={[1, 28, 20]} />
        <meshPhysicalMaterial color={corpo} metalness={0.5} roughness={0.28} clearcoat={0.9} clearcoatRoughness={0.12} />
      </mesh>
      {/* vidros */}
      <mesh position={[-0.2, 1.06, 0]} scale={[1.16, 0.34, 0.86]}>
        <sphereGeometry args={[1, 24, 18]} />
        <meshPhysicalMaterial color={vidro} metalness={0.2} roughness={0.06} transmission={0.55} transparent opacity={0.75} />
      </mesh>
      {/* frisos cromados */}
      {[0.9, -0.9].map((z, i) => (
        <mesh key={i} position={[-0.1, 0.62, z]} castShadow>
          <boxGeometry args={[3.4, 0.035, 0.02]} />
          <meshStandardMaterial color={cromo} metalness={0.95} roughness={0.18} />
        </mesh>
      ))}
      {/* para-choques */}
      {[2.16, -2.16].map((x, i) => (
        <mesh key={i} position={[x, 0.42, 0]} castShadow>
          <boxGeometry args={[0.12, 0.26, 1.72]} />
          <meshStandardMaterial color={escuro} roughness={0.8} />
        </mesh>
      ))}
      {/* faróis e lanternas */}
      {[0.58, -0.58].map((z, i) => (
        <mesh key={`f${i}`} position={[2.1, 0.68, z]} castShadow>
          <sphereGeometry args={[0.13, 16, 12]} />
          <meshStandardMaterial color="#fff6dc" emissive="#ffedbf" emissiveIntensity={0.5} roughness={0.15} />
        </mesh>
      ))}
      {[0.6, -0.6].map((z, i) => (
        <mesh key={`l${i}`} position={[-2.12, 0.7, z]} castShadow>
          <boxGeometry args={[0.06, 0.16, 0.36]} />
          <meshStandardMaterial color="#c1322a" emissive="#8d1f18" emissiveIntensity={0.4} roughness={0.3} />
        </mesh>
      ))}
      {/* rodas com pneu e aro */}
      {[[-1.4, 0.78], [1.4, 0.78], [-1.4, -0.78], [1.4, -0.78]].map(([x, z], i) => (
        <group key={i} position={[x, 0.34, z]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh castShadow>
            <torusGeometry args={[0.28, 0.085, 12, 24]} />
            <meshStandardMaterial color="#141416" roughness={0.95} />
          </mesh>
          <mesh>
            <cylinderGeometry args={[0.28, 0.28, 0.2, 22]} />
            <meshStandardMaterial color="#1a1a1c" roughness={0.95} />
          </mesh>
          <mesh position={[0, z > 0 ? 0.105 : -0.105, 0]}>
            <cylinderGeometry args={[0.17, 0.17, 0.03, 18]} />
            <meshStandardMaterial color={cromo} metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      ))}
      <Etiqueta y={1.6} texto="carro 4,5 m" />
    </group>
  );
}
