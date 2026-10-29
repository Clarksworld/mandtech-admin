import { useState, useEffect, useCallback } from 'react';
import { ordersService } from '../services/ordersService';
import type { OrderRecord, OrderStats, OrderStatus } from '../services/types';
import type { TabType } from '../components/Layout';

interface OrdersPageProps {
  onNavigate?: (tab: TabType) => void;
}

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; badgeClass: string; icon: string }
> = {
  order_placed: { label: 'Order Placed', badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: 'receipt' },
  confirmed: { label: 'Confirmed', badgeClass: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', icon: 'verified' },
  processing: { label: 'Processing', badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: 'build' },
  in_transit: { label: 'In Transit', badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/20', icon: 'local_shipping' },
  delivered: { label: 'Delivered', badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: 'check_circle' },
  cancelled: { label: 'Cancelled', badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/20', icon: 'cancel' },
};

export default function OrdersPage({ onNavigate: _onNavigate }: OrdersPageProps) {
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

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-3xl">local_shipping</span>
            <h1 className="text-headline-md font-bold text-white tracking-tight">Yard Orders &amp; Live Tracking</h1>
          </div>
          <p className="text-white/60 text-sm mt-1">
            Manage online yard cart requisitions, fulfill orders, and publish real-time milestone updates to client tracking portal.
          </p>
        </div>

        <button
          onClick={() => { loadOrders(); loadStats(); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 text-sm font-medium transition"
        >
          <span className="material-symbols-outlined text-sm">refresh</span>
          Refresh Orders
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="p-4 rounded-xl bg-surface-container border border-white/10 flex flex-col justify-between">
          <span className="text-white/50 text-xs font-semibold uppercase">Total Orders</span>
          <span className="text-2xl font-bold text-white mt-2">{stats?.total ?? 0}</span>
        </div>
        <div className="p-4 rounded-xl bg-surface-container border border-blue-500/20 flex flex-col justify-between">
          <span className="text-blue-400 text-xs font-semibold uppercase">Placed</span>
          <span className="text-2xl font-bold text-blue-400 mt-2">{stats?.order_placed ?? 0}</span>
        </div>
        <div className="p-4 rounded-xl bg-surface-container border border-indigo-500/20 flex flex-col justify-between">
          <span className="text-indigo-400 text-xs font-semibold uppercase">Confirmed</span>
          <span className="text-2xl font-bold text-indigo-400 mt-2">{stats?.confirmed ?? 0}</span>
        </div>
        <div className="p-4 rounded-xl bg-surface-container border border-amber-500/20 flex flex-col justify-between">
          <span className="text-amber-400 text-xs font-semibold uppercase">Processing</span>
          <span className="text-2xl font-bold text-amber-400 mt-2">{stats?.processing ?? 0}</span>
        </div>
        <div className="p-4 rounded-xl bg-surface-container border border-purple-500/20 flex flex-col justify-between">
          <span className="text-purple-400 text-xs font-semibold uppercase">In Transit</span>
          <span className="text-2xl font-bold text-purple-400 mt-2">{stats?.in_transit ?? 0}</span>
        </div>
        <div className="p-4 rounded-xl bg-surface-container border border-emerald-500/20 flex flex-col justify-between">
          <span className="text-emerald-400 text-xs font-semibold uppercase">Delivered</span>
          <span className="text-2xl font-bold text-emerald-400 mt-2">{stats?.delivered ?? 0}</span>
        </div>
        <div className="p-4 rounded-xl bg-surface-container border border-rose-500/20 flex flex-col justify-between">
          <span className="text-rose-400 text-xs font-semibold uppercase">Cancelled</span>
          <span className="text-2xl font-bold text-rose-400 mt-2">{stats?.cancelled ?? 0}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-surface-container p-4 rounded-xl border border-white/10">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
          {(['all', 'order_placed', 'confirmed', 'processing', 'in_transit', 'delivered', 'cancelled'] as const).map((st) => (
            <button
              key={st}
              onClick={() => { setStatusFilter(st); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition shrink-0 ${
                statusFilter === st
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white/5 text-white/60 border-white/10 hover:text-white'
              }`}
            >
              {st === 'all' ? 'All Orders' : STATUS_CONFIG[st]?.label || st}
            </button>
          ))}
        </div>

        <div className="relative min-w-[280px]">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-white/40 text-lg">search</span>
          <input
            type="text"
            placeholder="Search by order ID, company, email, hub..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-primary transition"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-surface-container rounded-xl border border-white/10 overflow-hidden shadow-2xl">
        {loading ? (
          <div className="p-16 text-center text-white/40">
            <span className="material-symbols-outlined animate-spin text-3xl mb-2">progress_activity</span>
            <p>Loading Yard Orders...</p>
          </div>
        ) : error ? (
          <div className="p-16 text-center text-rose-400">
            <span className="material-symbols-outlined text-4xl mb-2">error</span>
            <p>{error}</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-16 text-center text-white/40">
            <span className="material-symbols-outlined text-4xl mb-2">inventory_2</span>
            <p>No orders found matching the criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-white/50 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-4 px-6">Order Ref</th>
                  <th className="py-4 px-6">Customer &amp; Company</th>
                  <th className="py-4 px-6">Fulfillment Hub</th>
                  <th className="py-4 px-6">Items / Equipment</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm text-white/80">
                {orders.map((order) => {
                  const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.order_placed;
                  return (
                    <tr key={order.id} className="hover:bg-white/5 transition">
                      <td className="py-4 px-6 font-mono font-bold text-primary">
                        {order.id}
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-semibold text-white">{order.customer_name}</div>
                        <div className="text-white/50 text-xs">{order.company || 'Private Client'}</div>
                        <div className="text-white/40 text-xs">{order.email} • {order.phone}</div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1 text-xs text-white/70">
                          <span className="material-symbols-outlined text-xs text-primary">location_on</span>
                          {order.fulfillment_hub}
                        </span>
                        <div className="text-white/40 text-[11px] truncate max-w-xs">{order.delivery_address}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-medium text-white">{order.items?.length || 0} Item(s)</div>
                        <div className="text-white/50 text-xs truncate max-w-xs">
                          {order.items?.map((it) => it.name).join(', ') || 'No line items listed'}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusCfg.badgeClass}`}>
                          <span className="material-symbols-outlined text-sm">{statusCfg.icon}</span>
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-white/50 text-xs">
                        {new Date(order.created_at).toLocaleDateString()}
                        <div className="text-white/30 text-[11px]">{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => openStatusModal(order)}
                          className="px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs font-semibold transition"
                        >
                          Manage / Track
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
          <div className="p-4 border-t border-white/10 flex items-center justify-between text-xs text-white/60">
            <span>Showing {orders.length} of {totalRecords} orders</span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 rounded border border-white/10 disabled:opacity-40 hover:bg-white/5"
              >
                Previous
              </button>
              <span>Page {page} of {totalPages}</span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1 rounded border border-white/10 disabled:opacity-40 hover:bg-white/5"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Status & Tracking Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-container border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
              <div>
                <span className="text-xs uppercase tracking-wider text-primary font-mono font-bold">Fulfillment Control</span>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  Order #{selectedOrder.id}
                </h2>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white"
              >
                ✕
              </button>
            </div>

            {updateError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {updateError}
              </div>
            )}

            <form onSubmit={handleStatusSubmit} className="space-y-6">
              {/* Order Info Recap */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-black/30 border border-white/5 text-xs">
                <div>
                  <span className="text-white/40 block">Customer</span>
                  <span className="text-white font-medium">{selectedOrder.customer_name} ({selectedOrder.company || 'Private'})</span>
                  <span className="text-white/60 block">{selectedOrder.email} • {selectedOrder.phone}</span>
                </div>
                <div>
                  <span className="text-white/40 block">Delivery Address &amp; Hub</span>
                  <span className="text-white font-medium">{selectedOrder.fulfillment_hub}</span>
                  <span className="text-white/60 block truncate">{selectedOrder.delivery_address}</span>
                </div>
              </div>

              {/* Status Selector */}
              <div>
                <label className="block text-xs uppercase font-semibold text-white/70 mb-2">
                  Update Order Logistics Status
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(['order_placed', 'confirmed', 'processing', 'in_transit', 'delivered', 'cancelled'] as const).map((st) => (
                    <button
                      type="button"
                      key={st}
                      onClick={() => setTargetStatus(st)}
                      className={`p-2.5 rounded-lg border text-left text-xs font-semibold flex items-center gap-2 transition ${
                        targetStatus === st
                          ? 'border-primary bg-primary/20 text-primary'
                          : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">{STATUS_CONFIG[st].icon}</span>
                      {STATUS_CONFIG[st].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Milestone Details */}
              <div className="border border-white/10 rounded-xl p-4 bg-white/[0.02] space-y-3">
                <span className="text-xs font-bold text-white/80 block">Add Public Milestone Step to Client Tracking Timeline:</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-white/60 mb-1">Milestone Headline (Optional)</label>
                    <input
                      type="text"
                      placeholder={`e.g. Dispatched from ${selectedOrder.fulfillment_hub}`}
                      value={milestoneTitle}
                      onChange={(e) => setMilestoneTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-white/60 mb-1">Location Checkpoint (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Elelenwo Expressway Hub"
                      value={milestoneLocation}
                      onChange={(e) => setMilestoneLocation(e.target.value)}
                      className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-white/60 mb-1">Public Note / Status Detail</label>
                  <input
                    type="text"
                    placeholder="e.g. Heavy dispatch carrier loaded and clearing transit toll."
                    value={milestoneDescription}
                    onChange={(e) => setMilestoneDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Internal Notes */}
              <div>
                <label className="block text-xs uppercase font-semibold text-white/70 mb-1">
                  Internal Operations Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Private internal notes regarding truck driver, waypoint passcodes, invoice number, etc."
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-primary"
                />
              </div>

              {/* Order Items Breakdown */}
              <div className="border-t border-white/10 pt-4">
                <span className="text-xs font-semibold text-white/60 block mb-2">Order Line Items ({selectedOrder.items?.length || 0}):</span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs p-2 rounded bg-black/20 border border-white/5">
                      <span className="text-white font-medium">{item.name}</span>
                      <span className="text-white/50">{item.brand || item.category || 'Requisition Item'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-6 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-primary/20"
                >
                  {updating ? 'Updating...' : 'Publish Status Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
