# Domain: Resources

Resource modeling is the foundation: get the nouns right and everything downstream (paths, payloads,
permissions) gets easier. Get them wrong and every endpoint inherits the confusion.

## Find the nouns, then their relationships

1. Inventory the domain's nouns (users, orders, invoices, jobs) — the things consumers talk about,
   not the database tables. One resource = one noun a consumer can name.
2. Model relationships explicitly: ownership (order → user), composition (order → items), reference
   (invoice → order). Cardinality decides nesting (see below).
3. Singular vs collection: collections get plural names (`/users`), singletons the singular
   (`/users/{id}/profile` where there's exactly one).

## Path design

- **Methods are the verbs, paths are the nouns.** `POST /orders` (create), `GET /orders/{id}` (read),
  `PATCH /orders/{id}` (update), `DELETE /orders/{id}` (delete). Never `GET /getOrders`.
- **Nest at most 2 levels** (`/users/{id}/orders` is fine; `/users/{id}/orders/{id}/items` is not).
  Deeper relations become top-level endpoints with filters: `GET /items?order_id=...`.
- **Actions, not verbs:** subresource actions that aren't CRUD get a gerund-named subresource:
  `POST /orders/{id}/cancellation` (a thing you create), not `POST /orders/{id}/cancel`.
- **IDs in paths, filters in queries.** Identity → path; everything that varies the *view* → query
  parameters (`?status=open&sort=-created`).

## What deserves an endpoint

- Design for the consumer's jobs, not CRUD ritual. If nobody lists all 90,000 rows, don't build the
  unpaginated list — build `GET /orders?customer_id=...` instead.
- One endpoint per question. "Order with items" is `GET /orders/{id}?expand=items` — not a second
  endpoint with a different shape.
- Read/write asymmetry is fine: consumers may need a rich write shape (`createOrder`) and a lean read
  shape (`getOrder`) — the *resource* is the same, the representations differ.

## GraphQL & RPC notes

- GraphQL: the type graph *is* the resource model — names matter even more (types are in every query).
  Design the schema as the public vocabulary; resolver structure follows.
- gRPC/RPC: services group operations by *ownership*, not by data shape; one service owns one
  lifecycle (`OrderService.Create`), and messages are the resources.

## Bans (recap)

Verbs in paths, nesting >2, endpoints that mirror tables, CRUD ritual nobody uses, singletons that
are actually collections, identity in the query string when it belongs in the path.
