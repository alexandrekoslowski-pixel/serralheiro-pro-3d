# Tudo que é clicável com cara de botão

Objetivo: qualquer pessoa que abra o sistema pela primeira vez consegue ver, em um relance, o que dá para clicar. Nada de ícone solto ou texto que só reage quando o mouse passa por cima.

## Regras visuais que vou aplicar em todo o sistema

1. **Botão sempre tem moldura.** Ações discretas (lápis de editar, lixeira, copiar, fechar) deixam de ser "invisíveis" e passam a ter contorno, fundo suave e área de toque maior.
2. **Ícone nunca sozinho.** Onde couber, o ícone ganha um rótulo curto ao lado: "Editar", "Excluir", "Copiar", "Abrir". Em telas estreitas o rótulo aparece embaixo do ícone.
3. **Hierarquia clara de cor.**
   - Ação principal da tela: laranja cheio (ex.: "Aprovar e mandar para a oficina", "Salvar").
   - Ação secundária: contorno.
   - Ação destrutiva: vermelho de contorno, com confirmação antes de excluir.
4. **Tamanho de dedo.** Altura mínima de 44 px em todo botão, com espaçamento entre eles para não errar o toque no celular e no tablet da oficina.
5. **Cartão clicável se comporta como botão.** Cartões de orçamento, ordem e cliente ganham borda de destaque, leve elevação ao passar o mouse e um botão "Abrir" visível no canto, além do cartão inteiro continuar clicável.
6. **Retorno imediato.** Ao clicar: botão afunda levemente, mostra "Salvando..." quando demora, e some do caminho quando desabilitado explica o porquê.
7. **Acessível pelo teclado.** Contorno de foco visível, para quem usa Tab.

## Telas que vou revisar, uma a uma

- Painel do gestor: cartões de ordem, botões Avançar / Financeiro / Oficina.
- Orçamento (configurador): abas, cartões de peças, bolinhas de cor, botões de adicionar/duplicar/remover peça, PDF e aprovação.
- Kanban da oficina e Minhas ordens: mover etapa, abrir OS, indicação de que o cartão pode ser arrastado.
- Clientes e ficha do cliente, Orçamentos, Financeiro, Calendário.
- Materiais, Catálogo, Serviços, Equipe, Empresa e Configurações.
- Atendimento no celular e Modo oficina (TV).

## Detalhes técnicos

- Novas variantes no `buttonVariants` (`src/components/ui/button.tsx`): `soft` (fundo suave com borda) para ações discretas e `danger-outline` para excluir; tamanhos `icon` e `sm` com altura mínima 44 px em telas de toque.
- Substituir os usos de `variant="ghost"` isolados nas páginas listadas pela nova variante com borda, mantendo o comportamento atual.
- Tokens novos em `src/index.css` / `tailwind.config.ts` para o fundo suave, borda e sombra de foco/hover — sem cor fixa em componente.
- Cartões clicáveis: manter o link esticado já usado no Painel, somando borda `hover:border-primary` e `hover:shadow`.
- Nenhuma mudança de regra de negócio, cálculo, banco ou permissão.
