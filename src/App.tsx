import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import TransitGapMap from './components/TransitGapMap'
import RidershipMap from './components/RidershipMap'
import CorridorSafetyMap from './components/CorridorSafetyMap'
import BikeNetworkMap from './components/BikeNetworkMap'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/transit-gap" element={<TransitGapMap />} />
        <Route path="/ridership" element={<RidershipMap />} />
        <Route path="/bike-safety" element={<CorridorSafetyMap />} />
        <Route path="/bike-network" element={<BikeNetworkMap />} />
      </Routes>
    </BrowserRouter>
  )
}
