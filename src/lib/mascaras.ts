export type MascaraCampo = "cpfCnpj" | "rgCpf" | "telefone" | "cep" | "inteiro" | "decimal" | "moeda" | "codigo";

const digitos = (valor: string, limite: number) => valor.replace(/\D/g, "").slice(0, limite);

export function mascararCpfCnpj(valor: string) {
  const v = digitos(valor, 14);
  if (v.length <= 11) return v.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  return v.replace(/(\d{2})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1/$2").replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

export function mascararRgCpf(valor: string) {
  const v = digitos(valor, 14);
  return v.length > 11 ? mascararCpfCnpj(v) : v.replace(/(\d{2})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1})$/, "$1-$2");
}

export function mascararTelefone(valor: string) {
  const v = digitos(valor, 11);
  if (v.length <= 10) return v.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  return v.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
}

export function mascararCep(valor: string) {
  return digitos(valor, 8).replace(/(\d{5})(\d)/, "$1-$2");
}

export function mascararCampo(valor: string, mascara?: MascaraCampo) {
  if (!mascara) return valor;
  if (mascara === "cpfCnpj") return mascararCpfCnpj(valor);
  if (mascara === "rgCpf") return mascararRgCpf(valor);
  if (mascara === "telefone") return mascararTelefone(valor);
  if (mascara === "cep") return mascararCep(valor);
  if (mascara === "inteiro") return digitos(valor, 12);
  if (mascara === "codigo") return valor.toUpperCase().replace(/[^A-Z0-9._/-]/g, "").slice(0, 40);
  const limpo = valor.replace(/[^\d,.]/g, "").replace(/,/g, ".");
  const [inteiro, ...decimais] = limpo.split(".");
  return `${inteiro.slice(0, 12)}${decimais.length ? `,${decimais.join("").slice(0, 2)}` : ""}`;
}

export function numeroMascarado(valor: string) {
  const numero = Number(valor.replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, ""));
  return Number.isFinite(numero) ? numero : 0;
}