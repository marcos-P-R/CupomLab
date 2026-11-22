# Plano de implementação: Relatório de cupons por loja

## 1. Identificação e rastreabilidade

- **Slug:** `relatorio-cupons-por-loja`
- **Revisão do plano:** 2
- **Situação:** `rascunho`
- **Caminho e revisão da especificação de origem:** `docs/features/relatorio-cupons-por-loja/especificacao.md`, revisão 2.
- **Decisões confirmadas:**
  - Stack: Fastify, TypeScript, PostgreSQL.
  - Rota: `GET /reports/coupons/by-store`.
  - Serviço reutilizável: `rankStoresByCoupons`.
  - Parâmetros de query: `discount`, `startDate`, `endDate`, `order`.
  - Intervalo: início inclusivo, fim exclusivo.
  - Desempate: ID da loja crescente.
  - Lojas sem cupons no recorte: excluídas.
  - Ordem padrão: `desc`.
  - Resposta vazia: `200` com `[]`.
  - Sem autenticação nesta fase.
  - Percentual de desconto: número inteiro.
- **Propostas pendentes:** nenhuma (todas as decisões de negócio confirmadas na especificação).
- **Bloqueios:** nenhum.

### Mapeamento RF, RN, RNF e CA

| Item | Fase | Etapa | Testes |
|------|------|-------|--------|
| RF-01 | F02 | IMP-07, IMP-08 | rota aceita parâmetros |
| RF-02 | F01 | IMP-07 | filtro de desconto exato |
| RF-03 | F01 | IMP-07 | início inclusivo, fim exclusivo |
| RF-04 | F01 | IMP-07 | serviço agrupa por loja |
| RF-05 | F01 | IMP-07 | ordenação total + desempate ID |
| RF-06 | F01 | IMP-07 | lojas sem cupons excluídas |
| RF-07 | F02 | IMP-08 | resposta vazia 200 [] |
| RF-08 | F01 | IMP-05 | seed 5 lojas / 20 cupons |
| RN-01 | F01 | IMP-04 | FK coupon -> store |
| RN-02 | F01 | IMP-07 | igualdade exata de discount_percent |
| RN-03 | F01 | IMP-07 | detected_at < endDate |
| RN-04 | F01 | IMP-07 | detected_at >= startDate |
| RNF-01 | F04 | IMP-16 | performance < 200 ms |
| CA-01 | F04 | IMP-13, IMP-14 | filtro de desconto |
| CA-02 | F04 | IMP-13, IMP-14 | filtro de período |
| CA-03 | F04 | IMP-13, IMP-14 | ordenação desc |
| CA-04 | F04 | IMP-13, IMP-14 | empate desempate ID |
| CA-05 | F04 | IMP-13, IMP-14 | resultado vazio |
| CA-06 | F04 | IMP-13, IMP-14 | seed conferível |

## 2. Arquitetura

### Padrão adotado

Camada fina de roteamento (Fastify) -> camada de serviço puro (`rankStoresByCoupons`) -> camada de acesso a dados (PostgreSQL via pg). Não há camadas adicionais por preferência.

### Direção das dependências

Rota -> Servico -> Repositorio -> Banco. O serviço não conhece HTTP; o repositorio não conhece regras de negócio.

### Fluxo da entrada à resposta

1. Recebe `GET /reports/coupons/by-store?discount=...&startDate=...&endDate=...&order=...`.
2. Valida presença e tipos dos parâmetros de query; valida que `endDate > startDate`.
3. Chama `rankStoresByCoupon({ discount, startDate, endDate, order })`.
4. O serviço consulta o banco com filtro `discount_percent = discount` e `detected_at >= startDate AND detected_at < endDate`.
5. Agrupa por `store_id`, faz JOIN com `stores` para obter `name`, conta cupons.
6. Ordena por `total_coupons` (ASC/DESC conforme `order`), desempate por `store_id` ASC.
7. Retorna `200` com array de `{ store_id, store_name, total_coupons }`.

### Comportamentos que permanecem intactos

- Tabelas `stores` e `coupons` com os nomes e campos definidos na especificação.
- Seed de 20 registros com os IDs fixos definidos.
- Nome do serviço: `rankStoresByCoupons`.
- Nome da rota: `GET /reports/coupons/by-store`.
- Parâmetros de query em inglês: `discount`, `startDate`, `endDate`, `order`.

### Alternativas e motivos

