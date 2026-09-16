# Nomes das peças com o nome completo do produto

Hoje as peças são numeradas por categoria curta ("Portão 1", "Grade 2"). Passar a usar o nome completo do produto, renumerado automaticamente conforme as peças são adicionadas, duplicadas, removidas ou trocam de produto.

## Como fica

- Duas grades fixas balãozinho: **Grade fixa balaozinho 1** e **Grade fixa balaozinho 2**. Duplicar a primeira cria automaticamente a "2".
- Dois portões pivotantes: **Portão pivotante 1** e **Portão pivotante 2**.
- Se só existir uma peça daquele produto, ela fica **sem número**: apenas "Grade fixa balaozinho".
- Remover uma peça renumera as restantes (1, 2, 3...) sem deixar buracos.
- Trocar o produto/modelo da peça atualiza o nome automaticamente — desde que o nome ainda seja automático.
- Nomes digitados à mão pela vendedora **nunca são alterados**.
- Nomes automáticos antigos ("Peça 1", "Portão 2", "... (cópia)") são corrigidos ao abrir o orçamento.
- O mesmo nome aparece nos cartões, orçamento em PDF, contrato, WhatsApp e ordem de serviço.

## Detalhes técnicos

- `src/lib/storage.ts`: `categoriaNomePeca()` passa a retornar o nome completo da tipologia/produto; `renumerarNomesAutomaticosPecas()` conta por nome completo e omite o número quando só há uma peça daquele nome; o detector de nome automático passa a aceitar nomes antigos por categoria e nomes completos numerados.
- `src/pages/Configurador.tsx`: criação, duplicação, remoção e troca de produto já chamam a renumeração — apenas conferir que todos os caminhos usam a nova regra.
- Sem mudança de banco de dados; apenas a regra de nomes.
