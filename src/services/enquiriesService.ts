import { apiRequest } from './api';
import { Inquiry, InquiryStats } from './types';

export interface InquiriesResponse {
  data: Inquiry[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export async function fetchInquiries(params: {
  status?: string;
  equipment_class?: string;
  search?: string;
  page?: number;
  limit?: number;
} = {}): Promise<InquiriesResponse> {
  const query = new URLSearchParams();
  if (params.status && params.status !== 'all') query.append('status', params.status);
  if (params.equipment_class && params.equipment_class !== 'all') query.append('equipment_class', params.equipment_class);
  if (params.search && params.search.trim()) query.append('search', params.search.trim());
  if (params.page) query.append('page', String(params.page));
  if (params.limit) query.append('limit', String(params.limit));

  const qs = query.toString();
  return apiRequest<InquiriesResponse>(`/api/admin/inquiries${qs ? `?${qs}` : ''}`);
}

export async function fetchInquiryStats(): Promise<{ data: InquiryStats }> {
  return apiRequest<{ data: InquiryStats }>('/api/admin/inquiries/stats');
}

export async function fetchInquiryById(id: string): Promise<{ data: Inquiry }> {
  return apiRequest<{ data: Inquiry }>(`/api/admin/inquiries/${id}`);
}

export async function updateInquiryStatus(id: string, status: string): Promise<{ data: Inquiry }> {
  return apiRequest<{ data: Inquiry }>(`/api/admin/inquiries/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

export async function assignInquiry(
  id: string,
  userId: string | null,
  assignedName?: string | null
): Promise<{ message: string; data: Inquiry }> {
  return apiRequest<{ message: string; data: Inquiry }>(`/api/admin/inquiries/${id}/assign`, {
    method: 'PUT',
    body: JSON.stringify({ user_id: userId, assigned_name: assignedName }),
  });
}

export async function deleteInquiry(id: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/api/admin/inquiries/${id}`, {
    method: 'DELETE',
  });
}
