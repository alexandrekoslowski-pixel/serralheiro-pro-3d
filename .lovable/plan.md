# Preço pela política da Kochinski e checklist com acabamento

Duas mudanças no orçamento: acabamento/fixação saem da tela de peças e vão para o checklist; a composição do preço sai e o valor passa a vir da tabela de política de preços.

## 1. Acabamento e fixação viram perguntas do checklist

- O bloco "Acabamento e fixação" (cor, sistema de fixação, lados) sai da seção de peças.
- Essas três escolhas passam para o checklist, dentro da parte "Configuração de cada peça", como perguntas normais de cada peça — cor em bolinhas, fixação e lados em botões.
- Continuam obrigatórias e continuam aparecendo na ordem de serviço e nos PDFs, igual hoje.
- A seção de peças fica com "O que é" (nome, tipologia, produto da tabela), "Medidas" e a linha-resumo.

## 2. Preço pela tabela de política de preços

- Sai o bloco "Composição do preço" (mão de obra, margem, desconto geral).
- Cada peça passa a ter **Produto** e **Modelo** da política (ex.: Portão Basculante · Ripado em metalon 20x20 com vão inferior a 4 cm).
- O valor da peça é calculado: preço da tabela × metragem, cobrando no mínimo uma unidade de medida (m², metro linear ou unidade), conforme a planilha.
- Itens "sob orçamento" (escada, mezanino, pergolado, reforma, movelaria, grelha, peça metálica, e os itens sem valor legível: tela perfurada, cabo aço, fotográfica, lixeira basculante, trilho) abrem um campo para o Eduardo digitar o valor.
- O Eduardo pode sempre ajustar o valor final da peça à mão; o valor da tabela fica visível como referência.
- Em vez dos campos livres de Serviços e Frete, entra uma lista de seleção com a tabela de instalação/automação (instalação simples R$ 260, complexa R$ 500, motor deslizante R$ 380, pivotante R$ 750, basculante R$ 450, fechadura elétrica R$ 350, eletroímã R$ 400) e o deslocamento mínimo de R$ 180, com valor editável na hora.
- O total do orçamento passa a ser: peças (tabela) + serviços selecionados + deslocamento.
- O cálculo por material continua existindo apenas como custo interno do gestor (aba Materiais, plano de corte, produção) e não define mais o preço do cliente.

## 3. Onde os preços da tabela ficam guardados

Os 80+ itens da planilha entram no sistema como tabela de preços da empresa, com uma tela simples em Configurações para o Eduardo alterar valores quando a política mudar (sem precisar de mim).

## Detalhes técnicos

- `src/lib/politicaPrecos.ts`: tipos `ProdutoPolitica` (produto, modelo, unidade `m2 | linear | unidade | hora | sob_orcamento`, valor) e funções `precoPeca(produto, largura_mm, altura_mm)` com mínimo de 1 unidade, mais `SERVICOS_POLITICA` (instalação/automação) e `FRETE_MINIMO`.
- Nova tabela `politica_precos` (user_id, produto, modelo, unidade, valor, ativo, ordem) + GRANTs + RLS por `dono_atual(auth.uid())`; seed com os itens da planilha via `run_sql`.
- `Peca` em `src/lib/storage.ts` ganha `politica_id` e `preco_manual`; migração de peças antigas mapeando tipologia → produto padrão.
- `src/lib/calculator.ts`: `totalGeral` passa a somar `precoPeca` de cada peça + serviços selecionados; `maoObraPct`/`margemPct`/`descontoGeralPct` deixam de afetar o total do cliente (mantidos no tipo para compatibilidade dos orçamentos salvos).
- `src/pages/Configurador.tsx`: remove o bloco de sliders e os campos livres de Serviços/Frete; remove a seção "Acabamento e fixação"; adiciona selects de Produto/Modelo e o seletor de serviços da política.
- `src/lib/checklistPedido.ts` + `src/components/ChecklistPedido.tsx`: perguntas de cor, fixação e lados por peça, gravando direto em `peca.cor`, `peca.fixacao`, `peca.fixacaoLados`.
- PDFs (`pdf.ts`, `pdfContrato.ts`, `pdfProducao.ts`) e `financeiro.ts` passam a usar o novo total; nada de material aparece para o cliente.
