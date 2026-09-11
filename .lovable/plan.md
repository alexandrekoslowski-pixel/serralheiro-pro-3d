# Desenho 3D mais avançado

Deixar o desenho do orçamento mais bonito para o cliente, mais fiel ao que a oficina vai fabricar, com medidas mais claras e leve no celular.

## 1. Cena mais bonita (realismo)

- Iluminação nova: luz principal com sombra suave, luz de preenchimento e reflexos "de estúdio" gerados dentro do próprio sistema (sem depender de arquivo externo, que hoje pode travar o desenho).
- Chão real com sombra de contato embaixo das peças, no lugar do chão vazado atual (a grade continua, mas como opção).
- Cenário opcional de contexto: muro/parede atrás da peça, para o cliente entender como fica instalada.
- Pintura metálica de verdade: acabamento fosco/acetinado conforme a cor escolhida, brilho leve e variação de textura; vidro das janelas com transparência melhor.
- Ajuste de cor/contraste final da imagem, para o print usado na proposta ficar mais bonito.
- Modo noite mantido, com iluminação revisada.

## 2. Mais fiel ao que se fabrica (precisão técnica)

- Perfis com a medida real do tubo usado em cada tipologia (ex.: 30x30, 20x20), com cantos levemente arredondados, em vez de barras genéricas.
- Cantos com encontro em meia-esquadria (como a solda real).
- Acessórios visíveis conforme a peça: dobradiças, fechadura/puxador, roldanas e trilho, rolo e guias no portão de enrolar.
- Fixação desenhada: grapas de chumbar ou parafusos/buchas, por dentro ou por fora do quadro, e em um ou nos dois lados, conforme já está cadastrado na peça.

## 3. Medidas mais claras

- Linhas de cota com setas desenhadas na própria cena (largura, altura e largura total do conjunto), no lugar das etiquetas soltas de hoje.
- Cotas sempre legíveis, viradas para a câmera, em centímetros.
- Peça selecionada no orçamento fica destacada no desenho; clicar numa peça no desenho seleciona ela nos campos.

## 4. Leve no celular

- Barras repetidas (grades, venezianas, lâminas) desenhadas de forma agrupada, o que reduz muito o peso da cena.
- Qualidade automática: no celular reduz sombras e resolução; no computador usa o modo completo.
- Pausa o desenho quando a aba/tela não está visível.

## 5. Pessoa e carro

- Substituir a pessoa e o carro atuais por modelos 3D prontos e gratuitos (uso livre), baixados para dentro do projeto, com tamanho correto de referência (pessoa ~1,75 m, carro popular).
- Se algum download falhar, mantém a silhueta atual em vez de deixar o espaço vazio.

## Detalhes técnicos

- Arquivo principal: `src/components/Visualizador3D.tsx`, dividido em módulos (`cena/`, `perfis/`, `cotas/`, `escala/`) para não virar um arquivo gigante.
- Trocar `Environment preset="warehouse"` por `<Environment>` com `Lightformer` local; adicionar `ContactShadows`, `SoftShadows` e tone mapping ACES.
- Perfis com `ExtrudeGeometry` de perfil arredondado + `InstancedMesh`/`Instances` (drei) para barras repetidas.
- Tabela de perfis por tipologia lida das regras já existentes em `src/lib/tipologias.ts` / `producao.ts`, para o desenho bater com a lista de corte.
- Cotas com `Line`/`Billboard` do drei, em vez de `Html`.
- Modelos CC0 (Kenney/Quaternius/poly.pizza) salvos em `public/models/`, carregados com `useGLTF` dentro de `<Suspense>`.
- `dpr` adaptativo, `frameloop="demand"` quando não há animação, e `PerformanceMonitor` para baixar qualidade automaticamente.
- Sem mudança de banco de dados, preços, permissões ou PDFs — apenas o desenho e o print gerado por ele.

## Ordem de execução

1. Cena, iluminação, materiais e chão (visual imediato).
2. Perfis reais, cantos e acessórios de fixação.
3. Cotas com setas e seleção de peça.
4. Modelos de pessoa e carro.
5. Otimização de celular e verificação em tela.
