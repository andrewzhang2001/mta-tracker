import { Link } from 'react-router-dom'

const cards = [
  {
    to: '/transit-gap',
    title: 'Transit Access Gap',
    description: 'How long does it take to board a subway from anywhere in NYC? Color shows access time, opacity shows population density.',
    accent: 'linear-gradient(135deg, #006837 0%, #ffffbf 50%, #a50026 100%)',
    status: 'live' as const,
  },
  {
    to: '/ridership',
    title: '24h Ridership',
    description: 'Watch subway ridership pulse through the city over the course of a day. See the morning wave, the evening reversal, the late-night collapse.',
    accent: 'linear-gradient(135deg, #0d47a1 0%, #42a5f5 50%, #e1f5fe 100%)',
    status: 'soon' as const,
  },
]

export default function Home() {
  return (
    <div style={s.page}>
      <header style={s.header}>
        <h1 style={s.title}>NYC Transit Explorer</h1>
        <p style={s.subtitle}>
          Visualizing how New York City's subway system serves — and underserves — its residents.
        </p>
      </header>

      <div style={s.grid}>
        {cards.map(card => (
          card.status === 'live'
            ? (
              <Link key={card.to} to={card.to} style={s.cardLink}>
                <Card {...card} />
              </Link>
            ) : (
              <div key={card.to} style={{ ...s.cardLink, cursor: 'default' }}>
                <Card {...card} />
              </div>
            )
        ))}
      </div>

      <footer style={s.footer}>
        Data: MTA GTFS · US Census ACS · NYC Open Data
      </footer>
    </div>
  )
}

function Card({ title, description, accent, status }: typeof cards[number]) {
  return (
    <div style={s.card}>
      <div style={{ ...s.cardAccent, background: accent }} />
      <div style={s.cardBody}>
        <div style={s.cardTitleRow}>
          <h2 style={s.cardTitle}>{title}</h2>
          {status === 'soon' && <span style={s.badge}>soon</span>}
        </div>
        <p style={s.cardDesc}>{description}</p>
        {status === 'live' && <span style={s.cardCta}>View map →</span>}
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#0f0f1a',
    color: '#e8e8f0',
    fontFamily: 'system-ui, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '64px 24px 40px',
  },
  header: {
    textAlign: 'center',
    maxWidth: 560,
    marginBottom: 56,
  },
  title: {
    fontSize: 36,
    fontWeight: 700,
    margin: '0 0 12px',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontSize: 16,
    color: '#9090aa',
    lineHeight: 1.6,
    margin: 0,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: 20,
    width: '100%',
    maxWidth: 760,
  },
  cardLink: {
    textDecoration: 'none',
    color: 'inherit',
    display: 'block',
  },
  card: {
    background: '#1a1a2e',
    borderRadius: 12,
    overflow: 'hidden',
    border: '1px solid #2a2a40',
    transition: 'border-color 0.15s, transform 0.15s',
  },
  cardAccent: {
    height: 6,
  },
  cardBody: {
    padding: '20px 22px 24px',
  },
  cardTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 600,
    margin: 0,
  },
  badge: {
    fontSize: 10,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    background: '#2a2a40',
    color: '#7070a0',
    padding: '2px 7px',
    borderRadius: 4,
  },
  cardDesc: {
    fontSize: 13,
    color: '#8888a8',
    lineHeight: 1.6,
    margin: '0 0 16px',
  },
  cardCta: {
    fontSize: 13,
    color: '#6b9fff',
    fontWeight: 500,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 48,
    fontSize: 11,
    color: '#44445a',
  },
}
