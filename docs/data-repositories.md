# Repositórios de dados e integração com a API

Este guia descreve como o frontend acessa dados financeiros, o contrato esperado da API externa e como trocar ou criar uma implementação de repositório sem acoplar componentes ao HTTP.

## Arquitetura

O fluxo de dependências é:

```text
Componentes Vue → Pinia store → FinanceRepository → Mock (localStorage) ou API REST
```

- Componentes lidam apenas com ações e estado de tela.
- O store coordena carregamento, atualização e mensagens de erro.
- `FinanceRepository` define as operações de persistência em termos do domínio.
- Adaptadores traduzem essas operações para `localStorage`, HTTP ou outra fonte futura.
- A API é a fonte de verdade para persistência, validação e geração de recorrências em produção.

O store solicita categorias, lançamentos e ocorrências separadamente e só publica o novo estado depois que todas as respostas terminam. Assim, uma falha isolada não deixa a tela com recursos de momentos diferentes.

## Escolhendo a fonte de dados

Copie `.env.example` para `.env.local` e escolha uma fonte:

```dotenv
VITE_DATA_SOURCE=mock
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

| Variável            | Valores         | Comportamento                                                                                     |
| ------------------- | --------------- | ------------------------------------------------------------------------------------------------- |
| `VITE_DATA_SOURCE`  | `mock` ou `api` | Usa `mock` por padrão. Valores diferentes interrompem a inicialização com uma mensagem explícita. |
| `VITE_API_BASE_URL` | URL absoluta    | Obrigatória quando a fonte é `api`. Deve incluir `/api/v1`.                                       |

Reinicie `npm run dev` após alterar variáveis Vite. Não coloque segredos nessas variáveis: todo valor `VITE_*` é incorporado ao código entregue ao navegador.

## Interface do repositório

`FinanceRepository` é o contrato consumido pelo store:

| Método                               | Garantia                                                                       |
| ------------------------------------ | ------------------------------------------------------------------------------ |
| `getCategories()`                    | Retorna todas as categorias.                                                   |
| `getEntries()`                       | Retorna as definições dos lançamentos e suas recorrências.                     |
| `getOccurrences()`                   | Retorna todas as ocorrências já geradas.                                       |
| `ensureOccurrencesThroughYear(year)` | Gera ocorrências ausentes até dezembro do ano informado; deve ser idempotente. |
| `createEntry(input)`                 | Cria e retorna o lançamento persistido.                                        |
| `updateEntry(id, input)`             | Atualiza parcialmente e retorna o lançamento persistido.                       |
| `deleteEntry(id)`                    | Exclui o lançamento e todas as suas ocorrências.                               |
| `updateOccurrenceStatus(id, status)` | Atualiza e retorna a ocorrência persistida.                                    |

Objetos retornados devem ser independentes da memória interna do adaptador. Valores monetários usam centavos inteiros: `4590` significa R$ 45,90. Datas civis usam `YYYY-MM-DD`, meses usam `YYYY-MM` e timestamps, quando adicionados, devem usar ISO 8601 UTC.

### Criando outro adaptador

1. Crie uma classe que implemente `FinanceRepository`.
2. Mantenha detalhes de transporte, DTOs e autenticação dentro do adaptador.
3. Converta DTOs para os tipos de domínio antes de devolver dados ao store.
4. Converta falhas externas para `RepositoryError`.
5. Adicione a nova opção à factory `createFinanceRepository`.
6. Execute a suíte de contrato do repositório e os testes específicos do transporte.

Exemplo mínimo:

```ts
class OtherFinanceRepository implements FinanceRepository {
    async getCategories() {
        const records = await externalClient.listCategories()
        return records.map(toDomainCategory)
    }

