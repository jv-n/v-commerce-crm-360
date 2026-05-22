# Decisões Arquiteturais — V-Commerce CRM 360

Registro das decisões técnicas e de produto tomadas pelo time durante a construção do CRM 360 em resposta ao case final Visagio Rocket Lab 2026. Esta lista contém **apenas decisões reais** — escolhas em que o time tinha liberdade entre alternativas viáveis. Itens fixados pelo enunciado do case (Bronze→Silver→Gold no Databricks com PySpark, Workflow agendado, exportação Gold em CSV, sanitização de colunas para Delta Lake, modelo Gemini 2.5 Flash, framework FastAPI, frontend em React + TypeScript + Vite, integração do agente ao backend) **não são decisões e não aparecem aqui** — estão registrados nos documentos de cada módulo.

Cada decisão segue o formato **Contexto → Decisão → Consequências** e descreve o trade-off escolhido contra as alternativas avaliadas.

---

## Índice

### Backend
1. [SQLAlchemy 2.0 declarativo + pydantic-settings sobre o FastAPI](#1-sqlalchemy-20-declarativo--pydantic-settings-sobre-o-fastapi)
2. [SQLite como banco operacional do CRM](#2-sqlite-como-banco-operacional-do-crm)
3. [Tabelas Gold consumidas pelo ORM sem renormalização](#3-tabelas-gold-consumidas-pelo-orm-sem-renormalização)
4. [Camada de Service entre Router e Model](#4-camada-de-service-entre-router-e-model)
5. [Autenticação JWT com pwdlib + python-jose](#5-autenticação-jwt-com-pwdlib--python-jose)
6. [JWT verificado apenas em endpoints de personalização](#6-jwt-verificado-apenas-em-endpoints-de-personalização)
7. [Migrações via script Python idempotente em vez de Alembic](#7-migrações-via-script-python-idempotente-em-vez-de-alembic)
8. [Índices criados em runtime via `CREATE INDEX IF NOT EXISTS`](#8-índices-criados-em-runtime-via-create-index-if-not-exists)
9. [Janela rolante em dias para o seletor de período do dashboard](#9-janela-rolante-em-dias-para-o-seletor-de-período-do-dashboard)
10. [Receita do dashboard considera apenas pedidos aprovados (sem subtrair reembolsos)](#10-receita-do-dashboard-considera-apenas-pedidos-aprovados-sem-subtrair-reembolsos)
11. [Tabelas de atividade (`ft_*_activities`) para audit log de edições no CRM](#11-tabelas-de-atividade-ft__activities-para-audit-log-de-edições-no-crm)

### Frontend
12. [React 19 como versão da base obrigatória](#12-react-19-como-versão-da-base-obrigatória)
13. [Atomic Design (atoms / molecules / organisms)](#13-atomic-design-atoms--molecules--organisms)
14. [Tailwind v4 + shadcn/ui + MUI v9 — três libs visuais coexistindo](#14-tailwind-v4--shadcnui--mui-v9--três-libs-visuais-coexistindo)
15. [Mapa do Brasil em SVG puro, sem biblioteca de mapas](#15-mapa-do-brasil-em-svg-puro-sem-biblioteca-de-mapas)
16. [Roteamento e autorização via `ProtectedRoute` por papel](#16-roteamento-e-autorização-via-protectedroute-por-papel)
17. [Estado de autenticação em Context + `sessionStorage`](#17-estado-de-autenticação-em-context--sessionstorage)
18. [Cada widget do dashboard busca seus próprios dados](#18-cada-widget-do-dashboard-busca-seus-próprios-dados)
19. [Sem state manager global (Redux/Zustand)](#19-sem-state-manager-global-reduxzustand)

### Agente de IA (Text-to-SQL)
20. [PydanticAI como framework de agentes](#20-pydanticai-como-framework-de-agentes)
21. [Apenas tabelas Gold expostas ao agente](#21-apenas-tabelas-gold-expostas-ao-agente)
22. [Guardrails de execução SQL: SELECT-only + sandbox de tabelas](#22-guardrails-de-execução-sql-select-only--sandbox-de-tabelas)
23. [Fórmulas do dashboard embutidas no system prompt](#23-fórmulas-do-dashboard-embutidas-no-system-prompt)
24. [Memória de conversa em dicionário em memória, limite 20 mensagens](#24-memória-de-conversa-em-dicionário-em-memória-limite-20-mensagens)
25. [Limpeza de tool calls/responses do histórico antes de persistir](#25-limpeza-de-tool-callsresponses-do-histórico-antes-de-persistir)
26. [Extração de fontes via regex sobre FROM/JOIN para transparência](#26-extração-de-fontes-via-regex-sobre-fromjoin-para-transparência)

### Operação
27. [Docker Compose como ambiente único de desenvolvimento](#27-docker-compose-como-ambiente-único-de-desenvolvimento)

---

# Backend

## 1. SQLAlchemy 2.0 declarativo + pydantic-settings sobre o FastAPI

### Contexto
O case fixa FastAPI como framework, mas dentro dele havia liberdade total para escolher como manipular o banco, como carregar configurações e como validar payloads. Opções consideradas para ORM: SQLAlchemy 1.4 estilo legado (Session.query), SQLAlchemy 2.0 estilo declarativo (`Mapped[]`, `select()`), SQLModel (camada sobre SQLAlchemy + Pydantic) e queries cruas via `sqlite3`. Para configuração: ler `os.environ` direto, usar `python-dotenv`, ou `pydantic-settings`.

### Decisão
Usar **SQLAlchemy 2.0 estilo declarativo** (modelos com `Mapped[]` e `mapped_column`, queries com `select()` tipadas), **Pydantic v2** para schemas de entrada/saída e **pydantic-settings** (`BaseSettings`) para `app/config.py`.

### Consequências
- Tipagem estática do schema do banco ao endpoint — Pyright valida o contrato inteiro.
- `pydantic-settings` resolve o caminho do banco em tempo de execução com `Path(__file__).resolve().parents[1] / "database" / "vcommerce.db"`, evitando o problema clássico de URL absoluta do host quebrar dentro do container.
- Documentação interativa em `/docs` sai gerada sem esforço extra.
- Curva de aprendizado maior para integrantes vindos de Flask/Express; legibilidade compensa.

---

## 2. SQLite como banco operacional do CRM

### Contexto
O case sugere "SQLite ou PostgreSQL recomendado". Postgres exige container extra, configuração de credenciais e backup; SQLite roda no mesmo processo, sem rede.

### Decisão
Usar **SQLite** com o arquivo `vcommerce.db` gerado localmente por `python backend/database/seed.py` a partir dos CSVs Gold.

### Consequências
- Zero configuração: o time todo sobe o sistema com `docker compose up` sem variáveis sensíveis.
- Concorrência limitada (writer único). Aceitável: o uso é majoritariamente leitura sobre tabelas Gold imutáveis. As tabelas mutáveis (`bookmarks`, `goals`, `ft_*_activities`) têm tráfego de escrita baixíssimo.
- Migração futura para Postgres exige apenas trocar `DATABASE_URL` em `app/config.py` — todo o resto é agnóstico, com exceção de detalhes documentados na Decisão 9 (função `date('now','-N days')` é específica do SQLite).
- O arquivo `vcommerce.db` está no `.gitignore` e é regenerado por cada integrante a partir dos CSVs.

---

## 3. Tabelas Gold consumidas pelo ORM sem renormalização

### Contexto
As tabelas Gold já vêm desnormalizadas pelo pipeline (pedidos carregam nome do cliente, e-mail, categoria, etc.). Poderíamos espelhar o modelo relacional original com chaves estrangeiras e relacionamentos SQLAlchemy, ou usar Gold como entidade isolada.

### Decisão
Mapear **uma classe SQLAlchemy por tabela Gold** sem `relationship()` nem chaves estrangeiras. `GoldPedidoDetalhado`, `GoldCliente360`, `GoldTicket360` etc. são entidades autocontidas. JOINs são feitos explicitamente no service layer apenas quando necessário (e.g., `dashboardService` faz JOIN entre `gold_pedidos_detalhado` e `gold_cliente_360` para o mapa por estado, já que pedidos não trazem a UF do cliente).

### Consequências
- Endpoints respondem rápido: sem N+1 nem JOINs implícitos. A maioria das queries é `SELECT ... FROM gold_X WHERE data >= ?`.
- Backend fica fortemente acoplado ao schema Gold: renomear coluna no pipeline quebra a API imediatamente — pelo lado positivo, o erro é detectável no boot do FastAPI.
- A mesma desnormalização vale para o agente de IA (Decisão 21) — backend e agente usam a mesma fonte da verdade.

---

## 4. Camada de Service entre Router e Model

### Contexto
FastAPI permite escrever lógica direto no router. Funciona para CRUDs simples, mas vira spaghetti em endpoints como `/dashboard/metrics` que agregam 6 queries diferentes com cálculos de período anterior e YoY.

### Decisão
Padronizar três camadas:
1. **Router** (`app/routes/*.py`) — declaração de rota, validação de input via Pydantic, injeção de `db` (e do user atual em rotas autenticadas).
2. **Service** (`app/services/*.py`) — lógica de negócio, queries SQLAlchemy, agregações.
3. **Model** (`app/models/*.py`) — mapeamento tabela → classe.

### Consequências
- Routers ficam de 5 a 20 linhas; services concentram a complexidade.
- Reuso fácil entre endpoints: `dashboardService._vendas()` é chamado de mais de uma rota.
- Testes podem mockar o service sem subir FastAPI.
- Custo: para CRUDs triviais (`bookmarkRouter` por ex.) a camada é praticamente boilerplate — aceitamos para manter consistência.

---

## 5. Autenticação JWT com pwdlib + python-jose

### Contexto
"Autenticação de usuários com perfis diferenciados" é diferencial do case. Bibliotecas avaliadas para hash: `passlib` (legado, manutenção lenta), `bcrypt` puro (sem API ergonômica), `pwdlib` (sucessor moderno de `passlib`, usa `argon2id` por padrão). Para tokens: `pyjwt` ou `python-jose` (mais features, melhor integração com FastAPI tutorials).

### Decisão
- **Hash de senha:** `pwdlib.PasswordHash.recommended()` em `app/core/security.py` — atualmente argon2id.
- **Tokens:** JWT HS256 via `python-jose`, com `SECRET_KEY` em env e expiração de 8 horas (`ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 8`).
- **Endpoint:** `POST /auth/login` valida e retorna `{ access_token, token_type, user }`.

### Consequências
- Hashes são `argon2id`, resistentes a brute-force.
- Sessões stateless: o backend não armazena tokens; o logout no frontend só limpa `sessionStorage` (vide Decisão 17).
- A `SECRET_KEY` padrão é `"mude-me"` — explicitamente marcada para substituição no `.env` em produção.
- Não há refresh token: após 8 horas o usuário precisa fazer login novamente.

---

## 6. JWT verificado apenas em endpoints de personalização

### Contexto
Apesar de o login estar funcionando e o frontend gerar tokens, a maioria dos routers do backend não verifica o JWT. Apenas `goals.ts` e `bookmarks.ts` no frontend enviam o header `Authorization`, e os routers correspondentes (`goalRouter`, `bookmarkRouter`) extraem o `user_id` do token via `app/core/dependencies.py`.

### Decisão
Manter o estado atual: o token é exigido **apenas** onde a personalização por usuário é necessária (favoritos e metas), porque essas tabelas têm coluna `user_id`. Os demais endpoints (dashboard, contatos, vendas, produtos, tickets, agente) ficam abertos no backend e protegidos apenas pelo `ProtectedRoute` do frontend.

### Consequências
- Qualquer cliente HTTP que conheça as rotas pode consumir dados sem autenticar — **a proteção é apenas client-side**.
- Aceitável para o escopo de protótipo demonstrativo, mas registrado como dívida técnica.
- Para tornar tudo autenticado bastaria adicionar `Depends(get_current_user)` em cada router; o utilitário já existe em `core/dependencies.py`.

---

## 7. Migrações via script Python idempotente em vez de Alembic

### Contexto
A pasta `backend/alembic/` foi criada inicialmente, mas a única alteração de schema feita após o seed inicial foi adicionar `user_id` em `bookmarks` e `goals` (necessária para a Decisão 6). Adotar Alembic exigiria gerar revisões e rodar `alembic upgrade head` na inicialização — overhead grande para uma migração.

### Decisão
Implementar a migração em `backend/database/migrate_user_scope.py` — script SQL puro, idempotente (checa `_column_exists` antes de aplicar e detecta migração interrompida via existência de `bookmarks_new` órfã), executado automaticamente pelo `main.py` no boot do FastAPI.

### Consequências
- Onboarding mais simples: ninguém precisa aprender Alembic ou rodar comandos extras.
- Lida explicitamente com migração parcialmente concluída — protege contra falha no meio do processo (importante porque a operação `bookmarks → bookmarks_new → drop → rename` não é atômica em SQLite).
- Não escala para muitas migrações: se forem necessárias N alterações de schema, vale migrar para Alembic. A pasta `alembic/` segue no repo como atalho para o futuro.

---

## 8. Índices criados em runtime via `CREATE INDEX IF NOT EXISTS`

### Contexto
Após popular o banco com `seed.py`, as queries do dashboard sobre `gold_pedidos_detalhado` (310k linhas) com filtro de data estavam em ~400 ms. A solução natural é indexar `data_pedido`, `id_produto`, `categoria` etc.

### Decisão
Adicionar as criações de índice diretamente em `app/main.py` na inicialização, usando `CREATE INDEX IF NOT EXISTS` para garantir idempotência. Os índices criados:
- `idx_pedidos_data` em `gold_pedidos_detalhado(data_pedido)`
- `idx_pedidos_produto` em `gold_pedidos_detalhado(id_produto)`
- `idx_pedidos_categoria` em `gold_pedidos_detalhado(categoria)`
- `idx_clientes_cadastro` em `gold_cliente_360(data_cadastro)`

### Consequências
- Latência das queries do dashboard caiu para < 50 ms.
- Banco recriado pelo seed não perde os índices — eles são recriados em qualquer boot da API.
- Não bloqueia o startup: `CREATE INDEX IF NOT EXISTS` é O(1) quando o índice já existe.
- O lugar "correto" seria criar dentro do próprio `seed.py`, mas mantê-los no `main.py` garante que mesmo bancos legados (gerados em versões anteriores do seed) sejam corrigidos no boot.

---

## 9. Janela rolante em dias para o seletor de período do dashboard

### Contexto
O dashboard tem opções "últimas 2 semanas", "último mês", "últimos 3 meses", "semestre", "último ano". A interpretação intuitiva seria meses calendário (mês de março inteiro), mas isso quebra com a expectativa "se hoje é dia 20, quero ver os últimos 30 dias" e gera saltos descontínuos no primeiro dia de cada mês.

### Decisão
Cada opção mapeia para uma **janela rolante em dias** a partir de hoje:
- 2 semanas = 14 dias
- 1 mês = 30 dias
- 3 meses = 90 dias
- semestre = 180 dias
- 1 ano = 365 dias

A query base no SQLite é `data_pedido >= date('now','-N days') AND data_pedido <= date('now')`.

### Consequências
- Comportamento consistente com "últimos N dias", sem saltos no fim de mês.
- A regra está embutida no prompt do agente de IA (Decisão 23) para que perguntas em linguagem natural batam com o dashboard.
- "Ano calendário" e "mês calendário" não são oferecidos no UI — para isso usa-se a opção `personalizado` com seleção manual de datas.
- `date('now', '-N days')` é função do SQLite; migração para Postgres exige reescrita para `now() - interval 'N days'`. Documentado na Decisão 2.

---

## 10. Receita do dashboard considera apenas pedidos aprovados (sem subtrair reembolsos)

### Contexto
A função `_vendas` em `app/services/dashboardService.py` originalmente calculava `SUM(receita_bruta WHERE status='Aprovado') - SUM(valor_reembolsado WHERE status='Reembolsado')`. Verificou-se que **pedidos com status `Reembolsado` nunca entram na primeira soma** (são filtrados por status), então a subtração descontava um valor que nunca foi adicionado — gerando receita líquida sistematicamente menor que a realidade.

### Decisão
Manter apenas a soma de pedidos aprovados:
```python
return round(float(aprovado), 2)
```
A subtração de reembolsos foi removida. O comportamento do gráfico de barras "Receita no período" (que sempre foi só aprovados) não muda.

### Consequências
- O número do card "Vendas" subiu (passou a refletir todos os aprovados sem desconto fantasma).
- Efeito colateral: o prompt do agente de IA ainda contém a fórmula antiga com subtração — registrado como pendência (Decisão 23). Corrigir lá manterá coerência em toda a stack.
- Fica em aberto se "receita líquida" deve subtrair reembolsos de pedidos que tiveram status mudado de Aprovado → Reembolsado após a contagem (cenário não existente no dataset atual, pois mudança de status reescreve o registro).

---

## 11. Tabelas de atividade (`ft_*_activities`) para audit log de edições no CRM

### Contexto
O case pede CRUD de produtos e edições em pedidos/contatos. Sem audit log, mudanças manuais ficam invisíveis — incompatível com a meta de "fonte única de verdade rastreável" expressa pela Diretora de Tecnologia no enunciado.

### Decisão
Criar três tabelas append-only paralelas às Gold:
- `ft_sale_activities` — log de mudanças em pedidos
- `ft_product_activities` — log de mudanças em produtos
- `ft_contact_activities` — log de mudanças em contatos

Cada linha registra `id_*`, `user_name`, `field_name`, `old_value`, `new_value`, `change_method` (default `"Edição direta"`) e `changed_at`. Os modelos são criados via `Base.metadata.create_all` no boot do FastAPI.

### Consequências
- Histórico de cada entidade fica disponível para o `ContactDetail`, `ProductDetail` e telas de pedido — exibido como timeline.
- Crescimento linear com volume de edições, sem TTL — em produção precisaria política de retenção.
- O nome do usuário é passado via header `X-User-Name` (padrão `"Sistema"`) em vez de extraído do JWT, em coerência com a Decisão 6 (a maioria dos endpoints não autentica). Migrar para o JWT é trivial quando a Decisão 6 for revertida.

---

# Frontend

## 12. React 19 como versão da base obrigatória

### Contexto
O case fixa React + TypeScript + Vite. Restava decidir entre React 18 (estável, ecossistema completo) e React 19 (lançamento recente com `use()`, `<form actions>`, melhorias em concurrent rendering).

### Decisão
Adotar **React 19** desde o início, junto com Vite 6 e TypeScript estrito (`strict: true`).

### Consequências
- Componentes podem usar `use()` para promessas/contextos quando necessário (não houve adoção massiva ainda).
- `react-router-dom` v7 (versão major nova) precisou ser usado para compatibilidade — custo assumido.
- Build de dev sobe em < 1 s (Vite). Hot reload < 200 ms.

---

## 13. Atomic Design (atoms / molecules / organisms)

### Contexto
Com 9 páginas e dezenas de cards, gráficos e tabelas, era necessário um critério de organização para evitar componentes duplicados ou monolíticos.

### Decisão
Adotar Atomic Design com três níveis:
- **atoms/** — `Button`, `Input`, `Label`, `Skeleton` — componentes sem lógica de negócio.
- **molecules/** — `MetricCard`, `OrdersCard`, `ContactsTable`, `PeriodSelector` — composição de átomos com lógica local e chamadas próprias de API.
- **organisms/** — `AppFrame`, `ProtectedRoute`, `BrazilMapCard` — estruturas que orquestram molecules e gerenciam layout global.

Páginas (`src/Pages/*`) compõem organisms + molecules.

### Consequências
- Hierarquia clara: revisores conseguem prever onde um componente novo deve viver.
- Alguns componentes (como `BrazilMapCard`) ficaram em `organisms/` por tamanho mesmo sendo conceitualmente próximos de uma molecule.
- Páginas raramente importam atoms diretamente — passam por molecules.

---

## 14. Tailwind v4 + shadcn/ui + MUI v9 — três libs visuais coexistindo

### Contexto
shadcn/ui (componentes copy-paste sobre Tailwind) é ótimo para Sidebar, Tabs, Toast etc. Mas não tem `DataGrid`, gráficos nem ícones consistentes, e usar React-Icons + Lucide gerava inconsistência visual.

### Decisão
- **Tailwind v4** para utility classes em todo o frontend.
- **shadcn/ui** para componentes interativos (Sidebar, Sheet, Dropdown, Tooltip).
- **MUI v9** **apenas** para `@mui/icons-material` (ícones consistentes entre páginas) e `@mui/x-charts` (gráficos do dashboard).

### Consequências
- Bundle tem três fontes de CSS/JS, mas o tree-shaking limita o impacto (~120 kB de ícones MUI utilizados).
- MUI nunca é usado para componentes de UI (Button, TextField, etc.) — todos vêm de shadcn ou são `<button>` nativos com Tailwind.
- Decisão facilita migração futura: dropar MUI exigiria substituir ícones (lucide) e gráficos (recharts).

---

## 15. Mapa do Brasil em SVG puro, sem biblioteca de mapas

### Contexto
O dashboard precisa de um mapa coroplético do Brasil por estado e região. Avaliamos `react-simple-maps` (~100 kB + dependência de `d3-geo`), `leaflet` (200 kB, voltado a mapas interativos com tiles) ou montar um SVG estático.

### Decisão
Implementar `BrazilMapCard` como SVG puro embutido no componente. Os paths de cada estado vêm de um GeoJSON pré-convertido. Escala de cores e tooltip são feitas com handlers `onMouseEnter`/`onMouseLeave` nos `<path>`.

### Consequências
- Zero dependência nova (~0 kB extras).
- Performance excelente (renderização de 27 paths SVG é trivial).
- Não há zoom/pan nem mapa-base — aceito como trade-off; a UI atual não precisa.
- Mudar paleta ou adicionar legenda é simples. Adicionar interação geográfica avançada exigiria migrar para react-simple-maps.

---

## 16. Roteamento e autorização via `ProtectedRoute` por papel

### Contexto
O case pede "perfis diferenciados". O backend tem três roles (`admin`, `sales`, `support`); o frontend precisa restringir páginas a cada um.

### Decisão
Implementar um único `ProtectedRoute` (`src/components/organisms/ProtectedRoute/index.tsx`) que:
1. Verifica se `user` existe no `AuthContext` — caso contrário redireciona para `/login`.
2. Se receber a prop `allowedRoles`, valida `allowedRoles.includes(user.role)` — caso contrário redireciona para `/unauthorized`.

A árvore de rotas em `App.tsx` aninha `<ProtectedRoute allowedRoles={...}>` por grupo de rotas.

### Consequências
- Adicionar uma nova role envolve apenas atualizar `App.tsx`.
- O `Sidebar` reaproveita a mesma estrutura (`roles.includes(user.role)`) para esconder itens — UI e roteamento permanecem em sincronia.
- Limitação: a verificação é só no frontend. O backend não valida JWT na maior parte dos endpoints (vide Decisão 6).

---

## 17. Estado de autenticação em Context + `sessionStorage`

### Contexto
Precisa-se persistir o usuário logado entre reloads de página, mas não entre abas/sessões diferentes (case de uso típico em corporate apps — fechou o navegador, precisa relogar).

### Decisão
- **Estado em memória:** `AuthProvider` mantém `user` em `useState`.
- **Persistência:** `sessionStorage` com duas chaves (`crm_token_v360`, `crm_user_v360`).
- **Hidratação:** `AuthProvider` lê de `sessionStorage` no init via `getStoredUser()`.
- **Limpeza:** `logout()` chama `clearSession()` e zera o estado.

### Consequências
- Fechar a aba derruba a sessão — comportamento desejado para uso corporativo.
- O token fica acessível a qualquer script com acesso ao DOM (XSS) — registrado como dívida. Mitigação correta seria `httpOnly` cookie, mas exigiria mudar o backend para setar o cookie no login.
- Não há sincronização entre abas: abrir o mesmo CRM em duas abas exige login independente em cada uma.

---

## 18. Cada widget do dashboard busca seus próprios dados

### Contexto
A página `Dashboard` tem 6 KPIs + `OrdersCard` + `TopCategoriesChart` + `ModuleBarChart` + `BrazilMapCard`. Poderíamos fazer uma única chamada `/dashboard/all` que retorna tudo, ou uma chamada por widget.

### Decisão
A página chama apenas `/dashboard/metrics` (para os 6 cards). Cada widget secundário (`OrdersCard`, `ModuleBarChart`, etc.) recebe `period` como prop e dispara sua própria chamada (`/dashboard/orders`, `/dashboard/revenue`, etc.).

### Consequências
- Loading granular: o usuário vê os cards aparecerem rapidamente enquanto o mapa carrega.
- Trocar período faz N requests paralelas — aceitável dado que o backend responde em < 50 ms cada (graças à Decisão 8).
- Falha em um widget não derruba os outros — cada um exibe seu próprio fallback.
- A página inicial dispara ~5 requisições. Em produção real, valeria adicionar `react-query` com cache para evitar refetch desnecessário.

---

## 19. Sem state manager global (Redux/Zustand)

### Contexto
A maioria dos CRMs comerciais usa Redux/Zustand. Avaliou-se introduzir um deles para gerenciar usuário, período global, dados em cache.

### Decisão
Não usar state manager. As ferramentas escolhidas são:
- **Context API** para `AuthProvider` (uso simples, leitura barata).
- **Estado local** (`useState`) para período do dashboard, filtros etc.
- **URL** como estado para filtros de listagens persistíveis (`/contacts?status=ativo`).

### Consequências
- Bundle ~20 kB menor (sem Redux Toolkit).
- Zero boilerplate: ações, reducers, slices não existem.
- Quando precisarmos compartilhar dados entre páginas (carrinho de seleção, cache de listagens), o caminho preferido será `react-query` ou um Context dedicado — não Redux.
- Re-renderização desnecessária é mitigada por composição (componentes pequenos, props mínimas) — observado via React DevTools, sem hotspots.

---

# Agente de IA (Text-to-SQL)

## 20. PydanticAI como framework de agentes

### Contexto
O case cita PydanticAI, LangChain, LangGraph, LlamaIndex e CrewAI como opções. LangChain é o mais popular mas vem com peso (mais de 50 dependências transitivas) e API instável; LangGraph adiciona overhead conceitual de grafos; CrewAI é multi-agente — não precisamos. PydanticAI é tipado, foca em uma abstração só (`Agent`) e integra direto com Pydantic v2 (já usado no backend).

### Decisão
Usar **PydanticAI**. Um único agente com 3 tools (`list_tables`, `get_table_schema`, `execute_sql`), tipo de saída `str`, dependências injetadas via `RunContext[AgentDeps]`.

### Consequências
- Curva de aprendizado pequena: 99% do agente cabe em `ai-agent/agent.py` (~220 linhas).
- Tipagem estática end-to-end: o resultado é `Agent[AgentDeps, str]`, validado por Pyright.
- Ecossistema menor que LangChain — sem RAG, memória vetorial etc. Não precisamos. Migrar seria custoso se precisarmos no futuro.

---

## 21. Apenas tabelas Gold expostas ao agente

### Contexto
O agente tem acesso ao mesmo banco SQLite que o backend. Esse banco contém também tabelas operacionais (`users`, `conversations`, `bookmarks`, `ft_*_activities`). Permitir o agente consultá-las vazaria dados sensíveis (hashes de senha em `users`, históricos privados) e poderia gerar respostas com dados irrelevantes.

### Decisão
Implementar um sandbox de tabelas dentro de `ai-agent/database_tools.py`:
1. `list_tables()` filtra `sqlite_master` por `name LIKE 'gold_%'`.
2. `get_table_schema(table)` valida prefixo `gold_` antes de executar `PRAGMA`.
3. `execute_query(sql)` extrai `FROM/JOIN` via regex e bloqueia se qualquer tabela referenciada não começar com `gold_`.

### Consequências
- O agente não vê tabelas de auth, conversations, bookmarks etc.
- A camada de filtragem está em código Python — não há controle no SQLite, então uma falha no regex deixa o gap aberto. Para defesa em profundidade, valeria criar um usuário SQLite read-only ou uma cópia view-only do banco.
- O regex `\bFROM\s+(\w+)|\bJOIN\s+(\w+)` não cobre subqueries em `WITH`. Funciona para todas as queries que o Gemini gera atualmente (verificado em testes).

---

## 22. Guardrails de execução SQL: SELECT-only + sandbox de tabelas

### Contexto
LLMs podem gerar queries destrutivas por engano (especialmente em prompts hostis). Mesmo com `read_only` na connection string SQLite, queremos um cinto de segurança extra dentro da aplicação. O case lista guardrails como diferencial.

### Decisão
A função `_is_select_only()` em `database_tools.py`:
1. Remove comentários (`-- ...` e `/* ... */`).
2. Valida que a query começa com `SELECT`.
3. Bloqueia keywords `INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|REPLACE|ATTACH|DETACH|PRAGMA`.

Adicionalmente, `LIMIT MAX_ROWS` (100) é injetado automaticamente se ausente.

### Consequências
- Resposta de erro para o agente é descritiva ("ERRO DE SEGURANÇA: Apenas queries SELECT são permitidas") — o LLM consegue corrigir e tentar de novo.
- Bloquear `PRAGMA` impede que o agente faça `PRAGMA table_info()` direto, mas o tool dedicado `get_table_schema()` já cobre o caso de uso legítimo.
- `LIMIT 100` significa que perguntas como "liste todos os 5.000 produtos" são truncadas — o agente é instruído no prompt a agregar (`COUNT`, `SUM`) em vez de listar.

---

## 23. Fórmulas do dashboard embutidas no system prompt

### Contexto
Quando perguntado "qual a receita dos últimos 3 meses", o agente, sem orientação, escreveria `SUM(receita_bruta)` direto — gerando um número diferente do que aparece no card "Vendas" do dashboard. Isso mata a confiança: usuário diz "o agente está mentindo" quando na verdade o dashboard usa fórmula específica.

### Decisão
Embutir as **fórmulas SQL exatas** que o dashboard usa diretamente no `SYSTEM_PROMPT` (`ai-agent/prompts.py`):
- Receita líquida (card Vendas)
- Receita por período (gráfico de barras)
- Total de pedidos por status
- Clientes ativos
- Top categorias (com filtro `status='Aprovado'` obrigatório)
- NPS via `gold_cliente_360.categoria_nps_recente`
- Novos clientes (primeiro pedido no período)
- Mapa por estado (3 regras críticas documentadas)
- Tickets solucionados
- Sessões
- Engajamento por categoria

Cada fórmula inclui explicitamente o filtro de período usando `date('now', '-N days')` (vide Decisão 9).

### Consequências
- Respostas do agente são consistentes com o dashboard em > 95% dos casos (medido em testes manuais).
- O prompt cresceu para ~10 kB — consome contexto, mas Gemini 2.5 Flash tem janela de 1M token, então é irrelevante.
- **Manutenção acoplada:** mudanças no `dashboardService.py` exigem atualizar `prompts.py`. A correção da Decisão 10 (receita = só aprovados) **ainda não foi propagada** para o prompt — pendência conhecida.
- Em produção, valeria gerar o prompt programaticamente a partir de uma fonte única (e.g., um arquivo YAML compartilhado entre backend e agente).

---

## 24. Memória de conversa em dicionário em memória, limite 20 mensagens

### Contexto
O case lista "memória de conversa" como diferencial. Implementações possíveis: Redis (overhead operacional), tabela no SQLite (consultas extras), dict em memória (zero dependência).

### Decisão
Histórico mantido em `_session_history: dict[str, list[ModelMessage]]` dentro de `agent.py`. Truncado para as últimas 20 mensagens em cada turno. Sessões identificadas por UUID gerado no frontend e enviado no `ChatRequest`.

### Consequências
- Histórico é volátil: restart do servidor zera tudo.
- Múltiplos workers (e.g., gunicorn com `-w 4`) **não compartilham** o dict — cada worker tem sua memória. Aceitável porque rodamos com 1 worker.
- Limite de 20 mensagens evita que conversas longas estourem o context window e mantém o custo previsível.
- Trocar por Redis ou SQLite quando for para produção é uma troca em uma única função (`save_session_history` / `get_session_history`).

---

## 25. Limpeza de tool calls/responses do histórico antes de persistir

### Contexto
Após ~3 turnos de conversa, o agente passou a retornar erros `400 INVALID_ARGUMENT` da API Gemini. Investigação mostrou que o Gemini exige cada `function_call` seguido imediatamente por um `function_response`. Quando truncamos o histórico para "últimas 20 mensagens", o slice às vezes corta no meio de um par tool-call → tool-response.

### Decisão
Antes de salvar o histórico em `_session_history`, filtrar para manter apenas `TextPart` (em `ModelResponse`) e `UserPromptPart` (em `ModelRequest`). Toda a chain de tool calls é descartada. Implementado em `_clean_messages_for_history()`.

### Consequências
- Conversas multi-turno funcionam de forma estável.
- O agente perde "memória" das queries específicas executadas em turnos anteriores — só lembra das respostas em texto. Aceitável: para uma pergunta de follow-up, o agente executa as queries de novo.
- Documentação explícita no docstring da função evita que alguém "limpe" essa limpeza pensando que está removendo código morto.

---

## 26. Extração de fontes via regex sobre FROM/JOIN para transparência

### Contexto
O case pede que o agente "indique brevemente qual dado foi consultado". Hardcodar isso no system prompt é inconsistente — o agente esquece em ~30% das respostas. Precisamos garantir 100%.

### Decisão
A função `extract_tables_from_sql()` em `agent.py` faz parse das queries executadas com regex `\bFROM\s+(\w+)|\bJOIN\s+(\w+)` e devolve uma lista ordenada e deduplicada de tabelas. O `chat()` adiciona essa lista no campo `sources` da resposta, e o frontend exibe no rodapé do balão de chat.

### Consequências
- 100% das respostas com query executada mostram as tabelas consultadas, mesmo se o LLM esquecer de citá-las.
- Limitação: tabelas em `WITH` (CTE) não são detectadas. Não houve impacto em produção porque o agente raramente gera CTEs.
- A lista bruta de queries também fica no campo `queries` do response, permitindo debug fora do happy path.

---

# Operação

## 27. Docker Compose como ambiente único de desenvolvimento

### Contexto
Os integrantes do time usam macOS, Windows (WSL2) e Linux. Configurar Python/Node em três sistemas operacionais diferentes consumiria horas. Em paralelo, o ambiente da apresentação final precisa ser reproduzível.

### Decisão
Adotar `docker-compose.yml` na raiz com dois serviços (`backend` e `frontend`) montando os diretórios locais como volumes (hot-reload). Imagens base: `python:3.12-slim` para backend e `node:20-alpine` para frontend.

### Consequências
- `docker compose up --build` é o comando único para subir o sistema inteiro.
- Hot-reload funciona em ambos os serviços (volumes em `./backend` e `./frontend`).
- Em Windows o volume mount às vezes é lento (~3 s de reload em vez de < 500 ms) — aceito.
- `node_modules` é volume nomeado para não ser sobrescrito pelo bind do host (problema clássico em projetos Node + Docker).
- O agente de IA é importado dinamicamente pelo backend; o volume `./ai-agent:/ai-agent` é necessário para que o backend enxergue o módulo.

---

# Apêndice: Template para novas decisões

```markdown
## [Número]. [Título da decisão]

### Contexto
Por que essa decisão precisou ser tomada. Qual problema ela resolve, quais alternativas foram consideradas.

### Decisão
O que foi decidido, em uma a três frases objetivas.

### Consequências
O que muda no projeto como resultado dessa decisão — bom, ruim, neutro. Inclua dívidas técnicas geradas.
```
