# Formulários mais compactos e proporcionais em todo o sistema

## Objetivo
Reduzir espaços vazios e deixar o preenchimento mais rápido de ler, fazendo cada campo ocupar uma largura coerente com o conteúdo esperado. No celular, os campos continuam confortáveis e se reorganizam sem apertar textos ou botões.

## 1. Criar um padrão único de tamanhos
- Definir larguras reutilizáveis para campos **curtos**, **médios**, **longos** e **largura total**.
- Campos curtos: número, CEP, UF, dias, porcentagem, quantidade, unidade, datas e medidas.
- Campos médios: CPF/CNPJ, telefone, valores, vendedor, forma de pagamento e seleções semelhantes.
- Campos longos: nome, e-mail, produto, modelo, responsável e nome do orçamento.
- Largura total: rua/endereço, local de instalação, observações, mensagens, descrições e textos extensos.
- Manter altura e área de toque confortáveis; a compactação será principalmente horizontal e nos espaços entre grupos.

## 2. Compactar primeiro o preenchimento do orçamento
- Reorganizar os dados do cliente em linhas naturais: nome com documento e telefone; e-mail com CEP; rua com número; complemento, bairro e cidade/UF.
- Manter rua, local de instalação e campos realmente extensos com mais espaço.
- Deixar prazo, datas, valores e medidas apenas com a largura necessária para suas máscaras.
- Aplicar o mesmo padrão nas peças, automação, motor, serviços, pagamento e ordem de serviço.
- Preservar todas as máscaras, preenchimentos automáticos, avisos e regras atuais.

## 3. Aplicar o padrão aos demais formulários
- Revisar Clientes, Equipe, Empresa, Materiais, Catálogo, Financeiro, Medição, Checklist, Pós-venda e diálogos da oficina.
- Compactar somente formulários e filtros; não alterar cartões, Kanban, tabelas ou regras do sistema.
- Manter observações, contratos, mensagens e descrições em áreas largas ou multilinha.

## 4. Responsividade e validação visual
- Em telas pequenas, permitir que os campos voltem a ocupar a largura disponível quando necessário.
- Em telas maiores, agrupar campos relacionados na mesma linha sem deixá-los excessivamente esticados.
- Conferir orçamento e os principais diálogos em desktop e celular, garantindo que rótulos, mensagens de erro e botões não fiquem cortados ou sobrepostos.
- Validar preenchimento, máscaras e navegação por teclado após a reorganização.

## Detalhes técnicos
- Criar convenções reutilizáveis de largura e grade, evitando ajustes isolados diferentes em cada tela.
- Não alterar o componente base de forma que buscas e campos longos sejam reduzidos globalmente; cada contexto receberá o tamanho semântico apropriado.
- Priorizar mudanças de layout e classes existentes, sem alterar dados, cálculos ou permissões.
