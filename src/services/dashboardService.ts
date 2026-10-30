import { apiRequest } from './api';
import { fetchCompressorRequestStats, fetchCompressorRequests } from './compressorRequestsService';
import { fetchSparePartsRequestStats, fetchSparePartsRequests } from './sparePartsRequestsService';
import { fetchLeasingRequestStats, fetchLeasingRequests } from './leasingRequestsService';
import { fetchLubricantRequestStats, fetchLubricantRequests } from './lubricantsRequestsService';
import { ordersService } from './ordersService';
import { fetchInquiries } from './leadsService';
import type { TabType } from '../components/Layout';

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
  compressor_requests?: {
    total: number;
    new: number;
  };
  spare_parts_requests?: {
    total: number;
    new: number;
  };
  leasing_requests?: {
    total: number;
    new: number;
  };
  lubricant_requests?: {
    total: number;
    new: number;
  };
  orders?: {
    total: number;
    new: number;
  };
  total_rfqs?: number;
  new_rfqs?: number;
}

export interface UnifiedLiveActivity {
  id: string;
  category: 'compressor' | 'spare_parts' | 'leasing' | 'lubricants' | 'order' | 'inquiry';
  categoryLabel: string;
  badgeClass: string;
  company: string;
  name?: string;
  email: string;
  phone?: string;
  summary: string;
  details?: string;
  status: string;
  created_at: string;
  tab: TabType;
}

export async function fetchDashboardStats(): Promise<{ data: DashboardStats }> {
  return apiRequest<{ data: DashboardStats }>('/api/admin/stats');
}

export async function fetchComprehensiveStats(): Promise<DashboardStats> {
  // Try calling /api/admin/stats first
  const baseRes = await fetchDashboardStats().catch(() => ({ data: null }));
  const base = baseRes.data || {
    active_products: 0,
    active_parts: 0,
    inquiries: { total: 0, new: 0, in_review: 0, responded: 0 },
    service_tickets: { total: 0, received: 0, in_dispatch: 0, completed: 0 },
  };

  // Fetch individual domain stats in parallel
  const [compRes, spareRes, leaseRes, lubRes, orderRes] = await Promise.allSettled([
    fetchCompressorRequestStats(),
    fetchSparePartsRequestStats(),
    fetchLeasingRequestStats(),
    fetchLubricantRequestStats(),
    ordersService.getStats(),
  ]);

  const compStats = compRes.status === 'fulfilled' ? compRes.value.data : { total: 0, new: 0 };
  const spareStats = spareRes.status === 'fulfilled' ? spareRes.value.data : { total: 0, new: 0 };
  const leaseStats = leaseRes.status === 'fulfilled' ? leaseRes.value.data : { total: 0, new: 0 };
  const lubStats = lubRes.status === 'fulfilled' ? lubRes.value.data : { total: 0, new: 0 };
  const orderStats = orderRes.status === 'fulfilled' ? orderRes.value : { total: 0, placed: 0 };

  const totalRfqs =
    (compStats.total || 0) +
    (spareStats.total || 0) +
    (leaseStats.total || 0) +
    (lubStats.total || 0) +
    (base.inquiries?.total || 0);

  const newRfqs =
    (compStats.new || 0) +
    (spareStats.new || 0) +
    (leaseStats.new || 0) +
    (lubStats.new || 0) +
    (base.inquiries?.new || 0);

  return {
    ...base,
    compressor_requests: { total: compStats.total || 0, new: compStats.new || 0 },
    spare_parts_requests: { total: spareStats.total || 0, new: spareStats.new || 0 },
    leasing_requests: { total: leaseStats.total || 0, new: leaseStats.new || 0 },
    lubricant_requests: { total: lubStats.total || 0, new: lubStats.new || 0 },
    orders: { total: orderStats.total || 0, new: (orderStats as any).placed || 0 },
    total_rfqs: totalRfqs,
    new_rfqs: newRfqs,
  };
}

