/**
 * Electric vs gasoline CO₂, split into the two categories that get conflated:
 * emissions from building the car, and emissions from driving it.
 *
 * Stored values are read off published sources. Totals, break-even mileage, and
 * lifetime figures are derived below so the page has one implementation of each.
 */

import type { Source } from '../../data/figures'

export { EPA_TYPICAL_VEHICLE } from '../../data/figures'

export const EPA_BEYOND_TAILPIPE: Source = {
  name: 'EPA / DOE, Beyond Tailpipe Emissions Calculator (fueleconomy.gov), 2026 Tesla Model 3 Standard RWD',
  url: 'https://www.fueleconomy.gov/feg/Find.do?action=bt2',
  accessed: '2026-09-27',
}

export const ICCT_GLOBAL_2021: Source = {
  name: 'ICCT (Bieker), A global comparison of the life-cycle GHG emissions of combustion engine and electric passenger cars, July 2021 — Tables 2.3, 2.4, A.1',
  url: 'https://theicct.org/sites/default/files/publications/Global-LCA-passenger-cars-jul2021_0.pdf',
  accessed: '2026-09-27',
}

export const ICCT_US_2024: Source = {
  name: "ICCT (O'Malley & Slowik), Life-cycle GHG emissions of U.S. sedans and SUVs with different powertrains and fuel sources, July 2024",
  url: 'https://theicct.org/publication/life-cycle-ghg-emissions-of-us-sedans-and-suvs-with-different-powertrains-and-fuel-sources-jul24/',
  accessed: '2026-09-27',
}

/* ── Category 1: building the car ────────────────────────────────────────── */

/**
 * Production and recycling of everything except the battery — body, chassis,
 * powertrain. ICCT Table A.1. A BEV's non-battery manufacturing is *lower* than
 * a gasoline car's, because an electric drivetrain is simpler than an engine.
 */
export const GLIDER_AND_POWERTRAIN_TONNES = {
  gasoline: 7.2,
  bev: 6.5,
} as const

/** ICCT Table 2.4, United States: average new BEV passenger car battery. */
export const BATTERY_KWH = 70
export const BATTERY_TONNES = 4.2

/** ICCT Table 2.3: US average battery carbon intensity, 2021, NMC622 mix. */
export const BATTERY_KG_PER_KWH = 60

export const manufacturing = {
  gasoline: GLIDER_AND_POWERTRAIN_TONNES.gasoline,
  bev: GLIDER_AND_POWERTRAIN_TONNES.bev + BATTERY_TONNES,
}

/** What the battery costs, net of the simpler drivetrain it replaces. */
export const manufacturingPenalty = manufacturing.bev - manufacturing.gasoline

/* ── Category 2: driving the car ─────────────────────────────────────────── */

/** EPA's average new gasoline vehicle, tailpipe plus upstream fuel production. */
export const GASOLINE_GRAMS_PER_MILE = 400

/**
 * An identical BEV, charged on different grids. Tailpipe is zero for all of
 * them; every gram here comes from generating the electricity. Read off EPA's
 * calculator by ZIP code.
 */
export type GridCase = {
  place: string
  zip: string
  gramsPerMile: number
  note?: string
}

export const gridCases: GridCase[] = [
  { place: 'San Diego, CA', zip: '92101', gramsPerMile: 67, note: 'Cleanest of the five' },
  { place: 'Seattle, WA', zip: '98101', gramsPerMile: 77 },
  { place: 'US average grid', zip: '—', gramsPerMile: 104, note: 'The national figure' },
  { place: 'New York, NY', zip: '10001', gramsPerMile: 104, note: 'Matches the US average' },
  { place: 'Chicago, IL', zip: '60601', gramsPerMile: 126 },
  { place: 'Charleston, WV', zip: '25301', gramsPerMile: 126, note: 'Dirtiest of the five' },
]

export const US_AVERAGE_GRID_CASE = gridCases.find(c => c.zip === '—')!

/* ── Lifetime ────────────────────────────────────────────────────────────── */

/** ICCT's assumed lifetime mileage for a US sedan. */
export const LIFETIME_MILES = 195_000

/** ICCT's own findings, for checking the arithmetic below against the source. */
export const ICCT_BREAK_EVEN_MILES_VS_ICE = 11_100
export const ICCT_LIFETIME_REDUCTION_RANGE = '60%–68%'

const tonnesFromGrams = (gramsPerMile: number, miles: number) =>
  (gramsPerMile * miles) / 1_000_000

/** Miles of driving before a BEV's extra manufacturing emissions are repaid. */
export const breakEvenMiles = (gramsPerMile: number) =>
  (manufacturingPenalty * 1_000_000) / (GASOLINE_GRAMS_PER_MILE - gramsPerMile)

export type Lifetime = {
  manufacturing: number
  driving: number
  total: number
}

export const gasolineLifetime = (): Lifetime => {
  const driving = tonnesFromGrams(GASOLINE_GRAMS_PER_MILE, LIFETIME_MILES)
  return {
    manufacturing: manufacturing.gasoline,
    driving,
    total: manufacturing.gasoline + driving,
  }
}

export const bevLifetime = (gramsPerMile: number): Lifetime => {
  const driving = tonnesFromGrams(gramsPerMile, LIFETIME_MILES)
  return {
    manufacturing: manufacturing.bev,
    driving,
    total: manufacturing.bev + driving,
  }
}

export const lifetimeReduction = (gramsPerMile: number) =>
  1 - bevLifetime(gramsPerMile).total / gasolineLifetime().total

/** Validated against the dark chart surface — see the skill's palette validator. */
export const SERIES_COLORS = {
  manufacturing: '#c9762b',
  driving: '#3f7fd6',
} as const
