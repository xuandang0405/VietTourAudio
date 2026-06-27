import { useQuery } from '@tanstack/react-query';
import { fetchVendorDashboard, fetchVendorPois, fetchVendorRevenue, fetchVendorStall, fetchVendorContent, fetchVendorStallQr } from './vendorApi';

export const vendorQueryKeys = {
  dashboard: ['vendor', 'dashboard'],
  pois: ['vendor', 'pois'],
  revenue: ['vendor', 'revenue'],
  stall: ['vendor', 'stall'],
  content: ['vendor', 'content'],
  stallQr: ['vendor', 'stall-qr']
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

export function useVendorStall() {
  return useQuery({
    queryKey: vendorQueryKeys.stall,
    queryFn: fetchVendorStall
  });
}

export function useVendorContent() {
  return useQuery({
    queryKey: vendorQueryKeys.content,
    queryFn: fetchVendorContent,
    select: (data) => data?.contents?.[0] ?? null
  });
}

export function useVendorStallQr() {
  return useQuery({
    queryKey: vendorQueryKeys.stallQr,
    queryFn: fetchVendorStallQr
  });
}
