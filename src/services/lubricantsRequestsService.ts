import { apiRequest } from './api';
import { LubricantRequest, LubricantRequestStats } from './types';

export interface LubricantsRequestsResponse {
  data: LubricantRequest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function fetchLubricantRequests(params: {
  status?: string;
  brand?: string;
  search?: string;
  page?: number;
  limit?: number;
} = {}): Promise<LubricantsRequestsResponse> {
  const query = new URLSearchParams();
  if (params.status && params.status !== 'all') query.append('status', params.status);
  if (params.brand && params.brand !== 'all') query.append('brand', params.brand);
  if (params.search && params.search.trim()) query.append('search', params.search.trim());
  if (params.page) query.append('page', String(params.page));
  if (params.limit) query.append('limit', String(params.limit));

  const qs = query.toString();
  return apiRequest<LubricantsRequestsResponse>(`/api/admin/lubricant-requests${qs ? `?${qs}` : ''}`);
}

export async function fetchLubricantRequestStats(): Promise<{ data: LubricantRequestStats }> {
  return apiRequest<{ data: LubricantRequestStats }>('/api/admin/lubricant-requests/stats');
}

export async function fetchLubricantRequestById(id: string): Promise<{ data: LubricantRequest }> {
  return apiRequest<{ data: LubricantRequest }>(`/api/admin/lubricant-requests/${id}`);
}

export async function updateLubricantRequestStatus(id: string, status: string, notes?: string): Promise<{ data: LubricantRequest }> {
  return apiRequest<{ data: LubricantRequest }>(`/api/admin/lubricant-requests/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, notes }),
  });
}

export async function deleteLubricantRequest(id: string): Promise<{ message: string; id: string }> {
  return apiRequest<{ message: string; id: string }>(`/api/admin/lubricant-requests/${id}`, {
    method: 'DELETE',
  });
}

