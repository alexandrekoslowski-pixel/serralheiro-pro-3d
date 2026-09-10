# Painel do gestor + Kanban da oficina

Dois mundos separados: o gestor vê dinheiro e prazos; a oficina vê só o trabalho.

## 1. Painel do gestor (`/app`)
- Resumo do mês em destaque: orçado, aprovado (efetivado), faturado, recebido e a receber — com comparação com o mês anterior.
- Ticket médio do mês e contadores por situação (ex.: 3 em orçamento, 2 em produção), clicáveis para filtrar a lista.
- Faixa de alerta no topo: ordens atrasadas e ordens vermelhas (prazo apertado).
- Lista de ordens como hoje (cores por prazo), abaixo do resumo.

## 2. Calendário de entregas
- Nova aba "Calendário" no menu do gestor.
- Visão de mês com cada ordem no dia do prazo de entrega, colorida pela urgência (vermelho/amarelo/verde) e cinza quando já entregue.
- Clicar no dia abre a lista daquele dia; clicar na ordem abre o projeto.
- Navegação mês anterior / próximo mês e botão "Hoje".

## 3. Kanban da oficina (tela aberta, sem senha)
- Nova tela em `/oficina`, pensada para TV/tablet: letras grandes, sem preços, sem valores, sem menu do gestor.
- Colunas: **Fila · Produção · Pintura · Acabamento · Pós-venda · Pronto**.
- Cada cartão mostra: cliente, tipo de portão, medidas, cor e prazo (com a cor de urgência). Nada financeiro.
- Botões grandes no cartão: "Iniciar", "Avançar" e "Abrir OS" (leva à tela de execução `/op/:id` já existente, com cortes e medidas).
- Arrastar entre colunas também funciona no toque; o horário de entrada em cada etapa fica registrado para depois medir o tempo por etapa.
- A ordem entra na Fila automaticamente quando o gestor marca como Aprovado.

## 4. O que o gestor ganha com isso
- No painel e na ordem, mostrar em que etapa da oficina a ordem está e há quanto tempo.

## 5. Detalhes técnicos
- Nova coluna em `projetos`: `etapa_oficina` (enum: fila, producao, pintura, acabamento, pos_venda, pronto) + `etapa_em` (timestamp) e histórico de etapas em `dados.historico_etapas` (etapa + entrada).
- A tela `/oficina` é pública (sem `ExigirLogin`) e lê os dados por um identificador da oficina; para manter simples nesta etapa, ela usa o mesmo carregamento do `/op/:id` atual, listando as ordens da conta a partir de um link com o código da serralheria.
- Regras de acesso no banco continuam por usuário; a leitura pública da oficina é limitada aos campos sem valores (sem total, sem faturado, sem pagamentos), via consulta dedicada.
- Calendário construído com componentes já existentes (date-fns + grade própria), sem nova biblioteca.
- Kanban com arrastar-e-soltar via HTML5 drag + fallback de botões, sem nova dependência.

## Ordem de execução
1. Campos de etapa no banco.
2. Painel do gestor com resumo mensal e alertas.
3. Calendário de entregas.
4. Kanban da oficina em tela aberta.
