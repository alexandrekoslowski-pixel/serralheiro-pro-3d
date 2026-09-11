# Cores por situação no painel + kanban de tela cheia

## 1. Cada situação com sua cor no painel

Hoje o selo de situação do cartão (Orçamento, Aprovado, Produção, Entregue, Faturado) usa a cor do prazo (vermelho/amarelo/verde), o que confunde. Muda para:

- **Orçamento** — azul
- **Aprovado** — violeta/roxo
- **Produção** — laranja
- **Entregue** — verde
- **Faturado** — cinza/esverdeado neutro

Onde aplica:
- Selo de situação em cada cartão da lista do painel.
- Contadores por situação (os chips clicáveis) ganham a mesma cor, para associar chip → cartão.
- A faixa colorida no topo do cartão continua sendo a cor do **prazo** (vermelho/amarelo/verde) — agora fica claro: faixa = prazo, selo = situação.

## 2. Kanban em tela cheia (monitor grande)

Na tela "Minhas ordens" (`/app/oficina`), usada na TV/monitor da oficina:

- As sete raias (Fila, Produção/montagem, Acabamento, Pintura, Entrega, Pós-venda, Pronto) passam a ocupar **toda a largura do monitor** distribuídas em grade, sem rolagem lateral em telas grandes.
- Em telas estreitas (celular), volta a rolagem lateral com colunas de largura fixa, como hoje.
- O cabeçalho da página fica compacto para o quadro ganhar altura.

A tela pública `/oficina/:codigo` (TV sem login) recebe o mesmo ajuste de grade.

## Detalhes técnicos

- Novo mapa `STATUS_CORES` em `src/lib/ordens.ts` com classes de selo/faixa por situação, usado em `src/pages/Painel.tsx` (selo do cartão e chips de contagem).
- `src/pages/MinhasOrdens.tsx` e `src/pages/KanbanOficina.tsx`: troca do `flex overflow-x-auto` por `grid grid-cols-7` em telas `xl` (mantém `minmax` e rolagem lateral abaixo disso).
- Sem mudanças em banco, permissões ou regras de negócio; serralheiro segue sem ver valores.
