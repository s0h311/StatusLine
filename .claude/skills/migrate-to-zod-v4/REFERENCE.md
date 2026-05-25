# Zod v3 → v4 — Full reference

Companion to [SKILL.md](SKILL.md). Covers the long-tail changes.

## Error customization — full picture

`error` is the single unified param. It accepts:

```ts
// 1. a string
z.string().min(5, { error: 'Too short.' })

// 2. a function returning string | undefined
z.string().min(5, {
  error: (issue) => (issue.code === 'too_small' ? `Need >${issue.minimum}` : undefined),
})
```

Returning `undefined` yields control to the next error map in the chain. Returning a string sets the message. Returning `{ message }` (the v3 errorMap shape) is no longer the expected form — return the bare string.

**Precedence**: schema-level `error` now beats parse-call `error`. Audit any `.parse(x, { error })` calls — the override no longer wins.

## ZodError

`.errors` removed → `.issues`.
`.format()` and `.flatten()` deprecated → `z.treeifyError(err)`.
`.formErrors` removed (was identical to `.flatten()`).
`.addIssue(x)` / `.addIssues(xs)` deprecated → `err.issues.push(x)`.

Issue codes — most renamed under `z.core.$ZodIssue*`:

| v3                                             | v4                                             |
| ---------------------------------------------- | ---------------------------------------------- |
| `ZodInvalidTypeIssue`                          | `z.core.$ZodIssueInvalidType`                  |
| `ZodTooBigIssue`                               | `z.core.$ZodIssueTooBig`                       |
| `ZodTooSmallIssue`                             | `z.core.$ZodIssueTooSmall`                     |
| `ZodInvalidStringIssue`                        | `z.core.$ZodIssueInvalidStringFormat`          |
| `ZodNotMultipleOfIssue`                        | `z.core.$ZodIssueNotMultipleOf`                |
| `ZodUnrecognizedKeysIssue`                     | `z.core.$ZodIssueUnrecognizedKeys`             |
| `ZodInvalidUnionIssue`                         | `z.core.$ZodIssueInvalidUnion`                 |
| `ZodCustomIssue`                               | `z.core.$ZodIssueCustom`                       |
| `ZodInvalidEnumValueIssue`                     | merged → `$ZodIssueInvalidValue`               |
| `ZodInvalidLiteralIssue`                       | merged → `$ZodIssueInvalidValue`               |
| `ZodInvalidDateIssue`                          | merged → `$ZodIssueInvalidType`                |
| `ZodNotFiniteIssue`                            | merged → `$ZodIssueInvalidType`                |
| `ZodInvalidUnionDiscriminatorIssue`            | gone — thrown at schema-creation time          |
| `ZodInvalidArgumentsIssue` / `ReturnTypeIssue` | gone — `z.function` throws `ZodError` directly |
| `ZodInvalidIntersectionTypesIssue`             | gone — throws plain `Error`                    |

Base interface unchanged:

```ts
interface $ZodIssueBase {
  readonly code?: string
  readonly input?: unknown
  readonly path: PropertyKey[]
  readonly message: string
}
```

## `.default()` vs `.prefault()`

```ts
// v3 — default is parsed through the chain
z.string()
  .transform((v) => v.length)
  .default('tuna')
  .parse(undefined) // 4

// v4 — default short-circuits, must match OUTPUT type
z.string()
  .transform((v) => v.length)
  .default(0)
  .parse(undefined) // 0

// v4 — to replicate v3 semantics:
z.string()
  .transform((v) => v.length)
  .prefault('tuna')
  .parse(undefined) // 4
```

Rule of thumb when migrating: if the default value was an INPUT-shape, switch to `.prefault()`. If it was already in the output shape, `.default()` still works.

## `z.function()` — new API

```ts
// v3
const fn = z
  .function()
  .args(z.object({ name: z.string() }))
  .returns(z.string())

// v4
const fn = z.function({
  input: [z.object({ name: z.string() })],
  output: z.string(),
})

fn.implement((input) => `Hello ${input.name}`)
fn.implementAsync(async (input) => `Hello ${input.name}`)
```

`z.function()` no longer returns a Zod schema — it's a function factory. There is no direct `z.infer<...>` for it; if you really need a function-typed schema, restructure.

## `z.record()`

