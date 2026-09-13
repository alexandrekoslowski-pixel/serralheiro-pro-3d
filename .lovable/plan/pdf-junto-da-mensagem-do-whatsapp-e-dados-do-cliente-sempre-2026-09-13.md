# PDF junto da mensagem do WhatsApp e dados do cliente sempre arrumados

## 1. O orçamento vai junto com a mensagem

Hoje o passo 2 abre a conversa no WhatsApp só com o texto, e a vendedora precisa anexar o PDF à mão. O WhatsApp Web não aceita anexo por link, mas dá para mandar o PDF como **link de download** dentro da própria mensagem.

Como fica ao clicar em "Enviar no WhatsApp":

1. O sistema gera o PDF do orçamento na hora (mesmo se o passo 1 não tiver sido feito) e guarda uma cópia na nuvem.
2. Cria um endereço de acesso válido por 30 dias, só para quem receber o link.
3. Abre a conversa já com a mensagem de sempre mais a linha: "Orçamento em PDF: <link>".
4. Registra o envio e a contagem dos 3 dias, como hoje.
5. Se a internet falhar no envio do arquivo, a conversa abre mesmo assim, com aviso de que o PDF precisa ser anexado à mão.

O botão do passo 1 continua existindo para baixar o arquivo no computador.

## 2. Nome do cliente com iniciais maiúsculas

Ao sair do campo, "joão da silva" vira "João da Silva". Preposições ficam minúsculas (da, de, do, das, dos, e).

## 3. Outros campos arrumados sozinhos (ao sair do campo)

- **Rua, bairro, complemento, local de instalação**: mesmas iniciais maiúsculas.
- **Cidade/UF**: cidade com iniciais maiúsculas e a sigla do estado em maiúsculas ("são paulo/sp" → "São Paulo/SP").
- **E-mail**: tudo minúsculo e sem espaços.
- **Nome do orçamento e observações**: primeira letra maiúscula, sem espaços sobrando.
- **CPF/CNPJ e telefone**: já têm máscara; passam a avisar quando o número está incompleto, para não ir errado no contrato.
- Espaços duplicados são removidos em todos esses campos.

Nada é alterado enquanto a pessoa digita — a correção acontece só ao sair do campo, e ela pode editar depois.

## Detalhes técnicos

- Novo bucket privado `orcamentos-pdf` (10 MB, apenas PDF) criado pela ferramenta de storage; políticas em `storage.objects` limitando leitura/escrita ao dono da empresa (serralheiro fora).
- Novo `src/lib/orcamentoPdfEnvio.ts`: gera o blob com `gerarOrcamentoPDF(..., retornarBlob = true)`, envia para `<dono>/<projetoId>/orcamento-<timestamp>.pdf` e devolve `createSignedUrl` de 30 dias.
- `src/lib/whatsapp.ts`: `textoOrcamento()` recebe um `linkPdf` opcional e acrescenta a linha do link.
- `src/pages/Configurador.tsx`: `marcarEnviado()` vira assíncrono com estado de carregando no botão; grava também `orcamento_pdf_em`; fallback com toast de aviso em caso de erro no upload.
- `src/lib/mascaras.ts`: novas funções `nomeProprio`, `cidadeUf`, `emailNormalizado`, `frasePrimeiraMaiuscula` aplicadas em `onBlur` nos campos do Configurador (e reaproveitadas em `Clientes.tsx`/`ClienteDetalhe.tsx`).
