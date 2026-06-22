import { useQuery } from '@tanstack/react-query';
import { fetchVendorDashboard, fetchVendorPois, fetchVendorRevenue } from './vendorApi';

export const vendorQueryKeys = {
  dashboard: ['vendor', 'dashboard'],
  pois: ['vendor', 'pois'],
  revenue: ['vendor', 'revenue']
};

export function useVendorDashboard() {
  return useQuery({
    queryKey: vendorQueryKeys.dashboard,
    queryFn: fetchVendorDashboard
  });
}

export function useVendorPois() {
  return useQuery({
    queryKey: vendorQueryKeys.pois,
    queryFn: fetchVendorPois
  });
}

export function useVendorRevenue() {
  return useQuery({
    queryKey: vendorQueryKeys.revenue,
    queryFn: fetchVendorRevenue
  });
}