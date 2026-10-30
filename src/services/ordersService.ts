import { apiRequest } from './api';
import type { OrderRecord, OrderStats, OrderStatus } from './types';

export const ordersService = {
  async getAll(params?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ orders: OrderRecord[]; total: number; page: number; limit: number }> {
    const query = new URLSearchParams();
    if (params?.status && params.status !== 'all') query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());

    const qs = query.toString();
    const endpoint = `/api/admin/orders${qs ? `?${qs}` : ''}`;
    const raw = await apiRequest<any>(endpoint);
    const orders: OrderRecord[] = raw.orders || raw.data || [];
    const total: number = raw.total ?? raw.pagination?.total ?? orders.length;
    const page: number = raw.page ?? raw.pagination?.page ?? 1;
    const limit: number = raw.limit ?? raw.pagination?.limit ?? 20;
    return { orders, total, page, limit };
  },

  async getStats(): Promise<OrderStats> {
    const raw = await apiRequest<any>('/api/admin/orders/stats');
    return raw.data || raw;
  },

  async updateStatus(
    id: string,
    payload: {
      status: OrderStatus;
      title?: string;
      description?: string;
      location?: string;
      notes?: string;
    }
  ): Promise<{ message: string; order: OrderRecord }> {
    return apiRequest<{ message: string; order: OrderRecord }>(`/api/admin/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async delete(id: string): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(`/api/admin/orders/${id}`, {
      method: 'DELETE',
    });
  },
};
