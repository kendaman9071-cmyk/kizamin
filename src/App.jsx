import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import VoiceInputPage from './pages/VoiceInputPage'
import MeasurementListPage from './pages/MeasurementListPage'
import CuttingModePage from './pages/CuttingModePage'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/input" replace />} />
        <Route path="/input" element={<VoiceInputPage />} />
        <Route path="/list" element={<MeasurementListPage />} />
        <Route path="/cutting" element={<CuttingModePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </BrowserRouter>
  )
}
