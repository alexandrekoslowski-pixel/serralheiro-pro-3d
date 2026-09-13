# Ajustes no cadastro do cliente e no comprovante

Quatro correções pedidas: documento do cliente, número do endereço, fechamento da tela de comprovante e a guia Serviços.

## 1. Documento do cliente (hoje "RG ou CPF")

Hoje o campo aceita RG, CPF e CNPJ ao mesmo tempo, então a formatação muda sozinha enquanto se digita e confunde.

- O campo passa a se chamar **CPF / CNPJ**, com formatação automática: até 11 dígitos vira CPF (000.000.000-00), acima disso vira CNPJ (00.000.000/0000-00).
- Aviso curto abaixo quando o número está incompleto.
- O RG sai do campo principal (praticamente não é usado em nota/contrato). Se você quiser guardar o RG, digo onde colocar como campo separado opcional — hoje o plano é remover.

## 2. Número do endereço separado

- Ordem dos campos: CEP → Rua → **Número** → Complemento → Bairro → Cidade/UF.
- Ao buscar o CEP, rua, bairro e cidade vêm preenchidos e o cursor vai direto para o Número.
- Número e complemento passam a ser guardados em campos próprios do orçamento e do cliente; endereços já cadastrados continuam aparecendo como estão (o texto atual vira a rua).
- Contrato, PDF do orçamento, WhatsApp e a ficha de entrega passam a montar o endereço completo a partir desses campos.

## 3. Tela do comprovante com fim claro

Hoje, depois de anexar, a janela fica aberta sem indicar que acabou.

- Depois de lançar o pagamento com o comprovante, a tela mostra uma confirmação ("Comprovante anexado") e o botão principal vira **Concluir e voltar ao orçamento**, que fecha a janela e marca o passo como concluído na trilha da vendedora.
- Se o passo seguinte for mandar para a oficina, aparece também o botão **Mandar para a oficina** direto nessa confirmação.
- O resumo de valores fica mais simples: recebido e em aberto, sem o valor negativo em verde que aparece hoje.

## 4. Guia Serviços

- Remover o item **Serviços** do menu. A página continua acessível pelo endereço direto para não quebrar nada, mas some da navegação.

## Detalhes técnicos

- `src/lib/mascaras.ts`: `rgCpf` deixa de ser usada no cadastro de cliente; usar `cpfCnpj` com validação de dígito opcional em `validacao.ts`.
- `src/lib/storage.ts` e tabela `projetos`/`clientes`: novos campos `cliente_numero` e `cliente_complemento`, com migração que mantém `cliente_endereco` atual.
- `src/pages/Configurador.tsx`: reordenar bloco do cliente, foco automático no número após `buscarCep`.
- `src/components/DialogOrdemFinanceiro.tsx`: estado de sucesso após `anexarComprovante`, botões de encerramento, resumo ajustado.
- `src/pages/AppLayout.tsx`: remover o item `/app/catalogo` da lista de navegação.
- Ajustar `pdf.ts`, `pdfContrato.ts` e `whatsapp.ts` para o endereço composto.
