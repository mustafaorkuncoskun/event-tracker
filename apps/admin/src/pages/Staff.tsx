import { useState, useEffect } from 'react'
import { Plus, Trash2, ShieldCheck } from 'lucide-react'
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
      setError(e instanceof Error ? e.message : 'Hata oluştu')
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
        <div>
          <h1>Görevliler</h1>
          <p className="page-subtitle">Kapı uygulamasına 4 haneli PIN ile giriş yaparlar</p>
        </div>
        <button className="btn-primary" onClick={() => { setError(''); setForm({ name: '', pinCode: '' }); setShowModal(true) }}>
          <Plus size={15} /> Görevli Ekle
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {staff.length === 0 ? (
          <div className="empty">
            <ShieldCheck size={36} />
            <span>Henüz görevli eklenmemiş</span>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Ad Soyad</th>
                <th style={{ width: 60 }}></th>
              </tr>
            </thead>
            <tbody>
              {staff.map(s => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 500 }}>{s.name}</td>
                  <td>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button className="btn-icon btn-delete" title="Sil" onClick={() => del(s.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Yeni Görevli</h2>
              <button className="btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            {error && <p className="alert alert-error" style={{ marginBottom: 14 }}>{error}</p>}
            <div className="form-row">
              <label>Ad Soyad</label>
              <input
                placeholder="örn: Mehmet Kaya"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="form-row">
              <label>4 Haneli PIN</label>
              <input
                value={form.pinCode}
                maxLength={4}
                placeholder="örn: 1234"
                style={{ letterSpacing: 4, fontSize: 18, fontWeight: 600 }}
                onChange={e => setForm(f => ({ ...f, pinCode: e.target.value.replace(/\D/g, '') }))}
              />
            </div>
            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>İptal</button>
              <button className="btn-primary" onClick={save}>Görevli Ekle</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