- Usar SQL puro com `GROUP BY` no banco em vez de agregar em memória no TypeScript. Motivo: o banco é a fonte de verdade para contagem e ordenação; evita carregar todos os cupons para o Node.js.
- Não usar ORM nesta fase. Motivo: o escopo é uma única consulta agregada; um cliente direto (`pg`) reduz dependências e mantém o contrato explícito.

## 3. Manifesto de arquivos e contratos por arquivo

### Árvore de arquivos

```
docker-compose.yml        CRIAR   F01
Dockerfile                CRIAR   F01
src/
  config/
    db.ts                 CRIAR   F01
  repositories/
    coupon.repository.ts  CRIAR   F01
  services/
    rankStoresByCoupons.ts CRIAR  F03
  routes/
    reports.ts            CRIAR   F02
  app.ts                  CRIAR   F02
  seed.ts                 CRIAR   F01
tests/
  rankStoresByCoupons.test.ts CRIAR F04
  reports.route.test.ts       CRIAR F04
migrations/
  0001_create_stores_and_coupons.sql CRIAR F01
  0002_seed_data.sql                 CRIAR F01
package.json              ALTERAR F00
tsconfig.json             CRIAR   F00
.env.example              CRIAR   F01
```

F00 é a fase de setup inicial do projeto (não listada como fase de entrega, mas necessária).

### Arquivo: `src/config/db.ts`

- **Ação:** CRIAR
- **Fase:** F01
- **Propósito:** Configura o pool de conexão PostgreSQL usando variáveis de ambiente.
- **Imports:** `pg` (`Pool`).
- **Exports:** `pool` (instância de `Pool`).
- **Variáveis de ambiente:** `DATABASE_URL` (obrigatória). Exemplos: `postgres://cuponlab:cuponlab@localhost:5432/cuponlab`.
- **Conteúdo:** criação do pool com `connectionString` de `process.env.DATABASE_URL`. Exporta `pool`.
- **Preservar:** nada (arquivo novo).

### Arquivo: `.env.example`

- **Ação:** CRIAR
- **Fase:** F01
- **Propósito:** Exemplo de variáveis de ambiente para desenvolvimento local com Docker Compose.
- **Conteúdo:**
  ```
  DATABASE_URL=postgres://cuponlab:cuponlab@localhost:5432/cuponlab
  PGUSER=cuponlab
  PGPASSWORD=cuponlab
  PGDATABASE=cuponlab
  PGPORT=5432
  PGHOST=localhost
  PORT=3000
  ```
- **Preservar:** nada (arquivo novo).

### Arquivo: `Dockerfile`

- **Ação:** CRIAR
- **Fase:** F01
- **Propósito:** Imagem da aplicação Node.js/TypeScript.
- **Conteúdo:**
  - Imagem base: `node:20-alpine`.
  - Define `WORKDIR /app`.
  - Copia `package.json` e `package-lock.json` (ou `pnpm-lock.yaml`, conforme gerenciador).
  - Instala dependências.
  - Copia o restante do código.
  - Compila TypeScript (`npm run build`).
  - Expõe porta `3000`.
  - Comando de inicialização: `npm start`.
- **Preservar:** nada (arquivo novo).

### Arquivo: `docker-compose.yml`

- **Ação:** CRIAR
- **Fase:** F01
- **Propósito:** Orquestra o container da aplicação e o container do PostgreSQL.
- **Serviços:**
  - `db`: imagem `postgres:15-alpine`, variáveis de ambiente `POSTGRES_USER=cuponlab`, `POSTGRES_PASSWORD=cuponlab`, `POSTGRES_DB=cuponlab`, porta `5432:5432`, volume nomeado `cuponlab_db_data`.
  - `app`: build a partir do `Dockerfile`, depende de `db`, variáveis de ambiente `DATABASE_URL=postgres://cuponlab:cuponlab@db:5432/cuponlab`, `PORT=3000`, porta `3000:3000`.
- **Comando para start:** `docker compose up --build`.
- **Preservar:** nada (arquivo novo).

### Arquivo: `src/repositories/coupon.repository.ts`

- **Ação:** CRIAR
- **Fase:** F01
- **Propósito:** Acesso a dados para cupons e lojas.
- **Imports:** `pool` de `../config/db`.
- **Exports:**
  - `findRankedStoresByCoupons(params: RankedStoresParams): Promise<StoreCouponRanking[]>`
