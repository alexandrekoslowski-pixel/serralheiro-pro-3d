# O que melhorar (e o que enxugar) no sistema

Foco: o dono acompanha orçado x faturado mês a mês e o status de cada ordem; as atendentes precisam de telas simples.

## 1. Painel mais direto para o dono
- Cartão de resumo do mês atual em destaque: orçado no mês, faturado no mês, recebido no mês e a receber (hoje os números são de todo o histórico).
- Comparação com o mês anterior (seta para cima/baixo em porcentagem).
- Contador rápido por situação (ex.: 3 em orçamento, 2 em produção), clicável para filtrar.
- Aviso de ordens vencidas separado das vermelhas, no topo.

## 2. Atendimento mais intuitivo
- Botão único "Novo orçamento" que já abre pedindo cliente, telefone e tipo de portão, sem passar pela lista.
- Cadastro de clientes reaproveitável: ao digitar o nome, sugerir clientes já atendidos e preencher telefone/endereço.
- Na ordem, campo de telefone e botão de WhatsApp para enviar o orçamento em PDF.
- Anotações rápidas por ordem (observações do cliente), visíveis no painel.

## 3. Financeiro
- Gráfico simples de barras por mês (orçado x faturado x recebido) na página Financeiro.
- Taxa de conversão: quanto do que foi orçado virou aprovado no mês.
- Recebimentos atrasados destacados (faturado há mais de X dias sem pagamento total).

## 4. O que enxugar
- Modo Atendimento em wizard (`/app/projeto/:id/atender`) duplica o configurador; manter só um caminho de criação — proposta: aposentar o wizard e deixar o configurador responsivo no celular, mantendo apenas a assinatura e o envio do PDF.
- Página inicial de Projetos vira redundante com o Painel: transformar em apenas "todas as ordens" (mesma lista, sem cartões financeiros) ou remover do menu.
- Campos técnicos avançados do configurador podem ficar recolhidos por padrão, deixando só medidas, cor e acabamento à vista.

## 5. Detalhes técnicos
- Novos campos em `projetos`: `telefone`, `observacoes` (dentro de `dados` ou colunas próprias).
- Nova tabela `clientes` (nome, telefone, endereço) com RLS por usuário, usada para autocompletar.
- Agregações por mês calculadas no cliente a partir de `projetos.created_at`, `faturado_em` e `pagamentos.data`.
- Gráfico com Recharts (já disponível no projeto).
- Nenhuma alteração no Modo Oficina: continua sem preços.

## Ordem sugerida
1. Resumo mensal + contadores no Painel.
2. Gráfico e conversão no Financeiro.
3. Clientes reaproveitáveis + telefone/WhatsApp.
4. Enxugar wizard e a lista de projetos.
