import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Upload, Users } from 'lucide-react'
import { api } from '../api/client.ts'
import type { Employee } from '@event-tracker/shared'

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Employee | null>(null)
  const [csvText, setCsvText] = useState('')
  const [showImport, setShowImport] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', department: '' })
  const [error, setError] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setEmployees(await api.getEmployees() as Employee[])
  }

  function openNew() {
    setEditing(null)
    setForm({ name: '', email: '', phone: '', department: '' })
    setError('')
    setShowModal(true)
  }

  function openEdit(emp: Employee) {
    setEditing(emp)
    setForm({ name: emp.name, email: emp.email, phone: emp.phone ?? '', department: emp.department ?? '' })
    setError('')
    setShowModal(true)
  }

  async function save() {
    try {
      if (editing) {
        await api.updateEmployee(editing.id, form)
      } else {
        await api.createEmployee(form)
      }
      setShowModal(false)
      load()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Hata oluştu')
    }
  }

  async function del(id: string) {
    if (!confirm('Bu çalışanı silmek istiyor musunuz?')) return
    await api.deleteEmployee(id)
    load()
  }

  async function importCsv() {
    try {
      const res = await api.importEmployees(csvText) as { created: number; skipped: number }
      alert(`${res.created} çalışan eklendi, ${res.skipped} atlandı.`)
      setShowImport(false)
      setCsvText('')
      load()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'İçe aktarma hatası')
    }
  }

  const fields: { key: keyof typeof form; label: string; placeholder: string }[] = [
    { key: 'name', label: 'Ad Soyad', placeholder: 'Ahmet Yılmaz' },
    { key: 'email', label: 'E-posta', placeholder: 'ahmet@sirket.com' },
    { key: 'phone', label: 'Telefon', placeholder: '5551234567' },
    { key: 'department', label: 'Departman', placeholder: 'Yazılım' },
  ]

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Çalışanlar</h1>
          <p className="page-subtitle">{employees.length} çalışan</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-secondary" onClick={() => setShowImport(true)}>
            <Upload size={14} /> CSV İçe Aktar
          </button>
          <button className="btn-primary" onClick={openNew}>
            <Plus size={15} /> Çalışan Ekle
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {employees.length === 0 ? (
          <div className="empty">
            <Users size={36} />
            <span>Henüz çalışan eklenmemiş</span>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Ad Soyad</th>
                <th>E-posta</th>
                <th>Telefon</th>
                <th>Departman</th>
                <th style={{ width: 80 }}></th>
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => (
                <tr key={emp.id}>
                  <td style={{ fontWeight: 500 }}>{emp.name}</td>
                  <td>{emp.email}</td>
                  <td>{emp.phone ?? <span style={{ color: 'var(--muted)' }}>—</span>}</td>
                  <td>
                    {emp.department
                      ? <span className="tag">{emp.department}</span>
                      : <span style={{ color: 'var(--muted)' }}>—</span>
                    }
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                      <button className="btn-icon" title="Düzenle" onClick={() => openEdit(emp)}>
                        <Pencil size={14} />
                      </button>
                      <button className="btn-icon btn-delete" title="Sil" onClick={() => del(emp.id)}>
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
              <h2>{editing ? 'Çalışanı Düzenle' : 'Yeni Çalışan'}</h2>
              <button className="btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            {error && <p className="alert alert-error" style={{ marginBottom: 14 }}>{error}</p>}
            {fields.map(f => (
              <div className="form-row" key={f.key}>
                <label>{f.label}</label>
                <input
                  placeholder={f.placeholder}
                  value={form[f.key]}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                />
              </div>
            ))}
            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>İptal</button>
              <button className="btn-primary" onClick={save}>
                {editing ? 'Değişiklikleri Kaydet' : 'Çalışan Ekle'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showImport && (
        <div className="modal-overlay" onClick={() => setShowImport(false)}>
          <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>CSV İçe Aktar</h2>
              <button className="btn-ghost btn-icon" onClick={() => setShowImport(false)}>✕</button>
            </div>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
              Format: <code style={{ background: 'var(--bg)', padding: '1px 5px', borderRadius: 3 }}>name,email,phone,department</code> — ilk satır başlık olmalı
            </p>
            <textarea
              style={{ height: 180, fontFamily: 'monospace', fontSize: 12, resize: 'vertical' }}
              placeholder={'name,email,phone,department\nAhmet Yılmaz,ahmet@sirket.com,5551234567,Yazılım'}
              value={csvText}
              onChange={e => setCsvText(e.target.value)}
            />
            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setShowImport(false)}>İptal</button>
              <button className="btn-primary" onClick={importCsv}>
                <Upload size={14} /> İçe Aktar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
