# Só orçamento e ordem de serviço

Some a palavra "projeto" de todo o sistema. Cada trabalho passa a ter apenas dois nomes, conforme o momento em que está:

- **Orçamento** — enquanto ainda não foi aprovado pelo cliente.
- **Ordem de serviço (OS)** — depois de aprovado, quando vai para a oficina.

## O que muda na tela

| Onde | Hoje | Fica |
| --- | --- | --- |
| Menu lateral | Orçamentos (já ok) | Orçamentos |
| Lista | "Meus projetos", "Novo projeto", "Nome do projeto" | "Orçamentos", "Novo orçamento", "Nome do orçamento" |
| Lista vazia | "Nenhum projeto ainda" | "Nenhum orçamento ainda" |
| Avisos | "Projeto duplicado", "Projeto excluído", "Excluir projeto?" | "Orçamento duplicado / excluído / Excluir orçamento?" |
| Busca no painel | "Buscar por projeto ou cliente" | "Buscar por orçamento ou cliente" |
| Aviso de dados antigos | "projeto(s) antigos salvos neste aparelho" | "orçamento(s) antigos..." |
| Configurador, atendimento, financeiro, cliente, calendário, oficina | textos com "projeto" | "orçamento" antes de aprovar, "ordem de serviço" depois |
| Nome padrão de um novo registro | "Novo projeto" | "Novo orçamento" |

Nas telas da oficina (quadro do serralheiro e ficha técnica) o termo usado é sempre **ordem de serviço**, já que ali tudo já foi aprovado.

## Regra de linguagem

Antes de aprovar: orçamento. Depois de aprovar: ordem de serviço. Onde o texto serve para os dois momentos (por exemplo o cabeçalho do painel), usar "ordens".

## Detalhes técnicos

- Alteração apenas de textos visíveis nas páginas: `ProjetosLista`, `Painel`, `Configurador`, `ModoAtendimento`, `ModoOficina`, `MinhasOrdens`, `KanbanOficina`, `Financeiro`, `ClienteDetalhe`, `AppLayout`, `CalendarioEntregas`, `Landing`.
- Nomes internos de código, rotas (`/app/projetos`, `/app/projeto/:id`) e tabelas do banco permanecem como estão — trocar isso quebraria links salvos e dados existentes sem ganho visível.
- Nenhuma mudança de regra de negócio, cálculo ou permissão.