export async function fetchUnifiedLiveFeed(limit = 12): Promise<UnifiedLiveActivity[]> {
  const [compRes, spareRes, leaseRes, lubRes, ordersRes, inqRes] = await Promise.allSettled([
    fetchCompressorRequests({ limit: 6 }),
    fetchSparePartsRequests({ limit: 6 }),
    fetchLeasingRequests({ limit: 6 }),
    fetchLubricantRequests({ limit: 6 }),
    ordersService.getAll({ limit: 6 }),
    fetchInquiries({ limit: 6 }),
  ]);

  const items: UnifiedLiveActivity[] = [];

  if (compRes.status === 'fulfilled' && compRes.value?.data) {
    for (const r of compRes.value.data) {
      items.push({
        id: r.id,
        category: 'compressor',
        categoryLabel: 'Compressor RFQ',
        badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
        company: r.company_name || 'Client',
        email: r.email,
        phone: r.phone,
        summary: `${r.brand} • ${r.compressor_type}`,
        details: r.notes || `${r.condition || 'New'} equipment quotation requested`,
        status: r.status,
        created_at: r.created_at,
        tab: 'compressor-requests',
      });
    }
  }

  if (spareRes.status === 'fulfilled' && spareRes.value?.data) {
    for (const r of spareRes.value.data) {
      items.push({
        id: r.id,
        category: 'spare_parts',
        categoryLabel: 'Spare Parts',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
        company: r.company_name || 'Client',
        email: r.email,
        phone: r.phone,
        summary: `${r.part_name} (${r.brand})`,
        details: r.notes || 'OEM Spare parts availability inquiry',
        status: r.status,
        created_at: r.created_at,
        tab: 'spare-parts-requests',
      });
    }
  }

  if (leaseRes.status === 'fulfilled' && leaseRes.value?.data) {
    for (const r of leaseRes.value.data) {
      items.push({
        id: r.id,
        category: 'leasing',
        categoryLabel: 'Leasing & Rentals',
        badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
        company: r.company_name || 'Client',
        email: r.email,
        phone: r.phone,
        summary: `${r.brand} • ${r.compressor_type}`,
        details: `${r.duration || 'Spot Rental'} • Hub: ${r.hub || 'Regional Yard'}${r.notes ? ` — ${r.notes}` : ''}`,
        status: r.status,
        created_at: r.created_at,
        tab: 'leasing-requests',
      });
    }
  }

  if (lubRes.status === 'fulfilled' && lubRes.value?.data) {
    for (const r of lubRes.value.data) {
      items.push({
        id: r.id,
        category: 'lubricants',
        categoryLabel: 'Fluids & Lubricants',
        badgeClass: 'bg-cyan-100 text-cyan-800 border-cyan-200',
        company: r.company_name || 'Client',
        email: r.email,
        phone: r.phone,
        summary: `${r.brand} ${r.fluid_type} (${r.volume})`,
        details: `Hub: ${r.hub}${r.notes ? ` — ${r.notes}` : ''}`,
        status: r.status,
        created_at: r.created_at,
        tab: 'lubricant-requests',
      });
    }
  }

  if (ordersRes.status === 'fulfilled' && ordersRes.value?.orders) {
    for (const o of ordersRes.value.orders) {
      const itemsCount = o.items ? o.items.length : 1;
      items.push({
        id: o.id,
        category: 'order',
        categoryLabel: 'Yard Cart Order',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        company: o.company || o.customer_name || 'Customer',
        name: o.customer_name,
        email: o.email,
        phone: o.phone,
        summary: `${o.id} • ${itemsCount} Requisition Item${itemsCount > 1 ? 's' : ''}`,
        details: `Hub: ${o.fulfillment_hub || 'Port-Harcourt Yard'} • Address: ${o.delivery_address || 'Standard Delivery'}`,
        status: o.status,
        created_at: o.created_at,
        tab: 'orders',
      });
    }
  }

  if (inqRes.status === 'fulfilled' && inqRes.value?.data) {
    for (const i of inqRes.value.data) {
      items.push({
        id: String(i.id || Math.random()),
        category: 'inquiry',
        categoryLabel: 'Web Contact RFQ',
        badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
        company: i.company || 'Enterprise Lead',
        name: i.name,
        email: i.email,
        phone: i.phone,
        summary: i.equipment_interests?.length ? i.equipment_interests.join(', ') : 'General Industrial Equipment RFQ',
        details: i.message,
        status: i.status || 'new',
        created_at: i.created_at || new Date().toISOString(),
        tab: 'enquiries',
      });
    }
  }

  // Sort descending by created_at
  items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return items.slice(0, limit);
}
