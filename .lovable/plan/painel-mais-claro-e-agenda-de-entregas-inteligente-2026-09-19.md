# Painel mais claro e agenda de entregas inteligente

## O que está acontecendo hoje (confirmado)

- Os cards do painel têm uma barrinha colorida no topo (vermelha/amarela/verde) sem nenhuma legenda: a cor sozinha não explica nada.
- As datas de entrega se acumulam: hoje há **5 ordens marcadas para 30/09** e **2 para 09/09**, sem nenhum aviso.
- Os valores do painel já usam a mesma conta do orçamento (peças + serviços + frete) e do recebido/em aberto. Vou revalidar ordem por ordem e corrigir qualquer divergência que aparecer.

## 1. Painel mais legível

- Trocar a barrinha colorida por uma **etiqueta escrita** no card: "Atrasada 3 dias", "Vence hoje", "Faltam 2 dias", "Folga de 12 dias", "Sem prazo". A cor continua, mas sempre acompanhada do texto.
- Tirar a frase genérica "Vermelho é urgente, amarelo merece atenção, verde tem folga" do topo — vira desnecessária.
- Conferir os números dos cards do topo (Orçado, Aprovado, A cobrar, Recebido, Ticket médio, A receber) contra os orçamentos reais e ajustar o que não bater.

## 2. Aviso de entregas no mesmo dia

- Novo bloco no painel do Eduardo: **"Entregas concentradas"**, listando cada data que tem mais entregas do que a oficina aguenta, com as ordens envolvidas.
- Cada ordem do bloco abre direto, e traz o botão "Remarcar para <nova data>".
- O mesmo alerta aparece no calendário de entregas: o dia sobrecarregado fica marcado.

## 3. Cronograma inteligente

Regras de agenda:

- Capacidade de entregas por dia definida em **Empresa > Configurações** (começa em 2).
- Oficina entrega de **segunda a sábado**; domingo nunca recebe entrega.
- Ao aprovar um orçamento, em vez de somar direto o prazo padrão, o sistema calcula a data pelo prazo padrão e depois **empurra para o próximo dia útil com vaga**.
- Quando uma data escolhida à mão estoura a capacidade, o sistema **sugere** a data livre mais próxima; o Eduardo confirma com um clique (nunca remarca sozinho).
- A sugestão respeita a ordem de chegada: quem aprovou antes mantém o dia, quem chegou depois é deslocado.

## Detalhes técnicos

- Novo `src/lib/agenda.ts`: `entregasPorDia()`, `diaUtil()`, `proximaDataLivre(base, capacidade, ocupacao)`, `datasSobrecarregadas()`.
- `DadosEmpresa` ganha `entregasPorDia: number` (padrão 2) e `entregaSabado: boolean` (padrão true), persistidos no JSON `dados` da tabela `empresa` — sem migração de banco.
- `Painel.tsx`: etiqueta textual no lugar/junto da faixa, bloco "Entregas concentradas", botão de remarcar com `salvarProjeto`.
- `CalendarioEntregas.tsx`: destaque do dia sobrecarregado.
- `Configuracoes.tsx`: campos de capacidade e de entrega no sábado.
- Aprovação (`Painel.tsx` e `Configurador.tsx`) passa a usar `proximaDataLivre` no lugar de `somarDias`.
- Auditoria dos valores: conferir `totalComServicos`, `valorACobrar`, `recebidoDe` e `saldoDe` contra as ordens reais do banco e corrigir divergências.
