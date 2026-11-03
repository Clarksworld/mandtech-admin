import { useState, useEffect, useMemo } from 'react';
import {
  createInvoice,
  fetchInvoices,
  updateInvoiceStatus,
  Invoice,
  LineItem as ServiceLineItem,
} from '../services/invoicingService';
import { MandtechLogo } from '../components/Logo';
import { numberToWordsNaira } from '../utils/numberToWords';

export interface QuotationLineItem {
  id: string;
  sn: number;
  partNumber: string;
  productName: string;
  qty: number;
  unitPrice: number;
}

const DEFAULT_BANK_DETAILS = `Bank Name: Access Bank Plc
Account Name: Mandtech Services Limited
Account Number: 0123456789
Sort Code / TIN: 044150149 / 10293847-0001
Branch: Port Harcourt Commercial Hub`;

const DEFAULT_TERMS = `1. Validity: This quotation is valid for 30 calendar days from the date of issue.
2. Payment Terms: 100% advance payment against proforma invoice or 70% mobilization deposit, balance 30% prior to dispatch.
3. Delivery Timeline: Ex-Stock / 3 - 5 business days upon receipt of official LPO and confirmed payment.
4. Warranty: Standard 12-month manufacturer OEM warranty applies on genuine parts and compressors.
5. All prices are in Nigerian Naira (NGN) and are inclusive of standard 7.5% Statutory VAT.`;

function generateDocNumber(type: 'quotation' | 'invoice' = 'quotation'): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  const prefix = type === 'invoice' ? 'INV' : 'QT';
  return `${prefix}-${year}-${rand}`;
}

