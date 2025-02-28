export const randInt = (exclMax: number) => Math.floor(Math.random() * exclMax)

export const pick = <T>(values: T[]) => values[randInt(values.length)]

export const shuffle = <T>( values: T[] ) => {
  values = values.slice()

  for (let i = values.length - 1; i > 0; i--) {
    const j = randInt(i + 1)
    const temp = values[i]
    values[i] = values[j]
    values[j] = temp
  }

  return values
}