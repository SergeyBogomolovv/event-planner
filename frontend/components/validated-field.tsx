import { Field, FieldError, FieldLabel } from '@/components/ui/field'

type ValidatedFieldProps = {
  children: React.ReactNode
  error?: string
  htmlFor?: string
  label: string
}

export function ValidatedField({ children, error, htmlFor, label }: ValidatedFieldProps) {
  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={htmlFor}>{label}</FieldLabel>
      {children}
      <FieldError errors={error ? [{ message: error }] : undefined} />
    </Field>
  )
}
