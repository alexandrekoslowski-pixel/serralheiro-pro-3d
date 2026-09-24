# Botão de tema claro/escuro

Hoje o app é só escuro: as cores claras nem existem e o HTML é travado no modo escuro. Vamos criar o tema claro e um botão para alternar.

## O que muda para você

- Botão com ícone de sol/lua na barra superior (ao lado do sino de avisos) e também no rodapé do menu lateral.
- Um clique alterna entre claro e escuro; a escolha fica salva no navegador de cada pessoa.
- Tema claro com a mesma identidade: laranja queimado continua como cor principal, fundos em tons claros de cinza quente, textos escuros com bom contraste.
- Nada muda nos dados, nos cálculos ou nos PDFs — é só aparência.

## Detalhes técnicos

- `src/index.css`: `:root` passa a ter os tokens do tema claro (todos os tokens existentes: background, card, popover, primary, secondary, muted, accent, destructive, success, warning, border, input, ring, sidebar-*); a classe `.dark` mantém os tokens escuros atuais; remover o `@apply dark` fixo do `html`.
- Novo `src/lib/tema.ts`: lê/grava a preferência em `localStorage` (`spro:tema`), aplica/remove a classe `dark` no `<html>` e inicializa antes da primeira renderização (sem piscar).
- `src/pages/AppLayout.tsx`: botão de alternância (ícones Sun/Moon do lucide) no header superior e no rodapé da sidebar, com rótulo acessível.
- Verificação: typecheck, testes, build e conferência visual no Preview nos dois temas (painel, orçamento, Kanban).
