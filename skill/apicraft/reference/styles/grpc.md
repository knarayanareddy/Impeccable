# Style sheet: gRPC / RPC

Loaded with `domains/resources.md` and `domains/specs.md` when the API is gRPC (or another RPC
style). The style-native specifics; the compass domains still hold.

## Services and messages are the vocabulary

- One service owns one lifecycle (`OrderService.Create`, `.Get`, `.Cancel` — verbs *in* the
  service, ownership in the name); a service that owns two lifecycles is two services
  (`domains/resources.md`'s ownership rule).
- Message names are permanent; field names are permanent; **field numbers are permanent**
  (`reserved` for every removed number and name — a reused number silently corrupts all
  existing serialized data).
- Request/response pairs per operation, never shared mutable envelopes — a shared response
  type that gains a field for one caller changes the contract for all.

## Evolution (additive with reserved)

- Add fields with new numbers: free. Add methods to a service: free.
- Remove or renumber a field, rename a field, or change a type: breaking — reserve the number
  and name, ship the replacement field, deprecate in the proto comments
  (`versioning.md`'s ledger applies verbatim).
- `buf breaking` (or the platform's equivalent) runs in CI; breaking diffs fail unless the
  change is the release's stated purpose.

## Errors and idempotency

- The platform's status codes are the error vocabulary — map domain errors to the standard
  codes (the gRPC status + details pairing: a machine-readable `details` message carries the
  domain error code, the status carries the class), never string-compare error text
  (`domains/errors.md`'s codes-not-messages rule).
- Mutating RPCs state their idempotency: natural idempotency (PUT-like full replace) or an
  explicit idempotency-key field in the request (`domains/idempotency.md` — the key is a field,
  not a header, here).

## Deadlines are part of the contract

- Every RPC carries a deadline (client-set, propagated); servers honor it and cancel work
  (`context` everywhere). An RPC without deadline handling is a hang waiting for a network
  partition (`perfcraft`'s latency domain agrees).

## Bans

Field-number reuse, shared mutable envelopes, stringly error matching, deadline-less RPCs,
breaking proto diffs shipped silently, services owning two lifecycles.