    // Implemente os demais métodos com as mesmas garantias da interface.
}
```

Não importe esse adaptador diretamente no store. A factory em `src/repositories/index.ts` é o único ponto que escolhe a implementação.

## Contrato REST `/api/v1`

Respostas de sucesso são objetos ou arrays JSON diretos, sem envelope `data`. Endpoints que não retornam corpo usam `204 No Content`.

### Categorias e leituras

```http
GET /api/v1/categories
GET /api/v1/entries
GET /api/v1/occurrences
Accept: application/json
```

Cada endpoint retorna `200 OK` e um array do recurso correspondente. A primeira versão não usa paginação.

Categoria:

```json
{
    "id": "subscriptions",
    "name": "Assinaturas",
    "type": "expense",
    "backgroundColor": "#27272a",
    "foregroundColor": "#f4f4f5",
    "markerName": "circle"
}
```

Lançamento:

```json
{
    "id": "streaming",
    "description": "Streaming",
    "type": "expense",
    "categoryId": "subscriptions",
    "amountInCents": 4590,
    "startDate": "2026-02-15",
    "recurrenceType": "monthly",
    "account": "Cartão principal"
}
```

`type` aceita `income` ou `expense`. `recurrenceType` aceita `single`, `installment` ou `monthly`. Lançamentos parcelados também informam `initialInstallment` e `installmentCount`.

Ocorrência:

```json
{
    "id": "streaming:2026-07:r",
    "entryId": "streaming",
    "referenceMonth": "2026-07",
    "amountInCents": 4590,
    "status": "planned"
}
```

`status` aceita `planned`, `paid` ou `received`. Despesas não podem ser `received` e receitas não podem ser `paid`. Uma ocorrência concluída pode informar `completedAt` em `YYYY-MM-DD`.

### Geração de recorrências

```http
POST /api/v1/occurrences/ensure-year
Content-Type: application/json

{ "year": 2027 }
```

Retorna `204 No Content`. A operação deve ser idempotente: repeti-la não cria duplicatas nem altera ocorrências concluídas. A API gera lançamentos mensais até dezembro do ano solicitado e respeita limites de parcelas.

### Criar, editar e excluir lançamentos

```http
POST /api/v1/entries
Content-Type: application/json

{
    "description": "Internet",
    "type": "expense",
    "categoryId": "home",
    "amountInCents": 9000,
    "startDate": "2026-01-10",
    "recurrenceType": "monthly"
}
```

Retorna `201 Created` com o lançamento completo, incluindo `id`.

```http
PATCH /api/v1/entries/{id}
DELETE /api/v1/entries/{id}
```

`PATCH` recebe qualquer subconjunto válido dos campos de criação e retorna `200 OK` com o recurso completo. Campos omitidos são preservados. `DELETE` retorna `204 No Content` e remove também as ocorrências relacionadas.

### Atualizar uma ocorrência

```http
PATCH /api/v1/occurrences/{id}/status
Content-Type: application/json

{ "status": "paid" }
```

Retorna `200 OK` com a ocorrência completa. Ao voltar para `planned`, `completedAt` deve ser removido; ao concluir, a API define a data efetiva.

## Erros

Falhas usam `Content-Type: application/problem+json`:

```json
{
    "type": "https://api.example.com/problems/validation-error",
    "title": "Dados inválidos",
    "status": 422,
    "detail": "Um ou mais campos precisam ser corrigidos.",
    "code": "VALIDATION_ERROR",
    "errors": {
        "amountInCents": ["Deve ser um inteiro maior que zero."]
    }
}
```

| Status | Uso                                                                  |
| ------ | -------------------------------------------------------------------- |
| `400`  | JSON ou parâmetros malformados.                                      |
| `404`  | Lançamento, ocorrência ou categoria inexistente.                     |
| `409`  | Operação em conflito com o estado atual.                             |
| `422`  | Dados válidos como JSON, mas incompatíveis com as regras de domínio. |
| `500`  | Falha inesperada da API.                                             |

O adaptador converte essas respostas em `RepositoryError`. Falhas de conexão usam `NETWORK_ERROR`; respostas de sucesso com JSON inválido usam `INVALID_RESPONSE`.

## Checklist da API externa

- Expor todos os endpoints e enums exatamente como documentados.
- Trabalhar com centavos inteiros e rejeitar valores fracionários ou não positivos.
- Garantir exclusão em cascata das ocorrências de um lançamento.
- Tornar a geração por ano idempotente e preservar ocorrências concluídas.
- Retornar Problem Details para falhas de validação e domínio.
- Configurar CORS para a origem usada pelo Vite em desenvolvimento e pela aplicação em produção.
- Validar a integração com `VITE_DATA_SOURCE=api npm run dev` e executar o fluxo de criar, editar, concluir e excluir um lançamento.

Autenticação está fora da primeira versão. Quando for adicionada, deve entrar como dependência do cliente HTTP ou provedor de token, sem alterar `FinanceRepository`.
