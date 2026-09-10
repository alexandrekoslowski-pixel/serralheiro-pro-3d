// Conversão e formatação de medidas. Internamente tudo é milímetro;
// na tela o padrão da serralheria é centímetro.
export function mmParaCm(mm: number): number {
  return mm / 10;
}

export function cmParaMm(cm: number): number {
  return Math.round(cm * 10);
}

/** Formata milímetros como centímetros (pt-BR, até 1 casa decimal). */
export function cm(mm: number): string {
  return mmParaCm(mm).toLocaleString("pt-BR", { maximumFractionDigits: 1 });
}
