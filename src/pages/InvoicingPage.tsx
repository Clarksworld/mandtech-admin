import { useState, useEffect, useMemo } from 'react';
import {
  createInvoice,
  fetchInvoices,
  updateInvoiceStatus,
  Invoice,
  LineItem as ServiceLineItem,
} from '../services/invoicingService';
import { MandtechLogo } from '../components/Logo';
import { BrandLogosFooter } from '../components/BrandLogosFooter';
import { numberToWordsNaira } from '../utils/numberToWords';
import type { InitialQuotationData } from '../services/types';

export type TemplateMode = 'parts' | 'leasing';

export interface QuotationRow {
  id: string;
  productNo: string;
  description: string;
  qty: number;
  cfm?: number;
  dailyRatePerCfm?: number;
  unitPrice: number;
  amount: number;
  isService?: boolean;
}

const DEFAULT_BANK_DETAILS = `Mandtech Services Limited
Sterling Bank Plc - 01433839162`;

const DEFAULT_TAX_ID = '33865000001';
const DEFAULT_RC = 'RC - 9324886';
const DEFAULT_PHONE = '08186538644';
const DEFAULT_EMAIL = 'mandtechserviceslimited@gmail.com';
const DEFAULT_ADDRESS = '54 Old Refinery road, Elelenwo, Port-Harcourt';

const LEASING_TERMS = [
  'Customer is hereby referred to as the Customer and the MANDTECH SERVICES LTD shall be called the Contractor.',
  'Customer shall be responsible for the Mobilization & De-Mobilization of the equipment / materials back to base in good condition. The health, safety, security & accomodation of the compressor / materials & the operator is the responsibility of the customer during the tenure of usage & Required Maintenance as recommended by OEM, using only OEM provided spares.',
  'Rentals STARTS counting from the day/date of mobilization out from Mandtech Yard, and ENDS on the day/date of return of equipment or materials to Mandtech Yard',
  'Our equipments come with an operator who shall be duely accomodated and cared for (If at Offshore Location) by Customer.',
  'Payment is Upfront of 30days/Monthly basis (for tenures up to 30days) and 7days/Weekly basis (for tenures less than 30days)',
  'Customer shall be responsible for all community related issues during the Mobilization & De-Mobilization of the equipment back to base.',
  'Days where any Strikes, Labor disputes or any other problems that interferes and stops the equipment from working, are chargeable at the normal daily rate.',
  'Any Damages to our equipments arising from usage, labor disputes, workers strike, unauthorized operation, or community related issues, the customer will be charged directly with the replacement or repair cost. (Equipment is to be Operated by Mandtech Services Trained Operator ONLY)',
  'Any additional days after completion of work wherein our equipment has not been demobilized to our base successfully, our daily rate shall apply.',
  'Any Increase in tenure of Usage of our equipment should be communicated seven days (7) ahead of the elapse of previous tenure, for proper planning.',
  'Once payment is received from customer for this contract, it is deemed that the terms stated herein has been accepted and is binding by law.',
];

const PARTS_TERMS = [
  'PAYMENT : 100% DOWN PAYMENT & ISSUE OF LPO',
  'DELIVERY : TO BE DELIVERED WITHIN 21 WORKING DAYS AFTER 100% PAYMENT RECEIPT',
  'SERVICE/COMMISSIONING/REPAIRS: TO BE CARRIED OUT ON DELIVERY OR AS AGREED UPON BY CUSOMER & VENDOR',
  'NOTE: Any item/items needed to close this order which is not included in this quote will be quoted for in a separate quote.',
];

function generateDocNumber(mode: TemplateMode, _type: 'INVOICE' | 'QUOTATION' = 'INVOICE'): string {
  const d = new Date();
  const yearSuffix = d.getFullYear().toString().slice(-2);
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  const rand = Math.floor(10 + Math.random() * 90);

  if (mode === 'leasing') {
    return `ELC0${yearSuffix}${month}${day}-${rand}`;
  }
  return `MI0${yearSuffix}${month}${day}${rand}`;
}

interface InvoicingPageProps {
  initialData?: InitialQuotationData | null;
  onClearInitialData?: () => void;
}

