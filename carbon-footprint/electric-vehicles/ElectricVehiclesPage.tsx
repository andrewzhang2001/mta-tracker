import { Link } from 'react-router-dom'
import {
  GLIDER_AND_POWERTRAIN_TONNES,
  BATTERY_KWH,
  BATTERY_TONNES,
  BATTERY_KG_PER_KWH,
  manufacturing,
  manufacturingPenalty,
  GASOLINE_GRAMS_PER_MILE,
  gridCases,
  US_AVERAGE_GRID_CASE,
  LIFETIME_MILES,
  ICCT_BREAK_EVEN_MILES_VS_ICE,
  ICCT_LIFETIME_REDUCTION_RANGE,
  breakEvenMiles,
  gasolineLifetime,
  bevLifetime,
  lifetimeReduction,
  SERIES_COLORS,
  EPA_TYPICAL_VEHICLE,
  EPA_BEYOND_TAILPIPE,
  ICCT_GLOBAL_2021,
  ICCT_US_2024,
} from './data/vehicles'

const whole = (n: number) => Math.round(n).toLocaleString('en-US')
const oneDecimal = (n: number) => n.toFixed(1)
const percent = (share: number) => `${(share * 100).toFixed(0)}%`

const gasoline = gasolineLifetime()
const usAverageBev = bevLifetime(US_AVERAGE_GRID_CASE.gramsPerMile)
const chartMax = gasoline.total

