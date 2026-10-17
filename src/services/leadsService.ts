import { apiRequest } from './api';
import { Inquiry } from './types';

export interface InquiriesResponse {
  data: Inquiry[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export async function fetchInquiries(params: {
  status?: string;
  page?: number;
  limit?: number;
} = {}): Promise<InquiriesResponse> {
  const query = new URLSearchParams();
  if (params.status) query.append('status', params.status);
  if (params.page) query.append('page', String(params.page));
  if (params.limit) query.append('limit', String(params.limit));

  const qs = query.toString();
  return apiRequest<InquiriesResponse>(`/api/admin/inquiries${qs ? `?${qs}` : ''}`);
}

export async function updateInquiryStatus(id: string, status: string): Promise<{ data: Inquiry }> {
  return apiRequest<{ data: Inquiry }>(`/api/admin/inquiries/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

export async function assignInquiry(id: string, userId: string | null): Promise<{ message: string; data: Inquiry }> {
  return apiRequest<{ message: string; data: Inquiry }>(`/api/admin/inquiries/${id}/assign`, {
    method: 'PUT',
    body: JSON.stringify({ user_id: userId }),
  });
}
