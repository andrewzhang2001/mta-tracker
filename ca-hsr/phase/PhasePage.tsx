import type { CSSProperties } from 'react'
import { Link, useParams } from 'react-router-dom'
import { parseCSV } from '../../shared/csv.js'
import segmentTotalsCsv from '../data/business-plan-2026/segment-totals.csv?raw'
import { phases, type Phase } from '../data/phases'
import { formatBillions } from '../format'
import { BudgetBreakdown } from './BudgetBreakdown'
import { buildBudgetTree } from './budgetTree'

const segmentTotals = parseCSV(segmentTotalsCsv)

function segmentCostMusd(scenario: string, segment: string) {
  const row = segmentTotals.find(r => r.scenario === scenario && r.segment === segment)
  if (!row) throw new Error(`segment-totals.csv has no ${segment} in ${scenario}`)
  return Number(row.amount_usd) / 1e6
}

export default function PhasePage() {
  const { scenario } = useParams()
  const phase = phases.find(p => p.scenario === scenario)

  return (
    <div style={pageStyle}>
      <Link to="/ca-hsr" style={backLinkStyle}>← Map</Link>
      {phase ? <PhaseBreakdown key={phase.scenario} phase={phase} /> : <p>No phase named “{scenario}”.</p>}
    </div>
  )
}

function PhaseBreakdown({ phase }: { phase: Phase }) {
  const newSegmentCosts = phase.newSegments.map(segment => ({
    segment,
    musd: segmentCostMusd(phase.scenario, segment),
  }))
  const newSegmentsMusd = newSegmentCosts.reduce((total, { musd }) => total + musd, 0)
  const isFirstPhase = phase === phases[0]

  return (
    <>
      <h1 style={titleStyle}>
        <span style={{ ...swatchStyle, background: phase.color }} />
        {phase.label}
      </h1>
      <p style={subtitleStyle}>{phase.stops.join(' · ')}</p>

      <dl style={statsStyle}>
        <Stat label={isFirstPhase ? 'Cost' : 'Added cost'} value={formatBillions(phase.addedMusd)} />
        <Stat label="Scenario total" value={formatBillions(phase.totalMusd)} />
      </dl>

      {!isFirstPhase && (
        <>
          <h2 style={sectionHeadingStyle}>Where the added cost goes ($M, P65)</h2>
          <table style={tableStyle}>
            <tbody>
              {newSegmentCosts.map(({ segment, musd }) => (
                <CostRow key={segment} label={segment} musd={musd} />
              ))}
              <CostRow label="Program-wide costs and changes to earlier track" musd={phase.addedMusd - newSegmentsMusd} />
              <CostRow label="Total" musd={phase.addedMusd} isTotal />
            </tbody>
          </table>
        </>
      )}

      <h2 style={sectionHeadingStyle}>
        {isFirstPhase ? 'Budget breakdown' : `Full scenario breakdown: ${phase.scenarioName}`}
      </h2>
      <p style={noteStyle}>P65, year-of-expenditure dollars, from Appendix C. Click a row or slice to go a level deeper.</p>
      <BudgetBreakdown root={buildBudgetTree(phase.scenario, phase.scenarioName)} />
    </>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt style={statLabelStyle}>{label}</dt>
      <dd style={statValueStyle}>{value}</dd>
    </div>
  )
}

function CostRow({ label, musd, isTotal = false }: { label: string; musd: number; isTotal?: boolean }) {
  const cellStyle = isTotal ? totalCellStyle : rowCellStyle
  return (
    <tr>
      <td style={cellStyle}>{label}</td>
      <td style={{ ...cellStyle, ...amountCellStyle }}>{Math.round(musd).toLocaleString()}</td>
    </tr>
  )
}

const pageStyle: CSSProperties = {
  height: '100%',
  overflowY: 'auto',
  maxWidth: 960,
  margin: '0 auto',
  padding: '24px 20px 48px',
  color: '#1a1a2e',
  fontFamily: 'system-ui, sans-serif',
}

const backLinkStyle: CSSProperties = { color: '#5a5a70', fontSize: 13, textDecoration: 'none' }

const titleStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: 12, fontSize: 28, marginTop: 16 }

const swatchStyle: CSSProperties = { width: 28, height: 6, borderRadius: 3, flexShrink: 0 }

const subtitleStyle: CSSProperties = { color: '#5a5a70', fontSize: 14, marginTop: 6 }

const statsStyle: CSSProperties = { display: 'flex', gap: 40, marginTop: 24 }

const statLabelStyle: CSSProperties = { color: '#5a5a70', fontSize: 13 }

const statValueStyle: CSSProperties = { fontSize: 28, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }

const sectionHeadingStyle: CSSProperties = { fontSize: 16, marginTop: 32, marginBottom: 8 }

const noteStyle: CSSProperties = { color: '#5a5a70', fontSize: 13 }

const tableStyle: CSSProperties = { width: '100%', borderCollapse: 'collapse', fontSize: 14 }

const rowCellStyle: CSSProperties = { padding: '8px 0', borderBottom: '1px solid #e4e4ea' }

const totalCellStyle: CSSProperties = { padding: '8px 0', fontWeight: 600 }

const amountCellStyle: CSSProperties = { textAlign: 'right', fontVariantNumeric: 'tabular-nums' }
