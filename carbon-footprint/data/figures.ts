/**
 * Every number shown on /carbon-footprint lives here, with the source that
 * produced it.
 *
 * The union below is the enforcement mechanism: only a `VerifiedFigure` has a
 * `value` field, so a number cannot enter this file without someone having
 * opened the source URL and confirmed it reads that way. Anything not yet
 * checked is a `PendingFigure` — it names the source and what the source is
 * expected to yield, and carries no number at all.
 */

export type Source = {
  name: string
  url: string
  /** When a human last opened the URL and read the figure off it. */
  accessed: string
}

type FigureBase = {
  id: string
  label: string
  /** What the number counts, and what it leaves out. */
  scope: string
  source: Source
  caveats?: string[]
}

export type VerifiedFigure = FigureBase & {
  status: 'verified'
  value: number
  unit: string
  /** Calendar year the value describes, not the year it was published. */
  year: number
  /**
   * Who read the figure off the source. 'by hand' means a person opened the page;
   * 'fetched' means it was pulled programmatically and parsed. Both are checks
   * against the primary source; only the first has a human's eyes on the context
   * around the number.
   */
  check: 'by hand' | 'fetched'
  /** Set when the source publishes a different unit and this value converts it. */
  conversion?: string
}

export type PendingFigure = FigureBase & {
  status: 'pending'
  /** The quantity to read off the source, described without asserting it. */
  expects: string
}

export type Figure = VerifiedFigure | PendingFigure

/**
 * Sources are exported because nested pages under /carbon-footprint cite the same
 * ones. This module is the single place a source URL and its access date live.
 */
export const GLOBAL_CARBON_BUDGET_2025: Source = {
  name: 'Global Carbon Budget 2025',
  url: 'https://globalcarbonbudget.org/fossil-fuel-co2-emissions-hit-record-high-in-2025/',
  accessed: '2026-09-27',
}

export const GLOBAL_CARBON_BUDGET_PAPER: Source = {
  name: 'Friedlingstein et al., Global Carbon Budget 2025, Earth System Science Data 18, 3211–3288',
  url: 'https://essd.copernicus.org/articles/18/3211/2026/',
  accessed: '2026-09-27',
}

export const GLOBAL_CCS_STATUS_2025: Source = {
  name: 'Global CCS Institute, Global Status of CCS 2025',
  url: 'https://www.globalccsinstitute.com/wp-content/uploads/2025/10/GSR-2025-Executive-Summary-21-October.pdf',
  accessed: '2026-09-27',
}

export const HM71_2024: Source = {
  name: 'FHWA, Highway Statistics 2024, Table HM-71 — Federal-Aid Urbanized Areas',
  url: 'https://www.fhwa.dot.gov/policyinformation/statistics/2024/hm71.cfm',
  accessed: '2026-09-27',
}

export const EPA_GHG_INVENTORY: Source = {
  name: 'EPA, Inventory of U.S. Greenhouse Gas Emissions and Sinks, 1990\u20132022',
  url: 'https://www.epa.gov/ghgemissions/inventory-us-greenhouse-gas-emissions-and-sinks',
  accessed: '2026-09-27',
}

export const EPA_TYPICAL_VEHICLE: Source = {
  name: 'EPA, Greenhouse Gas Emissions from a Typical Passenger Vehicle (EPA-420-F-23-014)',
  url: 'https://www.epa.gov/greenvehicles/greenhouse-gas-emissions-typical-passenger-vehicle',
  accessed: '2026-09-27',
}

/** Supply side: what the world puts into the atmosphere. */
export const emissions: Figure[] = [
  {
    id: 'fossil-co2-2025',
    status: 'verified',
    label: 'Fossil CO₂ emissions, worldwide',
    value: 38.1,
    unit: 'billion tonnes CO₂',
    year: 2025,
    check: 'by hand',
    scope:
      'Coal, oil, gas, cement, and flaring. Excludes land-use change such as deforestation, which the same budget counts separately.',
    source: GLOBAL_CARBON_BUDGET_2025,
    caveats: [
      'A projection made partway through 2025, not a final figure. The settled number lands in the following year’s budget.',
      'Reported as a 1.1% rise over 2024 — a record high.',
    ],
  },
  {
    id: 'land-use-co2-2025',
    status: 'pending',
    label: 'Land-use change CO₂ emissions, worldwide',
    expects: 'Emissions from deforestation and other land-use change, in billion tonnes CO₂, for 2025',
    scope: 'Deforestation and other land-use change. Added to fossil CO₂ gives total anthropogenic CO₂.',
    source: GLOBAL_CARBON_BUDGET_2025,
  },
  {
    id: 'atmospheric-concentration-2025',
    status: 'pending',
    label: 'Atmospheric CO₂ concentration',
    expects: 'Parts per million for 2025, and the percentage above pre-industrial levels',
    scope: 'A stock, not a flow — the accumulated result of every prior year of emissions.',
    source: GLOBAL_CARBON_BUDGET_2025,
  },
  {
    id: 'remaining-budget-1p5',
    status: 'pending',
    label: 'Remaining carbon budget for 1.5 °C',
    expects: 'Billion tonnes CO₂ still emittable for a 50% chance of holding 1.5 °C',
    scope: 'Divide by annual emissions to get years remaining at the current rate.',
    source: GLOBAL_CARBON_BUDGET_2025,
  },
]

