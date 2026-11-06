const UNITS: [number, string][] = [[1e9, 'B'], [1e6, 'M'], [1e3, 'K']]

const exactDollars = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

export function formatDollarsShort(amount: number): string {
  const sign = amount < 0 ? '−' : ''
  const magnitude = Number(Math.abs(amount).toPrecision(3))
  const unit = UNITS.find(([size]) => magnitude >= size)
  const digits = unit ? (magnitude / unit[0]).toPrecision(3) : magnitude.toPrecision(3)
  return `${sign}$${digits}${unit?.[1] ?? ''}`
}

export const formatDollarsExact = (amount: number) => exactDollars.format(amount)

export const formatShare = (share: number) => `${(share * 100).toFixed(1)}%`
