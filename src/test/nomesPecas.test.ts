import { describe, it, expect } from "vitest";
import { renumerarNomesAutomaticosPecas, categoriaNomePeca } from "@/lib/storage";
import type { Peca } from "@/lib/storage";

const peca = (nome: string, tipologia: Peca["tipologia"]): Peca => (({
  id: Math.random().toString(36).slice(2),
  nome,
  tipologia,
  largura_mm: 1000,
  altura_mm: 1000,
  cor: "branco",
  fixacao: "chumbado",
  fixacaoLados: "dentro",
  checklist_respostas: {},
}) as unknown as Peca);

describe("nomes automáticos das peças", () => {
  it("usa o nome completo do produto", () => {
    expect(categoriaNomePeca("grade_fixa_balaozinho")).toBe("Grade Fixa Balãozinho");
    expect(categoriaNomePeca("portao_pivotante")).toBe("Portão Pivotante");
  });

  it("numera por produto e omite número quando há só uma", () => {
    const r = renumerarNomesAutomaticosPecas([
      peca("", "grade_fixa_balaozinho"),
      peca("Grade 1", "grade_fixa_balaozinho"),
      peca("Portão 1", "portao_pivotante"),
    ]);
    expect(r.map((p) => p.nome)).toEqual([
      "Grade Fixa Balãozinho 1",
      "Grade Fixa Balãozinho 2",
      "Portão Pivotante",
    ]);
  });

  it("remove número ao sobrar apenas uma peça do produto", () => {
    const r = renumerarNomesAutomaticosPecas([peca("Grade Fixa Balãozinho 2", "grade_fixa_balaozinho")]);
    expect(r[0].nome).toBe("Grade Fixa Balãozinho");
  });

  it("preserva nomes personalizados e limpa '(cópia)'", () => {
    const r = renumerarNomesAutomaticosPecas([
      peca("Portão da Maria", "portao_pivotante"),
      peca("Portão Pivotante (cópia)", "portao_pivotante"),
    ]);
    expect(r.map((p) => p.nome)).toEqual(["Portão da Maria", "Portão Pivotante"]);
  });
});