/** Is any of it coming back out? Two very different mechanisms. */
export const removals: Figure[] = [
  {
    id: 'ocean-sink',
    status: 'pending',
    label: 'Ocean sink',
    expects:
      'Annual uptake for 2024. The paper reports gigatonnes of carbon (GtC); multiply by 3.664 to convert to CO₂',
    scope: 'CO₂ absorbed by seawater. Not a policy lever — and it acidifies the ocean as it works.',
    source: GLOBAL_CARBON_BUDGET_PAPER,
    caveats: ['Published in GtC, not GtCO₂. Converting is required before comparing it to the emissions figures.'],
  },
  {
    id: 'land-sink',
    status: 'pending',
    label: 'Land sink',
    expects: 'Annual uptake for 2024, in GtC, converted to CO₂ at 3.664',
    scope: 'CO₂ taken up by vegetation and soils. Varies year to year with El Niño and fire.',
    source: GLOBAL_CARBON_BUDGET_PAPER,
    caveats: ['Published in GtC, not GtCO₂.', 'Carries the widest uncertainty range in the budget.'],
  },
  {
    id: 'engineered-capture-capacity',
    status: 'pending',
    label: 'Engineered carbon capture, operational capacity',
    expects: 'Million tonnes per year of capture capacity at facilities currently operating, and the facility count',
    scope: 'Purpose-built capture plants. This is nameplate capacity, not CO₂ actually captured and stored.',
    source: GLOBAL_CCS_STATUS_2025,
    caveats: [
      'Capacity is not throughput — facilities routinely run below nameplate.',
      'A large share of operating capture feeds enhanced oil recovery, where the CO₂ is injected to extract more oil. Counting that as removal is contested.',
      'The Global CCS Institute is industry-funded. The IEA CCUS Projects Database is the neutral cross-check: https://www.iea.org/data-and-statistics/data-product/ccus-projects-database',
    ],
  },
]

/** Demand side: what one American accounts for. */
export const americanDriver: Figure[] = [
  {
    id: 'grams-per-mile',
    status: 'verified',
    label: 'CO₂ per mile driven',
    value: 400,
    unit: 'grams CO₂ per mile',
    year: 2026,
    check: 'fetched',
    scope:
      'The average US gasoline vehicle. 400 kg per thousand miles. The factor that turns any mileage figure into CO₂.',
    source: EPA_TYPICAL_VEHICLE,
    caveats: [
      'Tailpipe combustion only — excludes refining the fuel and building the car.',
      'Cross-checked at 379 g/mile against FHWA fleet fuel data, an unrelated dataset. See /carbon-footprint/driving-by-metro.',
    ],
  },
  {
    id: 'typical-vehicle-annual',
    status: 'verified',
    label: 'Typical US passenger vehicle',
    value: 4.6,
    unit: 'tonnes CO₂ per year',
    year: 2026,
    check: 'fetched',
    scope: 'One average gasoline vehicle, tailpipe only.',
    source: EPA_TYPICAL_VEHICLE,
    caveats: [
      'Rests on two assumptions stated on the same EPA page: 22.2 mpg and 11,500 miles a year. Change either and the answer moves.',
      'Per vehicle, not per person or per household.',
    ],
  },
  {
    id: 'co2-per-gallon-gasoline',
    status: 'verified',
    label: 'CO₂ per gallon of gasoline burned',
    value: 8887,
    unit: 'grams CO₂ per gallon',
    year: 2026,
    check: 'fetched',
    scope:
      'A constant of combustion, not a behavioral average. Diesel is 10,180 g per gallon. Divide by fuel economy to get grams per mile.',
    source: EPA_TYPICAL_VEHICLE,
  },
  {
    id: 'urban-vmt-per-capita',
    status: 'verified',
    label: 'Driving per person, all US urbanized areas',
    value: 8503,
    unit: 'miles per person per year',
    year: 2024,
    check: 'fetched',
    conversion:
      'Derived from the HM-71 total row: 5,526,899 thousand daily vehicle-miles ÷ 237,251,201 people × 365.',
    scope:
      'All 455 Federal-Aid urbanized areas, holding 237 million people. Counts every vehicle-mile on area roads — including freight and through-traffic — per resident.',
    source: HM71_2024,
    caveats: [
      'Not personal driving. Trucks and through-traffic are in the numerator; only residents are in the denominator.',
      'Excludes rural America, where people drive further with fewer alternatives.',
    ],
  },
]

export const sections = [
  {
    id: 'emissions',
    title: 'What we emit',
    blurb: 'The supply side — CO₂ entering the atmosphere each year, worldwide.',
    figures: emissions,
  },
  {
    id: 'removals',
    title: 'What comes back out',
    blurb:
      'Two mechanisms share the name "carbon capture" and differ by orders of magnitude: sinks that already absorb a large share of what we emit, and plants built to capture it.',
    figures: removals,
  },
  {
    id: 'american-driver',
    title: 'One American, one car',
    blurb: 'The demand side, at the scale a person actually makes decisions at.',
    figures: americanDriver,
  },
]
