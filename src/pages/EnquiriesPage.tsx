import { useState, useEffect, useCallback } from 'react';
import { fetchInquiries, fetchInquiryStats, updateInquiryStatus, assignInquiry, deleteInquiry } from '../services/enquiriesService';
import { Inquiry, InquiryStats } from '../services/types';
import { getStoredUser } from '../services/authService';

const EQUIPMENT_CLASSES = [
  { value: 'all', label: 'All Classes' },
  { value: 'New Equipment Purchase', label: 'New Equipment Purchase' },
  { value: 'Equipment Rental', label: 'Equipment Rental' },
  { value: 'Spare Parts', label: 'Spare Parts' },
  { value: 'Service Request', label: 'Service Request' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'new', label: 'New' },
  { value: 'in_review', label: 'In Review' },
  { value: 'responded', label: 'Responded' },
  { value: 'closed', label: 'Closed' },
];

const STATUS_STYLES: Record<string, string> = {
  new: 'bg-primary/15 text-primary-dark border border-primary/30',
  in_review: 'bg-amber-50 text-amber-700 border border-amber-200',
  responded: 'bg-green-50 text-green-700 border border-green-200',
  closed: 'bg-surface-container text-secondary border border-outline-variant',
};

const STATUS_LABELS: Record<string, string> = {
  new: 'New',
  in_review: 'In Review',
  responded: 'Responded',
  closed: 'Closed',
};

const CLASS_ICONS: Record<string, string> = {
  'New Equipment Purchase': 'construction',
  'Equipment Rental': 'local_shipping',
  'Spare Parts': 'hardware',
  'Service Request': 'build_circle',
};

