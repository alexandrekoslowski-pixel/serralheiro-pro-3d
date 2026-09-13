/** Monta a rua com número e complemento em uma linha só. */
export function ruaComNumero(
  rua?: string | null,
  numero?: string | null,
  complemento?: string | null,
): string {
  const base = [(rua ?? "").trim(), (numero ?? "").trim()].filter(Boolean).join(", ");
  const comp = (complemento ?? "").trim();
  return [base, comp].filter(Boolean).join(" - ");
}

/** Endereço completo para PDFs, contrato e ficha de entrega. */
export function enderecoCompleto(dados: {
  cliente_endereco?: string | null;
  cliente_numero?: string | null;
  cliente_complemento?: string | null;
  cliente_bairro?: string | null;
  cliente_cidade?: string | null;
  cliente_cep?: string | null;
}, separador = " — "): string {
  return [
    ruaComNumero(dados.cliente_endereco, dados.cliente_numero, dados.cliente_complemento),
    (dados.cliente_bairro ?? "").trim(),
    (dados.cliente_cidade ?? "").trim(),
    (dados.cliente_cep ?? "").trim() ? `CEP ${(dados.cliente_cep ?? "").trim()}` : "",
  ].filter(Boolean).join(separador);
}
