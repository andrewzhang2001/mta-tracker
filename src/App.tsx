import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import TransitGapMap from '../transit-gap/TransitGapMap'
import RidershipMap from '../ridership/RidershipMap'
import CorridorSafetyMap from '../bike-safety/CorridorSafetyMap'
import BikeNetworkMap from '../bike-network/BikeNetworkMap'

// Archived projects are lazy-loaded: they're rarely visited, and simple-navigation
// pulls in protobufjs (~200 kB) that the main visualizations have no use for.
const ArchivePage = lazy(() => import('../archive/ArchivePage'))
const SimpleNavigation = lazy(() => import('../archive/simple-navigation/SimpleNavigation'))

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/transit-gap" element={<TransitGapMap />} />
        <Route path="/ridership" element={<RidershipMap />} />
        <Route path="/bike-safety" element={<CorridorSafetyMap />} />
        <Route path="/bike-network" element={<BikeNetworkMap />} />
        <Route
          path="/archive"
          element={<Suspense fallback={<Loading />}><ArchivePage /></Suspense>}
        />
        <Route
          path="/archive/simple-navigation"
          element={<Suspense fallback={<Loading />}><SimpleNavigation /></Suspense>}
        />
      </Routes>
    </BrowserRouter>
  )
}

function Loading() {
  return (
    <div style={{
      height: '100%',
      background: '#0f0f1a',
      color: '#7a8399',
      fontFamily: 'system-ui, sans-serif',
      fontSize: 14,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      Loading…
    </div>
  )
}
