# Responsáveis por etapa e fotos na ordem de serviço

Cada etapa da oficina passa a ter um responsável registrado e um espaço para fotos, incluindo a medição e a finalização/instalação.

## 1. Responsável por etapa

No cartão do kanban e dentro da ordem, cada etapa ganha o seu responsável:

- **Montagem** — pessoa da equipe (escolhida na lista de funcionários).
- **Pintura** — empresa responsável (lista de empresas parceiras, editável nas configurações).
- **Acabamento** — pessoa da equipe.
- **Entrega / instalação** — pessoa da equipe + endereço da obra (vem do cadastro do cliente, pode ser ajustado).

Regras:
- O cartão mostra o nome de quem está responsável pela etapa atual.
- Quem move o cartão pode escolher o responsável na hora; se já houver um, ele fica preenchido.
- No histórico da ordem fica registrado quem respondeu por cada etapa e quando.

## 2. Fotos anexadas

Nova aba "Fotos" dentro da ordem, e botão "Adicionar foto" direto no cartão do kanban.

- Cada foto guarda: etapa (medição, montagem, pintura, acabamento, entrega/instalação), quem enviou, data e uma observação curta.
- Envio pela câmera do celular ou da galeria; várias fotos por etapa.
- Miniaturas na ordem; clicar amplia. Quem enviou pode excluir; o gestor pode excluir qualquer uma.
- **Medição**: seção própria de fotos na etapa de medição, para quem vai tirar as medidas subir as fotos do local.
- **Instalação**: ao mover a ordem para "Pronto"/entrega, o sistema pede a foto da instalação (aviso claro, mas sem travar caso não haja sinal).

## 3. O que cada perfil vê

- Serralheiro/instalador: vê e envia fotos, escolhe responsável das etapas — continua sem ver valores.
- Gestor e vendedoras: veem tudo, incluindo o histórico de responsáveis e todas as fotos.

## 4. Detalhes técnicos

- Nova tabela `ordem_etapas`: `projeto_id`, `etapa`, `responsavel_id` (equipe) ou `responsavel_nome` (empresa de pintura / terceiro), `iniciada_em`, `concluida_em`, `observacao` — com GRANTs e RLS por serralheria (mesmo padrão de `projetos`).
- Nova tabela `ordem_fotos`: `projeto_id`, `etapa`, `caminho` (arquivo no armazenamento), `enviado_por`, `observacao`, `created_at` — GRANTs + RLS iguais.
- Novo bucket privado `ordem-fotos` com políticas em `storage.objects` restritas à serralheria; leitura via URL assinada. Upload comprime a imagem no navegador antes de enviar.
- Lista de empresas de pintura guardada em `empresa.dados` (junto com vendedoras) e editável em Configurações.
- `mover_etapa_oficina` passa a aceitar o responsável e a fechar/abrir o registro em `ordem_etapas`; `ordens_oficina` devolve responsável atual e contagem de fotos (sem nenhum valor financeiro).
- Telas afetadas: `MinhasOrdens.tsx`, `KanbanOficina.tsx`, `ModoOficina.tsx` (OS), `Configurador.tsx` (aba Ordem de serviço), `Configuracoes.tsx`.

## Ordem de execução
1. Tabelas, bucket e regras de acesso.
2. Envio e listagem de fotos por etapa (medição inclusive).
3. Responsáveis por etapa no kanban e na ordem.
4. Pedido de foto na entrega/instalação e empresas de pintura nas configurações.
