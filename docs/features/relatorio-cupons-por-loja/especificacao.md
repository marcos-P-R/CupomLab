# Especificação: Relatório de cupons por loja

- **Título:** Ranking de lojas por cupons detectados
- **Slug:** `relatorio-cupons-por-loja`
- **Revisão:** 2
- **Situação:** rascunho

## Problema

Hoje não existe consulta que responda "quais lojas detetaram mais cupons de um determinado percentual de desconto em um período". O usuário precisa desse recorte para avaliar o desempenho das lojas sem recorrer a coleta na web, Excel ou IA.

## Objetivo

Entregar a rota `GET /reports/coupons/by-store` que filtre cupons por percentual exato de desconto e intervalo de datas, agrupe por loja, retorne o ranking ordenado pelo total de cupons e desempate pelo ID da loja. O resultado deve ser conferível manualmente contra o seed.

## Escopo e fora de escopo

### Dentro do escopo

- Tabelas `stores` e `coupons` em PostgreSQL.
- Rota `GET /reports/coupons/by-store` com parâmetros de query em inglês: `discount` (percentual exato), `startDate` (data de início, inclusive), `endDate` (data de fim, exclusive) e `order` (`asc` | `desc`).
- Serviço reutilizável `rankStoresByCoupons` separado da rota.
- Seed de 20 registros fictícios (5 lojas, 20 cupons).
- Testes de filtro de desconto, filtro de período, ordenação, empate e resultado vazio.

### Fora de escopo

- Chat, modelos de IA, linguagem natural.
- Exportação Excel.
- Jobs de coleta na web.
- Autenticação e autorização nesta fase.

## Atores e permissões de negócio

- **Usuário da API:** consulta o ranking sem autenticação nesta fase.
- Não há níveis de permissão definidos.

## Fluxo principal

1. O usuário chama `GET /reports/coupons/by-store?discount=45&startDate=2026-01-01T00:00:00Z&endDate=2026-04-01T00:00:00Z&order=desc`.
2. O serviço `rankStoresByCoupons` filtra cupons com `discount_percent` igual ao informado e `detected_at` no intervalo [startDate, endDate).
3. Agrupa por `store_id`, conta cupons por loja.
4. Ordena pelo total decrescente; em caso de empate, ordena por `store_id` crescente.
5. Retorna array de objetos com `store_id`, `store_name` e `total_coupons`. Lojas sem cupons no recorte não aparecem.

## Fluxos alternativos

- **Ordem crescente:** mesma lógica, mas ordena pelo total crescente; desempate continua por `store_id` crescente.
- **Resultado vazio:** quando nenhum cupom corresponde ao percentual e período, retorna `200` com array vazio `[]`.
- **Parâmetros ausentes:** quando `discount`, `startDate` ou `endDate` não são informados, a rota responde com erro de requisição inválida (ex: `400`).
- **Período invertido:** quando `endDate` é anterior ou igual a `startDate`, a rota responde com erro de requisição inválida.

## Requisitos funcionais

- **RF-01:** A rota `GET /reports/coupons/by-store` deve aceitar `discount` (número inteiro), `startDate` (ISO 8601), `endDate` (ISO 8601) e `order` (`asc` | `desc`, padrão `desc`).
- **RF-02:** O filtro de desconto deve ser exato: apenas cupons com `discount_percent` igual ao informado entram no recorte.
- **RF-03:** O intervalo de datas deve usar início inclusivo (`detected_at >= startDate`) e fim exclusivo (`detected_at < endDate`).
- **RF-04:** O serviço `rankStoresByCoupons` deve agrupar cupons filtrados por loja e retornar o total por loja.
- **RF-05:** O ranking deve ordenar pelo total de cupons; empates devem desempatar pelo ID da loja em ordem crescente.
- **RF-06:** Lojas com zero cupons no recorte não devem aparecer no resultado.
- **RF-07:** Quando não há cupons para os parâmetros informados, a resposta deve ser `200` com array vazio.
- **RF-08:** O seed deve conter exatamente 5 lojas e 20 cupons, com resultados conferíveis manualmente.

