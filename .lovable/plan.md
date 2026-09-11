# Criação rápida de orçamento

## Objetivo
Ao tocar em **Novo orçamento**, a vendedora entra imediatamente em um orçamento novo e já pode preencher os dados, sem janela intermediária.

## Mudanças
- Remover a janela que pede nome, cliente e tipo antes de começar.
- Criar o orçamento com valores padrão e abrir diretamente a tela de preenchimento.
- Fazer o botão do painel usar o mesmo atalho direto.
- Colocar o cursor no primeiro campo do cliente ao abrir um orçamento novo.
- Manter salvamento automático para evitar perda do que já foi preenchido.

## Detalhes técnicos
- Centralizar a criação padrão em uma função compartilhada para painel e lista de orçamentos.
- Usar um marcador temporário na navegação para ativar o foco inicial sem alterar orçamentos existentes.
- Preservar cálculos, permissões, PDFs e fluxo de aprovação atuais.

## Verificação
- Testar a criação pelo Painel e pela lista de Orçamentos.
- Confirmar abertura direta, foco no cliente, salvamento e ausência de erros.
