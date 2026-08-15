export type UserRole = 'OWNER' | 'ADMIN' | 'STAFF'

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'DISPATCHED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'

export type WhatsAppConnectionStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR'

export type NotificationType =
  | 'NEW_ORDER'
  | 'ORDER_CONFIRMED'
  | 'ORDER_CANCELLED'
  | 'AUTOMATION_FAILED'
  | 'WHATSAPP_ISSUE'
  | 'SYSTEM'

export interface User {
  id: string
  phoneNumber: string
  email?: string | null
  name: string
  firstName?: string | null
  lastName?: string | null
  role: UserRole
  businessId: string
  isVerified: boolean
  createdAt?: string
}

export interface Business {
  id: string
  name: string
  companyName: string
  slug: string
  phone?: string | null
  email?: string | null
  address?: string | null
  timezone?: string | null
  currency?: string | null
  whatsappNumber?: string | null
  whatsappVerified: boolean
  onboardingCompleted: boolean
  whatsappConnected?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken?: string
  user: User
  business: Business
}

export interface RegisterResponse {
  phoneNumber: string
  requiresVerification: boolean
  devCode?: string
}

export interface Product {
  id: string
  businessId: string
  name: string
  description?: string | null
  sku?: string | null
  price: number
  stock: number
  imageUrl?: string | null
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export interface Customer {
  id: string
  businessId: string
  name: string
  phone: string
  email?: string | null
  notes?: string | null
  orderCount?: number
  totalSpent?: number
  createdAt?: string
  updatedAt?: string
  orders?: Order[]
}

export interface OrderItem {
  id: string
  orderId: string
  productId?: string | null
  name: string
  quantity: number
  unitPrice: number
  totalPrice: number
  product?: Product | null
}

export interface OrderStatusHistoryItem {
  id: string
  status: OrderStatus
  changedBy?: string | null
  note?: string | null
  createdAt: string
}

export interface Order {
  id: string
  businessId: string
  customerId: string
  orderNumber?: string
  status: OrderStatus
  totalAmount: number
  currency?: string
  notes?: string | null
  source?: string | null
  deliveryAddress?: string | null
  createdAt: string
  updatedAt?: string
  customer?: Customer
  items?: OrderItem[]
  statusHistory?: OrderStatusHistoryItem[]
}

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface DashboardStats {
  companyName: string
  newOrders: number
  pending: number
  dispatched: number
  delivered: number
  recentOrders: Order[]
  customerOrderLink: string
  vendorDispatchLink: string
  currency?: string
}

export interface PublicOrderPage {
  businessName: string
  slug: string
  whatsappNumber?: string | null
  whatsappUrl?: string | null
}

export interface VendorPortalData {
  businessName: string
  vendorName: string
  orders: Order[]
}

export interface OnboardingResult extends Business {
  requiresWhatsAppOtp?: boolean
  requiresWhatsAppConnect?: boolean
  devCode?: string
}

export interface WhatsAppStatus {
  status: WhatsAppConnectionStatus
  phoneNumber?: string | null
  displayPhoneNumber?: string | null
  displayName?: string | null
  lastCheckedAt?: string | null
  connectedAt?: string | null
  errorMessage?: string | null
  connected?: boolean
  customerChatUrl?: string | null
  onboardingPath?: string | null
  isOnWhatsAppBusinessApp?: boolean
}

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  isRead: boolean
  createdAt: string
  metadata?: Record<string, unknown> | null
}

export interface OnboardingPayload {
  companyName: string
  whatsappNumber?: string
}
