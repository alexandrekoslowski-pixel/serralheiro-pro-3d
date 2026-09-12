# Progresso do orçamento até a ordem na oficina

## Objetivo
Dar à vendedora uma visão clara de em que ponto cada orçamento está e o que falta fazer agora, sem precisar abrir um por um.

## 1. Trilha de etapas em cada orçamento
Cinco marcos, sempre na mesma ordem, com feito / pendente / atrasado:

```text
Orçamento criado  ->  Enviado ao cliente  ->  Retorno em 3 dias  ->  Aprovado com comprovante  ->  Na fila da oficina
```

Regras:
- **Enviado**: marcado quando a vendedora usa "Marcar como enviado ao cliente". Sem isso, fica pendente.
- **Retorno**: só aparece depois do envio; vira atrasado ao passar de 3 dias sem retorno registrado. Some se o orçamento for aprovado antes.
- **Comprovante**: depois de aprovado, fica pendente enquanto não houver comprovante anexado a nenhum pagamento da ordem.
- **Na fila**: cumprido quando a ordem já está na oficina (etapa fila ou adiante).

A trilha aparece no cartão de cada orçamento na lista, no topo da tela do orçamento e, resumida, no painel.

## 2. "O que falta fazer" no painel da vendedora
Bloco no topo do painel, só com o que exige ação, agrupado por tipo e ordenado pelo mais antigo:
- Orçamentos prontos mas ainda não enviados
- Retorno de 3 dias vencido (botão do WhatsApp já na linha)
- Aprovados sem comprovante (botão para anexar ali mesmo)
- Aprovados que ainda não foram para a oficina

Cada linha mostra cliente, valor, há quantos dias está parado e o botão da ação. Resolveu, sai da lista.
Contadores por tipo ficam visíveis para bater o olho; clicar num contador filtra a lista.

## 3. Filtros e ordenação na lista de orçamentos
- Filtros rápidos: Não enviados · Aguardando cliente · Retorno vencido · Sem comprovante · Fora da oficina.
- Ordenar por "parado há mais tempo" além da data.
- Busca continua funcionando junto com os filtros.

## 4. Menos atrito nas ações
- Botões de ação diretos no cartão: marcar como enviado, mandar retorno no WhatsApp, anexar comprovante, mandar para a oficina — sem abrir o orçamento.
- Confirmação leve por aviso de sucesso, sem janelas extras.
- Cada ação atualiza a trilha na hora.

## 5. Permissões
- Vendedora e gestor veem tudo isso; o gestor pode filtrar por vendedor como já faz hoje.
- Nada disso aparece para o serralheiro (sem valores, sem comprovantes).

## 6. Verificação
- Orçamento novo, enviado, com 3 dias vencidos, aprovado sem comprovante, aprovado com comprovante e já na oficina — conferir a trilha e a lista de pendências em cada caso.
- Conferir no celular e no monitor largo.

## Detalhes técnicos
- Usa os campos já existentes: `enviado_em`, `followup_status`/`followup_em`, comprovante em `pagamentos`, `status` e `etapa` em `projetos`. Sem migração de banco.
- Novo módulo `src/lib/progressoOrcamento.ts` com o cálculo dos marcos e das pendências, reutilizado por painel, lista e configurador.
- Novo componente de trilha (`src/components/TrilhaOrcamento.tsx`) em duas densidades: compacta (cartão) e completa (topo do orçamento).
- Presença de comprovante vem de uma consulta única dos pagamentos por ordem, em lote, para não disparar uma chamada por cartão.
