import { useState, useEffect } from 'react';
import { createInvoice, fetchInvoices, updateInvoiceStatus, Invoice } from '../services/invoicingService';

interface LineItem {
  id: string;
  description: string;
  qty: number;
  unitPrice: number;
}

export default function InvoicingPage() {
  const [companyName, setCompanyName] = useState('Apex Manufacturing Ltd.');
  const [saving, setSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);
  const [pastInvoices, setPastInvoices] = useState<Invoice[]>([]);

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

  const handleSaveInvoice = async (status: 'draft' | 'sent') => {
    if (!companyName.trim()) {
      setSaveErrorMsg('Please enter a company name.');
      return;
    }
    if (!clientContact.trim() || !emailAddress.trim()) {
      setSaveErrorMsg('Please enter client contact and email.');
      return;
    }
    if (lineItems.length === 0) {
      setSaveErrorMsg('Please add at least one line item.');
      return;
    }

    setSaving(true);
    setSaveErrorMsg(null);
    setSaveSuccessMsg(null);

    try {
      const res = await createInvoice({
        company: companyName.trim(),
        contact_name: clientContact.trim(),
        email: emailAddress.trim(),
        billing_address: billingAddress.trim(),
        line_items: lineItems.map((li) => ({
          description: li.description,
          qty: li.qty,
          unit_price: li.unitPrice,
        })),
        discount_pct: discount,
        vat_rate_pct: vatRate,
        delivery_terms: incoterms,
        currency: 'NGN',
        notes: `Payment terms: ${paymentTerms}. Due Date: ${dueDate}. PO: ${poNumber}`,
        status,
      });

      setSaveSuccessMsg(`Invoice ${res.data.invoice_number} saved successfully as ${status.toUpperCase()}!`);
      loadPastInvoices();
      setTimeout(() => setSaveSuccessMsg(null), 5000);
    } catch (err: any) {
      setSaveErrorMsg(err.message || 'Failed to save invoice.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangeStatus = async (invoiceId: string, newStatus: string) => {
    try {
      await updateInvoiceStatus(invoiceId, newStatus);
      loadPastInvoices();
    } catch (err: any) {
      alert(err.message || 'Failed to update status.');
    }
  };
  const [clientContact, setClientContact] = useState('Sarah Jenkins');
  const [emailAddress, setEmailAddress] = useState('s.jenkins@apex-mfg.com');
  const [billingAddress, setBillingAddress] = useState('44 Industrial Parkway, North Wing, Manchester, M17 1BR');
  
  // Reviewer Requested Fields
  const [poNumber, setPoNumber] = useState('PO-2024-9941');
  const [paymentTerms, setPaymentTerms] = useState('Net 30 Days');
  const [dueDate, setDueDate] = useState('2026-08-31');
  const [requiresShipping, setRequiresShipping] = useState(true);
  const [shippingAddress, setShippingAddress] = useState('Mandtech Logistics Hub 4, Sector 7, Manchester, M17 1BR');
  const [mandtechContact, setMandtechContact] = useState('Alex Thorne (Mandtech Dispatch Lead)');

  const [discount, setDiscount] = useState(5);
  const [vatRate, setVatRate] = useState(20);
  const [incoterms, setIncoterms] = useState('DDP - Delivered Duty Paid');
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: 'li1', description: 'Mandtech MT-500 Heavy Duty Compressor', qty: 1, unitPrice: 12450 },
    { id: 'li2', description: 'Installation & On-site Calibration Service', qty: 8, unitPrice: 120 },
    { id: 'li3', description: 'Mandtech Standard Maintenance Kit', qty: 1, unitPrice: 450 },
  ]);

  const addLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      { id: `li${Date.now()}`, description: 'New line item', qty: 1, unitPrice: 0 },
    ]);
  };

  const removeLineItem = (id: string) => {
    setLineItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setLineItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const subtotal = lineItems.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
  const discountAmount = subtotal * (discount / 100);
  const vatAmount = (subtotal - discountAmount) * (vatRate / 100);
  const total = subtotal - discountAmount + vatAmount;

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(n);

  const vatOptions = [
    { label: '20% (Standard)', value: 20 },
    { label: '5% (Reduced)', value: 5 },
    { label: '0% (Exempt)', value: 0 },
  ];

  const incotermsOptions = [
    'EXW - Ex Works',
    'DDP - Delivered Duty Paid',
    'CIF - Cost, Insurance and Freight',
  ];

  const paymentTermsOptions = [
    'Due on Receipt',
    'Net 15 Days',
    'Net 30 Days',
    'Net 60 Days',
  ];

  const mandtechRepOptions = [
    'Alex Thorne (Mandtech Dispatch Lead)',
    'David Miller (Site Logistics Mgr)',
    'Sarah Lund (Ops Coordinator)',
  ];

  return (
    <div className="pb-0">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-6">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-deep-charcoal tracking-tight">Invoice Builder</h2>
          <p className="text-secondary font-body-md text-sm mt-1">
            Create and customize technical service quotations.
          </p>
        </div>
        <div className="flex gap-3 shrink-0">
          <button 
            onClick={() => handleSaveInvoice('draft')}
            disabled={saving}
            className="px-5 py-2.5 bg-surface-white border border-outline text-deep-charcoal font-button text-sm rounded-lg hover:bg-surface-container-low transition-all flex items-center gap-2 shadow-sm font-semibold disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-lg">save</span> 
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            onClick={() => handleSaveInvoice('sent')}
            disabled={saving}
            className="px-5 py-2.5 bg-primary-container text-on-primary-container font-button text-sm rounded-lg hover:shadow-lg transition-all flex items-center gap-2 shadow-sm font-bold disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-lg">send</span> 
            {saving ? 'Processing...' : 'Generate & Issue'}
          </button>
        </div>
      </div>

      {/* Split Layout */}
      {saveSuccessMsg && (
        <div className="mb-4 p-4 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-lg flex items-center justify-between text-sm font-medium">
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600">check_circle</span>
            {saveSuccessMsg}
          </span>
          <button onClick={() => setSaveSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-900">✕</button>
        </div>
      )}
      {saveErrorMsg && (
        <div className="mb-4 p-4 bg-rose-100 border border-rose-300 text-rose-900 rounded-lg flex items-center justify-between text-sm font-medium">
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-rose-600">error</span>
            {saveErrorMsg}
          </span>
          <button onClick={() => setSaveErrorMsg(null)} className="text-rose-700 hover:text-rose-900">✕</button>
        </div>
      )}
      <div className="grid grid-cols-12 gap-8 mb-12">

        {/* LEFT: Form Builder */}
        <section className="col-span-12 lg:col-span-5 overflow-y-auto pr-2 space-y-6 pb-10 scroll-hide">

          {/* Customer Details Card */}
          <div className="bg-surface-white border border-outline-variant p-6 rounded-lg relative shadow-sm">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary-container rounded-t-lg"></div>
            <h3 className="font-label-bold text-primary uppercase text-xs tracking-widest mb-4">
              Customer & Order Metadata
            </h3>
            <div className="space-y-4">
              <div>
                <label className="font-label-bold text-deep-charcoal block mb-1 text-[11px] uppercase tracking-wider">
                  Company Name
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-surface border border-outline-variant p-2.5 rounded text-sm focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none transition-colors"
                />
              </div>

              {/* PO Number & Payment Terms Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-label-bold text-deep-charcoal block mb-1 text-[11px] uppercase tracking-wider">
                    PO Number #
                  </label>
                  <input
                    type="text"
                    value={poNumber}
                    onChange={(e) => setPoNumber(e.target.value)}
                    placeholder="e.g. PO-9941"
                    className="w-full bg-surface border border-outline-variant p-2.5 rounded text-sm font-bold text-primary focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="font-label-bold text-deep-charcoal block mb-1 text-[11px] uppercase tracking-wider">
                    Payment Terms
                  </label>
                  <select
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    className="w-full bg-surface border border-outline-variant p-2.5 rounded text-sm focus:border-primary-container outline-none"
                  >
                    {paymentTermsOptions.map((opt) => (
                      <option key={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Due Date & Client Contact */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-label-bold text-deep-charcoal block mb-1 text-[11px] uppercase tracking-wider">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-surface border border-outline-variant p-2.5 rounded text-sm focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="font-label-bold text-deep-charcoal block mb-1 text-[11px] uppercase tracking-wider">
                    Client Contact
                  </label>
                  <input
                    type="text"
                    value={clientContact}
                    onChange={(e) => setClientContact(e.target.value)}
                    className="w-full bg-surface border border-outline-variant p-2.5 rounded text-sm focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="font-label-bold text-deep-charcoal block mb-1 text-[11px] uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  type="email"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  className="w-full bg-surface border border-outline-variant p-2.5 rounded text-sm focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none transition-colors"
                />
              </div>

              <div>
                <label className="font-label-bold text-deep-charcoal block mb-1 text-[11px] uppercase tracking-wider">
                  Billing Address
                </label>
                <textarea
                  rows={2}
                  value={billingAddress}
                  onChange={(e) => setBillingAddress(e.target.value)}
                  className="w-full bg-surface border border-outline-variant p-2.5 rounded text-sm focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none transition-colors resize-none"
                />
              </div>
            </div>
          </div>

          {/* Physical Delivery & Shipping Details Card */}
          <div className="bg-surface-white border border-outline-variant p-6 rounded-lg shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-label-bold text-primary uppercase text-xs tracking-widest flex items-center gap-2">
                <span className="material-symbols-outlined text-base">local_shipping</span> Physical Delivery Logistics
              </h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requiresShipping}
                  onChange={(e) => setRequiresShipping(e.target.checked)}
                  className="w-4 h-4 text-primary rounded border-outline-variant focus:ring-primary"
                />
                <span className="text-xs font-bold text-deep-charcoal">Requires Shipping</span>
              </label>
            </div>

            {requiresShipping && (
              <div className="space-y-4 pt-2 border-t border-outline-variant">
                <div>
                  <label className="font-label-bold text-deep-charcoal block mb-1 text-[11px] uppercase tracking-wider">
                    Shipping Address (Site / Warehouse)
                  </label>
                  <textarea
                    rows={2}
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    className="w-full bg-surface border border-outline-variant p-2.5 rounded text-sm focus:border-primary-container outline-none transition-colors resize-none"
                  />
                </div>
                <div>
                  <label className="font-label-bold text-deep-charcoal block mb-1 text-[11px] uppercase tracking-wider flex items-center justify-between">
                    <span>Delivery Contact (Mandtech Representative)</span>
                    <span className="text-[10px] text-tertiary font-bold">Mandtech Dispatch</span>
                  </label>
                  <select
                    value={mandtechContact}
                    onChange={(e) => setMandtechContact(e.target.value)}
                    className="w-full bg-surface border border-outline-variant p-2.5 rounded text-sm focus:border-primary-container outline-none font-semibold text-deep-charcoal"
                  >
                    {mandtechRepOptions.map((rep) => (
                      <option key={rep}>{rep}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Line Items Card */}
          <div className="bg-surface-white border border-outline-variant p-6 rounded-lg shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
              <h3 className="font-label-bold text-primary uppercase text-xs tracking-widest">Line Items & Equipment Selection</h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setLineItems(prev => [
                      ...prev,
                      { id: `li${Date.now()}`, description: 'Sullair 185 Series Heavy Duty Air Compressor', qty: 1, unitPrice: 15500000 }
                    ]);
                  }}
                  className="text-[11px] bg-primary-container/20 text-primary font-bold px-2.5 py-1 rounded hover:bg-primary-container hover:text-white transition-colors"
                >
                  + Add Sullair 185
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLineItems(prev => [
                      ...prev,
                      { id: `li${Date.now()}`, description: 'High-Pressure Oil Filter (SL-98230-XP)', qty: 4, unitPrice: 48000 }
                    ]);
                  }}
                  className="text-[11px] bg-primary-container/20 text-primary font-bold px-2.5 py-1 rounded hover:bg-primary-container hover:text-white transition-colors"
                >
                  + Add Oil Filter
                </button>
                <button
                  onClick={addLineItem}
                  className="text-primary font-button text-sm flex items-center gap-1 hover:underline font-bold"
                >
                  <span className="material-symbols-outlined text-lg">add_circle</span> Custom Item
                </button>
              </div>
            </div>
            <div className="space-y-3">
              {lineItems.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-surface-container-low rounded border border-dashed border-outline-variant relative group"
                >
                  <button
                    onClick={() => removeLineItem(item.id)}
                    className="absolute -right-2 -top-2 bg-error text-white w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:scale-110"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                  <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-8">
                      <label className="font-label-bold text-[10px] text-secondary uppercase">Description</label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                        className="w-full bg-transparent border-b border-outline-variant py-1 text-sm focus:border-primary-container outline-none transition-colors"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="font-label-bold text-[10px] text-secondary uppercase">QTY</label>
                      <input
                        type="number"
                        value={item.qty}
                        onChange={(e) => updateLineItem(item.id, 'qty', Number(e.target.value))}
                        className="w-full bg-transparent border-b border-outline-variant py-1 text-sm text-center focus:border-primary-container outline-none transition-colors"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="font-label-bold text-[10px] text-secondary uppercase">Unit ₦</label>
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => updateLineItem(item.id, 'unitPrice', Number(e.target.value))}
                        className="w-full bg-transparent border-b border-outline-variant py-1 text-sm text-right focus:border-primary-container outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Configuration */}
          <div className="bg-surface-white border border-outline-variant p-6 rounded-lg shadow-sm">
            <h3 className="font-label-bold text-primary uppercase text-xs tracking-widest mb-4">
              Financial Settings
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="font-label-bold text-deep-charcoal block mb-1 text-[11px] uppercase tracking-wider">
                  Discount (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="w-full bg-surface border border-outline-variant p-2.5 rounded text-sm focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none"
                />
              </div>
              <div>
                <label className="font-label-bold text-deep-charcoal block mb-1 text-[11px] uppercase tracking-wider">
                  VAT Rate (%)
                </label>
                <select
                  value={vatRate}
                  onChange={(e) => setVatRate(Number(e.target.value))}
                  className="w-full bg-surface border border-outline-variant p-2.5 rounded text-sm focus:border-primary-container outline-none"
                >
                  {vatOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="font-label-bold text-deep-charcoal block mb-1 text-[11px] uppercase tracking-wider">
                Delivery Terms (Incoterms)
              </label>
              <select
                value={incoterms}
                onChange={(e) => setIncoterms(e.target.value)}
                className="w-full bg-surface border border-outline-variant p-2.5 rounded text-sm focus:border-primary-container outline-none"
              >
                {incotermsOptions.map((opt) => (
                  <option key={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* RIGHT: Live PDF Preview */}
        <section className="col-span-12 lg:col-span-7 bg-surface-container rounded-lg p-6 flex justify-center overflow-y-auto scroll-hide">
          {/* A4 canvas */}
          <div
            className="bg-white w-full max-w-[700px] flex flex-col relative overflow-hidden shadow-xl"
            style={{ aspectRatio: '1 / 1.414', padding: '48px' }}
          >
            {/* Orange Header Band */}
            <div className="absolute top-0 left-0 w-full h-10 bg-primary-container flex items-center px-10 justify-between">
              <span className="text-white font-headline-md font-bold tracking-tighter text-base">MANDTECH</span>
              <span className="text-white/80 font-label-bold text-[9px] uppercase tracking-widest">
                Official Industrial Document
              </span>
            </div>

            {/* Header Row */}
            <div className="mt-10 flex justify-between">
              <div>
                <h4 className="font-headline-lg text-primary mb-0.5 text-2xl font-bold tracking-tight">INVOICE</h4>
                <p className="text-body-sm font-bold text-xs">INV-2024-8842</p>
                {poNumber && <p className="text-[11px] text-primary font-bold mt-0.5">PO Ref: {poNumber}</p>}
                <p className="text-[10px] text-secondary mt-0.5">
                  Issued: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
                <p className="text-[10px] text-secondary">
                  Terms: <span className="font-bold text-deep-charcoal">{paymentTerms}</span> | Due: <span className="font-bold text-error">{dueDate}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-xs text-on-surface">Mandtech Industrial Solutions</p>
                <p className="text-[11px] text-secondary leading-relaxed mt-0.5">
                  12 Tech Plaza, Innovation Way<br />London, EC1V 4PY<br />VAT: GB 123 4567 89
                </p>
              </div>
            </div>

            {/* Bill To & Delivery Row */}
            <div className="mt-6 grid grid-cols-2 gap-6 border-t border-b border-surface-container py-4">
              <div>
                <p className="font-label-bold text-[10px] text-secondary mb-1 uppercase">Bill to:</p>
                <p className="font-bold text-xs text-on-surface">{companyName || '—'}</p>
                <p className="text-[11px] text-secondary leading-relaxed mt-0.5">
                  Attn: {clientContact || '—'}<br />{billingAddress || '—'}
                </p>
              </div>
              <div className="text-right">
                <p className="font-label-bold text-[10px] text-secondary mb-1 uppercase">Delivery Logistics:</p>
                <p className="text-[11px] font-bold text-deep-charcoal">{incoterms}</p>
                <p className="text-[11px] text-primary font-bold mt-0.5">Mandtech Rep: {mandtechContact}</p>
                {requiresShipping && (
                  <p className="text-[10px] text-secondary mt-1 leading-tight">
                    <span className="font-bold">Ship To:</span> {shippingAddress}
                  </p>
                )}
              </div>
            </div>

            {/* Invoice Table */}
            <div className="mt-6 flex-1 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-deep-charcoal text-white">
                    <th className="p-2 text-[10px] font-label-bold">Description</th>
                    <th className="p-2 text-[10px] font-label-bold text-center w-14">QTY</th>
                    <th className="p-2 text-[10px] font-label-bold text-right w-24">Unit Price</th>
                    <th className="p-2 text-[10px] font-label-bold text-right w-24">Total</th>
                  </tr>
                </thead>
                <tbody className="text-[11px]">
                  {lineItems.map((item, idx) => (
                    <tr key={item.id} className={idx % 2 !== 0 ? 'bg-surface' : ''}>
                      <td className="p-2 text-on-surface">{item.description || '—'}</td>
                      <td className="p-2 text-center text-secondary">{item.qty}</td>
                      <td className="p-2 text-right text-secondary">{fmt(item.unitPrice)}</td>
                      <td className="p-2 text-right font-semibold text-on-surface">
                        {fmt(item.qty * item.unitPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals & Banking */}
            <div className="mt-6 grid grid-cols-12 gap-6">
              <div className="col-span-7">
                <p className="font-label-bold text-[10px] text-secondary mb-1 uppercase">Banking Details</p>
                <div className="bg-surface p-3 border-l-2 border-primary-container text-[10px] space-y-0.5">
                  <p><span className="font-bold">Account Name:</span> Mandtech Solutions Ltd</p>
                  <p><span className="font-bold">Bank:</span> Lloyds Bank Industrial</p>
                  <p><span className="font-bold">Sort Code:</span> 00-11-22</p>
                  <p><span className="font-bold">Account No:</span> 987654321</p>
                </div>
                <div className="mt-5">
                  <p className="font-label-bold text-[10px] text-secondary mb-4 uppercase">Authorized Signature</p>
                  <div className="w-36 border-b border-deep-charcoal mb-1"></div>
                  <p className="text-[10px] text-secondary italic">{mandtechContact}</p>
                </div>
              </div>
              <div className="col-span-5 space-y-1.5">
                <div className="flex justify-between text-[12px]">
                  <span className="text-secondary">Subtotal:</span>
                  <span className="font-medium">{fmt(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-[12px] text-primary">
                    <span>Discount ({discount}%):</span>
                    <span>-{fmt(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[12px]">
                  <span className="text-secondary">VAT ({vatRate}%):</span>
                  <span className="font-medium">{fmt(vatAmount)}</span>
                </div>
                <div className="flex justify-between font-bold text-[14px] border-t-2 border-deep-charcoal pt-2 mt-2">
                  <span>Total NGN</span>
                  <span className="text-primary">{fmt(total)}</span>
                </div>
              </div>
            </div>

            {/* Footer note */}
            <div className="mt-4 pt-4 border-t border-surface-container text-center text-[9px] text-secondary italic">
              All technical installations are subject to Mandtech Standard Service Agreement v2.1. Payment terms: {paymentTerms}. Due Date: {dueDate}.
            </div>
          </div>
        </section>
      </div>

      {/* Recent Invoices Ledger */}
      {pastInvoices.length > 0 && (
        <section className="mt-12 bg-surface-white border border-outline rounded-lg p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-headline-sm text-headline-sm text-deep-charcoal">Recent Invoices &amp; Quotations</h3>
            <span className="text-xs text-secondary">{pastInvoices.length} Registered in Database</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-outline-variant text-[11px] font-label-bold text-secondary uppercase tracking-wider">
                  <th className="pb-3">Invoice #</th>
                  <th className="pb-3">Company</th>
                  <th className="pb-3">Contact</th>
                  <th className="pb-3">Subtotal</th>
                  <th className="pb-3">Total Amount</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Update Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {pastInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="py-3 font-mono font-bold text-primary">{inv.invoice_number}</td>
                    <td className="py-3 font-semibold">{inv.company}</td>
                    <td className="py-3 text-secondary">{inv.contact_name}</td>
                    <td className="py-3 text-secondary">{fmt(inv.subtotal)}</td>
                    <td className="py-3 font-bold text-on-surface">{fmt(inv.total)}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                        inv.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                        inv.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                        inv.status === 'cancelled' ? 'bg-rose-100 text-rose-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <select
                        value={inv.status}
                        onChange={(e) => handleChangeStatus(inv.id, e.target.value)}
                        className="text-xs bg-surface-container border border-outline-variant rounded px-2 py-1 font-medium"
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
        </section>
      )}
    </div>
  );
}
