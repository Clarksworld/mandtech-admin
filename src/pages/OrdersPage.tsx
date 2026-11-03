import { useState, useEffect, useCallback } from 'react';
import { ordersService } from '../services/ordersService';
import type { OrderRecord, OrderStats, OrderStatus, InitialQuotationData } from '../services/types';
import type { TabType } from '../components/Layout';

interface OrdersPageProps {
  onNavigate?: (tab: TabType) => void;
  onPrepareQuotation?: (data: InitialQuotationData) => void;
}

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; badgeClass: string; icon: string }
> = {
  order_placed: {
    label: 'Order Placed',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: 'receipt',
  },
  confirmed: {
    label: 'Confirmed',
    badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    icon: 'verified',
  },
  processing: {
    label: 'Processing',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-200',
    icon: 'build',
  },
  in_transit: {
    label: 'In Transit',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: 'local_shipping',
  },
  delivered: {
    label: 'Delivered',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    icon: 'check_circle',
  },
  cancelled: {
    label: 'Cancelled',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
    icon: 'cancel',
  },
};

export default function OrdersPage({ onNavigate: _onNavigate, onPrepareQuotation }: OrdersPageProps) {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Status Update Modal
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [targetStatus, setTargetStatus] = useState<OrderStatus>('order_placed');
  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [milestoneDescription, setMilestoneDescription] = useState('');
  const [milestoneLocation, setMilestoneLocation] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      const data = await ordersService.getStats();
      setStats(data);
    } catch (err: any) {
      console.error('Failed to load order stats:', err);
    }
  }, []);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ordersService.getAll({
        status: statusFilter,
        search: searchQuery,
        page,
        limit: 15,
      });
      setOrders(res.orders || []);
      setTotalPages(Math.ceil((res.total || 0) / 15) || 1);
      setTotalRecords(res.total || 0);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch yard orders.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery, page]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const openStatusModal = (order: OrderRecord) => {
    setSelectedOrder(order);
    setTargetStatus(order.status);
    setInternalNotes(order.notes || '');
    setMilestoneTitle('');
    setMilestoneDescription('');
    setMilestoneLocation(order.fulfillment_hub || '');
    setUpdateError(null);
  };

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setUpdating(true);
    setUpdateError(null);

    try {
      await ordersService.updateStatus(selectedOrder.id, {
        status: targetStatus,
        title: milestoneTitle || undefined,
        description: milestoneDescription || undefined,
        location: milestoneLocation || undefined,
        notes: internalNotes || undefined,
      });

      setSelectedOrder(null);
      await Promise.all([loadOrders(), loadStats()]);
    } catch (err: any) {
      setUpdateError(err.message || 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const handleStartQuote = (order: OrderRecord) => {
    if (onPrepareQuotation) {
      onPrepareQuotation({
        companyName: order.company || order.customer_name,
        contactPerson: order.customer_name,
        contactNumber: order.phone,
        companyEmail: order.email,
        companyAddress: order.delivery_address || (order.fulfillment_hub ? `Hub: ${order.fulfillment_hub}` : ''),
        yourRef: `ORD-${order.id.slice(0, 8).toUpperCase()}`,
        products: (order.items && order.items.length > 0)
          ? order.items.map((item, idx) => ({
              partNumber: item.id || `ITEM-${idx + 1}`,
              productName: item.name + (item.brand ? ` (${item.brand})` : ''),
              qty: item.quantity || 1,
              unitPrice: item.price || 0,
            }))
          : [
              {
                partNumber: 'YARD-REQUISITION',
                productName: `Storefront Cart Order #${order.id.slice(0, 8).toUpperCase()}`,
                qty: 1,
                unitPrice: order.subtotal || 0,
              },
            ],
        notes: order.notes || '',
        sourceRequestId: order.id,
        sourceType: 'order',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant pb-6">
        <div>
          <div className="flex items-center gap-3">
            <span
              className="material-symbols-outlined text-primary text-3xl p-2 bg-primary/10 rounded-xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              local_shipping
            </span>
            <div>
              <h1 className="font-headline-md text-2xl font-black text-gray-900 tracking-tight">
                Yard Orders &amp; Live Tracking
              </h1>
              <p className="text-secondary text-sm mt-0.5">
                Manage online yard cart requisitions, fulfill orders, and publish real-time milestone checkpoints to client tracking portals.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              loadOrders();
              loadStats();
            }}
            className="flex items-center gap-2 px-3.5 py-2 bg-white border border-outline-variant hover:border-primary text-gray-700 hover:text-gray-900 text-sm font-semibold rounded-lg shadow-sm transition-all"
          >
            <span className="material-symbols-outlined text-lg">refresh</span>
            <span>Refresh Orders</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {/* Total */}
        <div className="p-4 rounded-xl bg-white border border-outline-variant shadow-sm hover:border-gray-400 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total</span>
            <span className="material-symbols-outlined text-gray-600 bg-gray-100 p-1.5 rounded-lg text-base">
              receipt_long
            </span>
          </div>
          <p className="text-2xl font-black text-gray-900 mt-2">{stats?.total ?? 0}</p>
          <span className="text-[11px] text-gray-500 font-medium">All recorded</span>
        </div>

        {/* Placed */}
        <div className="p-4 rounded-xl bg-white border border-blue-200 shadow-sm hover:border-blue-400 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Placed</span>
            <span className="material-symbols-outlined text-blue-600 bg-blue-50 p-1.5 rounded-lg text-base">
              receipt
            </span>
          </div>
          <p className="text-2xl font-black text-blue-700 mt-2">{stats?.order_placed ?? 0}</p>
          <span className="text-[11px] text-blue-600/80 font-medium">New checkout</span>
        </div>

        {/* Confirmed */}
        <div className="p-4 rounded-xl bg-white border border-indigo-200 shadow-sm hover:border-indigo-400 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">Confirmed</span>
            <span className="material-symbols-outlined text-indigo-600 bg-indigo-50 p-1.5 rounded-lg text-base">
              verified
            </span>
          </div>
          <p className="text-2xl font-black text-indigo-700 mt-2">{stats?.confirmed ?? 0}</p>
          <span className="text-[11px] text-indigo-600/80 font-medium">Payment verified</span>
        </div>

        {/* Processing */}
        <div className="p-4 rounded-xl bg-white border border-amber-200 shadow-sm hover:border-amber-400 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Processing</span>
            <span className="material-symbols-outlined text-amber-600 bg-amber-50 p-1.5 rounded-lg text-base">
              build
            </span>
          </div>
          <p className="text-2xl font-black text-amber-700 mt-2">{stats?.processing ?? 0}</p>
          <span className="text-[11px] text-amber-700/80 font-medium">Yard packing</span>
        </div>

        {/* In Transit */}
        <div className="p-4 rounded-xl bg-white border border-purple-200 shadow-sm hover:border-purple-400 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">In Transit</span>
            <span className="material-symbols-outlined text-purple-600 bg-purple-50 p-1.5 rounded-lg text-base">
              local_shipping
            </span>
          </div>
          <p className="text-2xl font-black text-purple-700 mt-2">{stats?.in_transit ?? 0}</p>
          <span className="text-[11px] text-purple-600/80 font-medium">On the road</span>
        </div>

        {/* Delivered */}
        <div className="p-4 rounded-xl bg-white border border-emerald-200 shadow-sm hover:border-emerald-400 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Delivered</span>
            <span className="material-symbols-outlined text-emerald-600 bg-emerald-50 p-1.5 rounded-lg text-base">
              check_circle
            </span>
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-2">{stats?.delivered ?? 0}</p>
          <span className="text-[11px] text-emerald-700/80 font-medium">Completed</span>
        </div>

        {/* Cancelled */}
        <div className="p-4 rounded-xl bg-white border border-rose-200 shadow-sm hover:border-rose-400 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">Cancelled</span>
            <span className="material-symbols-outlined text-rose-600 bg-rose-50 p-1.5 rounded-lg text-base">
              cancel
            </span>
          </div>
          <p className="text-2xl font-black text-rose-700 mt-2">{stats?.cancelled ?? 0}</p>
          <span className="text-[11px] text-rose-600/80 font-medium">Voided</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-outline-variant shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          {(
            [
              'all',
              'order_placed',
              'confirmed',
              'processing',
              'in_transit',
              'delivered',
              'cancelled',
            ] as const
          ).map((st) => {
            const isActive = statusFilter === st;
            return (
              <button
                key={st}
                onClick={() => {
                  setStatusFilter(st);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs border transition-all shrink-0 font-bold flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-primary text-white border-primary shadow-sm shadow-primary/20'
                    : 'bg-surface-container-low hover:bg-gray-100 text-gray-700 border-outline-variant'
                }`}
              >
                {st === 'all' ? 'All Orders' : STATUS_CONFIG[st]?.label || st}
              </button>
            );
          })}
        </div>

        <div className="relative min-w-[280px]">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-lg">
            search
          </span>
          <input
            type="text"
            placeholder="Search by order ID, company, client, hub..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-gray-500">
            <span className="material-symbols-outlined animate-spin text-3xl text-primary mb-2">
              progress_activity
            </span>
            <p className="font-semibold text-gray-700">Loading Yard Orders...</p>
          </div>
        ) : error ? (
          <div className="p-16 text-center text-rose-600">
            <span className="material-symbols-outlined text-4xl mb-2">error</span>
            <p className="font-semibold">{error}</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-16 text-center text-gray-500">
            <span className="material-symbols-outlined text-4xl text-gray-400 mb-2">
              inventory_2
            </span>
            <p className="font-semibold text-gray-700">No orders found matching the criteria.</p>
            <p className="text-xs text-gray-500 mt-1">Try clearing filters or search query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container/60 text-gray-700 text-xs font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-6">Order Ref</th>
                  <th className="py-3.5 px-6">Customer &amp; Company</th>
                  <th className="py-3.5 px-6">Fulfillment Hub</th>
                  <th className="py-3.5 px-6">Items / Equipment</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Date</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/60 text-sm">
                {orders.map((order) => {
                  const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.order_placed;
                  return (
                    <tr key={order.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-mono font-bold text-primary text-xs tracking-wide bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-md inline-flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">qr_code_2</span>
                          {order.id}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-bold text-gray-900">{order.customer_name}</div>
                        <div className="text-gray-600 text-xs font-medium flex items-center gap-1 mt-0.5">
                          <span className="material-symbols-outlined text-xs text-gray-400">corporate_fare</span>
                          {order.company || 'Private Client'}
                        </div>
                        <div className="text-gray-500 text-xs mt-0.5">
                          {order.email} • {order.phone}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-gray-800 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded">
                          <span className="material-symbols-outlined text-xs text-primary">location_on</span>
                          {order.fulfillment_hub}
                        </span>
                        <div className="text-gray-500 text-xs mt-1 truncate max-w-xs">
                          {order.delivery_address}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-bold text-gray-900 flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm text-gray-500">inventory_2</span>
                          {order.items?.length || 0} Item(s)
                        </div>
                        <div className="text-gray-500 text-xs truncate max-w-xs mt-0.5">
                          {order.items?.map((it) => it.name).join(', ') || 'No line items listed'}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusCfg.badgeClass}`}
                        >
                          <span className="material-symbols-outlined text-sm">{statusCfg.icon}</span>
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-xs">
                        <div className="font-semibold text-gray-800">
                          {new Date(order.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-gray-500 text-[11px]">
                          {new Date(order.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right whitespace-nowrap space-x-2">
                        {onPrepareQuotation && (
                          <button
                            onClick={() => handleStartQuote(order)}
                            className="px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-black text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-xs"
                            title="Prepare official quotation for this order"
                          >
                            <span className="material-symbols-outlined text-sm">request_quote</span>
                            <span>Quote</span>
                          </button>
                        )}
                        <button
                          onClick={() => openStatusModal(order)}
                          className="px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-white border border-primary/30 text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-sm"
                        >
                          <span className="material-symbols-outlined text-sm">tune</span>
                          <span>Manage / Track</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 bg-surface-container/30 border-t border-outline-variant flex items-center justify-between text-xs text-gray-600 font-medium">
            <span>
              Showing {orders.length} of {totalRecords} orders
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-outline-variant bg-white text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-40 transition-all"
              >
                Previous
              </button>
              <span className="font-bold text-gray-800">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-outline-variant bg-white text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-40 transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Status & Tracking Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-outline-variant rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl text-gray-900">
            <div className="flex items-center justify-between border-b border-outline-variant pb-4 mb-6">
              <div>
                <span className="text-xs uppercase tracking-wider text-primary font-mono font-bold bg-primary/10 px-2 py-0.5 rounded inline-block mb-1">
                  Fulfillment &amp; Milestone Control
                </span>
                <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                  Order #{selectedOrder.id}
                </h2>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 transition font-bold"
              >
                ✕
              </button>
            </div>

            {updateError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                {updateError}
              </div>
            )}

            <form onSubmit={handleStatusSubmit} className="space-y-6">
              {/* Order Info Recap */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-surface-container-low border border-outline-variant text-xs">
                <div>
                  <span className="text-gray-500 font-semibold text-[11px] uppercase tracking-wider block mb-1">
                    Customer
                  </span>
                  <span className="text-gray-900 font-bold text-sm block">
                    {selectedOrder.customer_name} ({selectedOrder.company || 'Private'})
                  </span>
                  <span className="text-gray-600 block mt-0.5">
                    {selectedOrder.email} • {selectedOrder.phone}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 font-semibold text-[11px] uppercase tracking-wider block mb-1">
                    Delivery Address &amp; Hub
                  </span>
                  <span className="text-gray-900 font-bold text-sm block">
                    {selectedOrder.fulfillment_hub}
                  </span>
                  <span className="text-gray-600 block truncate mt-0.5">
                    {selectedOrder.delivery_address}
                  </span>
                </div>
              </div>

              {/* Status Selector */}
              <div>
                <label className="block text-xs uppercase font-bold text-gray-700 tracking-wider mb-2">
                  Update Order Logistics Status
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(
                    [
                      'order_placed',
                      'confirmed',
                      'processing',
                      'in_transit',
                      'delivered',
                      'cancelled',
                    ] as const
                  ).map((st) => (
                    <button
                      type="button"
                      key={st}
                      onClick={() => setTargetStatus(st)}
                      className={`p-2.5 rounded-lg border text-left text-xs font-bold flex items-center gap-2 transition ${
                        targetStatus === st
                          ? 'border-2 border-primary bg-primary/10 text-primary shadow-sm'
                          : 'border-outline-variant bg-surface-container-low hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">
                        {STATUS_CONFIG[st].icon}
                      </span>
                      {STATUS_CONFIG[st].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Milestone Details */}
              <div className="border border-outline-variant rounded-xl p-4 bg-surface-container/20 space-y-3">
                <span className="text-xs font-bold text-gray-900 block">
                  Add Public Milestone Step to Client Tracking Timeline:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                      Milestone Headline (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder={`e.g. Dispatched from ${selectedOrder.fulfillment_hub}`}
                      value={milestoneTitle}
                      onChange={(e) => setMilestoneTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-outline-variant rounded-lg text-gray-900 text-xs focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                      Location Checkpoint (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Elelenwo Expressway Hub"
                      value={milestoneLocation}
                      onChange={(e) => setMilestoneLocation(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-outline-variant rounded-lg text-gray-900 text-xs focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-gray-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    Public Note / Status Detail
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Heavy dispatch carrier loaded and clearing transit toll."
                    value={milestoneDescription}
                    onChange={(e) => setMilestoneDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-outline-variant rounded-lg text-gray-900 text-xs focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Internal Notes */}
              <div>
                <label className="block text-xs uppercase font-bold text-gray-700 tracking-wider mb-1">
                  Internal Operations Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Private internal notes regarding truck driver, waypoint passcodes, invoice number, etc."
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-outline-variant rounded-lg text-gray-900 text-xs focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-gray-400"
                />
              </div>

              {/* Order Items Breakdown */}
              <div className="border-t border-outline-variant pt-4">
                <span className="text-xs font-bold text-gray-700 block mb-2">
                  Order Line Items ({selectedOrder.items?.length || 0}):
                </span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {selectedOrder.items?.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center text-xs p-2.5 rounded-lg bg-surface-container/40 border border-outline-variant/60"
                    >
                      <span className="text-gray-900 font-bold">{item.name}</span>
                      <span className="text-gray-500 font-medium">
                        {item.brand || item.category || 'Requisition Item'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-outline-variant">
                <div>
                  {onPrepareQuotation && selectedOrder && (
                    <button
                      type="button"
                      onClick={() => {
                        handleStartQuote(selectedOrder);
                        setSelectedOrder(null);
                      }}
                      className="px-4 py-2 rounded-lg bg-black hover:bg-primary text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                    >
                      <span className="material-symbols-outlined text-sm">request_quote</span>
                      <span>Prepare Quotation</span>
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedOrder(null)}
                    className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-6 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
                  >
                    {updating ? 'Updating...' : 'Publish Status Update'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
