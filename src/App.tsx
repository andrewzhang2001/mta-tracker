import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import CivicTechPage from '../civic-tech/CivicTechPage'
import CarbonFootprintPage from '../carbon-footprint/CarbonFootprintPage'
import DrivingByMetroPage from '../carbon-footprint/driving-by-metro/DrivingByMetroPage'
import ElectricVehiclesPage from '../carbon-footprint/electric-vehicles/ElectricVehiclesPage'
import TransitExplorer from '../nyc-transit/TransitExplorer'
import CaHsrPage from '../ca-hsr/CaHsrPage'
import PhasePage from '../ca-hsr/phase/PhasePage'
import TransitGapMap from '../nyc-transit/transit-gap/TransitGapMap'
import RidershipMap from '../nyc-transit/ridership/RidershipMap'
import CorridorSafetyMap from '../nyc-transit/bike-safety/CorridorSafetyMap'
import BikeNetworkMap from '../nyc-transit/bike-network/BikeNetworkMap'
import BudgetTrackerPage from '../nyc-transit/budget-tracker/BudgetTrackerPage'

// Archived projects are lazy-loaded: they're rarely visited, and simple-navigation
// pulls in protobufjs (~200 kB) that the main visualizations have no use for.
const ArchivePage = lazy(() => import('../archive/ArchivePage'))
const SimpleNavigation = lazy(() => import('../archive/simple-navigation/SimpleNavigation'))

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/civic-tech" element={<CivicTechPage />} />
        <Route path="/carbon-footprint" element={<CarbonFootprintPage />} />
        <Route path="/carbon-footprint/driving-by-metro" element={<DrivingByMetroPage />} />
        <Route path="/carbon-footprint/electric-vehicles" element={<ElectricVehiclesPage />} />
        <Route path="/nyc-transit" element={<TransitExplorer />} />
        <Route path="/nyc-transit/transit-gap" element={<TransitGapMap />} />
        <Route path="/nyc-transit/ridership" element={<RidershipMap />} />
        <Route path="/nyc-transit/bike-safety" element={<CorridorSafetyMap />} />
        <Route path="/nyc-transit/bike-network" element={<BikeNetworkMap />} />
        <Route path="/nyc-transit/budget-tracker" element={<BudgetTrackerPage />} />
        <Route path="/ca-hsr" element={<CaHsrPage />} />
        <Route path="/ca-hsr/:scenario" element={<PhasePage />} />
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
