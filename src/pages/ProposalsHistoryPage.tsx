import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  fetchInvoices,
  updateInvoiceStatus,
  sendInvoiceEmail,
  Invoice,
} from '../services/invoicingService';
import type { TabType } from '../components/Layout';

interface ProposalsHistoryPageProps {
  searchQuery?: string;
  onNavigate?: (tab: TabType) => void;
  onEditInBuilder?: (invoice: Invoice) => void;
}

export default function ProposalsHistoryPage({
  searchQuery: externalSearch = '',
  onNavigate,
  onEditInBuilder,
}: ProposalsHistoryPageProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState(externalSearch);

  // Modal / Drawer state for viewing & updating status
  const [selectedProposal, setSelectedProposal] = useState<Invoice | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  // Send Dialog state inside Modal or direct
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendMethod, setSendMethod] = useState<'email' | 'whatsapp' | 'both'>('both');
  const [sendSuccessMsg, setSendSuccessMsg] = useState<string | null>(null);

  const loadProposals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchInvoices({
        status: statusFilter === 'all' ? undefined : statusFilter,
        limit: 100,
      });
      if (res && res.data) {
        setInvoices(res.data);
      }
    } catch (err: any) {
      console.error('Failed to load proposals:', err);
      setError(err.message || 'Unable to retrieve sent proposals.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadProposals();
  }, [loadProposals]);

  useEffect(() => {
    if (externalSearch !== undefined) {
      setSearchTerm(externalSearch);
    }
  }, [externalSearch]);

  // Currency Formatter
  const fmt = (val: number | undefined | null) => {
    if (val === undefined || val === null || isNaN(val)) return '0.00';
    return new Intl.NumberFormat('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  // KPIs
  const metrics = useMemo(() => {
    const total = invoices.length;
    const sent = invoices.filter((i) => i.status === 'sent').length;
    const draft = invoices.filter((i) => i.status === 'draft').length;
    const paid = invoices.filter((i) => i.status === 'paid').length;
    const totalValue = invoices
      .filter((i) => i.status !== 'cancelled')
      .reduce((sum, i) => sum + (Number(i.total) || 0), 0);

    return { total, sent, draft, paid, totalValue };
  }, [invoices]);

  // Filtered List
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        inv.invoice_number?.toLowerCase().includes(q) ||
        inv.company?.toLowerCase().includes(q) ||
        inv.contact_name?.toLowerCase().includes(q) ||
        inv.email?.toLowerCase().includes(q) ||
        inv.billing_address?.toLowerCase().includes(q);

      const matchStatus = statusFilter === 'all' || inv.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [invoices, searchTerm, statusFilter]);

  // Status Updater
  const handleUpdateStatus = async (invoiceId: string, newStatus: string) => {
    setUpdatingStatus(true);
    setStatusFeedback(null);
    try {
      const res = await updateInvoiceStatus(invoiceId, newStatus);
      setInvoices((prev) =>
        prev.map((item) => (item.id === invoiceId ? { ...item, status: res.data.status } : item))
      );
      if (selectedProposal && selectedProposal.id === invoiceId) {
        setSelectedProposal({ ...selectedProposal, status: res.data.status as any });
      }
      setStatusFeedback(`Status updated to "${newStatus.toUpperCase()}"!`);
      setTimeout(() => setStatusFeedback(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to update proposal status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // WhatsApp Message Generator
  const formatWhatsAppText = (inv: Invoice) => {
    const lines = inv.line_items || [];
    const itemsText = lines
      .map(
        (li, idx) =>
          `${idx + 1}. *${li.description || li.product_name}* (Qty: ${li.qty}) — ₦${fmt(li.total || li.qty * li.unit_price)}`
      )
      .join('\n');

    return `*MANDTECH SERVICES LIMITED - OFFICIAL COMMERCIAL PROPOSAL*
━━━━━━━━━━━━━━━━━━━━━━━━
📄 *Proposal Ref:* ${inv.invoice_number}
📅 *Date:* ${new Date(inv.created_at).toLocaleDateString()}
🏢 *Client:* ${inv.company}
👤 *Attention:* ${inv.contact_name}
📍 *Site / Delivery:* ${inv.billing_address || 'As specified'}

*SCOPE & LINE ITEMS:*
${itemsText || 'As per attached technical specifications'}

━━━━━━━━━━━━━━━━━━━━━━━━
💰 *Subtotal:* ₦${fmt(inv.subtotal)}
🏛️ *VAT (7.5%):* ₦${fmt(inv.vat_amount)}
💵 *TOTAL AMOUNT:* ₦${fmt(inv.total)}
🗣️ *In Words:* ${inv.amount_in_words || 'Nigerian Naira'}
━━━━━━━━━━━━━━━━━━━━━━━━

*TERMS & CONDITIONS SUMMARY:*
${inv.terms ? inv.terms.split('\n').slice(0, 3).join('\n') : '• 100% Down Payment & Issue of LPO.\n• Delivery within stipulated mobilization timeline.'}

*BANK DETAILS:*
Mandtech Services Limited
Sterling Bank Plc — 01433839162

For technical clarifications or mobilization dispatch:
📞 Commercial Desk: 08186538644 | 08064204187
✉️ info@mandtech.com.ng | mandtechserviceslimited@gmail.com`;
  };

  // Dispatch via Email or WhatsApp or Both
  const handleDispatchProposal = async (inv: Invoice) => {
    // 1. Mark as sent in the database
    if (inv.status !== 'sent') {
      try {
        await updateInvoiceStatus(inv.id, 'sent');
        setInvoices((prev) =>
          prev.map((item) => (item.id === inv.id ? { ...item, status: 'sent' } : item))
        );
        if (selectedProposal && selectedProposal.id === inv.id) {
          setSelectedProposal({ ...selectedProposal, status: 'sent' });
        }
      } catch (e) {
        console.warn('Status update warning:', e);
      }
    }

    const cleanPhone = (inv.contact_phone || '').replace(/[^0-9]/g, '');
    const intlPhone = cleanPhone.startsWith('0')
      ? '234' + cleanPhone.slice(1)
      : cleanPhone.startsWith('234')
      ? cleanPhone
      : cleanPhone;

    const API_BASE = 'https://mandtech-backend-1chv.vercel.app';
    const pdfUrl = `${API_BASE}/api/admin/invoices/${inv.id}/pdf`;
    const whatsappText = formatWhatsAppText(inv);
    const whatsappTextWithPdf = `${whatsappText}\n\n📄 *Download Official PDF Quotation:*\n${pdfUrl}`;

    // 2. Trigger WhatsApp if selected
    if (sendMethod === 'whatsapp' || sendMethod === 'both') {
      const waUrl = `https://wa.me/${intlPhone}?text=${encodeURIComponent(whatsappTextWithPdf)}`;
      window.open(waUrl, '_blank');
    }

    // 3. Background email dispatch via backend (PDF attached automatically)
    if (sendMethod === 'email' || sendMethod === 'both') {
      try {
        await sendInvoiceEmail(inv.id);
        setSendSuccessMsg(
          `✅ Email dispatched to ${inv.email} with PDF attached! (Ref: ${inv.invoice_number})`
        );
      } catch (emailErr: any) {
        setSendSuccessMsg(
          `Document marked SENT. Email dispatch failed: ${emailErr.message || 'Unknown'}. Check backend logs.`
        );
      }
    } else {
      setSendSuccessMsg(
        `Quotation ${inv.invoice_number} dispatched via ${sendMethod.toUpperCase()} and marked as SENT!`
      );
    }

    setShowSendModal(false);
    setTimeout(() => setSendSuccessMsg(null), 5000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
            SENT
          </span>
        );
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
            PAID / WON
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
            DRAFT
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
            CANCELLED
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-800 border border-gray-300 uppercase">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="bg-surface-white border border-outline-variant rounded-xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-primary text-2xl">
                send_and_archive
              </span>
              <h1 className="text-2xl font-black text-deep-charcoal tracking-tight">
                Sent Proposals &amp; Quotation History
              </h1>
            </div>
            <p className="text-secondary text-xs sm:text-sm">
              Review, track, and dispatch formal commercial quotations to clients via Email, WhatsApp, or both. Click any proposal to view details and update current status.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
            {onNavigate && (
              <button
                onClick={() => onNavigate('customer-dms')}
                className="px-4 py-2.5 bg-white border border-outline-variant hover:bg-surface-container font-button text-xs font-bold text-deep-charcoal rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                <span className="material-symbols-outlined text-base text-primary">folder_shared</span>
                <span>Customer Folders</span>
              </button>
            )}
            <button
              onClick={() => onNavigate && onNavigate('invoicing')}
              className="px-4 py-2.5 bg-primary text-white hover:bg-black font-button text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm w-full lg:w-auto"
            >
              <span className="material-symbols-outlined text-base">add_circle</span>
              <span>Create New Quotation</span>
            </button>
            <button
              onClick={loadProposals}
              title="Refresh proposals list"
              className="p-2.5 bg-white border border-outline-variant hover:bg-surface-container rounded-lg transition-colors text-deep-charcoal"
            >
              <span className={`material-symbols-outlined text-base ${loading ? 'animate-spin' : ''}`}>
                refresh
              </span>
            </button>
          </div>
        </div>

        {/* Global Success / Feedback Banner */}
        {sendSuccessMsg && (
          <div className="mt-4 p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-lg flex items-center justify-between text-xs font-semibold">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600">check_circle</span>
              <span>{sendSuccessMsg}</span>
            </div>
            <button onClick={() => setSendSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-900">
              ✕
            </button>
          </div>
        )}
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-surface-white border border-outline-variant rounded-xl p-4 shadow-sm">
          <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block">
            Total Proposals
          </span>
          <div className="flex items-baseline justify-between mt-1.5">
            <span className="text-2xl font-black text-deep-charcoal">{metrics.total}</span>
            <span className="material-symbols-outlined text-gray-400 text-xl">folder_shared</span>
          </div>
        </div>

        <div className="bg-surface-white border border-emerald-200 rounded-xl p-4 shadow-sm bg-gradient-to-br from-white to-emerald-50/40">
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
            Sent to Clients
          </span>
          <div className="flex items-baseline justify-between mt-1.5">
            <span className="text-2xl font-black text-emerald-800">{metrics.sent}</span>
            <span className="material-symbols-outlined text-emerald-600 text-xl">mark_email_read</span>
          </div>
        </div>

        <div className="bg-surface-white border border-outline-variant rounded-xl p-4 shadow-sm">
          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
            Drafts in Progress
          </span>
          <div className="flex items-baseline justify-between mt-1.5">
            <span className="text-2xl font-black text-slate-700">{metrics.draft}</span>
            <span className="material-symbols-outlined text-slate-400 text-xl">edit_note</span>
          </div>
        </div>

        <div className="bg-surface-white border border-blue-200 rounded-xl p-4 shadow-sm bg-gradient-to-br from-white to-blue-50/40">
          <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">
            Paid / Closed Won
          </span>
          <div className="flex items-baseline justify-between mt-1.5">
            <span className="text-2xl font-black text-blue-800">{metrics.paid}</span>
            <span className="material-symbols-outlined text-blue-600 text-xl">verified</span>
          </div>
        </div>

        <div className="col-span-2 lg:col-span-1 bg-surface-white border border-primary/30 rounded-xl p-4 shadow-sm bg-gradient-to-br from-white to-primary/5">
          <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
            Total Pipeline Value
          </span>
          <div className="flex items-baseline justify-between mt-1.5">
            <span className="text-lg font-black text-deep-charcoal truncate" title={`₦${fmt(metrics.totalValue)}`}>
              ₦{fmt(metrics.totalValue)}
            </span>
            <span className="material-symbols-outlined text-primary text-xl">payments</span>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-surface-white border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        {/* Table Filters & Search */}
        <div className="p-4 sm:p-5 border-b border-outline-variant flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 bg-surface-container-low/40">
          {/* Status Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: 'all', label: 'All Documents' },
              { id: 'sent', label: 'Sent' },
              { id: 'draft', label: 'Drafts' },
              { id: 'paid', label: 'Paid / Won' },
              { id: 'cancelled', label: 'Cancelled' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  statusFilter === tab.id
                    ? 'bg-deep-charcoal text-white shadow-sm'
                    : 'bg-white border border-outline-variant text-secondary hover:text-deep-charcoal hover:bg-surface-container'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
              search
            </span>
            <input
              type="text"
              placeholder="Search by doc no, company, contact, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-white border border-outline-variant rounded-lg text-xs font-medium text-deep-charcoal outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Proposals Table */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-secondary">
            <span className="material-symbols-outlined text-4xl animate-spin text-primary">
              progress_activity
            </span>
            <span className="text-xs font-semibold">Loading proposals history...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600 text-xs">
            <span className="material-symbols-outlined text-3xl mb-1">error</span>
            <p className="font-bold">{error}</p>
            <button
              onClick={loadProposals}
              className="mt-3 px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 rounded text-xs font-semibold hover:bg-rose-100"
            >
              Try Again
            </button>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="py-16 text-center text-secondary">
            <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">
              drafts
            </span>
            <p className="font-bold text-deep-charcoal text-sm">No proposals found</p>
            <p className="text-xs mt-1">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search or status filter.'
                : 'No proposals have been generated yet. Create your first quotation using the builder.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-low/70 text-[10.5px] font-bold text-secondary uppercase tracking-wider">
                  <th className="py-3 px-4">Doc No.</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Client / Company</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4 text-right">Total Amount</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/60">
                {filteredInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    onClick={() => setSelectedProposal(inv)}
                    className="hover:bg-primary/5 transition-colors cursor-pointer group"
                  >
                    {/* Doc No & Type */}
                    <td className="py-3.5 px-4 font-mono font-bold text-primary group-hover:underline">
                      <div className="flex flex-col">
                        <span>{inv.invoice_number}</span>
                        <span className="text-[10px] font-sans font-bold text-secondary uppercase">
                          {inv.doc_type || 'Quotation'}
                        </span>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-secondary whitespace-nowrap">
                      {new Date(inv.created_at).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    {/* Company */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-deep-charcoal max-w-xs truncate" title={inv.company}>
                        {inv.company}
                      </div>
                      <div className="text-[11px] text-secondary truncate max-w-xs">
                        {inv.billing_address || 'Site delivery base'}
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-deep-charcoal">{inv.contact_name}</div>
                      <div className="text-[11px] text-secondary flex items-center gap-1.5">
                        <span>{inv.contact_phone || '—'}</span>
                        {inv.email && <span className="text-gray-400">• {inv.email}</span>}
                      </div>
                    </td>

                    {/* Total Amount */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-deep-charcoal">
                      ₦{fmt(inv.total)}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {getStatusBadge(inv.status)}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Send / Resend Trigger */}
                        <button
                          onClick={() => {
                            setSelectedProposal(inv);
                            setShowSendModal(true);
                          }}
                          title="Send proposal via Email or WhatsApp"
                          className="p-1.5 text-primary hover:bg-primary/10 rounded-md transition-colors"
                        >
                          <span className="material-symbols-outlined text-lg">forward_to_inbox</span>
                        </button>

                        {/* View / Inspect Status */}
                        <button
                          onClick={() => setSelectedProposal(inv)}
                          title="View proposal details and update status"
                          className="px-2 py-1 bg-surface-container hover:bg-surface-container-high text-deep-charcoal rounded text-[11px] font-bold transition-colors flex items-center gap-1"
                        >
                          <span>Inspect</span>
                          <span className="material-symbols-outlined text-sm">visibility</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= PROPOSAL DETAIL & STATUS INSPECTION MODAL ================= */}
      {selectedProposal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in"
          onClick={() => setSelectedProposal(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-outline-variant overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Top Header */}
            <div className="p-5 border-b border-outline-variant bg-surface-container-low flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-2xl">receipt_long</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-deep-charcoal">
                      {selectedProposal.invoice_number}
                    </h3>
                    <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-primary text-white">
                      {selectedProposal.doc_type || 'Quotation'}
                    </span>
                  </div>
                  <p className="text-secondary text-xs">
                    Issued on {new Date(selectedProposal.created_at).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedProposal(null)}
                  className="w-8 h-8 rounded-full hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-black transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Status Bar & Quick Status Changer */}
            <div className="px-5 py-3.5 bg-gradient-to-r from-primary/10 via-surface-container-low to-white border-b border-outline-variant flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-deep-charcoal">Current Status:</span>
                {getStatusBadge(selectedProposal.status)}
                {statusFeedback && (
                  <span className="text-[11px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded animate-pulse">
                    {statusFeedback}
                  </span>
                )}
              </div>

              {/* Status Update Action Controls */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs text-secondary font-medium hidden sm:inline">
                  Change Status:
                </span>
                <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-outline-variant shadow-xs">
                  {(['draft', 'sent', 'paid', 'cancelled'] as const).map((st) => (
                    <button
                      key={st}
                      disabled={updatingStatus || selectedProposal.status === st}
                      onClick={() => handleUpdateStatus(selectedProposal.id, st)}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold uppercase transition-all ${
                        selectedProposal.status === st
                          ? 'bg-primary text-white shadow-xs'
                          : 'text-secondary hover:text-deep-charcoal hover:bg-surface-container'
                      } disabled:opacity-60`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Body - Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Recipient / Client Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-surface-container-low/60 p-4 rounded-xl border border-outline-variant/60">
                <div>
                  <span className="text-[10px] font-bold text-secondary uppercase tracking-wider block mb-1">
                    Customer &amp; Company
                  </span>
                  <h4 className="text-sm font-black text-deep-charcoal">{selectedProposal.company}</h4>
                  <p className="text-deep-charcoal font-medium mt-0.5">
                    Attn: {selectedProposal.contact_name}
                  </p>
                  <p className="text-secondary mt-1">{selectedProposal.billing_address}</p>
                </div>

                <div className="space-y-1 md:text-right">
                  <span className="text-[10px] font-bold text-secondary uppercase tracking-wider block mb-1">
                    Contact Channels
                  </span>
                  <div className="flex md:justify-end items-center gap-1.5 text-deep-charcoal font-semibold">
                    <span className="material-symbols-outlined text-sm text-primary">call</span>
                    <span>{selectedProposal.contact_phone || 'No phone recorded'}</span>
                  </div>
                  <div className="flex md:justify-end items-center gap-1.5 text-deep-charcoal font-semibold">
                    <span className="material-symbols-outlined text-sm text-primary">mail</span>
                    <span>{selectedProposal.email}</span>
                  </div>
                  {selectedProposal.client_ref && (
                    <p className="text-secondary text-[11px] mt-1">
                      Client Ref: <strong>{selectedProposal.client_ref}</strong>
                    </p>
                  )}
                </div>
              </div>

              {/* Line Items Table */}
              <div>
                <h4 className="text-xs font-black text-deep-charcoal uppercase tracking-wider mb-2">
                  Quotation Line Items &amp; Scope
                </h4>
                <div className="border border-outline-variant rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-container-low text-[10px] font-bold text-secondary uppercase">
                      <tr>
                        <th className="py-2.5 px-3">Item #</th>
                        <th className="py-2.5 px-3">Description</th>
                        <th className="py-2.5 px-3 text-center">Qty</th>
                        <th className="py-2.5 px-3 text-right">Unit Price</th>
                        <th className="py-2.5 px-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/60">
                      {(selectedProposal.line_items || []).map((item, idx) => (
                        <tr key={idx} className="hover:bg-surface-container-low/40">
                          <td className="py-2.5 px-3 font-mono text-secondary">
                            {item.part_number || idx + 1}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-deep-charcoal">
                            {item.description || item.product_name}
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold">{item.qty}</td>
                          <td className="py-2.5 px-3 text-right font-mono">₦{fmt(item.unit_price)}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-deep-charcoal">
                            ₦{fmt(item.total || item.qty * item.unit_price)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals Summary */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-surface-container-low p-4 rounded-xl border border-outline-variant">
                <div className="max-w-md mb-2 sm:mb-0">
                  <span className="text-[10px] font-bold text-secondary uppercase block">
                    Amount in Words
                  </span>
                  <span className="text-xs font-bold text-deep-charcoal uppercase">
                    {selectedProposal.amount_in_words || 'Nigerian Naira'}
                  </span>
                </div>

                <div className="w-full sm:w-60 space-y-1 text-right">
                  <div className="flex justify-between text-secondary text-xs">
                    <span>Subtotal:</span>
                    <span className="font-mono font-semibold">₦{fmt(selectedProposal.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-secondary text-xs">
                    <span>VAT (7.5%):</span>
                    <span className="font-mono font-semibold">₦{fmt(selectedProposal.vat_amount)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-deep-charcoal border-t border-outline-variant pt-1">
                    <span>Total Amount:</span>
                    <span className="font-mono text-primary">₦{fmt(selectedProposal.total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Bottom Actions Footer */}
            <div className="p-4 border-t border-outline-variant bg-surface-container-low flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {/* Send via Email/WhatsApp button */}
                <button
                  onClick={() => setShowSendModal(true)}
                  className="px-4 py-2 bg-primary text-white hover:bg-black font-button text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-sm flex-1 sm:flex-none"
                >
                  <span className="material-symbols-outlined text-base">send</span>
                  <span>Send via Email / WhatsApp</span>
                </button>

                {/* Edit in Builder */}
                {onEditInBuilder && (
                  <button
                    onClick={() => {
                      onEditInBuilder(selectedProposal);
                      setSelectedProposal(null);
                    }}
                    className="px-3.5 py-2 bg-white border border-outline-variant text-deep-charcoal hover:bg-surface-container rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-base">edit</span>
                    <span>Edit in Builder</span>
                  </button>
                )}
              </div>

              <button
                onClick={() => setSelectedProposal(null)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-deep-charcoal rounded-lg text-xs font-bold transition-colors w-full sm:w-auto"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= SEND PROPOSAL SELECTION DIALOG ================= */}
      {showSendModal && selectedProposal && (
        <div
          className="fixed inset-0 z-60 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowSendModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-outline-variant"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-outline-variant">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-2xl">
                  forward_to_inbox
                </span>
                <h3 className="text-base font-black text-deep-charcoal">
                  Send Quotation to Client
                </h3>
              </div>
              <button
                onClick={() => setShowSendModal(false)}
                className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-secondary mb-4 leading-relaxed">
              Select your preferred channel to dispatch <strong>{selectedProposal.invoice_number}</strong> to{' '}
              <strong>{selectedProposal.company}</strong>. The proposal status will automatically update to <strong>SENT</strong>.
            </p>

            {/* Recipient Contact Card */}
            <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant mb-4 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-secondary font-medium">Attention:</span>
                <span className="font-bold text-deep-charcoal">{selectedProposal.contact_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary font-medium">Email:</span>
                <span className="font-mono text-primary font-bold">{selectedProposal.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary font-medium">WhatsApp / Phone:</span>
                <span className="font-mono text-emerald-700 font-bold">
                  {selectedProposal.contact_phone || 'No phone set'}
                </span>
              </div>
              <div className="flex justify-between border-t border-outline-variant/60 pt-1 mt-1">
                <span className="text-secondary font-medium">Amount:</span>
                <span className="font-mono font-black text-deep-charcoal">
                  ₦{fmt(selectedProposal.total)}
                </span>
              </div>
            </div>

            {/* Channel Options Selection */}
            <div className="space-y-2 mb-6">
              <label className="text-xs font-bold text-deep-charcoal block mb-1">
                Select Dispatch Channel:
              </label>

              {/* Option 1: WhatsApp Only */}
              <div
                onClick={() => setSendMethod('whatsapp')}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                  sendMethod === 'whatsapp'
                    ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                    : 'border-outline-variant hover:bg-surface-container-low'
                }`}
              >
                <input
                  type="radio"
                  name="dispatch_method"
                  checked={sendMethod === 'whatsapp'}
                  onChange={() => setSendMethod('whatsapp')}
                  className="accent-emerald-600"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-900">
                    <span>💬 WhatsApp Dispatch</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    Opens direct chat with pre-formatted commercial breakdown.
                  </p>
                </div>
              </div>

              {/* Option 2: Email Only */}
              <div
                onClick={() => setSendMethod('email')}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                  sendMethod === 'email'
                    ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20'
                    : 'border-outline-variant hover:bg-surface-container-low'
                }`}
              >
                <input
                  type="radio"
                  name="dispatch_method"
                  checked={sendMethod === 'email'}
                  onChange={() => setSendMethod('email')}
                  className="accent-blue-600"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-blue-900">
                    <span>✉️ Email Dispatch</span>
                  </div>
                  <p className="text-[11px] text-blue-700 mt-0.5">
                    Prepares formal email with line items, banking details, and terms.
                  </p>
                </div>
              </div>

              {/* Option 3: Both (WhatsApp & Email) */}
              <div
                onClick={() => setSendMethod('both')}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                  sendMethod === 'both'
                    ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                    : 'border-outline-variant hover:bg-surface-container-low'
                }`}
              >
                <input
                  type="radio"
                  name="dispatch_method"
                  checked={sendMethod === 'both'}
                  onChange={() => setSendMethod('both')}
                  className="accent-primary"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-deep-charcoal">
                    <span>🚀 Both (Email &amp; WhatsApp)</span>
                    <span className="text-[9px] bg-primary text-white font-black px-1.5 py-0.2 rounded uppercase">
                      Recommended
                    </span>
                  </div>
                  <p className="text-[11px] text-secondary mt-0.5">
                    Sends on WhatsApp and prepares official corporate email simultaneously.
                  </p>
                </div>
              </div>
            </div>

            {/* Confirmation Buttons */}
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowSendModal(false)}
                className="px-4 py-2 border border-outline-variant hover:bg-surface-container text-deep-charcoal font-semibold text-xs rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDispatchProposal(selectedProposal)}
                className="px-5 py-2 bg-primary text-white hover:bg-black font-button font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
              >
                <span className="material-symbols-outlined text-base">send</span>
                <span>Send &amp; Mark as SENT</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

