# Simplificar o sistema: board da vendedora, medição do Eduardo e menos ruído na tela

## 1. Board da Keilen (vendedora)

- Ao entrar, a vendedora cai num quadro só dela: aparecem apenas os orçamentos e as ordens em que ela é a vendedora.
- Continua vendo o que é dela até a entrega (orçamento em negociação, aprovado, em produção, entregue), com o passo a passo atual (baixar, enviar no WhatsApp, aprovar, contrato, comprovante).
- Ela não vê orçamentos de outras pessoas nem o filtro de vendedores.
- O gestor continua vendo tudo, com o filtro por vendedor como hoje.

## 2. Medição do Eduardo vira uma raia

- O menu "Oficina" passa a se chamar **Kanban**.
- Nova primeira raia: **Medição**, antes de Fila.
- Quando o orçamento é aprovado e a ordem de serviço é gerada, ela entra direto em **Medição**, e não mais em Fila.
- O cartão de medição mostra cliente, telefone e o endereço da obra (com atalho para abrir no mapa), além do prazo.
- O Eduardo faz a medição (fotos e medidas já existentes), preenche o checklist técnico e só então move o cartão para **Fila**, liberando a oficina.
- Se faltar checklist, o sistema avisa o que falta antes de deixar mover para Fila.

### Aviso da medição (só dentro do sistema)

- No menu, o item Kanban mostra um contador com quantas ordens estão esperando medição.
- Dentro do Kanban, faixa no topo: "X ordens aguardando medição", clicável para a raia.
- O aviso atualiza sozinho quando uma nova ordem é aprovada (já usamos atualização em tempo real).

## 3. Desenho 3D escondido

- O desenho 3D sai da tela do orçamento e das demais telas por enquanto; o código continua no projeto, apenas desligado, para religar depois com uma linha.
- Fotos, medidas e checklist continuam como estão.

## 4. Vendedora não vê material

- O menu Materiais já é só do gestor; a vendedora também deixa de ver qualquer custo de material dentro do orçamento (composição de preço, custos e margem).
- Ela vê apenas o valor a cobrar, serviços, frete e o total.

## Detalhes técnicos

- Banco: acrescentar `medicao` ao enum `etapa_oficina` como primeira etapa e recriar as funções `mover_etapa_oficina` / `mover_etapa_resp` / `ordens_oficina`. Aprovação passa a gravar `etapa = 'medicao'` (hoje `fila`, em `Configurador.tsx` e `Painel.tsx`).
- `src/lib/ordens.ts`: `ETAPAS_OFICINA` e `ETAPA_LABEL` ganham `medicao: "Medição"`; `etapaFotoDaOficina` em `src/lib/fotos.ts` mapeia `medicao` → fotos de medição.
- Bloqueio de saída de Medição usando o checklist já existente (`src/lib/checklistPedido.ts`).
- `src/pages/MinhasOrdens.tsx` e `KanbanOficina.tsx`: nova coluna, cartão de medição com endereço/telefone e atalho para `MedicaoDialog`.
- `AppLayout.tsx`: rótulo "Kanban" e badge de contagem de ordens em `medicao` (consulta leve + `useRealtimeProjetos`).
- Board da vendedora: nova rota padrão para papel `vendedora` reaproveitando `ProjetosLista`/`Painel` com filtro fixo pelo nome do usuário logado; esconder o seletor de vendedores para ela.
- Esconder 3D: remover o uso de `Visualizador3DClient` em `Configurador.tsx` atrás de uma flag (`MOSTRAR_3D = false`), mantendo `src/components/Visualizador3D.tsx` e `viz/` intactos.
- Custos de material: esconder blocos de composição/custo no `Configurador.tsx` quando `papel !== "gestor"`.

## Verificação

- Entrar como Keilen: ver só o que é dela, sem materiais nem custos, sem 3D.
- Aprovar um orçamento e confirmar que ele aparece em Medição com o endereço e conta no menu.
- Concluir a medição e o checklist e mover para Fila.
