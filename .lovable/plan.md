# Regras de orçamento: mínimo de 1 unidade e motor do basculante

## Regra 1 — Valor mínimo de 1 unidade

Já funciona hoje: qualquer item vendido por m² ou por metro cobra no mínimo 1 unidade, para todos os produtos da tabela de preços (não é amarrado a um produto específico). Uma grade de 0,64 m² sai como 1 m² cheio.

Nada muda na tela: o orçamento continua mostrando só o valor final, sem aviso de mínimo.

Ajuste único: garantir que a mesma regra valha também para itens cobrados por hora (hoje sempre cobra 1 hora) e que produtos novos cadastrados na tabela herdem o comportamento automaticamente.

## Regra 2 — Motor do portão basculante

O motor continua opcional. Dentro de cada peça de portão basculante:

1. Uma opção "Deseja incluir motor?".
2. Ao marcar, o sistema calcula largura x altura da peça e indica o porte recomendado:
   - até 3,00 m de largura e 2,50 m de altura: PPA 1/4
   - acima disso: PPA 1/2
3. A lista mostra todos os motores, com os compatíveis em destaque no topo e o rótulo do porte (1/4 ou 1/2).
4. Se a vendedora escolher um motor menor que o recomendado, aparece um aviso em vermelho: "motor subdimensionado para 3,20 m x 2,60 m — recomendado PPA 1/2". O aviso não impede salvar nem aprovar.
5. O aviso também aparece na lista de pendências do orçamento, para o gestor ver antes de aprovar.

## Cadastro dos motores PPA

Vou cadastrar na lista de materiais, na categoria de automatizadores, os motores da regra, cada um com o porte marcado:

- PPA 1/4 Convencional
- PPA 1/4 Jetflex
- PPA 1/2 Convencional
- PPA 1/2 Jetflex
- PPA 1/2 Semi Industrial
- PPA 1/2 Industrial

Preciso dos preços de custo de cada um. Se preferir, cadastro todos com custo zerado e você preenche na tela de Materiais — o preço de venda continua saindo do custo + margem, e pode ser editado à mão no orçamento.

Os motores já existentes (BV Levante, Potenza, Piston etc.) continuam disponíveis na lista, sem porte definido, e podem ser marcados como 1/4 ou 1/2 quando você quiser.

## Detalhes técnicos

- `src/lib/politicaPrecos.ts`: `quantidadeCobrada` passa a aplicar o mínimo de 1 para todas as unidades mensuráveis, incluindo hora; nova função `porteMotorRecomendado(largura_mm, altura_mm)` e `motorSubdimensionado(peca, material)`.
- Novo campo de porte do motor em materiais (`porte_motor`: `1/4` | `1/2` | vazio), editável na tela de Materiais, via migração com GRANTs.
- `src/pages/Configurador.tsx`: checkbox "Incluir motor" por peça, lista de motores ordenada com compatíveis primeiro e badge de porte, alerta de subdimensionamento.
- `src/lib/progressoOrcamento.ts`: o alerta de motor subdimensionado entra como pendência informativa (não bloqueante).
- Cadastro dos 6 motores PPA via inserção de dados na tabela de materiais.