export default function InvoicingPage({ initialData, onClearInitialData }: InvoicingPageProps = {}) {
  // Template Mode & Document Title
  const [templateMode, setTemplateMode] = useState<TemplateMode>('parts');
  const [docHeading, setDocHeading] = useState<'INVOICE' | 'QUOTATION'>('INVOICE');

  // Customer / Recipient
  const [attentionName, setAttentionName] = useState('MRS ULOMA DIRIYAI');
  const [companyName, setCompanyName] = useState('OASIS PREFORMS SYNERGY LTD');
  const [deliveryAddress, setDeliveryAddress] = useState('REDEMPTION DRIVE, (BEHIND COCACOLA)');
  const [city, setCity] = useState('PORT HARCOURT');
  const [state, setState] = useState('RIVERS STATE');
  const [contactPhone, setContactPhone] = useState('08188888207');
  const [contactEmail, setContactEmail] = useState('uloma.diriyai@oasispreform.com');

  // Document Metadata
  const [documentNo, setDocumentNo] = useState(() => generateDocNumber('parts', 'INVOICE'));
  const [docDate, setDocDate] = useState(() => {
    const d = new Date();
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  });
  const [yourRef, setYourRef] = useState('');
  const [taxId, setTaxId] = useState(DEFAULT_TAX_ID);
  const [bankDetails, setBankDetails] = useState(DEFAULT_BANK_DETAILS);

  // Letter Opening / Salutation
  const [salutationOpening, setSalutationOpening] = useState(
    'Sequel to your request by calls for the OVERHAUL of your Atlas Copco GA15FF Air Compressor Spares\nFind below our Invoice, as we look forward to offer the best of our service.'
  );

  // Table Sub-header Band
  const [tableScopeTitle, setTableScopeTitle] = useState(
    'SUPPLY OF SPARES FOR ATLAS COPCO AIR COMPRESSOR'
  );

  // Parts Table Rows
  const [partsRows, setPartsRows] = useState<QuotationRow[]>([
    { id: 'r1', productNo: '1092 2002 83', description: 'AIR FILTER', qty: 1, unitPrice: 45017, amount: 45017 },
    { id: 'r2', productNo: '1092 2002 88', description: 'OIL FILTER KIT', qty: 1, unitPrice: 65811, amount: 65811 },
    { id: 'r3', productNo: '1092 2002 89', description: 'OIL SEPARATOR KIT', qty: 1, unitPrice: 298813, amount: 298813 },
    { id: 'r4', productNo: '2902 0161 00', description: 'UNLOADER VALVE KIT', qty: 1, unitPrice: 302131, amount: 302131 },
    { id: 'r5', productNo: '2901 1399 00', description: 'MPV KIT', qty: 1, unitPrice: 125118, amount: 125118 },
    { id: 'r6', productNo: '2901 1616 00', description: 'THERMOSTAT VALVE KIT', qty: 1, unitPrice: 65720, amount: 65720 },
    { id: 'r7', productNo: '4', description: 'OIL SEAL KIT', qty: 1, unitPrice: 219118, amount: 219118 },
    { id: 'r8', productNo: '5', description: 'SET OF REPLACEMENT BEARINGS', qty: 1, unitPrice: 927810, amount: 927810 },
    { id: 'r9', productNo: '6', description: 'SET OF REPLACEMENT SEALS', qty: 1, unitPrice: 115108, amount: 115108 },
    { id: 'r10', productNo: '7', description: 'CARBON FLUSH FLUID 10L', qty: 1, unitPrice: 251400, amount: 251400 },
    { id: 'r11', productNo: '1630 2041 20', description: 'RSF ULTRA 20L', qty: 1, unitPrice: 850000, amount: 850000 },
    { id: 'r12', productNo: '8', description: 'SERVICE CHARGE', qty: 1, unitPrice: 600000, amount: 600000, isService: true },
    { id: 'r13', productNo: '9', description: 'OUTSTATION (2 ENGINEERS 2 NIGHTS)', qty: 1, unitPrice: 0, amount: 0, isService: true },
    { id: 'r14', productNo: '10', description: 'LOGISTICS (To & From Office Lumpsum )', qty: 1, unitPrice: 50000, amount: 50000, isService: true },
  ]);

  // Leasing Table Rows
  const [leasingRows, setLeasingRows] = useState<QuotationRow[]>([
    {
      id: 'l1',
      productNo: '1',
      description: 'LEASING OF ATLAS COPCO GA37+ AIR COMPRESSOR with 15m 35mm2 4-core Electrical Cable, 20m Air Hoses (20bar), and Fittings, etc',
      qty: 1,
      cfm: 254,
      dailyRatePerCfm: 1000,
      unitPrice: 254000,
      amount: 254000,
    },
    {
      id: 'l2',
      productNo: '2',
      description: 'MOBILIZATION/DE-MOBILIZATION (Handled by Customer)',
      qty: 0,
      cfm: 0,
      dailyRatePerCfm: 0,
      unitPrice: 0,
      amount: 0,
    },
    {
      id: 'l3',
      productNo: '3',
      description: 'OPERATOR CHARGES',
      qty: 1,
      cfm: 1,
      dailyRatePerCfm: 20000,
      unitPrice: 20000,
      amount: 20000,
      isService: true,
    },
  ]);

  // Leasing Specifics
  const [commencementDate, setCommencementDate] = useState('7TH September 2026');
  const [discountedDailyOffer, setDiscountedDailyOffer] = useState<number>(120000);
  const [discountOfferDesc, setDiscountOfferDesc] = useState(
    'DISCOUNTED DAILY OFFER (BASED ON REQUESTED GA15 with 120CFM @ 10bar)'
  );
  const [leasingTermsList, setLeasingTermsList] = useState<string[]>(LEASING_TERMS);

  // Parts Terms
  const [partsTermsList, setPartsTermsList] = useState<string[]>(PARTS_TERMS);

  // Amount in words manual override toggle
  const [useCustomWords, setUseCustomWords] = useState(false);
  const [customWords, setCustomWords] = useState('');

  // Signature toggle
  const [showSignature, setShowSignature] = useState(true);

  // Saving / Database states
  const [saving, setSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);
  const [pastInvoices, setPastInvoices] = useState<Invoice[]>([]);

  // Active Rows
  const activeRows = templateMode === 'leasing' ? leasingRows : partsRows;

  // Subtotals & Taxes
  const subtotal = useMemo(() => {
    return activeRows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  }, [activeRows]);

  const vatAmount = useMemo(() => {
    return Math.round(subtotal * 0.075 * 100) / 100;
  }, [subtotal]);

  // Total
  const total = useMemo(() => {
    if (templateMode === 'leasing' && discountedDailyOffer > 0) {
      // In leasing contract image: total offer shown as discounted daily rate
      return discountedDailyOffer;
    }
    return subtotal + vatAmount;
  }, [templateMode, discountedDailyOffer, subtotal, vatAmount]);

  // Auto amount in words
  const autoWords = useMemo(() => {
    return numberToWordsNaira(total);
  }, [total]);

  const effectiveWords = useCustomWords ? customWords : autoWords;

  // Number formatting: Nigerian standard with commas and 2 decimals
  const fmtNumber = (val: number | undefined | null) => {
    if (val === undefined || val === null || isNaN(val)) return '0.00';
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  // Sync Storefront Request when received
  useEffect(() => {
    if (initialData) {
      const companyUpper = (initialData.companyName || '').toUpperCase();
      if (initialData.sourceType === 'leasing' || initialData.sourceType === 'compressor') {
        setTemplateMode('leasing');
        setDocumentNo(generateDocNumber('leasing', docHeading));
        setTableScopeTitle(`EQUIPMENT LEASING CONTRACT FOR ${companyUpper || 'FLEET LEASING'}`);
        setSalutationOpening(
          `Dear Sir,\nWe appreciate your enquiry, and hereby present our quotation for the Lease of our ${
            initialData.products?.[0]?.productName || 'Air Compressor'
          } for use at your site (${initialData.companyAddress || 'Factory Base'}). We look forward to offer the best of our Service.`
        );
      } else {
        setTemplateMode('parts');
        setDocumentNo(generateDocNumber('parts', docHeading));
        setTableScopeTitle(`SUPPLY OF SPARES & SERVICE FOR ${companyUpper || 'COMPRESSOR FLEET'}`);
        setSalutationOpening(
          `Dear Sir,\nSequel to your request for ${
            initialData.products?.[0]?.productName || 'equipment spare parts & service'
          },\nFind below our Invoice, as we look forward to offer the best of our service.`
        );
      }

      if (initialData.contactPerson) setAttentionName(initialData.contactPerson.toUpperCase());
      if (initialData.companyName) setCompanyName(companyUpper);
      if (initialData.companyAddress) setDeliveryAddress(initialData.companyAddress.toUpperCase());
      if (initialData.contactNumber) setContactPhone(initialData.contactNumber);
      if (initialData.companyEmail) setContactEmail(initialData.companyEmail);
      if (initialData.yourRef) setYourRef(initialData.yourRef);

      if (initialData.products && initialData.products.length > 0) {
        if (initialData.sourceType === 'leasing' || initialData.sourceType === 'compressor') {
          setLeasingRows([
            {
              id: `l_init_1`,
              productNo: '1',
              description: `LEASING OF ${initialData.products[0].productName.toUpperCase()} with Electrical Cable, Air Hoses (20bar), and Fittings, etc`,
              qty: 1,
              cfm: 250,
              dailyRatePerCfm: 1000,
              unitPrice: 250000,
              amount: 250000,
            },
            {
              id: `l_init_2`,
              productNo: '2',
              description: 'MOBILIZATION/DE-MOBILIZATION (Handled by Customer)',
              qty: 0,
              cfm: 0,
              dailyRatePerCfm: 0,
              unitPrice: 0,
              amount: 0,
            },
            {
              id: `l_init_3`,
              productNo: '3',
              description: 'OPERATOR CHARGES',
              qty: 1,
              cfm: 1,
              dailyRatePerCfm: 20000,
              unitPrice: 20000,
              amount: 20000,
              isService: true,
            },
          ]);
        } else {
          setPartsRows(
            initialData.products.map((p, idx) => ({
              id: `init_p_${idx}_${Date.now()}`,
              productNo: p.partNumber || `${idx + 1}`,
              description: p.productName.toUpperCase(),
              qty: p.qty || 1,
              unitPrice: p.unitPrice || 0,
              amount: (p.qty || 1) * (p.unitPrice || 0),
            }))
          );
        }
      }
    }
  }, [initialData]);

  // Load past invoices
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

  // Update line item helper
  const handleUpdateRow = (
    mode: TemplateMode,
    id: string,
    field: keyof QuotationRow,
    value: any
  ) => {
    const updater = (prev: QuotationRow[]) =>
      prev.map((row) => {
        if (row.id === id) {
          const updated = { ...row, [field]: value };
          if (field === 'qty' || field === 'unitPrice') {
            updated.amount = (Number(updated.qty) || 0) * (Number(updated.unitPrice) || 0);
          }
          if (field === 'cfm' || field === 'dailyRatePerCfm') {
            if (updated.cfm && updated.dailyRatePerCfm) {
              updated.unitPrice = updated.cfm * updated.dailyRatePerCfm;
              updated.amount = updated.unitPrice * (updated.qty || 1);
            }
          }
          return updated;
        }
        return row;
      });

    if (mode === 'leasing') {
      setLeasingRows(updater);
    } else {
      setPartsRows(updater);
    }
  };

  const handleAddRow = (mode: TemplateMode) => {
    if (mode === 'leasing') {
      const nextNo = (leasingRows.length + 1).toString();
      setLeasingRows((prev) => [
        ...prev,
        {
          id: `l_${Date.now()}`,
          productNo: nextNo,
          description: '',
          qty: 1,
          cfm: 100,
          dailyRatePerCfm: 1000,
          unitPrice: 100000,
          amount: 100000,
        },
      ]);
    } else {
      const nextNo = (partsRows.length + 1).toString();
      setPartsRows((prev) => [
        ...prev,
        {
          id: `p_${Date.now()}`,
          productNo: nextNo,
          description: '',
          qty: 1,
          unitPrice: 0,
          amount: 0,
        },
      ]);
    }
  };

  const handleRemoveRow = (mode: TemplateMode, id: string) => {
    if (mode === 'leasing') {
      if (leasingRows.length <= 1) return;
      setLeasingRows((prev) => prev.filter((r) => r.id !== id));
    } else {
      if (partsRows.length <= 1) return;
      setPartsRows((prev) => prev.filter((r) => r.id !== id));
    }
  };

  // Switch Template Mode
  const handleSwitchTemplate = (mode: TemplateMode) => {
    setTemplateMode(mode);
    setDocumentNo(generateDocNumber(mode, docHeading));
    if (mode === 'leasing') {
      setTableScopeTitle('EQUIPMENT LEASING CONTRACT FOR ATLAS COPCO GA37+ AIR COMPRESSOR with Accessories');
      setSalutationOpening(
        'Dear Sir,\nWe appreciate your enquiry, and hereby present our quotation for the Lease of our Atlas Copco GA37+ Air Compressor 254CFM 10bar\nfor use at your Factory, along Redemption way, Trans-Amadi. We look forward to offer the best of our Service.'
      );
    } else {
      setTableScopeTitle('SUPPLY OF SPARES FOR ATLAS COPCO AIR COMPRESSOR');
      setSalutationOpening(
        'Dear Sir,\nSequel to your request by calls for the OVERHAUL of your Atlas Copco GA15FF Air Compressor Spares\nFind below our Invoice, as we look forward to offer the best of our service.'
      );
    }
  };

  // Save to backend database
  const handleSaveToDatabase = async (status: 'draft' | 'sent') => {
    if (!companyName.trim()) {
      setSaveErrorMsg('Please enter the customer company name.');
      return;
    }

    setSaving(true);
    setSaveErrorMsg(null);
    setSaveSuccessMsg(null);

    const serviceLineItems: ServiceLineItem[] = activeRows.map((r, idx) => ({
      sn: idx + 1,
      part_number: r.productNo,
      product_name: r.description,
      description: r.description,
      qty: r.qty || 1,
      unit_price: r.unitPrice || 0,
      total: r.amount || 0,
    }));

    try {
      const res = await createInvoice({
        doc_type: templateMode === 'leasing' ? 'quotation' : 'invoice',
        invoice_number: documentNo.trim(),
        company: companyName.trim(),
        contact_name: attentionName.trim(),
        contact_phone: contactPhone.trim(),
        email: contactEmail.trim(),
        billing_address: `${deliveryAddress}, ${city}, ${state}`.trim(),
        sales_person: 'Mandtech Sales/Service (08186538644)',
        client_ref: yourRef.trim(),
        bank_details: bankDetails.trim(),
        amount_in_words: effectiveWords,
        terms: templateMode === 'leasing' ? leasingTermsList.join('\n') : partsTermsList.join('\n'),
        line_items: serviceLineItems,
        discount_pct: 0,
        vat_rate_pct: 7.5,
        delivery_terms: templateMode === 'leasing' ? 'Customer Mobilization' : 'Delivered within 21 days',
        currency: 'NGN',
        notes: `Scope: ${tableScopeTitle}. Ref: ${yourRef}`,
        status,
      });

      setSaveSuccessMsg(`Document ${res.data.invoice_number} saved to database as ${status.toUpperCase()}!`);
      loadPastInvoices();
      setTimeout(() => setSaveSuccessMsg(null), 6000);
    } catch (err: any) {
      setSaveErrorMsg(err.message || 'Failed to save document.');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="pb-16 text-deep-charcoal font-sans">
      {/* Print CSS Rules */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #mandtech-official-sheet, #mandtech-official-sheet * {
            visibility: visible;
          }
          #mandtech-official-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 24px 30px !important;
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
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6 no-print">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2 bg-primary/10 text-primary rounded-lg">
              <span className="material-symbols-outlined text-2xl">description</span>
            </span>
            <div>
              <h2 className="text-2xl font-black text-deep-charcoal tracking-tight flex items-center gap-2">
                Mandtech Official Contract &amp; Billing Builder
              </h2>
              <p className="text-secondary text-xs mt-0.5">
                Exact replica of Mandtech Services Limited Equipment Leasing &amp; Spare Parts Invoices.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Template Mode Switcher */}
          <div className="bg-surface-container border border-outline-variant rounded-lg p-1 flex items-center gap-1 text-xs font-bold">
            <button
              onClick={() => handleSwitchTemplate('parts')}
              className={`px-3 py-1.5 rounded transition-all flex items-center gap-1.5 ${
                templateMode === 'parts'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-secondary hover:text-deep-charcoal'
              }`}
            >
              <span className="material-symbols-outlined text-sm">build</span>
              <span>Spares &amp; Overhaul</span>
            </button>
            <button
              onClick={() => handleSwitchTemplate('leasing')}
              className={`px-3 py-1.5 rounded transition-all flex items-center gap-1.5 ${
                templateMode === 'leasing'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-secondary hover:text-deep-charcoal'
              }`}
            >
              <span className="material-symbols-outlined text-sm">car_rental</span>
              <span>Equipment Leasing</span>
            </button>
          </div>

          {/* Heading Toggle: INVOICE vs QUOTATION */}
          <div className="bg-surface-container border border-outline-variant rounded-lg p-1 flex items-center gap-1 text-xs font-bold">
            <button
              onClick={() => setDocHeading('INVOICE')}
              className={`px-3 py-1.5 rounded transition-all ${
                docHeading === 'INVOICE'
                  ? 'bg-black text-white'
                  : 'text-secondary hover:text-deep-charcoal'
              }`}
            >
              INVOICE
            </button>
            <button
              onClick={() => setDocHeading('QUOTATION')}
              className={`px-3 py-1.5 rounded transition-all ${
                docHeading === 'QUOTATION'
                  ? 'bg-black text-white'
                  : 'text-secondary hover:text-deep-charcoal'
              }`}
            >
              QUOTATION
            </button>
          </div>

          {/* Show Signature toggle */}
          <label className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-outline-variant rounded-lg text-xs font-bold text-gray-700 cursor-pointer shadow-xs">
            <input
              type="checkbox"
              checked={showSignature}
              onChange={(e) => setShowSignature(e.target.checked)}
              className="accent-primary"
            />
            <span>Signature</span>
          </label>

          {/* Print / PDF Button */}
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-white border border-outline-variant text-deep-charcoal hover:bg-surface-container font-button text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
          >
            <span className="material-symbols-outlined text-base">print</span>
            Print / PDF
          </button>

          {/* Save Draft */}
          <button
            onClick={() => handleSaveToDatabase('draft')}
            disabled={saving}
            className="px-4 py-2 bg-white border border-outline-variant text-deep-charcoal hover:bg-surface-container font-button text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-base">save</span>
            {saving ? 'Saving...' : 'Save Draft'}
          </button>

          {/* Issue Document */}
          <button
            onClick={() => handleSaveToDatabase('sent')}
            disabled={saving}
            className="px-5 py-2 bg-primary text-white hover:bg-black font-button text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-base">send</span>
            {saving ? 'Processing...' : 'Save & Issue Document'}
          </button>
        </div>
      </div>

      {/* Auto-populated from Storefront Banner */}
      {initialData && (
        <div className="mb-4 p-4 bg-primary/10 border-2 border-primary/30 rounded-xl flex items-center justify-between text-xs font-semibold text-deep-charcoal shadow-sm no-print">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-primary text-xl">auto_awesome</span>
            <span>
              Pre-filled from storefront request <strong>{initialData.yourRef || 'Reference'}</strong> for{' '}
              <strong>{initialData.companyName}</strong>. All customer details and equipment lines have been loaded into the{' '}
              <strong>{templateMode === 'leasing' ? 'Equipment Leasing' : 'Spare Parts'}</strong> format.
            </span>
          </div>
          {onClearInitialData && (
            <button
              onClick={onClearInitialData}
              className="px-2.5 py-1 bg-white border border-outline-variant hover:border-black rounded text-[11px] text-deep-charcoal font-bold transition-all shadow-2xs"
            >
              Dismiss
            </button>
          )}
        </div>
      )}

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

      {/* Grid: Editor Left (5 cols) & Live Preview Right (7 cols) */}
      <div className="grid grid-cols-12 gap-8 mb-12">
        {/* ================= LEFT: CONTROLS & FORM BUILDER ================= */}
        <section className="col-span-12 lg:col-span-5 space-y-5 no-print">
          {/* Card 1: Client / Customer Card */}
          <div className="bg-surface-white border border-outline-variant p-5 rounded-xl shadow-sm relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary rounded-t-xl" />
            <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base">business</span>
              Customer &amp; Attention Details
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-0.5">ATTENTION (Person / Title) *</label>
                <input
                  type="text"
                  value={attentionName}
                  onChange={(e) => setAttentionName(e.target.value)}
                  placeholder="e.g. MRS ULOMA DIRIYAI"
                  className="w-full bg-surface border border-outline-variant p-2 rounded text-xs focus:border-primary outline-none font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-0.5">COMPANY NAME *</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. OASIS PREFORMS SYNERGY LTD"
                  className="w-full bg-surface border border-outline-variant p-2 rounded text-xs focus:border-primary outline-none font-black text-gray-900"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-0.5">DELIVERY / SITE ADDRESS</label>
                <input
                  type="text"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="e.g. REDEMPTION DRIVE, (BEHIND COCACOLA)"
                  className="w-full bg-surface border border-outline-variant p-2 rounded text-xs focus:border-primary outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-0.5">CITY</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-surface border border-outline-variant p-2 rounded text-xs focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-0.5">STATE</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full bg-surface border border-outline-variant p-2 rounded text-xs focus:border-primary outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-0.5">CONTACT PHONE</label>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full bg-surface border border-outline-variant p-2 rounded text-xs focus:border-primary outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-0.5">EMAIL ADDRESS</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full bg-surface border border-outline-variant p-2 rounded text-xs focus:border-primary outline-none text-primary font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Document Metadata & Bank Details */}
          <div className="bg-surface-white border border-outline-variant p-5 rounded-xl shadow-sm">
            <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base">receipt_long</span>
              Document Meta &amp; Bank Details
            </h3>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <label className="font-bold text-gray-700">DOCUMENT NO.</label>
                    <button
                      type="button"
                      onClick={() => setDocumentNo(generateDocNumber(templateMode, docHeading))}
                      className="text-[10px] text-primary hover:underline font-bold"
                    >
                      Re-roll
                    </button>
                  </div>
                  <input
                    type="text"
                    value={documentNo}
                    onChange={(e) => setDocumentNo(e.target.value)}
                    className="w-full bg-surface border border-outline-variant p-2 rounded text-xs font-mono font-black text-gray-900 focus:border-primary outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-0.5">DATE</label>
                  <input
                    type="text"
                    value={docDate}
                    onChange={(e) => setDocDate(e.target.value)}
                    className="w-full bg-surface border border-outline-variant p-2 rounded text-xs focus:border-primary outline-none font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-0.5">YOUR REF</label>
                  <input
                    type="text"
                    value={yourRef}
                    onChange={(e) => setYourRef(e.target.value)}
                    placeholder="e.g. Call / RFQ Ref"
                    className="w-full bg-surface border border-outline-variant p-2 rounded text-xs focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-0.5">TAX ID (TIN)</label>
                  <input
                    type="text"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    className="w-full bg-surface border border-outline-variant p-2 rounded text-xs font-mono focus:border-primary outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-0.5">OUR BANK DETAILS</label>
                <textarea
                  rows={2}
                  value={bankDetails}
                  onChange={(e) => setBankDetails(e.target.value)}
                  className="w-full bg-surface border border-outline-variant p-2 rounded text-xs font-mono focus:border-primary outline-none resize-none font-medium"
                />
              </div>

              {templateMode === 'leasing' && (
                <div>
                  <label className="font-bold text-gray-700 block mb-0.5">COMMENCEMENT DATE</label>
                  <input
                    type="text"
                    value={commencementDate}
                    onChange={(e) => setCommencementDate(e.target.value)}
                    placeholder="e.g. 7TH September 2026"
                    className="w-full bg-surface border border-outline-variant p-2 rounded text-xs font-bold text-primary focus:border-primary outline-none"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Card 3: Salutation Letter & Table Scope */}
          <div className="bg-surface-white border border-outline-variant p-5 rounded-xl shadow-sm">
            <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base">edit_note</span>
              Letter Salutation &amp; Table Header Band
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-0.5">SALUTATION OPENING PARAGRAPH</label>
                <textarea
                  rows={3}
                  value={salutationOpening}
                  onChange={(e) => setSalutationOpening(e.target.value)}
                  className="w-full bg-surface border border-outline-variant p-2 rounded text-xs focus:border-primary outline-none resize-none leading-relaxed"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-0.5">TABLE SUB-HEADER SCOPE</label>
                <input
                  type="text"
                  value={tableScopeTitle}
                  onChange={(e) => setTableScopeTitle(e.target.value)}
                  className="w-full bg-surface border border-outline-variant p-2 rounded text-xs font-bold text-gray-900 focus:border-primary outline-none"
                />
              </div>
            </div>
          </div>

          {/* Card 4: Products / Requisition Items */}
          <div className="bg-surface-white border border-outline-variant p-5 rounded-xl shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">format_list_numbered</span>
                Line Items ({activeRows.length})
              </h3>
              <button
                type="button"
                onClick={() => handleAddRow(templateMode)}
                className="px-2.5 py-1 bg-primary text-white text-xs font-bold rounded hover:bg-black transition-all flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-xs">add</span>
                Add Item
              </button>
            </div>

            <div className="space-y-3 text-xs max-h-96 overflow-y-auto pr-1">
              {activeRows.map((row, idx) => (
                <div
                  key={row.id}
                  className="p-3 bg-surface-container-low rounded-lg border border-outline-variant space-y-2 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-black text-white px-2 py-0.5 rounded">
                      #{idx + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-primary">
                        =N= {fmtNumber(row.amount)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(templateMode, row.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-4">
                      <label className="text-[10px] font-bold text-gray-500 uppercase block mb-0.5">
                        {templateMode === 'leasing' ? 'Product No.' : 'Part Number'}
                      </label>
                      <input
                        type="text"
                        value={row.productNo}
                        onChange={(e) => handleUpdateRow(templateMode, row.id, 'productNo', e.target.value)}
                        className="w-full bg-white border border-outline-variant p-1.5 rounded text-xs font-mono font-bold outline-none"
                      />
                    </div>
                    <div className="col-span-8">
                      <label className="text-[10px] font-bold text-gray-500 uppercase block mb-0.5">
                        Description
                      </label>
                      <input
                        type="text"
                        value={row.description}
                        onChange={(e) => handleUpdateRow(templateMode, row.id, 'description', e.target.value)}
                        className="w-full bg-white border border-outline-variant p-1.5 rounded text-xs font-medium outline-none"
                      />
                    </div>
                  </div>

                  {templateMode === 'leasing' ? (
                    <div className="grid grid-cols-12 gap-2 pt-1 border-t border-outline-variant/60">
                      <div className="col-span-4">
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-0.5">CFM</label>
                        <input
                          type="number"
                          value={row.cfm || 0}
                          onChange={(e) => handleUpdateRow(templateMode, row.id, 'cfm', Number(e.target.value))}
                          className="w-full bg-white border border-outline-variant p-1.5 rounded text-xs text-center font-bold outline-none"
                        />
                      </div>
                      <div className="col-span-4">
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-0.5">Daily Rate (=N=)</label>
                        <input
                          type="number"
                          value={row.dailyRatePerCfm || 0}
                          onChange={(e) => handleUpdateRow(templateMode, row.id, 'dailyRatePerCfm', Number(e.target.value))}
                          className="w-full bg-white border border-outline-variant p-1.5 rounded text-xs text-right font-mono outline-none"
                        />
                      </div>
                      <div className="col-span-4">
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-0.5">Amount (=N=)</label>
                        <input
                          type="number"
                          value={row.amount || 0}
                          onChange={(e) => handleUpdateRow(templateMode, row.id, 'amount', Number(e.target.value))}
                          className="w-full bg-white border border-outline-variant p-1.5 rounded text-xs text-right font-mono font-bold outline-none"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-12 gap-2 pt-1 border-t border-outline-variant/60">
                      <div className="col-span-3">
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-0.5">Qty</label>
                        <input
                          type="number"
                          min="1"
                          value={row.qty}
                          onChange={(e) => handleUpdateRow(templateMode, row.id, 'qty', Number(e.target.value))}
                          className="w-full bg-white border border-outline-variant p-1.5 rounded text-xs text-center font-bold outline-none"
                        />
                      </div>
                      <div className="col-span-4">
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-0.5">Unit Price (=N=)</label>
                        <input
                          type="number"
                          value={row.unitPrice}
                          onChange={(e) => handleUpdateRow(templateMode, row.id, 'unitPrice', Number(e.target.value))}
                          className="w-full bg-white border border-outline-variant p-1.5 rounded text-xs text-right font-mono outline-none"
                        />
                      </div>
                      <div className="col-span-5">
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-0.5">Amount (=N=)</label>
                        <input
                          type="number"
                          value={row.amount}
                          onChange={(e) => handleUpdateRow(templateMode, row.id, 'amount', Number(e.target.value))}
                          className="w-full bg-white border border-outline-variant p-1.5 rounded text-xs text-right font-mono font-bold outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {templateMode === 'leasing' && (
              <div className="mt-4 pt-3 border-t border-outline-variant space-y-2">
                <label className="text-[11px] font-bold text-gray-700 block">
                  DISCOUNTED DAILY OFFER VALUE (=N=)
                </label>
                <input
                  type="number"
                  value={discountedDailyOffer}
                  onChange={(e) => setDiscountedDailyOffer(Number(e.target.value))}
                  className="w-full bg-white border border-outline-variant p-2 rounded text-sm font-mono font-black text-primary outline-none"
                />
                <input
                  type="text"
                  value={discountOfferDesc}
                  onChange={(e) => setDiscountOfferDesc(e.target.value)}
                  className="w-full bg-surface border border-outline-variant p-1.5 rounded text-xs text-gray-600 outline-none"
                />
              </div>
            )}
          </div>

          {/* Card 5: Terms & Amount in Words */}
          <div className="bg-surface-white border border-outline-variant p-5 rounded-xl shadow-sm space-y-3 text-xs">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">gavel</span>
                Terms &amp; Custom Words
              </h3>
              <button
                type="button"
                onClick={() => setUseCustomWords(!useCustomWords)}
                className="text-[10px] text-primary hover:underline font-bold"
              >
                {useCustomWords ? 'Use Auto Words' : 'Custom Words'}
              </button>
            </div>

            {useCustomWords && (
              <div>
                <label className="font-bold text-gray-700 block mb-0.5">OVERRIDE AMOUNT IN WORDS</label>
                <input
                  type="text"
                  value={customWords}
                  onChange={(e) => setCustomWords(e.target.value)}
                  placeholder="e.g. One Hundred & Twenty Thousand Naira Only"
                  className="w-full bg-white border border-outline-variant p-2 rounded text-xs font-bold outline-none"
                />
              </div>
            )}

            <div>
              <label className="font-bold text-gray-700 block mb-0.5">
                {templateMode === 'leasing' ? 'LEASING TERMS (11 CLAUSES)' : 'PARTS TERMS & CONDITIONS'}
              </label>
              <textarea
                rows={5}
                value={templateMode === 'leasing' ? leasingTermsList.join('\n') : partsTermsList.join('\n')}
                onChange={(e) => {
                  const lines = e.target.value.split('\n').filter((l) => l.trim().length > 0);
                  if (templateMode === 'leasing') setLeasingTermsList(lines);
                  else setPartsTermsList(lines);
                }}
                className="w-full bg-surface border border-outline-variant p-2 rounded text-[11px] font-mono leading-relaxed outline-none resize-none"
              />
            </div>
          </div>
        </section>

        {/* ================= RIGHT: EXACT 1:1 REPLICA LIVE PREVIEW ================= */}
        <section className="col-span-12 lg:col-span-7 bg-surface-container rounded-xl p-3 lg:p-6 flex justify-center items-start overflow-x-auto">
          {/* Printable Sheet */}
          <div
            id="mandtech-official-sheet"
            className="bg-white w-full max-w-[760px] shadow-2xl border-2 border-black p-6 sm:p-8 font-sans text-black relative"
            style={{ minHeight: '1060px', color: '#000000', fontSize: '11px', lineHeight: 1.35 }}
          >
            {/* Header: Logo & Mandtech Contact Info */}
            <div className="flex justify-between items-start mb-2">
              <div>
                <MandtechLogo height={34} variant="light" />
                <div className="mt-2 flex items-center gap-3 text-[10px] font-black tracking-wide">
                  <span>{DEFAULT_RC}</span>
                  <span className="text-[#336699] font-bold italic">
                    DISTRIBUTORS OF <strong className="text-[#00A859] font-black not-italic">DENAIR</strong> AIR COMPRESSORS IN NIGERIA
                  </span>
                </div>
              </div>

              <div className="text-right text-[10px] leading-tight">
                <p className="font-black text-xs uppercase tracking-tight">MANDTECH SERVICES LIMITED</p>
                <p className="mt-0.5">{DEFAULT_ADDRESS}</p>
                <p className="font-mono">{DEFAULT_EMAIL}</p>
                <p className="font-bold">Sales/Service: {DEFAULT_PHONE}</p>
              </div>
            </div>

            {/* Document Title Banner for Leasing Mode */}
            {templateMode === 'leasing' && (
              <div className="w-full text-center py-1.5 bg-black text-white font-black text-xs uppercase tracking-widest border border-black mb-0">
                EQUIPMENT LEASING CONTRACT - {docHeading}
              </div>
            )}

            {/* Attention & Document Meta Box */}
            <div className={`w-full border-2 border-black ${templateMode === 'leasing' ? 'border-t-0' : 'mt-2'} mb-3`}>
              {/* Optional INVOICE box on parts template */}
              {templateMode === 'parts' && (
                <div className="w-full text-center py-1 bg-black text-white font-black text-xs uppercase tracking-widest border-b border-black">
                  {docHeading}
                </div>
              )}

              <div className="grid grid-cols-12">
                {/* Left: Customer Info */}
                <div className="col-span-7 p-2.5 border-r-2 border-black text-[11px] leading-relaxed">
                  <p className="font-black">
                    {templateMode === 'leasing' ? 'ATTENTION:' : 'ATTN:'} {attentionName}
                  </p>
                  <p className="font-black text-xs">{companyName}</p>
                  <p>{deliveryAddress}</p>
                  <p>{city}</p>
                  <p>{state}</p>
                  <p className="font-mono mt-0.5">
                    {contactPhone}{' '}
                    <span className="underline ml-2 text-blue-700">{contactEmail}</span>
                  </p>
                </div>

                {/* Right: Metadata Grid */}
                <div className="col-span-5 text-[10px]">
                  <div className="grid grid-cols-12 border-b border-black">
                    <span className="col-span-5 p-1 font-black bg-gray-100 border-r border-black uppercase">
                      {templateMode === 'leasing' ? 'DOCUMENT NO:' : 'DOC.NO.:'}
                    </span>
                    <span className="col-span-7 p-1 font-mono font-black">{documentNo}</span>
                  </div>
                  <div className="grid grid-cols-12 border-b border-black">
                    <span className="col-span-5 p-1 font-black bg-gray-100 border-r border-black uppercase">DATE:</span>
                    <span className="col-span-7 p-1 font-medium">{docDate}</span>
                  </div>
                  <div className="grid grid-cols-12 border-b border-black">
                    <span className="col-span-5 p-1 font-black bg-gray-100 border-r border-black uppercase">YOUR REF:</span>
                    <span className="col-span-7 p-1 font-medium">{yourRef || '—'}</span>
                  </div>
                  <div className="grid grid-cols-12 border-b border-black">
                    <span className="col-span-5 p-1 font-black bg-gray-100 border-r border-black uppercase">TAX ID:</span>
                    <span className="col-span-7 p-1 font-mono font-medium">{taxId}</span>
                  </div>
                  <div className="grid grid-cols-12">
                    <span className="col-span-5 p-1 font-black bg-gray-100 border-r border-black uppercase">Bank Details:</span>
                    <span className="col-span-7 p-1 text-[9px] font-bold leading-tight whitespace-pre-line">
                      {bankDetails}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Salutation Opening */}
            <div className="mb-3 text-[11px] leading-relaxed">
              <p className="font-bold">Dear Sir,</p>
              <p className="whitespace-pre-line mt-0.5">{salutationOpening}</p>
            </div>

            {/* Main Table */}
            <div className="w-full border-2 border-black mb-0 overflow-hidden">
              {/* Table Sub-header Band */}
              <div className="bg-gray-100 text-center py-1 font-black text-[10px] uppercase tracking-wide border-b-2 border-black">
                {tableScopeTitle}
              </div>

              {templateMode === 'leasing' ? (
                /* LEASING TABLE */
                <table className="w-full text-left border-collapse text-[10px]">
                  <thead>
                    <tr className="bg-white border-b-2 border-black font-black text-center">
                      <th className="p-1.5 border-r border-black w-20">Product No.</th>
                      <th className="p-1.5 border-r border-black text-left">Description</th>
                      <th className="p-1.5 border-r border-black w-12">CFM</th>
                      <th className="p-1.5 border-r border-black w-20">Daily Rate =N=</th>
                      <th className="p-1.5 border-r border-black w-24">Daily Rate =N=</th>
                      <th className="p-1.5 w-24">Amount =N=</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leasingRows.map((r) => (
                      <tr key={r.id} className="border-b border-black">
                        <td className="p-2 text-center font-bold border-r border-black align-top">
                          {r.productNo}
                        </td>
                        <td className="p-2 border-r border-black font-bold uppercase leading-tight align-top">
                          {r.description}
                        </td>
                        <td className="p-2 text-center font-mono border-r border-black align-top">
                          {r.cfm}
                        </td>
                        <td className="p-2 text-right font-mono border-r border-black align-top">
                          {fmtNumber(r.dailyRatePerCfm)}
                        </td>
                        <td className="p-2 text-right font-mono border-r border-black align-top font-bold">
                          {fmtNumber(r.unitPrice)}
                        </td>
                        <td className="p-2 text-right font-mono font-bold align-top">
                          {fmtNumber(r.amount)}
                        </td>
                      </tr>
                    ))}

                    {/* Subtotal & Signature Block */}
                    <tr className="border-b-2 border-black">
                      <td colSpan={3} rowSpan={4} className="p-2 border-r-2 border-black align-top bg-white">
                        <span className="font-black block uppercase text-[10px]">Authorised Signature:</span>
                        {showSignature && (
                          <div className="pt-2 pl-3">
                            {/* Stylized blue signature */}
                            <svg className="w-32 h-10 text-blue-800" viewBox="0 0 160 50" fill="none">
                              <path
                                d="M 10 35 C 30 10, 45 40, 60 15 C 75 -5, 90 45, 105 25 C 120 10, 135 30, 150 15"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                              <path
                                d="M 25 38 C 50 42, 100 45, 145 36"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                              />
                            </svg>
                          </div>
                        )}
                      </td>
                      <td colSpan={2} className="p-1.5 border-r border-black font-black text-right uppercase text-[9px]">
                        DAILY SUBTOTAL FOR ONE EQUIPMENT
                      </td>
                      <td className="p-1.5 font-mono font-bold text-right text-[10px]">
                        {fmtNumber(subtotal)}
                      </td>
                    </tr>
                    <tr className="border-b border-black">
                      <td colSpan={2} className="p-1.5 border-r border-black font-black text-right uppercase text-[9px]">
                        VAT 7.5%
                      </td>
                      <td className="p-1.5 font-mono font-bold text-right text-[10px]">
                        {fmtNumber(vatAmount)}
                      </td>
                    </tr>
                    <tr className="border-b-2 border-black">
                      <td colSpan={2} className="p-1.5 border-r border-black font-black text-right uppercase text-[9px]">
                        DAILY TOTAL FOR {leasingRows[0]?.cfm || 233} CFM
                      </td>
                      <td className="p-1.5 font-mono font-bold text-right text-[10px]">
                        {fmtNumber(subtotal + vatAmount)}
                      </td>
                    </tr>
                    <tr className="bg-gray-100 font-black">
                      <td colSpan={2} className="p-1.5 border-r border-black text-right uppercase text-[9px]">
                        {discountOfferDesc}
                      </td>
                      <td className="p-1.5 font-mono font-black text-right text-xs">
                        {fmtNumber(discountedDailyOffer)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                /* SPARE PARTS TABLE */
                <table className="w-full text-left border-collapse text-[10px]">
                  <thead>
                    <tr className="bg-white border-b-2 border-black font-black text-center">
                      <th className="p-1.5 border-r border-black w-28 text-left">Product No.</th>
                      <th className="p-1.5 border-r border-black text-left">Description</th>
                      <th className="p-1.5 border-r border-black w-10">Qty</th>
                      <th className="p-1.5 border-r border-black w-24 text-right">Unit Price =N=</th>
                      <th className="p-1.5 w-24 text-right">Amount =N=</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partsRows.map((r) => (
                      <tr key={r.id} className="border-b border-black">
                        <td className="p-1 border-r border-black font-mono font-bold">
                          {r.productNo}
                        </td>
                        <td className="p-1 border-r border-black font-bold uppercase">
                          {r.description}
                        </td>
                        <td className="p-1 border-r border-black text-center font-bold">
                          {r.qty}
                        </td>
                        <td className="p-1 border-r border-black text-right font-mono">
                          {fmtNumber(r.unitPrice)}
                        </td>
                        <td className="p-1 text-right font-mono font-bold">
                          {fmtNumber(r.amount)}
                        </td>
                      </tr>
                    ))}

                    {/* Subtotal & Signature Block */}
                    <tr className="border-b border-black">
                      <td colSpan={2} rowSpan={3} className="p-2 border-r-2 border-black align-top bg-white">
                        <span className="font-black block uppercase text-[10px]">Authorised Signature:</span>
                        {showSignature && (
                          <div className="pt-2 pl-3">
                            <svg className="w-32 h-10 text-blue-800" viewBox="0 0 160 50" fill="none">
                              <path
                                d="M 10 35 C 30 10, 45 40, 60 15 C 75 -5, 90 45, 105 25 C 120 10, 135 30, 150 15"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                              <path
                                d="M 25 38 C 50 42, 100 45, 145 36"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                              />
                            </svg>
                          </div>
                        )}
                      </td>
                      <td colSpan={2} className="p-1.5 border-r border-black font-black text-right uppercase text-[10px]">
                        SUBTOTAL
                      </td>
                      <td className="p-1.5 font-mono font-bold text-right text-[11px]">
                        {fmtNumber(subtotal)}
                      </td>
                    </tr>
                    <tr className="border-b border-black">
                      <td colSpan={2} className="p-1.5 border-r border-black font-black text-right uppercase text-[10px]">
                        VAT (7.5%)
                      </td>
                      <td className="p-1.5 font-mono font-bold text-right text-[11px]">
                        {fmtNumber(vatAmount)}
                      </td>
                    </tr>
                    <tr className="bg-gray-100 font-black">
                      <td colSpan={2} className="p-1.5 border-r border-black text-right uppercase text-[10px]">
                        TOTAL
                      </td>
                      <td className="p-1.5 font-mono font-black text-right text-xs">
                        {fmtNumber(subtotal + vatAmount)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>

            {/* Amount in words banner */}
            <div className="border-2 border-t-0 border-black p-1.5 text-center font-bold text-[10px] bg-white">
              {effectiveWords}
            </div>

            {/* Terms and Conditions Section */}
            {templateMode === 'leasing' ? (
              /* 11 LEASING TERMS */
              <div className="border-2 border-t-0 border-black p-2 text-[8.5px] leading-snug">
                <div className="flex justify-between items-center mb-1 font-black uppercase text-[9px] border-b border-black pb-0.5">
                  <span>TERMS &amp; CONDITIONS:</span>
                  <span>COMMENCEMENT DATE: {commencementDate}</span>
                </div>
                <ol className="list-decimal pl-3 space-y-0.5">
                  {leasingTermsList.slice(0, 10).map((term, idx) => (
                    <li key={idx} className="pl-0.5">
                      {term}
                    </li>
                  ))}
                </ol>
                {/* Yellow Highlighted Clause 11 */}
                <div className="mt-1 p-1 bg-[#FFFF00] font-bold text-black border border-black/40 text-[8.5px]">
                  11. {leasingTermsList[10] || LEASING_TERMS[10]}
                </div>
              </div>
            ) : (
              /* PARTS TERMS */
              <div className="border-2 border-t-0 border-black p-2 text-[9px] leading-normal font-bold space-y-0.5 bg-white">
                {partsTermsList.map((term, idx) => {
                  const isNote = term.startsWith('NOTE:');
                  return (
                    <p key={idx} className={isNote ? 'bg-[#FFFF00] p-0.5 border border-black/40 inline-block font-black mt-0.5' : ''}>
                      {term}
                    </p>
                  );
                })}
              </div>
            )}

            {/* Bottom Authorized Brand Logos Strip */}
            <BrandLogosFooter />
          </div>
        </section>
      </div>

      {/* ================= PAST LEDGER ================= */}
      <section className="bg-surface-white border border-outline-variant rounded-xl p-6 shadow-sm no-print">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-black text-deep-charcoal">
              Registered Documents &amp; Invoices
            </h3>
            <p className="text-secondary text-xs mt-0.5">
              History of generated equipment leases and parts overhaul documents.
            </p>
          </div>
          <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
            {pastInvoices.length} Registered
          </span>
        </div>

        {pastInvoices.length === 0 ? (
          <div className="text-center py-8 text-secondary text-xs">
            No registered documents yet. Use the builder above to save your first document.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-outline-variant text-[10px] font-bold text-secondary uppercase tracking-wider">
                  <th className="pb-3">Doc No.</th>
                  <th className="pb-3">Company</th>
                  <th className="pb-3">Contact</th>
                  <th className="pb-3">Subtotal</th>
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
                    <td className="py-3 font-bold text-gray-900">
                      {inv.company}
                    </td>
                    <td className="py-3 text-secondary">
                      {inv.contact_name}
                    </td>
                    <td className="py-3 font-mono">{fmtNumber(inv.subtotal)}</td>
                    <td className="py-3 font-mono font-bold text-gray-900">{fmtNumber(inv.total)}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-primary/15 text-primary border border-primary/30">
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
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
