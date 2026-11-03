import { apiRequest } from './api';

export interface LineItem {
  id?: string;
  sn?: number;
  part_number?: string;
  product_name?: string;
  description?: string;
  qty: number;
  unit_price: number;
  total?: number;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  doc_type?: 'quotation' | 'invoice';
  company: string;
  contact_name: string;
  contact_phone?: string;
  email: string;
  billing_address?: string;
  sales_person?: string;
  client_ref?: string;
  bank_details?: string;
  amount_in_words?: string;
  terms?: string;
  line_items: LineItem[];
  discount_pct: number;
  vat_rate_pct: number;
  delivery_terms: string;
  subtotal: number;
  discount_amount: number;
  vat_amount: number;
  total: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'cancelled';
  notes?: string;
  created_at: string;
}

export interface InvoicesResponse {
  data: Invoice[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export async function fetchInvoices(params: {
  status?: string;
  page?: number;
  limit?: number;
} = {}): Promise<InvoicesResponse> {
  const query = new URLSearchParams();
  if (params.status) query.append('status', params.status);
  if (params.page) query.append('page', String(params.page));
  if (params.limit) query.append('limit', String(params.limit));

  const qs = query.toString();
  return apiRequest<InvoicesResponse>(`/api/admin/invoices${qs ? `?${qs}` : ''}`);
}

export async function createInvoice(payload: {
  doc_type?: 'quotation' | 'invoice';
  invoice_number?: string;
  company: string;
  contact_name: string;
  contact_phone?: string;
  email: string;
  billing_address?: string;
  sales_person?: string;
  client_ref?: string;
  bank_details?: string;
  amount_in_words?: string;
  terms?: string;
  line_items: LineItem[];
  discount_pct?: number;
  vat_rate_pct?: number;
  delivery_terms?: string;
  currency?: string;
  notes?: string;
  status?: string;
}): Promise<{ data: Invoice }> {
  return apiRequest<{ data: Invoice }>('/api/admin/invoices', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateInvoiceStatus(id: string, status: string): Promise<{ data: Invoice }> {
  return apiRequest<{ data: Invoice }>(`/api/admin/invoices/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}
