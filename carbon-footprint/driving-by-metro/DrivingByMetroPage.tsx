import { Link } from 'react-router-dom'
import {
  metros,
  allUrbanizedAreas,
  BENCHMARK,
  GRAMS_CO2_PER_MILE,
  GRAMS_CO2_PER_MILE_FROM_FUEL,
  US_TOTAL_GHG_MMT,
  WORLD_FOSSIL_CO2_BILLION_TONNES,
  milesPerPersonPerDay,
  milesPerPersonPerYear,
  tonnesCo2PerPersonPerYear,
  ratioToBenchmark,
  benchmarkScenario,
  HM71_2024,
  VM1_2024,
  EPA_TYPICAL_VEHICLE,
  EPA_GHG_INVENTORY,
  type Area,
} from './data/metros'

const rows: Area[] = [...metros, allUrbanizedAreas]
const widestBar = Math.max(...rows.map(milesPerPersonPerDay))

const whole = (n: number) => Math.round(n).toLocaleString('en-US')
const twoDecimals = (n: number) => n.toFixed(2)
const percent = (share: number, decimals = 1) => `${(share * 100).toFixed(decimals)}%`
const trillions = (miles: number) => (miles / 1e12).toFixed(3)
const billions = (miles: number) => (miles / 1e9).toFixed(0)

