# Aprovar e mandar para a oficina + kanban que anda sozinho

## Como funciona hoje

Uma ordem só aparece para o serralheiro depois de sair de "Orçamento". Hoje isso é feito no painel pelo botão genérico "Avançar", que empurra a ordem para o próximo passo da fila (Orçamento → Aprovado → Produção → Entregue → Faturado). Não existe um botão claro dizendo "aprovar e mandar para a oficina", por isso não ficou óbvio.

Na tela do serralheiro ("Minhas ordens") os cartões só andam por botão; não dá para arrastar de raia.

## O que muda

### 1. Botão claro de aprovação

- No painel, quando a ordem ainda é orçamento, o botão passa a ser **"Aprovar e mandar para a oficina"** (em destaque), no lugar do "Avançar" genérico.
- Ao clicar: a ordem vira Aprovada, entra na raia **Fila** da oficina, ganha a data de aprovação e, se estiver sem prazo, recebe o prazo padrão da empresa.
- Nos demais passos o botão continua sendo "Avançar" como hoje.
- O mesmo botão aparece na tela do orçamento, para aprovar sem voltar ao painel.

### 2. Kanban arrastável, tipo quadro de tarefas

- Na tela "Minhas ordens" o serralheiro passa a **arrastar o cartão de uma raia para outra** (Fila · Produção · Pintura · Acabamento · Pós-venda · Pronto), como num quadro de software. No celular/tablet o toque arrastando também funciona.
- A mudança é gravada na hora em que ele solta o cartão — sem clicar em "salvar" e sem passar pelo gestor.
- Os botões de avançar continuam existindo, para quem preferir tocar.
- O momento da mudança já é registrado, então o cartão mostra "nesta etapa há X h" e o gestor vê a ordem mudar de situação sozinha: qualquer raia diferente de Fila coloca a ordem em Produção.

### 3. Ficar logado na oficina

Nada a mudar: a sessão já continua aberta no aparelho depois do login, inclusive após fechar e reabrir o navegador.

## Detalhes técnicos

- `src/pages/Painel.tsx`: rótulo/estilo do botão dependendo de `status === "orcamento"`; a função `avancar` já trata `aprovado_em`, `etapa = "fila"` e prazo padrão.
- Botão equivalente no configurador/orçamento reutilizando a mesma lógica de aprovação.
- `src/pages/MinhasOrdens.tsx`: HTML5 drag-and-drop nas colunas (mesmo padrão já usado em `KanbanOficina.tsx`), com atualização otimista e chamada de `mover_etapa_oficina`; suporte a toque via eventos de ponteiro.
- Nenhuma mudança de banco: `mover_etapa_oficina` já grava etapa, `etapa_em` e ajusta o status.
