const BASE = '/api'

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error ?? err.message ?? 'İstek başarısız')
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export const api = {
  // Employees
  getEmployees: () => req('/employees'),
  createEmployee: (data: object) => req('/employees', { method: 'POST', body: JSON.stringify(data) }),
  updateEmployee: (id: string, data: object) => req(`/employees/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteEmployee: (id: string) => req(`/employees/${id}`, { method: 'DELETE' }),
  importEmployees: (csv: string) => req('/employees/import', { method: 'POST', body: JSON.stringify({ csv }) }),

  // Events
  getEvents: () => req('/events'),
  createEvent: (data: object) => req('/events', { method: 'POST', body: JSON.stringify(data) }),
  updateEvent: (id: string, data: object) => req(`/events/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteEvent: (id: string) => req(`/events/${id}`, { method: 'DELETE' }),
  getEventDashboard: (id: string) => req(`/events/${id}/dashboard`),
  getEventInvitations: (id: string) => req(`/events/${id}/invitations`),

  // Invitations
  createInvitations: (eventId: string, employeeIds: string[]) =>
    req(`/events/${eventId}/invitations`, { method: 'POST', body: JSON.stringify({ employeeIds }) }),
  inviteAll: (eventId: string) =>
    req(`/events/${eventId}/invitations/all`, { method: 'POST' }),
  deleteInvitation: (id: string) => req(`/invitations/${id}`, { method: 'DELETE' }),
  getPdfUrl: (id: string) => `${BASE}/invitations/${id}/pdf`,

  // Staff
  getStaff: () => req('/staff'),
  createStaff: (data: object) => req('/staff', { method: 'POST', body: JSON.stringify(data) }),
  deleteStaff: (id: string) => req(`/staff/${id}`, { method: 'DELETE' }),
}
