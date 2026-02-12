export function toQueryColumns<T extends Record<string, unknown>>(
  columns: T,
): { [K in keyof T]: true } {
  return Object.fromEntries(
    Object.keys(columns).map((k) => [k, true] as const),
  ) as { [K in keyof T]: true };
}

export function omitColumns<
  T extends Record<string, unknown>,
  K extends keyof T,
>(columns: T, keys: K[]): Omit<T, K> {
  const result = { ...columns };
  for (const key of keys) delete result[key];
  return result as Omit<T, K>;
}
