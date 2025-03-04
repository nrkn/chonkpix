export const cached = <T, Hash, Result>(
  hash: (value: T) => Hash,
  create: (value: T) => Result
) => {
  const cache = new Map<Hash, Result>()

  return (value: T) => {
    const key = hash(value)

    let result = cache.get(key)

    if (result !== undefined) return result

    result = create(value)
    cache.set(key, result)

    return result
  }
}
