# Cliente cadastrado sozinho pelo orçamento

## A ideia
Você tem razão: hoje a vendedora precisa sair do orçamento e ir até a tela de clientes para cadastrar alguém. O caminho com menos atrito é o contrário — ela digita o cliente dentro do próprio orçamento e o sistema guarda o cadastro sozinho.

## Como fica
- Um único campo no topo do orçamento: comece a digitar o nome e aparecem os clientes já existentes. Escolheu um, todos os dados (documento, telefone, e-mail, endereço) vêm preenchidos.
- Nome novo? É só continuar digitando e preencher os campos ali mesmo. Nada de janela extra.
- Ao salvar o orçamento, o cliente é criado ou atualizado automaticamente com o que foi preenchido, e fica ligado a esse orçamento.
- Se ela alterar o telefone ou endereço de um cliente já existente, a ficha dele é atualizada junto.
- O botão "Cadastrar cliente" sai do orçamento. A tela de Clientes continua existindo como consulta e histórico, e o "Novo cliente" de lá permanece para quem quiser cadastrar antes de vender.

## Regra para evitar cadastro duplicado ou vazio
- Só cria ficha quando houver, no mínimo, nome com sobrenome.
- Antes de criar, procura um cliente com o mesmo documento ou o mesmo telefone; se achar, reaproveita em vez de duplicar.

## Detalhes técnicos
- Substituir o `Select` de clientes + link "Cadastrar cliente" em `Configurador.tsx` por um combobox de busca (Command/Popover do shadcn) que aceita valor livre.
- Nova função em `src/lib/gestao.ts`: `sincronizarClienteDoOrcamento(projeto)` — resolve por `cliente_id`, senão por documento/telefone normalizados, senão insere; devolve o `id` para gravar em `projeto.cliente_id`.
- Chamar essa função no salvamento do orçamento (debounce já existente) apenas quando o nome mudar de vazio para válido ou quando os dados do cliente forem editados, evitando escritas a cada tecla.
- Manter os campos de cliente no orçamento como estão (são a fonte do PDF); a ficha em `clientes` passa a ser espelho.

## Verificação
Criar um orçamento com cliente novo, conferir a ficha criada em Clientes; repetir com o mesmo telefone para confirmar que não duplica; editar o endereço e conferir a atualização.
