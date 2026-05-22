# Cliente Específico

## Visão Geral

Página de visualização detalhada de um cliente. Permite consultar dados cadastrais, métricas de relacionamento, pedidos, tickets e histórico de atividades, além de editar ou remover o contato.

**Rota:** `/contacts/:id`  
**Arquivo:** `src/Pages/ContactDetail/ContactDetail.tsx`

---

## Componentes utilizados

| Componente | Arquivo | Descrição |
|---|---|---|
| `ContactDetail` | `ContactDetail.tsx` | Página principal de detalhamento do cliente |
| `ContactIdentityCard` | `ContactDetail.tsx` | Card com nome, email e retorno para a lista de contatos |
| `ContactInfoCard` | `ContactDetail.tsx` | Exibe informações cadastrais e permite abrir a edição |
| `ContactSummaryCard` | `ContactDetail.tsx` | Exibe resumo financeiro e de satisfação com acesso à V.IA |
| `ContactMetricsCard` | `ContactDetail.tsx` | Exibe métricas do cliente por período |
| `ContactOrdersCard` | `ContactDetail.tsx` | Lista os pedidos relacionados ao cliente |
| `ContactTicketsCard` | `ContactDetail.tsx` | Lista os tickets relacionados ao cliente |
| `EditContactModal` | `ContactDetail.tsx` | Modal utilizado para editar ou remover o cliente |
| `DeleteConfirmationModal` | `ContactDetail.tsx` | Confirmação antes da remoção do cliente |
| `CustomScrollArea` | `components/atoms/CustomScrollArea` | Área com scroll utilizada no histórico de atividades |
| `ClientStatusBadge` | `components/molecules/ContactsTable/ClientStatusBadge` | Badge visual do status do cliente |

---

## Chamadas de API

| Método | Endpoint / Função | Quando |
|---|---|---|
| `GET` | `/api/contact-details/{contactId}/details` | Ao carregar os dados principais do cliente |
| `GET` | `/api/contact-details/{contactId}/dashboard?period=all_time&page=1&pageSize=5` | Ao carregar resumo, pedidos e tickets históricos |
| `GET` | `/api/contact-details/{contactId}/dashboard?period={period}&page=1&pageSize=5` | Ao carregar ou atualizar as métricas do período selecionado |
| `PATCH` | `/api/contact-details/{contactId}/details` | Ao confirmar a edição dos dados do cliente |
| `DELETE` | `/api/contact-details/{contactId}/details` | Ao confirmar a remoção do cliente |
| `GET` | `fetchContactActivities(contactId)` | Ao carregar ou atualizar o histórico de alterações do cliente |

> A rota exata utilizada por `fetchContactActivities` depende do arquivo `lib/api/contacts`, que não está incluído nesta documentação.

---

## Estados gerenciados (`ContactDetail`)

| Estado | Tipo | Descrição |
|---|---|---|
| `details` | `ContactDetails \| null` | Dados principais do cliente |
| `summaryMetrics` | `ContactMetrics \| null` | Métricas históricas utilizadas no resumo e nas informações importantes |
| `dashboardMetrics` | `ContactMetrics \| null` | Métricas do período selecionado |
| `orders` | `ContactOrdersPage \| null` | Pedidos relacionados ao cliente |
| `tickets` | `ContactTicketsPage \| null` | Tickets relacionados ao cliente |
| `loading` | `boolean` | Controla o carregamento inicial da página |
| `historyLoading` | `boolean` | Controla o carregamento do histórico de pedidos e tickets |
| `dashboardLoading` | `boolean` | Controla o carregamento das métricas por período |
| `error` | `boolean` | Indica falha ao carregar o contato |
| `tab` | `"informacoes" \| "atividades"` | Aba atualmente selecionada |
| `selectedPeriod` | `ContactPeriod` | Período aplicado às métricas do contato |
| `activities` | `ContactActivity[]` | Histórico de alterações realizadas no cliente |
| `dashboardCache` | `Partial<Record<ContactPeriod, ContactDashboard>>` | Cache local das métricas já consultadas por período |

---

## Dados do cliente

A seção de informações importantes apresenta os principais dados cadastrais do contato.

| Informação exibida |
|---|
| ID do cliente |
| Email |
| Número de telefone |
| Status |
| Gênero |
| Data de nascimento |
| Idade |
| Data de cadastro |
| Origem |
| País |
| Estado |
| Região |
| Cidade |

A área também apresenta informações relacionadas à satisfação do cliente, utilizando a classificação de NPS quando disponível:

| Categoria NPS | Representação |
|---|---|
| `Promotor` | Indicador positivo |
| `Neutro` | Indicador intermediário |
| `Detrator` | Indicador negativo |

---

## Tabs

| Tab | ID | Conteúdo exibido |
|---|---|---|
| Informações | `informacoes` | Resumo da V.IA, métricas do contato, pedidos e tickets |
| Atividades | `atividades` | Pedidos, tickets e histórico de alterações do cliente |

---

## Resumo da V.IA

O card de resumo apresenta informações consolidadas sobre o cliente:

