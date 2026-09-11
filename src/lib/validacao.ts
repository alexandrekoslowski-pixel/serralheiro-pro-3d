import { z } from "zod";

const soDigitos = (valor: string) => valor.replace(/\D/g, "");

export const emailOpcionalSchema = z.string().trim().max(254).refine(
  (valor) => !valor || z.string().email().safeParse(valor).success,
  "Informe um e-mail válido",
);

export const telefoneOpcionalSchema = z.string().trim().max(15).refine(
  (valor) => !valor || [10, 11].includes(soDigitos(valor).length),
  "Informe o telefone com DDD",
);

export const cepOpcionalSchema = z.string().trim().max(9).refine(
  (valor) => !valor || soDigitos(valor).length === 8,
  "Informe um CEP com 8 números",
);

export const documentoOpcionalSchema = z.string().trim().max(18).refine(
  (valor) => !valor || [11, 14].includes(soDigitos(valor).length),
  "Informe um CPF ou CNPJ completo",
);

export function primeiraMensagem(resultado: z.SafeParseReturnType<unknown, unknown>) {
  return resultado.success ? null : resultado.error.issues[0]?.message ?? "Revise os campos informados";
}