- **Tipos e interfaces:**
  ```ts
  export interface RankedStoresParams {
    discount: number;
    startDate: Date;
    endDate: Date;
    order: 'asc' | 'desc';
  }
  export interface StoreCouponRanking {
    store_id: number;
    store_name: string;
    total_coupons: number;
  }
  ```
- **Algoritmo:**
  1. Executa SQL com JOIN `stores` e `coupons`.
  2. Filtro: `c.discount_percent = $1 AND c.detected_at >= $2 AND c.detected_at < $3`.
  3. Agrupa: `GROUP BY s.id, s.name`.
  4. Conta: `COUNT(c.id) AS total_coupons`.
  5. Ordena: `ORDER BY total_coupons ${orderDirection}, s.id ASC`.
  6. Retorna linhas mapeadas para `StoreCouponRanking`.
- **Efeitos colaterais:** leitura do banco; sem escrita.
- **Preservar:** nomes de coluna `store_id`, `store_name`, `total_coupons` (snake_case no SQL, camelCase no retorno se necessário — manter consistente com a resposta da rota).

### Arquivo: `src/services/rankStoresByCoupons.ts`

- **Ação:** CRIAR
- **Fase:** F03
- **Propósito:** Serviço reutilizável de negócio para ranking de lojas por cupons.
- **Imports:** `findRankedStoresByCoupons` de `../repositories/coupon.repository`.
- **Exports:**
  - `rankStoresByCoupons(input: RankStoresInput): Promise<StoreRankingItem[]>`
- **Tipos e interfaces:**
  ```ts
  export interface RankStoresInput {
    discount: number;
    startDate: Date;
    endDate: Date;
    order: 'asc' | 'desc';
  }
  export interface StoreRankingItem {
    store_id: number;
    store_name: string;
    total_coupons: number;
  }
  ```
- **Algoritmo:**
  1. Valida que `endDate > startDate` (lança `Error` com mensagem descritiva caso contrário).
  2. Chama `findRankedStoresByCoupons({ discount, startDate, endDate, order })`.
  3. Retorna o resultado do repositório.
- **Efeitos colaterais:** leitura via repositório; sem escrita.
- **Preservar:** assinatura exata da função `rankStoresByCoupons`.

### Arquivo: `src/routes/reports.ts`

- **Ação:** CRIAR
- **Fase:** F02
- **Propósito:** Rota Fastify `GET /reports/coupons/by-store`.
- **Imports:** `rankStoresByCoupons` de `../services/rankStoresByCoupons`; tipos de Fastify.
- **Exports:** função default que registra a rota no Fastify (ou exporta as rotas como array/plugin).
- **Rota:** `GET /reports/coupons/by-store`
- **Parâmetros de query:**
  - `discount`: string (obrigatório), converte para número inteiro.
  - `startDate`: string (obrigatório), ISO 8601.
  - `endDate`: string (obrigatório), ISO 8601.
  - `order`: string (opcional), `'asc' | 'desc'`, padrão `'desc'`.
- **Validação em runtime:**
  - Se `discount`, `startDate` ou `endDate` ausentes -> `400 Bad Request`.
  - Se `discount` não for número inteiro -> `400`.
  - Se `startDate` ou `endDate` não forem datas ISO válidas -> `400`.
  - Se `endDate <= startDate` -> `400`.
  - Se `order` informado e não for `'asc'` nem `'desc'` -> `400`.
- **Payload de resposta (200):**
  ```ts
  { store_id: number; store_name: string; total_coupons: number }[]
  ```
- **Códigos de status:** `200` (sucesso, inclusive array vazio), `400` (erro de validação).
- **Exemplo de resposta:**
  ```json
  [
    { "store_id": 1, "store_name": "Mercado A", "total_coupons": 4 },
    { "store_id": 5, "store_name": "Eletro E", "total_coupons": 3 },
    { "store_id": 2, "store_name": "Farmácia B", "total_coupons": 2 },
    { "store_id": 3, "store_name": "Livraria C", "total_coupons": 2 }
  ]
  ```
- **Algoritmo:**
  1. Extrai e valida query params.
  2. Converte `startDate` e `endDate` para `Date`.
  3. Chama `rankStoresByCoupons({ discount, startDate, endDate, order })`.
  4. Retorna `200` com o array.
- **Preservar:** caminho da rota, nomes dos parâmetros, formato da resposta.

### Arquivo: `src/app.ts`

