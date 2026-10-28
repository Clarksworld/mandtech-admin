import { useState } from 'react';
import Layout from './components/Layout';
import type { TabType } from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import EnquiriesPage from './pages/EnquiriesPage';
import CompressorRequestsPage from './pages/CompressorRequestsPage';
import SparePartsRequestsPage from './pages/SparePartsRequestsPage';
import InventoryPage from './pages/InventoryPage';
import InvoicingPage from './pages/InvoicingPage';
import ProjectsPage from './pages/ProjectsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { isAuthenticated } from './services/authService';
import './index.css';

const searchPlaceholders: Record<TabType, string> = {
  dashboard: 'Search industrial portal...',
  'compressor-requests': 'Search compressor requests by company, brand, email…',
  'spare-parts-requests': 'Search spare parts requests by company, brand, part name, email…',
  enquiries: 'Search enquiries by name, company, email…',
  leads: 'Search requests...',
  inventory: 'Quick find machinery...',
  invoicing: 'Search invoices, equipment, or clients...',
  projects: 'Search projects or assets...',
};

export default function App() {
  const [authed, setAuthed] = useState<boolean>(isAuthenticated());
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSearchQuery('');
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
      case 'compressor-requests':
        return <CompressorRequestsPage onNavigate={handleTabChange} />;
      case 'spare-parts-requests':
        return <SparePartsRequestsPage onNavigate={handleTabChange} />;
      case 'enquiries':
        return <EnquiriesPage searchQuery={searchQuery} onNavigate={handleTabChange} />;
      case 'leads':
        return <EnquiriesPage searchQuery={searchQuery} onNavigate={handleTabChange} />;
      case 'inventory':
        return <InventoryPage searchQuery={searchQuery} />;
      case 'invoicing':
        return <InvoicingPage />;
      case 'projects':
        return <ProjectsPage />;
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
