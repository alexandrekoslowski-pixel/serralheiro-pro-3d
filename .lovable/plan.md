
# Modo Oficina v2 — "olha e faz", sem clicar

A ideia que você descreveu é essa: o dono fecha o orçamento (no cliente ou no balcão) e o funcionário **só pega a folha / olha a TV e começa a cortar e soldar**. Sem QR, sem etiqueta colada na peça, sem "próximo". Hoje o Modo Oficina já é uma tela só, mas ainda parece "relatório de engenheiro". Vou transformar em uma **ficha de bancada visual**.

## O que muda na prática

### 1) Cabeçalho gigante (lê de 3 m de distância)
Faixa preta com 3 blocos enormes:

```text
+---------------------------------------------------------------+
|  PORTÃO DE CORRER             3500 mm  x  2000 mm    PRETO    |
|  Cliente: João da Silva       Folga de corte: +5 mm           |
+---------------------------------------------------------------+
```

Fonte ~80 px nas medidas. Cor do acabamento como bolinha colorida ao lado do nome.

### 2) Diagrama de cortes em escala (substitui a "etiqueta de peça")
No lugar de imaginar etiquetas P1/P2/P3 coladas, desenho **cada barra de 6 m em escala**, com as peças coloridas e a medida escrita dentro. Mesma lógica do nesting que já existe em `planejarCorte()`, só que renderizada como SVG grande na tela:

```text
TUB 30x30  — precisa de 3 barras de 6000 mm
Barra 1: [████ 2980 ████][████ 2980 ████][ sobra 35 ]
Barra 2: [██ 1950 ██][██ 1950 ██][██ 1950 ██][ s 145 ]
Barra 3: [█ 600 █][█ 600 █][█ 600 █][█ 600 █]...
```

O funcionário olha, pega a barra, mede **2.985 mm** (medida + folga já somada, escrita em cima de cada bloco), corta. Não precisa decorar nada nem colar papel.

### 3) Tabela de cortes só com o essencial — agrupada e com folga embutida
Reescrevo a tabela atual com 4 colunas, fonte enorme:

| QTD | PERFIL       | CORTAR EM | (= medida real + 5 mm) |
|-----|--------------|-----------|------------------------|
| **4** | TUB 30x30  | **2.985** mm | (peça útil 2.980)   |
| **6** | TUB 30x30  | **1.955** mm | (peça útil 1.950)   |
| **2** | METALON 50 | **3.505** mm | (peça útil 3.500)   |

A coluna principal já é **a medida pra serra** (com folga). A medida útil fica em cinza pequeno embaixo, só pra conferência. Hoje é o contrário — a medida útil é grande e a folga é uma coluna escondida em mobile. Inverter isso resolve metade do problema.

### 4) "Como soldar" virou desenho, não lista
Hoje a sequência de montagem é texto numerado. Vou colocar **um mini-3D ao lado de cada passo** mostrando o que está sendo montado naquele estágio:

- Passo 1: só a moldura externa (4 peças coloridas)
- Passo 2: moldura + verticais internos
- Passo 3: moldura completa + detalhes
- Passo 4: peça final

Reaproveita o `Visualizador3D` em modo "fase" — passa um prop `fase: 1|2|3|4` que esconde geometrias das fases seguintes. Funcionário vê em ordem o que tem que existir na bancada ao final de cada solda.

### 5) Resumo de barras (compra de material) no rodapé
Bloco simples: "Pra essa peça você vai usar **3 barras de TUB 30x30** + **1 barra de METALON 50**. Sobra de material: 1,2 m." Assim o serralheiro confere o estoque antes de começar, sem precisar ir ver no orçamento (que tem preço).

### 6) Tira o "Sequência de montagem" como lista chata e reagrupa
Layout final da tela única:

```text
┌─ CABEÇALHO GIGANTE ──────────────────────────────────────────┐
├─ TABELA DE CORTES (esquerda) ─┬─ DIAGRAMA DE BARRAS (direita)┤
│  QTD | PERFIL | CORTAR EM     │  Barra 1: [██████][████]     │
│  ...                          │  Barra 2: [████][████][████] │
├─────────────────────────────────────────────────────────────┤
│  COMO MONTAR — 4 mini-3Ds em sequência horizontal             │
│  [3D fase 1] → [3D fase 2] → [3D fase 3] → [3D fase 4]        │
├─────────────────────────────────────────────────────────────┤
│  MATERIAL NECESSÁRIO (compra) + observações curtas            │
└──────────────────────────────────────────────────────────────┘
```

Rola uma vez, no máximo. Imprime em 1–2 páginas A4 paisagem.

## Arquivos a mexer

- **`src/pages/ModoOficina.tsx`** — refazer o layout. Usar `planejarCorte()` (já existe) pra alimentar o diagrama de barras. Tabela agrupada com folga embutida na coluna principal. Adicionar grid de mini-3Ds.
- **`src/components/DiagramaBarras.tsx`** (novo) — SVG simples que recebe `PlanoCorte` e desenha cada barra em escala, com retângulos coloridos por peça e a medida (com folga) escrita em cima. Cores reaproveitam a `PALETA_BARRAS` que já existe no `Configurador.tsx`.
- **`src/components/Visualizador3D.tsx`** — aceitar prop opcional `fase?: number` que limita quais geometrias renderiza, pra fazer o "como montar". Implementar pra `portao_correr`, `portao_basculante`, `portao_pivotante` e `estrutura_metalica` (cobre 80% dos casos). Os outros caem num fallback de 2 fases (moldura → completo).
- **`src/lib/pdfProducao.ts`** — gerar o mesmo layout em PDF paisagem A4: cabeçalho gigante, tabela com folga, diagrama de barras em SVG embutido, mini-3Ds da sequência (snapshot via canvas off-screen). Sem QR, sem etiqueta destacável.

## O que deliberadamente NÃO faço

- **Sem etiquetas P1/P2/P3** — você foi claro. A peça se identifica pela **cor no diagrama** + **medida**. Funcionário corta, encosta no diagrama, vê onde vai.
- **Sem QR code, sem login, sem app pro funcionário.**
- **Sem botão "próxima peça" / wizard / auto-avanço.** Tudo numa tela só.
- **Sem preço em lugar nenhum** (mantém a blindagem atual — `ModoOficina` não importa nada de `pdf.ts` nem cálculo de margem).

## Detalhe técnico da folga

Hoje `FOLGA_MM = 5` está hardcoded no `ModoOficina.tsx`. Vou centralizar em `src/lib/producao.ts` exportando `FOLGA_CORTE_MM` e usar nos dois lugares (tela e PDF). Se mais pra frente o dono quiser configurar folga por perfil (alumínio precisa menos, aço galvanizado mais), o ponto de mudança é único.

---

Confirma que sigo? A peça mais "novidade" é o **diagrama de barras em escala** + **mini-3Ds da sequência de montagem**. Se quiser cortar escopo pra entregar em pedaços, a ordem que faz mais sentido é:

1. Reorganizar tabela com folga na coluna principal (rápido, resolve a dor imediata).
2. Diagrama de barras em escala (substitui de vez a ideia de etiqueta).
3. Mini-3Ds da sequência de montagem (o "premium", mais trabalhoso).

Faço os 3 de uma vez ou prefere ver o 1 e o 2 primeiro?