- **Ação:** CRIAR
- **Fase:** F02
- **Propósito:** Instancia o Fastify, registra rotas e exporta a app para testes e inicialização.
- **Imports:** `FastifyInstance` de `fastify`; plugin de rotas de `./routes/reports`.
- **Exports:** `app` (instância Fastify).
- **Conteúdo:** cria `fastify({ logger: false })`, registra rotas, exporta `app`.

### Arquivo: `src/seed.ts`

- **Ação:** CRIAR
- **Fase:** F01
- **Propósito:** Insere o seed de 5 lojas e 20 cupons no banco para testes manuais e automatizados.
- **Imports:** `pool` de `./config/db`.
- **Exports:** `runSeed(): Promise<void>`.
- **Conteúdo:** insere as 5 lojas com IDs fixos 1-5, depois os 20 cupons com IDs fixos 1-20 conforme tabela da especificação. Usa `INSERT ... ON CONFLICT (id) DO NOTHING` para idempotência.
- **Preservar:** IDs e dados exatos da especificação.

### Arquivo: `migrations/0001_create_stores_and_coupons.sql`

- **Ação:** CRIAR
- **Fase:** F01
- **Propósito:** Cria as tabelas `stores` e `coupons`.
- **Conteúdo SQL:**
  ```sql
  CREATE TABLE IF NOT EXISTS stores (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS coupons (
    id SERIAL PRIMARY KEY,
    store_id INTEGER NOT NULL REFERENCES stores(id),
    name TEXT NOT NULL,
    discount_percent INTEGER NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    detected_at TIMESTAMPTZ NOT NULL
  );
  ```
- **Índices:**
  - Índice em `coupons(discount_percent, detected_at)` — justifica consultas de filtro por percentual e período.
  - Índice em `coupons(store_id)` — justifica JOIN e agrupamento por loja.
- **Rollback:** `DROP TABLE coupons; DROP TABLE stores;` (ordem inversa por FK).

### Arquivo: `migrations/0002_seed_data.sql`

- **Ação:** CRIAR
- **Fase:** F01
- **Propósito:** Insere o seed de 5 lojas e 20 cupons.
- **Conteúdo SQL:** `INSERT` nas tabelas conforme a tabela da especificação. Usa `ON CONFLICT (id) DO NOTHING` para idempotência.
- **Backfill:** não aplica (dados iniciais).
- **Rollback:** `DELETE FROM coupons; DELETE FROM stores;`

### Arquivo: `package.json`

- **Ação:** ALTERAR
- **Fase:** F00
- **Propósito:** Adiciona dependências e scripts.
- **Dependências:** `fastify`, `pg`, `dotenv` (opcional), `typescript`, `tsx` (ou `ts-node-dev`), `@types/node`, `@types/pg`, `vitest`, `@types/node` (para teste).
- **Scripts:** `dev` (tsx watch), `build` (tsc), `start` (node dist/app.js), `seed` (tsx src/seed.ts), `test` (vitest run), `migrate` (execução manual do SQL via psql dentro do container db).
- **Nota:** se o repositório estiver vazio, este arquivo é criado do zero.

### Arquivo: `tsconfig.json`

- **Ação:** CRIAR
- **Fase:** F00
- **Propósito:** Configuração TypeScript para o projeto.
- **Conteúdo:** `target: ES2020`, `module: commonjs`, `strict: true`, `esModuleInterop: true`, `outDir: ./dist`, `rootDir: ./src`.

### Arquivo: `tests/rankStoresByCoupons.test.ts`

- **Ação:** CRIAR
- **Fase:** F04
- **Propósito:** Teste unitário do serviço `rankStoresByCoupons`.
- **Casos de teste:**
  1. `retorna ranking desc com o seed` — `discount=45`, período jan–mar, `order=desc`; espera Mercado A (4), Eletro E (3), Farmácia B (2), Livraria C (2).
  2. `retorna ranking asc com o seed` — mesmo filtro, `order=asc`; espera Livraria C (2), Farmácia B (2), Eletro E (3), Mercado A (4) (desempate ID crescente entre 2 e 3).
  3. `filtra por desconto exato` — `discount=20`; espera Pet Shop D (1), Mercado A (1).
  4. `filtro de período fim exclusivo` — `discount=45`, `startDate=2026-02-01`, `endDate=2026-03-01`; espera apenas Farmácia B (1, cupom 6) e Livraria C (1, cupom 12); cupom 5 (2026-03-01) fora.
  5. `resultado vazio` — `discount=99`; espera `[]`.
  6. `erro quando endDate <= startDate` — espera lançamento de erro.
