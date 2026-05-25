---
name: migrate-to-zod-v4
description: Migrate Zod schemas away from deprecated, verbose, or removed Zod 3 APIs to Zod 4 equivalents. Use when user wants to modernize Zod code, mentions Zod v3/v4 migration, sees Zod deprecation warnings, or asks to clean up verbose/legacy Zod patterns. Covers string format methods, error params, object helpers, enums, records, ZodError APIs.
---

# Migrate to Zod v4

This project already uses Zod v4. The codebase may still contain v3-style patterns that are deprecated, verbose, or removed. Use this skill to find and rewrite them.

## Workflow

1. **Scope** — confirm with user: whole repo, a directory, or a specific file?
2. **Scan** — grep for v3 patterns (see [Detection patterns](#detection-patterns)).
3. **Rewrite** — apply the transforms in [Transforms](#transforms). Group edits per file.
4. **Verify** — run `pnpm tsc --noEmit` (or project equivalent) and existing tests after each batch. Do not skip this step.
5. **Behavioral pitfalls** — re-check anything in [Behavioral changes](#behavioral-changes) — these are NOT pure renames.

Never blanket-replace without reading the surrounding code. Some transforms (e.g. `.default()`, `.nonempty()`) change runtime behavior.

## Detection patterns

Run these greps to find v3 patterns:

```bash
# String formats
rg '\.string\(\)\.(email|uuid|url|emoji|base64|base64url|nanoid|cuid2?|ulid|ipv4|ipv6|cidrv4|cidrv6|datetime|date|time|duration)\('
# IP/CIDR removed forms
rg '\.string\(\)\.(ip|cidr)\('
# Error params
rg '\b(message|errorMap|invalid_type_error|required_error):'
# Object helpers
rg '\.(strict|passthrough|strip|nonstrict|deepPartial|merge)\('
# Native enum
rg 'z\.nativeEnum\('
# ZodError legacy
rg '\.(format|flatten|formErrors|addIssues?)\(' --type ts
rg '\.errors\b' --type ts # filter manually — many false positives
# Optional shorthands
rg 'z\.o(string|number|boolean|date|bigint|symbol|undefined|null|void|any|unknown|never)\('
# Misc
rg 'z\.number\(\)\.int\('
rg 'z\.promise\('
rg 'ZodTypeAny|\.create\('
```

## Transforms

Pure renames — safe one-to-one:

| v3 (deprecated/removed)                                                                                | v4                                                                                |
| ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| `z.string().email()`                                                                                   | `z.email()`                                                                       |
| `z.string().uuid()`                                                                                    | `z.uuid()` (stricter — see pitfalls)                                              |
| `z.string().url()`                                                                                     | `z.url()`                                                                         |
| `z.string().emoji()` / `.base64()` / `.base64url()` / `.nanoid()` / `.cuid()` / `.cuid2()` / `.ulid()` | top-level `z.<name>()`                                                            |
| `z.string().datetime()` / `.date()` / `.time()` / `.duration()`                                        | `z.iso.<name>()`                                                                  |
| `z.string().ipv4()` / `.ipv6()`                                                                        | `z.ipv4()` / `z.ipv6()`                                                           |
| `z.string().ip()` (removed)                                                                            | `z.union([z.ipv4(), z.ipv6()])`                                                   |
| `z.string().cidr()` (removed)                                                                          | `z.union([z.cidrv4(), z.cidrv6()])`                                               |
| `z.number().int()`                                                                                     | `z.int()`                                                                         |
| `{ message: "..." }`                                                                                   | `{ error: "..." }`                                                                |
| `{ errorMap: (issue, ctx) => ({ message }) }`                                                          | `{ error: (issue) => "..." }` (return string \| undefined)                        |
| `z.object(...).strict()`                                                                               | `z.strictObject(...)`                                                             |
| `z.object(...).passthrough()`                                                                          | `z.looseObject(...)`                                                              |
| `A.merge(B)`                                                                                           | `A.extend(B.shape)` — or `z.object({ ...A.shape, ...B.shape })` for best tsc perf |
| `z.nativeEnum(MyEnum)`                                                                                 | `z.enum(MyEnum)`                                                                  |
| `EnumSchema.Enum.X` / `.Values.X`                                                                      | `EnumSchema.enum.X`                                                               |
| `z.record(valueSchema)` (removed)                                                                      | `z.record(z.string(), valueSchema)`                                               |
| `z.ostring()` / `z.onumber()` / ... (removed)                                                          | `z.string().optional()` / ...                                                     |
| `err.format()` / `err.flatten()`                                                                       | `z.treeifyError(err)`                                                             |
| `err.errors` (removed)                                                                                 | `err.issues`                                                                      |
| `err.addIssue(x)`                                                                                      | `err.issues.push(x)`                                                              |
| `z.ZodTypeAny`                                                                                         | `z.ZodType`                                                                       |
| `z.ZodString.create()`                                                                                 | `z.string()` (factory funcs)                                                      |
| `schema._def`                                                                                          | `schema._zod.def`                                                                 |

`invalid_type_error` + `required_error` collapse into one `error` callback:

```ts
// v3
z.string({ required_error: 'Required', invalid_type_error: 'Not a string' })
// v4
z.string({ error: (issue) => (issue.input === undefined ? 'Required' : 'Not a string') })
```

## Behavioral changes

These are NOT pure renames. Read the code before changing.

- **`.default(x)`** — `x` must now match the OUTPUT type (post-transform). If `x` was the input type, switch to `.prefault(x)` to preserve v3 behavior.
- **`.nonempty()` on arrays** — inferred type is now `T[]` not `[T, ...T[]]`. If a caller relied on the tuple type, use `z.tuple([T], T)` instead.
- **Defaults inside optional fields** — `z.object({ a: z.string().default("x").optional() }).parse({})` now returns `{ a: "x" }` (v3: `{}`). Code that branched on key existence will break.
- **`z.unknown()` / `z.any()` in objects** — keys are no longer inferred as optional. Callers may need `?` removed (or add `.optional()` explicitly).
- **`z.coerce.*` input type** — now `unknown` instead of the target type. Generic functions over `z.input<typeof schema>` may need updates.
- **`z.number()` rejects `±Infinity`** — only finite numbers pass.
- **`z.number().int()`** — now rejects unsafe integers (outside `MIN_SAFE_INTEGER`/`MAX_SAFE_INTEGER`).
- **`z.uuid()`** — stricter than v3 (RFC 9562 variant bits enforced). If you need the lax 8-4-4-4-12 hex pattern, use `z.guid()`.
- **`.base64url()`** — no longer accepts padded strings.
- **`.refine((v): v is string => ...)`** — type predicate no longer narrows the inferred type. Use a typed schema instead.
- **`ctx.path` inside `.superRefine` / `.refine`** — removed. Restructure if you depended on it.
- **Schema-level `error` beats parse-call `error`** — precedence flipped vs v3.
- **`z.intersection` merge conflicts** — now throw a plain `Error`, not `ZodError`.
- **`.deepPartial()`** — removed with no replacement. Refactor; usually an anti-pattern.
- **`z.promise(schema)`** — deprecated. `await` the value, then `schema.parse(...)`.
- **`z.function()`** — completely new API. See [REFERENCE.md](REFERENCE.md) if encountered.

## Editing rules

- Always read the full schema definition and at least one usage site before rewriting — the inferred type may have shifted.
- Update imports if a v3-only export disappears (`ZodTypeAny`, `ZodEffects`, `ZodBranded`, `ZodPreprocess` — none exist in v4).
- When changing `.merge()`, prefer the destructuring form `z.object({ ...A.shape, ...B.shape })` for tsc perf.
- Form schemas in this project use onSubmit validation only (see memory) — don't change validator wiring while migrating.
- Don't add comments saying "migrated from v3" — drop the v3 form and move on.

## Full reference

For changes not in the quick table above (z.function API, ZodError internals, generics changes, ZodTransform/ZodPipe internals), see [REFERENCE.md](REFERENCE.md).