```ts
z.record(z.string()) // ❌ v3 only
z.record(z.string(), z.number()) // ✅
z.record(z.enum(['a', 'b']), z.number()) // exhaustive — all keys required
z.partialRecord(z.enum(['a', 'b']), z.number()) // v3-style partial behavior
```

## Object methods — legacy vs canonical

| Legacy (still works)        | Canonical v4                                                  |
| --------------------------- | ------------------------------------------------------------- |
| `z.object(x).strict()`      | `z.strictObject(x)`                                           |
| `z.object(x).passthrough()` | `z.looseObject(x)`                                            |
| `z.object(x).strip()`       | `z.object(x)` (already the default)                           |
| `A.merge(B)`                | `A.extend(B.shape)` or `z.object({ ...A.shape, ...B.shape })` |
| `z.object(x).nonstrict()`   | `z.object(x)` — removed alias                                 |
| `.deepPartial()`            | no replacement — refactor                                     |

The destructuring spread for merge has the best `tsc` performance for large schemas.

## Enums

`z.nativeEnum` deprecated → `z.enum` is overloaded:

```ts
enum Color {
  Red = 'red',
  Green = 'green',
}
const ColorSchema = z.enum(Color)
ColorSchema.enum.Red // ✅ canonical
ColorSchema.Enum.Red // ❌ removed
ColorSchema.Values.Red // ❌ removed
```

## Generics — `ZodType` shape change

```ts
// v3
class ZodType<Output, Def extends z.ZodTypeDef, Input = Output> {}

// v4
class ZodType<Output = unknown, Input = unknown> {}
```

- `Def` generic removed.
- `Input` defaults to `unknown`.
- `z.ZodTypeAny` → use `z.ZodType` directly.
- `schema._def` → `schema._zod.def` (subject to change).

Generic helper functions:

```ts
// before
function infer<T extends z.ZodTypeAny>(s: T): T {
  return s
}
// after
function infer<T extends z.ZodType>(s: T): T {
  return s
}
```

## Removed wrappers (internal)

User APIs unchanged but if any code touched these classes directly:

- `ZodEffects` — gone; refinements live inside the schema's `checks` array.
- `ZodPreprocess` — gone; `z.preprocess()` returns `ZodPipe<ZodTransform, T>`.
- `ZodBranded` — gone; branding is a static-only type modification now.
- `.transform()` — returns `ZodPipe<Source, ZodTransform>` now (not `ZodEffects`).

Standalone `z.transform(fn)` is now legal:

```ts
const toStr = z.transform((input) => String(input))
toStr.parse(12) // "12"
```

## `z.coerce` input type

```ts
const s = z.coerce.string()
type In = z.input<typeof s>
// v3: string
// v4: unknown
```

If any code accepted `z.input<typeof coercedSchema>` as a typed argument, the call sites are now `unknown` and may need narrowing.

## Number rules

- `±Infinity` rejected (was allowed in v3).
- `.int()` rejects unsafe integers (outside `Number.MIN_SAFE_INTEGER` / `MAX_SAFE_INTEGER`).
- `.safe()` deprecated — identical to `.int()` now (no longer accepts floats).
- Prefer top-level `z.int()` over `z.number().int()`.

## String formats — pitfalls

- `z.uuid()` — RFC 9562 strict (variant bits enforced). For lax 8-4-4-4-12 hex, use `z.guid()`.
- `z.base64url()` — padded strings now rejected.
- `z.ipv6()` — uses `new URL()` internally; some previously-passing strings now fail.
- `z.string().ip()` removed → `z.union([z.ipv4(), z.ipv6()])`.
- `z.string().cidr()` removed → `z.union([z.cidrv4(), z.cidrv6()])`.

## Refine changes

- Type predicates no longer narrow inferred types.
- `ctx.path` removed from `.refine` / `.superRefine` callbacks.
- Two-function overload (`refine(predicate, errorFn)`) removed — use `{ error: (issue) => ... }`.

## Misc removed

- `z.ostring()`, `z.onumber()`, etc. — use `z.string().optional()`.
- `z.literal(symbol)` — symbols no longer supported as literals.
- `Class.create()` static factories — use the lowercase factory functions.

## When to consult source

The full official guide lives at https://zod.dev/v4/changelog — refer there for any edge case not covered here.
