import { useState, useEffect } from 'react'
import { CalendarDays, MapPin, ChevronRight, LogOut, Inbox } from 'lucide-react'

interface Staff { id: string; name: string }
interface Event { id: string; title: string; date: string; location?: string | null }

interface Props {
  staff: Staff
  onSelect: (event: Event) => void
  onLogout: () => void
}

export default function EventSelectPage({ staff, onSelect, onLogout }: Props) {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/events')
      .then(r => r.json())
      .then(data => { setEvents(data); setLoading(false) })
      .catch(() => { setError('Etkinlikler yüklenemedi'); setLoading(false) })
  }, [])

  return (
    <div style={styles.screen}>
      <div style={styles.header}>
        <div>
          <div style={styles.title}>Etkinlik Seç</div>
          <div style={styles.sub}>Görevli: {staff.name}</div>
        </div>
        <button style={styles.logoutBtn} onClick={onLogout}>
          <LogOut size={14} />
          Çıkış
        </button>
      </div>

      <div style={styles.list}>
        {loading && <div style={styles.info}>Yükleniyor...</div>}
        {error && <div style={styles.info}>{error}</div>}
        {!loading && events.length === 0 && !error && (
          <div style={{ ...styles.info, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <Inbox size={40} color="#475569" />
            <span>Aktif etkinlik bulunamadı</span>
          </div>
        )}
        {events.map(ev => (
          <button key={ev.id} style={styles.card} onClick={() => onSelect(ev)}>
            <div style={styles.cardBody}>
              <div style={styles.cardTitle}>{ev.title}</div>
              <div style={styles.cardMeta}>
                <span style={styles.metaItem}>
                  <CalendarDays size={12} color="#64748b" />
                  {new Date(ev.date).toLocaleDateString('tr-TR', { dateStyle: 'long' })}
                </span>
                {ev.location && (
                  <span style={styles.metaItem}>
                    <MapPin size={12} color="#64748b" />
                    {ev.location}
                  </span>
                )}
              </div>
            </div>
            <ChevronRight size={18} color="#475569" />
          </button>
        ))}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  screen: { minHeight: '100dvh', background: '#0f172a', display: 'flex', flexDirection: 'column' },
  header: {
    background: '#1e293b',
    padding: '14px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid #1e3a5f',
  },
  title: { fontWeight: 700, fontSize: 15, color: '#f1f5f9' },
  sub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  logoutBtn: {
    background: 'transparent',
    border: '1px solid #334155',
    borderRadius: 7,
    color: '#64748b',
    fontSize: 13,
    padding: '6px 11px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  list: { flex: 1, padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 10 },
  info: { textAlign: 'center', color: '#64748b', marginTop: 48, fontSize: 14 },
  card: {
    background: '#1e293b',
    border: '1px solid #1e3a5f',
    borderRadius: 10,
    padding: '14px 16px',
    cursor: 'pointer',
    textAlign: 'left',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    transition: 'border-color 0.15s, background 0.15s',
  },
  cardBody: { display: 'flex', flexDirection: 'column', gap: 5 },
  cardTitle: { fontSize: 15, fontWeight: 600, color: '#f1f5f9' },
  cardMeta: { display: 'flex', flexDirection: 'column', gap: 3 },
  metaItem: { display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#64748b' },
}