- **Preparação:** subir containers com `docker compose up --build`, executar migrations e seed (via `docker compose exec db psql` ou script de seed), garantir que o banco esteja acessível na porta 5432.
- **Entrada:** parâmetros de `RankStoresInput` (teste de serviço) ou requisições HTTP reais via `fastify.inject()` / `supertest` (teste de rota).
- **Resultado esperado:** array de `StoreRankingItem` conforme cada caso.

### Arquivo: `tests/reports.route.test.ts`

- **Ação:** CRIAR
- **Fase:** F04
- **Propósito:** Teste de integração da rota HTTP.
- **Casos de teste:**
  1. `GET /reports/coupons/by-store?discount=45&startDate=...&endDate=...&order=desc` — espera `200` com ranking esperado do CA-06.
  2. `GET ...?discount=20&...` — espera `200` com lojas de 20% apenas.
  3. `GET ...?discount=45&startDate=2026-02-01&endDate=2026-03-01` — espera fim exclusivo aplicado (CA-02).
  4. `GET ...?order=asc` — espera ordenação crescente.
  5. `GET ...?discount=99&...` — espera `200` com `[]` (CA-05).
  6. `GET ...` sem `discount` — espera `400`.
  7. `GET ...?endDate=2026-01-01&startDate=2026-02-01` — espera `400` (período invertido).
- **Preparação:** sobe o Fastify com o banco de teste (via `docker compose up --build`), executa seed.
- **Entrada:** requisições HTTP reais via `fastify.inject()` ou `supertest`.
- **Resultado esperado:** status code e body JSON conforme cada caso.

## 4. Banco relacional

- **Dialeto:** PostgreSQL.
- **Caminho da migration:** `migrations/0001_create_stores_and_coupons.sql` e `migrations/0002_seed_data.sql`.
- **Tabelas:**
  - `stores(id SERIAL PK, name TEXT NOT NULL)`
  - `coupons(id SERIAL PK, store_id INTEGER NOT NULL FK -> stores(id), name TEXT NOT NULL, discount_percent INTEGER NOT NULL, category TEXT NOT NULL, description TEXT NOT NULL, detected_at TIMESTAMPTZ NOT NULL)`
- **Índices:**
  - `idx_coupons_discount_detected` em `coupons(discount_percent, detected_at)` — justifica filtro `discount_percent = ? AND detected_at BETWEEN ? AND ?`.
  - `idx_coupons_store_id` em `coupons(store_id)` — justifica JOIN e `GROUP BY store_id`.
- **Consultas:** uma única consulta com JOIN, WHERE, GROUP BY, ORDER BY.
- **Transações:** leitura apenas; não requer transação explícita para esta fase.
- **Concorrência:** leitura de dados estáticos (seed); sem conflitos de escrita esperados nesta fase.
- **Idempotência:** seed usa `ON CONFLICT (id) DO NOTHING`; migrations usam `CREATE TABLE IF NOT EXISTS`.
- **Compatibilidade com dados existentes:** não aplica (banco inicial vazio).
- **Backfill:** não aplica.
- **Rollback:** `DROP TABLE coupons; DROP TABLE stores;` para a migration 1; `DELETE FROM coupons; DELETE FROM stores;` para a migration 2.

## 5. Fases de implementação

### F01 — Infraestrutura de banco, Docker Compose e seed

- **ID:** F01
- **Título:** Banco, Docker Compose, migrations e seed
- **Objetivo:** Criar tabelas `stores` e `coupons`, índices, orchestrar PostgreSQL e aplicação via Docker Compose, e inserir o seed de 20 registros.
- **Dependências:** setup do projeto (package.json, tsconfig).
- **Condição de entrada:** repositório vazio ou com setup básico.
- **Arquivos permitidos:**
  - `docker-compose.yml` — CRIAR
  - `Dockerfile` — CRIAR
  - `.env.example` — CRIAR
  - `migrations/0001_create_stores_and_coupons.sql` — CRIAR
  - `migrations/0002_seed_data.sql` — CRIAR
  - `src/config/db.ts` — CRIAR
  - `src/repositories/coupon.repository.ts` — CRIAR (apenas assinatura e consulta inicial, sem lógica de negócio além do SELECT base)
  - `src/seed.ts` — CRIAR
