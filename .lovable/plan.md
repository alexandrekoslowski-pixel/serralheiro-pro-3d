# Melhorias 3D + Fluxo Cliente / Oficina (revisado)

Ajustado: o funcionário **não escaneia nada**. A oficina recebe a informação de duas formas — **TV na bancada** ou **folha A4 impressa**, ambas pensadas para serem lidas a 2–3 metros de distância, sem toque, sem login.

---

## 1. Modo Oficina — TV / Impressão (PRIORIDADE)

### Modo TV (rota nova `/op/:id`)
Tela cheia, fonte gigante, sem menu, sem preço, sem nada de orçamento. Pensado para uma TV/monitor na bancada do serralheiro.

**Layout em 4 quadrantes grandes:**

```text
+------------------------------+------------------------------+
|  VISTA 3D (frente)           |  PEÇA ATUAL                  |
|  + dimensões totais          |  P3 — TUB 30x30              |
|  L: 3500 mm                  |  Cortar: 2.980 mm            |
|  H: 2000 mm                  |  Quantidade: 4               |
+------------------------------+------------------------------+
|  PRÓXIMOS PASSOS             |  PROGRESSO                   |
|  1. Cortar verticais (4x)    |  Cortes:    [ 6 / 18 ]       |
|  2. Pontear moldura          |  Soldas:    [ 0 / 12 ]       |
|  3. Soldar cantos MIG        |  Etapa:     Corte            |
+------------------------------+------------------------------+
```

- **Auto-avanço opcional**: passa de peça em peça a cada X segundos (configurável), ou fica fixo. Sem precisar tocar.
- **Controle remoto simples**: setas do teclado, ou um botão grande "Próxima peça" canto inferior — caso a TV tenha mouse/teclado wireless. Funciona também com presenter laser.
- **Modo escuro de alto contraste**: fundo preto, texto branco/laranja, fontes 48–96 px. Legível a 3 m com pó/poeira na tela.
- **Sem sair do projeto**: a página não tem links de navegação. É um "kiosco" — abre e fica.
- **Sem preço, em lugar nenhum**. Garantido por construção (a página nem importa o módulo de preços).

### Modo Impressão (PDF redesenhado)
Para quem não tem TV, o PDF da Ordem de Serviço vira **uma folha por etapa**, otimizada para grampear na bancada:

- **Página 1 — Resumo visual**: 3D frontal grande + dimensões totais + cor + quantidade de barras necessárias. Tudo em fonte 18 pt+.
- **Página 2 — Mapa de corte**: cada barra desenhada com peças coloridas (já existe, melhorar tamanho), com lista numerada P1, P2, P3… ao lado.
- **Página 3 — Etiquetas destacáveis**: a folha é dividida em **8 retângulos grandes**, cada um com `P3 / TUB 30x30 / 2.980 mm`. Funcionário corta com tesoura e cola na peça (com fita crepe). Sem QR — só o número e a medida em fonte enorme.
- **Página 4 — Sequência de soldas**: lista numerada com fonte grande + checkbox quadrado de 8mm para riscar com lápis.
- **Página 5 — Ferramentas / EPI**: checklist quadradão.

Tudo em **preto e branco** otimizado (PDF imprime bem em qualquer impressora barata da serralheria).

### Como o dono envia para a oficina
- **Modo TV**: dono abre o projeto no celular → botão "Enviar para oficina" → gera um link curto tipo `/op/abc123` que abre direto em tela cheia. Cola no navegador da TV uma vez, fica salvo. Próximos projetos: dono só atualiza qual projeto está "ativo" e a TV recebe via localStorage compartilhado (ou recarrega).
- **Modo Impressão**: botão "Imprimir OS" → gera o PDF acima, manda pra impressora.

**Sem preço aparece em nenhum dos dois.** O módulo de orçamento fica isolado em outra rota (`/app/...`) que o funcionário não tem motivo nem como abrir se a TV já está no kiosco.

---

## 2. Visualização 3D — melhorias

### Hoje
Geometria por tipologia, presets iso/frente/lateral/topo, cotas externas, rotação automática, wireframe, grid, cor de fundo.

