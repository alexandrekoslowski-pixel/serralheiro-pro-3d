# Acesso do serralheiro

Hoje o sistema já tem os três papéis (gestor, vendedora, serralheiro), mas quem entra como serralheiro fica com o menu vazio: não existe nenhuma tela pensada para ele. O plano cria a conta de teste e a área própria dele.

## Conta de teste

- Usuário: `serralheiro@serralheria.com` / senha `serralheiro123`, e-mail já confirmado.
- Vinculado à mesma serralheria da conta de teste do gestor (`teste@serralheria.com`), com o papel serralheiro.

## O que o serralheiro vê ao entrar

Ao fazer login, ele cai direto na tela "Minhas ordens" (`/app/oficina`) — nunca no painel do gestor.

- **Minhas ordens**: as ordens já aprovadas, organizadas nas mesmas etapas da oficina (Fila · Produção · Pintura · Acabamento · Pós-venda · Pronto), com nome da peça, cliente, prazo e a cor de urgência (vermelho/amarelo/verde).
- **Botão para avançar a etapa** direto no cartão.
- **Abrir a OS** de cada ordem: medidas, folgas, plano de corte, materiais e sequência de montagem — a mesma ficha técnica que já existe hoje.
- Menu enxuto: apenas "Minhas ordens" e sair.

## O que ele não vê

- Nenhum valor: preço, total, faturado, pagamentos, custo de material ou margem.
- Nada de Financeiro, Clientes, Orçamentos, Serviços, Materiais, Equipe, Empresa e Calendário — se digitar o endereço, é redirecionado para "Minhas ordens".
- A ficha de OS já é livre de valores; será revisada para garantir isso quando aberta por ele.

## Detalhes técnicos

- Criar o usuário de auth e a linha em `user_roles` (`role = 'serralheiro'`, `dono_id` = conta do gestor de teste).
- `AppLayout`: incluir item de menu para serralheiro; `Painel`, `Financeiro`, `Clientes`, `Catalogo`, `Materiais`, `Equipe`, `Configuracoes` e `Calendario` passam a redirecionar quando `papel === "serralheiro"`.
- Nova página `src/pages/MinhasOrdens.tsx` reutilizando a lógica de etapas/urgência já existente (`ordens.ts`, `prioridade.ts`), lendo `projetos` com sessão autenticada e chamando a mudança de etapa; rota `/app/oficina` e redirecionamento pós-login por papel.
- Reforço no banco: políticas para que o serralheiro não leia `pagamentos`, `material_precos`, `material_importacoes` nem os campos de preço do catálogo — verificar as políticas atuais e ajustar as que hoje se apoiam apenas em `dono_atual`. Os valores em `projetos` seguem no JSONB; a proteção é na interface, e será registrado como limitação conhecida.
