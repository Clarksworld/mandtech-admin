import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  fetchInvoices,
  updateInvoiceStatus,
  createInvoice,
  Invoice,
} from '../services/invoicingService';
import type { TabType } from '../components/Layout';
import type { InitialQuotationData } from '../services/types';

interface CustomerDMSPageProps {
  onNavigate?: (tab: TabType) => void;
  onPrepareQuotation?: (data: InitialQuotationData) => void;
}

export type DocumentCategory = 'all' | 'pfi' | 'invoice' | 'waybill' | 'inspection';

export interface CustomerFolder {
  id: string;
  companyName: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  deliveryAddress: string;
  documents: Invoice[];
  totalValue: number;
  lastUpdated: string;
}

export default function CustomerDMSPage({
  onNavigate,
  onPrepareQuotation,
}: CustomerDMSPageProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Navigation
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerFolder | null>(null);
  const [activeCategoryTab, setActiveCategoryTab] = useState<DocumentCategory>('all');

  // Modal / Drawer state for inspecting document
  const [inspectDoc, setInspectDoc] = useState<Invoice | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Waybill Generator Modal state
  const [showWaybillModal, setShowWaybillModal] = useState(false);
  const [waybillTruckNo, setWaybillTruckNo] = useState('');
  const [waybillDriverName, setWaybillDriverName] = useState('');
  const [waybillDriverPhone, setWaybillDriverPhone] = useState('');
  const [waybillHub, setWaybillHub] = useState('Port Harcourt Yard (Elelenwo Ops)');
  const [waybillDestination, setWaybillDestination] = useState('');
  const [waybillItemsDesc, setWaybillItemsDesc] = useState('');
  const [creatingWaybill, setCreatingWaybill] = useState(false);

  // Inspection Report Modal state
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [inspectEquipmentModel, setInspectEquipmentModel] = useState('');
  const [inspectSerialId, setInspectSerialId] = useState('');
  const [inspectPressureCfm, setInspectPressureCfm] = useState('10 Bar @ 375 CFM - PASSED');
  const [inspectOilQuality, setInspectOilQuality] = useState('OEM Synthetic - 100% Viscosity Standard');
  const [inspectEngineerName, setInspectEngineerName] = useState('Engr. C. Obi (QC Desk)');
  const [inspectNotes, setInspectNotes] = useState('Load bank run-in completed at 100% duty cycle. Certified ready for site mobilization.');
  const [creatingInspection, setCreatingInspection] = useState(false);

  // Load all invoices and auto-categorize by customer folder
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchInvoices({ limit: 200 });
      if (res && res.data) {
        setInvoices(res.data);
      }
    } catch (err: any) {
      console.error('Failed to load invoices for DMS:', err);
      setError(err.message || 'Unable to load customer document archives.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Currency Formatter
  const fmt = (val: number | undefined | null) => {
    if (val === undefined || val === null || isNaN(val)) return '0.00';
    return new Intl.NumberFormat('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  // Helper to categorize document
  const getDocTypeCategory = (doc: Invoice): 'pfi' | 'invoice' | 'waybill' | 'inspection' => {
    const notesLower = (doc.notes || '').toLowerCase();
    const numLower = (doc.invoice_number || '').toLowerCase();
    if (notesLower.includes('[waybill]') || numLower.startsWith('wb-')) return 'waybill';
    if (notesLower.includes('[inspection]') || numLower.startsWith('ir-')) return 'inspection';
    if (doc.doc_type === 'quotation' || numLower.startsWith('qt-') || numLower.startsWith('mi0') || numLower.startsWith('elc0')) return 'pfi';
    return 'invoice';
  };

  // Group invoices into Customer Folders
  const customerFolders = useMemo(() => {
    const map = new Map<string, CustomerFolder>();

    invoices.forEach((inv) => {
      const normalizedKey = (inv.company || 'UNASSIGNED CLIENT').trim().toUpperCase();
      if (!map.has(normalizedKey)) {
        map.set(normalizedKey, {
          id: normalizedKey,
          companyName: inv.company || 'Unassigned Client',
          contactName: inv.contact_name || 'Procurement Coordinator',
          contactPhone: inv.contact_phone || '',
          contactEmail: inv.email || '',
          deliveryAddress: inv.billing_address || '',
          documents: [],
          totalValue: 0,
          lastUpdated: inv.created_at,
        });
      }

      const folder = map.get(normalizedKey)!;
      folder.documents.push(inv);
      if (inv.status !== 'cancelled') {
        folder.totalValue += Number(inv.total) || 0;
      }
      if (new Date(inv.created_at) > new Date(folder.lastUpdated)) {
        folder.lastUpdated = inv.created_at;
      }
    });

    return Array.from(map.values()).sort((a, b) => b.documents.length - a.documents.length);
  }, [invoices]);

  // Keep selectedCustomer updated if invoices refresh
  useEffect(() => {
    if (selectedCustomer) {
      const refreshed = customerFolders.find((f) => f.id === selectedCustomer.id);
      if (refreshed) {
        setSelectedCustomer(refreshed);
      }
    }
  }, [customerFolders]);

  // Search filter for folders
  const filteredFolders = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return customerFolders;
    return customerFolders.filter(
      (f) =>
        f.companyName.toLowerCase().includes(q) ||
        f.contactName.toLowerCase().includes(q) ||
        f.contactEmail.toLowerCase().includes(q) ||
        f.deliveryAddress.toLowerCase().includes(q) ||
        f.documents.some((d) => d.invoice_number?.toLowerCase().includes(q))
    );
  }, [customerFolders, searchQuery]);

  // Documents inside current selected folder filtered by sub-category
  const currentFolderDocuments = useMemo(() => {
    if (!selectedCustomer) return [];
    return selectedCustomer.documents.filter((doc) => {
      if (activeCategoryTab === 'all') return true;
      return getDocTypeCategory(doc) === activeCategoryTab;
    });
  }, [selectedCustomer, activeCategoryTab]);

  // The "Pick & Edit / Bargain" Workflow
  // Loads this quote directly into the Quotation Builder with customer info and lines pre-populated
  const handlePickAndEditQuote = (doc: Invoice) => {
    if (!onPrepareQuotation) return;

    onPrepareQuotation({
      companyName: doc.company,
      contactPerson: doc.contact_name,
      contactNumber: doc.contact_phone,
      companyEmail: doc.email,
      companyAddress: doc.billing_address,
      yourRef: `${doc.invoice_number}-REV`,
      sourceType: doc.doc_type === 'quotation' ? 'leasing' : 'spare_parts',
      products: (doc.line_items || []).map((li) => ({
        partNumber: li.part_number,
        productName: li.description || li.product_name || '',
        qty: li.qty,
        unitPrice: li.unit_price,
      })),
      notes: `Revision of ${doc.invoice_number}. Negotiated discount or scope update.`,
    });
  };

  // Status Updater
  const handleUpdateStatus = async (invoiceId: string, newStatus: string) => {
    setStatusUpdating(true);
    setFeedbackMsg(null);
    try {
      const res = await updateInvoiceStatus(invoiceId, newStatus);
      setInvoices((prev) =>
        prev.map((item) => (item.id === invoiceId ? { ...item, status: res.data.status } : item))
      );
      if (inspectDoc && inspectDoc.id === invoiceId) {
        setInspectDoc({ ...inspectDoc, status: res.data.status as any });
      }
      setFeedbackMsg(`Status updated to "${newStatus.toUpperCase()}"!`);
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to update document status');
    } finally {
      setStatusUpdating(false);
    }
  };

  // WhatsApp Dispatch Helper
  const handleWhatsAppDispatch = (doc: Invoice) => {
    const cleanPhone = (doc.contact_phone || '').replace(/[^0-9]/g, '');
    const intlPhone = cleanPhone.startsWith('0')
      ? '234' + cleanPhone.slice(1)
      : cleanPhone.startsWith('234')
      ? cleanPhone
      : cleanPhone;

    const lines = (doc.line_items || [])
      .map((li, idx) => `${idx + 1}. *${li.description || li.product_name}* (Qty: ${li.qty}) — ₦${fmt(li.total || li.qty * li.unit_price)}`)
      .join('\n');

    const cat = getDocTypeCategory(doc);
    const docTitle = cat === 'waybill' ? 'EQUIPMENT WAYBILL & MOBILIZATION NOTE' : cat === 'inspection' ? 'INSPECTION & QC TEST REPORT' : 'COMMERCIAL QUOTATION / PFI';

    const msg = `*MANDTECH SERVICES LIMITED - ${docTitle}*
━━━━━━━━━━━━━━━━━━━━━━━━
📄 *Doc Ref:* ${doc.invoice_number}
🏢 *Client:* ${doc.company}
👤 *Attention:* ${doc.contact_name}
📍 *Site / Delivery:* ${doc.billing_address || 'As specified'}

*DETAILS / LINE ITEMS:*
${lines || 'Attached as per client requisition'}

━━━━━━━━━━━━━━━━━━━━━━━━
💰 *Total Value:* ₦${fmt(doc.total)}
━━━━━━━━━━━━━━━━━━━━━━━━
*Mandtech Commercial Desk:* 08186538644 | info@mandtech.com.ng`;

    window.open(`https://wa.me/${intlPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Email Dispatch Helper
  const handleEmailDispatch = (doc: Invoice) => {
    const subject = encodeURIComponent(`Mandtech Services Limited - Document ${doc.invoice_number} for ${doc.company}`);
    const body = encodeURIComponent(
      `Dear ${doc.contact_name},\n\nPlease find attached the document ${doc.invoice_number} for ${doc.company}.\n\nTotal: NGN ${fmt(
        doc.total
      )}\n\nWarm regards,\nMandtech Commercial Sales Desk\n54 Old Refinery Road, Elelenwo, Port-Harcourt`
    );
    window.location.href = `mailto:${doc.email}?subject=${subject}&body=${body}`;
  };

  // Create Waybill inside current Customer Folder
  const handleCreateWaybill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    setCreatingWaybill(true);
    try {
      const year = new Date().getFullYear();
      const rand = Math.floor(1000 + Math.random() * 9000);
      const waybillNo = `WB-${year}-${rand}`;

      const res = await createInvoice({
        doc_type: 'invoice',
        invoice_number: waybillNo,
        company: selectedCustomer.companyName,
        contact_name: selectedCustomer.contactName,
        contact_phone: selectedCustomer.contactPhone,
        email: selectedCustomer.contactEmail,
        billing_address: waybillDestination || selectedCustomer.deliveryAddress,
        delivery_terms: `Dispatched from ${waybillHub} via Truck: ${waybillTruckNo}`,
        notes: `[WAYBILL] Driver: ${waybillDriverName} (${waybillDriverPhone}) | Hub: ${waybillHub} | Destination: ${waybillDestination || selectedCustomer.deliveryAddress}`,
        status: 'sent',
        line_items: [
          {
            sn: 1,
            product_name: 'Waybill Goods Mobilization',
            description: waybillItemsDesc || 'Heavy machinery / spare parts consigned for site delivery.',
            qty: 1,
            unit_price: 0,
            total: 0,
          },
        ],
      });

      setInvoices((prev) => [res.data, ...prev]);
      setShowWaybillModal(false);
      setWaybillTruckNo('');
      setWaybillDriverName('');
      setWaybillDriverPhone('');
      setWaybillItemsDesc('');
      setFeedbackMsg(`Waybill ${waybillNo} successfully created and filed in ${selectedCustomer.companyName}'s folder!`);
      setTimeout(() => setFeedbackMsg(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Failed to create waybill');
    } finally {
      setCreatingWaybill(false);
    }
  };

  // Create Inspection Report inside current Customer Folder
  const handleCreateInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    setCreatingInspection(true);
    try {
      const year = new Date().getFullYear();
      const rand = Math.floor(1000 + Math.random() * 9000);
      const inspectNo = `IR-${year}-${rand}`;

      const res = await createInvoice({
        doc_type: 'quotation',
        invoice_number: inspectNo,
        company: selectedCustomer.companyName,
        contact_name: selectedCustomer.contactName,
        contact_phone: selectedCustomer.contactPhone,
        email: selectedCustomer.contactEmail,
        billing_address: selectedCustomer.deliveryAddress,
        delivery_terms: `Certified by ${inspectEngineerName}`,
        notes: `[INSPECTION] Model: ${inspectEquipmentModel} | Serial: ${inspectSerialId} | Pressure/CFM: ${inspectPressureCfm} | Oil Standard: ${inspectOilQuality} | QC Notes: ${inspectNotes}`,
        status: 'paid',
        line_items: [
          {
            sn: 1,
            product_name: `QC Certificate: ${inspectEquipmentModel || 'Industrial Compressor'}`,
            description: `Serial ID: ${inspectSerialId || 'N/A'}. Operating: ${inspectPressureCfm}. QC Inspector: ${inspectEngineerName}.`,
            qty: 1,
            unit_price: 0,
            total: 0,
          },
        ],
      });

      setInvoices((prev) => [res.data, ...prev]);
      setShowInspectionModal(false);
      setInspectEquipmentModel('');
      setInspectSerialId('');
      setFeedbackMsg(`Inspection Certificate ${inspectNo} filed in ${selectedCustomer.companyName}'s folder!`);
      setTimeout(() => setFeedbackMsg(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Failed to create inspection report');
    } finally {
      setCreatingInspection(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-surface-white border border-outline-variant rounded-xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-primary text-2xl">
                folder_shared
              </span>
              <h1 className="text-2xl font-black text-deep-charcoal tracking-tight">
                Customer Document Management (DMS)
              </h1>
            </div>
            <p className="text-secondary text-xs sm:text-sm">
              All commercial documents (PFIs, Invoices, Waybills, Inspection Certificates) automatically organized into dedicated Customer Folders. Easily pick, discount, edit, and re-dispatch quotes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate && onNavigate('invoicing')}
              className="px-4 py-2.5 bg-primary text-white hover:bg-black font-button text-xs font-bold rounded-lg transition-all flex items-center gap-2 shadow-sm"
            >
              <span className="material-symbols-outlined text-base">add_circle</span>
              <span>New Quotation</span>
            </button>
            <button
              onClick={loadData}
              title="Refresh DMS"
              className="p-2.5 bg-white border border-outline-variant hover:bg-surface-container rounded-lg transition-colors text-deep-charcoal"
            >
              <span className={`material-symbols-outlined text-base ${loading ? 'animate-spin' : ''}`}>
                refresh
              </span>
            </button>
          </div>
        </div>

        {/* Global Feedback Banner */}
        {feedbackMsg && (
          <div className="mt-4 p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-lg flex items-center justify-between text-xs font-semibold animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600">check_circle</span>
              <span>{feedbackMsg}</span>
            </div>
            <button onClick={() => setFeedbackMsg(null)} className="text-emerald-700 hover:text-emerald-900">
              ✕
            </button>
          </div>
        )}
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-surface-white border border-outline-variant rounded-xl p-4 shadow-sm">
          <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block">
            Customer Folders
          </span>
          <div className="flex items-baseline justify-between mt-1.5">
            <span className="text-2xl font-black text-deep-charcoal">{customerFolders.length}</span>
            <span className="material-symbols-outlined text-primary text-xl">folder</span>
          </div>
        </div>

        <div className="bg-surface-white border border-outline-variant rounded-xl p-4 shadow-sm">
          <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block">
            Archived Documents
          </span>
          <div className="flex items-baseline justify-between mt-1.5">
            <span className="text-2xl font-black text-deep-charcoal">{invoices.length}</span>
            <span className="material-symbols-outlined text-gray-400 text-xl">description</span>
          </div>
        </div>

        <div className="bg-surface-white border border-emerald-200 rounded-xl p-4 shadow-sm bg-gradient-to-br from-white to-emerald-50/40">
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
            PFIs &amp; Invoices
          </span>
          <div className="flex items-baseline justify-between mt-1.5">
            <span className="text-2xl font-black text-emerald-800">
              {invoices.filter((i) => !i.notes?.includes('[WAYBILL]') && !i.notes?.includes('[INSPECTION]')).length}
            </span>
            <span className="material-symbols-outlined text-emerald-600 text-xl">receipt_long</span>
          </div>
        </div>

        <div className="bg-surface-white border border-primary/30 rounded-xl p-4 shadow-sm bg-gradient-to-br from-white to-primary/5">
          <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
            Total Customer Portfolio
          </span>
          <div className="flex items-baseline justify-between mt-1.5">
            <span className="text-lg font-black text-deep-charcoal truncate">
              ₦{fmt(invoices.reduce((sum, i) => sum + (Number(i.total) || 0), 0))}
            </span>
            <span className="material-symbols-outlined text-primary text-xl">payments</span>
          </div>
        </div>
      </div>

      {/* ================= VIEW 1: CUSTOMER FOLDERS DIRECTORY (ROOT) ================= */}
      {!selectedCustomer && (
        <div className="space-y-4">
          {/* Search Box */}
          <div className="bg-surface-white border border-outline-variant rounded-xl p-4 shadow-sm flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                search
              </span>
              <input
                type="text"
                placeholder="Search customer folders by company, contact person, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-xs font-medium text-deep-charcoal outline-none focus:border-primary focus:bg-white transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="text-xs text-secondary font-medium">
              Showing <strong>{filteredFolders.length}</strong> of {customerFolders.length} customer folders
            </div>
          </div>

          {/* Customer Folders Grid */}
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-secondary">
              <span className="material-symbols-outlined text-4xl animate-spin text-primary">
                progress_activity
              </span>
              <span className="text-xs font-semibold">Organizing customer dossiers...</span>
            </div>
          ) : error ? (
            <div className="bg-white border border-rose-200 rounded-xl p-12 text-center text-rose-700">
              <span className="material-symbols-outlined text-4xl text-rose-500 mb-2">error</span>
              <p className="font-bold text-sm">{error}</p>
              <button
                onClick={loadData}
                className="mt-3 px-3 py-1.5 bg-rose-50 border border-rose-300 rounded font-bold text-xs hover:bg-rose-100"
              >
                Retry
              </button>
            </div>
          ) : filteredFolders.length === 0 ? (
            <div className="bg-white border border-outline-variant rounded-xl p-16 text-center text-secondary">
              <span className="material-symbols-outlined text-5xl text-gray-300 mb-2">folder_off</span>
              <p className="font-bold text-deep-charcoal text-sm">No Customer Folders Found</p>
              <p className="text-xs mt-1">
                {searchQuery
                  ? 'No matching customer folders found for this search.'
                  : 'Generate your first quotation or invoice to auto-create customer folders.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFolders.map((folder) => {
                const pfiCount = folder.documents.filter((d) => getDocTypeCategory(d) === 'pfi').length;
                const invCount = folder.documents.filter((d) => getDocTypeCategory(d) === 'invoice').length;
                const waybillCount = folder.documents.filter((d) => getDocTypeCategory(d) === 'waybill').length;
                const inspectCount = folder.documents.filter((d) => getDocTypeCategory(d) === 'inspection').length;

                return (
                  <div
                    key={folder.id}
                    onClick={() => {
                      setSelectedCustomer(folder);
                      setActiveCategoryTab('all');
                    }}
                    className="bg-white border border-outline-variant hover:border-primary hover:shadow-md rounded-xl p-5 transition-all cursor-pointer flex flex-col justify-between group"
                  >
                    <div>
                      {/* Folder Top Row */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                          <span className="material-symbols-outlined text-2xl">folder</span>
                        </div>
                        <span className="px-2.5 py-1 bg-surface-container text-deep-charcoal rounded-full text-[11px] font-black">
                          {folder.documents.length} File{folder.documents.length === 1 ? '' : 's'}
                        </span>
                      </div>

                      {/* Company Name */}
                      <h3 className="font-black text-sm text-deep-charcoal group-hover:text-primary transition-colors line-clamp-1 mb-1" title={folder.companyName}>
                        {folder.companyName}
                      </h3>

                      {/* Contact & Location */}
                      <p className="text-xs text-secondary line-clamp-1 mb-0.5">
                        Attn: <strong className="text-deep-charcoal">{folder.contactName}</strong>
                      </p>
                      <p className="text-[11px] text-gray-500 line-clamp-1">
                        📍 {folder.deliveryAddress || 'Site base registered'}
                      </p>

                      {/* Document Type Badges */}
                      <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-outline-variant/60">
                        {pfiCount > 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                            {pfiCount} PFI / Quote
                          </span>
                        )}
                        {invCount > 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {invCount} Invoice
                          </span>
                        )}
                        {waybillCount > 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200">
                            {waybillCount} Waybill
                          </span>
                        )}
                        {inspectCount > 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                            {inspectCount} Inspection
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Folder Footer */}
                    <div className="mt-4 pt-3 border-t border-outline-variant flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-secondary uppercase block font-semibold">Total Value</span>
                        <span className="font-mono font-bold text-deep-charcoal">₦{fmt(folder.totalValue)}</span>
                      </div>
                      <span className="text-primary font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        <span>Open Folder</span>
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= VIEW 2: INSIDE A SPECIFIC CUSTOMER FOLDER ================= */}
      {selectedCustomer && (
        <div className="space-y-5 animate-fade-in">
          {/* Breadcrumb & Customer Profile Card */}
          <div className="bg-surface-white border border-outline-variant rounded-xl p-6 shadow-sm">
            <button
              onClick={() => setSelectedCustomer(null)}
              className="text-xs font-bold text-secondary hover:text-deep-charcoal flex items-center gap-1 mb-4 group"
            >
              <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform">
                arrow_back
              </span>
              <span>Back to All Customer Folders</span>
            </button>

            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-2xl">
                  📁
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-deep-charcoal">
                      {selectedCustomer.companyName}
                    </h2>
                    <span className="px-2.5 py-0.5 bg-primary/15 text-primary border border-primary/30 rounded-full text-xs font-bold">
                      {selectedCustomer.documents.length} Document{selectedCustomer.documents.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  <p className="text-xs text-secondary mt-1">
                    Attention: <strong className="text-deep-charcoal">{selectedCustomer.contactName}</strong> • Phone: {selectedCustomer.contactPhone || '—'} • Email: {selectedCustomer.contactEmail || '—'}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    📍 Delivery Base: {selectedCustomer.deliveryAddress || 'Site Address Stored in Dossier'}
                  </p>
                </div>
              </div>

              {/* Action Buttons to Generate New Customer Documents */}
              <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                {/* 1. New Quote / PFI */}
                <button
                  onClick={() => {
                    if (onPrepareQuotation) {
                      onPrepareQuotation({
                        companyName: selectedCustomer.companyName,
                        contactPerson: selectedCustomer.contactName,
                        contactNumber: selectedCustomer.contactPhone,
                        companyEmail: selectedCustomer.contactEmail,
                        companyAddress: selectedCustomer.deliveryAddress,
                      });
                    }
                  }}
                  className="px-3.5 py-2 bg-primary text-white hover:bg-black font-button text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <span className="material-symbols-outlined text-base">add_circle</span>
                  <span>New PFI / Quote</span>
                </button>

                {/* 2. Issue Waybill */}
                <button
                  onClick={() => setShowWaybillModal(true)}
                  className="px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-button text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <span className="material-symbols-outlined text-base">local_shipping</span>
                  <span>Issue Waybill</span>
                </button>

                {/* 3. Issue Inspection */}
                <button
                  onClick={() => setShowInspectionModal(true)}
                  className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-button text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <span className="material-symbols-outlined text-base">verified</span>
                  <span>Inspection Report</span>
                </button>
              </div>
            </div>
          </div>

          {/* Sub-Category Filter Tabs inside Customer Folder */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {[
              { id: 'all', label: `All Files (${selectedCustomer.documents.length})`, icon: 'folder_open' },
              { id: 'pfi', label: `PFIs & Quotations (${selectedCustomer.documents.filter((d) => getDocTypeCategory(d) === 'pfi').length})`, icon: 'request_quote' },
              { id: 'invoice', label: `Tax Invoices (${selectedCustomer.documents.filter((d) => getDocTypeCategory(d) === 'invoice').length})`, icon: 'receipt_long' },
              { id: 'waybill', label: `Waybills (${selectedCustomer.documents.filter((d) => getDocTypeCategory(d) === 'waybill').length})`, icon: 'local_shipping' },
              { id: 'inspection', label: `Inspection Reports (${selectedCustomer.documents.filter((d) => getDocTypeCategory(d) === 'inspection').length})`, icon: 'verified' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveCategoryTab(tab.id as DocumentCategory)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeCategoryTab === tab.id
                    ? 'bg-deep-charcoal text-white shadow-sm'
                    : 'bg-white border border-outline-variant text-secondary hover:text-deep-charcoal hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-base">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Customer Documents List Table */}
          <div className="bg-white border border-outline-variant rounded-xl shadow-sm overflow-hidden">
            {currentFolderDocuments.length === 0 ? (
              <div className="py-16 text-center text-secondary">
                <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">drafts</span>
                <p className="font-bold text-deep-charcoal text-sm">No documents in this category</p>
                <p className="text-xs mt-1">Use the action buttons above to generate a new document for this client.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-outline-variant bg-surface-container-low text-[10.5px] font-bold text-secondary uppercase tracking-wider">
                      <th className="py-3 px-4">Doc No. &amp; Type</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Scope / Description</th>
                      <th className="py-3 px-4 text-center">Items</th>
                      <th className="py-3 px-4 text-right">Total Amount</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">DMS Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/60">
                    {currentFolderDocuments.map((doc) => {
                      const cat = getDocTypeCategory(doc);

                      return (
                        <tr
                          key={doc.id}
                          className="hover:bg-primary/5 transition-colors cursor-pointer"
                          onClick={() => setInspectDoc(doc)}
                        >
                          {/* Doc Number & Type Badge */}
                          <td className="py-3.5 px-4 font-mono font-bold text-primary">
                            <div>{doc.invoice_number}</div>
                            <span
                              className={`text-[9.5px] font-sans font-bold uppercase px-1.5 py-0.5 rounded inline-block mt-0.5 ${
                                cat === 'waybill'
                                  ? 'bg-orange-100 text-orange-800'
                                  : cat === 'inspection'
                                  ? 'bg-purple-100 text-purple-800'
                                  : cat === 'pfi'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {cat.toUpperCase()}
                            </span>
                          </td>

                          {/* Date */}
                          <td className="py-3.5 px-4 text-secondary whitespace-nowrap">
                            {new Date(doc.created_at).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>

                          {/* Scope / Description */}
                          <td className="py-3.5 px-4 max-w-xs">
                            <div className="font-semibold text-deep-charcoal truncate" title={doc.notes || 'General industrial supply'}>
                              {doc.notes?.replace(/\[.*?\]\s*/g, '') || doc.line_items?.[0]?.description || 'Equipment / Spare Parts Supply'}
                            </div>
                            <div className="text-[11px] text-gray-500 truncate">
                              Ref: {doc.client_ref || doc.invoice_number}
                            </div>
                          </td>

                          {/* Items Count */}
                          <td className="py-3.5 px-4 text-center font-bold text-secondary">
                            {doc.line_items?.length || 1}
                          </td>

                          {/* Amount */}
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-deep-charcoal">
                            ₦{fmt(doc.total)}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                doc.status === 'sent'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : doc.status === 'paid'
                                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                  : 'bg-gray-100 text-gray-700 border border-gray-300'
                              }`}
                            >
                              {doc.status}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              {/* 1. Pick & Edit / Bargain (The client's exact requirement) */}
                              <button
                                onClick={() => handlePickAndEditQuote(doc)}
                                title="Pick and edit this quotation (apply discount or add more items)"
                                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded font-bold text-[11px] flex items-center gap-1 shadow-2xs transition-colors"
                              >
                                <span className="material-symbols-outlined text-sm">tune</span>
                                <span>Pick &amp; Edit / Discount</span>
                              </button>

                              {/* 2. WhatsApp Direct */}
                              <button
                                onClick={() => handleWhatsAppDispatch(doc)}
                                title="Send directly via WhatsApp"
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded"
                              >
                                <span className="material-symbols-outlined text-base">chat</span>
                              </button>

                              {/* 3. Email Direct */}
                              <button
                                onClick={() => handleEmailDispatch(doc)}
                                title="Send via Email"
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                              >
                                <span className="material-symbols-outlined text-base">mail</span>
                              </button>

                              {/* 4. Inspect */}
                              <button
                                onClick={() => setInspectDoc(doc)}
                                title="View details and update status"
                                className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                              >
                                <span className="material-symbols-outlined text-base">visibility</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL 1: INSPECT & UPDATE STATUS MODAL ================= */}
      {inspectDoc && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
          onClick={() => setInspectDoc(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-outline-variant overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-deep-charcoal">{inspectDoc.invoice_number}</h3>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded bg-primary text-white uppercase">
                    {getDocTypeCategory(inspectDoc)}
                  </span>
                </div>
                <p className="text-secondary text-xs">Customer: {inspectDoc.company}</p>
              </div>
              <button onClick={() => setInspectDoc(null)} className="w-8 h-8 rounded-full hover:bg-gray-200 flex items-center justify-center">
                ✕
              </button>
            </div>

            {/* Status Update Ribbon */}
            <div className="px-5 py-3 bg-primary/10 border-b border-outline-variant flex justify-between items-center text-xs">
              <span className="font-bold text-deep-charcoal">Status: {inspectDoc.status.toUpperCase()}</span>
              <div className="flex items-center gap-1.5">
                <span className="text-secondary font-medium">Update Status:</span>
                {(['draft', 'sent', 'paid', 'cancelled'] as const).map((st) => (
                  <button
                    key={st}
                    disabled={statusUpdating || inspectDoc.status === st}
                    onClick={() => handleUpdateStatus(inspectDoc.id, st)}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase transition-all ${
                      inspectDoc.status === st ? 'bg-primary text-white shadow-2xs' : 'bg-white border text-secondary hover:text-black'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="bg-surface-container-low p-4 rounded-xl border space-y-1">
                <p><strong>Customer:</strong> {inspectDoc.company} (Attn: {inspectDoc.contact_name})</p>
                <p><strong>Address:</strong> {inspectDoc.billing_address || 'Registered Base'}</p>
                <p><strong>Contact:</strong> {inspectDoc.contact_phone} • {inspectDoc.email}</p>
                {inspectDoc.notes && <p className="text-secondary pt-1"><strong>Notes / Dispatch Details:</strong> {inspectDoc.notes}</p>}
              </div>

              {/* Items */}
              <div className="border rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-container-low text-[10px] uppercase font-bold text-secondary">
                    <tr>
                      <th className="p-2.5">Item</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">Unit Price</th>
                      <th className="p-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {(inspectDoc.line_items || []).map((li, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 font-medium">{li.description || li.product_name}</td>
                        <td className="p-2.5 text-center font-bold">{li.qty}</td>
                        <td className="p-2.5 text-right font-mono">₦{fmt(li.unit_price)}</td>
                        <td className="p-2.5 text-right font-mono font-bold">₦{fmt(li.total || li.qty * li.unit_price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="text-right text-sm font-black text-deep-charcoal">
                Total Amount: <span className="text-primary font-mono">₦{fmt(inspectDoc.total)}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-outline-variant bg-surface-container-low flex justify-between items-center">
              <button
                onClick={() => {
                  handlePickAndEditQuote(inspectDoc);
                  setInspectDoc(null);
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-sm"
              >
                <span className="material-symbols-outlined text-base">tune</span>
                <span>Pick &amp; Edit / Discount Bargain</span>
              </button>

              <button
                onClick={() => setInspectDoc(null)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: ISSUE WAYBILL MODAL ================= */}
      {showWaybillModal && selectedCustomer && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowWaybillModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-outline-variant text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4 pb-3 border-b">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-orange-600 text-2xl">local_shipping</span>
                <h3 className="text-base font-black text-deep-charcoal">Issue Waybill &amp; Delivery Note</h3>
              </div>
              <button onClick={() => setShowWaybillModal(false)}>✕</button>
            </div>

            <p className="text-secondary mb-4">
              File an official mobilization waybill under <strong>{selectedCustomer.companyName}</strong>'s folder.
            </p>

            <form onSubmit={handleCreateWaybill} className="space-y-3.5">
              <div>
                <label className="font-bold block mb-1">Carrier Vehicle / Truck Plate No *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. KSF-904-XA (15-Tonne Flatbed)"
                  value={waybillTruckNo}
                  onChange={(e) => setWaybillTruckNo(e.target.value)}
                  className="w-full p-2.5 border rounded-lg outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Driver Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Musa Ibrahim"
                    value={waybillDriverName}
                    onChange={(e) => setWaybillDriverName(e.target.value)}
                    className="w-full p-2.5 border rounded-lg outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Driver Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 0803 123 4567"
                    value={waybillDriverPhone}
                    onChange={(e) => setWaybillDriverPhone(e.target.value)}
                    className="w-full p-2.5 border rounded-lg outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Dispatch Yard / Fulfillment Hub</label>
                <select
                  value={waybillHub}
                  onChange={(e) => setWaybillHub(e.target.value)}
                  className="w-full p-2.5 border rounded-lg outline-none bg-white"
                >
                  <option value="Port Harcourt Yard (Elelenwo Ops)">Port Harcourt Yard (Elelenwo HQ)</option>
                  <option value="Lagos Logistics Hub (Oshuketan)">Lagos Logistics Hub (Oshuketan St)</option>
                  <option value="Abuja Dispatch Depot (Karsana)">Abuja Dispatch Depot (Karsana)</option>
                </select>
              </div>

              <div>
                <label className="font-bold block mb-1">Destination Site Base</label>
                <input
                  type="text"
                  placeholder="e.g. Obajana Plant, Kogi State or Onne Free Zone"
                  value={waybillDestination}
                  onChange={(e) => setWaybillDestination(e.target.value)}
                  className="w-full p-2.5 border rounded-lg outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Consigned Equipment &amp; Packages Summary</label>
                <textarea
                  rows={2}
                  placeholder="e.g. 1x Atlas Copco GA37 VSD+ Compressor, 4x Crates Overhaul Spares, 2x 209L Drums Roto Fluid..."
                  value={waybillItemsDesc}
                  onChange={(e) => setWaybillItemsDesc(e.target.value)}
                  className="w-full p-2.5 border rounded-lg outline-none focus:border-primary"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowWaybillModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingWaybill}
                  className="px-5 py-2 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 shadow-sm"
                >
                  {creatingWaybill ? 'Issuing...' : 'Issue Waybill to Customer Folder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: ISSUE INSPECTION CERTIFICATE ================= */}
      {showInspectionModal && selectedCustomer && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowInspectionModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-outline-variant text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4 pb-3 border-b">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-purple-600 text-2xl">verified</span>
                <h3 className="text-base font-black text-deep-charcoal">Issue Inspection &amp; QC Report</h3>
              </div>
              <button onClick={() => setShowInspectionModal(false)}>✕</button>
            </div>

            <p className="text-secondary mb-4">
              File pre-mobilization QC test certificate under <strong>{selectedCustomer.companyName}</strong>'s folder.
            </p>

            <form onSubmit={handleCreateInspection} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Equipment Model *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Atlas Copco GA75 VSD+"
                    value={inspectEquipmentModel}
                    onChange={(e) => setInspectEquipmentModel(e.target.value)}
                    className="w-full p-2.5 border rounded-lg outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Asset Serial ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. APF-902188"
                    value={inspectSerialId}
                    onChange={(e) => setInspectSerialId(e.target.value)}
                    className="w-full p-2.5 border rounded-lg outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Pressure &amp; CFM Test Result</label>
                <input
                  type="text"
                  value={inspectPressureCfm}
                  onChange={(e) => setInspectPressureCfm(e.target.value)}
                  className="w-full p-2.5 border rounded-lg outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Fluid &amp; Oil Analysis Standard</label>
                <input
                  type="text"
                  value={inspectOilQuality}
                  onChange={(e) => setInspectOilQuality(e.target.value)}
                  className="w-full p-2.5 border rounded-lg outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Lead QC Engineer Name *</label>
                <input
                  type="text"
                  required
                  value={inspectEngineerName}
                  onChange={(e) => setInspectEngineerName(e.target.value)}
                  className="w-full p-2.5 border rounded-lg outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Certification Findings &amp; Sign-off</label>
                <textarea
                  rows={2}
                  value={inspectNotes}
                  onChange={(e) => setInspectNotes(e.target.value)}
                  className="w-full p-2.5 border rounded-lg outline-none focus:border-primary"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowInspectionModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingInspection}
                  className="px-5 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 shadow-sm"
                >
                  {creatingInspection ? 'Filing...' : 'File Certificate in Customer Folder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
