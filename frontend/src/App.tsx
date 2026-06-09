import { ConfigProvider } from 'antd'
import plPL from 'antd/locale/pl_PL'
import { useAuthStore } from './store/authStore'
import { LoginPage } from './pages/LoginPage'
import { Sidebar } from './components/Sidebar'
import { ChatArea } from './components/ChatArea'

export default function App() {
  const user = useAuthStore((s) => s.user)

  if (!user) {
    return (
      <ConfigProvider locale={plPL} theme={{ token: { borderRadius: 8 } }}>
        <LoginPage />
      </ConfigProvider>
    )
  }

  return (
    <ConfigProvider locale={plPL} theme={{ token: { borderRadius: 8 } }}>
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        <Sidebar />
        <ChatArea />
      </div>
    </ConfigProvider>
  )
}
