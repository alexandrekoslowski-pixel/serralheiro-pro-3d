export interface EnderecoCep {
  logradouro: string;
  bairro: string;
  cidadeUf: string;
}

export async function buscarCep(cep: string): Promise<EnderecoCep> {
  const numeros = cep.replace(/\D/g, "");
  if (numeros.length !== 8) throw new Error("Informe um CEP com 8 números");
  const resposta = await fetch(`https://viacep.com.br/ws/${numeros}/json/`);
  if (!resposta.ok) throw new Error("Não foi possível consultar o CEP");
  const dados = await resposta.json() as { erro?: boolean; logradouro?: string; bairro?: string; localidade?: string; uf?: string };
  if (dados.erro) throw new Error("CEP não encontrado");
  return {
    logradouro: dados.logradouro ?? "",
    bairro: dados.bairro ?? "",
    cidadeUf: [dados.localidade, dados.uf].filter(Boolean).join("/")
  };
}