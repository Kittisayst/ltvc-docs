import { ConfigProvider } from 'antd'
import { Route, Routes } from 'react-router-dom'
import TemplatesPage from './pages/TemplatesPage'
import TemplateEditorPage from './pages/TemplateEditorPage'
import RecordsPage from './pages/RecordsPage'
import { DEFAULT_FONT_FAMILY } from './lib/fonts'

function App() {
  return (
    <ConfigProvider theme={{ token: { fontFamily: DEFAULT_FONT_FAMILY } }}>
      <Routes>
        <Route path="/" element={<TemplatesPage />} />
        <Route path="/templates/:templateId/edit" element={<TemplateEditorPage />} />
        <Route path="/templates/:templateId/records" element={<RecordsPage />} />
      </Routes>
    </ConfigProvider>
  )
}

export default App
