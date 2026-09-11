# Painel: visão de prioridades para o gestor

## Estado atual (confirmado no código)
- Selos de alerta no topo: "X ordem(ns) atrasada(s)" e "X com prazo apertado".
- Cada ordem tem cor: vermelho (prazo acabando/vencido), amarelo (atenção), verde (folgado).
- Lista ordenada das mais urgentes para as mais folgadas; entregues/faturadas vão para o fim.
- Limitação: os selos de alerta só mudam o filtro para "Abertos" — não filtram de fato as atrasadas/urgentes. Não há um bloco que mostre, na hora, quais ordens estão atrasadas e há quantos dias.

## O que melhorar

### 1. Bloco "Prioridades" no topo do painel
- Faixa logo abaixo do título listando as ordens que exigem ação, em duas linhas:
  - **Atrasadas**: nome do cliente, nº da OS, etapa atual e "atrasada há X dias" em vermelho.
  - **Prazo apertado**: mesmas infos com "faltam X dias" em âmbar.
- Cada item é clicável e abre a ordem direto.
- Se não houver nada atrasado nem urgente, mostrar mensagem tranquila: "Nenhuma ordem atrasada."

### 2. Selos de alerta viram filtros de verdade
- Clicar em "atrasadas" filtra a lista mostrando só as atrasadas.
- Clicar em "prazo apertado" mostra só as urgentes.
- Clicar de novo limpa o filtro (volta para "Abertos").

### 3. Reforço visual nos cartões
- Ordem atrasada: além da cor vermelha, mostrar "X dias de atraso" em destaque no cartão.
- Ordem urgente: "faltam X dias" visível sem precisar abrir.

## Detalhes técnicos
- Tudo em `src/pages/Painel.tsx`, reaproveitando `diasRestantes()`, `empresa.limiteVermelhoDias` e os componentes de cartão já existentes.
- Novo estado de filtro local: `filtroPrazo: "todos" | "atrasadas" | "urgentes"`, combinado com busca/vendedor/status já existentes.
- Sem mudanças em banco, permissões ou outras telas; serralheiro não é afetado.
