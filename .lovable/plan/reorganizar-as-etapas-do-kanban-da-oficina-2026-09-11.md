# Reorganizar as etapas do Kanban da oficina

## Resultado esperado
O Kanban seguirá esta ordem:

1. Fila
2. Produção / montagem
3. Acabamento
4. Pintura
5. Entrega
6. Pós-venda
7. Pronto

Os cartões avançarão nessa sequência tanto pelo botão quanto ao serem arrastados.

- **Entrega**: responsável pela instalação, endereço da obra e foto final.
- **Pós-venda**: a vendedora faz as perguntas de acompanhamento e encerra o atendimento.
- **Pronto**: serviço concluído, última raia do quadro.

## Alterações
- Atualizar nomes e ordem das etapas em todas as telas da oficina, inclusive no acesso do gestor e no quadro aberto da TV.
- Acrescentar a etapa **Entrega** entre Pintura e Pós-venda, mantendo Pós-venda e Pronto.
- Registros antigos em **Pós-venda** passam para **Entrega**; os que estavam em **Pronto** passam para **Pós-venda**.
- Ajustar botões de avanço, arrastar e soltar, responsáveis por etapa e associação de fotos.
- Pedir a foto da instalação na etapa **Entrega**, sem repetir o pedido em Pós-venda e Pronto.
- Em **Pós-venda**, oferecer um espaço curto de observações do contato com o cliente antes de mover para Pronto.

## Detalhes técnicos
- Migrar o enum de etapas acrescentando `entrega` na posição correta e recriar as funções de movimentação.
- Atualizar os tipos locais e os mapeamentos de `EtapaOficina`, incluindo a conversão etapa do kanban → etapa da foto.
- Manter `producao` como valor interno, exibindo **Produção / montagem** para os usuários.
- A consulta atual confirmou que as ordens existentes estão somente em **Fila** e **Produção**, portanto a mudança não desloca nenhuma ordem ativa hoje; a conversão fica preparada para dados antigos.

## Verificação
- Confirmar as sete colunas na ordem definida, em telas grandes e no celular.
- Testar avanço por botão e por arrastar entre todas as etapas.
- Confirmar responsável, endereço e envio de foto em **Entrega**.
- Confirmar que o serralheiro continua sem acesso a valores financeiros.
