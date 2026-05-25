---
name: tanstack-form
description: Build forms with TanStack Form — setup, validation via Zod/Standard Schema, large-form composition (createFormHook/withForm/withFieldGroup), and shadcn field patterns. Use when creating or editing any form in this project.
---

# TanStack Form

## Rules

- Validate with `validators.onSubmit` only. Never `onChange` or `onBlur`.
- Prefer Zod via Standard Schema over hand-rolled validators.

## Quick start

```tsx
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'

const schema = z.object({ name: z.string().min(1) })

const form = useForm({
  defaultValues: { name: '' },
  validators: { onSubmit: schema },
  onSubmit: async ({ value }) => {
    /* submit */
  },
})

;<form
  onSubmit={(e) => {
    e.preventDefault()
    form.handleSubmit()
  }}
>
  <form.Field
    name='name'
    children={(field) => (
      <input
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
      />
    )}
  />
  <form.Subscribe
    selector={(s) => [s.canSubmit, s.isSubmitting]}
    children={([canSubmit, isSubmitting]) => (
      <button
        type='submit'
        disabled={!canSubmit}
      >
        {isSubmitting ? '...' : 'Submit'}
      </button>
    )}
  />
</form>
```

## Large forms — composition

Set up a shared form hook with field/form components:

```tsx
// hooks/form-context.tsx
export const { fieldContext, useFieldContext, formContext, useFormContext } = createFormHookContexts()

// hooks/form.tsx
export const { useAppForm, withForm, withFieldGroup } = createFormHook({
  fieldComponents: { TextField },
  formComponents: { SubscribeButton },
  fieldContext,
  formContext,
})
```

Share `formOptions` across composed pieces:

```tsx
export const peopleFormOpts = formOptions({
  defaultValues: { fullName: '', address: { line1: '' } },
  validators: { onSubmit: schema },
})
```

`withForm` for a subtree bound to a specific form shape:

```tsx
export const AddressFields = withForm({
  ...peopleFormOpts,
  render: ({ form }) => (
    <form.AppField
      name='address.line1'
      children={(f) => <f.TextField label='Line 1' />}
    />
  ),
})
```

`withFieldGroup` for reusable field clusters under a path prefix:

```tsx
export const EmergencyContact = withFieldGroup({
  defaultValues: { fullName: '', phone: '' },
  render: ({ group }) => (
    <group.AppField
      name='fullName'
      children={(f) => <f.TextField label='Full Name' />}
    />
  ),
})

// usage: <EmergencyContact form={form} fields="emergencyContact" />
```

Custom field component reads context:

```tsx
function TextField({ label }: { label: string }) {
  const field = useFieldContext<string>()
  const errors = useStore(field.store, (s) => s.meta.errors)
  return (
    <label>
      {label}
      <input
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
      />
      {errors.map((e) => (
        <div key={e}>{e}</div>
      ))}
    </label>
  )
}
```

## Array fields

Use `mode="array"` on the parent field. Mutate with `field.pushValue(item)` / `field.removeValue(index)`. Nested paths use `name[index].prop`.

```tsx
<form.Field name="emails" mode="array" children={(field) => (
  <>
    {field.state.value.map((_, i) => (
      <form.Field key={i} name={`emails[${i}].address`} children={(f) => /* input */} />
    ))}
    <button onClick={() => field.pushValue({ address: "" })}>Add</button>
  </>
)} />
```

## shadcn field pattern

Canonical error wiring: `data-invalid` on `<Field />`, `aria-invalid` on the control, `<FieldError />` for messages.

```tsx
<form.Field
  name='plan'
  children={(field) => {
    const isInvalid = !field.state.meta.isValid
    return (
      <Field data-invalid={isInvalid}>
        <FieldLabel htmlFor={field.name}>Plan</FieldLabel>
        <Select
          value={field.state.value}
          onValueChange={field.handleChange}
        >
          <SelectTrigger
            id={field.name}
            aria-invalid={isInvalid}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>{/* items */}</SelectContent>
        </Select>
        {isInvalid && <FieldError errors={field.state.meta.errors} />}
      </Field>
    )
  }}
/>
```

Component bindings (all use `field.state.value` + `field.handleChange`):

- `<Input />`, `<Textarea />`, `<Select />`, `<Switch />`, `<Checkbox />`, `<RadioGroup />`.
- Checkbox array: `mode="array"` + `pushValue` / `removeValue` on toggle. Add `data-slot="checkbox-group"` to `<FieldGroup />`.
