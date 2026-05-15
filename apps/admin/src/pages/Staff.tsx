import { useState, useEffect } from 'react'
import { api } from '../api/client.ts'

interface StaffUser { id: string; name: string }

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffUser[]>([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', pinCode: '' })
  const [error, setError] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setStaff(await api.getStaff() as StaffUser[])
  }

  async function save() {
    try {
      await api.createStaff(form)
      setShowModal(false)
      setForm({ name: '', pinCode: '' })
      load()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Hata')
    }
  }

  async function del(id: string) {
    if (!confirm('Bu görevliyi silmek istiyor musunuz?')) return
    await api.deleteStaff(id)
    load()
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Görevliler</h1>
        <button className="btn-primary" onClick={() => { setError(''); setShowModal(true) }}>+ Görevli Ekle</button>
      </div>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>
        Görevliler kapı uygulamasına 4 haneli PIN ile giriş yapar.
      </p>

      <div className="card" style={{ padding: 0 }}>
        {staff.length === 0 ? (
          <div className="empty">Henüz görevli eklenmemiş</div>
        ) : (
          <table>
            <thead>
              <tr><th>Ad Soyad</th><th></th></tr>
            </thead>
            <tbody>
              {staff.map(s => (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td><button className="btn-icon btn-sm" onClick={() => del(s.id)}>🗑️</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Yeni Görevli</h2>
            {error && <p style={{ color: 'var(--danger)', marginBottom: 12, fontSize: 13 }}>{error}</p>}
            <div className="form-row">
              <label>Ad Soyad</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="form-row">
              <label>4 Haneli PIN</label>
              <input
                value={form.pinCode}
                maxLength={4}
                onChange={e => setForm(f => ({ ...f, pinCode: e.target.value.replace(/\D/g, '') }))}
                placeholder="örn: 1234"
              />
            </div>
            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>İptal</button>
              <button className="btn-primary" onClick={save}>Kaydet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
