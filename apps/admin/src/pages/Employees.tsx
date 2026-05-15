import { useState, useEffect } from 'react'
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
      setError(e instanceof Error ? e.message : 'Hata')
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

  return (
    <div className="page">
      <div className="page-header">
        <h1>Çalışanlar</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-secondary" onClick={() => setShowImport(true)}>CSV İçe Aktar</button>
          <button className="btn-primary" onClick={openNew}>+ Çalışan Ekle</button>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {employees.length === 0 ? (
          <div className="empty">Henüz çalışan eklenmemiş</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Ad Soyad</th>
                <th>E-posta</th>
                <th>Telefon</th>
                <th>Departman</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => (
                <tr key={emp.id}>
                  <td>{emp.name}</td>
                  <td>{emp.email}</td>
                  <td>{emp.phone ?? '—'}</td>
                  <td>{emp.department ? <span className="tag">{emp.department}</span> : '—'}</td>
                  <td style={{ display: 'flex', gap: 4 }}>
                    <button className="btn-icon btn-sm" onClick={() => openEdit(emp)}>✏️</button>
                    <button className="btn-icon btn-sm" onClick={() => del(emp.id)}>🗑️</button>
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
            <h2>{editing ? 'Çalışanı Düzenle' : 'Yeni Çalışan'}</h2>
            {error && <p style={{ color: 'var(--danger)', marginBottom: 12, fontSize: 13 }}>{error}</p>}
            {(['name', 'email', 'phone', 'department'] as const).map(field => (
              <div className="form-row" key={field}>
                <label>{field === 'name' ? 'Ad Soyad' : field === 'email' ? 'E-posta' : field === 'phone' ? 'Telefon' : 'Departman'}</label>
                <input value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} />
              </div>
            ))}
            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>İptal</button>
              <button className="btn-primary" onClick={save}>Kaydet</button>
            </div>
          </div>
        </div>
      )}

      {showImport && (
        <div className="modal-overlay" onClick={() => setShowImport(false)}>
          <div className="modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
            <h2>CSV İçe Aktar</h2>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>
              Format: <code>name,email,phone,department</code> (ilk satır başlık olmalı)
            </p>
            <textarea
              style={{ height: 200, fontFamily: 'monospace', fontSize: 13 }}
              placeholder={'name,email,phone,department\nAhmet Yılmaz,ahmet@sirket.com,5551234567,Yazılım'}
              value={csvText}
              onChange={e => setCsvText(e.target.value)}
            />
            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setShowImport(false)}>İptal</button>
              <button className="btn-primary" onClick={importCsv}>İçe Aktar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
