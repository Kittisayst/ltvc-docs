import { Route, Routes } from 'react-router-dom'
import TemplatesPage from './pages/TemplatesPage'
import TemplateEditorPage from './pages/TemplateEditorPage'
import RecordsPage from './pages/RecordsPage'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<TemplatesPage />} />
      <Route path="/templates/:templateId/edit" element={<TemplateEditorPage />} />
      <Route path="/templates/:templateId/records" element={<RecordsPage />} />
    </Routes>
  )
}

export default App
