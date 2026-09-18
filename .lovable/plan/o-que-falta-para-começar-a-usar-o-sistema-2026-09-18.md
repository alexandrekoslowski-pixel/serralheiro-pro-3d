# O que falta para começar a usar o sistema

O sistema já está funcional de ponta a ponta (testamos o fluxo completo: vendedora cria orçamento → aprova → Eduardo mede → serralheiro avança Kanban → entrega → pós-venda → faturamento). Para usar no dia a dia sem risco, faltam três correções pontuais e dois ajustes operacionais.

## Bloqueadores reais para o uso diário

### 1. Eduardo não é avisado quando um orçamento é aprovado
Hoje o sino de "Avisos de medição" e o contador do menu **excluem** as ordens recém-aprovadas (`aguardando_oficina = true`). Como a medição é feita pelo Eduardo logo após a aprovação, ele não recebe o aviso e a medição pode ficar esquecida.

- **Correção:** o sino e o badge passam a contar **todas** as ordens em `etapa = medicao` (sem o filtro de `aguardando_oficina`). O Eduardo vê a ordem assim que ela é aprovada.
- Arquivos: `src/components/AvisosMedicao.tsx`, `src/pages/AppLayout.tsx`.

### 2. Salvar orçamento pode falhar sem aviso (perda silenciosa)
`salvarProjeto` só registra o erro no console; se a gravação na nuvem falhar (rede, permissão), a vendedora acha que salvou e perde o trabalho ao recarregar.

- **Correção:** emitir um `toast.error` visível quando o upsert de `projetos` ou `pagamentos` falhar, e sinalizar falha de sincronização no rodapé.
- Arquivo: `src/lib/storage.ts` (funções `salvarProjeto`, `deletarProjeto`, `salvarEmpresa`, `salvarCatalogo` e gravação de pagamentos).

### 3. Campo "vendedor(a)" fica em branco em orçamentos antigos
Orçamentos salvos com nomes de vendedores que não estão mais no menu Equipe abrem com o campo de responsável em branco, levando a reatribuição por engano.

- **Correção:** o `Select` do responsável mostra o valor salvo mesmo quando ele não está na lista atual (item extra "outro"), e oferece trocar por um membro cadastrado.
- Arquivos: `src/hooks/useVendedores.ts`, `src/pages/Configurador.tsx`.

## Ajustes operacionais (não travam o início)

- **Convite de equipe por e-mail** — hoje o gestor cola o identificador do usuário. Funciona, mas é atrito. Fica como melhoria após o início.
- **Envio automático do WhatsApp** — bloqueado até ter a conta/API oficial do WhatsApp Business. O envio manual (abrir o WhatsApp com a mensagem e o link do PDF) já funciona hoje.

## Ordem de execução

1. Corrigir o sino/badge de medição (item 1) — é o que mais impacta o fluxo de aprovação → medição.
2. Tratamento de erro visível ao salvar (item 2).
3. Responsável em branco em orçamentos antigos (item 3).
4. Validar o fluxo completo novamente (criar → aprovar → Eduardo vê o aviso → medir → serralheiro → entrega).
