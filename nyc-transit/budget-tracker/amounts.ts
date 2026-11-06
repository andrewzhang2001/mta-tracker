export const sumAmounts = (items: { amount: number }[]) => items.reduce((sum, item) => sum + item.amount, 0)

export interface Part<T> {
  item: T
  share: number
}

// Splits items into positive parts with their share of the positive total, and
// negative items, which a part-to-whole chart cannot draw.
export function partsOfWhole<T extends { amount: number }>(items: T[]) {
  const positive = items.filter(item => item.amount > 0)
  const positiveTotal = sumAmounts(positive)
  return {
    parts: positive.map(item => ({ item, share: item.amount / positiveTotal })),
    negative: items.filter(item => item.amount < 0),
  }
}
