import { useState, useEffect, useRef, useCallback } from 'react'
import { BrowserQRCodeReader, IScannerControls } from '@zxing/browser'
import { createWorker } from 'tesseract.js'
import { CheckCircle2, AlertTriangle, XCircle, ChevronLeft, LogOut, ScanLine } from 'lucide-react'
import { api } from '../api/client.ts'

interface Staff { id: string; name: string }
interface Event { id: string; title: string; date: string; location?: string | null }

interface Props {
  staff: Staff
  event: Event
  onBack: () => void
  onLogout: () => void
}

type ResultState =
  | { type: 'success'; name: string; department?: string }
  | { type: 'already'; name: string; time: string }
  | { type: 'error'; message: string }

export default function ScannerPage({ staff, event, onBack, onLogout }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const controlsRef = useRef<IScannerControls | null>(null)
  const [code, setCode] = useState('')
  const [result, setResult] = useState<ResultState | null>(null)
  const [processing, setProcessing] = useState(false)
  const [ocrLoading, setOcrLoading] = useState(false)
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
      const res = await api.checkin(value.trim(), staff.id, event.id) as {
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
  }, [staff.id, event.id, showResult])

  useEffect(() => {
    if (!videoRef.current) return
    const reader = new BrowserQRCodeReader()
    let capturedStream: MediaStream | null = null

    reader.decodeFromVideoDevice(undefined, videoRef.current, (result, _, controls) => {
      if (result) doCheckin(result.getText())
      if (!controlsRef.current && controls) controlsRef.current = controls
    }).then(controls => {
      controlsRef.current = controls
      // Stream'i controls.stop() çağrılmadan önce yakalıyoruz
      capturedStream = videoRef.current?.srcObject as MediaStream | null
    }).catch(() => {})

    return () => {
      // Önce stream'i al (controls.stop() srcObject'i temizleyebilir)
      const stream = capturedStream ?? (videoRef.current?.srcObject as MediaStream | null)
      controlsRef.current?.stop()
      stream?.getTracks().forEach(t => t.stop())
      if (videoRef.current) videoRef.current.srcObject = null
    }
  }, [doCheckin])

  const doOCR = useCallback(async () => {
    if (ocrLoading || !videoRef.current) return
    setOcrLoading(true)
    try {
      const video = videoRef.current
      const canvas = canvasRef.current!
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      canvas.getContext('2d')!.drawImage(video, 0, 0)
      const dataUrl = canvas.toDataURL('image/png')

      const worker = await createWorker('eng')
      const { data } = await worker.recognize(dataUrl)
      await worker.terminate()

      const match = data.text.replace(/\s/g, '').match(/\d{9}/)
      if (match) {
        setCode(match[0])
        doCheckin(match[0])
      } else {
        showResult({ type: 'error', message: 'Kamerayı 9 haneli kodun üzerine tutun' })
      }
    } catch {
      showResult({ type: 'error', message: 'OCR işlemi başarısız oldu' })
    } finally {
      setOcrLoading(false)
    }
  }, [ocrLoading, doCheckin, showResult])

  return (
    <div className="scanner-screen">
      <div className="scanner-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="back-btn" onClick={onBack} title="Etkinlik seçimine dön">
            <ChevronLeft size={16} />
          </button>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>{event.title}</div>
            <div className="staff-name">Görevli: {staff.name}</div>
          </div>
        </div>
        <button className="logout-btn" onClick={onLogout}>
          <LogOut size={14} /> Çıkış
        </button>
      </div>

      <div className="camera-container">
        <video ref={videoRef} muted playsInline />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        <div className="scan-overlay">
          <div className="scan-frame" />
        </div>
      </div>

      <div className="manual-section">
        <h3>veya 9 haneli kodu girin</h3>
        <div className="code-input-row">
          <button
            className="ocr-btn"
            onClick={doOCR}
            disabled={ocrLoading}
            title="Kameradan OCR ile oku"
          >
            {ocrLoading ? '…' : 'OCR'}
          </button>
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
              {result.type === 'success' && <CheckCircle2 size={72} strokeWidth={1.5} />}
              {result.type === 'already' && <AlertTriangle size={72} strokeWidth={1.5} />}
              {result.type === 'error' && <XCircle size={72} strokeWidth={1.5} />}
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
                <div className="result-name">Geçersiz Kod</div>
                <div className="result-detail">{result.message}</div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
