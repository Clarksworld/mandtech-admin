import { useState } from 'react';
import Layout from './components/Layout';
import type { TabType } from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import EnquiriesPage from './pages/EnquiriesPage';
import CompressorRequestsPage from './pages/CompressorRequestsPage';
import SparePartsRequestsPage from './pages/SparePartsRequestsPage';
import LeasingRequestsPage from './pages/LeasingRequestsPage';
import LubricantsRequestsPage from './pages/LubricantsRequestsPage';
import OrdersPage from './pages/OrdersPage';
import InventoryPage from './pages/InventoryPage';
import InvoicingPage from './pages/InvoicingPage';
import ProposalsHistoryPage from './pages/ProposalsHistoryPage';
import CustomerDMSPage from './pages/CustomerDMSPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { isAuthenticated } from './services/authService';
import type { InitialQuotationData } from './services/types';
import type { Invoice } from './services/invoicingService';
import './index.css';

const searchPlaceholders: Record<TabType, string> = {
  dashboard: 'Search industrial portal...',
  'customer-dms': 'Search customer folders by company, contact, location…',
  orders: 'Search orders by order ID, company, email, hub...',
  'compressor-requests': 'Search compressor requests by company, brand, email…',
  'spare-parts-requests': 'Search spare parts requests by company, brand, part name, email…',
  'leasing-requests': 'Search leasing requests by company, duration, hub, email…',
  'lubricant-requests': 'Search lubricant requests by company, fluid spec, volume, hub…',
  enquiries: 'Search enquiries by name, company, email…',
  leads: 'Search requests...',
  inventory: 'Quick find machinery...',
  invoicing: 'Search quotations, invoices, equipment, or clients...',
  proposals: 'Search sent proposals by doc no, company, contact, email...',
};

export default function App() {
  const [authed, setAuthed] = useState<boolean>(isAuthenticated());
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [quotationDraft, setQuotationDraft] = useState<InitialQuotationData | null>(null);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSearchQuery('');
  };

  const handlePrepareQuotation = (data: InitialQuotationData) => {
    setQuotationDraft(data);
    setActiveTab('invoicing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditInBuilder = (invoice: Invoice) => {
    setQuotationDraft({
      companyName: invoice.company,
      contactPerson: invoice.contact_name,
      contactNumber: invoice.contact_phone,
      companyEmail: invoice.email,
      companyAddress: invoice.billing_address,
      yourRef: invoice.client_ref || invoice.invoice_number,
      sourceType: invoice.doc_type === 'quotation' ? 'leasing' : 'spare_parts',
      products: (invoice.line_items || []).map((li) => ({
        partNumber: li.part_number,
        productName: li.description || li.product_name || '',
        qty: li.qty,
        unitPrice: li.unit_price,
      })),
      notes: invoice.notes,
    });
    setActiveTab('invoicing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoginSuccess = () => {
    setAuthed(true);
  };

  const handleLogout = () => {
    setAuthed(false);
    setAuthMode('login');
  };

  if (!authed) {
    if (authMode === 'register') {
      return (
        <RegisterPage
          onRegisterSuccess={handleLoginSuccess}
          onSwitchToLogin={() => setAuthMode('login')}
        />
      );
    }
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        onSwitchToRegister={() => setAuthMode('register')}
      />
    );
  }

  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage onNavigate={handleTabChange} />;
      case 'customer-dms':
        return <CustomerDMSPage onNavigate={handleTabChange} onPrepareQuotation={handlePrepareQuotation} />;
      case 'orders':
        return <OrdersPage onNavigate={handleTabChange} onPrepareQuotation={handlePrepareQuotation} />;
      case 'compressor-requests':
        return <CompressorRequestsPage onNavigate={handleTabChange} onPrepareQuotation={handlePrepareQuotation} />;
      case 'spare-parts-requests':
        return <SparePartsRequestsPage onNavigate={handleTabChange} onPrepareQuotation={handlePrepareQuotation} />;
      case 'leasing-requests':
        return <LeasingRequestsPage onNavigate={handleTabChange} onPrepareQuotation={handlePrepareQuotation} />;
      case 'lubricant-requests':
        return <LubricantsRequestsPage onNavigate={handleTabChange} onPrepareQuotation={handlePrepareQuotation} />;
      case 'enquiries':
        return <EnquiriesPage searchQuery={searchQuery} onNavigate={handleTabChange} onPrepareQuotation={handlePrepareQuotation} />;
      case 'leads':
        return <EnquiriesPage searchQuery={searchQuery} onNavigate={handleTabChange} onPrepareQuotation={handlePrepareQuotation} />;
      case 'inventory':
        return <InventoryPage searchQuery={searchQuery} />;
      case 'invoicing':
        return (
          <InvoicingPage
            initialData={quotationDraft}
            onClearInitialData={() => setQuotationDraft(null)}
            onNavigate={handleTabChange}
          />
        );
      case 'proposals':
        return (
          <ProposalsHistoryPage
            searchQuery={searchQuery}
            onNavigate={handleTabChange}
            onEditInBuilder={handleEditInBuilder}
          />
        );
      default:
        return <DashboardPage />;
    }
  };

  return (
    <Layout
      activeTab={activeTab}
      onTabChange={handleTabChange}
      searchPlaceholder={searchPlaceholders[activeTab] || 'Search...'}
      onSearch={setSearchQuery}
      onLogout={handleLogout}
    >
      {renderPage()}
    </Layout>
  );
}
