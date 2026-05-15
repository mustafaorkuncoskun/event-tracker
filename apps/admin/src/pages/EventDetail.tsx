import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { io, Socket } from 'socket.io-client'
import { api } from '../api/client.ts'
import type { Event, Invitation, DashboardStats } from '@event-tracker/shared'

interface CheckInFeedItem {
  employeeName: string
  employeeDepartment?: string | null
  checkedAt: string
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [event, setEvent] = useState<Event | null>(null)
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [feed, setFeed] = useState<CheckInFeedItem[]>([])
  const [tab, setTab] = useState<'dashboard' | 'invitations'>('dashboard')
  const [socket, setSocket] = useState<Socket | null>(null)

  const loadStats = useCallback(async () => {
    if (!id) return
    const s = await api.getEventDashboard(id) as DashboardStats
    setStats(s)
  }, [id])

  const loadInvitations = useCallback(async () => {
    if (!id) return
    setInvitations(await api.getEventInvitations(id) as Invitation[])
  }, [id])

  useEffect(() => {
    if (!id) return
    api.getEvents().then(evs => {
      const ev = (evs as Event[]).find(e => e.id === id)
      if (ev) setEvent(ev)
    })
    loadStats()
    loadInvitations()

    const s = io('http://localhost:3001')
    s.emit('join-event', id)
    s.on('checkin', (item: CheckInFeedItem) => {
      setFeed(f => [item, ...f].slice(0, 50))
      loadStats()
    })
    setSocket(s)
    return () => { s.emit('leave-event', id); s.disconnect() }
  }, [id, loadStats, loadInvitations])

  async function inviteAll() {
    if (!id || !confirm('Tüm çalışanlara davet oluşturulsun mu?')) return
    await api.inviteAll(id)
    loadInvitations()
    loadStats()
  }

  async function delInvitation(invId: string) {
    await api.deleteInvitation(invId)
    loadInvitations()
    loadStats()
  }

  if (!event) return <div className="page"><p>Yükleniyor...</p></div>

  const checkedInInvs = invitations.filter(i => i.checkin)
  const notArrivedInvs = invitations.filter(i => !i.checkin)

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 4 }}>
            <Link to="/events">← Etkinlikler</Link>
          </p>
          <h1>{event.title}</h1>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
            {new Date(event.date).toLocaleDateString('tr-TR', { dateStyle: 'full' })}
            {event.location ? ` · ${event.location}` : ''}
          </p>
        </div>
        <button className="btn-primary" onClick={inviteAll}>Herkesi Davet Et</button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['dashboard', 'invitations'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              background: tab === t ? 'var(--primary)' : 'var(--border)',
              color: tab === t ? '#fff' : 'var(--text)',
              borderRadius: 'var(--radius)',
              padding: '6px 16px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            {t === 'dashboard' ? 'Dashboard' : 'Davetliler'}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && stats && (
        <>
          <div className="stat-grid">
            <div className="stat-card">
              <div className="num">{stats.total}</div>
              <div className="label">Toplam Davetli</div>
            </div>
            <div className="stat-card" style={{ borderColor: '#bbf7d0' }}>
              <div className="num" style={{ color: 'var(--success)' }}>{stats.checkedIn}</div>
              <div className="label">Giriş Yapan</div>
            </div>
            <div className="stat-card" style={{ borderColor: '#fde68a' }}>
              <div className="num" style={{ color: '#d97706' }}>{stats.notArrived}</div>
              <div className="label">Henüz Gelmedi</div>
            </div>
          </div>

          {stats.total > 0 && (
            <div className="card" style={{ marginBottom: 24 }}>
              <div style={{ height: 12, background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.round((stats.checkedIn / stats.total) * 100)}%`,
                  background: 'var(--success)',
                  borderRadius: 999,
                  transition: 'width 0.5s ease',
                }} />
              </div>
              <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
                %{Math.round((stats.checkedIn / stats.total) * 100)} katılım oranı
              </p>
            </div>
          )}

          <div className="card">
            <h3 style={{ marginBottom: 12, fontSize: 15 }}>Anlık Giriş Akışı</h3>
            {feed.length === 0 ? (
              <p className="empty" style={{ padding: '24px 0' }}>Henüz giriş yapılmadı</p>
            ) : (
              <div className="checkin-feed">
                {feed.map((item, i) => (
                  <div key={i} className="feed-item">
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>✓</div>
                    <div>
                      <div style={{ fontWeight: 500 }}>{item.employeeName}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                        {item.employeeDepartment && <span>{item.employeeDepartment} · </span>}
                        {new Date(item.checkedAt).toLocaleTimeString('tr-TR')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'invitations' && (
        <div className="card" style={{ padding: 0 }}>
          {invitations.length === 0 ? (
            <div className="empty">Henüz davet oluşturulmamış. "Herkesi Davet Et" butonunu kullanın.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Çalışan</th>
                  <th>Departman</th>
                  <th>Kod</th>
                  <th>Durum</th>
                  <th>Giriş Zamanı</th>
                  <th>PDF</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {checkedInInvs.map(inv => (
                  <tr key={inv.id}>
                    <td>{inv.employee?.name}</td>
                    <td>{inv.employee?.department ?? '—'}</td>
                    <td><code style={{ fontSize: 13 }}>{inv.code.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3')}</code></td>
                    <td><span className="badge badge-green">Giriş Yapıldı</span></td>
                    <td style={{ fontSize: 12 }}>{inv.checkin ? new Date(inv.checkin.checkedAt).toLocaleTimeString('tr-TR') : '—'}</td>
                    <td><a href={api.getPdfUrl(inv.id)} target="_blank" rel="noreferrer" style={{ fontSize: 12 }}>PDF ↗</a></td>
                    <td><button className="btn-icon btn-sm" onClick={() => delInvitation(inv.id)}>🗑️</button></td>
                  </tr>
                ))}
                {notArrivedInvs.map(inv => (
                  <tr key={inv.id}>
                    <td>{inv.employee?.name}</td>
                    <td>{inv.employee?.department ?? '—'}</td>
                    <td><code style={{ fontSize: 13 }}>{inv.code.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3')}</code></td>
                    <td><span className="badge badge-gray">Gelmedi</span></td>
                    <td>—</td>
                    <td><a href={api.getPdfUrl(inv.id)} target="_blank" rel="noreferrer" style={{ fontSize: 12 }}>PDF ↗</a></td>
                    <td><button className="btn-icon btn-sm" onClick={() => delInvitation(inv.id)}>🗑️</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
