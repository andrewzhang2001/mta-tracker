import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import TransitGapMap from '../transit-gap/TransitGapMap'
import RidershipMap from '../ridership/RidershipMap'
import CorridorSafetyMap from '../bike-safety/CorridorSafetyMap'
import BikeNetworkMap from '../bike-network/BikeNetworkMap'

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
