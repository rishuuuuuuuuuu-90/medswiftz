// User roles
export enum UserRole {
  PATIENT = 'PATIENT',
  PHARMACIST = 'PHARMACIST',
  DELIVERY_PARTNER = 'DELIVERY_PARTNER',
  ADMIN = 'ADMIN',
}

// Order statuses
export enum OrderStatus {
  PRESCRIPTION_UPLOADED = 'PRESCRIPTION_UPLOADED',
  VERIFIED = 'VERIFIED',
  PACKED = 'PACKED',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REJECTED = 'REJECTED',
}

// Prescription statuses
export enum PrescriptionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

// Payment statuses
export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  COD = 'COD',
}

// Payment methods
export enum PaymentMethod {
  ONLINE = 'ONLINE',
  COD = 'COD',
}

// Delivery task statuses
export enum DeliveryTaskStatus {
  ASSIGNED = 'ASSIGNED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  PICKED_UP = 'PICKED_UP',
  REACHED_DESTINATION = 'REACHED_DESTINATION',
  DELIVERED = 'DELIVERED',
}

// API response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone: string;
  role?: UserRole;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

// User types
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  addresses?: Address[];
}

export interface Address {
  id: string;
  userId: string;
  label: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  lat?: number;
  lng?: number;
  isDefault: boolean;
}

// Prescription types
export interface Prescription {
  id: string;
  userId: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  status: PrescriptionStatus;
  reviewedBy?: string;
  reviewNote?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Medicine types
export interface Medicine {
  id: string;
  name: string;
  genericName?: string;
  manufacturer?: string;
  category: string;
  description?: string;
  requiresPrescription: boolean;
  price: number;
  imageUrl?: string;
  createdAt: string;
}

export interface Inventory {
  id: string;
  medicineId: string;
  stock: number;
  medicine: Medicine;
}

// Cart types
export interface CartItem {
  id: string;
  cartId: string;
  medicineId: string;
  quantity: number;
  medicine: Medicine;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  totalAmount: number;
}

// Order types
export interface Order {
  id: string;
  userId: string;
  prescriptionId?: string;
  status: OrderStatus;
  totalAmount: number;
  deliveryFee: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  addressId: string;
  items: OrderItem[];
  address?: Address;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  medicineId: string;
  quantity: number;
  price: number;
  medicine: Medicine;
}

// Delivery types
export interface DeliveryTask {
  id: string;
  orderId: string;
  partnerId?: string;
  status: DeliveryTaskStatus;
  otp?: string;
  assignedAt?: string;
  pickedAt?: string;
  deliveredAt?: string;
  order?: Order;
}

// Socket event types
export enum SocketEvents {
  ORDER_STATUS_UPDATE = 'order:status:update',
  DELIVERY_LOCATION_UPDATE = 'delivery:location:update',
  ORDER_ASSIGNED = 'order:assigned',
  NOTIFICATION = 'notification',
  JOIN_ROOM = 'join:room',
  LEAVE_ROOM = 'leave:room',
}

export interface LocationUpdate {
  orderId: string;
  lat: number;
  lng: number;
}

export interface OrderStatusUpdate {
  orderId: string;
  status: OrderStatus;
  timestamp: string;
}
