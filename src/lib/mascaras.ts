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

const MINUSCULAS = new Set(["da", "de", "do", "das", "dos", "e", "di", "du", "van", "von", "y"]);

const semEspacosExtras = (valor: string) => valor.replace(/\s+/g, " ").trim();

/** "joão da silva" -> "João da Silva" (aplicar ao sair do campo). */
export function nomeProprio(valor: string): string {
  return semEspacosExtras(valor)
    .toLocaleLowerCase("pt-BR")
    .split(" ")
    .map((palavra, i) => {
      if (i > 0 && MINUSCULAS.has(palavra)) return palavra;
      return palavra.replace(/^[\p{L}]/u, (c) => c.toLocaleUpperCase("pt-BR"));
    })
    .join(" ");
}

/** "são paulo/sp" -> "São Paulo/SP"; também aceita "são paulo - sp". */
export function cidadeUf(valor: string): string {
  const limpo = semEspacosExtras(valor);
  const m = limpo.match(/^(.*?)[\s]*[/-][\s]*([A-Za-z]{2})$/);
  if (m) return `${nomeProprio(m[1])}/${m[2].toLocaleUpperCase("pt-BR")}`;
  return nomeProprio(limpo);
}

/** E-mail sempre minúsculo e sem espaços. */
export function emailNormalizado(valor: string): string {
  return valor.replace(/\s+/g, "").toLocaleLowerCase("pt-BR");
}

/** Primeira letra maiúscula, sem espaços sobrando. */
export function frasePrimeiraMaiuscula(valor: string): string {
  const limpo = semEspacosExtras(valor);
  return limpo.replace(/^[\p{L}]/u, (c) => c.toLocaleUpperCase("pt-BR"));
}

export function numeroMascarado(valor: string) {
  const numero = Number(valor.replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, ""));
  return Number.isFinite(numero) ? numero : 0;
}