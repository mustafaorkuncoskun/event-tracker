export interface Employee {
  id: string
  name: string
  email: string
  phone?: string | null
  department?: string | null
  createdAt: string
}

export interface Event {
  id: string
  title: string
  date: string
  location?: string | null
  createdAt: string
}

export interface Invitation {
  id: string
  employeeId: string
  eventId: string
  token: string
  code: string
  sentAt?: string | null
  createdAt: string
  employee?: Employee
  checkin?: CheckIn | null
}

export interface CheckIn {
  id: string
  invitationId: string
  staffId: string
  checkedAt: string
  staffUser?: StaffUser
  invitation?: Invitation
}

export interface StaffUser {
  id: string
  name: string
  pinCode: string
}

export interface DashboardStats {
  eventId: string
  total: number
  checkedIn: number
  notArrived: number
}

export interface CheckInRequest {
  value: string // QR token (UUID) veya 9 haneli kod
  staffId: string
}

export interface CheckInResponse {
  success: boolean
  employee?: Employee
  message: string
}

export interface ApiError {
  error: string
  message: string
}

export type CheckInResult =
  | { success: true; employee: Employee; checkedAt: string }
  | { success: false; reason: 'not_found' | 'already_checked_in' | 'invalid' }
