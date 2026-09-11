// Materiais e geometrias compartilhadas do visualizador 3D.
// Cache global: evita criar centenas de materiais/geometrias iguais em grades e venezianas.
import * as THREE from "three";

/** Cubo unitário reaproveitado por todos os tubos (escala define o tamanho). */
export const GEO_BOX = new THREE.BoxGeometry(1, 1, 1);

const cachePintura = new Map<string, THREE.MeshPhysicalMaterial>();
const cacheAco = new Map<string, THREE.MeshStandardMaterial>();

/** Pintura eletrostática: base fosca/acetinada + verniz leve por cima. */
export function materialPintura(cor: string, wireframe?: boolean): THREE.MeshPhysicalMaterial {
  const chave = `${cor}|${wireframe ? 1 : 0}`;
  const existente = cachePintura.get(chave);
  if (existente) return existente;
  const m = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(cor),
    metalness: 0.35,
    roughness: 0.42,
    clearcoat: 0.45,
    clearcoatRoughness: 0.35,
    envMapIntensity: 0.9,
    wireframe: !!wireframe,
  });
  cachePintura.set(chave, m);
  return m;
}

/** Aço aparente: trilhos, eixos, roldanas, grapas e parafusos. */
export function materialAco(cor = "#8a8f96", rugosidade = 0.35): THREE.MeshStandardMaterial {
  const chave = `${cor}|${rugosidade}`;
  const existente = cacheAco.get(chave);
  if (existente) return existente;
  const m = new THREE.MeshStandardMaterial({
    color: new THREE.Color(cor),
    metalness: 0.85,
    roughness: rugosidade,
    envMapIntensity: 1,
  });
  cacheAco.set(chave, m);
  return m;
}

let vidroCache: THREE.MeshPhysicalMaterial | null = null;
/** Vidro das janelas. */
export function materialVidro(): THREE.MeshPhysicalMaterial {
  if (vidroCache) return vidroCache;
  vidroCache = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#bfe3ef"),
    transparent: true,
    opacity: 0.32,
    roughness: 0.04,
    metalness: 0,
    transmission: 0.9,
    thickness: 0.01,
    ior: 1.5,
    envMapIntensity: 1.2,
  });
  return vidroCache;
}
