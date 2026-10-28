import { useState, useEffect, useCallback } from 'react';
import {
  fetchCompressorRequests,
  fetchCompressorRequestStats,
  updateCompressorRequestStatus,
  deleteCompressorRequest,
} from '../services/compressorRequestsService';
import { CompressorRequest, CompressorRequestStats } from '../services/types';
import type { TabType } from '../components/Layout';

interface CompressorRequestsPageProps {
  onNavigate?: (tab: TabType) => void;
}

export default function CompressorRequestsPage({ onNavigate: _onNavigate }: CompressorRequestsPageProps) {
  const [requests, setRequests] = useState<CompressorRequest[]>([]);
  const [stats, setStats] = useState<CompressorRequestStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Modal State
  const [selectedRequest, setSelectedRequest] = useState<CompressorRequest | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [editNotes, setEditNotes] = useState('');
  const [modalStatus, setModalStatus] = useState<string>('new');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      const res = await fetchCompressorRequestStats();
      setStats(res.data);
    } catch (err: any) {
      console.error('Failed to load compressor stats:', err);
    }
  }, []);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchCompressorRequests({
        status: statusFilter,
        compressor_type: typeFilter,
        brand: brandFilter,
        search: searchQuery,
        page,
        limit: 15,
      });
      setRequests(res.data);
      setTotalPages(res.pagination.totalPages || 1);
      setTotalRecords(res.pagination.total || 0);
    } catch (err: any) {
      console.error('Failed to load compressor requests:', err);
      setError(err.message || 'Unable to retrieve compressor requests.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, brandFilter, searchQuery, page]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleOpenModal = (req: CompressorRequest) => {
    setSelectedRequest(req);
    setModalStatus(req.status);
    setEditNotes(req.notes || '');
  };

  const handleSaveModal = async () => {
    if (!selectedRequest) return;
    setStatusUpdating(true);
    try {
      const res = await updateCompressorRequestStatus(selectedRequest.id, modalStatus, editNotes);
      setSelectedRequest(res.data);
      // update in table
      setRequests((prev) =>
        prev.map((r) => (r.id === selectedRequest.id ? res.data : r))
      );
      loadStats();
      setSelectedRequest(null);
    } catch (err: any) {
      alert(err.message || 'Failed to update quotation request status');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCompressorRequest(id);
      setDeleteConfirmId(null);
      if (selectedRequest?.id === id) setSelectedRequest(null);
      loadRequests();
      loadStats();
    } catch (err: any) {
      alert(err.message || 'Failed to delete request');
    }
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'contacted':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'quoted':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'closed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              air
            </span>
            <h1 className="font-headline-md text-2xl font-black text-gray-900 tracking-tight">
              Compressor Request
            </h1>
          </div>
          <p className="text-secondary text-sm mt-1">
            Review and process commercial quotation requests submitted for Electric and Diesel air compressors.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              loadRequests();
              loadStats();
            }}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-outline-variant hover:border-primary text-gray-700 text-sm font-semibold rounded-lg shadow-sm transition-all"
          >
            <span className="material-symbols-outlined text-lg">refresh</span>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total */}
        <div className="bg-white border border-outline-variant rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Requests</span>
            <span className="material-symbols-outlined text-primary bg-primary/10 p-2 rounded-lg text-lg">
              receipt_long
            </span>
          </div>
          <p className="text-2xl font-black text-gray-900 mt-2">{stats?.total ?? 0}</p>
          <span className="text-xs text-gray-500 font-medium">All recorded quotes</span>
        </div>

        {/* Electric Compressors */}
        <div className="bg-white border border-outline-variant rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Electric Units</span>
            <span className="material-symbols-outlined text-blue-600 bg-blue-50 p-2 rounded-lg text-lg">
              bolt
            </span>
          </div>
          <p className="text-2xl font-black text-blue-700 mt-2">{stats?.types?.electric ?? 0}</p>
          <span className="text-xs text-gray-500 font-medium">Plant &amp; stationary</span>
        </div>

        {/* Diesel Compressors */}
        <div className="bg-white border border-outline-variant rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Diesel Units</span>
            <span className="material-symbols-outlined text-amber-600 bg-amber-50 p-2 rounded-lg text-lg">
              local_fire_department
            </span>
          </div>
          <p className="text-2xl font-black text-amber-700 mt-2">{stats?.types?.diesel ?? 0}</p>
          <span className="text-xs text-gray-500 font-medium">Mobile &amp; field trailer</span>
        </div>

        {/* Pending Quotes */}
        <div className="bg-white border border-outline-variant rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Action Needed</span>
            <span className="material-symbols-outlined text-purple-600 bg-purple-50 p-2 rounded-lg text-lg">
              pending_actions
            </span>
          </div>
          <p className="text-2xl font-black text-purple-700 mt-2">{stats?.new ?? 0}</p>
          <span className="text-xs text-gray-500 font-medium">New unquoted requests</span>
        </div>
      </div>

      {/* Brand Breakdown Pills */}
      {stats?.brands && (
        <div className="bg-white border border-outline-variant rounded-xl p-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold text-gray-600 uppercase tracking-wider pr-2">Brand Distribution:</span>
          <span className="bg-gray-100 text-gray-800 font-semibold px-2.5 py-1 rounded-md border border-gray-200">
            Atlas Copco: <strong className="text-primary">{stats.brands.atlas_copco}</strong>
          </span>
          <span className="bg-gray-100 text-gray-800 font-semibold px-2.5 py-1 rounded-md border border-gray-200">
            Sullair: <strong className="text-primary">{stats.brands.sullair}</strong>
          </span>
          <span className="bg-gray-100 text-gray-800 font-semibold px-2.5 py-1 rounded-md border border-gray-200">
            Ingersoll Rand: <strong className="text-primary">{stats.brands.ingersoll_rand}</strong>
          </span>
          <span className="bg-gray-100 text-gray-800 font-semibold px-2.5 py-1 rounded-md border border-gray-200">
            Denair: <strong className="text-primary">{stats.brands.denair}</strong>
          </span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white border border-outline-variant rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
              search
            </span>
            <input
              type="text"
              placeholder="Search by company name, email, or telephone..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 border border-outline-variant rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="border border-outline-variant rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:border-primary outline-none"
          >
            <option value="all">All Compressor Types</option>
            <option value="ELECTRIC AIR COMPRESSOR">Electric Air Compressor</option>
            <option value="DIESEL AIR COMPRESSOR">Diesel Air Compressor</option>
          </select>

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
            <p className="text-sm text-gray-500 font-medium">Loading quotation requests...</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center text-red-600">
            <p className="font-semibold">{error}</p>
            <button
              onClick={loadRequests}
              className="mt-3 px-4 py-1.5 bg-red-100 text-red-700 rounded-md text-xs font-bold hover:bg-red-200"
            >
              Retry
            </button>
          </div>
        ) : requests.length === 0 ? (
          <div className="py-16 text-center">
            <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">
              inbox
            </span>
            <p className="text-sm font-semibold text-gray-600">No compressor requests found</p>
            <p className="text-xs text-gray-400 mt-1">Try resetting the search or filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-outline-variant">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Compressor Type</th>
                  <th className="py-3 px-4">Brand</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50/80 transition-colors">
                    {/* Date */}
                    <td className="py-3.5 px-4 text-xs text-gray-500 whitespace-nowrap">
                      {formatDate(req.created_at)}
                    </td>

                    {/* Company */}
                    <td className="py-3.5 px-4 font-bold text-gray-900 whitespace-nowrap">
                      {req.company_name}
                    </td>

                    {/* Contact */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="text-xs">
                        <a href={`mailto:${req.email}`} className="text-primary hover:underline font-medium block">
                          {req.email}
                        </a>
                        <a href={`tel:${req.phone}`} className="text-gray-500 hover:text-gray-800 block mt-0.5">
                          {req.phone}
                        </a>
                      </div>
                    </td>

                    {/* Compressor Type */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {req.compressor_type === 'ELECTRIC AIR COMPRESSOR' ? (
                        <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-md text-xs font-bold">
                          <span className="material-symbols-outlined text-xs">bolt</span>
                          <span>ELECTRIC</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-orange-50 text-orange-700 border border-orange-200 px-2.5 py-1 rounded-md text-xs font-bold">
                          <span className="material-symbols-outlined text-xs">local_fire_department</span>
                          <span>DIESEL</span>
                        </span>
                      )}
                    </td>

                    {/* Brand */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="bg-gray-100 text-gray-800 border border-gray-200 px-2 py-0.5 rounded text-xs font-bold">
                          {req.brand}
                        </span>
                        {req.condition && (
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                            req.condition === 'NEW'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {req.condition}
                          </span>
                        )}
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
                        title="View and process quotation"
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

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-outline-variant bg-gray-50 text-xs text-gray-500">
            <div>
              Showing page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalRecords} total requests)
            </div>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 bg-white border border-outline-variant rounded disabled:opacity-40 font-semibold"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 bg-white border border-outline-variant rounded disabled:opacity-40 font-semibold"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* DETAIL / PROCESS MODAL */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-outline-variant animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">
                  description
                </span>
                <h3 className="font-bold text-lg text-gray-900">
                  Quotation Request Details
                </h3>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="py-4 space-y-4 text-sm">
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-500 block">Quotation Reference:</span>
                  <strong className="text-gray-900 text-sm">MT-Q-{selectedRequest.id.slice(0, 8).toUpperCase()}</strong>
                </div>
                <div>
                  <span className="text-gray-500 block">Submitted:</span>
                  <span className="text-gray-800 font-semibold">{formatDate(selectedRequest.created_at)}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Compressor Type:</span>
                  <strong className="text-primary">{selectedRequest.compressor_type}</strong>
                </div>
                <div>
                  <span className="text-gray-500 block">Selected Brand:</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <strong className="text-gray-900">{selectedRequest.brand}</strong>
                    {selectedRequest.condition && (
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                        selectedRequest.condition === 'NEW'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {selectedRequest.condition}
                      </span>
                    )}
                  </div>
                </div>
              </div>

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
                  <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">Customer Project Notes</h4>
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:border-primary outline-none"
                >
                  <option value="new">New (Needs Review)</option>
                  <option value="contacted">Contacted (Customer Call / Preliminary Spec)</option>
                  <option value="quoted">Quoted (Official Proforma Sent)</option>
                  <option value="closed">Closed (Order Finalized / Closed)</option>
                </select>
              </div>

              {/* Internal Notes */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Internal Engineering / Commercial Notes</label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="e.g. Sent 250 kW GA VSD proposal on 27/10. Awaiting plant procurement board signoff."
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-xs text-gray-800 focus:border-primary outline-none"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <a
                href={`mailto:${selectedRequest.email}?subject=Mandtech Formal Quotation - ${selectedRequest.brand} ${selectedRequest.compressor_type}&body=Dear ${selectedRequest.company_name} Procurement Team,%0D%0A%0D%0AReferring to your inquiry regarding ${selectedRequest.brand} ${selectedRequest.compressor_type}, please find our formal technical quotation attached.`}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">outgoing_mail</span>
                <span>Email Customer</span>
              </a>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveModal}
                  disabled={statusUpdating}
                  className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-lg shadow-sm disabled:opacity-50"
                >
                  {statusUpdating ? 'Saving...' : 'Save Updates'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-2xl border border-gray-200 text-center">
            <span className="material-symbols-outlined text-red-500 text-4xl mb-2">
              warning
            </span>
            <h3 className="font-bold text-gray-900 text-base">Delete Quotation Request?</h3>
            <p className="text-xs text-gray-500 mt-1 mb-4">
              Are you sure you want to permanently remove this compressor quotation record from the system?
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg"
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
