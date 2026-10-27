import { apiRequest } from './api';
import { CompressorRequest, CompressorRequestStats } from './types';

export interface CompressorRequestsResponse {
  data: CompressorRequest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function fetchCompressorRequests(params: {
  status?: string;
  compressor_type?: string;
  brand?: string;
  search?: string;
  page?: number;
  limit?: number;
} = {}): Promise<CompressorRequestsResponse> {
  const query = new URLSearchParams();
  if (params.status && params.status !== 'all') query.append('status', params.status);
  if (params.compressor_type && params.compressor_type !== 'all') query.append('compressor_type', params.compressor_type);
  if (params.brand && params.brand !== 'all') query.append('brand', params.brand);
  if (params.search && params.search.trim()) query.append('search', params.search.trim());
  if (params.page) query.append('page', String(params.page));
  if (params.limit) query.append('limit', String(params.limit));

  const qs = query.toString();
  return apiRequest<CompressorRequestsResponse>(`/api/admin/compressor-requests${qs ? `?${qs}` : ''}`);
}

export async function fetchCompressorRequestStats(): Promise<{ data: CompressorRequestStats }> {
  return apiRequest<{ data: CompressorRequestStats }>('/api/admin/compressor-requests/stats');
}

export async function fetchCompressorRequestById(id: string): Promise<{ data: CompressorRequest }> {
  return apiRequest<{ data: CompressorRequest }>(`/api/admin/compressor-requests/${id}`);
}

export async function updateCompressorRequestStatus(id: string, status: string, notes?: string): Promise<{ data: CompressorRequest }> {
  return apiRequest<{ data: CompressorRequest }>(`/api/admin/compressor-requests/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, notes }),
  });
}

export async function deleteCompressorRequest(id: string): Promise<{ message: string; id: string }> {
  return apiRequest<{ message: string; id: string }>(`/api/admin/compressor-requests/${id}`, {
    method: 'DELETE',
  });
}