function classIcon(interests: string[]): string {
  for (const cls of Object.keys(CLASS_ICONS)) {
    if (interests.some(i => i.includes(cls))) return CLASS_ICONS[cls];
  }
  return 'contact_support';
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function timeAgo(dateStr?: string): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

interface EnquiriesPageProps {
  searchQuery?: string;
  onNavigate?: (tab: 'dashboard' | 'enquiries' | 'leads' | 'inventory' | 'invoicing' | 'projects') => void;
}

export default function EnquiriesPage({ searchQuery: externalSearch, onNavigate: _onNavigate }: EnquiriesPageProps) {
  const [enquiries, setEnquiries] = useState<Inquiry[]>([]);
  const [stats, setStats] = useState<InquiryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const [statusFilter, setStatusFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [localSearch, setLocalSearch] = useState('');

  const [selectedEnquiry, setSelectedEnquiry] = useState<Inquiry | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const currentUser = getStoredUser();
  const LIMIT = 12;

  const loadStats = useCallback(async () => {
    try {
      const res = await fetchInquiryStats();
      if (res?.data) setStats(res.data);
    } catch {
      // non-blocking
    }
  }, []);

  const loadEnquiries = useCallback(async () => {
    setLoading(true);
    try {
      const search = externalSearch || localSearch;
      const res = await fetchInquiries({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        equipment_class: classFilter !== 'all' ? classFilter : undefined,
        search: search || undefined,
        page,
        limit: LIMIT,
      });
      setEnquiries(res.data || []);
      setTotal(res.total || 0);
      setPages(res.pages || 1);
    } catch {
      setEnquiries([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, classFilter, localSearch, externalSearch, page]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, classFilter, localSearch, externalSearch]);

  useEffect(() => {
    loadEnquiries();
  }, [loadEnquiries]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    setActionError(null);
    try {
      const res = await updateInquiryStatus(id, newStatus);
      setEnquiries(prev => prev.map(e => e.id === id ? { ...e, ...res.data } : e));
      if (selectedEnquiry?.id === id) setSelectedEnquiry(prev => prev ? { ...prev, ...res.data } : null);
      setActionSuccess('Status updated successfully');
      setTimeout(() => setActionSuccess(null), 3000);
      loadStats();
    } catch (err: any) {
      setActionError(err.message || 'Failed to update status');
    }
  };

  const handleClaimEnquiry = async (enquiry: Inquiry) => {
    if (!enquiry.id) return;
    setDetailLoading(true);
    setActionError(null);
    const adminName = currentUser?.email?.split('@')[0] || 'Admin';
    try {
      const res = await assignInquiry(enquiry.id, currentUser?.id || null, currentUser?.email || adminName);
      setEnquiries(prev => prev.map(e => e.id === enquiry.id ? { ...e, ...res.data } : e));
      if (selectedEnquiry?.id === enquiry.id) setSelectedEnquiry(prev => prev ? { ...prev, ...res.data } : null);
      setActionSuccess('Enquiry claimed and assigned to you');
      setTimeout(() => setActionSuccess(null), 3000);
      loadStats();
    } catch (err: any) {
      setActionError(err.message || 'Failed to assign enquiry');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this enquiry permanently?')) return;
    try {
      await deleteInquiry(id);
      setEnquiries(prev => prev.filter(e => e.id !== id));
      if (selectedEnquiry?.id === id) setSelectedEnquiry(null);
      setTotal(t => t - 1);
      setActionSuccess('Enquiry deleted');
      setTimeout(() => setActionSuccess(null), 3000);
      loadStats();
    } catch (err: any) {
      setActionError(err.message || 'Failed to delete');
    }
  };

  const statCards = [
    { label: 'Total', value: stats?.total ?? '—', icon: 'inbox', color: 'text-on-surface' },
    { label: 'New', value: stats?.new ?? '—', icon: 'mark_email_unread', color: 'text-primary' },
    { label: 'In Review', value: stats?.in_review ?? '—', icon: 'pending', color: 'text-amber-600' },
    { label: 'Responded', value: stats?.responded ?? '—', icon: 'mark_email_read', color: 'text-green-600' },
  ];

  const byClass = stats?.by_class;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-headline-md text-headline-md">Customer Enquiries</h2>
          <p className="text-secondary text-body-sm mt-0.5">
            Manage incoming RFQ, rental, spare parts and service enquiries from the storefront.
          </p>
        </div>
        <button
          onClick={() => { loadEnquiries(); loadStats(); }}
          className="flex items-center gap-2 px-4 py-2 border border-outline-variant rounded-lg text-sm text-secondary hover:bg-surface-container transition-colors"
        >
          <span className="material-symbols-outlined text-base">refresh</span>
          Refresh
        </button>
      </div>

      {/* Alert banners */}
      {actionSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg px-4 py-3 flex items-center gap-3 text-sm font-medium">
          <span className="material-symbols-outlined text-green-600 text-base">check_circle</span>
          {actionSuccess}
        </div>
      )}
      {actionError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 flex items-center gap-3 text-sm font-medium">
          <span className="material-symbols-outlined text-red-500 text-base">error</span>
          {actionError}
          <button onClick={() => setActionError(null)} className="ml-auto font-bold">✕</button>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map(card => (
          <div key={card.label} className="bg-surface-white border border-outline-variant rounded-lg p-4 flex items-center gap-3">
            <div className="p-2 bg-surface-container rounded-lg shrink-0">
              <span className={`material-symbols-outlined ${card.color}`}>{card.icon}</span>
            </div>
            <div>
              <p className="text-secondary text-xs font-label-bold uppercase tracking-wider">{card.label}</p>
              <p className="font-headline-sm text-headline-sm">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Equipment Class Breakdown */}
      {byClass && (
        <div className="bg-surface-white border border-outline-variant rounded-lg p-4">
          <p className="text-xs font-label-bold text-secondary uppercase tracking-wider mb-3">Breakdown by Equipment Class</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { key: 'new_purchase', label: 'New Equipment Purchase', icon: 'construction', count: byClass.new_purchase },
              { key: 'rental', label: 'Equipment Rental', icon: 'local_shipping', count: byClass.rental },
              { key: 'spare_parts', label: 'Spare Parts', icon: 'hardware', count: byClass.spare_parts },
              { key: 'service_request', label: 'Service Request', icon: 'build_circle', count: byClass.service_request },
            ].map(cls => (
              <button
                key={cls.key}
                onClick={() => setClassFilter(cls.label)}
                className={`flex items-center gap-2 p-3 rounded-lg border transition-all text-left ${classFilter === cls.label ? 'border-primary/40 bg-primary/10 text-primary' : 'border-outline-variant hover:border-primary/30 hover:bg-surface-container'}`}
              >
                <span className="material-symbols-outlined text-sm">{cls.icon}</span>
                <div>
                  <p className="text-xs font-bold">{cls.count}</p>
                  <p className="text-[11px] text-secondary leading-tight">{cls.label}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-surface-white border border-outline-variant rounded-lg p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-base">search</span>
          <input
            type="text"
            placeholder="Search by name, company, email…"
            value={localSearch}
            onChange={e => setLocalSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface-container border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
          />
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-surface-container border border-outline-variant rounded-lg text-sm text-on-surface outline-none focus:border-primary transition-colors"
        >
          {STATUS_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <select
          value={classFilter}
          onChange={e => setClassFilter(e.target.value)}
          className="px-3 py-2 bg-surface-container border border-outline-variant rounded-lg text-sm text-on-surface outline-none focus:border-primary transition-colors"
        >
          {EQUIPMENT_CLASSES.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {(statusFilter !== 'all' || classFilter !== 'all' || localSearch) && (
          <button
            onClick={() => { setStatusFilter('all'); setClassFilter('all'); setLocalSearch(''); }}
            className="text-sm text-primary hover:underline font-medium flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">close</span>
            Clear filters
          </button>
        )}

        <span className="ml-auto text-xs text-secondary font-medium">
          {loading ? 'Loading…' : `${total} result${total !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* Enquiries Table */}
      <div className="bg-surface-white border border-outline rounded overflow-hidden shadow-sm">
        <div className="p-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
          <span className="font-label-bold text-label-bold text-on-surface-variant text-xs flex items-center gap-2">
            ENQUIRY REPOSITORY
            <span className="bg-primary/15 text-primary-dark px-2 py-0.5 rounded text-[10px] font-bold border border-primary/25">
              {loading ? '…' : `Showing ${enquiries.length} of ${total}`}
            </span>
          </span>
          <span className="text-secondary text-xs">Click row to inspect or manage</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-secondary">
            <span className="material-symbols-outlined text-4xl mb-3 block animate-spin">progress_activity</span>
            Loading enquiries…
          </div>
        ) : enquiries.length === 0 ? (
          <div className="p-12 text-center text-secondary">
            <span className="material-symbols-outlined text-4xl mb-3 block text-outline-variant">contact_support</span>
            <p className="font-medium">No enquiries found</p>
            <p className="text-sm mt-1">Try adjusting your filters or check back later.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant text-[11px] font-label-bold text-secondary uppercase tracking-wider bg-surface-white">
                  <th className="p-4">Ref</th>
                  <th className="p-4">Company / Contact</th>
                  <th className="p-4">Equipment Class</th>
                  <th className="p-4">Assigned To</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant font-body-md text-sm">
                {enquiries.map((enq) => {
                  const interests: string[] = Array.isArray(enq.equipment_interests) ? enq.equipment_interests : [];
                  const mainClass = interests.find(i => Object.keys(CLASS_ICONS).includes(i)) || interests[0] || '—';
                  const refCode = enq.id ? '#RFQ-' + enq.id.slice(0, 6).toUpperCase() : '—';
                  return (
                    <tr
                      key={enq.id}
                      onClick={() => setSelectedEnquiry(enq)}
                      className="hover:bg-surface-container-low transition-colors duration-150 cursor-pointer group"
                    >
                      <td className="p-4 font-mono font-bold text-primary text-xs">{refCode}</td>
                      <td className="p-4">
                        <p className="font-bold text-on-surface">{enq.company}</p>
                        <p className="text-secondary text-xs mt-0.5">{enq.name} · {enq.email}</p>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm text-primary">{classIcon(interests)}</span>
                          <span className="text-xs text-on-surface font-medium">{mainClass}</span>
                        </div>
                        {interests.length > 1 && (
                          <span className="text-[10px] text-secondary mt-0.5">+{interests.length - 1} more</span>
                        )}
                      </td>
                      <td className="p-4">
                        {enq.assigned_name ? (
                          <div className="flex items-center gap-1.5">
                            <span className="w-6 h-6 rounded-full bg-primary-fixed text-primary flex items-center justify-center font-bold text-[10px]">
                              {enq.assigned_name.split('@')[0].slice(0, 2).toUpperCase()}
                            </span>
                            <span className="text-xs text-on-surface">{enq.assigned_name.split('@')[0]}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-error italic font-medium">Unassigned</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${STATUS_STYLES[enq.status || 'new'] || STATUS_STYLES['new']}`}>
                          {STATUS_LABELS[enq.status || 'new'] || enq.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <p className="text-xs text-on-surface">{formatDate(enq.created_at)}</p>
                        <p className="text-[10px] text-secondary">{timeAgo(enq.created_at)}</p>
                      </td>
                      <td className="p-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          {!enq.assigned_name && (
                            <button
                              onClick={() => handleClaimEnquiry(enq)}
                              className="bg-primary text-white hover:bg-black px-3 py-1 rounded text-xs font-bold transition-colors"
                            >
                              Claim
                            </button>
                          )}
                          <select
                            value={enq.status || 'new'}
                            onChange={e => enq.id && handleStatusChange(enq.id, e.target.value)}
                            onClick={e => e.stopPropagation()}
                            className="text-xs bg-surface-container border border-outline-variant rounded px-2 py-1 font-medium"
                          >
                            <option value="new">New</option>
                            <option value="in_review">In Review</option>
                            <option value="responded">Responded</option>
                            <option value="closed">Closed</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="p-4 border-t border-outline-variant flex items-center justify-between">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 border border-outline-variant rounded text-sm disabled:opacity-40 hover:bg-surface-container transition-colors"
            >
              ← Previous
            </button>
            <span className="text-sm text-secondary">Page {page} of {pages}</span>
            <button
              disabled={page >= pages}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 border border-outline-variant rounded text-sm disabled:opacity-40 hover:bg-surface-container transition-colors"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Enquiry Detail Modal */}
      {selectedEnquiry && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-white border border-outline rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden">
            {/* Modal header */}
            <div className="flex items-start justify-between p-6 border-b border-outline-variant bg-surface-container-low">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                    {selectedEnquiry.id ? '#RFQ-' + selectedEnquiry.id.slice(0, 6).toUpperCase() : '—'}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${STATUS_STYLES[selectedEnquiry.status || 'new']}`}>
                    {STATUS_LABELS[selectedEnquiry.status || 'new']}
                  </span>
                </div>
                <h3 className="font-headline-sm text-headline-sm">{selectedEnquiry.company}</h3>
                <p className="text-secondary text-sm mt-0.5">{selectedEnquiry.name} · {selectedEnquiry.email}</p>
              </div>
              <button
                onClick={() => setSelectedEnquiry(null)}
                className="text-secondary hover:text-on-surface text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Modal body */}
            <div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto">
              {/* Equipment Class */}
              {Array.isArray(selectedEnquiry.equipment_interests) && selectedEnquiry.equipment_interests.length > 0 && (
                <div>
                  <p className="text-secondary text-xs uppercase font-bold mb-2">Equipment Class of Interest</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedEnquiry.equipment_interests.map((interest, idx) => (
                      <span
                        key={idx}
                        className="flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/25 px-2.5 py-1 rounded-full text-xs font-bold"
                      >
                        <span className="material-symbols-outlined text-xs">{classIcon([interest])}</span>
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Message */}
              {selectedEnquiry.message && (
                <div className="bg-surface-container-low p-4 rounded-lg border border-outline-variant">
                  <p className="text-secondary text-xs uppercase font-bold mb-2">Enquiry / Specification Details</p>
                  <p className="text-body-sm text-on-surface leading-relaxed">{selectedEnquiry.message}</p>
                </div>
              )}

              {/* Contact info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-secondary text-xs uppercase font-bold mb-1">Phone</p>
                  <p className="text-sm font-medium">{selectedEnquiry.phone || '—'}</p>
                </div>
                <div>
                  <p className="text-secondary text-xs uppercase font-bold mb-1">Date Submitted</p>
                  <p className="text-sm font-medium">{formatDate(selectedEnquiry.created_at)} at {formatTime(selectedEnquiry.created_at)}</p>
                </div>
                <div>
                  <p className="text-secondary text-xs uppercase font-bold mb-1">Assigned To</p>
                  <p className={`text-sm font-medium ${!selectedEnquiry.assigned_name ? 'text-error italic' : ''}`}>
                    {selectedEnquiry.assigned_name || 'Unassigned'}
                  </p>
                </div>
                <div>
                  <p className="text-secondary text-xs uppercase font-bold mb-1">Newsletter Opt-in</p>
                  <p className="text-sm font-medium">{selectedEnquiry.newsletter_opt_in ? '✓ Yes' : '✗ No'}</p>
                </div>
              </div>

              {/* Status Update */}
              <div>
                <p className="text-secondary text-xs uppercase font-bold mb-2">Update Status</p>
                <div className="flex gap-2 flex-wrap">
                  {['new', 'in_review', 'responded', 'closed'].map(status => (
                    <button
                      key={status}
                      onClick={() => selectedEnquiry.id && handleStatusChange(selectedEnquiry.id, status)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        selectedEnquiry.status === status
                          ? STATUS_STYLES[status] + ' ring-2 ring-offset-1 ring-primary/40'
                          : 'border-outline-variant hover:bg-surface-container'
                      }`}
                    >
                      {STATUS_LABELS[status]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="p-5 border-t border-outline-variant flex items-center justify-between gap-3 bg-surface-container-low">
              <button
                onClick={() => selectedEnquiry.id && handleDelete(selectedEnquiry.id)}
                className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-bold hover:bg-red-50 transition-colors"
              >
                Delete Enquiry
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedEnquiry(null)}
                  className="px-4 py-2 border border-outline rounded-lg text-sm text-secondary hover:bg-surface-container"
                >
                  Close
                </button>
                {!selectedEnquiry.assigned_name && (
                  <button
                    disabled={detailLoading}
                    onClick={() => handleClaimEnquiry(selectedEnquiry)}
                    className="px-4 py-2 bg-primary text-white hover:bg-black rounded-lg text-sm font-bold transition-colors disabled:opacity-60"
                  >
                    {detailLoading ? 'Claiming…' : 'Claim & Assign to Me'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
