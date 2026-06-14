import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  approveContent,
  approveTopUpRequest,
  approveVendor,
  bulkApproveContent,
  checkGeofenceOverlap,
  creditVendorWallet,
  debitVendorWallet,
  fetchContentQueue,
  fetchGeofences,
  fetchRevenueOverview,
  fetchRevenueTimeline,
  fetchTopUpRequests,
  fetchVendor,
  fetchVendorWallet,
  fetchVendorWallets,
  fetchVendors,
  forceCancelVendor,
  hideContent,
  rejectContent,
  rejectTopUpRequest,
  rejectVendor,
  suspendVendor
} from './adminApi';

export const adminQueryKeys = {
  vendors: (params = {}) => ['admin', 'vendors', params],
  vendor: (id) => ['admin', 'vendors', id],
  wallets: ['admin', 'wallets'],
  wallet: (vendorId) => ['admin', 'wallets', vendorId],
  topUps: (params = {}) => ['admin', 'topups', params],
  revenueOverview: (params = {}) => ['admin', 'revenue', 'overview', params],
  revenueTimeline: (params = {}) => ['admin', 'revenue', 'timeline', params],
  contentQueue: (params = {}) => ['admin', 'content', params],
  geofences: ['admin', 'geofences']
};

export function useVendors(params) {
  return useQuery({
    queryKey: adminQueryKeys.vendors(params),
    queryFn: () => fetchVendors(params)
  });
}

export function useVendor(id) {
  return useQuery({
    queryKey: adminQueryKeys.vendor(id),
    queryFn: () => fetchVendor(id),
    enabled: Boolean(id)
  });
}

export function useVendorAction(action) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }) => {
      if (action === 'approve') return approveVendor(id);
      if (action === 'reject') return rejectVendor(id, reason);
      if (action === 'suspend') return suspendVendor(id, reason);
      return forceCancelVendor(id, reason);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'vendors'] });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.vendor(variables.id) });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.wallets });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.geofences });
    }
  });
}

export function useVendorWallets() {
  return useQuery({
    queryKey: adminQueryKeys.wallets,
    queryFn: fetchVendorWallets
  });
}

export function useVendorWallet(vendorId) {
  return useQuery({
    queryKey: adminQueryKeys.wallet(vendorId),
    queryFn: () => fetchVendorWallet(vendorId),
    enabled: Boolean(vendorId)
  });
}

export function useWalletMutation(type) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ vendorId, payload }) => {
      if (type === 'credit') return creditVendorWallet(vendorId, payload);
      return debitVendorWallet(vendorId, payload);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.wallets });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.wallet(variables.vendorId) });
      queryClient.invalidateQueries({ queryKey: ['admin', 'revenue'] });
    }
  });
}

export function useTopUpRequests(params) {
  return useQuery({
    queryKey: adminQueryKeys.topUps(params),
    queryFn: () => fetchTopUpRequests(params)
  });
}

export function useApproveTopUp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: approveTopUpRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'topups'] });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.wallets });
      queryClient.invalidateQueries({ queryKey: ['admin', 'revenue'] });
    }
  });
}

export function useRejectTopUp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }) => rejectTopUpRequest(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'topups'] });
    }
  });
}

export function useRevenueOverview(params) {
  return useQuery({
    queryKey: adminQueryKeys.revenueOverview(params),
    queryFn: () => fetchRevenueOverview(params)
  });
}

export function useRevenueTimeline(params) {
  return useQuery({
    queryKey: adminQueryKeys.revenueTimeline(params),
    queryFn: () => fetchRevenueTimeline(params)
  });
}

export function useContentQueue(params) {
  return useQuery({
    queryKey: adminQueryKeys.contentQueue(params),
    queryFn: () => fetchContentQueue(params)
  });
}

export function useContentMutation(action) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason, ids }) => {
      if (action === 'approve') return approveContent(id);
      if (action === 'reject') return rejectContent(id, reason);
      if (action === 'hide') return hideContent(id, reason);
      return bulkApproveContent(ids);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'content'] });
    }
  });
}

export function useGeofences() {
  return useQuery({
    queryKey: adminQueryKeys.geofences,
    queryFn: fetchGeofences
  });
}

export function useCheckGeofenceOverlap() {
  return useMutation({
    mutationFn: checkGeofenceOverlap
  });
}
