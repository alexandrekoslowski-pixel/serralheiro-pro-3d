# Roadmap — sistema de gestão da serralheria

## Concluído
- Criação rápida: Novo orçamento abre diretamente no preenchimento, sem janela intermediária
- Fase 1 base: clientes, briefing, catálogo de serviços, materiais, equipe/papéis (gestor, vendedora, serralheiro)
- Rotas e menu por papel; vendedora não vê Financeiro/Materiais/Serviços/Equipe
- Orçamento ligado a uma ficha de cliente (cliente_id) com preenchimento automático
- Catálogo técnico preparado para 366 itens dos fornecedores, com código, medidas, unidades e histórico de preços
- Catálogo com 29 cores Kochinski integrado ao orçamento, PDF, ordem e visualização 3D

## Em aberto
- [x] Compactar formulários pela largura real das máscaras, mantendo endereço e textos longos amplos
- Convite de equipe por e-mail (hoje o gestor cola o identificador do usuário)
- Login para o serralheiro e reconciliação com a tela pública de oficina (TV)
- Ocultar custos/margem para vendedora dentro do orçamento
- Fases seguintes: OS congelada, medição com fotos, materiais planejados x usados, novo kanban, entrega e pós-venda, metas do painel
- [x] Checklist técnico obrigatório e condicional no orçamento
- [x] Validação antes de aprovar e envio das respostas para oficina/PDFs
- [x] Checklist técnico por peça refletido nos movimentos, folhas, preenchimentos, motores e acessórios do desenho 3D
- [x] Revisar e padronizar máscaras, limites e validações em todos os campos editáveis
- [x] CEP automático no cadastro e orçamento
- [x] Marcação de envio e retorno manual de WhatsApp após 3 dias
- [ ] Envio automático oficial no WhatsApp (bloqueado: falta conta/API oficial do WhatsApp Business)
- [x] Contrato de prestação de serviço sem materiais
- [x] Comprovante de pagamento e aviso de entrada pendente
- [x] Corrigir sobreposição do menu principal e da barra de ações do orçamento em todos os tamanhos de tela
- [x] Meta semanal de faturamento no painel do gestor (editável nas Configurações)
- [x] Medição com foto anotada (cotas, linhas e textos) salva na ordem e visível na OS da oficina
- [x] Checklist de pós-venda com ocorrências; card só vai para Pronto sem pendências
- [x] Trilha de progresso do orçamento (enviado, retorno, comprovante, oficina) e lista "o que falta fazer"
- [x] Link curto do PDF do orçamento (/o/<código>) — cliente baixa sem ver a URL assinada enorme
- [x] Remover lista de materiais do PDF do orçamento (cliente vê só peças, serviços, frete e total)
- [x] Mover o menu principal para uma barra lateral compacta e liberar mais largura para as telas operacionais
- [x] Unificar vendedores no menu Equipe e refletir alterações de nome nos orçamentos e filtros
- [x] Reorganizar o orçamento e congelar o total no rodapé do desktop, mantendo Materiais no local original
- [x] Garantir que a consultora de um novo orçamento seja sempre a vendedora logada, sem reaproveitar o nome da sessão anterior
