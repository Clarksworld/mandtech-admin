import { apiRequest } from './api';
import { Product, Part } from './types';

export interface ProductsResponse {
  data: Product[];
  total: number;
}

export interface PartsResponse {
  data: Part[];
  total: number;
}

export async function fetchProducts(params: {
  category?: string;
  brand?: string;
  driven_type?: string;
  search?: string;
  page?: number;
  limit?: number;
} = {}): Promise<ProductsResponse> {
  const query = new URLSearchParams();
  if (params.category) query.append('category', params.category);
  if (params.brand) query.append('brand', params.brand);
  if (params.driven_type) query.append('driven_type', params.driven_type);
  if (params.search) query.append('search', params.search);
  if (params.page) query.append('page', String(params.page));
  if (params.limit) query.append('limit', String(params.limit));

  const queryString = query.toString();
  const endpoint = `/api/products${queryString ? `?${queryString}` : ''}`;
  return apiRequest<ProductsResponse>(endpoint);
}

export async function fetchParts(params: {
  category?: string;
  brand?: string;
  condition?: string;
  search?: string;
  page?: number;
  limit?: number;
} = {}): Promise<PartsResponse> {
  const query = new URLSearchParams();
  if (params.category) query.append('category', params.category);
  if (params.brand) query.append('brand', params.brand);
  if (params.condition) query.append('condition', params.condition);
  if (params.search) query.append('search', params.search);
  if (params.page) query.append('page', String(params.page));
  if (params.limit) query.append('limit', String(params.limit));

  const queryString = query.toString();
  const endpoint = `/api/parts${queryString ? `?${queryString}` : ''}`;
  return apiRequest<PartsResponse>(endpoint);
}

export async function createProduct(product: Partial<Product>): Promise<Product> {
  return apiRequest<Product>('/api/admin/products', {
    method: 'POST',
    body: JSON.stringify(product),
  });
}

export async function createPart(part: Partial<Part>): Promise<Part> {
  return apiRequest<Part>('/api/admin/parts', {
    method: 'POST',
    body: JSON.stringify(part),
  });
}
