import { useState } from 'react';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import LeadsPage from './pages/LeadsPage';
import InventoryPage from './pages/InventoryPage';
import InvoicingPage from './pages/InvoicingPage';
import ProjectsPage from './pages/ProjectsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { isAuthenticated } from './services/authService';
import './index.css';

type TabType = 'dashboard' | 'leads' | 'inventory' | 'invoicing' | 'projects';

const searchPlaceholders: Record<TabType, string> = {
  dashboard: 'Search industrial portal...',
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
      case 'leads':
        return <LeadsPage onNavigate={handleTabChange} />;
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
      searchPlaceholder={searchPlaceholders[activeTab]}
      onSearch={setSearchQuery}
      onLogout={handleLogout}
    >
      {renderPage()}
    </Layout>
  );
}
