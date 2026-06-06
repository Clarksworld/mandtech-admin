import { useState } from 'react';

interface LineItem {
  id: string;
  description: string;
  qty: number;
  unitPrice: number;
}

export default function InvoicingPage() {
  const [companyName, setCompanyName] = useState('Apex Manufacturing Ltd.');
  const [clientContact, setClientContact] = useState('Sarah Jenkins');
  const [emailAddress, setEmailAddress] = useState('s.jenkins@apex-mfg.com');
  const [billingAddress, setBillingAddress] = useState('44 Industrial Parkway, North Wing, Manchester, M17 1BR');
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
    new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(n);

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
          <button className="px-5 py-2.5 bg-surface-white border border-outline text-deep-charcoal font-button text-sm rounded-lg hover:bg-surface-container-low transition-all flex items-center gap-2 shadow-sm">
            <span className="material-symbols-outlined text-lg">save</span> Save Draft
          </button>
          <button
            onClick={() => alert('Invoice generated and sent!')}
            className="px-5 py-2.5 bg-primary-container text-on-primary-container font-button text-sm rounded-lg hover:shadow-lg transition-all flex items-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined text-lg">send</span> Generate & Send
          </button>
        </div>
      </div>

      {/* Split Layout */}
      <div className="grid grid-cols-12 gap-8 h-[calc(100vh-220px)]">

        {/* LEFT: Form Builder */}
        <section className="col-span-12 lg:col-span-5 overflow-y-auto pr-2 space-y-6 pb-10 scroll-hide">

          {/* Customer Details Card */}
          <div className="bg-surface-white border border-outline-variant p-6 rounded-lg relative shadow-sm">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary-container rounded-t-lg"></div>
            <h3 className="font-label-bold text-primary uppercase text-xs tracking-widest mb-4">
              Customer Information
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
              <div className="grid grid-cols-2 gap-4">
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

          {/* Line Items Card */}
          <div className="bg-surface-white border border-outline-variant p-6 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-label-bold text-primary uppercase text-xs tracking-widest">Line Items</h3>
              <button
                onClick={addLineItem}
                className="text-primary font-button text-sm flex items-center gap-1 hover:underline"
              >
                <span className="material-symbols-outlined text-lg">add_circle</span> Add Item
              </button>
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
                      <label className="font-label-bold text-[10px] text-secondary uppercase">Unit £</label>
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
                <p className="text-[11px] text-secondary">Date Issued: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-xs text-on-surface">Mandtech Industrial Solutions</p>
                <p className="text-[11px] text-secondary leading-relaxed mt-0.5">
                  12 Tech Plaza, Innovation Way<br />London, EC1V 4PY<br />VAT: GB 123 4567 89
                </p>
              </div>
            </div>

            {/* Bill To Row */}
            <div className="mt-6 grid grid-cols-2 gap-8 border-t border-b border-surface-container py-4">
              <div>
                <p className="font-label-bold text-[10px] text-secondary mb-1 uppercase">Bill to:</p>
                <p className="font-bold text-xs text-on-surface">{companyName || '—'}</p>
                <p className="text-[11px] text-secondary leading-relaxed mt-0.5">
                  Attn: {clientContact || '—'}<br />{billingAddress || '—'}
                </p>
              </div>
              <div className="text-right">
                <p className="font-label-bold text-[10px] text-secondary mb-1 uppercase">Delivery Terms:</p>
                <p className="text-[11px] font-bold text-deep-charcoal">{incoterms}</p>
                <p className="text-[11px] text-secondary mt-1">Contact: {emailAddress || '—'}</p>
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
                  <p className="text-[10px] text-secondary italic">Alex Thorne, Operations Lead</p>
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
                  <span>Total GBP</span>
                  <span className="text-primary">{fmt(total)}</span>
                </div>
              </div>
            </div>

            {/* Footer note */}
            <div className="mt-4 pt-4 border-t border-surface-container text-center text-[9px] text-secondary italic">
              All technical installations are subject to Mandtech Standard Service Agreement v2.1. Payment terms: Net 30 days.
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
