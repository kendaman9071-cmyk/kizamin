import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import VoiceInputPage from './pages/VoiceInputPage'
import MeasurementListPage from './pages/MeasurementListPage'
import CuttingModePage from './pages/CuttingModePage'
import SettingsPage from './pages/SettingsPage'
import NumberReadingPage from './pages/NumberReadingPage'
import MaterialsPage from './pages/MaterialsPage'
import ProjectsPage from './pages/ProjectsPage'

export default function App() {
  return (
    <BrowserRouter basename="/kizamin">
      <Routes>
        <Route path="/" element={<Navigate to="/input" replace />} />
        <Route path="/input" element={<VoiceInputPage />} />
        <Route path="/list" element={<MeasurementListPage />} />
        <Route path="/cutting" element={<CuttingModePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/settings/numbers" element={<NumberReadingPage />} />
        <Route path="/settings/materials" element={<MaterialsPage />} />
        <Route path="/settings/projects" element={<ProjectsPage />} />
      </Routes>
    </BrowserRouter>
  )
}
