# Orçamento: peças e medidas acima do desenho 3D

Hoje as peças e medidas ficam numa coluna estreita à esquerda, e o desenho 3D ocupa o resto. A proposta é inverter: peças e medidas em cima, ocupando a largura toda, e o desenho grande logo abaixo.

## Novo arranjo da tela

```text
[ Cabeçalho: nome, salvar, PDFs, Modo TV ]
[ Abas: Cliente · Proposta · Ordem de serviço ]
[ PEÇAS: faixa de cartões (1, 2, 3...) + Duplicar / + Peça ]
[ MEDIDAS da peça escolhida: tipologia · largura · altura · cor · fixação · lados ]
[ DESENHO 3D em largura total ]
[ Total geral · Materiais · Metragem · Peso ]
[ Abas: Materiais · Plano de corte · Produção · Orçamento ]
```

Detalhes:
- As peças viram cartõezinhos lado a lado (roláveis no celular) mostrando nome, medida em cm e cor; o cartão escolhido fica destacado, com botão de remover.
- As medidas da peça escolhida ficam numa grade de 3 a 4 colunas no computador e 1 coluna no celular, com os campos maiores.
- Largura e altura continuam com digitação livre em cm mais barra deslizante.
- O desenho 3D passa a ocupar a largura toda e fica mais alto (cerca de 520 px no computador).
- Mão de obra, margem e desconto saem da lateral e viram uma faixa compacta junto do total.
- A lateral de 340 px deixa de existir; nada é removido, só reposicionado.

## Outras melhorias que sugiro para o sistema

Escolha quais entram (posso fazer depois, em etapas):

1. **Duplicar orçamento a partir de um cliente já atendido** — hoje só dá para duplicar o projeto inteiro; útil ter busca de clientes já cadastrados e preenchimento automático dos dados.
2. **Modelos de peça salvos** — salvar "portão basculante 300×250 preto" como modelo e inserir em novos orçamentos com um clique.
3. **Botão de WhatsApp na proposta** — abrir a conversa com o cliente já com a mensagem padrão e o resumo do orçamento.
4. **Histórico da ordem** — registrar quem mudou a situação e quando, visível no painel.
5. **Aviso de prazo vencendo** — destaque no painel e lista das ordens que vencem nos próximos dias, com filtro rápido.
6. **Meta e comissão por vendedora** — meta mensal e percentual de comissão sobre o faturado, com acompanhamento no financeiro.
7. **Custo real x orçado** — lançar o que a oficina realmente gastou de material para comparar com o orçamento e ver a margem real.
8. **Lista de compras consolidada** — juntar o material de todas as ordens aprovadas da semana numa única lista para o fornecedor.
9. **Foto da peça pronta** — a oficina anexa foto ao concluir, e ela fica no histórico da ordem.
10. **Impressão do plano de corte por barra** — folha simples para levar à serra, sem preços.

## Detalhes técnicos

- Mudança concentrada em `src/pages/Configurador.tsx`: remover o grid `lg:grid-cols-[340px_1fr]`, transformar o painel "Peças e medidas" em duas seções de largura total acima do card 3D e mover os controles de percentuais para junto dos cards de resumo.
- `CollapsiblePanel` deixa de ser usado na tela de orçamento (o componente permanece para outros usos).
- Sem mudança de dados, cálculo, PDFs ou banco — apenas apresentação.
