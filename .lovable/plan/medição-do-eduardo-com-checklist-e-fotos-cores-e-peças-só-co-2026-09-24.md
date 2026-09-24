# Medição do Eduardo com checklist e fotos; cores e peças só com a vendedora

## O que muda para o usuário

1. **Cores e peças ficam só com a vendedora**
   - A pergunta "Acabamento e cor foram confirmados?" sai do checklist.
   - A cor e os dados das peças (produto, modelo, medidas do orçamento, fechaduras, automação, valores) continuam só na montagem do orçamento, feita pela vendedora.
   - Na tela do Eduardo não aparece nada de cor nem de edição de peças.

2. **Botão "Fazer medição" leva direto ao checklist + fotos**
   - Ao clicar no aviso do sino (ou no botão Medição do cartão), abre uma tela única com, nesta ordem:
     1. Endereço da obra e nome do cliente (só leitura).
     2. **Checklist técnico** da ordem, peça por peça (só perguntas técnicas: fixação, base, articulação, fechaduras etc.), com os pendentes destacados.
     3. Medidas medidas no local (largura/altura) e observações.
     4. **Fotos da medição**: adicionar foto e anotar foto com medidas.
   - Botão "Salvar" grava checklist e medidas juntos. Nenhum valor em R$ aparece.
   - O botão "Mandar para a fila" continua exigindo o checklist completo.

## Detalhes técnicos

- `src/lib/checklistPedido.ts`: remover a pergunta `comum.cor` (respostas antigas ficam ignoradas).
- `src/components/ChecklistPedido.tsx`: nova prop `somenteTecnico` que esconde perguntas marcadas `comercial: true`; seletor de peças mostra só o nome (sem editar peça).
- `src/components/MedicaoDialog.tsx`: incluir cabeçalho com cliente/endereço, `ChecklistPedido` (somenteTecnico, com o bloco de sistema/lados de fixação da peça) acima das medidas, e manter `PainelFotos` + `EditorMedicao`; salvar grava `checklist_respostas` do projeto e de cada peça junto com `medicao`.
- Diálogo em tela maior (max-w-4xl) e utilizável no celular, já que a medição é feita em campo.
- `AvisosMedicao.tsx` já navega para `/app/oficina?medicao=<id>`, que abre esse diálogo — sem mudança de rota.
- Verificar com Playwright como Eduardo: sino → Fazer medição → checklist visível, foto anexada, salvar.
