import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { io, Socket } from 'socket.io-client'
import {
  ArrowLeft, Users, UserCheck, UserX, FileDown,
  Trash2, CheckCircle, TrendingUp, Send,
} from 'lucide-react'
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
  const [inviting, setInviting] = useState(false)
  const [inviteMsg, setInviteMsg] = useState<{ text: string; ok: boolean } | null>(null)

  const loadStats = useCallback(async (): Promise<void> => {
    if (!id) return
    const s = await api.getEventDashboard(id) as DashboardStats
    setStats(s)
  }, [id])

  const loadInvitations = useCallback(async (): Promise<void> => {
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
    setInviting(true)
    setInviteMsg(null)
    try {
      const res = await api.inviteAll(id) as { created: number }
      await loadInvitations()
      await loadStats()
      setInviteMsg({ text: `${res.created} davet oluşturuldu`, ok: true })
      setTab('invitations')
    } catch (e: unknown) {
      setInviteMsg({ text: e instanceof Error ? e.message : 'Davet oluşturulamadı', ok: false })
    } finally {
      setInviting(false)
      setTimeout(() => setInviteMsg(null), 5000)
    }
  }

  async function delInvitation(invId: string) {
    await api.deleteInvitation(invId)
    loadInvitations()
    loadStats()
  }

  if (!event) return <div className="page"><p style={{ color: 'var(--muted)' }}>Yükleniyor...</p></div>

  const checkedInInvs = invitations.filter(i => i.checkin)
  const notArrivedInvs = invitations.filter(i => !i.checkin)
  const attendanceRate = stats && stats.total > 0 ? Math.round((stats.checkedIn / stats.total) * 100) : 0

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p style={{ marginBottom: 6 }}>
            <Link to="/events" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--muted)' }}>
              <ArrowLeft size={13} /> Etkinlikler
            </Link>
          </p>
          <h1>{event.title}</h1>
          <p className="page-subtitle">
            {new Date(event.date).toLocaleDateString('tr-TR', { dateStyle: 'full' })}
            {event.location ? ` · ${event.location}` : ''}
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          <button className="btn-primary" onClick={inviteAll} disabled={inviting}>
            <Send size={14} />
            {inviting ? 'Davetler oluşturuluyor…' : 'Herkesi Davet Et'}
          </button>
          {inviteMsg && (
            <span className={`alert ${inviteMsg.ok ? 'alert-success' : 'alert-error'}`} style={{ fontSize: 12 }}>
              {inviteMsg.ok ? <CheckCircle size={13} /> : null}
              {inviteMsg.text}
            </span>
          )}
        </div>
      </div>

      <div className="tabs">
        <button className={`tab-btn ${tab === 'dashboard' ? 'active' : ''}`} onClick={() => setTab('dashboard')}>
          Dashboard
        </button>
        <button className={`tab-btn ${tab === 'invitations' ? 'active' : ''}`} onClick={() => setTab('invitations')}>
          Davetliler {invitations.length > 0 && `(${invitations.length})`}
        </button>
      </div>

      {tab === 'dashboard' && (
        <>
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Users size={12} /> Toplam Davetli
              </div>
              <div className="stat-num">{stats?.total ?? 0}</div>
            </div>
            <div className="stat-card" style={{ borderColor: '#bbf7d0' }}>
              <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <UserCheck size={12} style={{ color: 'var(--success)' }} />
                <span style={{ color: 'var(--success)' }}>Giriş Yapan</span>
              </div>
              <div className="stat-num" style={{ color: 'var(--success)' }}>{stats?.checkedIn ?? 0}</div>
            </div>
            <div className="stat-card" style={{ borderColor: '#fde68a' }}>
              <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <UserX size={12} style={{ color: 'var(--warning)' }} />
                <span style={{ color: 'var(--warning)' }}>Henüz Gelmedi</span>
              </div>
              <div className="stat-num" style={{ color: 'var(--warning)' }}>{stats?.notArrived ?? 0}</div>
            </div>
          </div>

          {stats && stats.total > 0 && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <TrendingUp size={14} style={{ color: 'var(--primary)' }} /> Katılım Oranı
                </span>
                <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--primary)' }}>%{attendanceRate}</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${attendanceRate}%` }} />
              </div>
            </div>
          )}

          <div className="card">
            <h3 style={{ marginBottom: 14, fontSize: 14, fontWeight: 600 }}>Anlık Giriş Akışı</h3>
            {feed.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
                Henüz giriş yapılmadı
              </div>
            ) : (
              <div className="checkin-feed">
                {feed.map((item, i) => (
                  <div key={i} className="feed-item">
                    <div className="feed-avatar">
                      <CheckCircle size={16} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{item.employeeName}</div>
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
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {invitations.length === 0 ? (
            <div className="empty">
              <Send size={36} />
              <span>Henüz davet oluşturulmamış</span>
              <span style={{ fontSize: 12 }}>Yukarıdaki "Herkesi Davet Et" butonunu kullanın</span>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Çalışan</th>
                  <th>Departman</th>
                  <th>Kod</th>
                  <th>Durum</th>
                  <th>Giriş Saati</th>
                  <th style={{ width: 80 }}></th>
                </tr>
              </thead>
              <tbody>
                {checkedInInvs.map(inv => (
                  <tr key={inv.id}>
                    <td style={{ fontWeight: 500 }}>{inv.employee?.name}</td>
                    <td>{inv.employee?.department
                      ? <span className="tag">{inv.employee.department}</span>
                      : <span style={{ color: 'var(--muted)' }}>—</span>
                    }</td>
                    <td>
                      <code style={{ fontSize: 12, background: 'var(--bg)', padding: '2px 6px', borderRadius: 4 }}>
                        {inv.code.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3')}
                      </code>
                    </td>
                    <td><span className="badge badge-green"><CheckCircle size={10} /> Giriş Yapıldı</span></td>
                    <td style={{ fontSize: 12 }}>
                      {inv.checkin ? new Date(inv.checkin.checkedAt).toLocaleTimeString('tr-TR') : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                        <a href={api.getPdfUrl(inv.id)} target="_blank" rel="noreferrer" title="PDF İndir">
                          <button className="btn-icon"><FileDown size={14} /></button>
                        </a>
                        <button className="btn-icon btn-delete" title="Sil" onClick={() => delInvitation(inv.id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {notArrivedInvs.map(inv => (
                  <tr key={inv.id}>
                    <td style={{ fontWeight: 500 }}>{inv.employee?.name}</td>
                    <td>{inv.employee?.department
                      ? <span className="tag">{inv.employee.department}</span>
                      : <span style={{ color: 'var(--muted)' }}>—</span>
                    }</td>
                    <td>
                      <code style={{ fontSize: 12, background: 'var(--bg)', padding: '2px 6px', borderRadius: 4 }}>
                        {inv.code.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3')}
                      </code>
                    </td>
                    <td><span className="badge badge-gray">Bekleniyor</span></td>
                    <td style={{ color: 'var(--muted)', fontSize: 12 }}>—</td>
                    <td>
                      <div style={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                        <a href={api.getPdfUrl(inv.id)} target="_blank" rel="noreferrer" title="PDF İndir">
                          <button className="btn-icon"><FileDown size={14} /></button>
                        </a>
                        <button className="btn-icon btn-delete" title="Sil" onClick={() => delInvitation(inv.id)}>
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
      )}
    </div>
  )
}
