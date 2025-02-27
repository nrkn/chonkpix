export const modifierKeys = [
  'Alt', 'AltGraph', 'CapsLock', 'Control', 'NumLock', 'ScrollLock', 'Shift'
] as const

export const whitespaceKeys = [
  'Enter', 'Tab', ' '
] as const

export const navigationKeys = [
  'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'End', 'Home', 'PageDown',
  'PageUp'
] as const

export const editingKeys = [
  'Backspace', 'Delete', 'Insert'
] as const

// nb Escape is used by the scene to exit so we'll never be able to trap it,
// but leaving it in anyway in case things change in future
export const uiKeys = [
  'Escape', 'Help', 'Pause'
] as const

export const alphaKeys = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
  'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
  'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'
] as const

export const numberKeys = [
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'
] as const

export const symbolKeys = [
  '!', '"', '#', '$', '%', '&', '\'', '(', ')', '*', '+', ',', '-',
  '.', '/', ':', ';', '<', '=', '>', '?', '@', '[', '\\', ']', '^',
  '_', '`', '{', '|', '}', '~'
] as const

// eg keys that will be echoed to the terminal, not control or special keys
export const printableKeys = [
  ...alphaKeys, ...numberKeys, ...symbolKeys, ' '
] as const

export type PrintableKey = typeof printableKeys[number]

export const printableKeySet = new Set(printableKeys)

export const allKeys = [
  ...modifierKeys, ...whitespaceKeys, ...navigationKeys, ...editingKeys,
  ...uiKeys, ...alphaKeys, ...numberKeys, ...symbolKeys
] as const