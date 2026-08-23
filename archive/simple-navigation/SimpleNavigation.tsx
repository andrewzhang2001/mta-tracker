import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { getRouteOptions, type RouteOptions, type TripLeg, type TripOption } from './mta'

const REFRESH_SECONDS = 30

export default function SimpleNavigation() {
  const [data, setData] = useState<RouteOptions | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [countdown, setCountdown] = useState(REFRESH_SECONDS)
  const [clock, setClock] = useState(() => nowInNY())
  const [expanded, setExpanded] = useState<number[]>([0])

  // Kept in a ref so the countdown tick doesn't need `load` as a dependency.
  const loadRef = useRef<() => void>(() => {})

  const load = useCallback(async () => {
    try {
      const result = await getRouteOptions()
      setData(result)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
      setCountdown(REFRESH_SECONDS)
    }
  }, [])

  loadRef.current = load

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const id = setInterval(() => {
      setClock(nowInNY())
      setCountdown(c => {
        if (c <= 1) {
          loadRef.current()
          return REFRESH_SECONDS
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [])

  const toggle = (i: number) =>
    setExpanded(prev => (prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]))

  return (
    <div style={s.page}>
      <div style={s.inner}>
        <header style={s.header}>
          <div style={s.headerLeft}>
            <span style={s.icon}>🚇</span>
            <div>
              <div style={s.headerTitle}>Simple Navigation</div>
              <div style={s.headerRoute}>
                {data ? `${data.origin} → ${data.destination}` : 'Loading…'}
              </div>
            </div>
          </div>
          <div style={s.headerRight}>
            <div style={s.clock}>{clock}</div>
            <div style={s.refreshInfo}>
              Updates in {countdown}s
              <button
                style={s.refreshBtn}
                onClick={() => { setCountdown(REFRESH_SECONDS); load() }}
                title="Refresh now"
              >
                ⟳
              </button>
            </div>
          </div>
        </header>

        <main style={s.main}>
          {loading && <div style={s.state}>Fetching real-time train data…</div>}

          {!loading && error && (
            <div style={s.errorBox}>
              <div style={s.errorTitle}>⚠️ Could not reach the MTA feed</div>
              <div style={s.errorMsg}>{error}</div>
            </div>
          )}

          {!loading && !error && data && (
            <>
              {data.warning && <div style={s.warning}>⚠️ {data.warning}</div>}

              {data.alerts.length > 0 && (
                <div style={s.alerts}>
                  <div style={s.alertsTitle}>Active MTA service alerts</div>
                  {data.alerts.map(a => (
                    <div key={a} style={s.alert}>{a}</div>
                  ))}
                </div>
              )}

              {data.options.length === 0 ? (
                <div style={s.state}>
                  No trips available right now.
                </div>
              ) : (
                <>
                  <div style={s.sectionHeader}>Next departures</div>
                  <div style={s.optionList}>
                    {data.options.map((opt, i) => (
                      <TripCard
                        key={`${opt.leaveHomeAt}-${i}`}
                        option={opt}
                        open={expanded.includes(i)}
                        onToggle={() => toggle(i)}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </main>

        <footer style={s.footer}>
          <Link to="/archive" style={s.back}>← Archive</Link>
          <span>Last updated: {data?.updatedAt ?? '—'} · MTA GTFS-RT, live</span>
        </footer>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------

function TripCard({ option, open, onToggle }: {
  option: TripOption
  open: boolean
  onToggle: () => void
}) {
  return (
    <div style={{ ...s.card, ...(option.urgent ? s.cardUrgent : null) }}>
      <button style={s.summary} onClick={onToggle}>
        <span style={{ ...s.leaveBadge, ...leaveBadgeStyle(option.leaveInMin) }}>
          {leaveText(option.leaveInMin)}
        </span>

        <span style={s.badgeRow}>
          <LineBadge line="E" color="#0039A6" />
          <span style={s.arrow}>›</span>
          <LineBadge line="G" color="#6CBE45" />
        </span>

        <span style={s.summaryRight}>
          <span style={s.total}>{option.totalMinutes} min</span>
          <span style={s.arrives}>Arrive {option.arrivesDestination}</span>
        </span>

        <span style={{ ...s.chevron, transform: open ? 'rotate(180deg)' : 'none' }}>▾</span>
      </button>

      {open && (
        <div style={s.legs}>
          {option.legs.map((leg, i) => <LegRow key={i} leg={leg} />)}
        </div>
      )}
    </div>
  )
}

function LegRow({ leg }: { leg: TripLeg }) {
  return (
    <div style={s.leg}>
      <div style={s.legIcon}>
        {leg.type === 'subway' && leg.line
          ? <LineBadge line={leg.line} color={leg.color ?? '#555'} />
          : <span>{leg.type === 'walk' ? '🚶' : '🔄'}</span>}
      </div>
      <div>
        <div style={s.legDesc}>{leg.desc}</div>
        <div style={s.legDetail}>
          {leg.realtime && <span style={s.dot} title="Real-time data" />}
          {leg.detail}
          {leg.type === 'subway' && leg.realtime === false && (
            <span style={s.estimated}> · estimated</span>
          )}
        </div>
      </div>
    </div>
  )
}

function LineBadge({ line, color }: { line: string; color: string }) {
  return <span style={{ ...s.lineBadge, background: color }}>{line}</span>
}

// ---------------------------------------------------------------------------

function nowInNY() {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date())
}

function leaveText(min: number) {
  if (min <= 0) return 'Leave NOW'
  if (min === 1) return 'Leave in 1 min'
  return `Leave in ${min} min`
}

function leaveBadgeStyle(min: number): React.CSSProperties {
  if (min <= 1) return { background: '#ff6b35', color: '#fff' }
  if (min <= 5) return { background: '#f5a623', color: '#1a1200' }
  return { background: '#22223a', color: '#9090aa' }
}

const s: Record<string, React.CSSProperties> = {
  page: {
    height: '100%',
    overflowY: 'auto',
    background: '#0f0f1a',
    color: '#e8ecf4',
    fontFamily: 'system-ui, sans-serif',
  },
  inner: { maxWidth: 680, margin: '0 auto', padding: '0 16px 40px' },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    padding: '20px 0 16px',
    borderBottom: '1px solid #2a2a40',
    flexWrap: 'wrap',
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  icon: { fontSize: 28 },
  headerTitle: { fontSize: 17, fontWeight: 600 },
  headerRoute: { fontSize: 12, color: '#7a8399', marginTop: 2 },
  headerRight: { textAlign: 'right' },
  clock: { fontSize: 20, fontWeight: 600, fontVariantNumeric: 'tabular-nums' },
  refreshInfo: {
    fontSize: 11,
    color: '#7a8399',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'flex-end',
    marginTop: 2,
  },
  refreshBtn: {
    background: 'none',
    border: '1px solid #2a3045',
    borderRadius: 6,
    color: '#7a8399',
    cursor: 'pointer',
    fontSize: 12,
    padding: '1px 6px',
  },

  main: { paddingTop: 24, minHeight: 200 },
  state: {
    textAlign: 'center',
    color: '#7a8399',
    fontSize: 14,
    padding: '48px 16px',
  },
  sectionHeader: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
    color: '#7a8399',
    marginBottom: 10,
  },
  optionList: { display: 'grid', gap: 10 },

  warning: {
    background: '#2a2113',
    border: '1px solid #4a3a1a',
    color: '#f5c37a',
    borderRadius: 10,
    padding: '12px 14px',
    fontSize: 13,
    lineHeight: 1.5,
    marginBottom: 12,
  },
  alerts: {
    background: '#161923',
    border: '1px solid #2a3045',
    borderRadius: 10,
    padding: '12px 14px',
    marginBottom: 20,
  },
  alertsTitle: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
    color: '#7a8399',
    marginBottom: 8,
  },
  alert: { fontSize: 13, color: '#c9d1e0', lineHeight: 1.55, padding: '3px 0' },

  errorBox: {
    background: '#2a1618',
    border: '1px solid #4a2226',
    borderRadius: 10,
    padding: '16px 18px',
  },
  errorTitle: { fontSize: 14, fontWeight: 600, marginBottom: 6 },
  errorMsg: { fontSize: 13, color: '#c99', lineHeight: 1.5 },

  card: {
    background: '#161923',
    border: '1px solid #2a3045',
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardUrgent: { borderColor: '#ff6b35' },
  summary: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    background: 'none',
    border: 'none',
    color: 'inherit',
    font: 'inherit',
    cursor: 'pointer',
    padding: '14px 16px',
    textAlign: 'left',
  },
  leaveBadge: {
    fontSize: 11,
    fontWeight: 600,
    borderRadius: 999,
    padding: '4px 10px',
    whiteSpace: 'nowrap',
  },
  badgeRow: { display: 'flex', alignItems: 'center', gap: 4 },
  arrow: { color: '#4a5165', fontSize: 14 },
  summaryRight: { marginLeft: 'auto', textAlign: 'right' },
  total: { display: 'block', fontSize: 16, fontWeight: 600 },
  arrives: { display: 'block', fontSize: 11, color: '#7a8399', marginTop: 1 },
  chevron: { color: '#4a5165', fontSize: 12, transition: 'transform .15s' },

  legs: { borderTop: '1px solid #2a3045', padding: '12px 16px 14px' },
  leg: { display: 'flex', gap: 12, alignItems: 'flex-start', padding: '7px 0' },
  legIcon: { width: 24, display: 'flex', justifyContent: 'center', fontSize: 15 },
  legDesc: { fontSize: 13, fontWeight: 500 },
  legDetail: {
    fontSize: 12,
    color: '#7a8399',
    marginTop: 2,
    display: 'flex',
    alignItems: 'center',
    gap: 5,
  },
  estimated: { color: '#5a6175', fontStyle: 'italic' },
  dot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: '#6CBE45',
    display: 'inline-block',
    flexShrink: 0,
  },

  lineBadge: {
    width: 22,
    height: 22,
    borderRadius: '50%',
    color: '#fff',
    fontSize: 12,
    fontWeight: 700,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  footer: {
    marginTop: 32,
    paddingTop: 16,
    borderTop: '1px solid #2a2a40',
    fontSize: 11,
    color: '#4a5165',
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  },
  back: { color: '#6b9fff', textDecoration: 'none' },
}
