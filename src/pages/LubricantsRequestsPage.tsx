import { useState, useEffect, useCallback } from 'react';
import {
  fetchLubricantRequests,
  fetchLubricantRequestStats,
  updateLubricantRequestStatus,
  deleteLubricantRequest,
} from '../services/lubricantsRequestsService';
import { LubricantRequest, LubricantRequestStats } from '../services/types';
import type { TabType } from '../components/Layout';

interface LubricantsRequestsPageProps {
  onNavigate?: (tab: TabType) => void;
}

export default function LubricantsRequestsPage({ onNavigate: _onNavigate }: LubricantsRequestsPageProps) {
  const [requests, setRequests] = useState<LubricantRequest[]>([]);
  const [stats, setStats] = useState<LubricantRequestStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Modal State
  const [selectedRequest, setSelectedRequest] = useState<LubricantRequest | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [editNotes, setEditNotes] = useState('');
  const [modalStatus, setModalStatus] = useState<string>('new');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      const res = await fetchLubricantRequestStats();
      setStats(res.data);
    } catch (err: any) {
      console.error('Failed to load lubricant stats:', err);
    }
  }, []);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchLubricantRequests({
        status: statusFilter,
        brand: brandFilter,
        search: searchQuery,
        page,
        limit: 15,
      });
      setRequests(res.data);
      setTotalPages(res.pagination.totalPages || 1);
      setTotalRecords(res.pagination.total || 0);
    } catch (err: any) {
      setError(err.message || 'Failed to load lubricant requests');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, brandFilter, searchQuery, page]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleOpenModal = (req: LubricantRequest) => {
    setSelectedRequest(req);
    setModalStatus(req.status);
    setEditNotes(req.notes || '');
  };

  const handleUpdateStatus = async () => {
    if (!selectedRequest) return;
    setStatusUpdating(true);
    try {
      await updateLubricantRequestStatus(selectedRequest.id, modalStatus, editNotes);
      setSelectedRequest(null);
      loadRequests();
      loadStats();
    } catch (err: any) {
      alert(`Error updating status: ${err.message}`);
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteLubricantRequest(id);
      setDeleteConfirmId(null);
      if (selectedRequest?.id === id) setSelectedRequest(null);
      loadRequests();
      loadStats();
    } catch (err: any) {
      alert(`Error deleting request: ${err.message}`);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'contacted':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'quoted':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'closed':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl">water_drop</span>
            <span>Lubricants &amp; Special Fluids Inquiries</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage OEM compressor oil, coolant, desiccant, and flushing fluid procurement requests.
          </p>
        </div>

        <button
          onClick={() => {
            loadStats();
            loadRequests();
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-white border border-outline-variant hover:bg-gray-50 text-gray-700 rounded-lg shadow-sm transition-all"
        >
          <span className="material-symbols-outlined text-base">refresh</span>
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Stats Summary Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
          <div className="p-4 bg-white border border-outline-variant rounded-xl shadow-sm">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Total Fluid RFQs</span>
            <span className="text-2xl font-black text-gray-900 mt-1 block">{stats.total}</span>
            <span className="text-[11px] text-gray-400 mt-1 block">
              AC {stats.brands.atlas_copco} • SL {stats.brands.sullair} • IR {stats.brands.ingersoll_rand}
            </span>
          </div>

          <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl shadow-sm">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">New Incoming</span>
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            </div>
            <span className="text-2xl font-black text-blue-900 mt-1 block">{stats.new}</span>
            <span className="text-[11px] text-blue-600 mt-1 block">Awaiting stock quotation</span>
          </div>

          <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl shadow-sm">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block">Client Contacted</span>
            <span className="text-2xl font-black text-amber-900 mt-1 block">{stats.contacted}</span>
            <span className="text-[11px] text-amber-600 mt-1 block">Verifying viscosity &amp; specs</span>
          </div>

          <div className="p-4 bg-purple-50/60 border border-purple-200 rounded-xl shadow-sm">
            <span className="text-xs font-bold text-purple-700 uppercase tracking-wider block">Quotation Sent</span>
            <span className="text-2xl font-black text-purple-900 mt-1 block">{stats.quoted}</span>
            <span className="text-[11px] text-purple-600 mt-1 block">Batch pricing delivered</span>
          </div>

          <div className="p-4 bg-green-50/60 border border-green-200 rounded-xl shadow-sm">
            <span className="text-xs font-bold text-green-700 uppercase tracking-wider block">Fulfill &amp; Dispatched</span>
            <span className="text-2xl font-black text-green-900 mt-1 block">{stats.closed}</span>
            <span className="text-[11px] text-green-600 mt-1 block">Warehouse dispatches</span>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white border border-outline-variant rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
              search
            </span>
            <input
              type="text"
              placeholder="Search by company, email, fluid spec, volume, hub, or phone..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 border border-outline-variant rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          {/* Brand Filter */}
          <select
            value={brandFilter}
            onChange={(e) => {
              setBrandFilter(e.target.value);
              setPage(1);
            }}
            className="border border-outline-variant rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:border-primary outline-none"
          >
            <option value="all">All Brands</option>
            <option value="ATLAS COPCO">Atlas Copco</option>
            <option value="SULLAIR">Sullair</option>
            <option value="INGERSOLL RAND">Ingersoll Rand</option>
            <option value="DENAIR">Denair</option>
            <option value="OTHERS">Others</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="border border-outline-variant rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:border-primary outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="quoted">Quoted</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <span className="material-symbols-outlined animate-spin text-3xl text-primary mb-2">
              progress_activity
            </span>
            <p className="text-sm text-gray-500 font-medium">Loading lubricant RFQ records...</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center text-red-600">
            <span className="material-symbols-outlined text-4xl mb-2">error</span>
            <p className="font-bold">{error}</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="py-20 text-center">
            <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">inbox</span>
            <p className="text-gray-500 font-medium">No lubricant requests match your filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50/70 border-b border-outline-variant text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4">RFQ Ref / Date</th>
                  <th className="py-3 px-4">Company &amp; Contact</th>
                  <th className="py-3 px-4">Brand</th>
                  <th className="py-3 px-4">Fluid Specification</th>
                  <th className="py-3 px-4">Volume Packaging</th>
                  <th className="py-3 px-4">Delivery Hub</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50/60 transition-colors">
                    {/* RFQ Ref & Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-mono text-xs font-bold text-gray-900 block">
                        LUB-{req.id.substring(0, 8).toUpperCase()}
                      </span>
                      <span className="text-[11px] text-gray-400">
                        {new Date(req.created_at).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </td>

                    {/* Company & Contact */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-gray-900">{req.company_name}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                        <a href={`mailto:${req.email}`} className="hover:text-primary transition-colors">
                          {req.email}
                        </a>
                        <span>•</span>
                        <a href={`tel:${req.phone}`} className="hover:text-primary transition-colors">
                          {req.phone}
                        </a>
                      </div>
                    </td>

                    {/* Brand */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="bg-gray-100 text-gray-800 border border-gray-200 px-2 py-0.5 rounded text-xs font-bold">
                        {req.brand}
                      </span>
                    </td>

                    {/* Fluid Specification */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-gray-900">{req.fluid_type}</div>
                    </td>

                    {/* Volume Packaging */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200 px-2 py-1 rounded">
                        <span className="material-symbols-outlined text-xs text-gray-400">package_2</span>
                        <span>{req.volume}</span>
                      </span>
                    </td>

                    {/* Delivery Hub */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs text-gray-400">location_on</span>
                        <span>{req.hub}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusBadge(req.status)}`}>
                        {req.status.toUpperCase()}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1">
                      <button
                        onClick={() => handleOpenModal(req)}
                        className="px-2.5 py-1 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded transition-colors"
                        title="View and process lubricant quote"
                      >
                        Manage
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(req.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete request"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!loading && totalRecords > 0 && (
          <div className="py-3 px-4 border-t border-outline-variant flex items-center justify-between text-xs text-gray-500">
            <span>
              Showing {requests.length} of {totalRecords} records
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 border border-outline-variant rounded hover:bg-gray-50 disabled:opacity-40 font-bold"
              >
                Previous
              </button>
              <span className="px-2">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-2.5 py-1 border border-outline-variant rounded hover:bg-gray-50 disabled:opacity-40 font-bold"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Details & Status Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-outline-variant overflow-hidden animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-outline-variant flex justify-between items-center bg-gray-50/50">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded">
                  Lubricants Procurement RFQ
                </span>
                <h3 className="text-lg font-black text-gray-900 mt-1">
                  LUB-{selectedRequest.id.substring(0, 8).toUpperCase()}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-sm max-h-[75vh] overflow-y-auto">
              {/* Fluid Specification Overview */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-200 text-xs">
                <div>
                  <span className="text-gray-500 block">Brand:</span>
                  <strong className="text-gray-900">{selectedRequest.brand}</strong>
                </div>
                <div>
                  <span className="text-gray-500 block">Packaging Volume:</span>
                  <strong className="text-primary">{selectedRequest.volume}</strong>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500 block">Fluid Grade / Specification:</span>
                  <strong className="text-gray-900 text-sm">{selectedRequest.fluid_type}</strong>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500 block">Delivery Depot / Hub:</span>
                  <strong className="text-gray-900">{selectedRequest.hub}</strong>
                </div>
              </div>

              {/* Company & Contact */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">Company &amp; Contact</h4>
                <div className="p-3 bg-white border border-gray-200 rounded-lg space-y-1">
                  <p className="font-bold text-gray-900 text-base">{selectedRequest.company_name}</p>
                  <p className="text-gray-600 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">mail</span>
                    <a href={`mailto:${selectedRequest.email}`} className="text-primary hover:underline">
                      {selectedRequest.email}
                    </a>
                  </p>
                  <p className="text-gray-600 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">phone</span>
                    <a href={`tel:${selectedRequest.phone}`} className="text-gray-800">
                      {selectedRequest.phone}
                    </a>
                  </p>
                </div>
              </div>

              {selectedRequest.notes && (
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">Customer / Equipment Notes</h4>
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 text-xs italic">
                    "{selectedRequest.notes}"
                  </div>
                </div>
              )}

              {/* Status Update */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Workflow Status</label>
                <select
                  value={modalStatus}
                  onChange={(e) => setModalStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white font-medium focus:border-primary outline-none"
                >
                  <option value="new">NEW (Unassigned / Pending Quote)</option>
                  <option value="contacted">CONTACTED (Verifying volume and specs)</option>
                  <option value="quoted">QUOTED (Formal batch pricing delivered)</option>
                  <option value="closed">CLOSED (Order fulfilled / dispatched from hub)</option>
                </select>
              </div>

              {/* Internal Notes */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Internal Logistics &amp; Warehouse Notes
                </label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Record batch lot number, per-drum price, waybill reference, dispatch date..."
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:border-primary outline-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-outline-variant flex justify-between items-center">
              <span className="text-[11px] text-gray-400">
                Created on {new Date(selectedRequest.created_at).toLocaleString('en-GB')}
              </span>
              <div className="space-x-2">
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="px-3.5 py-2 text-xs font-bold text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateStatus}
                  disabled={statusUpdating}
                  className="px-4 py-2 text-xs font-bold bg-primary text-white hover:bg-primary-dark rounded-lg shadow-sm transition-all disabled:opacity-50"
                >
                  {statusUpdating ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-2xl border border-outline-variant">
            <h3 className="font-bold text-gray-900 text-base mb-2">Delete Lubricant Request?</h3>
            <p className="text-xs text-gray-600 mb-4">
              Are you sure you want to remove this lubricant procurement inquiry? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-3 py-1.5 text-xs font-bold bg-red-600 text-white hover:bg-red-700 rounded-lg shadow-sm"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

