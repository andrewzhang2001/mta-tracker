import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import TransitGapMap from './components/TransitGapMap'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/transit-gap" element={<TransitGapMap />} />
      </Routes>
    </BrowserRouter>
  )
}
