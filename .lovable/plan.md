# Reorganizar as etapas do Kanban da oficina

## Resultado esperado
O Kanban seguirá esta ordem:

1. Fila
2. Produção / montagem
3. Acabamento
4. Pintura
5. Entrega
6. Pós-venda

Os cartões avançarão nessa sequência tanto pelo botão quanto ao serem arrastados. A etapa **Entrega** concentrará responsável pela instalação, endereço da obra e foto final; **Pós-venda** ficará como a última etapa do acompanhamento.

## Alterações
- Atualizar os nomes e a ordem das etapas em todas as telas da oficina, inclusive no acesso do gestor e no quadro aberto da TV.
- Trocar a etapa antiga **Pronto** por **Entrega** no banco e nas regras do sistema.
- Preservar a regra escolhida para registros antigos: ordens em **Pós-venda** passam para **Entrega**, e ordens em **Pronto** passam para **Pós-venda**.
- Ajustar os botões de avanço, arrastar e soltar, responsáveis por etapa e associação de fotos.
- Fazer a foto da instalação ser solicitada na etapa **Entrega**, sem repeti-la ao avançar para **Pós-venda**.
- Atualizar os textos e tipos usados pela ordem técnica sem expor informações financeiras.

## Detalhes técnicos
- Migrar o enum de etapas e recriar as funções de movimentação afetadas com a nova sequência.
- Atualizar os tipos locais e os mapeamentos de `EtapaOficina`.
- Manter `producao` como valor interno, exibindo **Produção / montagem** para os usuários.
- A consulta atual confirmou que as ordens existentes estão somente em **Fila** e **Produção**, portanto a mudança não deslocará nenhuma ordem ativa hoje; a conversão ficará preparada para dados antigos.

## Verificação
- Confirmar as seis colunas na ordem definida, em telas grandes e no celular.
- Testar avanço por botão e por arrastar entre todas as etapas.
- Confirmar responsável, endereço e envio de foto em **Entrega**.
- Confirmar que o serralheiro continua sem acesso a valores financeiros.
