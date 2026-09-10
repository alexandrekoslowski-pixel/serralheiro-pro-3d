# Proposta em PDF com as condições comerciais

Hoje o PDF do orçamento traz só cabeçalho, cliente, peças, tabela de itens e um rodapé curto de condições. A ideia é transformá-lo na proposta completa que você já envia por mensagem, com prazo em dias úteis ajustável.

## O que muda no PDF

Passa a ter 2 páginas:

**Página 1 — Orçamento** (como hoje, com ajustes)
- Cabeçalho da empresa, número do orçamento, data de emissão e validade (5 dias corridos).
- Bloco do cliente logo abaixo do cabeçalho, em destaque: nome e sobrenome, RG ou CPF, endereço completo (rua, número, complemento, bairro, cidade/UF, CEP), telefone/WhatsApp e e-mail.
- Local de instalação, quando for diferente do endereço do cliente.
- Peças com medidas, cor e sistema de fixação, e a tabela de valores com o total. Sem o desenho 3D.
- Linha de destaque: "Prazo de entrega: aproximadamente X dias úteis após a confirmação do pagamento da entrada" — X vem do campo do orçamento (padrão 22).

**Página 2 — Condições**
- Formas de pagamento por faixa de valor (1x até R$1.000, 2x até R$2.000, 3x até R$3.000, 4x acima de R$3.000, à vista 5% de desconto 50/50, acima de R$4.000 metade no PIX + 5x).
- Destaque automático da faixa aplicável ao total daquele orçamento.
- Chave PIX (CNPJ e razão social) e aviso para enviar o comprovante.
- Informações técnicas: serviços/frete não preenchidos não entram; sem mão de obra de pedreiro; sem vidro, puxadores e caixa de correio; pintura eletrostática epóxi; garantia de fábrica de 90 dias; automação exige energia próxima.
- Validade do orçamento: 5 dias corridos.

## Campos novos no sistema

No orçamento (tela do projeto, bloco "Cliente"):
- Nome e sobrenome (já existe o campo cliente)
- RG ou CPF
- Endereço completo
- Telefone / WhatsApp
- Prazo de entrega em dias úteis (vazio = 22)

Em Configurações > Empresa (valem para todos os PDFs, editáveis):
- Prazo padrão em dias úteis (22)
- Validade da proposta em dias corridos (5)
- Chave PIX e nome do favorecido
- Garantia em dias (90)
- Texto livre de "Informações técnicas" e de "Formas de pagamento", já preenchidos com o conteúdo acima, para você editar sem depender de mim.
- Valor da visita técnica (R$ 50), mostrado como observação quando preenchido.

As mensagens de follow-up ("Espero que esteja bem...", cobrança de retorno, visita técnica) são texto de conversa, não de proposta — em vez de entrar no PDF, ficam em Configurações como modelos prontos com botão "Copiar", para colar no WhatsApp. Se preferir que apareçam no PDF, é só dizer.

## Detalhes técnicos

- `DadosEmpresa` em `src/lib/storage.ts` ganha os campos de proposta; persistidos no bloco `dados` da tabela `empresa` (sem migração de banco).
- `Peca`/`ProjetoLocal` ganham `cliente_documento`, `cliente_endereco`, `cliente_telefone`, `prazo_dias_uteis`; salvos dentro de `dados` do projeto — orçamentos existentes continuam válidos com valores vazios.
- `src/lib/pdf.ts`: segunda página com as seções, seleção da faixa de parcelamento a partir de `resultado.totalGeral`, e uma função utilitária para somar dias úteis (pular sábados e domingos) ao estimar a data.
- Formulário de cliente no `Configurador.tsx` e nos novos campos de `Configuracoes.tsx`.