export default function DrivingByMetroPage() {
  const scenario = benchmarkScenario()

  return (
    <div style={s.page}>
      <div style={s.inner}>
        <header style={s.header}>
          <Link to="/carbon-footprint" style={s.back}>← Carbon Footprint</Link>
          <h1 style={s.title}>Driving by Metro</h1>
          <p style={s.subtitle}>
            How far people drive depends less on who they are than on where they live.
            Three metros, the national urban average, and what the country would save
            if every urbanized area drove at New York's rate.
          </p>
        </header>

        <section style={s.section}>
          <h2 style={s.sectionTitle}>Per-capita driving</h2>
          <p style={s.sectionBlurb}>
            Population and daily vehicle-miles come from FHWA Table HM-71. Every other
            column is arithmetic on those two.
          </p>

          <div style={s.tableScroll}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={{ ...s.th, ...s.colArea }}>Urbanized area</th>
                  <th style={{ ...s.th, ...s.colNum }}>Population</th>
                  <th style={{ ...s.th, ...s.colBar }}>Miles per person per day</th>
                  <th style={{ ...s.th, ...s.colNum }}>Miles per year</th>
                  <th style={{ ...s.th, ...s.colNum }}>Tonnes CO₂ per year</th>
                  <th style={{ ...s.th, ...s.colNum }}>vs NY</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(area => {
                  const isAverage = area === allUrbanizedAreas
                  const isBenchmark = area === BENCHMARK
                  return (
                    <tr key={area.name}>
                      <td style={{ ...s.td, ...(isAverage ? s.averageRow : {}) }}>
                        <span style={s.areaName}>{area.short}</span>
                        <span style={s.areaFull}>{area.name}</span>
                      </td>
                      <td style={{ ...s.td, ...s.num }}>{whole(area.population)}</td>
                      <td style={s.td}>
                        <div style={s.barRow}>
                          <span style={s.barValue}>{twoDecimals(milesPerPersonPerDay(area))}</span>
                          <span style={s.barTrack}>
                            <span
                              style={{
                                ...s.barFill,
                                width: `${(milesPerPersonPerDay(area) / widestBar) * 100}%`,
                                background: isBenchmark ? '#4ade80' : '#6b9fff',
                              }}
                            />
                          </span>
                        </div>
                      </td>
                      <td style={{ ...s.td, ...s.num }}>{whole(milesPerPersonPerYear(area))}</td>
                      <td style={{ ...s.td, ...s.num }}>{twoDecimals(tonnesCo2PerPersonPerYear(area))}</td>
                      <td style={{ ...s.td, ...s.num, ...s.ratio }}>
                        {twoDecimals(ratioToBenchmark(area))}×
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <p style={s.readout}>
            San Diego drives {twoDecimals(ratioToBenchmark(metros[2]))}× the New York
            rate — {whole(milesPerPersonPerYear(metros[2]) - milesPerPersonPerYear(BENCHMARK))} extra
            miles per person per year. Los Angeles, the metro with the reputation, is
            lower than San Diego at {twoDecimals(ratioToBenchmark(metros[1]))}×.
          </p>

          <SourceNote source={HM71_2024} />
        </section>

        <section style={s.section}>
          <h2 style={s.sectionTitle}>The conversion factor</h2>
          <div style={s.factorGrid}>
            <div style={s.factorCard}>
              <span style={s.factorValue}>{GRAMS_CO2_PER_MILE} g</span>
              <span style={s.factorUnit}>CO₂ per mile</span>
              <p style={s.factorNote}>
                EPA's figure for the average US gasoline vehicle, derived from an assumed
                22.2 mpg and 8,887 g CO₂ per gallon of gasoline burned. Equivalently
                400 kg per thousand miles, or 4.6 tonnes a year at 11,500 miles.
              </p>
              <SourceNote source={EPA_TYPICAL_VEHICLE} compact />
            </div>
            <div style={s.factorCard}>
              <span style={s.factorValue}>{GRAMS_CO2_PER_MILE_FROM_FUEL} g</span>
              <span style={s.factorUnit}>CO₂ per mile — independent check</span>
              <p style={s.factorNote}>
                Derived instead from what the fleet actually burned: the 2024 light-duty
                fleet covered 2,924,107 million miles on 124,798,269 thousand gallons,
                which is 23.4 mpg. Two unrelated datasets landing 5% apart is the reason
                to trust either. The tables below use EPA's 400 g, the more conservative
                of the two for an argument about driving less.
              </p>
              <SourceNote source={VM1_2024} compact />
            </div>
          </div>
          <p style={s.warn}>
            Both numbers are tailpipe only. Neither counts refining the fuel or building
            the car, so both understate the footprint of driving.
          </p>
        </section>

        <section style={s.section}>
          <h2 style={s.sectionTitle}>If every US urbanized area drove like New York</h2>
          <p style={s.sectionBlurb}>
            Hold population fixed, drop per-capita driving in all 455 urbanized areas to
            New York's {twoDecimals(milesPerPersonPerDay(BENCHMARK))} miles per person
            per day, and convert the difference at {GRAMS_CO2_PER_MILE} g per mile.
          </p>

          <ol style={s.steps}>
            <Step
              label="Urban vehicle-miles driven today"
              value={`${trillions(scenario.actualMilesPerYear)} trillion miles per year`}
              note={`${whole(allUrbanizedAreas.dailyVmtThousands)} thousand miles per day × 365`}
            />
            <Step
              label="At New York's per-capita rate"
              value={`${trillions(scenario.benchmarkMilesPerYear)} trillion miles per year`}
              note={`${whole(allUrbanizedAreas.population)} people × ${twoDecimals(milesPerPersonPerDay(BENCHMARK))} miles per day × 365`}
            />
            <Step
              label="Miles not driven"
              value={`${billions(scenario.milesAvoided)} billion miles per year`}
              note={`a ${percent(scenario.vmtReductionShare)} cut in urban driving`}
            />
          </ol>

          <div style={s.hero}>
            <span style={s.heroLabel}>CO₂ avoided per year</span>
            <div style={s.heroValue}>{whole(scenario.megatonnesAvoided)}</div>
            <span style={s.heroUnit}>
              million tonnes — {twoDecimals(scenario.billionTonnesAvoided)} billion tonnes CO₂
            </span>
          </div>

          <div style={s.compareGrid}>
            <div style={s.compareCard}>
              <span style={s.compareValue}>{percent(scenario.shareOfUsTotal)}</span>
              <span style={s.compareLabel}>of total US greenhouse gas emissions</span>
              <p style={s.compareNote}>
                Against {whole(US_TOTAL_GHG_MMT)} million tonnes CO₂-equivalent, all gases,
                2022. Cutting urban driving by {percent(scenario.vmtReductionShare, 0)} moves
                the national number by about a twentieth.
              </p>
              <SourceNote source={EPA_GHG_INVENTORY} compact />
            </div>
            <div style={s.compareCard}>
              <span style={s.compareValue}>{percent(scenario.shareOfWorldFossil, 2)}</span>
              <span style={s.compareLabel}>of worldwide fossil CO₂</span>
              <p style={s.compareNote}>
                Against {WORLD_FOSSIL_CO2_BILLION_TONNES} billion tonnes, 2025. The honest
                limit of this argument: remaking every American city in New York's image is
                under one percent of the global problem. It is still one of the largest
                single levers the US controls.
              </p>
            </div>
          </div>
        </section>

        <section style={s.section}>
          <h2 style={s.sectionTitle}>What these numbers are not</h2>
          <ul style={s.caveats}>
            <li style={s.caveat}>
              <strong style={s.caveatLead}>HM-71 counts all traffic, not personal driving.</strong>{' '}
              It is every vehicle-mile on roads inside the area — delivery vans, freight,
              interstate through-traffic — divided by residents. It ranks places fairly,
              since the same distortion applies to each. It is not what any one person drives.
            </li>
            <li style={s.caveat}>
              <strong style={s.caveatLead}>Urbanized area is not city.</strong> New York's
              figure includes Jersey City, Newark, and the Long Island and Westchester
              suburbs. That drags it upward, so the gap understates what the city proper
              achieves. San Diego's urbanized area sits closer to its city limits.
            </li>
            <li style={s.caveat}>
              <strong style={s.caveatLead}>The scenario is arithmetic, not a forecast.</strong>{' '}
              It prices the gap between how America drives and how New York drives. It says
              nothing about what it would cost or how long it would take to close, and it
              assumes the trips vanish rather than shifting to transit that has emissions
              of its own.
            </li>
            <li style={s.caveat}>
              <strong style={s.caveatLead}>Rural driving is excluded.</strong> The 455
              urbanized areas hold {whole(allUrbanizedAreas.population)} people. Americans
              outside them drive further with fewer alternatives, and no transit scenario
              reaches them.
            </li>
          </ul>
        </section>

        <footer style={s.footer}>
          Inputs and derivations live in carbon-footprint/driving-by-metro/data/metros.ts.
          Only published columns are stored; every figure on this page is computed from them.
        </footer>
      </div>
    </div>
  )
}

function Step({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <li style={s.step}>
      <span style={s.stepLabel}>{label}</span>
      <span style={s.stepValue}>{value}</span>
      <span style={s.stepNote}>{note}</span>
    </li>
  )
}

function SourceNote({
  source,
  compact = false,
}: {
  source: { name: string; url: string; accessed: string }
  compact?: boolean
}) {
  return (
    <p style={compact ? s.sourceCompact : s.source}>
      <a href={source.url} target="_blank" rel="noreferrer" style={s.sourceLink}>
        {source.name}
      </a>
      <span style={s.accessed}>Read {source.accessed}</span>
    </p>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: {
    height: '100%',
    overflowY: 'auto',
    background: '#0f0f1a',
    color: '#e8e8f0',
    fontFamily: 'system-ui, sans-serif',
  },
  inner: {
    maxWidth: 860,
    margin: '0 auto',
    padding: '56px 24px 48px',
  },
  header: {
    marginBottom: 40,
  },
  back: {
    display: 'block',
    fontSize: 13,
    color: '#6b9fff',
    textDecoration: 'none',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 700,
    margin: '0 0 12px',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontSize: 15,
    color: '#9090aa',
    lineHeight: 1.6,
    margin: 0,
    maxWidth: 640,
  },
  section: {
    marginBottom: 48,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 600,
    margin: '0 0 8px',
  },
  sectionBlurb: {
    fontSize: 13,
    color: '#8888a8',
    lineHeight: 1.6,
    margin: '0 0 18px',
    maxWidth: 640,
  },
  tableScroll: {
    overflowX: 'auto',
    border: '1px solid #2a2a40',
    borderRadius: 12,
    background: '#1a1a2e',
  },
  table: {
    width: '100%',
    minWidth: 820,
    borderCollapse: 'collapse',
    tableLayout: 'fixed',
  },
  th: {
    textAlign: 'left',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.6px',
    textTransform: 'uppercase',
    color: '#6a6a88',
    padding: '12px 16px',
    borderBottom: '1px solid #2a2a40',
  },
  colArea: { width: '26%' },
  colBar: { width: '24%' },
  colNum: { width: '14%', textAlign: 'right' },
  td: {
    verticalAlign: 'middle',
    padding: '14px 16px',
    borderBottom: '1px solid #23233a',
    fontSize: 13,
  },
  num: {
    textAlign: 'right',
    fontVariantNumeric: 'tabular-nums',
    color: '#d0d0e0',
  },
  ratio: {
    color: '#9090aa',
  },
  averageRow: {
    borderLeft: '2px solid #4ade80',
  },
  areaName: {
    display: 'block',
    fontSize: 14,
    fontWeight: 600,
    color: '#e8e8f0',
  },
  areaFull: {
    display: 'block',
    fontSize: 11,
    color: '#5a5a72',
    marginTop: 2,
  },
  barRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  barValue: {
    fontSize: 13,
    fontVariantNumeric: 'tabular-nums',
    color: '#d0d0e0',
    minWidth: 42,
    textAlign: 'right',
  },
  barTrack: {
    flex: 1,
    height: 8,
    background: '#22223a',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    display: 'block',
    height: '100%',
    borderRadius: 4,
  },
  readout: {
    fontSize: 13,
    color: '#a8a8c0',
    lineHeight: 1.7,
    margin: '18px 0 0',
    maxWidth: 640,
  },
  factorGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 14,
  },
  factorCard: {
    background: '#1a1a2e',
    border: '1px solid #2a2a40',
    borderRadius: 12,
    padding: '18px 20px',
  },
  factorValue: {
    display: 'block',
    fontSize: 30,
    fontWeight: 600,
    letterSpacing: '-1px',
  },
  factorUnit: {
    display: 'block',
    fontSize: 12,
    color: '#8888a8',
    marginTop: 2,
  },
  factorNote: {
    fontSize: 12,
    color: '#a8a8c0',
    lineHeight: 1.6,
    margin: '12px 0 0',
  },
  warn: {
    fontSize: 12,
    color: '#70708c',
    lineHeight: 1.6,
    borderLeft: '2px solid #2f2f48',
    paddingLeft: 12,
    margin: '16px 0 0',
  },
  steps: {
    listStyle: 'none',
    counterReset: 'step',
    margin: '0 0 24px',
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  step: {
    background: '#16162a',
    border: '1px solid #23233a',
    borderRadius: 10,
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    color: '#6a6a88',
  },
  stepValue: {
    fontSize: 18,
    fontWeight: 600,
    color: '#e8e8f0',
  },
  stepNote: {
    fontSize: 12,
    color: '#70708c',
  },
  hero: {
    background: '#1a1a2e',
    border: '1px solid #2a2a40',
    borderRadius: 12,
    padding: '24px 24px 20px',
    marginBottom: 20,
  },
  heroLabel: {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: '0.6px',
    textTransform: 'uppercase',
    color: '#6a6a88',
  },
  heroValue: {
    fontSize: 64,
    fontWeight: 600,
    lineHeight: 1.05,
    letterSpacing: '-2px',
    margin: '10px 0 2px',
  },
  heroUnit: {
    display: 'block',
    fontSize: 15,
    color: '#9090aa',
  },
  compareGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 14,
  },
  compareCard: {
    background: '#1a1a2e',
    border: '1px solid #2a2a40',
    borderRadius: 12,
    padding: '18px 20px',
  },
  compareValue: {
    display: 'block',
    fontSize: 34,
    fontWeight: 600,
    letterSpacing: '-1px',
  },
  compareLabel: {
    display: 'block',
    fontSize: 12,
    color: '#8888a8',
    marginTop: 2,
  },
  compareNote: {
    fontSize: 12,
    color: '#a8a8c0',
    lineHeight: 1.6,
    margin: '12px 0 0',
  },
  caveats: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  caveat: {
    fontSize: 13,
    color: '#8888a8',
    lineHeight: 1.7,
    borderLeft: '2px solid #2f2f48',
    paddingLeft: 14,
  },
  caveatLead: {
    color: '#c0c0d4',
    fontWeight: 600,
  },
  source: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
    fontSize: 11,
    margin: '16px 0 0',
  },
  sourceCompact: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
    fontSize: 11,
    margin: '12px 0 0',
    paddingTop: 10,
    borderTop: '1px solid #23233a',
  },
  sourceLink: {
    fontSize: 11,
    color: '#6b9fff',
    textDecoration: 'none',
    lineHeight: 1.5,
  },
  accessed: {
    fontSize: 11,
    color: '#5a5a72',
  },
  footer: {
    marginTop: 40,
    fontSize: 11,
    color: '#44445a',
    lineHeight: 1.6,
  },
}