## Regras de negócio

- **RN-01:** Um cupom pertence a exatamente uma loja.
- **RN-02:** O percentual de desconto é comparado por igualdade exata, não por intervalo.
- **RN-03:** Um cupom com `detected_at` igual a `endDate` está fora do recorte (fim exclusivo).
- **RN-04:** Um cupom com `detected_at` igual a `startDate` está dentro do recorte (início inclusivo).

## Requisitos não funcionais

- **RNF-01:** A consulta deve retornar em menos de 200 ms para o seed de 20 registros.

## Dados conceituais

### Entidade: Loja
- Identificador único.
- Nome da loja.

### Entidade: Cupom
- Identificador único.
- Referência à loja proprietária.
- Nome do cupom.
- Percentual de desconto (número inteiro).
- Categoria.
- Descrição.
- Data de detecção (timestamp).

### Estados e eventos
- Um cupom é criado associado a uma loja existente.
- Não há estados de ativação/expiração nesta fase.

## Seed de dados (20 registros)

### Lojas (5)

| id | name |
|----|------|
| 1 | Mercado A |
| 2 | Farmácia B |
| 3 | Livraria C |
| 4 | Pet Shop D |
| 5 | Eletro E |

### Cupons (20)

| id | store_id | name | discount_percent | category | description | detected_at |
|----|----------|------|------------------|----------|-------------|-------------|
| 1 | 1 | Cupom Mercado A 45% jan | 45 | Supermercado | Desconto geral | 2026-01-10T10:00:00Z |
| 2 | 1 | Cupom Mercado A 45% jan 2 | 45 | Supermercado | Desconto geral | 2026-01-15T10:00:00Z |
| 3 | 1 | Cupom Mercado A 20% jan | 20 | Supermercado | Desconto limitado | 2026-01-20T10:00:00Z |
| 4 | 1 | Cupom Mercado A 45% fev | 45 | Supermercado | Desconto geral | 2026-02-05T10:00:00Z |
| 5 | 1 | Cupom Mercado A 45% mar | 45 | Supermercado | Desconto geral | 2026-03-01T10:00:00Z |
| 6 | 2 | Cupom Farmácia B 45% fev | 45 | Saúde | Desconto medicamentos | 2026-02-01T10:00:00Z |
| 7 | 2 | Cupom Farmácia B 10% fev | 10 | Saúde | Desconto cosméticos | 2026-02-10T10:00:00Z |
| 8 | 2 | Cupom Farmácia B 45% mar | 45 | Saúde | Desconto medicamentos | 2026-03-15T10:00:00Z |
| 9 | 2 | Cupom Farmácia B 45% abr | 45 | Saúde | Desconto medicamentos | 2026-04-01T10:00:00Z |
| 10 | 3 | Cupom Livraria C 45% jan | 45 | Livros | Desconto lançamentos | 2026-01-20T10:00:00Z |
| 11 | 3 | Cupom Livraria C 30% fev | 30 | Livros | Desconto estoque | 2026-02-01T10:00:00Z |
| 12 | 3 | Cupom Livraria C 45% fev | 45 | Livros | Desconto lançamentos | 2026-02-20T10:00:00Z |
| 13 | 4 | Cupom Pet Shop D 15% jan | 15 | Pet | Ração | 2026-01-10T10:00:00Z |
| 14 | 4 | Cupom Pet Shop D 50% jan | 50 | Pet | Acessórios | 2026-01-20T10:00:00Z |
| 15 | 4 | Cupom Pet Shop D 20% mar | 20 | Pet | Banho e tosa | 2026-03-01T10:00:00Z |
| 16 | 5 | Cupom Eletro E 45% jan | 45 | Eletrônicos | TVs | 2026-01-05T10:00:00Z |
| 17 | 5 | Cupom Eletro E 10% fev | 10 | Eletrônicos | Celulares | 2026-02-15T10:00:00Z |
| 18 | 5 | Cupom Eletro E 45% mar | 45 | Eletrônicos | TVs | 2026-03-10T10:00:00Z |
| 19 | 5 | Cupom Eletro E 45% mar 2 | 45 | Eletrônicos | TVs | 2026-03-20T10:00:00Z |
| 20 | 5 | Cupom Eletro E 30% abr | 30 | Eletrônicos | Eletrodomésticos | 2026-04-05T10:00:00Z |

