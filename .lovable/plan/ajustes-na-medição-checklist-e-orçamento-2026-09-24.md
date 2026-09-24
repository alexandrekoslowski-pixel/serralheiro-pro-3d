# Ajustes na medição, checklist e orçamento

## 1. Botão "Fazer medição" do sino
- Hoje ele só leva para o Kanban (e, se o Eduardo já está lá, nada acontece).
- Passa a abrir direto a tela de medição daquela ordem (medidas, fotos, checklist).

## 2. Checklist da medição (Eduardo)
Remover:
- "Precisa de visita para medição fina?"
- "Qual é o tipo do serviço?"
- "O vão está no esquadro e no nível?"
- "Existem interferências no local?"
- "O que está incluído no pedido?"
- "O piso está nivelado e pronto?" (portão de correr) e "Condição do piso" (pivotante)

Alterar:
- Base de fixação: acrescentar **Drywall**.
- Sistema de articulação: acrescentar **Basculante** e **Deslizante**.
- Sistema de fixação continua no checklist da medição.
- Cor/acabamento sai da medição e fica só com a vendedora, na montagem do orçamento.

## 3. Medição sem valores
- Nenhum valor em R$ aparece na tela de medição do Eduardo.

## 4. Orçamento (vendedora)
- A seção de peças fica com a vendedora (ela escolhe produto, medidas e cor).
- Medidas: botões − / + passam a mudar de 1 em 1 cm (antes 10 cm).
- Automação por peça: permite marcar várias ao mesmo tempo (ex.: motor + eletroímã), somando os valores; cada uma continua com valor editável.
- Orçamentos já salvos com uma única automação continuam funcionando.

## Detalhes técnicos
- `AvisosMedicao.tsx`: botão navega para `/app/oficina?medicao=<id>`; Kanban/MinhasOrdens lê o parâmetro e abre `MedicaoDialog` controlado para aquela ordem.
- `checklistPedido.ts`: remover `comum.visita`, `comum.servico`, `comum.esquadro`, `comum.interferencias`, `comum.inclusos`, `correr.piso`, `pivotante.piso`; `comum.base` + "Drywall"; `pivotante.articulacao` + "Basculante", "Deslizante"; perguntas de cor marcadas como comerciais (só vendedora). Respostas antigas dessas perguntas são ignoradas sem quebrar.
- Checklist exibido na medição filtra perguntas comerciais e oculta valores.
- `Configurador.tsx`: passo das medidas de 100 mm para 10 mm.
- `storage.ts`/`calculator.ts`: `automacao` da peça vira lista (`automacoes[]`), com migração do campo único; total, PDFs, contrato e oficina somam/listam todas.
