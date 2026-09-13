# Dinheiro recebido reflete no financeiro de todo o sistema

## O problema hoje (confirmado nos dados)

Existem 5 ordens com pagamentos lançados. Em 3 delas (R$ 3.100 já recebidos, com comprovante anexado) o campo "valor faturado" está zerado, porque hoje ele só é preenchido quando alguém marca a ordem como "faturado" na mão.

Consequência:
- Financeiro mostra "Faturado" e "A receber" errados (a receber chega a ficar negativo/zerado).
- "Contas a receber" não lista essas ordens, mesmo tendo saldo em aberto.
- Painel, meta semanal e exportação em CSV usam a mesma base errada.

## O que muda

1. **Valor a cobrar automático.** Assim que uma ordem é aprovada, o valor do orçamento (peças + serviços + frete) passa a ser o valor a cobrar dela. Ninguém precisa digitar nada.
2. **Comprovante anexado = dinheiro entrou.** Ao lançar um pagamento com comprovante, a ordem registra a entrada, a data da primeira entrada e o saldo em aberto é recalculado na hora, em todas as telas.
3. **Quitação automática.** Quando o recebido alcança o valor a cobrar, a ordem é marcada como quitada e a data de faturamento é registrada — sem botão manual.
4. **Um único cálculo para todo o sistema.** Painel, Financeiro, lista de orçamentos, tela de comprovante, meta semanal e CSV passam a usar a mesma conta: a cobrar, recebido, em aberto.
5. **Correção do que já existe.** As ordens antigas com pagamento recebem o valor a cobrar correspondente ao orçamento, para o histórico ficar coerente.
6. Pagamento sem comprovante continua sendo aceito e contado, mas a ordem fica sinalizada como "recebido sem comprovante" na lista de pendências da vendedora.

## Onde aparece

- **Painel:** cartões de faturado/a receber e meta semanal passam a refletir as entradas reais.
- **Financeiro:** totais, por vendedor, mês a mês, contas a receber e CSV.
- **Orçamentos:** pendência de comprovante e saldo em aberto por ordem.
- **Tela de comprovante:** recebido e em aberto corretos logo após anexar.
- **Oficina:** nada muda — serralheiro continua sem ver valores.

## Detalhes técnicos

- Novo módulo `src/lib/financeiro.ts` com `valorACobrar(projeto)` (= `valor_faturado` quando preenchido, senão `totalComServicos(p)` para ordens aprovadas em diante, senão 0), `recebidoDe(id)` e `saldoDe(projeto)`.
- `adicionarPagamento` / `registrarComprovanteLocal` em `src/lib/storage.ts` passam a chamar uma rotina `reconciliarFinanceiro(projetoId)` que grava em `projetos`: `valor_faturado` (quando 0 e ordem aprovada), `faturado_em` e status `faturado` quando o recebido cobre o total.
- Substituir os cálculos duplicados `(p.valor_faturado || 0) - listarPagamentos(...)` em `Painel.tsx`, `Financeiro.tsx`, `ProjetosLista.tsx` e `DialogOrdemFinanceiro.tsx` pelas funções do novo módulo.
- `DialogOrdemFinanceiro`: campo "valor faturado" vira leitura com opção de ajuste manual explícito (preserva casos de desconto/acréscimo).
- Migração de dados única (`run_sql`) preenchendo `valor_faturado` das ordens aprovadas com pagamentos e `faturado_em` das já quitadas.
- `progressoOrcamento.ts`: marco do comprovante considera pagamento sem comprovante como pendência.

## Teste do fluxo ponta a ponta

Com Playwright, logado como gestor: criar orçamento → aprovar → lançar pagamento parcial com comprovante → conferir recebido/em aberto na ordem, no Painel e no Financeiro → lançar o restante → confirmar quitação automática, saldo zero e ordem fora de "Contas a receber". Conferir também o CSV e a meta semanal.
