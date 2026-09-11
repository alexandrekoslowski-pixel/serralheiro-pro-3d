// Perfis reais usados no desenho 3D — as seções batem com a lista de corte
// gerada em src/lib/calculator.ts (mesmos códigos de perfil).
import * as THREE from "three";
import { RoundedBox } from "@react-three/drei";
import { TipologiaId } from "@/lib/tipologias";
import { GEO_BOX, materialPintura } from "./materiais";

export interface Secao {
  /** face visível, em metros */
  w: number;
  /** profundidade, em metros */
  d: number;
}

/** Seção de cada código de perfil do catálogo, em metros. */
export const SECOES: Record<string, Secao> = {
  "TUB-50x30": { w: 0.05, d: 0.03 },
  "TUB-40x40": { w: 0.04, d: 0.04 },
  "TUB-30x30": { w: 0.03, d: 0.03 },
  "TUB-20x20": { w: 0.02, d: 0.02 },
  "CHATA-3/16": { w: 0.025, d: 0.005 },
  "LAM-25": { w: 0.025, d: 0.004 },
  "LAM-ROLO": { w: 0.08, d: 0.012 },
  "TRILHO-U": { w: 0.05, d: 0.04 },
  "TRILHO-LAT": { w: 0.04, d: 0.05 },
};

export interface PerfisTipologia {
  moldura: Secao;
  moldura_cod: string;
  interno: Secao;
  interno_cod: string;
}

/** Qual perfil cada tipologia usa na moldura e no preenchimento. */
export function perfisTipologia(t: TipologiaId): PerfisTipologia {
  const p = (cod: string) => SECOES[cod] ?? { w: 0.03, d: 0.03 };
  switch (t) {
    case "portao_correr":
    case "portao_basculante":
    case "portao_pivotante":
    case "estrutura_metalica":
      return { moldura: p("TUB-50x30"), moldura_cod: "TUB-50x30", interno: p("TUB-30x30"), interno_cod: "TUB-30x30" };
    case "janela_correr_2f":
      return { moldura: p("TUB-40x40"), moldura_cod: "TUB-40x40", interno: p("TUB-20x20"), interno_cod: "TUB-20x20" };
    case "veneziana_metalica":
      return { moldura: p("TUB-30x30"), moldura_cod: "TUB-30x30", interno: p("LAM-25"), interno_cod: "LAM-25" };
    case "portao_rolo":
      return { moldura: p("TRILHO-LAT"), moldura_cod: "TRILHO-LAT", interno: p("LAM-ROLO"), interno_cod: "LAM-ROLO" };
    case "portao_pantografico":
      return { moldura: p("TRILHO-U"), moldura_cod: "TRILHO-U", interno: p("TUB-30x30"), interno_cod: "TUB-30x30" };
    default:
      return { moldura: p("TUB-30x30"), moldura_cod: "TUB-30x30", interno: p("TUB-20x20"), interno_cod: "TUB-20x20" };
  }
}

/**
 * Tubo do desenho. Usa geometria única escalada (leve) — as barras internas de
 * grades e venezianas podem chegar a centenas por peça.
 */
export function Tubo({
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
    <mesh
      position={position}
      rotation={rotation}
      scale={size}
      geometry={GEO_BOX}
      material={materialPintura(color, wireframe)}
      castShadow
      receiveShadow
    />
  );
}

/**
 * Barra da moldura, com cantos levemente arredondados (como o tubo real).
 * Usada só nas 4 barras do quadro — custo de geometria maior, quantidade baixa.
 */
export function TuboMoldura({
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
  const menor = Math.min(size[0], size[1], size[2]);
  const raio = Math.min(0.004, menor / 3);
  if (wireframe) return <Tubo position={position} size={size} color={color} wireframe rotation={rotation} />;
  return (
    <RoundedBox
      position={position}
      rotation={rotation}
      args={size}
      radius={raio}
      smoothness={2}
      castShadow
      receiveShadow
      material={materialPintura(color)}
    />
  );
}

/** Cilindro simples reaproveitável (eixos, roldanas, parafusos). */
export const GEO_CIL = new THREE.CylinderGeometry(1, 1, 1, 16);
