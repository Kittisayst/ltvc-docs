import { ConfigProvider } from 'antd'
import { Route, Routes } from 'react-router-dom'
import TemplatesPage from './pages/TemplatesPage'
import TemplateEditorPage from './pages/TemplateEditorPage'
import RecordsPage from './pages/RecordsPage'

function App() {
  return (
    <ConfigProvider>
      <Routes>
        <Route path="/" element={<TemplatesPage />} />
        <Route path="/templates/:templateId/edit" element={<TemplateEditorPage />} />
        <Route path="/templates/:templateId/records" element={<RecordsPage />} />
      </Routes>
    </ConfigProvider>
  )
}

export default App
