# Menos digitação: nome do orçamento automático e outros preenchimentos

## 1. Nome do orçamento montado sozinho

O campo "Nome do orçamento" deixa de exigir digitação: passa a ser montado a partir do cliente e das peças.

- Formato: **Cliente — 2 peças: Portão de correr, Grade fixa** (até duas tipologias citadas; acima disso, "e mais 2").
- Sem cliente ainda: só as peças ("Portão de correr 300 × 250 cm").
- Atualiza sozinho enquanto a vendedora mexe no cliente ou nas peças, **até que ela digite um nome próprio** — a partir daí o nome dela é respeitado e nada mais sobrescreve.
- O campo continua editável, com a dica "gerado automaticamente" e um botão pequeno para voltar ao nome automático.

## 2. Nome de cada peça automático

Hoje cada peça nasce como "Peça 1", "Peça 2". Passa a nascer com o nome da tipologia escolhida ("Portão de correr", "Grade fixa balãozinho") e a acompanhar a troca de tipologia enquanto a vendedora não escrever um nome próprio.

## 3. Outros preenchimentos automáticos

- **Vendedor**: o orçamento novo já vem com o nome de quem está logado (hoje fica vazio e é escolhido à mão). Continua trocável.
- **Cliente já cadastrado**: ao escolher uma sugestão pelo nome, além do que já é trazido hoje, preenche também documento, telefone, e-mail e endereço completo quando o orçamento ainda estiver vazio nesses campos — sem apagar nada já digitado.
- **Cor e prazo**: a peça nova herda a cor da peça anterior do mesmo orçamento, em vez de voltar sempre para branco.
- **Local de instalação**: fica vazio significando "mesmo endereço do cliente"; nos PDFs já é assim, então só ganha o texto de apoio "deixe vazio se for no endereço do cliente".

## Detalhes técnicos

- Novo helper `nomeSugeridoOrcamento(projeto)` em `src/lib/storage.ts` (ou `src/lib/orcamentoNome.ts`), usando `tipologiaPorId` e `cm()`.
- `ProjetoLocal` ganha `nome_manual?: boolean`, gravado no JSON de `projetos` (sem migração). `criarOrcamentoRapido()` deixa `nome` vazio e `nome_manual` falso.
- `Configurador.tsx`: efeito que recalcula `nome` quando `nome_manual` é falso; `onChange` do campo marca `nome_manual`; botão "usar automático" limpa a marca. `adicionarPeca()` passa a nomear pela tipologia e herdar a cor; seleção de tipologia renomeia enquanto o nome bate com a tipologia anterior.
- Vendedor default vindo de `session.user.user_metadata.nome` no momento da criação.
- Preenchimento a partir do cliente escolhido usa os campos já retornados por `listarClientes()`.
