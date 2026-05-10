export function isUniqueViolation(error: unknown): boolean {
  const driverError = (error as { driverError?: { code?: unknown } })
    .driverError;
  const code = driverError?.code ?? (error as { code?: unknown }).code;
  return code === '23505';
}