export default function ElectricVehiclesPage() {
  return (
    <div style={s.page}>
      <div style={s.inner}>
        <header style={s.header}>
          <Link to="/carbon-footprint" style={s.back}>← Carbon Footprint</Link>
          <h1 style={s.title}>Electric Vehicles</h1>
          <p style={s.subtitle}>
            An electric car emits nothing while driving and a great deal while being
            built. Both are true, and the argument lives in the ratio between them. Here
            they are as two separate categories.
          </p>
        </header>

        <section style={s.section}>
          <h2 style={s.sectionTitle}>Category 1 — Building it</h2>
          <p style={s.sectionBlurb}>
            One-time emissions, paid before the car is driven a single mile. Split into
            the battery and everything else.
          </p>

          <div style={s.tableScroll}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={{ ...s.th, ...s.colWide }}>Stage</th>
                  <th style={{ ...s.th, ...s.colNum }}>Gasoline</th>
                  <th style={{ ...s.th, ...s.colNum }}>Electric</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={s.td}>
                    <span style={s.rowName}>Body, chassis, drivetrain</span>
                    <span style={s.rowNote}>
                      Production and recycling, excluding the battery
                    </span>
                  </td>
                  <td style={{ ...s.td, ...s.num }}>{GLIDER_AND_POWERTRAIN_TONNES.gasoline}</td>
                  <td style={{ ...s.td, ...s.num }}>{GLIDER_AND_POWERTRAIN_TONNES.bev}</td>
                </tr>
                <tr>
                  <td style={s.td}>
                    <span style={s.rowName}>Battery</span>
                    <span style={s.rowNote}>
                      {BATTERY_KWH} kWh at {BATTERY_KG_PER_KWH} kg CO₂e per kWh
                    </span>
                  </td>
                  <td style={{ ...s.td, ...s.num, ...s.none }}>none</td>
                  <td style={{ ...s.td, ...s.num }}>{BATTERY_TONNES}</td>
                </tr>
                <tr>
                  <td style={{ ...s.td, ...s.totalRow }}>
                    <span style={s.rowName}>Total to build</span>
                  </td>
                  <td style={{ ...s.td, ...s.num, ...s.totalRow }}>
                    {oneDecimal(manufacturing.gasoline)}
                  </td>
                  <td style={{ ...s.td, ...s.num, ...s.totalRow }}>
                    {oneDecimal(manufacturing.bev)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p style={s.unitNote}>Tonnes CO₂e per vehicle.</p>

          <p style={s.readout}>
            The electric car starts <strong style={s.strong}>{oneDecimal(manufacturingPenalty)} tonnes
            behind</strong>. Note where that comes from: the battery adds{' '}
            {BATTERY_TONNES} tonnes, but the rest of the car is{' '}
            {oneDecimal(GLIDER_AND_POWERTRAIN_TONNES.gasoline - GLIDER_AND_POWERTRAIN_TONNES.bev)}{' '}
            tonnes <em>lower</em> than the gasoline equivalent, because an electric
            drivetrain has fewer parts than an engine and transmission. The battery
            penalty is partly offset before driving begins.
          </p>

          <SourceNote source={ICCT_GLOBAL_2021} />
        </section>

        <section style={s.section}>
          <h2 style={s.sectionTitle}>Category 2 — Driving it</h2>
          <p style={s.sectionBlurb}>
            Per-mile emissions. The electric car's tailpipe emits nothing, so every gram
            below comes from generating the electricity — which means the answer depends
            entirely on where it charges. Same car, six grids.
          </p>

          <div style={s.tableScroll}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={{ ...s.th, ...s.colWide }}>Charging location</th>
                  <th style={{ ...s.th, ...s.colBar }}>Grams CO₂ per mile</th>
                  <th style={{ ...s.th, ...s.colNum }}>vs gasoline</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={s.td}>
                    <span style={s.rowName}>Average new gasoline vehicle</span>
                    <span style={s.rowNote}>Tailpipe plus fuel production</span>
                  </td>
                  <td style={s.td}>
                    <Bar value={GASOLINE_GRAMS_PER_MILE} max={GASOLINE_GRAMS_PER_MILE} color="#8a8aa8" />
                  </td>
                  <td style={{ ...s.td, ...s.num, ...s.muted }}>baseline</td>
                </tr>
                {gridCases.map(grid => (
                  <tr key={grid.place + grid.zip}>
                    <td style={s.td}>
                      <span style={s.rowName}>{grid.place}</span>
                      <span style={s.rowNote}>
                        {grid.zip === '—' ? 'National electricity mix' : `ZIP ${grid.zip}`}
                        {grid.note ? ` · ${grid.note}` : ''}
                      </span>
                    </td>
                    <td style={s.td}>
                      <Bar
                        value={grid.gramsPerMile}
                        max={GASOLINE_GRAMS_PER_MILE}
                        color={SERIES_COLORS.driving}
                      />
                    </td>
                    <td style={{ ...s.td, ...s.num }}>
                      {(GASOLINE_GRAMS_PER_MILE / grid.gramsPerMile).toFixed(1)}× lower
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p style={s.readout}>
            Even on the dirtiest grid here, the electric car emits less than a third of
            what the gasoline car does per mile. The grid spread —{' '}
            {gridCases[0].gramsPerMile} to {gridCases[gridCases.length - 1].gramsPerMile} g
            — is smaller than the gap to gasoline. Where you charge changes the size of
            the win, not whether there is one.
          </p>

          <SourceNote source={EPA_BEYOND_TAILPIPE} />
          <SourceNote source={EPA_TYPICAL_VEHICLE} />
        </section>

        <section style={s.section}>
          <h2 style={s.sectionTitle}>Where the two categories meet</h2>
          <p style={s.sectionBlurb}>
            The electric car owes {oneDecimal(manufacturingPenalty)} tonnes at the
            showroom and repays it at {GASOLINE_GRAMS_PER_MILE - US_AVERAGE_GRID_CASE.gramsPerMile} g
            per mile on the average grid.
          </p>

          <div style={s.hero}>
            <span style={s.heroLabel}>Break-even distance, US average grid</span>
            <div style={s.heroValue}>{whole(breakEvenMiles(US_AVERAGE_GRID_CASE.gramsPerMile))}</div>
            <span style={s.heroUnit}>
              miles — about {oneDecimal(breakEvenMiles(US_AVERAGE_GRID_CASE.gramsPerMile) / 11_500)} years
              of average US driving
            </span>
          </div>

          <div style={s.checkCard}>
            <span style={s.checkLabel}>Independent check</span>
            <p style={s.checkText}>
              That figure is derived here from ICCT manufacturing data and EPA per-mile
              data — two unrelated sources. ICCT ran the same question inside its own
              model and published{' '}
              <strong style={s.strong}>{whole(ICCT_BREAK_EVEN_MILES_VS_ICE)} miles</strong> for
              model year 2024 sedans. Two routes landing within a few hundred miles of
              each other is the reason to trust the number.
            </p>
            <SourceNote source={ICCT_US_2024} compact />
          </div>

          <div style={s.tableScroll}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={{ ...s.th, ...s.colWide }}>Charging location</th>
                  <th style={{ ...s.th, ...s.colNum }}>Break-even miles</th>
                </tr>
              </thead>
              <tbody>
                {gridCases.map(grid => (
                  <tr key={grid.place + grid.zip}>
                    <td style={s.td}>
                      <span style={s.rowName}>{grid.place}</span>
                    </td>
                    <td style={{ ...s.td, ...s.num }}>{whole(breakEvenMiles(grid.gramsPerMile))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section style={s.section}>
          <h2 style={s.sectionTitle}>Both categories over a full lifetime</h2>
          <p style={s.sectionBlurb}>
            Over {whole(LIFETIME_MILES)} miles, ICCT's assumed lifetime for a US sedan.
            Building the car is the small bar; driving it is the large one.
          </p>

          <div style={s.legend}>
            <LegendItem color={SERIES_COLORS.manufacturing} label="Building it" />
            <LegendItem color={SERIES_COLORS.driving} label="Driving it" />
          </div>

          <div style={s.chart}>
            <StackedBar
              label="Gasoline"
              sublabel={`${GASOLINE_GRAMS_PER_MILE} g/mi`}
              lifetime={gasoline}
            />
            {gridCases.map(grid => (
              <StackedBar
                key={grid.place + grid.zip}
                label={`Electric — ${grid.place}`}
                sublabel={`${grid.gramsPerMile} g/mi`}
                lifetime={bevLifetime(grid.gramsPerMile)}
                reduction={lifetimeReduction(grid.gramsPerMile)}
              />
            ))}
          </div>
          <p style={s.unitNote}>Tonnes CO₂e over {whole(LIFETIME_MILES)} miles.</p>

          <p style={s.readout}>
            On the average US grid the electric car's lifetime total is{' '}
            <strong style={s.strong}>{oneDecimal(usAverageBev.total)} tonnes</strong> against{' '}
            <strong style={s.strong}>{oneDecimal(gasoline.total)} tonnes</strong> for
            gasoline — a {percent(lifetimeReduction(US_AVERAGE_GRID_CASE.gramsPerMile))}{' '}
            reduction. ICCT's own US figure is {ICCT_LIFETIME_REDUCTION_RANGE}, computed
            with a grid that keeps decarbonizing over the car's life rather than today's
            fixed mix. The arithmetic here is the conservative version.
          </p>
        </section>

        <section style={s.section}>
          <h2 style={s.sectionTitle}>What these numbers are not</h2>
          <ul style={s.caveats}>
            <li style={s.caveat}>
              <strong style={s.caveatLead}>The manufacturing figures mix regions.</strong>{' '}
              The battery values are ICCT's US column. The body-and-drivetrain values
              ({GLIDER_AND_POWERTRAIN_TONNES.gasoline} and {GLIDER_AND_POWERTRAIN_TONNES.bev} tonnes)
              come from the same report's EU/UK lower-medium segment table. US vehicles
              are heavier, so both would be higher here — which raises the gasoline
              column too and leaves the {oneDecimal(manufacturingPenalty)}-tonne gap
              roughly intact. Treat the totals as the right magnitude, not to one decimal.
            </li>
            <li style={s.caveat}>
              <strong style={s.caveatLead}>The manufacturing data is from 2021.</strong>{' '}
              Battery carbon intensity has been falling as cell plants scale and grids
              clean up, and LFP chemistry — which ICCT put at 37–42 kg CO₂e/kWh in the
              US, well below the {BATTERY_KG_PER_KWH} used here — has taken large market
              share since. This page's manufacturing number is likely too high for a car
              built today.
            </li>
            <li style={s.caveat}>
              <strong style={s.caveatLead}>The two categories come from different
              models.</strong> Manufacturing is ICCT (GREET-based); per-mile driving is
              EPA. They use different grid assumptions and different vehicle baselines.
              Adding them is legitimate for a magnitude comparison and not a substitute
              for a single-model LCA — which is what the ICCT reports in the sources are.
            </li>
            <li style={s.caveat}>
              <strong style={s.caveatLead}>EPA's per-mile figures count CO₂ only.</strong>{' '}
              EPA states this covers 95%–99% of a passenger vehicle's greenhouse effect
              once other gases are weighted. The manufacturing figures are CO₂-equivalent
              across all gases.
            </li>
            <li style={s.caveat}>
              <strong style={s.caveatLead}>Battery recycling is excluded.</strong> ICCT
              leaves out second-life use and recycling credits because the processes are
              uncertain. Including them would lower the electric column further.
            </li>
            <li style={s.caveat}>
              <strong style={s.caveatLead}>A car not bought beats both.</strong> The{' '}
              <Link to="/carbon-footprint/driving-by-metro" style={s.inlineLink}>
                metro comparison
              </Link>{' '}
              is the other half of this: an electric car still carries{' '}
              {oneDecimal(manufacturing.bev)} tonnes of build emissions and still needs
              road, parking, and power. Driving less and electrifying are not competing
              arguments.
            </li>
          </ul>
        </section>

        <footer style={s.footer}>
          Inputs and derivations live in carbon-footprint/electric-vehicles/data/vehicles.ts.
        </footer>
      </div>
    </div>
  )
}

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div style={s.barRow}>
      <span style={s.barValue}>{value}</span>
      <span style={s.barTrack}>
        <span style={{ ...s.barFill, width: `${(value / max) * 100}%`, background: color }} />
      </span>
    </div>
  )
}

function StackedBar({
  label,
  sublabel,
  lifetime,
  reduction,
}: {
  label: string
  sublabel: string
  lifetime: { manufacturing: number; driving: number; total: number }
  reduction?: number
}) {
  return (
    <div style={s.stackRow}>
      <div style={s.stackLabels}>
        <span style={s.stackLabel}>{label}</span>
        <span style={s.stackSublabel}>{sublabel}</span>
      </div>
      <div style={s.stackTrack}>
        <span
          style={{
            ...s.stackSegment,
            width: `${(lifetime.manufacturing / chartMax) * 100}%`,
            background: SERIES_COLORS.manufacturing,
          }}
        />
        <span
          style={{
            ...s.stackSegment,
            width: `${(lifetime.driving / chartMax) * 100}%`,
            background: SERIES_COLORS.driving,
            marginLeft: 2,
          }}
        />
        <span style={s.stackTotal}>
          {oneDecimal(lifetime.total)}
          {reduction !== undefined && (
            <span style={s.stackReduction}> · {percent(reduction)} lower</span>
          )}
        </span>
      </div>
    </div>
  )
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span style={s.legendItem}>
      <span style={{ ...s.legendSwatch, background: color }} />
      {label}
    </span>
  )
}

function SourceNote({ source, compact = false }: { source: { name: string; url: string; accessed: string }; compact?: boolean }) {
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
  inner: { maxWidth: 860, margin: '0 auto', padding: '56px 24px 48px' },
  header: { marginBottom: 40 },
  back: {
    display: 'block',
    fontSize: 13,
    color: '#6b9fff',
    textDecoration: 'none',
    marginBottom: 20,
  },
  title: { fontSize: 32, fontWeight: 700, margin: '0 0 12px', letterSpacing: '-0.5px' },
  subtitle: { fontSize: 15, color: '#9090aa', lineHeight: 1.6, margin: 0, maxWidth: 640 },
  section: { marginBottom: 48 },
  sectionTitle: { fontSize: 20, fontWeight: 600, margin: '0 0 8px' },
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
  table: { width: '100%', minWidth: 600, borderCollapse: 'collapse', tableLayout: 'fixed' },
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
  colWide: { width: '44%' },
  colBar: { width: '36%' },
  colNum: { width: '20%', textAlign: 'right' },
  td: {
    verticalAlign: 'middle',
    padding: '14px 16px',
    borderBottom: '1px solid #23233a',
    fontSize: 13,
  },
  num: { textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#d0d0e0' },
  muted: { color: '#6a6a88' },
  none: { color: '#5a5a72' },
  totalRow: { borderTop: '1px solid #2a2a40', fontWeight: 600, color: '#e8e8f0' },
  rowName: { display: 'block', fontSize: 14, fontWeight: 600, color: '#e8e8f0' },
  rowNote: { display: 'block', fontSize: 11, color: '#5a5a72', marginTop: 2 },
  unitNote: { fontSize: 11, color: '#5a5a72', margin: '8px 0 0' },
  barRow: { display: 'flex', alignItems: 'center', gap: 10 },
  barValue: {
    fontSize: 13,
    fontVariantNumeric: 'tabular-nums',
    color: '#d0d0e0',
    minWidth: 32,
    textAlign: 'right',
  },
  barTrack: { flex: 1, height: 8, background: '#22223a', borderRadius: 4, overflow: 'hidden' },
  barFill: { display: 'block', height: '100%', borderRadius: 4 },
  readout: {
    fontSize: 13,
    color: '#a8a8c0',
    lineHeight: 1.7,
    margin: '18px 0 0',
    maxWidth: 660,
  },
  strong: { color: '#e8e8f0', fontWeight: 600 },
  inlineLink: { color: '#6b9fff', textDecoration: 'none' },
  hero: {
    background: '#1a1a2e',
    border: '1px solid #2a2a40',
    borderRadius: 12,
    padding: '24px 24px 20px',
    marginBottom: 14,
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
  heroUnit: { display: 'block', fontSize: 15, color: '#9090aa' },
  checkCard: {
    background: '#16162a',
    border: '1px solid #23233a',
    borderRadius: 10,
    padding: '14px 16px',
    marginBottom: 20,
  },
  checkLabel: {
    display: 'block',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    color: '#6a6a88',
  },
  checkText: { fontSize: 13, color: '#a8a8c0', lineHeight: 1.7, margin: '6px 0 0' },
  legend: { display: 'flex', gap: 18, marginBottom: 14 },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    fontSize: 12,
    color: '#9090aa',
  },
  legendSwatch: { width: 10, height: 10, borderRadius: 2 },
  chart: { display: 'flex', flexDirection: 'column', gap: 12 },
  stackRow: { display: 'flex', flexDirection: 'column', gap: 5 },
  stackLabels: { display: 'flex', alignItems: 'baseline', gap: 8 },
  stackLabel: { fontSize: 13, color: '#d0d0e0' },
  stackSublabel: { fontSize: 11, color: '#5a5a72' },
  stackTrack: { display: 'flex', alignItems: 'center', height: 14 },
  stackSegment: { display: 'block', height: '100%', borderRadius: 2 },
  stackTotal: {
    fontSize: 12,
    fontVariantNumeric: 'tabular-nums',
    color: '#d0d0e0',
    marginLeft: 10,
    whiteSpace: 'nowrap',
  },
  stackReduction: { color: '#6a6a88' },
  caveats: { listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 14 },
  caveat: {
    fontSize: 13,
    color: '#8888a8',
    lineHeight: 1.7,
    borderLeft: '2px solid #2f2f48',
    paddingLeft: 14,
  },
  caveatLead: { color: '#c0c0d4', fontWeight: 600 },
  source: { display: 'flex', flexDirection: 'column', gap: 3, fontSize: 11, margin: '16px 0 0' },
  sourceCompact: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
    fontSize: 11,
    margin: '12px 0 0',
    paddingTop: 10,
    borderTop: '1px solid #23233a',
  },
  sourceLink: { fontSize: 11, color: '#6b9fff', textDecoration: 'none', lineHeight: 1.5 },
  accessed: { fontSize: 11, color: '#5a5a72' },
  footer: { marginTop: 40, fontSize: 11, color: '#44445a', lineHeight: 1.6 },
}
