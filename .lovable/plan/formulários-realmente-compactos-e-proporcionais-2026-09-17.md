# Formulários realmente compactos e proporcionais

## Objetivo
Fazer os campos ocuparem somente o espaço necessário para o dado permitido, reduzindo deslocamento visual e deixando o preenchimento mais rápido e premium, sem diminuir a área de toque.

## 1. Trocar proporções genéricas por larguras reais
- O padrão atual ainda distribui os campos em frações largas da tela; substituir isso por limites baseados no conteúdo esperado.
- Telefone/WhatsApp: largura aproximada da máscara `(00) 00000-0000`.
- CEP: largura aproximada de `00000-000`.
- CPF/CNPJ: largura suficiente para a maior máscara, sem ocupar uma coluna inteira.
- Número, UF, dias, quantidade, unidade, datas, medidas e valores: larguras próprias e curtas.
- Nome, e-mail, rua, endereço, observações e descrições continuam com espaço maior.

## 2. Melhorar a organização das linhas
- Usar linhas flexíveis que encaixem vários campos curtos lado a lado no desktop, sem criar grandes vazios entre eles.
- Manter a sequência de leitura natural: nome, documento, telefone; e-mail, CEP; rua, número; complemento, bairro e cidade/UF.
- Alinhar os campos pelo topo para que avisos abaixo de CPF ou telefone não desloquem os demais controles.
- Reduzir apenas o espaço horizontal desperdiçado; manter rótulos legíveis, altura confortável e foco evidente.

## 3. Aplicar em todo o sistema
- Ajustar primeiro o orçamento e o cadastro de clientes, onde telefone, CEP e documento aparecem com maior frequência.
- Aplicar o mesmo padrão a Empresa, Equipe, Materiais, Catálogo, Financeiro, Medição, Pós-venda e demais formulários.
- Não compactar buscas, textos longos, observações, endereço, nome de produto ou controles de medidas com botões.

## 4. Comportamento no celular
- No celular, permitir que campos curtos mantenham largura natural quando houver espaço e quebrem de linha sem ficarem espremidos.
- Campos essenciais para digitação longa continuam ocupando a largura disponível.
- Garantir que teclado, máscaras, mensagens de validação e botões não se sobreponham.

## 5. Validação visual
- Conferir o novo orçamento e o cadastro de cliente em desktop e celular.
- Validar telefone, CEP, CPF/CNPJ, número, datas e valores com seus limites reais.
- Revisar alinhamento, leitura, navegação por teclado e ausência de cortes ou sobreposições.

## Detalhes técnicos
- Criar classes reutilizáveis com `width`/`max-width` em unidades coerentes com cada máscara, em vez de depender apenas de colunas de 12 partes.
- Preservar o componente de entrada com largura total dentro de seu contêiner; a largura semântica será definida pelo grupo de cada campo.
- Não alterar máscaras, dados, cálculos, permissões ou fluxos do sistema.
