# Sistema de gestão da serralheria — do cliente ao pós-venda

O app hoje termina no orçamento e no kanban da oficina. A ideia é transformá-lo no sistema completo: o cliente nasce uma vez, vira briefing, orçamento, ordem de serviço, medição, materiais, produção, entrega e pós-venda — sem redigitar nada.

## O que muda para você

**1. Clientes de verdade**
Ficha própria com nome/razão social, CPF/CNPJ, e-mail, telefone, WhatsApp, endereço, bairro, cidade e origem (WhatsApp, presencial, indicação, Instagram, site, outro). Os clientes que hoje estão dentro dos orçamentos viram fichas automaticamente, já ligados ao histórico deles.

**2. Briefing com perguntas que se abrem**
Depois dos dados básicos, a vendedora responde um checklist por tipo de serviço (portão, porta, grade, corrimão, estrutura, outro). As perguntas seguintes só aparecem conforme a resposta: portão social, fechamento, maçaneta, abertura, motor, automação (marca, modelo, alimentação, controle).

**3. Catálogo de serviços e materiais**
Cada serviço tem seus próprios campos configuráveis (medidas, fechamento, maçaneta, motor, pintura, acabamento). Cadastro de materiais com custo e fornecedor, usado depois na compra e no comparativo estimado × realizado.

**4. Perfis com login**
Gestor, vendedora e serralheiro entram com a própria conta. Vendedora não vê custo, margem nem indicadores. Serralheiro vê só as OS dele, em tela simples de celular: iniciar etapa, finalizar, foto, observação. A tela de TV da oficina continua aberta.

**5. Orçamento e aprovação**
Orçamento com serviços, materiais, instalação, frete e outros custos; o sistema mostra custo estimado, preço, margem e valor final. PDF com empresa, cliente, serviço, valores e condições, mensagem pronta para WhatsApp. Registro de aprovado/recusado/aguardando, data, quem aprovou e observação. Aprovou, nasce a OS com tudo congelado; qualquer alteração posterior fica registrada no histórico.

**6. Medição pelo celular**
A equipe abre a OS, tira a foto e desenha em cima: setas horizontais/verticais, linhas, textos e medidas. Salva a foto anotada junto com largura, altura, profundidade, vãos, nível e observações.

**7. Materiais**
Lista com status (comprado, comprar, faltando) e, no fim, o que foi realmente usado — para comparar planejado × utilizado.

**8. Liberação e Kanban**
A OS só entra na produção com orçamento aprovado, medição feita, material disponível, prazo e equipe definidos. Kanban: Bloqueado · Esperando · Montagem · Acabamento · Pintura · Entrega · Pós-venda · Concluído. Cartão com cliente, serviço, prazo, prioridade, valor, responsável, % concluído e aviso de atraso/material pendente.

**9. Prioridade calculada**
Nota automática somando prazo próximo, atraso, valor do contrato, cliente estratégico, complexidade e data prometida — resultando em Crítica, Alta, Normal ou Baixa. O gestor pode fixar a prioridade na mão.

**10. Cronograma e calendário**
Cada OS tem seu cronograma (medição, material, montagem, acabamento, pintura, entrega, pós-venda) com previsto × realizado. O calendário do painel mostra as entregas com data, horário, endereço, cliente, responsável, equipe, veículo, duração e prioridade, e avisa quando há conflito de agenda no mesmo dia/horário.

**11. Entrega e pós-venda**
Entrega com responsável, veículo, data, horário, endereço e foto da instalação finalizada obrigatória. Depois, checklist de pós-venda: instalação ok, satisfação, problema? Se houver, abre ocorrência com solução, responsável e data de resolução.

**12. Painel do gestor**
Contadores por etapa (orçamentos em aberto, aprovadas, produção, acabamento, pintura, prontas, em entrega, pós-venda, atrasadas), financeiro (orçado, aprovado, efetivado, ticket médio, custos estimados, margem), meta semanal de R$ 40.000 com barra de progresso e capacidade produtiva da equipe comparada à carga vendida das próximas semanas.

## Detalhes técnicos

Banco (Lovable Cloud, RLS por dono + papel, GRANTs em todas as tabelas novas):
- `clientes`, `briefings` (respostas em JSON conforme o modelo de perguntas), `servicos_catalogo`, `materiais`
- `user_roles` + enum `app_role` (gestor, vendedora, serralheiro) em tabela separada, com função `has_role` security definer; RLS passa a usar papel além de `user_id`
- `orcamentos` (evolução de `projetos`, com `cliente_id`, `briefing_id`, status de aprovação, custos e margem), `ordens` (snapshot congelado + histórico de alterações)
- `medicoes` (fotos + anotações), `os_materiais` (planejado/comprado/usado), `os_cronograma` (etapa, responsável, previsto, realizado), `entregas`, `pos_venda`, `ocorrencias`
- Buckets de storage para fotos de medição, produção e entrega
- Backfill: cria `clientes` a partir dos campos `cliente_*` dos projetos existentes e liga cada projeto ao seu cliente

Front-end:
- Novas rotas em `/app`: `clientes`, `clientes/:id`, `catalogo`, `materiais`, `orcamentos`, `os/:id`, `os/:id/medicao`, `entregas`, `pos-venda`, `equipe`
- Rota de celular do serralheiro: `/oficina/minhas-os`
- Medição: câmera nativa via `input capture` + editor em canvas com setas, linhas, texto e cotas
- Prioridade em util única (`prioridade.ts`), reaproveitada por painel, kanban e calendário
- `storage.ts` deixa de ser a única camada: passa a consultas por entidade, mantendo o Configurador funcionando
- Menu e telas filtrados por papel

## Ordem de execução

1. Fundação: clientes (com conversão dos existentes), briefing condicional, catálogo de serviços, materiais, papéis e permissões
2. Comercial: orçamento com custos/margem, aprovação, PDF e histórico
3. OS: geração automática, cronograma, responsáveis, status e prioridade
4. Medição no celular com fotos anotadas
5. Materiais: planejado, compras, recebido, usado, estimado × realizado
6. Produção: kanban com Bloqueado/Concluído, início/fim, fotos e observações
7. Gestão: painel, calendário com conflitos, capacidade, meta semanal, indicadores
8. Pós-venda: checklist, fotos finais, avaliação, ocorrências, histórico do cliente