| Informação |
|---|
| Período analisado |
| Volume financeiro histórico |
| Classificação e média de NPS |

O botão `"Faça uma pergunta"` utiliza `onOpenAI()` para abrir o assistente da aplicação.

---

## Métricas do contato

A seção de métricas permite selecionar o período analisado.

### Períodos disponíveis

| Label | Valor |
|---|---|
| Esse mês | `current_month` |
| Últimos 3 meses | `last_3_months` |
| Esse semestre | `current_semester` |
| Esse ano | `current_year` |
| Todo o período | `all_time` |

### Indicadores utilizados

| Indicador | Descrição |
|---|---|
| Compras no período | Valor financeiro associado às compras do cliente |
| Média NPS | Média de satisfação do cliente |
| Origem do lead | Origem cadastrada ou identificada para o cliente |
| Produto mais visualizado | Produto com maior interação do cliente |
| Taxa de conversão | Percentual de conversão das interações |
| Categorias mais compradas | Categorias exibidas em gráfico conforme receita total |

> As métricas consultadas por período são armazenadas em cache local para evitar nova requisição quando o mesmo período for selecionado novamente.

---

## Pedidos do contato

O card de pedidos apresenta os registros retornados pelo dashboard histórico do cliente.

| Informação exibida |
|---|
| ID do pedido |
| Data do pedido |
| Produtos e quantidades |
| Valor total |
| Status do pedido |

Quando não existem pedidos, é exibida a mensagem:

```text
Nenhum pedido encontrado.
```

---

## Tickets do contato

O card de tickets apresenta os chamados de suporte relacionados ao cliente.

| Informação exibida |
|---|
| ID do ticket |
| Data e hora de abertura |
| Status do ticket |
| Tipo de problema |

### Tipos de problema representados

| Problema |
|---|
| Produto |
| Entrega |
| Pagamento |
| Reembolso |

Quando não existem tickets, é exibida a mensagem:

```text
Nenhum ticket encontrado.
```

---

## Histórico de atividades

Na aba `"Atividades"`, a página apresenta o histórico de alterações registradas para o cliente.

| Informação exibida |
|---|
| Usuário responsável pela alteração |
| Data e hora da alteração |
| Campo alterado |
| Valor anterior |
| Novo valor |
| Método da alteração |

Quando não existem atividades, é exibida a mensagem:

```text
Sem atividades registradas.
```

---

## Edição do cliente

A edição é acionada pelo botão de editar localizado no card de informações importantes.

### Campos editáveis

| Campo |
|---|
| Nome do contato |
| Status |
| Email |
| Número de telefone |
| Data de nascimento |
| Idade |
| Gênero |
| Data de cadastro |
| Origem |
| País |
| Estado |
| Região |
| Cidade |

Ao confirmar a edição:

1. os dados atualizados são enviados ao endpoint `PATCH /api/contact-details/{contactId}/details`;
2. o nome do usuário autenticado é enviado no header `X-User-Name`;
3. os dados atualizados substituem as informações exibidas na página;
4. o histórico de atividades é carregado novamente.

---

## Remoção do cliente

A remoção pode ser acionada dentro do modal de edição.

| Etapa | Comportamento |
|---|---|
| Clicar em `"Remover Cliente"` | Abre o modal de confirmação |
| Clicar em `"Cancelar"` | Fecha a confirmação sem excluir |
| Confirmar remoção | Executa `DELETE /api/contact-details/{contactId}/details` |
| Após remover | Navega para `/contacts` |

---

## Interações e comportamentos

| Ação | Comportamento |
|---|---|
| Clicar em `"Contatos"` | Retorna para `/contacts` |
| Clicar no ícone de edição | Abre o modal de edição do cliente |
| Clicar em `"Faça uma pergunta"` | Abre o assistente V.IA |
| Alterar o período | Atualiza as métricas exibidas no dashboard |
| Selecionar a aba `"Informações"` | Exibe resumo, métricas, pedidos e tickets |
| Selecionar a aba `"Atividades"` | Exibe pedidos, tickets e histórico de alterações |
| Confirmar edição | Atualiza os dados exibidos e recarrega as atividades |
| Confirmar remoção | Exclui o cliente e retorna para a listagem |

---

## Estados de carregamento e erro

| Situação | Mensagem exibida |
|---|---|
| Carregamento inicial | `Carregando contato...` |
| Contato não encontrado ou erro de carregamento | `Contato não encontrado.` |
| Atualização das métricas | `Atualizando dashboard...` |
| Carregamento do histórico | `Carregando histórico...` |

---

## Observações

- A página utiliza o identificador recebido pela rota para carregar todos os dados do cliente.
- Pedidos e tickets são carregados considerando todo o histórico do contato.
- As métricas apresentadas podem variar conforme o período selecionado.
- A seção de tickets relaciona os chamados de suporte ao contexto geral do cliente.
- O histórico de atividades registra alterações realizadas nos dados cadastrais do cliente.
- O botão `"Faça uma pergunta"` conecta a tela de cliente específico ao assistente V.IA.