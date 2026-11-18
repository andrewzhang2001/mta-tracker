export const formatBillions = (musd: number) => `$${(musd / 1000).toFixed(1)}B`

/** Dollars as $X.XB at a billion and above, $XM below; negatives as −$X. */
export function formatUsd(usd: number) {
  const sign = usd < 0 ? '−' : ''
  const musd = Math.abs(usd) / 1e6
  return sign + (musd >= 1000 ? formatBillions(musd) : `$${Math.round(musd).toLocaleString()}M`)
}

export const formatShare = (part: number, whole: number) => `${((part / whole) * 100).toFixed(1)}%`
