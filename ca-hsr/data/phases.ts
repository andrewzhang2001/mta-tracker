import { parseCSV } from '../../shared/csv.js'
import scenariosCsv from './business-plan-2026/scenarios.csv?raw'

export type Phase = {
  /** Scenario slug in business-plan-2026/scenarios.csv. */
  scenario: string
  /** The track this phase adds to the one before it. */
  label: string
  /** Place names from places.ts, in order along the track. */
  stops: string[]
  /** Appendix C segments (segment-totals.csv) that cover the track this phase adds. */
  newSegments: string[]
  color: string
  /** Full scenario name from scenarios.csv. */
  scenarioName: string
  /** P65 total for the whole scenario, $M. */
  totalMusd: number
  /** This scenario's total minus the previous scenario's, $M. */
  addedMusd: number
}

const scenarioRows = new Map(parseCSV(scenariosCsv).map(row => [row.scenario, row]))

function scenarioRowOf(scenario: string) {
  const row = scenarioRows.get(scenario)
  if (!row) throw new Error(`scenarios.csv has no row for ${scenario}`)
  return row
}

const totalMusdOf = (scenario: string) => Number(scenarioRowOf(scenario).total_p65_musd)

// The four 2026 Business Plan scenarios, smallest first. Each contains the one
// before it, so each phase draws only the track it adds.
export const phases: Phase[] = [
  {
    scenario: 'merced-bakersfield',
    label: 'Merced – Bakersfield',
    stops: ['Merced', 'Wye', 'Madera', 'Fresno', 'Kings–Tulare', 'Bakersfield'],
    newSegments: ['Merced Extension', 'Central Valley 119-mile', 'Bakersfield Extension'],
    color: '#2a78d6',
  },
  {
    scenario: 'sf-bakersfield',
    label: 'San Francisco – Wye',
    stops: ['San Francisco', 'Millbrae', 'San Jose Diridon', 'Gilroy', 'Wye'],
    newSegments: ['San Francisco – San Jose', 'Gilroy – Wye'],
    color: '#eb6834',
  },
  {
    scenario: 'sf-palmdale',
    label: 'Bakersfield – Palmdale',
    stops: ['Bakersfield', 'Palmdale'],
    newSegments: ['Bakersfield – Palmdale'],
    color: '#1baf7a',
  },
  {
    scenario: 'phase-1',
    label: 'Palmdale – Anaheim',
    stops: ['Palmdale', 'Burbank Airport', 'Los Angeles', 'Anaheim'],
    newSegments: ['Palmdale – Burbank', 'Burbank – Los Angeles', 'Los Angeles – Anaheim'],
    color: '#eda100',
  },
].map((phase, index, all) => {
  const totalMusd = totalMusdOf(phase.scenario)
  const previousTotalMusd = index === 0 ? 0 : totalMusdOf(all[index - 1].scenario)
  return {
    ...phase,
    scenarioName: scenarioRowOf(phase.scenario).name,
    totalMusd,
    addedMusd: totalMusd - previousTotalMusd,
  }
})

/** Route of the budget breakdown page for a phase. */
export const phasePath = (phase: Phase) => `/ca-hsr/${phase.scenario}`
