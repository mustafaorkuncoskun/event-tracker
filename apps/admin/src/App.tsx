import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { CalendarDays, Users, ShieldCheck } from 'lucide-react'
import EmployeesPage from './pages/Employees.tsx'
import EventsPage from './pages/Events.tsx'
import EventDetailPage from './pages/EventDetail.tsx'
import StaffPage from './pages/Staff.tsx'

export default function App() {
  return (
    <BrowserRouter>
      <nav className="nav">
        <a href="/" className="nav-brand">
          <div className="brand-icon">
            <CalendarDays size={16} />
          </div>
          Etkinlik Takip
        </a>
        <div className="nav-links">
          <NavLink to="/events" className={({ isActive }) => isActive ? 'active' : ''}>
            <CalendarDays size={15} /> Etkinlikler
          </NavLink>
          <NavLink to="/employees" className={({ isActive }) => isActive ? 'active' : ''}>
            <Users size={15} /> Çalışanlar
          </NavLink>
          <NavLink to="/staff" className={({ isActive }) => isActive ? 'active' : ''}>
            <ShieldCheck size={15} /> Görevliler
          </NavLink>
        </div>
      </nav>
      <Routes>
        <Route path="/" element={<Navigate to="/events" replace />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/events/:id" element={<EventDetailPage />} />
        <Route path="/employees" element={<EmployeesPage />} />
        <Route path="/staff" element={<StaffPage />} />
      </Routes>
    </BrowserRouter>
  )
}
