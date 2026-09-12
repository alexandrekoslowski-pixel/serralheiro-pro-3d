# Passo a passo do orçamento para a vendedora

## Objetivo
Deixar a barra de ações do orçamento em ordem cronológica, mostrando o que já foi feito e qual é o próximo passo, sem travar nada.

## A ordem dos passos
```text
1 Baixar orçamento  ->  2 Marcar como enviado  ->  3 Aprovar  ->  4 Gerar contrato  ->  5 Anexar comprovante  ->  6 Mandar para a oficina
```

Cada passo vira um botão numerado, sempre na mesma posição. O próximo passo fica destacado em laranja; os já feitos ficam discretos com um "visto" e a data.

## Como cada botão se comporta
- **1 Baixar orçamento** — gera o PDF. Depois de gerado fica marcado "gerado em dd/mm"; continua clicável e passa a dizer "Baixar de novo".
- **2 Marcar como enviado** — registra a data de envio e inicia a contagem do retorno de 3 dias. Depois fica marcado e permite registrar novo envio.
- **3 Aprovar** — muda o orçamento para aprovado (hoje esse botão já aprova e manda para a oficina de uma vez; passa a só aprovar).
- **4 Gerar contrato** — só destaca depois da aprovação, mas continua disponível antes. Marca "gerado em dd/mm" e permite gerar de novo.
- **5 Anexar comprovante** — abre o anexo do pagamento direto daqui. Nunca bloqueia: se faltar, fica só como aviso "falta comprovante".
- **6 Mandar para a oficina** — coloca a ordem na fila. Único bloqueio que continua: checklist do pedido incompleto (leva para a aba do checklist).

Ações que não fazem parte do fluxo (duplicar, atendimento, imprimir OS, modo TV, salvar) continuam em "Mais ações".

## Onde aparece
- Tela do orçamento: barra de passos logo abaixo da trilha, quebrando em duas linhas no celular.
- Lista de orçamentos: o cartão passa a mostrar o mesmo "próximo passo" com o botão correspondente, usando a mesma ordem.

## Detalhes técnicos
- Duas novas marcas de data guardadas no JSON já existente da ordem (`dados`): `orcamento_pdf_em` e `contrato_pdf_em`. Sem migração de banco.
- Nova função em `src/lib/progressoOrcamento.ts` devolvendo o passo atual (`proximoPasso`) a partir de status, `enviado_em`, marcas de PDF, comprovantes e `etapa`.
- Novo componente `src/components/PassosOrcamento.tsx` renderizando os seis botões com estado feito/atual/futuro; usado em `Configurador.tsx` e, em versão compacta, em `ProjetosLista.tsx`.
- `aprovarParaOficina` em `Configurador.tsx` é dividido em `aprovar()` e `mandarParaOficina()`; a validação do checklist passa para o envio à oficina.
- Comprovante reaproveita `DialogOrdemFinanceiro` e `src/lib/comprovantes.ts`.

## Verificação
Percorrer um orçamento novo do passo 1 ao 6 conferindo marcação, regeração dos PDFs, aprovação sem comprovante e bloqueio apenas por checklist; conferir no celular.
