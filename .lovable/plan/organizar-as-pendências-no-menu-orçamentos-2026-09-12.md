# Organizar as pendências no menu Orçamentos

## Objetivo
Deixar o Painel mais limpo para acompanhamento geral e concentrar o trabalho diário das vendedoras na tela **Orçamentos**.

## Painel
- Remover o bloco **“O que falta fazer”** e seus filtros de pendência.
- Manter os cartões de resumo, prioridades por prazo, ordens de serviço e calendário.
- Manter nos cartões a indicação compacta do progresso de cada orçamento, sem duplicar a lista operacional.

## Orçamentos
- Colocar **“O que falta fazer”** no topo da tela, antes da relação geral de orçamentos.
- Exibir as pendências em formato de lista, ordenadas por quem está parado há mais tempo.
- Cada linha mostrará cliente/orçamento, vendedor, valor, tempo parado, pendência atual e a ação direta correspondente:
  - Marcar como enviado
  - Retomar no WhatsApp
  - Anexar comprovante
  - Mandar para a oficina
- Manter contadores clicáveis para filtrar por tipo de pendência.
- Manter busca e ordenação combinadas com o filtro escolhido.
- Abaixo da lista de tarefas, preservar os cartões atuais dos orçamentos e a trilha compacta de progresso.
- Quando não houver pendências, mostrar uma confirmação simples de que está tudo em dia.

## Usabilidade
- A lista será confortável no computador e reorganizada em blocos legíveis no celular, sem ações espremidas.
- Os botões continuarão visíveis e com nomes claros, permitindo resolver a tarefa sem abrir o orçamento quando possível.
- Gestor e vendedoras terão a mesma visão; nada será acrescentado à tela do serralheiro.

## Detalhes técnicos
- Reaproveitar o cálculo existente em `progressoOrcamento`, sem alteração no banco.
- Transferir para `ProjetosLista` as ações hoje existentes no Painel, incluindo envio, WhatsApp, comprovante e encaminhamento à oficina.
- Remover do Painel os estados, cálculos e janelas usados exclusivamente pelo bloco transferido, preservando o restante da tela.
- Validar filtros, ações, visualização no celular e no monitor, além da compilação final.
