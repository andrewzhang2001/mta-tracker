import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { companies, type Status } from './data/companies'

const STATUS_LABEL: Record<Status, string> = {
  researching: 'Researching',
  interested: 'Interested',
  applied: 'Applied',
  interviewing: 'Interviewing',
  passed: 'Passed',
}

const ALL_FOCUS_AREAS = [...new Set(companies.flatMap(c => c.focusAreas))].sort()

const bareDomain = (url: string) => url.replace(/^https?:\/\//, '').replace(/\/$/, '')

export default function CivicTechPage() {
  const [activeFocus, setActiveFocus] = useState<string | null>(null)
  const [activeStatus, setActiveStatus] = useState<Status | 'all'>('all')

  const filtered = useMemo(() => {
    return companies.filter(c => {
      if (activeFocus && !c.focusAreas.includes(activeFocus)) return false
      if (activeStatus !== 'all' && c.status !== activeStatus) return false
      return true
    })
  }, [activeFocus, activeStatus])

  return (
    <div style={s.page}>
      <div style={s.inner}>
        <header style={s.header}>
          <Link to="/" style={s.back}>← All projects</Link>
          <h1 style={s.title}>Civic Tech Startups</h1>
          <p style={s.subtitle}>
            Companies working on transit, urban planning, and civic infrastructure —
            tracked while researching where to apply. Still in early discovery.
          </p>
        </header>

        <div style={s.filters}>
          <button
            style={{ ...s.chip, ...(activeFocus === null ? s.chipActive : {}) }}
            onClick={() => setActiveFocus(null)}
          >
            All focus areas
          </button>
          {ALL_FOCUS_AREAS.map(area => (
            <button
              key={area}
              style={{ ...s.chip, ...(activeFocus === area ? s.chipActive : {}) }}
              onClick={() => setActiveFocus(activeFocus === area ? null : area)}
            >
              {area}
            </button>
          ))}

          <select
            value={activeStatus}
            onChange={e => setActiveStatus(e.target.value as Status | 'all')}
            style={s.select}
          >
            <option value="all">All statuses</option>
            {Object.entries(STATUS_LABEL).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div style={s.tableScroll}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={{ ...s.th, ...s.colCompany }}>Company</th>
                <th style={{ ...s.th, ...s.colFocus }}>Focus</th>
                <th style={{ ...s.th, ...s.colStage }}>Stage</th>
                <th style={{ ...s.th, ...s.colStatus }}>Status</th>
                <th style={{ ...s.th, ...s.colCareers }}>Careers</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.name}>
                  <td style={s.td}>
                    <a href={c.website} target="_blank" rel="noreferrer" style={s.companyLink}>
                      {c.name}
                    </a>
                    <span style={s.domain}>{bareDomain(c.website)}</span>
                    <p style={s.desc}>{c.description}</p>
                    {c.notes && <p style={s.notes}>{c.notes}</p>}
                  </td>
                  <td style={s.td}>
                    <div style={s.tagRow}>
                      {c.focusAreas.map(area => (
                        <span key={area} style={s.tag}>{area}</span>
                      ))}
                    </div>
                  </td>
                  <td style={{ ...s.td, ...s.stage }}>{c.stage}</td>
                  <td style={{ ...s.td, ...s.status }}>{STATUS_LABEL[c.status]}</td>
                  <td style={s.td}>
                    <a href={c.careers} target="_blank" rel="noreferrer" style={s.careersLink}>
                      Open roles →
                    </a>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td style={{ ...s.td, ...s.empty }} colSpan={5}>
                    No companies match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer style={s.footer}>
          Data lives in civic-tech/data/companies.ts — add a company by adding a row there.
        </footer>
      </div>
    </div>
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
    maxWidth: 1040,
    margin: '0 auto',
    padding: '56px 24px 48px',
  },
  header: {
    marginBottom: 32,
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
  filters: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginBottom: 28,
  },
  chip: {
    fontSize: 12,
    color: '#8888a8',
    background: '#1a1a2e',
    border: '1px solid #2a2a40',
    borderRadius: 999,
    padding: '5px 12px',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  chipActive: {
    color: '#e8e8f0',
    background: '#2a2a4a',
    borderColor: '#6b9fff',
  },
  select: {
    fontSize: 12,
    color: '#8888a8',
    background: '#1a1a2e',
    border: '1px solid #2a2a40',
    borderRadius: 999,
    padding: '5px 12px',
    fontFamily: 'inherit',
    marginLeft: 'auto',
  },
  tableScroll: {
    overflowX: 'auto',
    border: '1px solid #2a2a40',
    borderRadius: 12,
    background: '#1a1a2e',
  },
  table: {
    width: '100%',
    minWidth: 760,
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
  colCompany: { width: '42%' },
  colFocus: { width: '22%' },
  colStage: { width: '14%' },
  colStatus: { width: '11%' },
  colCareers: { width: '11%' },
  td: {
    verticalAlign: 'top',
    padding: '16px',
    borderBottom: '1px solid #23233a',
    fontSize: 13,
  },
  companyLink: {
    fontSize: 15,
    fontWeight: 600,
    color: '#e8e8f0',
    textDecoration: 'none',
  },
  domain: {
    display: 'block',
    fontSize: 11,
    color: '#5a5a72',
    marginTop: 2,
  },
  desc: {
    fontSize: 12,
    color: '#a8a8c0',
    lineHeight: 1.6,
    margin: '8px 0 0',
  },
  notes: {
    fontSize: 12,
    color: '#70708c',
    lineHeight: 1.6,
    borderLeft: '2px solid #2f2f48',
    paddingLeft: 10,
    margin: '10px 0 0',
  },
  tagRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    fontSize: 11,
    color: '#8888a8',
    background: '#22223a',
    border: '1px solid #2f2f48',
    borderRadius: 999,
    padding: '3px 9px',
  },
  stage: {
    color: '#9090aa',
    fontSize: 12,
  },
  status: {
    color: '#70708c',
    fontSize: 12,
    whiteSpace: 'nowrap',
  },
  careersLink: {
    fontSize: 12,
    fontWeight: 500,
    color: '#6b9fff',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  },
  empty: {
    color: '#5a5a72',
    borderBottom: 'none',
  },
  footer: {
    marginTop: 40,
    fontSize: 11,
    color: '#44445a',
  },
}
