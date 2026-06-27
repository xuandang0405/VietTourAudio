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
  updateVendor,
  fetchVendorWallet,
  fetchVendorWallets,
  fetchVendors,
  forceCancelVendor,
  hideContent,
  rejectContent,
  rejectTopUpRequest,
  rejectVendor,
  suspendVendor,
  fetchAdminPois,
  fetchStallsList,
  fetchZonesList,
  fetchPoiDistance,
  createAdminPoi,
  updateAdminPoi,
  deleteAdminPoi,
  fetchAdminApprovals,
  approveAdminPoi,
  rejectAdminPoi,
  fetchGeofenceAllData,
  fetchAuditLogs,
  fetchToursList,
  createVendorAccount,
  createZoneAdminAccount,
  fetchHourlyActiveUsers,
  resetStallQr,
  fetchDashboardAnalytics,
  fetchTours,
  fetchTourById,
  createTour,
  updateTour,
  deleteTour,
  resetTourQr,
  updateVendorStatus,
  unsuspendVendor,
  fetchTickets,
  resolveTicket,
  toggleStallPremium
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
  geofences: ['admin', 'geofences'],
  pois: ['admin_pois'],
  stallsList: ['admin', 'stalls-list'],
  zonesList: ['admin', 'zones-list'],
  hourlyActiveUsers: ['admin', 'analytics', 'hourly-active-users'],
  dashboardAnalytics: ['admin', 'analytics', 'dashboard'],
  tours: ['admin', 'tours'],
  tour: (id) => ['admin', 'tours', id],
  tickets: ['admin', 'tickets']
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

export function useAdminPois() {
  return useQuery({
    queryKey: adminQueryKeys.pois,
    queryFn: fetchAdminPois
  });
}

export function useAdminApprovals() {
  return useQuery({
    queryKey: ['admin', 'approvals'],
    queryFn: fetchAdminApprovals
  });
}

export function useApprovePoi() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: approveAdminPoi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'approvals'] });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.pois });
    }
  });
}

export function useRejectPoi() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: rejectAdminPoi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'approvals'] });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.pois });
    }
  });
}

export function useStallsList() {
  return useQuery({
    queryKey: adminQueryKeys.stallsList,
    queryFn: fetchStallsList
  });
}

export function useZonesList() {
  return useQuery({
    queryKey: adminQueryKeys.zonesList,
    queryFn: fetchZonesList
  });
}

export function usePoiDistance(poi1Id, poi2Id) {
  return useQuery({
    queryKey: ['admin', 'pois', 'distance', poi1Id, poi2Id],
    queryFn: () => fetchPoiDistance(poi1Id, poi2Id),
    enabled: Boolean(poi1Id && poi2Id && poi1Id !== poi2Id)
  });
}

export function useCreatePoi() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAdminPoi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.pois });
    }
  });
}

export function useUpdatePoi() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateAdminPoi(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.pois });
    }
  });
}

export function useDeletePoi() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAdminPoi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_pois'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'tours'] });
    }
  });
}

export function useGeofenceAllData() {
  return useQuery({
    queryKey: ['admin', 'geofences', 'all-data'],
    queryFn: fetchGeofenceAllData
  });
}

export function useAuditLogs() {
  return useQuery({
    queryKey: ['admin', 'audit-logs'],
    queryFn: fetchAuditLogs
  });
}

export function useToursList() {
  return useQuery({
    queryKey: ['admin', 'tours-list'],
    queryFn: fetchToursList
  });
}

export function useCreateVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createVendorAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'vendors'] });
    }
  });
}

export function useUpdateVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateVendor(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'vendors'] });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.vendor(variables.id) });
    }
  });
}

export function useUpdateVendorStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, reason }) => updateVendorStatus(id, status, reason),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'vendors'] });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.vendor(variables.id) });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.wallets });
    }
  });
}

export function useCreateZoneAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createZoneAdminAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    }
  });
}

export function useResetStallQr() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => resetStallQr(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'vendors'] });
    }
  });
}

export function useHourlyActiveUsers() {
  return useQuery({
    queryKey: adminQueryKeys.hourlyActiveUsers,
    queryFn: fetchHourlyActiveUsers,
    refetchInterval: 30000
  });
}

export function useDashboardAnalytics() {
  return useQuery({
    queryKey: adminQueryKeys.dashboardAnalytics,
    queryFn: fetchDashboardAnalytics,
    refetchInterval: 30000
  });
}

export function useTours() {
  return useQuery({
    queryKey: adminQueryKeys.tours,
    queryFn: fetchTours
  });
}

export function useTour(id) {
  return useQuery({
    queryKey: adminQueryKeys.tour(id),
    queryFn: () => fetchTourById(id),
    enabled: Boolean(id)
  });
}

export function useCreateTour() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTour,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.tours });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.dashboardAnalytics });
    }
  });
}

export function useUpdateTour() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateTour(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.tours });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.dashboardAnalytics });
    }
  });
}

export function useDeleteTour() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTour,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.tours });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.dashboardAnalytics });
    }
  });
}

export function useResetTourQr() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => resetTourQr(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.tours });
    }
  });
}

export function useUnsuspendVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => unsuspendVendor(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'vendors'] });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.vendor(id) });
    }
  });
}

export function useTickets() {
  return useQuery({
    queryKey: adminQueryKeys.tickets,
    queryFn: fetchTickets
  });
}

export function useResolveTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => resolveTicket(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.tickets });
    }
  });
}

export function useToggleStallPremium() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ stallId, isPremium }) => toggleStallPremium(stallId, isPremium),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'vendors'] });
      if (variables.vendorId) {
        queryClient.invalidateQueries({ queryKey: adminQueryKeys.vendor(variables.vendorId) });
      }
    }
  });
}
