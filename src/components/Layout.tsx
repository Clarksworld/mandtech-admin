import React, { useState } from 'react';
import { getStoredUser, logoutAdmin } from '../services/authService';

type TabType = 'dashboard' | 'leads' | 'inventory' | 'invoicing' | 'projects';

interface LayoutProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  children: React.ReactNode;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  onLogout?: () => void;
}

export default function Layout({
  activeTab,
  onTabChange,
  children,
  searchPlaceholder = 'Search industrial portal...',
  onSearch,
  onLogout,
}: LayoutProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationActive, setNotificationActive] = useState(true);

  const currentUser = getStoredUser();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (onSearch) {
      onSearch(query);
    }
  };

  const handleLogoutClick = () => {
    logoutAdmin();
    if (onLogout) {
      onLogout();
    }
  };

  const navItems: { id: TabType; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'leads', label: 'Leads', icon: 'person_search' },
    { id: 'inventory', label: 'Inventory', icon: 'inventory_2' },
    { id: 'invoicing', label: 'Invoicing', icon: 'receipt_long' },
    { id: 'projects', label: 'Projects', icon: 'account_tree' },
  ];

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md">
      {/* Sidebar Navigation */}
      <aside className="bg-deep-charcoal h-screen w-64 fixed left-0 top-0 border-r border-white/10 transition-all duration-200 ease-in-out flex flex-col py-6 z-50">
        <div className="px-6 mb-8">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-white text-base" style={{ fontVariationSettings: "'FILL' 1" }}>precision_manufacturing</span>
            </div>
            <h1 className="font-headline-md text-headline-md text-white tracking-tight">Mandtech</h1>
          </div>
          <p className="text-white/40 text-body-sm pl-9">Admin Portal</p>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-[calc(100%-16px)] flex items-center px-4 py-3 transition-all mx-2 rounded-lg text-left relative ${
                  isActive
                    ? 'bg-primary/15 text-primary font-bold border border-primary/30'
                    : 'text-white/55 hover:text-white hover:bg-white/8'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                )}
                <span 
                  className="material-symbols-outlined mr-3"
                  style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Profile Footer */}
        <div className="px-6 mt-auto flex items-center gap-3 pt-6 border-t border-white/10">
          <div className="w-10 h-10 rounded-full bg-primary text-white font-bold flex items-center justify-center overflow-hidden shrink-0">
            {currentUser?.email ? currentUser.email.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className="overflow-hidden min-w-0">
            <p className="text-white font-bold text-body-sm truncate">
              {currentUser?.email || 'admin@mandtech.com.ng'}
            </p>
            <span className="text-[10px] bg-primary/25 text-primary-light border border-primary/40 px-1.5 py-0.5 rounded font-bold uppercase">
              {currentUser?.role || 'admin'}
            </span>
          </div>
        </div>
      </aside>

      {/* Top Navigation Bar */}
      <header className="fixed top-0 right-0 left-64 h-16 bg-white border-b border-outline-variant flex justify-between items-center px-gutter z-40">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative group max-w-md w-full">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary group-focus-within:text-primary transition-colors">
              search
            </span>
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 bg-surface-container border border-outline-variant rounded-lg text-body-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setNotificationActive(false)}
              className="relative p-2 text-secondary hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined">notifications</span>
              {notificationActive && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full"></span>
              )}
            </button>
            <button className="p-2 text-secondary hover:text-primary transition-colors">
              <span className="material-symbols-outlined">settings</span>
            </button>
          </div>
          <div className="h-6 w-px bg-outline-variant"></div>
          <div className="flex items-center gap-4">
            <button className="text-secondary dark:text-secondary-fixed text-body-sm hover:text-primary transition-colors">
              Support
            </button>
            <button 
              onClick={handleLogoutClick}
              className="bg-black text-white px-4 py-2 rounded font-button text-button hover:bg-primary transition-all font-bold"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="ml-64 pt-16 min-h-screen">
        <div className="p-gutter max-w-container-max mx-auto space-y-8">
          {children}
        </div>
      </main>
    </div>
  );
}