### Adicionar
- **Pessoa de escala** (silhueta 1,75 m) e **carro** (4,5 m) opcionais ao lado do portão. Vende a percepção de tamanho na hora — argumento de venda principal.
- **Cotas internas**: vão livre, espaçamento entre montantes, altura útil.
- **Animação Abrir/Fechar**: botão que anima cada tipologia (correr desliza, basculante bascula, pivotante gira, rolo enrola). É o item que mais impressiona em demo.
- **Modo Dia/Noite**: dois setups de luz prontos. À noite cria efeito "vitrine" muito vendedor.
- **Ambiente** (toggle): troca o grid por piso de cimento + parede texturizada para não parecer flutuando.
- **Multi-snapshot no PDF**: o orçamento do cliente sai com 4 vistas (iso, frente, lateral, topo) automaticamente, não só a vista atual.
- **Foto do vão como fundo** (mobile): vendedor tira foto do local, o portão 3D aparece sobreposto. Mais simples e mais útil que AR para o cenário do dono na casa do cliente.

(AR via `<model-viewer>` fica como item futuro, opcional — exige iOS/Android moderno.)

---

## 3. Vendedor no celular — modo Atendimento

Hoje a tela tem sidebar 340 px que vira rolagem longa no celular. Para usar na casa do cliente:

- **Modo "Atendimento"** (toggle no topo): wizard 3 passos em tela cheia — *Medidas → Acabamento → Resumo*. Sem tabela de materiais, sem corte, sem solda. Só o que o cliente quer ver.
- **Teclado numérico custom** para largura/altura: botões grandes 0–9 + ±50 mm / ±100 mm. Mais rápido que o teclado do iOS, funciona com luva.
- **Bottom sheet** no mobile: configurações deslizam de baixo, 3D ocupa a tela inteira por padrão.
- **Assinatura no celular** (canvas touch) do cliente aprovando o orçamento — vira PDF assinado na hora.
- **Compartilhar PDF** direto via WhatsApp/Email com `navigator.share` — um toque, sem baixar.
- **PWA instalável** com ícone na tela inicial, funciona offline (já é local, falta o manifest + service worker).

---

## Detalhes técnicos (para referência)

### Arquivos a criar
- `src/pages/ModoOficina.tsx` — rota `/op/:id`, layout TV em quadrantes, sem menu, sem preços. Lê do mesmo localStorage do projeto.
- `src/pages/ModoAtendimento.tsx` — rota `/app/projeto/:id/atender`, wizard mobile.
- `src/components/TecladoNumerico.tsx` — input custom de medidas.
- `src/components/AssinaturaCanvas.tsx` — canvas touch para assinatura.
- `src/components/PessoaEscala.tsx` + `CarroEscala.tsx` — primitivas 3D simples.
- `src/lib/snapshot3d.ts` — captura programática das 4 vistas para PDF.
- `vite.config.ts` + `public/manifest.webmanifest` — PWA via `vite-plugin-pwa`.

### Arquivos a editar
- `src/components/Visualizador3D.tsx` — pessoa/carro, dia/noite, ambiente, animação de abertura via `useFrame` + estado.
- `src/lib/pdfProducao.ts` — redesenhar para fonte grande, etiquetas destacáveis (8 por página), checkboxes 8 mm, P&B otimizado, **sem QR**.
- `src/lib/pdf.ts` — multi-snapshot 4 vistas, condições comerciais, parcelas, assinatura.
- `src/App.tsx` — adicionar rotas `/op/:id` e `/app/projeto/:id/atender`.

### Dependências novas
`react-signature-canvas`, `vite-plugin-pwa`. (Sem `qrcode`, sem `@google/model-viewer` por enquanto.)

### Compatibilidade
Mantém React 18 + `@react-three/fiber@^8.18` + `@react-three/drei@^9.122` + `three@^0.170`.

---

## Sugestão de execução em 3 entregas

**Entrega 1 — Oficina blindada (resolve a dor principal)**
Modo TV (`/op/:id`), PDF de OS redesenhado (fonte grande, etiquetas, checkboxes), botão "Enviar para oficina". **Sem preço em nenhum dos dois.**

**Entrega 2 — Vendedor mobile**
Modo Atendimento + teclado numérico + bottom sheet + assinatura + compartilhar + PWA.

**Entrega 3 — 3D vendedor**
Pessoa/carro de escala + dia/noite + animação de abertura + multi-snapshot no PDF.

---

Confirma que sigo nessa ordem (Entrega 1 primeiro)? Ou quer ajustar alguma coisa do Modo TV — por exemplo, prefere uma tela única rolável em vez dos 4 quadrantes, ou quer que o auto-avanço seja padrão ligado/desligado?
