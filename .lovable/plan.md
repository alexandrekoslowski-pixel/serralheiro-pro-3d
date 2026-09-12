# Plano: meta de faturamento, medição com foto anotada e pós-venda

## Objetivo
Três melhorias escolhidas: (1) meta semanal de faturamento com barra de progresso no painel do gestor; (2) medição com foto anotada no celular (setas, cotas e textos em cima da foto); (3) checklist de pós-venda com abertura de ocorrências antes de o card ir para "Pronto".

## 1. Meta semanal de faturamento
- Campo editável "Meta semanal (R$)" nas Configurações (padrão R$ 40.000).
- No Painel, bloco visível apenas para gestor: barra de progresso com faturado na semana (segunda a domingo), percentual e quanto falta.
- Cor da barra muda conforme o andamento (verde ao bater a meta).
- Baseado nos pagamentos recebidos na semana + valor faturado, sem mexer em nenhum cálculo existente.

## 2. Medição com foto anotada
- Dentro da OS (tela do gestor/vendedora e Minhas Ordens), nova seção "Medição":
  - tirar foto pelo celular (câmera nativa) ou anexar imagem;
  - editor simples em cima da foto: setas horizontais/verticais com valor da medida em cm, linhas livres e textos curtos;
  - campos de largura, altura e observações da medição.
- A foto anotada é salva (imagem final já com as marcações) no bucket privado existente `ordem-fotos`, etapa `medicao`, reaproveitando o upload e a compressão já implementados.
- Oficina vê as fotos de medição na OS técnica, sem qualquer valor financeiro.

## 3. Pós-venda com ocorrências
- Quando o card entra na raia "Pós-venda", vendedora/gestor abre o checklist:
  - instalação ok? cliente satisfeito? surgiu algum problema?
- Se houver problema: abre ocorrência com descrição, responsável, prazo e status (aberta/resolvida); fotos opcionais.
- O card só pode ir para "Pronto" quando o checklist estiver completo e não houver ocorrência aberta — com aviso claro se tentarem mover antes.
- Ocorrências resolvidas ficam no histórico da OS e do cliente.

## Banco de dados (Lovable Cloud)
- `empresa.dados`: novo campo `meta_semanal` (sem migration, é JSON).
- Nova tabela `ocorrencias` (projeto_id, descrição, responsável, prazo, status, resolução), com GRANTs e RLS por empresa/papel — serralheiro não vê ocorrências com dados comerciais.
- Tabela de medição: reutilizar `ordem_fotos` (etapa `medicao`) + campos de medida no JSON da OS; sem tabela nova.
- Preservar todos os dados existentes.

## Verificação
- Editar meta, conferir barra subindo com pagamentos de teste na semana.
- Anotar foto no celular (via preview), salvar e ver a imagem marcada na OS e na oficina.
- Tentar mover card para Pronto com checklist incompleto/ocorrência aberta e confirmar bloqueio; concluir fluxo completo.
- Testar nos três perfis (gestor, vendedora, serralheiro).

## Detalhes técnicos
- Editor de anotação em canvas puro (sem biblioteca nova), exportando JPEG comprimido.
- Reuso de `fotos.ts` (upload/compressão) e do bucket `ordem-fotos`.
- Nenhuma mudança no Kanban público de TV além de exibir fotos de medição na OS.
