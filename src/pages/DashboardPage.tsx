import { useState, useEffect } from 'react';
import { checkBackendHealth } from '../services/authService';
import { fetchDashboardStats, DashboardStats } from '../services/dashboardService';
import { fetchInquiries } from '../services/leadsService';
import { Inquiry } from '../services/types';

interface DashboardPageProps {
  onNavigate?: (tab: 'dashboard' | 'leads' | 'inventory' | 'invoicing' | 'projects') => void;
}

export default function DashboardPage({ onNavigate }: DashboardPageProps) {
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentInquiries, setRecentInquiries] = useState<Inquiry[]>([]);

  useEffect(() => {
    checkBackendHealth().then((online) => {
      setApiOnline(online);
      if (online) {
        fetchDashboardStats()
          .then((res) => setStats(res.data))
          .catch(() => {});
        fetchInquiries({ limit: 4 })
          .then((res) => {
            if (res && res.data) setRecentInquiries(res.data);
          })
          .catch(() => {});
      }
    });
  }, []);

  const defaultRequests: Inquiry[] = [
    {
      id: '1',
      name: 'David Chen',
      company: 'Global Logistics Corp',
      email: 'd.chen@global-logistics.com',
      message: 'Inquiry about heavy excavator lease terms.',
      equipment_interests: ['Heavy Excavators'],
      created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    },
    {
      id: '2',
      name: 'Sarah Miller',
      company: 'Apex Construction Ltd.',
      email: 's.miller@apex-construction.com',
      message: 'Technical spec request for Generator Set #44.',
      equipment_interests: ['Generator Sets'],
      created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    },
    {
      id: '3',
      name: 'John Doe',
      company: 'Urban Dev Group',
      email: 'j.doe@urbandev.com',
      message: 'Urgent maintenance request for onsite rotary compressor.',
      equipment_interests: ['Rotary Compressors'],
      created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    },
  ];

  const displayRequests: Inquiry[] = recentInquiries.length > 0 ? recentInquiries : defaultRequests;

  const tasks = {
    inProgress: [
      { id: 't1', title: 'Inventory Audit - Sector 4', user: 'James Wilson' },
      { id: 't2', title: 'Invoicing Cycle: Client X', user: 'Sarah Kay' },
    ],
    backlog: [
      { id: 't3', title: 'New Staff Onboarding Docs', user: 'HR Team' },
      { id: 't4', title: 'Website API Integration', user: 'Alex Rivera' },
    ],
  };

  const utilizationData = [
    { day: 'MON', percentage: '40%', active: false },
    { day: 'TUE', percentage: '60%', active: false },
    { day: 'WED', percentage: '85%', active: true },
    { day: 'THU', percentage: '55%', active: false },
    { day: 'FRI', percentage: '70%', active: false },
    { day: 'SAT', percentage: '95%', active: true },
    { day: 'SUN', percentage: '45%', active: false },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* 1. Staff Attendance & API Banner */}
      <section className="bg-surface-white border border-outline-variant rounded-lg p-6 flex items-center justify-between shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-primary-container"></div>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
              how_to_reg
            </span>
          </div>
          <div>
            <div className="flex items-center gap-3">
              <p className="font-label-bold text-primary uppercase text-xs tracking-wider">Staff Attendance</p>
              {apiOnline === true && (
                <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  REST API Connected
                </span>
              )}
              {apiOnline === false && (
                <span className="inline-flex items-center gap-1 text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                  API Offline (Mock Mode)
                </span>
              )}
            </div>
            <h2 className="font-headline-md text-headline-md mt-0.5">Logged in as Duty Dispatch Lead</h2>
          </div>
        </div>
        <div className="text-right">
          <p className="text-secondary text-body-sm">
            Status: <span className="text-on-primary-fixed-variant font-bold">Live Operational Shift</span>
          </p>
          <p className="text-secondary text-body-sm">Lagos &amp; Port Harcourt Yards</p>
        </div>
      </section>

      {/* 2. Metrics Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Metric 1 - Inquiries */}
        <div 
          onClick={() => onNavigate?.('leads')}
          className="bg-surface-white border border-outline-variant rounded-lg p-6 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer group"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-surface-container rounded-lg group-hover:bg-primary-fixed transition-colors">
              <span className="material-symbols-outlined text-secondary group-hover:text-primary">mark_email_unread</span>
            </div>
            <span className="text-status-gray text-label-bold text-xs">
              {stats?.inquiries?.new ? `${stats.inquiries.new} New Leads` : 'Active Queue'}
            </span>
          </div>
          <h3 className="text-secondary font-label-bold uppercase text-xs tracking-wider">Customer RFQ Inquiries</h3>
          <p className="font-headline-lg text-headline-lg mt-1">
            {stats ? stats.inquiries.total : 14}
          </p>
        </div>

        {/* Metric 2 - Service Dispatches */}
        <div className="bg-surface-white border border-outline-variant rounded-lg p-6 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-surface-container rounded-lg">
              <span className="material-symbols-outlined text-secondary">precision_manufacturing</span>
            </div>
            <span className="text-on-primary-fixed-variant font-label-bold text-xs">
              {stats?.service_tickets?.in_dispatch ? `${stats.service_tickets.in_dispatch} En Route` : 'Active Dispatch'}
            </span>
          </div>
          <h3 className="text-secondary font-label-bold uppercase text-xs tracking-wider">Service Tickets</h3>
          <p className="font-headline-lg text-headline-lg mt-1">
            {stats ? stats.service_tickets.total : 28}
          </p>
        </div>

        {/* Metric 3 - Equipment & Parts (Clickable) */}
        <div 
          onClick={() => onNavigate?.('inventory')}
          className="bg-surface-white border border-outline-variant rounded-lg p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 border-t-4 border-t-primary-container cursor-pointer group hover:border-primary-container"
          title="Click to view Inventory catalog"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-primary-fixed rounded-lg group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-primary">inventory_2</span>
            </div>
            <span className="text-primary font-label-bold text-xs flex items-center gap-1 group-hover:underline">
              Live Catalog <span className="material-symbols-outlined text-xs">arrow_forward</span>
            </span>
          </div>
          <h3 className="text-secondary font-label-bold uppercase text-xs tracking-wider">Active Inventory Fleet</h3>
          <div className="flex items-baseline justify-between mt-1">
            <p className="font-headline-lg text-headline-lg">
              {stats ? stats.active_products + stats.active_parts : 36}
            </p>
            <span className="text-xs text-secondary font-medium">
              {stats ? `${stats.active_products} Units • ${stats.active_parts} Spares` : 'Compressors & Spares'}
            </span>
          </div>
        </div>
      </section>

      {/* 3. Main Split View */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Incoming Requests Feed */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between mb-2 px-1">
            <h3 className="font-headline-md text-headline-md">Live Incoming Requests</h3>
            <button 
              onClick={() => onNavigate?.('leads')}
              className="text-primary font-button text-button text-sm hover:underline flex items-center gap-1"
            >
              Manage In Leads <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>

          {displayRequests.map((req, idx) => (
            <div
              key={req.id || idx}
              onClick={() => onNavigate?.('leads')}
              className="bg-surface-white border border-outline-variant rounded-lg p-4 flex gap-4 items-center hover:bg-surface-container-low transition-colors duration-200 cursor-pointer"
            >
              <div className="w-12 h-12 bg-surface-container-high rounded flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary">
                  {req.equipment_interests && req.equipment_interests.length > 0 ? 'construction' : 'mail'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-body-md truncate">{req.company}</h4>
                  <span className="text-status-gray text-label-bold text-xs shrink-0 ml-2">
                    {req.created_at ? new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                  </span>
                </div>
                <p className="text-secondary text-body-sm font-medium">{req.name} • {req.email}</p>
                <p className="text-outline text-body-sm line-clamp-1 mt-0.5">{req.message}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Right: Operational Tasks & Fleet Utilization */}
        <div className="lg:col-span-5 space-y-6">
          {/* Ongoing Operational Tasks */}
          <div className="bg-surface-white border border-outline-variant rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-headline-sm text-headline-sm">Ongoing Tasks</h4>
              <button 
                onClick={() => onNavigate?.('projects')}
                className="text-primary font-button text-button text-xs hover:underline flex items-center gap-1"
              >
                Kanban Board <span className="material-symbols-outlined text-xs">arrow_forward</span>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-secondary font-label-bold uppercase text-[10px] tracking-wider mb-2">In Progress</p>
                <div className="space-y-2">
                  {tasks.inProgress.map((task) => (
                    <div key={task.id} className="p-3 bg-surface-container-low rounded border border-outline-variant flex justify-between items-center">
                      <span className="font-body-md text-sm truncate mr-2">{task.title}</span>
                      <span className="text-xs bg-surface-white px-2 py-0.5 rounded border border-outline-variant shrink-0">{task.user}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Fleet Weekly Utilization */}
          <div className="bg-surface-white border border-outline-variant rounded-lg p-6">
            <h4 className="font-headline-sm text-headline-sm mb-4">Fleet Equipment Utilization</h4>
            <div className="flex items-end justify-between h-32 pt-4 px-2">
              {utilizationData.map((item) => (
                <div key={item.day} className="flex flex-col items-center gap-2 flex-1">
                  <div className="w-full max-w-[28px] bg-surface-container rounded-t relative h-24 flex items-end">
                    <div 
                      className={`w-full rounded-t transition-all duration-500 ${item.active ? 'bg-primary' : 'bg-secondary'}`} 
                      style={{ height: item.percentage }}
                    ></div>
                  </div>
                  <span className="text-[10px] font-bold text-secondary">{item.day}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
