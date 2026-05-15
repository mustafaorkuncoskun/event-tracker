import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Pencil, Trash2, CalendarDays, MapPin, ChevronRight, Inbox } from 'lucide-react'
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
      setError(e instanceof Error ? e.message : 'Hata oluştu')
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
        <div>
          <h1>Etkinlikler</h1>
          <p className="page-subtitle">{events.length} etkinlik</p>
        </div>
        <button className="btn-primary" onClick={openNew}>
          <Plus size={15} /> Etkinlik Oluştur
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {events.length === 0 ? (
          <div className="empty">
            <Inbox size={36} />
            <span>Henüz etkinlik oluşturulmamış</span>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Etkinlik Adı</th>
                <th>Tarih</th>
                <th>Konum</th>
                <th style={{ width: 80 }}></th>
              </tr>
            </thead>
            <tbody>
              {events.map(ev => (
                <tr key={ev.id}>
                  <td>
                    <Link
                      to={`/events/${ev.id}`}
                      style={{ fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      {ev.title}
                      <ChevronRight size={14} style={{ color: 'var(--muted)' }} />
                    </Link>
                  </td>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <CalendarDays size={13} style={{ color: 'var(--muted)', flexShrink: 0 }} />
                      {new Date(ev.date).toLocaleDateString('tr-TR', { dateStyle: 'medium' })}
                    </span>
                  </td>
                  <td>
                    {ev.location ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <MapPin size={13} style={{ color: 'var(--muted)', flexShrink: 0 }} />
                        {ev.location}
                      </span>
                    ) : <span style={{ color: 'var(--muted)' }}>—</span>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                      <button className="btn-icon" title="Düzenle" onClick={() => openEdit(ev)}>
                        <Pencil size={14} />
                      </button>
                      <button className="btn-icon btn-delete" title="Sil" onClick={() => del(ev.id)}>
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
              <h2>{editing ? 'Etkinliği Düzenle' : 'Yeni Etkinlik'}</h2>
              <button className="btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            {error && <p className="alert alert-error" style={{ marginBottom: 14 }}>{error}</p>}
            <div className="form-row">
              <label>Etkinlik Adı</label>
              <input
                placeholder="örn: 2025 Yıl Sonu Töreni"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="form-row">
              <label>Tarih ve Saat</label>
              <input type="datetime-local" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div className="form-row">
              <label>Konum <span style={{ color: 'var(--muted)', fontWeight: 400, textTransform: 'none' }}>(opsiyonel)</span></label>
              <input
                placeholder="örn: Toplantı Salonu A"
                value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
              />
            </div>
            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>İptal</button>
              <button className="btn-primary" onClick={save}>
                {editing ? 'Değişiklikleri Kaydet' : 'Etkinlik Oluştur'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
