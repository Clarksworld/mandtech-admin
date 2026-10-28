import { apiRequest } from "./api";
import { SparePartsRequest, SparePartsRequestStats } from "./types";

export interface SparePartsRequestsResponse {
  data: SparePartsRequest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function fetchSparePartsRequests(params: {
  status?: string;
  brand?: string;
  search?: string;
  page?: number;
  limit?: number;
} = {}): Promise<SparePartsRequestsResponse> {
  const query = new URLSearchParams();
  if (params.status && params.status !== "all") query.append("status", params.status);
  if (params.brand && params.brand !== "all") query.append("brand", params.brand);
  if (params.search && params.search.trim()) query.append("search", params.search.trim());
  if (params.page) query.append("page", String(params.page));
  if (params.limit) query.append("limit", String(params.limit));

  const qs = query.toString();
  return apiRequest<SparePartsRequestsResponse>(`/api/admin/spare-parts-requests${qs ? `?${qs}` : ""}`);
}

export async function fetchSparePartsRequestStats(): Promise<{ data: SparePartsRequestStats }> {
  return apiRequest<{ data: SparePartsRequestStats }>("/api/admin/spare-parts-requests/stats");
}

export async function fetchSparePartsRequestById(id: string): Promise<{ data: SparePartsRequest }> {
  return apiRequest<{ data: SparePartsRequest }>(`/api/admin/spare-parts-requests/${id}`);
}

export async function updateSparePartsRequestStatus(id: string, status: string, notes?: string): Promise<{ data: SparePartsRequest }> {
  return apiRequest<{ data: SparePartsRequest }>(`/api/admin/spare-parts-requests/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, notes }),
  });
}

export async function deleteSparePartsRequest(id: string): Promise<{ message: string; id: string }> {
  return apiRequest<{ message: string; id: string }>(`/api/admin/spare-parts-requests/${id}`, {
    method: "DELETE",
  });
}
