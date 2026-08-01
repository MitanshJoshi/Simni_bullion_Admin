import apiClient from './apiClient';

// ── KYC ───────────────────────────────────────────────────────────────────

export interface KycDocument {
  id: string;
  documentType: string;
  documentUrl: string;
}

export interface PendingKycItem {
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  kycProfile: {
    status: string;
    accountType: string;
    submittedAt: string | null;
    rejectReason: string | null;
  };
  documents: KycDocument[];
}

export async function getPendingKyc(): Promise<{ total: number; items: PendingKycItem[] }> {
  const { data } = await apiClient.get('/admin/kyc/pending');
  return data.data;
}

export async function approveKyc(userId: string): Promise<void> {
  await apiClient.post(`/admin/kyc/${userId}/approve`);
}

export async function rejectKyc(userId: string, rejectReason: string): Promise<void> {
  await apiClient.post(`/admin/kyc/${userId}/reject`, { rejectReason });
}

// ── Orders ────────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAYMENT_SUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED';

export interface AdminOrder {
  id: string;
  userId: string;
  productId: string | null;
  productName: string | null;
  metal: 'GOLD' | 'SILVER';
  quantityGrams: number;
  pricePerGram: number;
  totalAmount: number;
  status: OrderStatus;
  rejectReason: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  createdAt: string;
  updatedAt: string;
  user: { email: string; firstName: string | null; lastName: string | null };
  bankAccount: {
    id: string;
    bankName: string;
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    upiId: string | null;
  };
  payment: { screenshotUrl: string; submittedAt: string } | null;
}

export async function getAdminOrders(status?: OrderStatus): Promise<{ total: number; orders: AdminOrder[] }> {
  const { data } = await apiClient.get('/admin/orders', {
    params: status ? { status } : {},
  });
  return data.data;
}

export async function getAdminOrder(orderId: string): Promise<AdminOrder> {
  const { data } = await apiClient.get(`/admin/orders/${orderId}`);
  return data.data.order;
}

export async function approveOrder(orderId: string): Promise<AdminOrder> {
  const { data } = await apiClient.post(`/admin/orders/${orderId}/approve`);
  return data.data.order;
}

export async function rejectOrder(orderId: string, rejectReason: string): Promise<AdminOrder> {
  const { data } = await apiClient.post(`/admin/orders/${orderId}/reject`, { rejectReason });
  return data.data.order;
}

// ── Products ──────────────────────────────────────────────────────────────

export interface AdminProduct {
  id: string;
  name: string;
  metal: 'GOLD' | 'SILVER';
  subtitle: string | null;
  premiumPerGram: number;
  unitSizeGrams: number | null;
  minQuantityGrams: number;
  buyPricePerGram: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductInput {
  name: string;
  metal: 'GOLD' | 'SILVER';
  premiumPerGram: number;
  minQuantityGrams: number;
  unitSizeGrams?: number | null;
  subtitle?: string;
  isActive?: boolean;
}

export async function getProducts(): Promise<AdminProduct[]> {
  const { data } = await apiClient.get('/admin/products');
  return data.data.products ?? data.data ?? [];
}

export async function createProduct(input: ProductInput): Promise<AdminProduct> {
  const { data } = await apiClient.post('/admin/products', input);
  return data.data.product ?? data.data;
}

export async function updateProduct(id: string, input: Partial<ProductInput>): Promise<AdminProduct> {
  const { data } = await apiClient.patch(`/admin/products/${id}`, input);
  return data.data.product ?? data.data;
}

export async function deleteProduct(id: string): Promise<void> {
  await apiClient.delete(`/admin/products/${id}`);
}

// ── Users ─────────────────────────────────────────────────────────────────

export interface AdminUserListItem {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  loginId: string;
  isActive: boolean;
  isAdmin: boolean;
  kycStatus: string | null;
  createdAt: string;
}

export interface AdminUserDetail extends AdminUserListItem {
  orders: AdminOrder[];
}

export interface ListUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  kycStatus?: string;
}

export async function getAdminUsers(
  params?: ListUsersParams,
): Promise<{ total: number; page: number; limit: number; items: AdminUserListItem[] }> {
  const { data } = await apiClient.get('/admin/users', { params });
  return data.data;
}

export async function getAdminUserDetail(userId: string): Promise<AdminUserDetail> {
  const { data } = await apiClient.get(`/admin/users/${userId}`);
  return data.data.user;
}

export async function deactivateUser(userId: string): Promise<void> {
  await apiClient.post(`/admin/users/${userId}/deactivate`);
}

export async function activateUser(userId: string): Promise<void> {
  await apiClient.post(`/admin/users/${userId}/activate`);
}

// ── Price Config ──────────────────────────────────────────────────────────

export interface PriceConfig {
  goldMinBuyGrams: number;
  silverMinBuyGrams: number;
  goldSpotPerGram: number;
  silverSpotPerGram: number;
}

export async function getPriceConfig(): Promise<PriceConfig> {
  const { data } = await apiClient.get('/admin/prices/config');
  return data.data.config;
}

export async function updatePriceConfig(input: Partial<PriceConfig>): Promise<PriceConfig> {
  const { data } = await apiClient.patch('/admin/prices/config', input);
  return data.data.config;
}

// ── Audit Logs ────────────────────────────────────────────────────────────

export interface AuditLogEntry {
  id: string;
  action: string;
  adminEmail: string;
  entityType: string | null;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface AuditLogParams {
  page?: number;
  limit?: number;
  action?: string;
  adminEmail?: string;
  entityType?: string;
  startDate?: string;
  endDate?: string;
}

export async function getAuditLogs(
  params?: AuditLogParams,
): Promise<{ total: number; page: number; limit: number; items: AuditLogEntry[] }> {
  const { data } = await apiClient.get('/admin/audit-logs', { params });
  return data.data;
}
