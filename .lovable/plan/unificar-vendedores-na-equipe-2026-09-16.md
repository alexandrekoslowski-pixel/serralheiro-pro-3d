# Unificar vendedores na Equipe

## Objetivo
Manter a Equipe como único cadastro de vendedores e garantir que uma troca de nome apareça em todo o sistema.

## Alterações
- Remover de Empresa a seção duplicada “Equipe de vendas”.
- Ao editar alguém em Equipe, atualizar o nome do acesso e os orçamentos já vinculados ao nome anterior.
- Fazer as listas de vendedores usarem somente gestores e vendedoras da Equipe, sem reapresentar nomes antigos salvos em Empresa ou orçamentos.
- Atualizar imediatamente o nome exibido para quem está logado e os filtros/telas dependentes.

## Verificação
- Confirmar edição de nome, atualização dos orçamentos existentes, filtros e identificação do usuário.
- Validar a tela Empresa sem o cadastro duplicado e conferir a versão desktop.

## Detalhes técnicos
- A atualização será atômica no banco para evitar salvar o novo nome apenas em parte dos registros.
- O vínculo histórico continuará interno; a interface mostrará apenas o nome atual da pessoa.
