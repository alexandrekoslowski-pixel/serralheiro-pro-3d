# Liberar acesso por e-mail, sem mostrar códigos internos

Hoje, para liberar o acesso de uma pessoa, o gestor precisa colar um "identificador da conta" (um código enorme) e esse mesmo código aparece embaixo do nome de cada pessoa na lista da Equipe. Isso não diz nada para quem usa o sistema e polui a tela.

## Como fica

**Tela Equipe e acessos**
- Liberar acesso passa a pedir apenas: **nome**, **e-mail da pessoa** e **papel** (gestor, vendedora, serralheiro).
- O sistema encontra a conta pelo e-mail. Se a pessoa ainda não criou a conta dela na tela de entrada, aparece um aviso claro: "Essa pessoa ainda não criou a conta. Peça para ela entrar com e-mail e senha e tente de novo."
- Na lista, cada pessoa mostra **nome, e-mail e papel**. O código da conta some da tela (continua existindo por dentro, só não é exibido).
- O texto de ajuda é reescrito: some a instrução de "copiar o identificador".

**Outros pontos revisados**
- **Configurações → Tela da oficina**: o endereço da TV contém um código na URL, mas ele é o próprio link de acesso — fica como está, apenas com o texto reforçando que é um link para abrir na TV.
- Demais códigos visíveis no sistema (código de perfil, código do fornecedor, código do material) são informação real de trabalho e permanecem.
- Nenhum outro lugar exibe identificador de conta.

## Detalhes técnicos

1. Migration:
   - Adicionar coluna `email` em `public.profiles`, preenchida pelo trigger `handle_new_user` e retroalimentada com os usuários já existentes.
   - Criar função security definer `public.usuario_por_email(_email text) returns uuid` (busca em `public.profiles`, case-insensitive), executável por `authenticated`.
   - Criar função security definer `public.equipe_detalhada()` (ou ampliar a leitura atual) devolvendo `id, user_id, nome, role, email` apenas para a equipe do dono atual, para a lista mostrar o e-mail.
2. `src/lib/gestao.ts`: `definirPapel` passa a aceitar `email` e resolver o `user_id` via RPC; `listarEquipe` passa a trazer `email`.
3. `src/pages/Equipe.tsx`: campo de e-mail no diálogo "Liberar acesso", mensagens de erro específicas, e a lista exibindo e-mail no lugar do `user_id` (o `user_id` continua em memória para marcar "(você)" e bloquear a auto-remoção).
