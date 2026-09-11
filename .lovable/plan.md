# Plano: agilizar orçamento, acompanhamento e aprovação

## Objetivo
Reduzir o trabalho manual da vendedora desde o cadastro do endereço até a aprovação: buscar endereço pelo CEP, acompanhar propostas enviadas, retomar o cliente após três dias, gerar contrato e registrar o comprovante da entrada.

## 1. CEP primeiro e endereço automático
- Reordenar os dados do cliente para começar pelo CEP, tanto no cadastro de clientes quanto dentro do orçamento.
- Ao completar os 8 números, consultar o CEP automaticamente e preencher rua, bairro e cidade/UF.
- Manter número e complemento para digitação manual, sem apagar dados já preenchidos se a consulta falhar.
- Mostrar estados claros de “buscando”, “CEP não encontrado” e permitir correção manual.
- Reaproveitar o mesmo comportamento nas duas telas para evitar resultados diferentes.

## 2. Marcar orçamento como enviado
- Adicionar a ação destacada **“Marcar como enviado ao cliente”** no orçamento.
- Registrar data, hora e vendedora responsável pelo envio; essa data inicia a contagem dos três dias.
- Mostrar no painel se o orçamento está “não enviado”, “aguardando cliente”, “retorno pendente” ou “retorno enviado”.
- Se o orçamento for aprovado antes do prazo, cancelar qualquer retorno pendente.

## 3. Retorno de WhatsApp após três dias
- Ao completar três dias corridos desde o envio, mantendo o status em orçamento, criar o retorno pendente.
- Exibir no painel da vendedora uma ação **“Enviar retorno no WhatsApp”**, abrindo a conversa com a mensagem configurada e os dados do cliente preenchidos.
- Preparar também o envio automático pela API oficial do WhatsApp Business, usando uma mensagem aprovada pela Meta e registrando sucesso, falha, data e tentativa.
- Manter o envio manual como alternativa caso a integração esteja indisponível ou o cliente não tenha WhatsApp válido.
- Evitar duplicidade: cada orçamento recebe no máximo um retorno automático desse ciclo.
- O envio automático dependerá da conexão posterior da conta oficial do WhatsApp Business e das credenciais fornecidas pela Meta; a parte manual funcionará sem essa conexão.

## 4. Contrato de prestação de serviço
- Criar um PDF separado do orçamento, disponível após a aprovação.
- Incluir empresa, cliente, endereço da obra, descrição das peças/serviços, medidas, valor total, forma de pagamento, prazo, garantia, obrigações, aceite e campos de assinatura.
- Não listar perfis, ferragens, materiais, custos internos, margem ou plano de corte.
- Permitir editar nas Configurações as cláusulas gerais do contrato antes da geração.
- Adicionar botão claro **“Gerar contrato”** no orçamento aprovado e na ordem de serviço.
- Validar visualmente todas as páginas do PDF, incluindo textos longos e quebras de página.

## 5. Comprovante de pagamento na aprovação
- Transformar “Aprovar e mandar para a oficina” em uma confirmação simples com:
  - anexar comprovante da entrada (foto ou PDF);
  - informar valor, data e forma do pagamento;
  - ou marcar **“Entrada ainda pendente”** quando a aprovação ocorrer sem pagamento.
- Como foi escolhida a aprovação sem entrada, a ordem poderá seguir para a oficina, mas ficará com aviso visível de **“Comprovante pendente”** para vendedora e gestor.
- Quando o pagamento chegar, a vendedora anexa o comprovante ao lançamento financeiro; o aviso desaparece automaticamente.
- Guardar comprovantes em área privada, acessível somente à gestão e às vendedoras; o serralheiro não verá pagamentos, valores ou arquivos financeiros.
- Cobrir todos os caminhos de mudança de status, evitando que a seleção manual contorne esse registro.

## 6. Dados e segurança
- Acrescentar ao orçamento os registros de envio e retorno do WhatsApp.
- Vincular o comprovante ao pagamento correspondente, com histórico de quem anexou e quando.
- Aplicar permissões para que dados comerciais, contrato e comprovantes não apareçam no perfil da oficina.
- Preservar todos os clientes, orçamentos, pagamentos e fotos existentes durante a atualização.

## 7. Verificação
- Testar CEP válido, inválido, indisponibilidade da consulta e edição manual.
- Testar contagem a partir da data de envio, cancelamento após aprovação, prevenção de duplicidade e alternativa manual.
- Testar aprovação com comprovante e com entrada pendente nos acessos de gestor e vendedora.
- Confirmar que o serralheiro recebe a ordem sem visualizar informações financeiras.
- Gerar e revisar visualmente o contrato em PDF com uma e várias peças, textos longos e dados incompletos.
- Validar telas no celular das vendedoras e no monitor largo da oficina.

## Detalhes técnicos
- Usar uma consulta pública de CEP no navegador, sem chave privada.
- Criar alterações no banco por migração, com regras de acesso por empresa e perfil.
- Implementar o acompanhamento automático por uma função segura e uma verificação periódica de baixa frequência, suficiente para a janela de três dias.
- Integrar o WhatsApp oficial no servidor, sem expor credenciais no navegador; a conexão será solicitada somente quando a estrutura estiver pronta.
