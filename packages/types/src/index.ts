// Auth
export type Role = 'USER' | 'ADMIN' | 'SALE' | 'AUDIT' | 'MANAGER' | 'LOGISTIC';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
}

// Documents (memo / sample request approval flow)
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type MemoStatus = 'PENDING_AUDIT' | 'PENDING_MANAGER' | 'PENDING_LOGISTIC' | 'DELIVERED' | 'REJECTED';

export interface MemoApproval {
  id: string;
  step: number;
  role: Role;
  label: string;
  status: ApprovalStatus;
  approvedById: string | null;
  approvedByName: string | null;
  reason: string | null;
  decidedAt: string | null;
}

export interface MemoRow {
  productId: string;
  sku: string;
  name: string;
  qty: number;
}

export interface MemoDocument {
  id: string;
  docNo: string;
  toName: string | null;
  toPosition: string | null;
  toDept: string | null;
  fromName: string;
  fromPosition: string;
  fromDept: string;
  subject: string;
  clinicName: string | null;
  deliveryAddress: string | null;
  rows: MemoRow[];
  notes: string | null;
  status: MemoStatus;
  createdById: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  approvals: MemoApproval[];
}

// Products
export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string | null;
  price: number;
  stock: number;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

// API Response
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Socket Events
export interface SocketEvents {
  message: { room: string; text: string; userId: string };
  join_room: { room: string };
  leave_room: { room: string };
}