- **Etapas:**
  - IMP-01: Criar `docker-compose.yml` com serviços `db` (PostgreSQL 15) e `app` (Node.js).
  - IMP-02: Criar `Dockerfile` para a aplicação.
  - IMP-03: Criar `.env.example` com variáveis de ambiente.
  - IMP-04: Criar migration 0001 com tabelas e índices.
  - IMP-05: Criar migration 0002 com seed de 5 lojas e 20 cupons.
  - IMP-06: Criar `src/config/db.ts` com pool PostgreSQL lendo `DATABASE_URL`.
  - IMP-07: Criar `src/repositories/coupon.repository.ts` com `findRankedStoresByCoupons`.
  - IMP-08: Criar `src/seed.ts` com `runSeed`.
- **Comportamento a preservar:** nada (fase inicial).
- **Fora da fase:** rota HTTP, serviço `rankStoresByCoupons`, testes.
- **Testes previstos:** nenhum automatizado nesta fase; verificação manual subindo os containers e consultando o banco.
- **Comandos de verificação:**
  - `docker compose up --build db` → container PostgreSQL sobe na porta 5432.
  - `docker compose up --build` → ambos os serviços sobem e a aplicação responde na porta 3000.
  - `docker compose exec db psql -U cuponlab -d cuponlab -c "SELECT COUNT(*) FROM stores;"` → `5`.
  - `docker compose exec db psql -U cuponlab -d cuponlab -c "SELECT COUNT(*) FROM coupons;"` → `20`.
- **Critérios de aceite atendidos:** RF-08, RN-01.
- **Condição de conclusão:** containers subindo com `docker compose up`, banco com tabelas e seed populados, contagens conferidas manualmente via `psql`.
- **Commit proposto:** `feat(infra): adiciona docker-compose, migrations e seed inicial`

### F02 — Rota HTTP e validação de entrada

- **ID:** F02
- **Título:** Rota GET /reports/coupons/by-store
- **Objetivo:** Expor a rota Fastify com validação de parâmetros de query.
- **Dependências:** F01.
- **Condição de entrada:** banco e seed funcionando.
- **Arquivos permitidos:**
  - `src/app.ts` — CRIAR
  - `src/routes/reports.ts` — CRIAR
  - `package.json` — ALTERAR (adicionar dependências Fastify)
- **Etapas:**
  - IMP-06: Criar `src/app.ts` com instância Fastify.
  - IMP-07: Criar `src/routes/reports.ts` com a rota `GET /reports/coupons/by-store`.
  - IMP-08: Implementar validação de query params (`discount`, `startDate`, `endDate`, `order`).
  - IMP-09: Conectar rota ao repositório (chamada direta a `findRankedStoresByCoupons` antes do serviço existir, ou placeholder). Nota: para evitar imports quebrados, a rota chama o repositório diretamente nesta fase; o serviço é introduzido em F03 e a rota é refatorada para usá-lo.
- **Comportamento a preservar:** consulta SQL do repositório criada em F01.
- **Fora da fase:** serviço `rankStoresByCoupons` (introduzido em F03), testes automatizados.
- **Testes previstos:** nenhum automatizado nesta fase; verificação manual com `docker compose exec app curl` ou cliente HTTP.
- **Comandos de verificação:**
  - `docker compose up --build` → ambos os serviços sobem.
  - `curl "http://localhost:3000/reports/coupons/by-store?discount=45&startDate=2026-01-01T00:00:00Z&endDate=2026-04-01T00:00:00Z"` → retorna JSON com array.
  - `curl "http://localhost:3000/reports/coupons/by-store"` (sem parâmetros) → `400`.
- **Critérios de aceite atendidos:** RF-01, RF-07 (parcial, sem serviço ainda).
- **Condição de conclusão:** rota responde `200` com dados do banco e `400` para parâmetros ausentes.
- **Commit proposto:** `feat(api): rota GET /reports/coupons/by-store com validação de query`

### F03 — Serviço de negócio rankStoresByCoupons

- **ID:** F03
- **Título:** Serviço reutilizável de ranking
- **Objetivo:** Extrair a regra de negócio para `rankStoresByCoupons`, separado da rota.
- **Dependências:** F01, F02.
- **Condição de entrada:** rota e repositório existentes.
- **Arquivos permitidos:**
  - `src/services/rankStoresByCoupons.ts` — CRIAR
  - `src/routes/reports.ts` — ALTERAR (refatorar para usar o serviço)
