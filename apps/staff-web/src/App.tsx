import { useState } from 'react'
import LoginPage from './pages/Login.tsx'
import ScannerPage from './pages/Scanner.tsx'

interface Staff { id: string; name: string }

const STORAGE_KEY = 'staff_session'

function getSession(): Staff | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export default function App() {
  const [staff, setStaff] = useState<Staff | null>(getSession)

  function handleLogin(s: Staff) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(s))
    setStaff(s)
  }

  function handleLogout() {
    sessionStorage.removeItem(STORAGE_KEY)
    setStaff(null)
  }

  if (!staff) return <LoginPage onLogin={handleLogin} />
  return <ScannerPage staff={staff} onLogout={handleLogout} />
}
