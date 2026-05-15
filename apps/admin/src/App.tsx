import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import EmployeesPage from './pages/Employees.tsx'
import EventsPage from './pages/Events.tsx'
import EventDetailPage from './pages/EventDetail.tsx'
import StaffPage from './pages/Staff.tsx'

export default function App() {
  return (
    <BrowserRouter>
      <nav className="nav">
        <span className="logo">Etkinlik Takip</span>
        <NavLink to="/events" className={({ isActive }) => isActive ? 'active' : ''}>Etkinlikler</NavLink>
        <NavLink to="/employees" className={({ isActive }) => isActive ? 'active' : ''}>Çalışanlar</NavLink>
        <NavLink to="/staff" className={({ isActive }) => isActive ? 'active' : ''}>Görevliler</NavLink>
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
