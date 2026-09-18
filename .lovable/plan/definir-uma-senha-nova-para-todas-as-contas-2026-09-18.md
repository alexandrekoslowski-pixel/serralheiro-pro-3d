# Definir uma senha nova para todas as contas

As senhas atuais são guardadas criptografadas e não podem ser lidas. A solução é definir uma senha provisória igual para as cinco contas e informar qual é.

## O que será feito

1. Definir a senha provisória `Kochinski@2026` para:
   - eduardo@kochinski.com (gestor)
   - keisel@kochinski.com (vendedora)
   - daniela@kochinski.com (vendedora)
   - serralheiro@serralheria.com (oficina)
   - teste@serralheria.com (conta de teste)
2. Confirmar a entrada de cada conta na tela de login.
3. Entregar a lista de e-mails e a senha no chat.

## Recomendação

Como a senha é a mesma para todos, peça para cada pessoa trocar a senha depois do primeiro acesso. Se preferir senhas diferentes por pessoa, é só dizer.

## Detalhes técnicos

Alteração via API de administração de autenticação (`auth.admin.updateUserById`) executada por uma função de backend temporária, sem alterar perfis, papéis ou dados existentes.
