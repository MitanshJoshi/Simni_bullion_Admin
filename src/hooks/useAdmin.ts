import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as adminService from '../services/adminService';
import type { OrderStatus, ListUsersParams, AuditLogParams, ProductInput, AdminProduct } from '../services/adminService';

export const KYC_PENDING_KEY = ['admin', 'kyc', 'pending'] as const;
export const ORDERS_KEY = (status?: OrderStatus) => ['admin', 'orders', status] as const;
export const PRODUCTS_KEY = ['admin', 'products'] as const;
export const USERS_KEY = (params?: ListUsersParams) => ['admin', 'users', params] as const;
export const PRICE_CONFIG_KEY = ['admin', 'prices', 'config'] as const;
export const AUDIT_LOG_KEY = (params?: AuditLogParams) => ['admin', 'audit-logs', params] as const;

// ── KYC ───────────────────────────────────────────────────────────────────

export function usePendingKyc() {
  return useQuery({
    queryKey: KYC_PENDING_KEY,
    queryFn: adminService.getPendingKyc,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useApproveKyc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => adminService.approveKyc(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KYC_PENDING_KEY });
    },
  });
}

export function useRejectKyc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, rejectReason }: { userId: string; rejectReason: string }) =>
      adminService.rejectKyc(userId, rejectReason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KYC_PENDING_KEY });
    },
  });
}

// ── Orders ────────────────────────────────────────────────────────────────

export function useAdminOrders(status?: OrderStatus) {
  return useQuery({
    queryKey: ORDERS_KEY(status),
    queryFn: () => adminService.getAdminOrders(status),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useAdminOrder(orderId: string) {
  return useQuery({
    queryKey: ['admin', 'orders', orderId],
    queryFn: () => adminService.getAdminOrder(orderId),
    staleTime: 15_000,
  });
}

export function useApproveOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => adminService.approveOrder(orderId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'orders'] });
    },
  });
}

export function useRejectOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, rejectReason }: { orderId: string; rejectReason: string }) =>
      adminService.rejectOrder(orderId, rejectReason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'orders'] });
    },
  });
}

// ── Products ──────────────────────────────────────────────────────────────

export function useProducts() {
  return useQuery({
    queryKey: PRODUCTS_KEY,
    queryFn: adminService.getProducts,
    staleTime: 60_000,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ProductInput) => adminService.createProduct(input),
    onSuccess: (product) => {
      // Patch the cache synchronously with the mutation's own (already-fresh)
      // response so the list is correct immediately — invalidateQueries alone
      // triggers only an async background refetch, which isn't guaranteed to
      // finish before the caller navigates back and re-reads the list.
      qc.setQueryData<AdminProduct[]>(PRODUCTS_KEY, (old) =>
        old ? [...old, product] : old
      );
      qc.invalidateQueries({ queryKey: PRODUCTS_KEY });
    },
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<ProductInput> }) =>
      adminService.updateProduct(id, input),
    onSuccess: (product) => {
      qc.setQueryData<AdminProduct[]>(PRODUCTS_KEY, (old) =>
        old ? old.map((p) => (p.id === product.id ? product : p)) : old
      );
      qc.invalidateQueries({ queryKey: PRODUCTS_KEY });
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminService.deleteProduct(id),
    onSuccess: (_data, id) => {
      qc.setQueryData<AdminProduct[]>(PRODUCTS_KEY, (old) =>
        old ? old.filter((p) => p.id !== id) : old
      );
      qc.invalidateQueries({ queryKey: PRODUCTS_KEY });
    },
  });
}

// ── Users ─────────────────────────────────────────────────────────────────

export function useAdminUsers(params?: ListUsersParams) {
  return useQuery({
    queryKey: USERS_KEY(params),
    queryFn: () => adminService.getAdminUsers(params),
    staleTime: 30_000,
  });
}

export function useAdminUserDetail(userId: string) {
  return useQuery({
    queryKey: ['admin', 'users', userId],
    queryFn: () => adminService.getAdminUserDetail(userId),
    staleTime: 30_000,
  });
}

export function useDeactivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => adminService.deactivateUser(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

export function useActivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => adminService.activateUser(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

// ── Price Config ──────────────────────────────────────────────────────────

export function usePriceConfig() {
  return useQuery({
    queryKey: PRICE_CONFIG_KEY,
    queryFn: adminService.getPriceConfig,
    staleTime: 60_000,
  });
}

export function useUpdatePriceConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<adminService.PriceConfig>) => adminService.updatePriceConfig(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PRICE_CONFIG_KEY });
    },
  });
}

// ── Audit Logs ────────────────────────────────────────────────────────────

export function useAuditLogs(params?: AuditLogParams) {
  return useQuery({
    queryKey: AUDIT_LOG_KEY(params),
    queryFn: () => adminService.getAuditLogs(params),
    staleTime: 30_000,
  });
}
