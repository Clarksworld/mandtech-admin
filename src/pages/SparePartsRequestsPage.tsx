import { useState, useEffect, useCallback } from "react";
import {
  fetchSparePartsRequests,
  fetchSparePartsRequestStats,
  updateSparePartsRequestStatus,
  deleteSparePartsRequest,
} from "../services/sparePartsRequestsService";
import { SparePartsRequest, SparePartsRequestStats } from "../services/types";
import type { TabType } from "../components/Layout";

interface SparePartsRequestsPageProps {
  onNavigate?: (tab: TabType) => void;
}

export default function SparePartsRequestsPage({ onNavigate: _onNavigate }: SparePartsRequestsPageProps) {
  const [requests, setRequests] = useState<SparePartsRequest[]>([]);
  const [stats, setStats] = useState<SparePartsRequestStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Modal State
  const [selectedRequest, setSelectedRequest] = useState<SparePartsRequest | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [editNotes, setEditNotes] = useState("");
  const [modalStatus, setModalStatus] = useState<string>("new");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      const res = await fetchSparePartsRequestStats();
      setStats(res.data);
    } catch (err: any) {
      console.error("Failed to load spare parts stats:", err);
    }
  }, []);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchSparePartsRequests({
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
      console.error("Failed to load spare parts requests:", err);
      setError(err.message || "Unable to retrieve spare parts requests.");
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

  const handleOpenModal = (req: SparePartsRequest) => {
    setSelectedRequest(req);
    setModalStatus(req.status);
    setEditNotes(req.notes || "");
  };

  const handleSaveModal = async () => {
    if (!selectedRequest) return;
    setStatusUpdating(true);
    try {
      const res = await updateSparePartsRequestStatus(selectedRequest.id, modalStatus, editNotes);
      setSelectedRequest(res.data);
      setRequests((prev) =>
        prev.map((r) => (r.id === selectedRequest.id ? res.data : r))
      );
      loadStats();
      setSelectedRequest(null);
    } catch (err: any) {
      alert(err.message || "Failed to update spare parts request status");
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSparePartsRequest(id);
      setDeleteConfirmId(null);
      if (selectedRequest?.id === id) setSelectedRequest(null);
      loadRequests();
      loadStats();
    } catch (err: any) {
      alert(err.message || "Failed to delete request");
    }
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "contacted":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "quoted":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "closed":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              build
            </span>
            <h1 className="font-headline-md text-2xl font-black text-gray-900 tracking-tight">
              Spare Parts Requests
            </h1>
          </div>
          <p className="text-secondary text-sm mt-1">
            Review and process commercial quotation requests submitted for OEM spare parts and replacement components.
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
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Inquiries</span>
            <span className="material-symbols-outlined text-primary bg-primary/10 p-2 rounded-lg text-lg">
              receipt_long
            </span>
          </div>
          <p className="text-2xl font-black text-gray-900 mt-2">{stats?.total ?? 0}</p>
          <span className="text-xs text-gray-500 font-medium">All parts requests</span>
        </div>

        {/* New / Action Needed */}
        <div className="bg-white border border-outline-variant rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">New Requests</span>
            <span className="material-symbols-outlined text-amber-600 bg-amber-50 p-2 rounded-lg text-lg">
              pending_actions
            </span>
          </div>
          <p className="text-2xl font-black text-amber-700 mt-2">{stats?.new ?? 0}</p>
          <span className="text-xs text-gray-500 font-medium">Awaiting response</span>
        </div>

        {/* Contacted */}
        <div className="bg-white border border-outline-variant rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Contacted</span>
            <span className="material-symbols-outlined text-blue-600 bg-blue-50 p-2 rounded-lg text-lg">
              support_agent
            </span>
          </div>
          <p className="text-2xl font-black text-blue-700 mt-2">{stats?.contacted ?? 0}</p>
          <span className="text-xs text-gray-500 font-medium">In conversation</span>
        </div>

        {/* Quoted / Closed */}
        <div className="bg-white border border-outline-variant rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Quoted & Closed</span>
            <span className="material-symbols-outlined text-emerald-600 bg-emerald-50 p-2 rounded-lg text-lg">
              check_circle
            </span>
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-2">{(stats?.quoted ?? 0) + (stats?.closed ?? 0)}</p>
          <span className="text-xs text-gray-500 font-medium">Quotes generated</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-outline-variant rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Brand Filter */}
          <div className="flex items-center gap-1.5 bg-gray-50 border border-outline-variant rounded-lg px-2.5 py-1.5 text-sm">
            <span className="text-xs font-bold text-gray-400 uppercase">Brand:</span>
            <select
              value={brandFilter}
              onChange={(e) => {
                setBrandFilter(e.target.value);
                setPage(1);
              }}
              className="bg-transparent text-gray-800 font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">All Brands</option>
              <option value="ATLAS COPCO">Atlas Copco</option>
              <option value="SULLAIR">Sullair</option>
              <option value="INGERSOLL RAND">Ingersoll Rand</option>
              <option value="DENAIR">Denair</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-gray-50 border border-outline-variant rounded-lg px-2.5 py-1.5 text-sm">
            <span className="text-xs font-bold text-gray-400 uppercase">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-transparent text-gray-800 font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="quoted">Quoted</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
            search
          </span>
          <input
            type="text"
            placeholder="Search by company, email, part name…"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-1.5 bg-gray-50 border border-outline-variant rounded-lg text-sm text-gray-800 focus:outline-none focus:border-primary focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">
            <span className="material-symbols-outlined animate-spin text-3xl text-primary mb-2">
              sync
            </span>
            <p className="text-sm font-medium">Loading spare parts requests...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-500">
            <span className="material-symbols-outlined text-3xl mb-2">error</span>
            <p className="text-sm font-semibold">{error}</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="p-16 text-center text-gray-400">
            <span className="material-symbols-outlined text-4xl mb-2 text-gray-300">
              inbox
            </span>
            <p className="text-base font-semibold text-gray-700">No spare parts requests found</p>
            <p className="text-xs text-gray-400 mt-1">Try adjusting your filters or search keywords.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-outline-variant text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Ref & Date</th>
                  <th className="py-3.5 px-4">Company & Contact</th>
                  <th className="py-3.5 px-4">Brand</th>
                  <th className="py-3.5 px-4">Part Component</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/60 text-sm">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50/70 transition-colors">
                    {/* Ref & Date */}
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-xs font-bold text-gray-900 block">
                        #{req.id.slice(0, 8).toUpperCase()}
                      </span>
                      <span className="text-[11px] text-gray-400 block mt-0.5">
                        {formatDate(req.created_at)}
                      </span>
                    </td>

                    {/* Company & Contact */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-gray-900">{req.company_name}</div>
                      <div className="flex flex-col text-xs text-gray-500 mt-0.5 gap-0.5">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px] text-gray-400">mail</span>
                          {req.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px] text-gray-400">call</span>
                          {req.phone}
                        </span>
                      </div>
                    </td>

                    {/* Brand */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                        {req.brand}
                      </span>
                    </td>

                    {/* Part Component */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-gray-800 text-xs">
                        {req.part_name}
                      </div>
                      {req.notes && (
                        <div className="text-[11px] text-gray-400 truncate max-w-xs mt-0.5">
                          {req.notes}
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider ${getStatusBadge(
                          req.status
                        )}`}
                      >
                        {req.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => handleOpenModal(req)}
                          className="px-2.5 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs rounded-lg transition-colors flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">visibility</span>
                          <span>Details</span>
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(req.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Request"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="p-4 border-t border-outline-variant flex items-center justify-between text-xs text-gray-500">
            <span>
              Showing {requests.length} of {totalRecords} records
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 bg-white border border-outline-variant rounded-md disabled:opacity-40 font-semibold"
              >
                Previous
              </button>
              <span className="font-bold text-gray-700">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 bg-white border border-outline-variant rounded-md disabled:opacity-40 font-semibold"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Details & Status Update Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-outline-variant space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
              <div>
                <h3 className="font-headline-sm text-lg font-black text-gray-900">
                  Spare Part Request Details
                </h3>
                <span className="text-xs text-gray-400 font-mono">
                  Ref #{selectedRequest.id}
                </span>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="bg-gray-50 p-3.5 rounded-xl space-y-2 border border-outline-variant/60">
                <div className="flex justify-between">
                  <span className="text-xs text-gray-400 uppercase font-bold">Brand:</span>
                  <span className="font-bold text-gray-900">{selectedRequest.brand}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-400 uppercase font-bold">Part Component:</span>
                  <span className="font-bold text-primary">{selectedRequest.part_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-400 uppercase font-bold">Company:</span>
                  <span className="font-semibold text-gray-900">{selectedRequest.company_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-400 uppercase font-bold">Email:</span>
                  <a href={`mailto:${selectedRequest.email}`} className="font-semibold text-primary hover:underline">
                    {selectedRequest.email}
                  </a>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-400 uppercase font-bold">Phone:</span>
                  <a href={`tel:${selectedRequest.phone}`} className="font-semibold text-gray-800">
                    {selectedRequest.phone}
                  </a>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-400 uppercase font-bold">Date Received:</span>
                  <span className="text-gray-600">{formatDate(selectedRequest.created_at)}</span>
                </div>
              </div>

              {selectedRequest.notes && (
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Client Specifications / Equipment Serial
                  </label>
                  <div className="bg-amber-50/60 border border-amber-200/60 p-3 rounded-lg text-xs text-amber-900 leading-relaxed font-mono">
                    {selectedRequest.notes}
                  </div>
                </div>
              )}

              {/* Status Selector */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Update Quotation Status
                </label>
                <select
                  value={modalStatus}
                  onChange={(e) => setModalStatus(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-outline-variant rounded-lg text-sm font-semibold focus:outline-none focus:border-primary"
                >
                  <option value="new">New — Uncontacted</option>
                  <option value="contacted">Contacted — Clarifying Specs</option>
                  <option value="quoted">Quoted — Formal Price Dispatched</option>
                  <option value="closed">Closed — Completed / Contracted</option>
                </select>
              </div>

              {/* Internal Notes */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Internal Engineering Notes
                </label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Record quote number, OEM supplier lead time, or client site details..."
                  className="w-full p-2.5 bg-gray-50 border border-outline-variant rounded-lg text-xs text-gray-800 focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant">
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 border border-outline-variant rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={statusUpdating}
                onClick={handleSaveModal}
                className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-bold shadow-sm disabled:opacity-50 flex items-center gap-1.5"
              >
                {statusUpdating && (
                  <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                )}
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-outline-variant space-y-4">
            <div className="text-center">
              <span className="material-symbols-outlined text-4xl text-red-500 mb-2">
                warning
              </span>
              <h3 className="font-headline-sm text-lg font-black text-gray-900">
                Delete Request?
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Are you sure you want to remove this spare parts request? This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 border border-outline-variant rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold shadow-sm"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
