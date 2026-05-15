const BASE = '/api'

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const data = await res.json()
  if (!res.ok) throw data
  return data
}

export const api = {
  login: (pinCode: string) =>
    req<{ id: string; name: string }>('/staff/login', {
      method: 'POST',
      body: JSON.stringify({ pinCode }),
    }),

  checkin: (value: string, staffId: string, eventId: string) =>
    req('/checkin', {
      method: 'POST',
      body: JSON.stringify({ value, staffId, eventId }),
    }),
}
