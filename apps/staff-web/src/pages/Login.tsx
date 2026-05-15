import { useState } from 'react'
import { api } from '../api/client.ts'

interface Props {
  onLogin: (staff: { id: string; name: string }) => void
}

const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫']

export default function LoginPage({ onLogin }: Props) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function press(val: string) {
    if (loading) return
    setError('')

    if (val === '⌫') {
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
      <div className="logo">🎫</div>
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
          <button key={i} className={`numpad-btn ${d === '⌫' ? 'del' : ''}`} onClick={() => press(d)}>
            {d}
          </button>
        ))}
      </div>
    </div>
  )
}