export default function InvoicingPage() {
  // Document Type
  const [docType, setDocType] = useState<'quotation' | 'invoice'>('quotation');

  // Client Details
  const [contactPerson, setContactPerson] = useState('Engr. Tunde Adeleke');
  const [contactNumber, setContactNumber] = useState('+234 803 123 4567');
  const [companyName, setCompanyName] = useState('Apex Manufacturing Ltd.');
  const [companyAddress, setCompanyAddress] = useState('Plot 14, Commercial Boulevard, Victoria Island, Lagos State');
  const [companyEmail, setCompanyEmail] = useState('t.adeleke@apex-mfg.com');
  const [salesPerson, setSalesPerson] = useState('Engr. Samuel Okon (Technical Sales Lead)');

  // Document Metadata
  const [documentNo, setDocumentNo] = useState(() => generateDocNumber('quotation'));
  const [docDate, setDocDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [yourRef, setYourRef] = useState('RFQ-2026-APEX-091');
  const [bankDetails, setBankDetails] = useState(DEFAULT_BANK_DETAILS);

  // Products Section
  const [products, setProducts] = useState<QuotationLineItem[]>([
    {
      id: 'p1',
      sn: 1,
      partNumber: '1613-8720-00',
      productName: 'Atlas Copco Oil Separator Element (GA37-GA55 Series)',
      qty: 2,
      unitPrice: 385000,
    },
    {
      id: 'p2',
      sn: 2,
      partNumber: '250025-526',
      productName: 'Sullair Sullube Synthetic Air Compressor Fluid (5 Gallon Pail)',
      qty: 4,
      unitPrice: 245000,
    },
    {
      id: 'p3',
      sn: 3,
      partNumber: 'IR-SSR-3984',
      productName: 'Ingersoll Rand Ultra Coolant Rotary Screw Lubricant (20L)',
      qty: 1,
      unitPrice: 310000,
    },
  ]);

  // Financials & Terms
  const [vatRate] = useState<number>(7.5); // Fixed at standard 7.5%
  const [customAmtInWords, setCustomAmtInWords] = useState<string>('');
  const [useCustomAmtInWords, setUseCustomAmtInWords] = useState<boolean>(false);
  const [terms, setTerms] = useState(DEFAULT_TERMS);

  // Status & API State
  const [saving, setSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);
  const [pastInvoices, setPastInvoices] = useState<Invoice[]>([]);

  // Calculations
  const subtotal = useMemo(() => {
    return products.reduce((acc, item) => acc + (Number(item.qty) || 0) * (Number(item.unitPrice) || 0), 0);
  }, [products]);

  const vatAmount = useMemo(() => {
    return Math.round(subtotal * (vatRate / 100) * 100) / 100;
  }, [subtotal, vatRate]);

  const total = useMemo(() => {
    return subtotal + vatAmount;
  }, [subtotal, vatAmount]);

  // Amount in words auto-conversion
  const autoAmtInWords = useMemo(() => {
    return numberToWordsNaira(total);
  }, [total]);

  const effectiveAmtInWords = useCustomAmtInWords ? customAmtInWords : autoAmtInWords;

  // Currency Formatter
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
    }).format(n);

  const loadPastInvoices = () => {
    fetchInvoices()
      .then((res) => {
        if (res && res.data) setPastInvoices(res.data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadPastInvoices();
  }, []);

  // Update line items helper
  const updateProduct = (id: string, field: keyof QuotationLineItem, value: any) => {
    setProducts((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  const addProductRow = () => {
    const nextSn = products.length + 1;
    setProducts((prev) => [
      ...prev,
      {
        id: `p_${Date.now()}`,
        sn: nextSn,
        partNumber: '',
        productName: '',
        qty: 1,
        unitPrice: 0,
      },
    ]);
  };

  const removeProductRow = (id: string) => {
    if (products.length <= 1) {
      alert('A quotation must contain at least one product item.');
      return;
    }
    setProducts((prev) => {
      const filtered = prev.filter((p) => p.id !== id);
      return filtered.map((item, idx) => ({ ...item, sn: idx + 1 }));
    });
  };

  // Quick preset products
  const addPreset = (partNum: string, name: string, price: number, qty: number = 1) => {
    setProducts((prev) => [
      ...prev,
      {
        id: `preset_${Date.now()}_${Math.random()}`,
        sn: prev.length + 1,
        partNumber: partNum,
        productName: name,
        qty,
        unitPrice: price,
      },
    ]);
  };

  // Save Quotation Handler
  const handleSaveQuotation = async (status: 'draft' | 'sent') => {
    if (!companyName.trim()) {
      setSaveErrorMsg('Please specify the Company Name.');
      return;
    }
    if (!contactPerson.trim() || !companyEmail.trim()) {
      setSaveErrorMsg('Please provide Contact Person and Company Email Address.');
      return;
    }
    if (products.length === 0) {
      setSaveErrorMsg('Please add at least one product to the quotation.');
      return;
    }

    setSaving(true);
    setSaveErrorMsg(null);
    setSaveSuccessMsg(null);

    const serviceLineItems: ServiceLineItem[] = products.map((p) => ({
      sn: p.sn,
      part_number: p.partNumber,
      product_name: p.productName,
      description: p.productName,
      qty: Number(p.qty) || 1,
      unit_price: Number(p.unitPrice) || 0,
      total: (Number(p.qty) || 1) * (Number(p.unitPrice) || 0),
    }));

    try {
      const res = await createInvoice({
        doc_type: docType,
        invoice_number: documentNo.trim(),
        company: companyName.trim(),
        contact_name: contactPerson.trim(),
        contact_phone: contactNumber.trim(),
        email: companyEmail.trim(),
        billing_address: companyAddress.trim(),
        sales_person: salesPerson.trim(),
        client_ref: yourRef.trim(),
        bank_details: bankDetails.trim(),
        amount_in_words: effectiveAmtInWords,
        terms: terms.trim(),
        line_items: serviceLineItems,
        discount_pct: 0,
        vat_rate_pct: vatRate,
        delivery_terms: 'Ex-Stock / Standard Delivery',
        currency: 'NGN',
        notes: `Prepared by: ${salesPerson}. Ref: ${yourRef}`,
        status,
      });

      setSaveSuccessMsg(
        `${docType === 'quotation' ? 'Quotation' : 'Invoice'} ${res.data.invoice_number} saved successfully as ${status.toUpperCase()}!`
      );
      loadPastInvoices();
      setTimeout(() => setSaveSuccessMsg(null), 6000);
    } catch (err: any) {
      setSaveErrorMsg(err.message || 'Failed to save quotation.');
    } finally {
      setSaving(false);
    }
  };

  // Load past record into form
  const loadQuotationIntoForm = (inv: Invoice) => {
    setDocType(inv.doc_type || 'quotation');
    setDocumentNo(inv.invoice_number);
    setCompanyName(inv.company || '');
    setContactPerson(inv.contact_name || '');
    setContactNumber(inv.contact_phone || '');
    setCompanyEmail(inv.email || '');
    setCompanyAddress(inv.billing_address || '');
    setSalesPerson(inv.sales_person || '');
    setYourRef(inv.client_ref || '');
    if (inv.bank_details) setBankDetails(inv.bank_details);
    if (inv.terms) setTerms(inv.terms);
    if (inv.amount_in_words) {
      setCustomAmtInWords(inv.amount_in_words);
      setUseCustomAmtInWords(true);
    }

    if (Array.isArray(inv.line_items) && inv.line_items.length > 0) {
      setProducts(
        inv.line_items.map((li, idx) => ({
          id: `loaded_${idx}_${Date.now()}`,
          sn: li.sn || idx + 1,
          partNumber: li.part_number || '',
          productName: li.product_name || li.description || '',
          qty: li.qty || 1,
          unitPrice: li.unit_price || 0,
        }))
      );
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="pb-12">
      {/* Print Stylesheet injection */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #quotation-print-area, #quotation-print-area * {
            visibility: visible;
          }
          #quotation-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 30px !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Top Action & Mode Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 no-print">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2 bg-primary/10 text-primary rounded-lg">
              <span className="material-symbols-outlined text-2xl">request_quote</span>
            </span>
            <div>
              <h2 className="font-headline-lg text-2xl font-bold text-deep-charcoal tracking-tight flex items-center gap-2">
                Quotation &amp; Proposal Builder
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-primary/15 text-primary border border-primary/30">
                  {docType === 'quotation' ? 'Quotation Mode' : 'Invoice Mode'}
                </span>
              </h2>
              <p className="text-secondary font-body-md text-xs mt-0.5">
                Generate official industrial quotations with part numbers, auto VAT (7.5%), amount in words, and bank details.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Document Type Switcher */}
          <div className="bg-surface-container border border-outline-variant rounded-lg p-1 flex items-center gap-1 text-xs font-bold">
            <button
              onClick={() => {
                setDocType('quotation');
                if (documentNo.startsWith('INV-')) setDocumentNo(generateDocNumber('quotation'));
              }}
              className={`px-3 py-1.5 rounded transition-all ${
                docType === 'quotation'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-secondary hover:text-deep-charcoal'
              }`}
            >
              Quotation
            </button>
            <button
              onClick={() => {
                setDocType('invoice');
                if (documentNo.startsWith('QT-')) setDocumentNo(generateDocNumber('invoice'));
              }}
              className={`px-3 py-1.5 rounded transition-all ${
                docType === 'invoice'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-secondary hover:text-deep-charcoal'
              }`}
            >
              Invoice
            </button>
          </div>

          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-white border border-outline-variant text-deep-charcoal hover:bg-surface-container font-button text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
            title="Print Quotation or Save as PDF"
          >
            <span className="material-symbols-outlined text-base">print</span>
            Print / PDF
          </button>

          {/* Save Draft */}
          <button
            onClick={() => handleSaveQuotation('draft')}
            disabled={saving}
            className="px-4 py-2 bg-white border border-outline-variant text-deep-charcoal hover:bg-surface-container font-button text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-base">save</span>
            {saving ? 'Saving...' : 'Save Draft'}
          </button>

          {/* Issue & Save */}
          <button
            onClick={() => handleSaveQuotation('sent')}
            disabled={saving}
            className="px-5 py-2 bg-primary text-white hover:bg-black font-button text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-base">send</span>
            {saving ? 'Processing...' : 'Save & Issue Quotation'}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {saveSuccessMsg && (
        <div className="mb-4 p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-lg flex items-center justify-between text-xs font-medium no-print">
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600">check_circle</span>
            {saveSuccessMsg}
          </span>
          <button onClick={() => setSaveSuccessMsg(null)} className="text-emerald-700 hover:text-black">✕</button>
        </div>
      )}
      {saveErrorMsg && (
        <div className="mb-4 p-4 bg-rose-50 border border-rose-300 text-rose-900 rounded-lg flex items-center justify-between text-xs font-medium no-print">
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-rose-600">error</span>
            {saveErrorMsg}
          </span>
          <button onClick={() => setSaveErrorMsg(null)} className="text-rose-700 hover:text-black">✕</button>
        </div>
      )}

      {/* Two Column Grid: Form Editor (Left) & Live Preview (Right) */}
      <div className="grid grid-cols-12 gap-8 mb-12">
        {/* ================= LEFT: FORM BUILDER ================= */}
        <section className="col-span-12 lg:col-span-5 space-y-6 no-print">
          {/* Card 1: Client & Sales Information */}
          <div className="bg-surface-white border border-outline-variant p-5 rounded-xl shadow-sm relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary rounded-t-xl" />
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-label-bold text-primary uppercase text-xs tracking-wider flex items-center gap-1.5 font-bold">
                <span className="material-symbols-outlined text-base">person</span>
                Client &amp; Sales Representative
              </h3>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-deep-charcoal block mb-1 text-[11px] uppercase tracking-wider">
                    Contact Person *
                  </label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="e.g. Engr. Tunde Adeleke"
                    className="w-full bg-surface border border-outline-variant p-2 rounded text-xs focus:border-primary outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="font-bold text-deep-charcoal block mb-1 text-[11px] uppercase tracking-wider">
                    Contact Number *
                  </label>
                  <input
                    type="text"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    placeholder="e.g. +234 803 123 4567"
                    className="w-full bg-surface border border-outline-variant p-2 rounded text-xs focus:border-primary outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-deep-charcoal block mb-1 text-[11px] uppercase tracking-wider">
                  Company Name *
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Apex Manufacturing Ltd."
                  className="w-full bg-surface border border-outline-variant p-2 rounded text-xs focus:border-primary outline-none transition-colors font-semibold"
                />
              </div>

              <div>
                <label className="font-bold text-deep-charcoal block mb-1 text-[11px] uppercase tracking-wider">
                  Company Address *
                </label>
                <textarea
                  rows={2}
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                  placeholder="e.g. Plot 14, Commercial Boulevard, Victoria Island, Lagos"
                  className="w-full bg-surface border border-outline-variant p-2 rounded text-xs focus:border-primary outline-none transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-deep-charcoal block mb-1 text-[11px] uppercase tracking-wider">
                    Company Email Address *
                  </label>
                  <input
                    type="email"
                    value={companyEmail}
                    onChange={(e) => setCompanyEmail(e.target.value)}
                    placeholder="e.g. procurement@apex-mfg.com"
                    className="w-full bg-surface border border-outline-variant p-2 rounded text-xs focus:border-primary outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="font-bold text-deep-charcoal block mb-1 text-[11px] uppercase tracking-wider">
                    Sales Person *
                  </label>
                  <input
                    type="text"
                    value={salesPerson}
                    onChange={(e) => setSalesPerson(e.target.value)}
                    placeholder="e.g. Engr. Samuel Okon"
                    className="w-full bg-surface border border-outline-variant p-2 rounded text-xs focus:border-primary outline-none transition-colors font-medium text-primary"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Document & Reference Metadata */}
          <div className="bg-surface-white border border-outline-variant p-5 rounded-xl shadow-sm">
            <h3 className="font-label-bold text-primary uppercase text-xs tracking-wider mb-3 flex items-center gap-1.5 font-bold">
              <span className="material-symbols-outlined text-base">description</span>
              Quotation Metadata &amp; References
            </h3>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-deep-charcoal text-[11px] uppercase tracking-wider">
                      Document No. *
                    </label>
                    <button
                      type="button"
                      onClick={() => setDocumentNo(generateDocNumber(docType))}
                      className="text-[10px] text-primary hover:underline font-bold"
                    >
                      Re-generate
                    </button>
                  </div>
                  <input
                    type="text"
                    value={documentNo}
                    onChange={(e) => setDocumentNo(e.target.value)}
                    className="w-full bg-surface border border-outline-variant p-2 rounded text-xs font-mono font-bold text-primary focus:border-primary outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-deep-charcoal block mb-1 text-[11px] uppercase tracking-wider">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={docDate}
                    onChange={(e) => setDocDate(e.target.value)}
                    className="w-full bg-surface border border-outline-variant p-2 rounded text-xs focus:border-primary outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-deep-charcoal block mb-1 text-[11px] uppercase tracking-wider">
                  Your Ref (Client RFQ / Enquiry Reference)
                </label>
                <input
                  type="text"
                  value={yourRef}
                  onChange={(e) => setYourRef(e.target.value)}
                  placeholder="e.g. RFQ/APEX/2026/091"
                  className="w-full bg-surface border border-outline-variant p-2 rounded text-xs focus:border-primary outline-none font-medium"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-deep-charcoal text-[11px] uppercase tracking-wider">
                    Our Bank Details
                  </label>
                  <button
                    type="button"
                    onClick={() => setBankDetails(DEFAULT_BANK_DETAILS)}
                    className="text-[10px] text-secondary hover:text-primary font-bold"
                  >
                    Reset Defaults
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={bankDetails}
                  onChange={(e) => setBankDetails(e.target.value)}
                  className="w-full bg-surface border border-outline-variant p-2 rounded text-xs focus:border-primary outline-none font-mono text-xs leading-relaxed resize-none"
                />
              </div>
            </div>
          </div>

          {/* Card 3: Products Section & Line Items */}
          <div className="bg-surface-white border border-outline-variant p-5 rounded-xl shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
              <h3 className="font-label-bold text-primary uppercase text-xs tracking-wider flex items-center gap-1.5 font-bold">
                <span className="material-symbols-outlined text-base">format_list_numbered</span>
                Products Section ({products.length} Items)
              </h3>
              <button
                type="button"
                onClick={addProductRow}
                className="px-3 py-1 bg-primary text-white text-xs font-bold rounded hover:bg-black transition-all flex items-center gap-1 shadow-sm"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                Add Product
              </button>
            </div>

            {/* Quick Add Presets Bar */}
            <div className="mb-4 p-2 bg-surface-container rounded-lg border border-outline-variant">
              <span className="text-[10px] uppercase font-bold text-secondary block mb-1.5">
                Quick Add Popular Equipment &amp; Consumables:
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => addPreset('1613-8720-00', 'Atlas Copco Oil Separator Element', 385000)}
                  className="text-[10px] bg-white border border-outline-variant px-2 py-0.5 rounded font-medium hover:border-primary hover:text-primary transition-colors"
                >
                  + AC Separator
                </button>
                <button
                  type="button"
                  onClick={() => addPreset('250025-526', 'Sullair Sullube Synthetic Lubricant 5 Gal', 245000)}
                  className="text-[10px] bg-white border border-outline-variant px-2 py-0.5 rounded font-medium hover:border-primary hover:text-primary transition-colors"
                >
                  + Sullube 5G
                </button>
                <button
                  type="button"
                  onClick={() => addPreset('AC-GA37-VSD', 'Atlas Copco GA37 VSD+ Rotary Screw Air Compressor (400V)', 18500000)}
                  className="text-[10px] bg-white border border-outline-variant px-2 py-0.5 rounded font-medium hover:border-primary hover:text-primary transition-colors"
                >
                  + GA37 Compressor
                </button>
                <button
                  type="button"
                  onClick={() => addPreset('SL-185-DP', 'Sullair 185 CFM Mobile Diesel Portable Compressor (Trailer)', 24000000)}
                  className="text-[10px] bg-white border border-outline-variant px-2 py-0.5 rounded font-medium hover:border-primary hover:text-primary transition-colors"
                >
                  + Sullair 185 CFM
                </button>
              </div>
            </div>

            {/* Product Line Item Rows */}
            <div className="space-y-3">
              {products.map((item, index) => {
                const lineTotal = (Number(item.qty) || 0) * (Number(item.unitPrice) || 0);
                return (
                  <div
                    key={item.id}
                    className="p-3 bg-surface-container-low rounded-lg border border-outline-variant relative group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-deep-charcoal text-white px-2 py-0.5 rounded">
                        S/N #{index + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-primary">
                          Total: {fmt(lineTotal)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeProductRow(item.id)}
                          className="text-secondary hover:text-rose-600 transition-colors"
                          title="Remove row"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="grid grid-cols-12 gap-2">
                        <div className="col-span-5">
                          <label className="text-[10px] font-bold text-secondary uppercase block mb-0.5">
                            Part Number
                          </label>
                          <input
                            type="text"
                            value={item.partNumber}
                            onChange={(e) => updateProduct(item.id, 'partNumber', e.target.value)}
                            placeholder="e.g. 1613-8720-00"
                            className="w-full bg-white border border-outline-variant px-2 py-1 rounded text-xs font-mono focus:border-primary outline-none"
                          />
                        </div>
                        <div className="col-span-7">
                          <label className="text-[10px] font-bold text-secondary uppercase block mb-0.5">
                            Product Name / Description *
                          </label>
                          <input
                            type="text"
                            value={item.productName}
                            onChange={(e) => updateProduct(item.id, 'productName', e.target.value)}
                            placeholder="e.g. Atlas Copco Oil Separator"
                            className="w-full bg-white border border-outline-variant px-2 py-1 rounded text-xs focus:border-primary outline-none font-medium"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-12 gap-2 pt-1 border-t border-outline-variant/50">
                        <div className="col-span-4">
                          <label className="text-[10px] font-bold text-secondary uppercase block mb-0.5">
                            Quantity
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={item.qty}
                            onChange={(e) => updateProduct(item.id, 'qty', Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full bg-white border border-outline-variant px-2 py-1 rounded text-xs text-center font-bold focus:border-primary outline-none"
                          />
                        </div>
                        <div className="col-span-4">
                          <label className="text-[10px] font-bold text-secondary uppercase block mb-0.5">
                            Unit Price (₦)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={item.unitPrice}
                            onChange={(e) => updateProduct(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="w-full bg-white border border-outline-variant px-2 py-1 rounded text-xs text-right font-mono focus:border-primary outline-none"
                          />
                        </div>
                        <div className="col-span-4">
                          <label className="text-[10px] font-bold text-secondary uppercase block mb-0.5">
                            Unit * Qty
                          </label>
                          <div className="w-full bg-surface-container px-2 py-1 rounded text-xs text-right font-mono font-bold text-deep-charcoal border border-outline-variant">
                            {fmt(lineTotal)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 4: Terms & Conditions */}
          <div className="bg-surface-white border border-outline-variant p-5 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-label-bold text-primary uppercase text-xs tracking-wider flex items-center gap-1.5 font-bold">
                <span className="material-symbols-outlined text-base">gavel</span>
                Quotation Terms &amp; Conditions
              </h3>
              <button
                type="button"
                onClick={() => setTerms(DEFAULT_TERMS)}
                className="text-[10px] text-secondary hover:text-primary font-bold"
              >
                Reset Default Terms
              </button>
            </div>
            <textarea
              rows={4}
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              className="w-full bg-surface border border-outline-variant p-2.5 rounded text-xs focus:border-primary outline-none font-body text-xs leading-relaxed resize-none"
            />
          </div>
        </section>

        {/* ================= RIGHT: LIVE A4 PREVIEW & PRINTABLE CANVAS ================= */}
        <section className="col-span-12 lg:col-span-7 bg-surface-container rounded-xl p-4 lg:p-6 flex justify-center items-start overflow-x-auto">
          {/* Printable A4 Canvas */}
          <div
            id="quotation-print-area"
            className="bg-white w-full max-w-[760px] shadow-2xl rounded-sm border border-outline-variant flex flex-col p-8 sm:p-10 font-sans text-deep-charcoal relative"
            style={{ minHeight: '1050px' }}
          >
            {/* Top Green & Dark Accent Strip */}
            <div className="w-full h-2 bg-gradient-to-r from-primary via-primary-light to-black -mt-8 sm:-mt-10 -mx-8 sm:-mx-10 mb-6 rounded-t-sm" />

            {/* Document Header */}
            <div className="flex justify-between items-start pb-6 border-b-2 border-deep-charcoal/10">
              <div className="space-y-2">
                <MandtechLogo height={38} variant="light" />
                <p className="text-[11px] font-bold text-deep-charcoal uppercase tracking-wider">
                  Mandtech Services Limited
                </p>
                <div className="text-[10px] text-secondary leading-relaxed max-w-xs">
                  <p>42 Old Refinery Road, Elelenwo, Port-Harcourt, Rivers State</p>
                  <p>Lagos Hub: 16 Oshuketan Street, Return, Lagos</p>
                  <p>Tel: +234 806 420 4187 | +234 802 777 9298</p>
                  <p>Email: sales@mandtech.com.ng | www.mandtech.com.ng</p>
                </div>
              </div>

              <div className="text-right space-y-1">
                <span className="inline-block px-3 py-1 bg-primary text-white font-black text-sm uppercase tracking-widest rounded">
                  {docType === 'quotation' ? 'OFFICIAL QUOTATION' : 'COMMERCIAL INVOICE'}
                </span>
                <p className="font-mono font-black text-lg text-deep-charcoal pt-1">
                  {documentNo}
                </p>
                <div className="text-[11px] text-secondary space-y-0.5">
                  <p>
                    <span className="font-semibold text-deep-charcoal">Date:</span>{' '}
                    {new Date(docDate).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                  {yourRef && (
                    <p>
                      <span className="font-semibold text-deep-charcoal">Your Ref:</span>{' '}
                      <span className="font-mono text-primary font-bold">{yourRef}</span>
                    </p>
                  )}
                  {salesPerson && (
                    <p>
                      <span className="font-semibold text-deep-charcoal">Sales Rep:</span>{' '}
                      <span className="text-deep-charcoal">{salesPerson}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Client / Customer Section */}
            <div className="my-6 p-4 bg-surface-container-low rounded border border-outline-variant/60">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-secondary block mb-1">
                    Quotation Prepared For:
                  </span>
                  <h4 className="font-black text-sm text-deep-charcoal uppercase">
                    {companyName || '—'}
                  </h4>
                  <div className="text-[11px] text-secondary mt-1 leading-relaxed">
                    <p className="font-medium text-deep-charcoal">Attn: {contactPerson || '—'}</p>
                    <p>{companyAddress || '—'}</p>
                  </div>
                </div>

                <div className="text-right space-y-1 text-[11px]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-secondary block mb-1">
                    Direct Contact:
                  </span>
                  <p className="font-mono font-medium text-deep-charcoal">
                    Tel: {contactNumber || '—'}
                  </p>
                  <p className="font-mono text-primary font-bold">
                    Email: {companyEmail || '—'}
                  </p>
                  <p className="text-[10px] text-secondary">
                    Pricing Basis: Ex-Stock / OEM Direct Supply
                  </p>
                </div>
              </div>
            </div>

            {/* Products Section Table */}
            <div className="flex-1 mb-6">
              <div className="text-[10px] font-black uppercase tracking-wider text-deep-charcoal mb-2 flex items-center justify-between">
                <span>Products &amp; Technical Equipment Schedule</span>
                <span className="text-secondary font-normal">Currency: NGN (₦)</span>
              </div>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-deep-charcoal text-white font-bold text-[10px] uppercase tracking-wider">
                    <th className="py-2.5 px-3 w-12 text-center rounded-l">S/N</th>
                    <th className="py-2.5 px-3 w-32">Part Number</th>
                    <th className="py-2.5 px-3">Product Name</th>
                    <th className="py-2.5 px-3 w-14 text-center">Qty</th>
                    <th className="py-2.5 px-3 w-28 text-right">Unit Price</th>
                    <th className="py-2.5 px-3 w-32 text-right rounded-r">Unit * Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/60">
                  {products.map((item, idx) => {
                    const lineTotal = (Number(item.qty) || 0) * (Number(item.unitPrice) || 0);
                    return (
                      <tr key={item.id} className={idx % 2 === 1 ? 'bg-surface/50' : 'bg-white'}>
                        <td className="py-3 px-3 text-center font-bold text-secondary">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-3 font-mono font-semibold text-primary text-[11px]">
                          {item.partNumber || '—'}
                        </td>
                        <td className="py-3 px-3 font-medium text-deep-charcoal">
                          {item.productName || '—'}
                        </td>
                        <td className="py-3 px-3 text-center font-bold">
                          {item.qty}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-secondary">
                          {fmt(item.unitPrice)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-deep-charcoal">
                          {fmt(lineTotal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Financial Totals Breakdown */}
            <div className="border-t-2 border-deep-charcoal/20 pt-4 mb-6">
              <div className="grid grid-cols-12 gap-6 items-start">
                <div className="col-span-7 space-y-3">
                  {/* Amount in words Box */}
                  <div className="p-3 bg-surface-container-low rounded border border-outline-variant/80">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-black uppercase tracking-wider text-secondary">
                        Amount in Words:
                      </span>
                      <button
                        type="button"
                        onClick={() => setUseCustomAmtInWords(!useCustomAmtInWords)}
                        className="text-[9px] text-primary hover:underline font-bold no-print"
                      >
                        {useCustomAmtInWords ? 'Use Auto Words' : 'Edit Words'}
                      </button>
                    </div>
                    {useCustomAmtInWords ? (
                      <input
                        type="text"
                        value={customAmtInWords}
                        onChange={(e) => setCustomAmtInWords(e.target.value)}
                        className="w-full bg-white border border-outline-variant p-1.5 rounded text-xs font-semibold text-deep-charcoal outline-none focus:border-primary no-print"
                      />
                    ) : (
                      <p className="text-xs font-bold text-deep-charcoal italic leading-relaxed">
                        {effectiveAmtInWords}
                      </p>
                    )}
                  </div>

                  {/* Bank Details Box */}
                  <div className="p-3 bg-white rounded border border-outline-variant/80 text-[10px]">
                    <span className="font-black uppercase tracking-wider text-deep-charcoal block mb-1">
                      Our Bank Details:
                    </span>
                    <pre className="font-mono text-secondary leading-relaxed whitespace-pre-wrap font-medium">
                      {bankDetails}
                    </pre>
                  </div>
                </div>

                {/* Subtotal, VAT 7.5%, Total */}
                <div className="col-span-5 bg-surface-container-low p-4 rounded-lg border border-outline-variant space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-secondary font-medium">Subtotal:</span>
                    <span className="font-mono font-bold text-deep-charcoal">{fmt(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-secondary font-medium">VAT (7.5%):</span>
                    <span className="font-mono font-bold text-deep-charcoal">{fmt(vatAmount)}</span>
                  </div>
                  <div className="h-px bg-outline-variant my-1" />
                  <div className="flex justify-between items-baseline pt-1">
                    <span className="font-black text-sm uppercase text-deep-charcoal">
                      Total NGN:
                    </span>
                    <span className="font-mono font-black text-base text-primary">
                      {fmt(total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Terms and Conditions Section */}
            <div className="mb-8 pt-4 border-t border-outline-variant text-[10px] leading-relaxed">
              <span className="font-black uppercase tracking-wider text-deep-charcoal block mb-1.5">
                Quotation Terms:
              </span>
              <pre className="font-sans text-secondary leading-relaxed whitespace-pre-wrap">
                {terms}
              </pre>
            </div>

            {/* Sign-off & Stamp Section */}
            <div className="mt-auto pt-6 border-t border-deep-charcoal/10 flex justify-between items-end text-[10px]">
              <div>
                <p className="font-black uppercase tracking-wider text-deep-charcoal">
                  Mandtech Services Limited
                </p>
                <p className="text-secondary mt-0.5">Authorized Engineering &amp; Equipment Sales</p>
              </div>

              <div className="text-right">
                <div className="w-48 border-b-2 border-deep-charcoal/40 mb-1.5" />
                <p className="font-bold text-deep-charcoal">{salesPerson}</p>
                <p className="text-secondary text-[9px] uppercase tracking-wider">Authorized Signature &amp; Date</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ================= PAST QUOTATIONS & INVOICES LEDGER ================= */}
      <section className="bg-surface-white border border-outline-variant rounded-xl p-6 shadow-sm no-print">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="font-headline-sm text-lg font-bold text-deep-charcoal">
              Prepared Quotations &amp; Invoices Ledger
            </h3>
            <p className="text-secondary text-xs mt-0.5">
              Review, reload, or print past documents saved in the database.
            </p>
          </div>
          <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
            {pastInvoices.length} Documents in Database
          </span>
        </div>

        {pastInvoices.length === 0 ? (
          <div className="text-center py-8 text-secondary text-xs">
            No quotations saved yet. Use the builder above to save your first quotation.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-outline-variant text-[10px] font-label-bold text-secondary uppercase tracking-wider">
                  <th className="pb-3">Doc Ref #</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Company</th>
                  <th className="pb-3">Contact Person</th>
                  <th className="pb-3">Subtotal</th>
                  <th className="pb-3">VAT (7.5%)</th>
                  <th className="pb-3">Total Amount</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/60">
                {pastInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="py-3 font-mono font-bold text-primary">
                      {inv.invoice_number}
                    </td>
                    <td className="py-3 uppercase font-semibold text-[10px]">
                      {inv.doc_type || 'Quotation'}
                    </td>
                    <td className="py-3 font-semibold text-deep-charcoal">
                      {inv.company}
                    </td>
                    <td className="py-3 text-secondary">
                      {inv.contact_name}
                      {inv.contact_phone && (
                        <span className="block text-[10px] font-mono text-secondary">
                          {inv.contact_phone}
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-secondary font-mono">{fmt(inv.subtotal)}</td>
                    <td className="py-3 text-secondary font-mono">{fmt(inv.vat_amount)}</td>
                    <td className="py-3 font-mono font-bold text-deep-charcoal">{fmt(inv.total)}</td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          inv.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : inv.status === 'sent'
                            ? 'bg-primary text-white'
                            : inv.status === 'cancelled'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-surface-container text-secondary'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 text-right space-x-2">
                      <button
                        onClick={() => loadQuotationIntoForm(inv)}
                        className="text-xs bg-surface-container border border-outline-variant hover:border-primary hover:text-primary rounded px-2.5 py-1 font-semibold transition-colors"
                      >
                        Load in Editor
                      </button>
                      <select
                        value={inv.status}
                        onChange={async (e) => {
                          try {
                            await updateInvoiceStatus(inv.id, e.target.value);
                            loadPastInvoices();
                          } catch (err: any) {
                            alert(err.message || 'Failed to update status');
                          }
                        }}
                        className="text-xs bg-surface-container border border-outline-variant rounded px-2 py-1 font-medium outline-none"
                      >
                        <option value="draft">Draft</option>
                        <option value="sent">Sent</option>
                        <option value="paid">Paid</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
