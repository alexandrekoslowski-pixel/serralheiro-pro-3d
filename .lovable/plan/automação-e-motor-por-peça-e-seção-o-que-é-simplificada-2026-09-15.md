# Automação e motor por peça, e seção "O que é" simplificada

Três ajustes no orçamento: cada peça passa a ter sua própria automação, o motor vem do cadastro de materiais, e a parte "O que é" deixa de repetir informação.

## 1. Automação por peça

- Dentro de cada peça, um bloco "Automação" com as opções da tabela (motor deslizante R$ 380, pivotante R$ 750, basculante R$ 450, fechadura elétrica R$ 350, eletroímã R$ 400) e a opção "Sem automação".
- Assim, três portões basculantes no mesmo orçamento têm três automações escolhidas separadamente, cada uma somando no total.
- A lista geral de serviços no fim do orçamento fica só com instalação simples/complexa e o deslocamento; as automações saem de lá para não haver duas formas de cobrar a mesma coisa.
- Automações lançadas antes desta mudança continuam aparecendo na lista geral, sem perder valor.

## 2. Motor escolhido no cadastro de materiais

- Junto da automação, a peça ganha o campo "Motor", com busca nos motores e kits já cadastrados em Materiais (automatizadores e kits basculantes).
- O preço de venda do motor é o custo do material mais a margem definida pelo Eduardo em Empresa (campo novo, padrão 30%), sempre editável na hora.
- A vendedora vê só o nome do motor e o preço de venda; custo e margem aparecem apenas para o gestor.
- Três portões com motores diferentes ficam corretos: cada peça guarda seu motor e seu valor.
- O motor escolhido acompanha a peça na ordem de serviço e nos PDFs (só o nome, sem custo).

## 3. Seção "O que é" enxuta

- Sai o campo Tipologia, que não conversava com o produto da tabela.
- Fica o Nome da peça, que passa a ser preenchido automaticamente pelo produto/modelo escolhido na tabela enquanto o Eduardo não digitar um nome próprio.
- O tipo técnico da peça (usado no checklist, na oficina e no cálculo interno) passa a vir do produto da tabela, então escolher "Portão basculante fechado" já configura a peça inteira.
- O bloco "Preço pela tabela" sobe para o lugar de "O que é", ficando na ordem: o que é e quanto custa → medidas → automação e motor.

## Resumo do total

Peças (tabela) + automação de cada peça + motor de cada peça + instalação + deslocamento.

## Detalhes técnicos

- `src/lib/politicaPrecos.ts`: `TIPOLOGIA_POR_POLITICA` (inverso de `POLITICA_POR_TIPOLOGIA`, com fallback por produto); `AUTOMACOES_POLITICA` derivado de `SERVICOS_POLITICA` (ids `automacao-*`), mantendo em `SERVICOS_POLITICA` apenas instalação; `precoAutomacaoPeca(peca)` e `precoMotorPeca(peca, margemPct)`; `totalPecasPolitica` passa a somar peça + automação + motor.
- `src/lib/storage.ts`: `Peca` ganha `automacao_id?: string | null`, `automacao_valor?: number | null`, `motor_material_id?: string | null`, `motor_nome?: string`, `motor_custo?: number | null`, `motor_valor?: number | null`; `DadosEmpresa` ganha `margemMotorPct` (padrão 30) salvo em `empresa.dados`; `normalizarProjeto` preenche os novos campos e deriva `tipologia` de `politica_id` quando divergente.
- `src/pages/Configurador.tsx`: remove o select de Tipologia; `politica_id` passa a definir `tipologia` via `TIPOLOGIA_POR_POLITICA` e a sugerir o nome da peça; novo bloco "Automação e motor" com toggle das automações, `Select`/combobox de motores carregados de `materiais` (`categoria in ('automatizadores','kits-basculantes')`, ativos) e inputs de valor; custo só quando `podeVerCustos`; lista geral de serviços filtra para instalação; totais e auto-save usam o novo `totalPecas`.
- Carregamento dos motores: hook local reutilizando `buscarTudo`/consulta paginada de `src/lib/gestao.ts`, filtrando por categoria, com busca por nome.
- `src/pages/Configuracoes.tsx`: campo "Margem sobre o motor (%)" junto dos preços da tabela.
- `src/lib/pdf.ts`, `pdfContrato.ts`, `pdfProducao.ts` e a ordem de serviço listam automação e motor por peça (sem custo); `ordens.ts`/`financeiro.ts` seguem usando `projeto.total`, que já passa a incluir esses valores.
