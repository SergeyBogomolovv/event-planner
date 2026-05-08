import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'

type ValidationIssue = {
  path: PropertyKey[]
  message: string
}

export function applyValidationErrors<T extends FieldValues>(
  issues: ValidationIssue[],
  setError: UseFormSetError<T>,
) {
  for (const issue of issues) {
    const field = issue.path[0]
    if (typeof field === 'string') {
      setError(field as Path<T>, { message: issue.message })
    }
  }
}
