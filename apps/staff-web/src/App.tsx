import { useState } from 'react'
import LoginPage from './pages/Login.tsx'
import EventSelectPage from './pages/EventSelect.tsx'
import ScannerPage from './pages/Scanner.tsx'

interface Staff { id: string; name: string }
interface Event { id: string; title: string; date: string; location?: string | null }

const STORAGE_KEY = 'staff_session'

function getSession(): Staff | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export default function App() {
  const [staff, setStaff] = useState<Staff | null>(getSession)
  const [event, setEvent] = useState<Event | null>(null)

  function handleLogin(s: Staff) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(s))
    setStaff(s)
  }

  function handleLogout() {
    sessionStorage.removeItem(STORAGE_KEY)
    setStaff(null)
    setEvent(null)
  }

  if (!staff) return <LoginPage onLogin={handleLogin} />
  if (!event) return <EventSelectPage staff={staff} onSelect={setEvent} onLogout={handleLogout} />
  return <ScannerPage staff={staff} event={event} onBack={() => setEvent(null)} onLogout={handleLogout} />
}
