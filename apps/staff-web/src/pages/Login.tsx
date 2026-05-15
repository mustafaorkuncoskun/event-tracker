import { useState } from 'react'
import { Delete } from 'lucide-react'
import { api } from '../api/client.ts'

interface Props {
  onLogin: (staff: { id: string; name: string }) => void
}

const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del']

export default function LoginPage({ onLogin }: Props) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function press(val: string) {
    if (loading) return
    setError('')

    if (val === 'del') {
      setPin(p => p.slice(0, -1))
      return
    }
    if (val === '') return

    const next = pin + val
    setPin(next)

    if (next.length === 4) {
      setLoading(true)
      try {
        const staff = await api.login(next)
        onLogin(staff)
      } catch {
        setError('Hatalı PIN, tekrar deneyin')
        setTimeout(() => setPin(''), 500)
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <div className="screen">
      <div className="login-brand">
        <div className="login-icon">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12h20M2 12a10 10 0 0 1 20 0M2 12a10 10 0 0 0 20 0M12 2v20"/>
          </svg>
        </div>
        <span className="login-brand-name">Etkinlik Takip</span>
      </div>

      <h1 className="title">Görevli Girişi</h1>
      <p className="subtitle">4 haneli PIN kodunuzu girin</p>

      <div className="pin-display">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`pin-dot ${i < pin.length ? 'filled' : ''}`} />
        ))}
      </div>

      {error && <p className="error-msg">{error}</p>}

      <div className="numpad">
        {DIGITS.map((d, i) => (
          <button
            key={i}
            className={`numpad-btn ${d === 'del' ? 'del' : ''} ${d === '' ? 'invisible' : ''}`}
            onClick={() => press(d)}
            disabled={d === '' || loading}
          >
            {d === 'del' ? <Delete size={20} /> : d}
          </button>
        ))}
      </div>
    </div>
  )
}
