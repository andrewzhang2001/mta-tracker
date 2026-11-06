/**
 * Per-capita driving by metro area, and the scenario that asks what the country
 * would save if every urbanized area drove at New York's rate.
 *
 * Only the raw published columns are stored — population and daily vehicle-miles,
 * read off FHWA Table HM-71. Every per-capita figure, CO₂ figure, and scenario
 * total is derived here at runtime, so correcting an input corrects the whole page.
 */

import type { Source } from '../../data/figures'

/** Sources shared with the parent page are defined once, there. */
export { HM71_2024, EPA_TYPICAL_VEHICLE, EPA_GHG_INVENTORY } from '../../data/figures'

/** Used only by this page. */
export const VM1_2024: Source = {
  name: 'FHWA, Highway Statistics 2024, Table VM-1 — annual vehicle-miles, fuel, and fleet fuel economy',
  url: 'https://www.fhwa.dot.gov/policyinformation/statistics/2024/vm1.cfm',
  accessed: '2026-09-27',
}

export type Area = {
  name: string
  /** Label for tight columns and prose. */
  short: string
  /** Census population of the urbanized area, as printed in HM-71. */
  population: number
  /** Total daily vehicle-miles of travel, all road classes, in thousands. */
  dailyVmtThousands: number
}

export const metros: Area[] = [
  {
    name: 'New York–Jersey City–Newark, NY–NJ',
    short: 'New York',
    population: 19_426_449,
    dailyVmtThousands: 281_852,
  },
  {
    name: 'Los Angeles–Long Beach–Anaheim, CA',
    short: 'Los Angeles',
    population: 12_237_376,
    dailyVmtThousands: 234_137,
  },
  {
    name: 'San Diego, CA',
    short: 'San Diego',
    population: 3_070_300,
    dailyVmtThousands: 67_377,
  },
]

/** The TOTAL row of HM-71: every Federal-Aid urbanized area in the country. */
export const allUrbanizedAreas: Area = {
  name: 'All 455 urbanized areas',
  short: 'Urban US average',
  population: 237_251_201,
  dailyVmtThousands: 5_526_899,
}

/** The metro the scenario holds up as the target. */
export const BENCHMARK = metros[0]

/**
 * Tailpipe CO₂ for the average US gasoline vehicle, straight off the EPA page.
 * EPA derives it from an assumed 22.2 mpg and 8,887 g CO₂ per gallon.
 */
export const GRAMS_CO2_PER_MILE = 400

/**
 * Independent check on the number above, derived from FHWA fuel data rather than
 * EPA's assumed fuel economy: the 2024 light-duty fleet drove 2,924,107 million
 * miles on 124,798,269 thousand gallons — 23.4 mpg, so 8,887 / 23.4 = 379 g/mile.
 * Two unrelated datasets landing 5% apart is the reason to trust either.
 */
export const GRAMS_CO2_PER_MILE_FROM_FUEL = 379

/** EPA inventory, 2022, all greenhouse gases, million tonnes CO₂-equivalent. */
export const US_TOTAL_GHG_MMT = 6_343

/** Global Carbon Budget 2025 projection, billion tonnes CO₂, fossil sources only. */
export const WORLD_FOSSIL_CO2_BILLION_TONNES = 38.1

export const milesPerPersonPerDay = (area: Area) =>
  (area.dailyVmtThousands * 1_000) / area.population

export const milesPerPersonPerYear = (area: Area) => milesPerPersonPerDay(area) * 365

/** Tonnes of CO₂ per person per year from driving in this area. */
export const tonnesCo2PerPersonPerYear = (area: Area) =>
  (milesPerPersonPerYear(area) * GRAMS_CO2_PER_MILE) / 1_000_000

export const ratioToBenchmark = (area: Area) =>
  milesPerPersonPerDay(area) / milesPerPersonPerDay(BENCHMARK)

/**
 * Hold every urbanized area's population fixed and drop its per-capita driving to
 * the benchmark's. Areas already below the benchmark are not raised to it — the
 * arithmetic applies one national average rate, so the result is the gap between
 * the country's actual urban driving and a country that drove like New York.
 */
export function benchmarkScenario() {
  const actualMilesPerYear = allUrbanizedAreas.dailyVmtThousands * 1_000 * 365
  const benchmarkMilesPerYear =
    allUrbanizedAreas.population * milesPerPersonPerDay(BENCHMARK) * 365
  const milesAvoided = actualMilesPerYear - benchmarkMilesPerYear
  const megatonnesAvoided = (milesAvoided * GRAMS_CO2_PER_MILE) / 1e12

  return {
    actualMilesPerYear,
    benchmarkMilesPerYear,
    milesAvoided,
    /** Share of current urban vehicle-miles that would not be driven. */
    vmtReductionShare: milesAvoided / actualMilesPerYear,
    megatonnesAvoided,
    billionTonnesAvoided: megatonnesAvoided / 1_000,
    shareOfUsTotal: megatonnesAvoided / US_TOTAL_GHG_MMT,
    shareOfWorldFossil: megatonnesAvoided / 1_000 / WORLD_FOSSIL_CO2_BILLION_TONNES,
  }
}
