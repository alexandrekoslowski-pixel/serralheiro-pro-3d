# Orçamento mais simples: peças, envio por WhatsApp e situação automática

Quatro ajustes na tela do orçamento, sem mudar cálculo, PDFs nem banco.

## 1. Seção "Peças" mais clara

Hoje os campos da peça ficam numa grade solta, a fileira de cores ocupa uma linha inteira e o cartão da peça mostra pouca coisa.

- Cada peça vira um cartão maior com nome, tipologia, medida em cm e bolinha da cor; o escolhido fica com borda laranja e o "remover" só aparece nele.
- Os campos da peça escolhida ficam agrupados em três blocos com títulos: **O que é** (nome, tipologia), **Medidas** (largura, altura), **Acabamento e fixação** (cor, sistema, lados).
- As cores passam a ficar ao lado dos outros campos, numa faixa compacta que rola, sem estourar a linha.
- Abaixo das medidas, uma linha-resumo: "Portão basculante · 300 × 250 cm · Preto · Chumbado por dentro · 8 pontos".
- No celular tudo vira uma coluna, com campos de toque maior.

## 2. Aba "Proposta" deixa de existir

Os campos dela são poucos e voltam para onde fazem sentido:

- Vendedor e Prazo (dias úteis) → junto dos dados do cliente.
- Serviços e Frete → junto de "Composição do preço", perto do total.
- Observações da proposta → também em "Composição do preço".

As abas ficam: **1 Cliente · 2 Checklist do pedido · 3 Ordem de serviço**. Nada some do PDF.

## 3. A situação anda sozinha

- Sai o seletor de "Situação" da tela do orçamento e da janela do Financeiro. A situação passa a mudar só pelos passos reais: aprovar, mandar para a oficina, entregar, faturar.
- Continua existindo a exceção: o botão **Mandar para a oficina** (passo 6) pode ser usado antes do resto estar completo, mas passa a mostrar antes uma confirmação listando o que falta — checklist, comprovante, prazo de entrega, telefone, endereço. A vendedora lê e decide "Mandar assim mesmo" ou "Voltar e completar".
- O checklist do pedido deixa de bloquear: vira um aviso dentro dessa mesma lista.
- Na janela do Financeiro fica apenas "Marcar como entregue" / "Marcar como faturado" conforme o momento, em vez da lista solta de situações.

## 4. Enviar o orçamento pelo WhatsApp

O passo 2 passa a ser **Enviar no WhatsApp**:

- Abre `wa.me` numa nova aba já no número do cliente, com a mensagem padrão da empresa mais o resumo do orçamento (número, peças, total, validade).
- Ao abrir, registra o envio e inicia a contagem dos 3 dias, como hoje.
- Sem telefone cadastrado, avisa e leva o foco ao campo do telefone.
- O PDF continua sendo baixado no passo 1 e anexado à mão na conversa (o WhatsApp Web não aceita anexo por link).

## Detalhes técnicos

- `src/pages/Configurador.tsx`: remoção da aba `proposta` e realocação dos campos; reescrita da seção de peças em blocos; remoção do `Select` de `status`; `mandarParaOficina()` passa a abrir um `AlertDialog` de pendências em vez de retornar em `checklistPendente()`.
- Nova função em `src/lib/progressoOrcamento.ts` para listar pendências da ordem (checklist, comprovante, prazo, contato).
- `src/components/PassosOrcamento.tsx`: rótulo/ícone do passo 2 para WhatsApp.
- Helper de link WhatsApp reaproveitando o padrão já usado em `Painel.tsx`/`ProjetosLista.tsx`, com o texto do orçamento.
- `src/components/DialogOrdemFinanceiro.tsx`: troca do seletor de situação por botões de avanço.
