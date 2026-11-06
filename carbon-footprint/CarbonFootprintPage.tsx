import { Link } from 'react-router-dom'
import { sections, type Figure, type VerifiedFigure, type PendingFigure } from './data/figures'

/** Rendered large at the top. The dataviz rule is exactly one hero figure per view. */
const LEAD_FIGURE_ID = 'fossil-co2-2025'

const caseStudies = [
  {
    to: '/carbon-footprint/driving-by-metro',
    title: 'Driving by Metro',
    description:
      "Per-capita driving in New York, Los Angeles, and San Diego against the national urban average — and what the country would save if every urbanized area drove at New York's rate.",
  },
  {
    to: '/carbon-footprint/electric-vehicles',
    title: 'Electric Vehicles',
    description:
      'Electric vs gasoline in two separate categories: CO₂ from building the car, and CO₂ from driving it. How many miles it takes to repay the battery, and how much the grid changes the answer.',
  },
]

const allFigures = sections.flatMap(section => section.figures)
const leadFigure = allFigures.find(
  (f): f is VerifiedFigure => f.id === LEAD_FIGURE_ID && f.status === 'verified',
)
const verifiedCount = allFigures.filter(f => f.status === 'verified').length

const hostOf = (url: string) => url.replace(/^https?:\/\//, '').replace(/\/.*$/, '')

export default function CarbonFootprintPage() {
  return (
    <div style={s.page}>
      <div style={s.inner}>
        <header style={s.header}>
          <Link to="/" style={s.back}>← All projects</Link>
          <h1 style={s.title}>Carbon Footprint</h1>
          <p style={s.subtitle}>
            What the world emits, what comes back out, and what one person's driving
            accounts for. Building toward a case for public transit and solar, one
            verified number at a time.
          </p>
        </header>

        <p style={s.method}>
          <strong style={s.methodLead}>How numbers get onto this page.</strong> Each
          figure names the source it came from and the date someone last read it there.
          A number appears only after it has been checked against that source; until
          then the entry states which source to read and what to look for, and shows no
          number. {verifiedCount} of {allFigures.length} figures verified so far.
        </p>

        {leadFigure && <LeadFigure figure={leadFigure} />}

        <section style={s.section}>
          <h2 style={s.sectionTitle}>Case studies</h2>
          <p style={s.sectionBlurb}>
            Each one takes a single decision — how far to drive, what to heat with — and
            prices it in CO₂.
          </p>
          <div style={s.caseList}>
            {caseStudies.map(study => (
              <Link key={study.to} to={study.to} style={s.caseLink}>
                <div style={s.caseCard}>
                  <h3 style={s.caseTitle}>{study.title}</h3>
                  <p style={s.caseDesc}>{study.description}</p>
                  <span style={s.caseCta}>Open →</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {sections.map(section => {
          const figures = section.figures.filter(f => f.id !== LEAD_FIGURE_ID)
          if (figures.length === 0) return null
          return (
            <section key={section.id} style={s.section}>
              <h2 style={s.sectionTitle}>{section.title}</h2>
              <p style={s.sectionBlurb}>{section.blurb}</p>
              <div style={s.figureList}>
                {figures.map(figure => (
                  <FigureCard key={figure.id} figure={figure} />
                ))}
              </div>
            </section>
          )
        })}

        <footer style={s.footer}>
          Figures and their sources live in carbon-footprint/data/figures.ts.
        </footer>
      </div>
    </div>
  )
}

function LeadFigure({ figure }: { figure: VerifiedFigure }) {
  return (
    <div style={s.lead}>
      <span style={s.leadLabel}>
        {figure.label}, {figure.year}
      </span>
      <div style={s.leadValue}>{figure.value}</div>
      <span style={s.leadUnit}>{figure.unit}</span>
      <p style={s.scope}>{figure.scope}</p>
      <Caveats items={figure.caveats} />
      <SourceLine figure={figure} />
    </div>
  )
}

function FigureCard({ figure }: { figure: Figure }) {
  return (
    <div style={s.card}>
      <div style={s.cardHead}>
        <h3 style={s.cardTitle}>{figure.label}</h3>
        {figure.status === 'verified' ? <VerifiedValue figure={figure} /> : <PendingBadge />}
      </div>
      <p style={s.scope}>{figure.scope}</p>
      {figure.status === 'pending' && <Expects figure={figure} />}
      <Caveats items={figure.caveats} />
      <SourceLine figure={figure} />
    </div>
  )
}

function VerifiedValue({ figure }: { figure: VerifiedFigure }) {
  return (
    <span style={s.cardValue}>
      {figure.value} <span style={s.cardUnit}>{figure.unit}</span>
    </span>
  )
}

function PendingBadge() {
  return (
    <span style={s.pendingBadge}>
      <span style={s.pendingDot} aria-hidden="true" />
      Not yet verified
    </span>
  )
}

function Expects({ figure }: { figure: PendingFigure }) {
  return (
    <p style={s.expects}>
      <span style={s.expectsLabel}>Read off the source: </span>
      {figure.expects}
    </p>
  )
}

function Caveats({ items }: { items?: string[] }) {
  if (!items || items.length === 0) return null
  return (
    <ul style={s.caveatList}>
      {items.map(item => (
        <li key={item} style={s.caveat}>{item}</li>
      ))}
    </ul>
  )
}

function SourceLine({ figure }: { figure: Figure }) {
  const { source } = figure
  const verb = figure.status === 'verified' ? 'Read' : 'Verify at'
  return (
    <p style={s.sourceLine}>
      <a href={source.url} target="_blank" rel="noreferrer" style={s.sourceLink}>
        {verb} {hostOf(source.url)} →
      </a>
      <span style={s.sourceName}>{source.name}</span>
      {figure.status === 'verified' && (
        <span style={s.accessed}>
          Checked {source.accessed} · read {figure.check}
        </span>
      )}
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
    maxWidth: 780,
    margin: '0 auto',
    padding: '56px 24px 48px',
  },
  header: {
    marginBottom: 24,
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
  method: {
    fontSize: 12,
    color: '#8888a8',
    lineHeight: 1.7,
    background: '#16162a',
    border: '1px solid #23233a',
    borderRadius: 10,
    padding: '14px 16px',
    margin: '0 0 32px',
  },
  methodLead: {
    color: '#c0c0d4',
    fontWeight: 600,
  },
  lead: {
    background: '#1a1a2e',
    border: '1px solid #2a2a40',
    borderRadius: 12,
    padding: '24px 24px 20px',
    marginBottom: 40,
  },
  leadLabel: {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: '0.6px',
    textTransform: 'uppercase',
    color: '#6a6a88',
  },
  leadValue: {
    fontSize: 64,
    fontWeight: 600,
    lineHeight: 1.05,
    letterSpacing: '-2px',
    margin: '10px 0 2px',
    color: '#e8e8f0',
  },
  leadUnit: {
    display: 'block',
    fontSize: 15,
    color: '#9090aa',
  },
  section: {
    marginBottom: 40,
  },
  caseList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  caseLink: {
    textDecoration: 'none',
    color: 'inherit',
    display: 'block',
  },
  caseCard: {
    background: '#1a1a2e',
    border: '1px solid #2a2a40',
    borderLeft: '3px solid #4ade80',
    borderRadius: 12,
    padding: '18px 20px',
  },
  caseTitle: {
    fontSize: 16,
    fontWeight: 600,
    margin: '0 0 8px',
  },
  caseDesc: {
    fontSize: 13,
    color: '#a8a8c0',
    lineHeight: 1.6,
    margin: '0 0 12px',
  },
  caseCta: {
    fontSize: 13,
    color: '#6b9fff',
    fontWeight: 500,
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
  },
  figureList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  card: {
    background: '#1a1a2e',
    border: '1px solid #2a2a40',
    borderRadius: 12,
    padding: '18px 20px',
  },
  cardHead: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 600,
    margin: 0,
  },
  cardValue: {
    fontSize: 22,
    fontWeight: 600,
    color: '#e8e8f0',
    whiteSpace: 'nowrap',
  },
  cardUnit: {
    fontSize: 12,
    fontWeight: 400,
    color: '#8888a8',
  },
  pendingBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 11,
    color: '#7a7a96',
    background: '#22223a',
    border: '1px solid #2f2f48',
    borderRadius: 999,
    padding: '3px 10px',
    whiteSpace: 'nowrap',
  },
  pendingDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: '#5a5a72',
  },
  scope: {
    fontSize: 12,
    color: '#a8a8c0',
    lineHeight: 1.6,
    margin: '8px 0 0',
  },
  expects: {
    fontSize: 12,
    color: '#9090aa',
    lineHeight: 1.6,
    margin: '10px 0 0',
  },
  expectsLabel: {
    color: '#6a6a88',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    fontSize: 10,
    fontWeight: 600,
  },
  caveatList: {
    listStyle: 'none',
    margin: '12px 0 0',
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  caveat: {
    fontSize: 12,
    color: '#70708c',
    lineHeight: 1.6,
    borderLeft: '2px solid #2f2f48',
    paddingLeft: 10,
  },
  sourceLine: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
    margin: '14px 0 0',
    paddingTop: 12,
    borderTop: '1px solid #23233a',
  },
  sourceLink: {
    fontSize: 12,
    fontWeight: 500,
    color: '#6b9fff',
    textDecoration: 'none',
  },
  sourceName: {
    fontSize: 11,
    color: '#5a5a72',
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
  },
}
