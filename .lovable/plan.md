
# Serralheiro Pro 3D — Plano de construção

App para serralheiros calcularem **plano de corte, orçamento e ordem de produção** de portões e esquadrias, com **visualização 3D em tempo real**, totalmente offline (localStorage). Stack adaptada à Lovable: **Vite + React 18 + React Router + Tailwind v3 + shadcn/ui**, mantendo 100% das funcionalidades, design e regras do spec original.

## Adaptações de stack (necessárias)

- TanStack Start file-based routing → **React Router v6** com a mesma estrutura de URLs (`/`, `/app`, `/app/projeto/:id`, `/app/configuracoes`).
- React 19 → React 18 (já no projeto).
- Tailwind v4 → **Tailwind v3** com tokens HSL em `src/index.css` (equivalentes aos `oklch` do spec).
- Persistência: `localStorage` agora; futura migração para Lovable Cloud quando validado.

Tudo o mais (3D, cálculos, PDFs, design industrial dark/laranja, mobile-first) é preservado.

## Identidade visual

- Tema dark industrial (estilo Kochinski).
- Tokens semânticos em `src/index.css`: `--background` carvão, `--card` grafite, `--primary` laranja queimado (~#E8612C), `--primary-glow`, sucesso/warning/destructive.
- Utilitários: `.bg-gradient-orange`, `.text-gradient-orange`, `.shadow-orange`, `.surface-card`.
- Tipografia: **Archivo Black** (display, uppercase) + **Inter** (body), via Google Fonts.

## Estrutura de rotas

```text
/                       Landing page pública
/app                    Layout com header (logo, nav, hambúrguer mobile)
/app                    Listagem de projetos
/app/projeto/:id        Configurador (tela principal)
/app/configuracoes      Empresa + catálogo de preços
```

## Tipologias suportadas (8)

Portão de Correr, Basculante, Rolo, Pantográfico, Pivotante, Janela de Correr 2 folhas, Estrutura Metálica, Veneziana Metálica. Cada uma com larguras/alturas mín/máx/default e regras próprias de geração de cortes e geometria 3D. Acabamentos: branco, preto, natural, bronze.

## Catálogo de materiais

Tabela padrão de perfis (tubos, chatas, lâminas, trilhos), acessórios (roldanas, fechaduras, molas, eixos, kits) e vidro temperado por m². Editável pelo usuário em `/app/configuracoes` (CRUD, importar/exportar CSV, restaurar padrão, multiplicador por cor).

## Calculadora

`calcular(input)` por tipologia gera:
- Lista de **cortes** (montantes, travessas, diagonais, lâminas, trilhos) em função de L×H, com folga de 5 mm/peça.
- **Custos** (perfil, acessório, vidro, mão de obra %, margem %, desconto geral %, extras).
- **Resumo** (metragem total, peso estimado).
- Suporta **overrides** por linha (qtd, preço, % desconto, ocultar) e **extras** livres (frete, instalação).

## Visualização 3D

- `Visualizador3D` com `@react-three/fiber@^8.18` + `@react-three/drei@^9.122` + `three`/`three-stdlib`, carregado via `lazy + Suspense` para evitar SSR mismatch.
- `OrbitControls`, `Environment preset="warehouse"`, ambient + 2 directional, `Grid` infinito.
- Geometria por tipologia com `boxGeometry`/`cylinderGeometry`, material `meshStandardMaterial` (vidro = `meshPhysicalMaterial` translúcido), cor do acabamento.
- Cotas flutuantes (largura/altura em mm) via `<Html>`.
- Controles externos: `autoRotate`, `wireframe`, `showGrid`, `showCotas`, `bgColor`, `preset` (iso/frente/lateral/topo) — câmera realmente reposicionada via `CameraRig` interno.
- `gl={{ preserveDrawingBuffer: true }}` + callback `onCanvasReady` para snapshot PNG nos PDFs.

## Tela do configurador `/app/projeto/:id`

Layout 2 colunas no desktop (`lg:grid-cols-[340px_1fr]`), empilhado no mobile.

- **Top bar**: voltar, título/subtítulo, badge "salvando…/✓ salvo", ações Duplicar / Salvar / Exportar PDF (gradient laranja). No mobile, ações em scroll horizontal.
- **Sidebar (accordion no mobile via `<CollapsiblePanel>`)**: Configuração (nome, cliente, tipologia, sliders L/H, swatches de cor 36–40px) + Orçamento (mão de obra, margem, desconto).
- **Painel central**:
  - Card 3D (h 280/360/420 px) com header de controles roláveis (presets de câmera + toggles + color picker), canvas `touch-none`.
  - 4 cards de Resumo (Total geral em gradiente com **animação de contagem**, Materiais, Metragem, Peso).
  - Tabs (lista rolável horizontal): **Materiais** (editor inline com overrides + extras), **Plano de corte**, **Produção**, **Orçamento**.
- **Auto-save** após 800 ms de inatividade.

## Módulo de produção

- `planejarCorte(cortes, barraMm)` — nesting 1D **First-Fit Decreasing** com kerf 3 mm; retorna barras numeradas, peças por barra, sobra, % aproveitamento, perda total.
- `planejarProducao(tipologia, cortes)` — mapa de soldas (MIG/TIG/Eletrodo/Ponteamento), sequência de montagem numerada, ferramentas/EPI, observações técnicas.
- Painel "Produção": 4 KPIs, select de barra (3000/5000/6000/12000), **mapa de corte visual** (barras como flex divs proporcionais, cores por peça, tooltip com id/mm), tabela de soldas com badges, etapas em cards numerados, checklist de ferramentas, alertas.

## PDFs (jspdf + jspdf-autotable)

- **Orçamento**: cabeçalho com empresa, dados do cliente, nº/data/validade 15 dias, snapshot 3D (PNG do canvas), tabela zebrada por categoria, subtotais, **TOTAL** em laranja, rodapé de condições/garantia.
- **Ordem de Produção** (sem preços): cabeçalho técnico, mapa de corte desenhado com `rect()` proporcional, tabela de soldas, sequência de montagem, checklist com quadradinhos.

## Landing page `/`

Hero dark com 2 gradientes radiais laranja, badge pill, título XL uppercase com palavra-chave em gradient, CTA "Começar agora", pills das 8 tipologias, grid de 6 features, CTA final, footer. Meta `title`/`description` otimizados para "plano de corte serralheria".

## Mobile (obrigatório)

Top bar empilhada, ações em scroll-x, sidebar em accordion abaixo de `lg`, canvas 280 px com `touch-none`, controles 3D roláveis, `TabsList` rolável, tabelas em `overflow-x-auto`, swatches de cor 40 px, header `/app` com hambúrguer + drawer abaixo de `md`. Validado em 375 px sem scroll horizontal.

## Persistência local

`localStorage` com 3 chaves: `spro:projetos`, `spro:empresa`, `spro:catalogo`. Helpers para CRUD, duplicar, gerar id. (Migração para Lovable Cloud planejada após validação.)

## Detalhes técnicos (para devs)

- Dependências novas: `three`, `@react-three/fiber@^8.18`, `@react-three/drei@^9.122`, `three-stdlib`, `jspdf`, `jspdf-autotable`. (Lucide e Sonner já no projeto.)
- Estrutura: `src/lib/{tipologias,catalogo,calculator,producao,storage,pdf,pdfProducao}.ts`, `src/components/Visualizador3D{,Client}.tsx`, `src/components/CollapsiblePanel.tsx`, `src/hooks/useAnimatedNumber.ts`, rotas em `src/pages/`.
- Tokens em HSL no `index.css` (Lovable padrão); utilitários custom registrados via `@layer utilities`.
- Sem backend, sem auth.

## Critérios de pronto

- Criar projeto, alterar medidas → 3D atualiza instantaneamente.
- Trocar iso/frente/lateral/topo move a câmera de fato (rotação manual continua depois).
- Editar qtd/preço/desconto recalcula o total (animado).
- Adicionar extra (ex.: Frete R$ 200) aparece no PDF.
- PDF de orçamento com snapshot 3D, dados da empresa, validade 15 dias.
- PDF de Ordem de Produção sem preços, com mapa de corte visual.
- Catálogo customizado reflete nos cálculos.
- Recarregar mantém os projetos (localStorage).
- iPhone 375 px: criar projeto, ajustar medidas, ver 3D, editar materiais, exportar PDF — sem scroll horizontal.
