import { apiRequest } from './api';
import { LeasingRequest, LeasingRequestStats } from './types';

export interface LeasingRequestsResponse {
  data: LeasingRequest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function fetchLeasingRequests(params: {
  status?: string;
  compressor_type?: string;
  brand?: string;
  search?: string;
  page?: number;
  limit?: number;
} = {}): Promise<LeasingRequestsResponse> {
  const query = new URLSearchParams();
  if (params.status && params.status !== 'all') query.append('status', params.status);
  if (params.compressor_type && params.compressor_type !== 'all') query.append('compressor_type', params.compressor_type);
  if (params.brand && params.brand !== 'all') query.append('brand', params.brand);
  if (params.search && params.search.trim()) query.append('search', params.search.trim());
  if (params.page) query.append('page', String(params.page));
  if (params.limit) query.append('limit', String(params.limit));

  const qs = query.toString();
  return apiRequest<LeasingRequestsResponse>(`/api/admin/leasing-requests${qs ? `?${qs}` : ''}`);
}

export async function fetchLeasingRequestStats(): Promise<{ data: LeasingRequestStats }> {
  return apiRequest<{ data: LeasingRequestStats }>('/api/admin/leasing-requests/stats');
}

export async function fetchLeasingRequestById(id: string): Promise<{ data: LeasingRequest }> {
  return apiRequest<{ data: LeasingRequest }>(`/api/admin/leasing-requests/${id}`);
}

export async function updateLeasingRequestStatus(id: string, status: string, notes?: string): Promise<{ data: LeasingRequest }> {
  return apiRequest<{ data: LeasingRequest }>(`/api/admin/leasing-requests/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, notes }),
  });
}

export async function deleteLeasingRequest(id: string): Promise<{ message: string; id: string }> {
  return apiRequest<{ message: string; id: string }>(`/api/admin/leasing-requests/${id}`, {
    method: 'DELETE',
  });
}

