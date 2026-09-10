# Catálogo técnico de materiais, preços e cores

Os arquivos valem a pena ser incorporados. Eles trazem uma base ampla e real para reduzir digitação, melhorar os custos dos orçamentos e preparar compras e produção.

## O que será aproveitado

- Importar todos os itens de tubos pretos e galvanizados, laminados, vigas, chapas Búzios e frisadas, telas expandidas e kits basculantes.
- Guardar código do fornecedor, categoria, descrição original, unidade, dimensões, espessura, acabamento do aço e fornecedor.
- Registrar os preços da tabela de **31/08/2026** como uma versão datada, sem apagar preços anteriores quando novas listas forem recebidas.
- Cadastrar as 29 cores Kochinski somente pelo nome, conforme escolhido, sem armazenar as fotos das amostras.
- Não importar o saldo como estoque da serralheria. Esse número representa apenas a disponibilidade informada pelo fornecedor naquela data.

## Como isso melhora o sistema

### 1. Catálogo organizado
A tela de Materiais passa a ter filtros por categoria, tipo, dimensão, espessura e fornecedor. Cada material mostra seu código, unidade, custo vigente e data da última atualização.

### 2. Histórico de preços
Cada atualização de tabela cria um novo preço datado. O gestor poderá consultar a evolução de custo e identificar materiais que subiram.

### 3. Orçamento com custos reais
Os materiais cadastrados serão ligados ao cálculo hoje usado pelo orçamento. A vendedora escolhe o perfil correto pela medida e espessura, enquanto custo e margem permanecem ocultos para ela.

Ao salvar ou aprovar um orçamento, os custos usados ficam congelados nele. Assim, uma atualização futura da tabela não altera propostas antigas.

### 4. Plano de corte e compras
Tubos, laminados e vigas terão comprimento comercial associado, permitindo que a lista de corte converta metros necessários em barras a comprar. Chapas, telas e kits entram com sua unidade comercial correta.

A futura lista de compras poderá comparar:
- quantidade calculada para as ordens;
- quantidade já disponível na serralheria;
- quantidade que ainda precisa ser comprada;
- custo previsto usando o preço vigente.

### 5. Cores em todo o fluxo
As 29 cores substituem a lista reduzida atual. A cor escolhida acompanha a peça no orçamento, PDF, ordem de serviço, produção e pós-venda. O desenho 3D usará uma aproximação visual configurada no sistema, mesmo sem guardar as fotografias do catálogo.

## Estrutura dos dados

- Ampliar `materiais` com código externo, categoria, subtipo, dimensões, espessura, comprimento comercial, acabamento, unidade de compra e status ativo.
- Criar histórico separado de preços com material, fornecedor, valor, unidade, data de referência e origem da importação.
- Criar catálogo de cores compartilhado pela serralheria, com nome, código opcional, aproximação visual e status ativo.
- Manter materiais e preços protegidos para o gestor; vendedoras poderão selecionar materiais no orçamento sem enxergar custo ou margem.
- Relacionar os códigos técnicos usados pela calculadora aos materiais reais importados, evitando duplicar dois catálogos desconectados.

## Importação inicial

1. Normalizar descrições, unidades e medidas dos oito arquivos de preços.
2. Importar todos os itens com fornecedor **R.B Comércio de Aços** e referência **31/08/2026**.
3. Importar os 29 nomes do catálogo de cores Kochinski.
4. Marcar claramente promoções e itens com saldo negativo na fonte, sem usar esse saldo como disponibilidade interna.
5. Revisar amostras por categoria para confirmar que código, medida, espessura e preço foram interpretados corretamente.

## Telas e fluxo

- **Materiais:** pesquisa rápida, filtros, edição, preço atual e acesso ao histórico.
- **Orçamento:** seleção simples do material real; custos visíveis apenas para gestor.
- **Configuração de cores:** lista com os 29 nomes e aproximação visual ajustável.
- **Importar tabela:** atualização futura por arquivo, com prévia das inclusões, alterações e possíveis duplicidades antes de confirmar.

## Limites desta etapa

- O saldo apresentado nos PDFs não será criado como estoque interno.
- Compras, recebimentos e estoque físico serão uma etapa posterior, construída sobre este catálogo.
- Preços importados são custos de referência do fornecedor; frete, perdas, pintura e margem continuam sendo tratados separadamente no orçamento.

## Validação

- Conferir contagem total e totais por categoria após a importação.
- Comparar códigos e preços de amostras de cada PDF com os registros salvos.
- Confirmar que uma nova tabela atualiza o preço vigente sem alterar orçamentos existentes.
- Testar a seleção de materiais e das 29 cores em orçamento, PDF e ordem de produção.
- Confirmar que vendedora e serralheiro não conseguem visualizar custos ou histórico de preços.
