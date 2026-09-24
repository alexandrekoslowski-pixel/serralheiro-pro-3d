// Tema claro/escuro — preferência salva por aparelho (localStorage).
const CHAVE = "spro:tema";

export type Tema = "claro" | "escuro";

export function temaAtual(): Tema {
  try {
    return localStorage.getItem(CHAVE) === "claro" ? "claro" : "escuro";
  } catch {
    return "escuro";
  }
}

export function aplicarTema(t: Tema) {
  document.documentElement.classList.toggle("dark", t === "escuro");
  try {
    localStorage.setItem(CHAVE, t);
  } catch {
    /* sem storage */
  }
}

/** Aplica o tema salvo antes da primeira renderização (evita piscar). */
export function iniciarTema() {
  aplicarTema(temaAtual());
}

export function alternarTema(): Tema {
  const proximo: Tema = temaAtual() === "escuro" ? "claro" : "escuro";
  aplicarTema(proximo);
  return proximo;
}
