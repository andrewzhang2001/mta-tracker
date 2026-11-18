export const formatBillions = (musd: number) => `$${(musd / 1000).toFixed(1)}B`

/** Dollars as $X.XB at a billion and above, $XM below. */
export function formatUsd(usd: number) {
  const musd = usd / 1e6
  return musd >= 1000 ? formatBillions(musd) : `$${Math.round(musd).toLocaleString()}M`
}

export const formatShare = (part: number, whole: number) => `${((part / whole) * 100).toFixed(1)}%`
