# Definir a senha de acesso da Keilen

A senha atual não pode ser consultada por ninguém (fica guardada embaralhada). A solução é gravar uma nova.

## O que vai ser feito

- Conta: **keilen@kochinski.com** (vendedora)
- Nova senha: **Teste1234**
- A conta continua com o mesmo papel e os mesmos dados; muda só a senha.

Depois de aprovado, ela entra pela tela de entrada com esse e-mail e essa senha. Recomendo trocar por uma senha pessoal depois do primeiro acesso.

## Detalhes técnicos

- Atualizar a senha do usuário correspondente em `auth.users` via Admin API do backend (Lovable Cloud), garantindo o e-mail confirmado.
- Nenhuma alteração de código, tabelas ou políticas.