### Exemplo de recorte conferível

Parâmetros: `discount=45`, `startDate=2026-01-01T00:00:00Z`, `endDate=2026-04-01T00:00:00Z`, `order=desc`.

Cupons elegíveis: 1, 2, 4, 5 (loja 1), 6, 8 (loja 2), 10, 12 (loja 3), 16, 18, 19 (loja 5).

Resultado esperado:

| store_id | store_name | total_coupons |
|----------|------------|---------------|
| 1 | Mercado A | 4 |
| 5 | Eletro E | 3 |
| 2 | Farmácia B | 2 |
| 3 | Livraria C | 2 |

Loja 4 não aparece (sem cupons de 45% no recorte). Cupom 9 (loja 2) está fora pelo fim exclusivo em 2026-04-01. Cupom 20 (loja 5) está fora pelo percentual 30 e pela data.

## Critérios de aceite

- **CA-01 (filtro de desconto):** Dado o seed, quando consultado `discount=20` em qualquer período que inclua as datas dos cupons de 20%, então apenas lojas com cupons de 20% aparecem, com contagem correta. Vinculado a RF-02, RN-02.
- **CA-02 (filtro de período):** Dado o seed, quando consultado `discount=45`, `startDate=2026-02-01T00:00:00Z`, `endDate=2026-03-01T00:00:00Z`, então o cupom 5 (2026-03-01) está fora pelo fim exclusivo e o cupom 6 (2026-02-01) está dentro pelo início inclusivo. Vinculado a RF-03, RN-03, RN-04.
- **CA-03 (ordenação):** Dado o seed, quando consultado `discount=45`, `startDate=2026-01-01T00:00:00Z`, `endDate=2026-04-01T00:00:00Z`, `order=desc`, então o resultado está ordenado por total decrescente. Vinculado a RF-05.
- **CA-04 (empate):** Dado o seed, no mesmo recorte acima, quando lojas 2 e 3 empatam com 2 cupons cada, então a loja 2 aparece antes da loja 3 pelo desempate de ID crescente. Vinculado a RF-05.
- **CA-05 (resultado vazio):** Dado o seed, quando consultado `discount=99` em qualquer período, então a resposta é `200` com `[]`. Vinculado a RF-07, RF-06.
- **CA-06 (seed conferível):** Dado o seed de 5 lojas e 20 cupons, quando consultado `discount=45`, `startDate=2026-01-01T00:00:00Z`, `endDate=2026-04-01T00:00:00Z`, `order=desc`, então o resultado corresponde à tabela de exemplo desta especificação. Vinculado a RF-08.

## Decisões confirmadas

- Stack: Fastify, TypeScript, PostgreSQL.
- Rota: `GET /reports/coupons/by-store`.
- Serviço reutilizável: `rankStoresByCoupons`.
- Intervalo: início inclusivo, fim exclusivo.
- Desempate: ID da loja crescente.
- Lojas sem cupons no recorte: excluídas.
- Ordem padrão: `desc`.
- Resposta vazia: `200` com `[]`.
- Sem autenticação nesta fase.

## Premissas

- O banco PostgreSQL está disponível para execução dos testes e seed.
- O percentual de desconto é tratado como número inteiro.

## Pendências que bloqueiam o avanço

- Nenhuma. Todas as decisões de negócio foram confirmadas.



