import { Link } from 'react-router-dom'

const cards = [
  {
    to: '/transit-gap',
    title: 'Transit Access Gap',
    description: 'How long does it take to board a subway from anywhere in NYC? Color shows access time, opacity shows population density.',
    accent: 'linear-gradient(135deg, #006837 0%, #ffffbf 50%, #a50026 100%)',
  },
  {
    to: '/ridership',
    title: '24h Ridership',
    description: 'Watch subway ridership pulse through the city over the course of a day. See the morning wave, the evening reversal, the late-night collapse.',
    accent: 'linear-gradient(135deg, #0d47a1 0%, #42a5f5 50%, #e1f5fe 100%)',
  },
  {
    to: '/bike-safety',
    title: 'Streetfight',
    description: 'Did protected bike lanes make NYC streets safer? Crash injuries before vs. after the redesign of four corridors — measured against the citywide trend.',
    accent: 'linear-gradient(135deg, #f59e0b 0%, #94d8b0 50%, #0ea5e9 100%)',
  },
  {
    to: '/bike-network',
    title: 'Bike Network Growth',
    description: 'Watch NYC\'s bike lanes grow from 1997 to today — 178 to 1,276 lane miles — and the rise of protected lanes after 2007.',
    accent: 'linear-gradient(135deg, #14b8a6 0%, #2563eb 50%, #15803d 100%)',
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
          <Link key={card.to} to={card.to} style={s.cardLink}>
            <div style={s.card}>
              <div style={{ ...s.cardAccent, background: card.accent }} />
              <div style={s.cardBody}>
                <h2 style={s.cardTitle}>{card.title}</h2>
                <p style={s.cardDesc}>{card.description}</p>
                <span style={s.cardCta}>View map →</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <footer style={s.footer}>
        Data: MTA GTFS · US Census ACS · NYC Open Data
      </footer>
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
  },
  cardAccent: {
    height: 6,
  },
  cardBody: {
    padding: '20px 22px 24px',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 600,
    margin: '0 0 10px',
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
