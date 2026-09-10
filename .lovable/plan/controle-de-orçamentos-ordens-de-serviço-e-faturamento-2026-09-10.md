# Controle de orçamentos, ordens de serviço e faturamento

Hoje cada projeto vive só no navegador e termina no orçamento. A ideia é transformar o app num sistema de acompanhamento: cada projeto vira uma ordem com prazo, situação e dinheiro recebido, tudo na nuvem para abrir no celular e no computador da oficina.

## O que muda para você

**1. Dados na nuvem com login**
- Tela de entrar/criar conta.
- Projetos, clientes, prazos e pagamentos salvos na nuvem, visíveis em qualquer aparelho.
- Os projetos que já existem neste navegador são enviados para a sua conta na primeira entrada (com aviso antes).

**2. Painel principal (nova tela inicial do app)**
- Cartões grandes no topo: total orçado, total aprovado, total faturado, total recebido e saldo a receber (mês atual e geral).
- Lista/quadro das ordens com faixa colorida pelo prazo:
  - vermelho: vence em 3 dias ou menos (ou já venceu)
  - amarelo: vence em 4 a 7 dias
  - verde: mais de 7 dias
  - cinza: entregue/faturado (sai da contagem)
- Ordenação automática pela urgência; filtros por situação e cliente; busca por nome.

**3. Etapas da ordem**
Orçamento → Aprovado → Produção → Entregue → Faturado, com botão para avançar direto no cartão e histórico de datas de cada mudança.

**4. Prazo**
Cada ordem ganha data de entrega prometida. Ao aprovar, o app sugere uma data (dias padrão configuráveis em Empresa).

**5. Financeiro**
- Valor orçado (vem do cálculo) e valor faturado (o que foi realmente cobrado).
- Lançamento de pagamentos parciais: data, valor, forma (dinheiro, Pix, cartão, boleto), observação.
- Por ordem: faturado, recebido, saldo em aberto.
- Página Financeiro: orçado x faturado x recebido por mês, gráfico simples, lista de recebimentos, contas a receber (vencidos em destaque) e exportação em CSV.

**6. Oficina continua sem preço**
O Modo Oficina e o PDF de produção seguem sem qualquer valor. Só ganham o prazo de entrega e a situação da ordem.

## Detalhes técnicos

- Ativar Lovable Cloud; autenticação por e-mail/senha; todas as tabelas com RLS por `user_id` e GRANTs.
- Tabelas: `profiles`, `empresa` (dados + prazo padrão + limites de cor), `projetos` (campos atuais + `status`, `prazo_entrega`, `valor_orcado`, `valor_faturado`, `aprovado_em`, `entregue_em`, `faturado_em`), `pagamentos` (projeto_id, data, valor, forma, obs), `catalogo` por usuário.
- Migração da camada `src/lib/storage.ts` para consultas na nuvem via React Query, mantendo a mesma interface para não reescrever o Configurador.
- Importação única do localStorage existente para a conta.
- Novas rotas: `/auth`, `/app` (painel), `/app/projetos` (lista atual), `/app/financeiro`.
- Cor do prazo calculada em util única (`prazoStatus`) com limites lidos das configurações.
- Modo Oficina permanece acessível sem preço; leitura por link direto da ordem para o usuário dono.

## Ordem de execução

1. Cloud + login + tabelas + migração dos dados locais.
2. Campos de ordem (situação, prazo) e edição no projeto.
3. Painel principal com cores e filtros.
4. Pagamentos e página Financeiro com CSV.
5. Ajustes de prazo/situação no Modo Oficina e nos PDFs.
