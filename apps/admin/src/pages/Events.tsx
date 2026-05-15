import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client.ts'
import type { Event } from '@event-tracker/shared'

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Event | null>(null)
  const [form, setForm] = useState({ title: '', date: '', location: '' })
  const [error, setError] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setEvents(await api.getEvents() as Event[])
  }

  function openNew() {
    setEditing(null)
    setForm({ title: '', date: '', location: '' })
    setError('')
    setShowModal(true)
  }

  function openEdit(ev: Event) {
    setEditing(ev)
    setForm({
      title: ev.title,
      date: new Date(ev.date).toISOString().slice(0, 16),
      location: ev.location ?? '',
    })
    setError('')
    setShowModal(true)
  }

  async function save() {
    try {
      const data = { ...form, date: new Date(form.date).toISOString() }
      if (editing) {
        await api.updateEvent(editing.id, data)
      } else {
        await api.createEvent(data)
      }
      setShowModal(false)
      load()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Hata')
    }
  }

  async function del(id: string) {
    if (!confirm('Bu etkinliği ve tüm davetleri silmek istiyor musunuz?')) return
    await api.deleteEvent(id)
    load()
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Etkinlikler</h1>
        <button className="btn-primary" onClick={openNew}>+ Etkinlik Oluştur</button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {events.length === 0 ? (
          <div className="empty">Henüz etkinlik oluşturulmamış</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Etkinlik Adı</th>
                <th>Tarih</th>
                <th>Konum</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {events.map(ev => (
                <tr key={ev.id}>
                  <td>
                    <Link to={`/events/${ev.id}`} style={{ fontWeight: 500 }}>{ev.title}</Link>
                  </td>
                  <td>{new Date(ev.date).toLocaleDateString('tr-TR', { dateStyle: 'medium' })}</td>
                  <td>{ev.location ?? '—'}</td>
                  <td style={{ display: 'flex', gap: 4 }}>
                    <button className="btn-icon btn-sm" onClick={() => openEdit(ev)}>✏️</button>
                    <button className="btn-icon btn-sm" onClick={() => del(ev.id)}>🗑️</button>
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
            <h2>{editing ? 'Etkinliği Düzenle' : 'Yeni Etkinlik'}</h2>
            {error && <p style={{ color: 'var(--danger)', marginBottom: 12, fontSize: 13 }}>{error}</p>}
            <div className="form-row">
              <label>Etkinlik Adı</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="form-row">
              <label>Tarih ve Saat</label>
              <input type="datetime-local" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div className="form-row">
              <label>Konum</label>
              <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
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
