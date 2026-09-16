# Serviços adicionais e valores de automação

Ajustar a parte de serviços do orçamento para cobrir galvanização, jateamento, automação com os valores certos e um item livre digitado pela vendedora.

## Serviços do orçamento inteiro

Na seção de serviços (junto com instalação e deslocamento), passam a existir:

- Galvanização — R$ 250,00 (mínimo, valor editável)
- Jateamento — R$ 250,00 (mínimo, valor editável)
- Instalação simples e instalação complexa (como já é hoje)
- Outro serviço — a vendedora escreve o nome e o valor livremente, podendo adicionar mais de um

Se digitar menos de R$ 250 em galvanização ou jateamento, o sistema volta automaticamente para R$ 250 ao sair do campo, com um aviso curto explicando que é a taxa mínima.

## Valores de automação por peça

Os valores passam a ser:

| Item | Valor |
| --- | --- |
| Portão deslizante | R$ 350,00 |
| Portão basculante | R$ 450,00 |
| Portão pivotante | R$ 750,00 |
| Fechadura elétrica | R$ 250,00 |
| Eletroímã (par de travas) | R$ 420,00 |

Continuam editáveis peça a peça, como hoje. Orçamentos já salvos mantêm o valor que foi gravado neles.

## Onde aparece

Esses serviços entram no total do orçamento, no resumo de fechamento, no PDF do orçamento e no contrato, sempre com nome e valor — sem mostrar custos internos.

## Detalhes técnicos

- `src/lib/politicaPrecos.ts`: incluir `galvanizacao` e `jateamento` em `SERVICOS_POLITICA` com valor 250; adicionar `SERVICO_MINIMO` (R$ 250) e a lista de ids sujeitos ao mínimo; atualizar os valores de `AUTOMACOES_POLITICA` (deslizante 350, basculante 450, pivotante 750, fechadura elétrica 250, eletroímã 420) e ajustar os rótulos (“Eletroímã (par de travas)”).
- `src/pages/Configurador.tsx`: na seção de serviços, aplicar o clamp no blur para os serviços com mínimo, e adicionar o botão “Outro serviço”, que insere em `servicos_politica` um item com id gerado (`extra-<timestamp>`), nome editável em campo de texto e valor editável.
- `src/lib/storage.ts`: `servicos_politica` já guarda `{ id, nome, valor }`, então não há mudança de estrutura de dados nem migração.
- Totais (`servicos_valor`), PDF e contrato já leem essa lista; nenhuma mudança adicional de cálculo.