- **Etapas:**
  - IMP-10: Criar `src/services/rankStoresByCoupons.ts` com a função `rankStoresByCoupons` (valida `endDate > startDate`, chama repositório).
  - IMP-11: Refatorar `src/routes/reports.ts` para importar e chamar `rankStoresByCoupons` em vez do repositório diretamente.
- **Comportamento a preservar:** resposta da rota inalterada (mesmo formato JSON, mesmos códigos de status).
- **Fora da fase:** alterações no banco, novos endpoints.
- **Testes previstos:** nenhum automatizado nesta fase; os testes de F04 cobrem este serviço.
- **Comandos de verificação:**
  - `docker compose exec app npx tsc --noEmit` → sem erros de tipo.
  - `docker compose up --build` → subir containers.
  - `curl "http://localhost:3000/reports/coupons/by-store?discount=45&startDate=2026-01-01T00:00:00Z&endDate=2026-04-01T00:00:00Z"` → mesmo resultado de F02.
- **Critérios de aceite atendidos:** RF-04, RF-05, RF-06, RN-02, RN-03, RN-04.
- **Condição de conclusão:** serviço existe, rota o usa, `tsc --noEmit` passa.
- **Commit proposto:** `feat(service): adiciona rankStoresByCoupons separado da rota`

### F04 — Testes e critérios de aceite

- **ID:** F04
- **Título:** Testes automatizados e validação dos CA
- **Objetivo:** Implementar testes para filtro de desconto, filtro de período, ordenação, empate e resultado vazio.
- **Dependências:** F01, F02, F03.
- **Condição de entrada:** serviço e rota funcionando.
- **Arquivos permitidos:**
  - `tests/rankStoresByCoupons.test.ts` — CRIAR
  - `tests/reports.route.test.ts` — CRIAR
  - `package.json` — ALTERAR (adicionar scripts e dependências de teste)
- **Etapas:**
  - IMP-12: Adicionar dependências de teste ao `package.json` (vitest ou jest, supertest ou fastify inject).
  - IMP-13: Criar `tests/rankStoresByCoupons.test.ts` com os 6 casos listados no manifesto.
  - IMP-14: Criar `tests/reports.route.test.ts` com os 7 casos listados no manifesto.
  - IMP-15: Configurar script `test` no `package.json`.
  - IMP-16: Executar `docker compose exec app npm test` e corrigir falhas.
- **Comportamento a preservar:** seed e regras de negócio não são alterados pelos testes.
- **Fora da fase:** novas funcionalidades de negócio.
- **Testes previstos:** todos listados acima.
- **Comandos de verificação:**
  - `docker compose exec app npm test` (ou `npx vitest run`, conforme definido no package.json) → todos os testes passam.
  - Especificamente: CA-01, CA-02, CA-03, CA-04, CA-05, CA-06 verdes.
- **Critérios de aceite atendidos:** CA-01 a CA-06, RNF-01 (se incluir verificação de tempo).
- **Condição de conclusão:** todos os testes passam; ranking conferível contra o seed.
- **Commit proposto:** `test: adiciona testes para filtro, ordenação, empate e resultado vazio`

## 6. Controle de complexidade

- `rankStoresByCoupons` tem um único caminho de decisão: valida `endDate > startDate` e delega a consulta para o repositório. Sem aninhamento desnecessário.
- A validação de query params na rota usa guard clauses (retorno antecipado de `400`) para evitar aninhamento.
- A agregação é feita no banco via SQL (`GROUP BY`, `COUNT`, `ORDER BY`), evitando loops e ordenação em memória no TypeScript.
- Não há fragmentos de função desnecessários nem abstrações criadas apenas por métrica.

## Mensagens de commit propostas (resumo)

1. `feat(db): cria tabelas stores e coupons com seed inicial`
2. `feat(api): rota GET /reports/coupons/by-store com validação de query`
3. `feat(service): adiciona rankStoresByCoupons separado da rota`
4. `test: adiciona testes para filtro, ordenação, empate e resultado vazio`

As mensagens seguem Conventional Commits (`tipo(escopo): descrição`). A aprovação deste plano não autoriza execução de commits.

---

**Pergunta para aprovação:** Você confirma este plano (revisão 1) para execução? Se houver ajuste em nomes de arquivos, scripts do package.json ou escolha de framework de teste, informe antes de avançar.
