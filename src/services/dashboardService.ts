import { apiRequest } from './api';

export interface DashboardStats {
  active_products: number;
  active_parts: number;
  inquiries: {
    total: number;
    new: number;
    in_review: number;
    responded: number;
  };
  service_tickets: {
    total: number;
    received: number;
    in_dispatch: number;
    completed: number;
  };
}

export async function fetchDashboardStats(): Promise<{ data: DashboardStats }> {
  return apiRequest<{ data: DashboardStats }>('/api/admin/stats');
}
