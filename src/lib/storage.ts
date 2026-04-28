// Persistência local: projetos, empresa e catálogo customizado.
import { TipologiaId, AcabamentoId } from "./tipologias";
import { ItemOverride, ItemExtra } from "./calculator";
import { Catalogo, CATALOGO_PADRAO } from "./catalogo";

export interface ProjetoLocal {
  id: string;
  nome: string;
  cliente: string;
  tipologia: TipologiaId;
  largura_mm: number;
  altura_mm: number;
  cor: AcabamentoId;
  maoObraPct: number;
  margemPct: number;
  descontoGeralPct: number;
  overrides: Record<string, ItemOverride>;
  extras: ItemExtra[];
  total: number;
  created_at: string;
  updated_at: string;
}

export interface DadosEmpresa {
  nome: string;
  cnpj: string;
  telefone: string;
  email: string;
  endereco: string;
}

const K_PROJETOS = "spro:projetos";
const K_EMPRESA = "spro:empresa";
const K_CATALOGO = "spro:catalogo";

const safe = <T,>(fn: () => T, fallback: T): T => {
  try { return fn(); } catch { return fallback; }
};

export const gerarId = (): string =>
  Math.random().toString(36).slice(2, 7) + Date.now().toString(36).slice(-4);

// ----- Projetos -----
export function listarProjetos(): ProjetoLocal[] {
  return safe(() => {
    const raw = localStorage.getItem(K_PROJETOS);
    return raw ? (JSON.parse(raw) as ProjetoLocal[]) : [];
  }, []);
}

export function obterProjeto(id: string): ProjetoLocal | undefined {
  return listarProjetos().find((p) => p.id === id);
}

export function salvarProjeto(p: ProjetoLocal): void {
  const todos = listarProjetos();
  const idx = todos.findIndex((x) => x.id === p.id);
  const atualizado = { ...p, updated_at: new Date().toISOString() };
  if (idx >= 0) todos[idx] = atualizado;
  else todos.unshift(atualizado);
  localStorage.setItem(K_PROJETOS, JSON.stringify(todos));
}

export function deletarProjeto(id: string): void {
  const todos = listarProjetos().filter((p) => p.id !== id);
  localStorage.setItem(K_PROJETOS, JSON.stringify(todos));
}

export function duplicarProjeto(id: string): ProjetoLocal | undefined {
  const orig = obterProjeto(id);
  if (!orig) return;
  const novo: ProjetoLocal = {
    ...orig,
    id: gerarId(),
    nome: orig.nome + " (cópia)",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  salvarProjeto(novo);
  return novo;
}

// ----- Empresa -----
const EMPRESA_PADRAO: DadosEmpresa = {
  nome: "Sua Serralheria",
  cnpj: "",
  telefone: "",
  email: "",
  endereco: "",
};

export function obterEmpresa(): DadosEmpresa {
  return safe(() => {
    const raw = localStorage.getItem(K_EMPRESA);
    return raw ? { ...EMPRESA_PADRAO, ...JSON.parse(raw) } : EMPRESA_PADRAO;
  }, EMPRESA_PADRAO);
}

export function salvarEmpresa(e: DadosEmpresa): void {
  localStorage.setItem(K_EMPRESA, JSON.stringify(e));
}

// ----- Catálogo -----
export function obterCatalogo(): Catalogo {
  return safe(() => {
    const raw = localStorage.getItem(K_CATALOGO);
    if (!raw) return CATALOGO_PADRAO;
    const parsed = JSON.parse(raw);
    return {
      perfis: parsed.perfis ?? CATALOGO_PADRAO.perfis,
      acessorios: parsed.acessorios ?? CATALOGO_PADRAO.acessorios,
      vidroPorM2: parsed.vidroPorM2 ?? CATALOGO_PADRAO.vidroPorM2,
      multiplicadoresCor: parsed.multiplicadoresCor ?? CATALOGO_PADRAO.multiplicadoresCor,
    };
  }, CATALOGO_PADRAO);
}

export function salvarCatalogo(c: Catalogo): void {
  localStorage.setItem(K_CATALOGO, JSON.stringify(c));
}

export function restaurarCatalogoPadrao(): Catalogo {
  localStorage.removeItem(K_CATALOGO);
  return CATALOGO_PADRAO;
}

// ----- Formatação -----
export const formatarBRL = (n: number): string =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
