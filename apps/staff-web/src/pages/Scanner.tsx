import { useState, useEffect, useRef, useCallback } from 'react'
import { BrowserQRCodeReader, IScannerControls } from '@zxing/browser'
import { api } from '../api/client.ts'

interface Staff { id: string; name: string }

interface Props {
  staff: Staff
  onLogout: () => void
}

type ResultState =
  | { type: 'success'; name: string; department?: string }
  | { type: 'already'; name: string; time: string }
  | { type: 'error'; message: string }

export default function ScannerPage({ staff, onLogout }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsRef = useRef<IScannerControls | null>(null)
  const [code, setCode] = useState('')
  const [result, setResult] = useState<ResultState | null>(null)
  const [processing, setProcessing] = useState(false)
  const processingRef = useRef(false)

  const showResult = useCallback((r: ResultState) => {
    setResult(r)
    setTimeout(() => setResult(null), 3000)
  }, [])

  const doCheckin = useCallback(async (value: string) => {
    if (processingRef.current) return
    processingRef.current = true
    setProcessing(true)

    try {
      const res = await api.checkin(value.trim(), staff.id) as {
        success: boolean
        message: string
        employee?: { name: string; department?: string }
        reason?: string
        checkedAt?: string
      }

      if (res.success) {
        showResult({ type: 'success', name: res.employee?.name ?? '', department: res.employee?.department })
        setCode('')
      } else if (res.reason === 'already_checked_in') {
        showResult({
          type: 'already',
          name: res.message,
          time: res.checkedAt ? new Date(res.checkedAt).toLocaleTimeString('tr-TR') : '',
        })
      } else {
        showResult({ type: 'error', message: res.message ?? 'Geçersiz kod' })
      }
    } catch (e: unknown) {
      const err = e as { reason?: string; message?: string }
      if (err?.reason === 'already_checked_in') {
        showResult({ type: 'already', name: err.message ?? '', time: '' })
      } else {
        showResult({ type: 'error', message: err?.message ?? 'Geçersiz kod veya bağlantı hatası' })
      }
    } finally {
      setProcessing(false)
      setTimeout(() => { processingRef.current = false }, 2000)
    }
  }, [staff.id, showResult])

  useEffect(() => {
    if (!videoRef.current) return
    const reader = new BrowserQRCodeReader()

    reader.decodeFromVideoDevice(undefined, videoRef.current, (result) => {
      if (result) doCheckin(result.getText())
    }).then(controls => {
      controlsRef.current = controls
    }).catch(() => {
      // Kamera izni yoksa sessizce geç, kullanıcı manuel kod girebilir
    })

    return () => { controlsRef.current?.stop() }
  }, [doCheckin])

  return (
    <div className="scanner-screen">
      <div className="scanner-header">
        <div>
          <div style={{ fontWeight: 600 }}>Etkinlik Girişi</div>
          <div className="staff-name">Görevli: {staff.name}</div>
        </div>
        <button className="logout-btn" onClick={onLogout}>Çıkış</button>
      </div>

      <div className="camera-container">
        <video ref={videoRef} muted playsInline />
        <div className="scan-overlay">
          <div className="scan-frame" />
        </div>
      </div>

      <div className="manual-section">
        <h3>veya 9 haneli kodu girin</h3>
        <div className="code-input-row">
          <input
            className="code-input"
            type="text"
            inputMode="numeric"
            placeholder="123 456 789"
            value={code.replace(/(\d{3})(\d{1,3})?(\d{1,3})?/, (_, a, b, c) => [a, b, c].filter(Boolean).join(' '))}
            maxLength={11}
            onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 9))}
            onKeyDown={e => { if (e.key === 'Enter' && code.length === 9) doCheckin(code) }}
          />
          <button
            className="submit-btn"
            disabled={code.length !== 9 || processing}
            onClick={() => doCheckin(code)}
          >
            Giriş
          </button>
        </div>
      </div>

      {result && (
        <div
          className={`result-overlay ${result.type === 'success' ? 'success' : result.type === 'already' ? 'warning' : 'error'}`}
          onClick={() => setResult(null)}
        >
          <div className="result-card">
            <div className="result-icon">
              {result.type === 'success' ? '✅' : result.type === 'already' ? '⚠️' : '❌'}
            </div>
            {result.type === 'success' && (
              <>
                <div className="result-name">{result.name}</div>
                {result.department && <div className="result-detail">{result.department}</div>}
                <div className="result-detail" style={{ marginTop: 8 }}>Giriş kaydedildi</div>
              </>
            )}
            {result.type === 'already' && (
              <>
                <div className="result-name">Zaten Giriş Yapıldı</div>
                <div className="result-detail">{result.name}</div>
                {result.time && <div className="result-detail">{result.time}</div>}
              </>
            )}
            {result.type === 'error' && (
              <>
                <div className="result-name">Geçersiz</div>
                <div className="result-detail">{result.message}</div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
