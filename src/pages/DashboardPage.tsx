import { useState, useEffect, useCallback } from 'react';
import { checkBackendHealth } from '../services/authService';
import {
  fetchComprehensiveStats,
  fetchUnifiedLiveFeed,
  DashboardStats,
  UnifiedLiveActivity,
} from '../services/dashboardService';
import type { TabType } from '../components/Layout';

interface DashboardPageProps {
  onNavigate?: (tab: TabType) => void;
}

export default function DashboardPage({ onNavigate }: DashboardPageProps) {
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [liveFeed, setLiveFeed] = useState<UnifiedLiveActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const isOnline = await checkBackendHealth();
      setApiOnline(isOnline);

      if (isOnline) {
        const [statsData, feedData] = await Promise.all([
          fetchComprehensiveStats(),
          fetchUnifiedLiveFeed(12),
        ]);
        setStats(statsData);
        setLiveFeed(feedData);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    // Auto-refresh every 30 seconds for live operations
    const interval = setInterval(() => {
      loadData();
    }, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleManualRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Compute breakdown percentages dynamically from real stats
  const totalLeads = stats?.total_rfqs || (liveFeed.length > 0 ? liveFeed.length : 1);
  const compCount = stats?.compressor_requests?.total || 0;
  const spareCount = stats?.spare_parts_requests?.total || 0;
  const leaseCount = stats?.leasing_requests?.total || 0;
  const lubCount = stats?.lubricant_requests?.total || 0;
  const orderCount = stats?.orders?.total || 0;
  const inqCount = stats?.inquiries?.total || 0;

  const compPct = Math.round((compCount / (totalLeads || 1)) * 100);
  const sparePct = Math.round((spareCount / (totalLeads || 1)) * 100);
  const leasePct = Math.round((leaseCount / (totalLeads || 1)) * 100);
  const lubPct = Math.round((lubCount / (totalLeads || 1)) * 100);
  const inqPct = Math.max(0, 100 - (compPct + sparePct + leasePct + lubPct));

  return (
    <div className="space-y-8 animate-fade-in pb-16 font-body-md">
      {/* 1. Operations & Connection Status Banner */}
      <section className="bg-surface-white border border-outline-variant rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-primary"></div>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              hub
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-label-bold text-primary uppercase text-xs tracking-wider">
                Operations &amp; Dispatch Lead Portal
              </span>
              {apiOnline === true && (
                <span className="inline-flex items-center gap-1.5 text-[11px] bg-primary/15 text-primary-dark px-2.5 py-0.5 rounded-full font-bold border border-primary/30">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                  REST API Connected • Live Sync
                </span>
              )}
              {apiOnline === false && (
                <span className="inline-flex items-center gap-1.5 text-[11px] bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full font-bold border border-amber-200">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  Connecting to API...
                </span>
              )}
            </div>
            <h2 className="font-headline-md text-xl md:text-2xl text-deep-charcoal font-black mt-1">
              Active Inbound Pipeline &amp; Logistics Control
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-outline-variant bg-surface-container-low hover:bg-surface-container text-xs font-bold text-deep-charcoal transition-all cursor-pointer shadow-xs"
            title="Refresh live data"
          >
            <span className={`material-symbols-outlined text-base ${refreshing ? 'animate-spin' : ''}`}>
              sync
            </span>
            <span>{refreshing ? 'Refreshing...' : 'Sync Live'}</span>
          </button>
          <div className="text-right hidden sm:block">
            <p className="text-secondary text-xs font-medium">
              Active Yards: <span className="text-primary font-bold">PHC • Lagos • Abuja</span>
            </p>
            <p className="text-outline text-[11px]">Auto-refreshing every 30s</p>
          </div>
        </div>
      </section>

      {/* 2. Top Key Performance Metrics Grid (Real data from frontend) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Metric 1 - Total Inbound Leads */}
        <div
          onClick={() => onNavigate?.('compressor-requests')}
          className="bg-surface-white border border-outline-variant rounded-xl p-5 hover:border-primary/50 hover:shadow-md transition-all duration-200 cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 bg-primary/10 text-primary rounded-lg group-hover:bg-primary group-hover:text-white transition-colors">
              <span className="material-symbols-outlined text-xl">all_inbox</span>
            </div>
            <span className="text-[10px] bg-primary/15 text-primary-dark font-bold px-2 py-0.5 rounded-full border border-primary/25">
              {stats?.new_rfqs ? `${stats.new_rfqs} New` : 'Active'}
            </span>
          </div>
          <div>
            <h3 className="text-secondary font-bold text-[11px] uppercase tracking-wider">
              Total Inbound RFQs
            </h3>
            <p className="text-2xl font-black text-deep-charcoal mt-0.5">
              {loading ? '—' : stats?.total_rfqs ?? 0}
            </p>
            <span className="text-[11px] text-outline mt-1 block">All product inquiries</span>
          </div>
        </div>

        {/* Metric 2 - Yard Orders */}
        <div
          onClick={() => onNavigate?.('orders')}
          className="bg-surface-white border border-outline-variant rounded-xl p-5 hover:border-emerald-500/50 hover:shadow-md transition-all duration-200 cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <span className="material-symbols-outlined text-xl">local_shipping</span>
            </div>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
              {stats?.orders?.new ? `${stats.orders.new} Pending` : 'Cart Orders'}
            </span>
          </div>
          <div>
            <h3 className="text-secondary font-bold text-[11px] uppercase tracking-wider">
              Yard Cart Orders
            </h3>
            <p className="text-2xl font-black text-emerald-700 mt-0.5">
              {loading ? '—' : stats?.orders?.total ?? 0}
            </p>
            <span className="text-[11px] text-outline mt-1 block">Live yard requisitions</span>
          </div>
        </div>

        {/* Metric 3 - Compressor Requests */}
        <div
          onClick={() => onNavigate?.('compressor-requests')}
          className="bg-surface-white border border-outline-variant rounded-xl p-5 hover:border-blue-500/50 hover:shadow-md transition-all duration-200 cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <span className="material-symbols-outlined text-xl">air</span>
            </div>
            <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full border border-blue-200">
              {stats?.compressor_requests?.new ? `${stats.compressor_requests.new} New` : 'Compressors'}
            </span>
          </div>
          <div>
            <h3 className="text-secondary font-bold text-[11px] uppercase tracking-wider">
              Compressor RFQs
            </h3>
            <p className="text-2xl font-black text-blue-700 mt-0.5">
              {loading ? '—' : stats?.compressor_requests?.total ?? 0}
            </p>
            <span className="text-[11px] text-outline mt-1 block">Electric &amp; Diesel Units</span>
          </div>
        </div>

        {/* Metric 4 - Spare Parts Requests */}
        <div
          onClick={() => onNavigate?.('spare-parts-requests')}
          className="bg-surface-white border border-outline-variant rounded-xl p-5 hover:border-amber-500/50 hover:shadow-md transition-all duration-200 cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <span className="material-symbols-outlined text-xl">build</span>
            </div>
            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-200">
              {stats?.spare_parts_requests?.new ? `${stats.spare_parts_requests.new} New` : 'OEM Parts'}
            </span>
          </div>
          <div>
            <h3 className="text-secondary font-bold text-[11px] uppercase tracking-wider">
              Spare Parts RFQs
            </h3>
            <p className="text-2xl font-black text-amber-700 mt-0.5">
              {loading ? '—' : stats?.spare_parts_requests?.total ?? 0}
            </p>
            <span className="text-[11px] text-outline mt-1 block">OEM Filters &amp; Valves</span>
          </div>
        </div>

        {/* Metric 5 - Leasing Requests */}
        <div
          onClick={() => onNavigate?.('leasing-requests')}
          className="bg-surface-white border border-outline-variant rounded-xl p-5 hover:border-purple-500/50 hover:shadow-md transition-all duration-200 cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <span className="material-symbols-outlined text-xl">car_rental</span>
            </div>
            <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full border border-purple-200">
              {stats?.leasing_requests?.new ? `${stats.leasing_requests.new} New` : 'Rentals'}
            </span>
          </div>
          <div>
            <h3 className="text-secondary font-bold text-[11px] uppercase tracking-wider">
              Leasing Fleet
            </h3>
            <p className="text-2xl font-black text-purple-700 mt-0.5">
              {loading ? '—' : stats?.leasing_requests?.total ?? 0}
            </p>
            <span className="text-[11px] text-outline mt-1 block">Project Lease Requests</span>
          </div>
        </div>

        {/* Metric 6 - Inventory Machinery & Parts */}
        <div
          onClick={() => onNavigate?.('inventory')}
          className="bg-surface-white border border-outline-variant rounded-xl p-5 hover:border-primary/50 hover:shadow-md transition-all duration-200 cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 bg-surface-container text-secondary rounded-lg group-hover:bg-primary group-hover:text-white transition-colors">
              <span className="material-symbols-outlined text-xl">inventory_2</span>
            </div>
            <span className="text-[10px] bg-surface-container-high text-secondary font-bold px-2 py-0.5 rounded-full">
              In Stock
            </span>
          </div>
          <div>
            <h3 className="text-secondary font-bold text-[11px] uppercase tracking-wider">
              Catalog Items
            </h3>
            <p className="text-2xl font-black text-deep-charcoal mt-0.5">
              {loading ? '—' : `${(stats?.active_products || 0) + (stats?.active_parts || 0)}`}
            </p>
            <span className="text-[11px] text-outline mt-1 block">
              {stats?.active_products || 9} Units • {stats?.active_parts || 6} Spares
            </span>
          </div>
        </div>
      </section>

      {/* 3. Main Split View: Real Live Requests vs Operations Hub */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Live Incoming Stream from Frontend */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between mb-1 px-1">
            <div>
              <h3 className="font-headline-md text-lg font-black text-deep-charcoal">
                Live Inbound Requests &amp; Orders Feed
              </h3>
              <p className="text-xs text-secondary mt-0.5">
                Real customer quotations, yard cart requisitions, and parts requests submitted from frontend
              </p>
            </div>
            <span className="text-xs font-bold text-primary bg-primary/10 border border-primary/25 px-2.5 py-1 rounded-full shrink-0 ml-2">
              {liveFeed.length} Recent Submissions
            </span>
          </div>

          {loading ? (
            <div className="bg-surface-white border border-outline-variant rounded-xl p-12 text-center">
              <span className="material-symbols-outlined text-primary text-4xl animate-spin">
                progress_activity
              </span>
              <p className="text-sm text-secondary font-medium mt-3">Loading live inbound submissions...</p>
            </div>
          ) : liveFeed.length === 0 ? (
            <div className="bg-surface-white border border-outline-variant rounded-xl p-12 text-center space-y-3">
              <span className="material-symbols-outlined text-secondary text-5xl">inbox</span>
              <h4 className="font-bold text-base text-deep-charcoal">No inbound requests yet</h4>
              <p className="text-xs text-secondary max-w-sm mx-auto">
                Customer quotation requests and yard orders submitted on the frontend will appear here instantly.
              </p>
              <button
                onClick={handleManualRefresh}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary-dark transition-colors"
              >
                <span className="material-symbols-outlined text-sm">refresh</span>
                Check Again
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {liveFeed.map((item) => (
                <div
                  key={`${item.category}-${item.id}`}
                  onClick={() => onNavigate?.(item.tab)}
                  className="bg-surface-white border border-outline-variant rounded-xl p-4.5 flex gap-4 items-start hover:border-primary/50 hover:bg-surface-container-low transition-all duration-200 cursor-pointer shadow-xs group"
                >
                  {/* Category Indicator Icon */}
                  <div className="w-11 h-11 bg-surface-container rounded-lg flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors mt-0.5">
                    <span className="material-symbols-outlined text-primary text-xl">
                      {item.category === 'compressor' && 'air'}
                      {item.category === 'spare_parts' && 'build'}
                      {item.category === 'leasing' && 'car_rental'}
                      {item.category === 'lubricants' && 'water_drop'}
                      {item.category === 'order' && 'local_shipping'}
                      {item.category === 'inquiry' && 'mail'}
                    </span>
                  </div>

                  {/* Request Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border tracking-wider ${item.badgeClass}`}>
                          {item.categoryLabel}
                        </span>
                        <h4 className="font-bold text-sm text-deep-charcoal truncate">
                          {item.company}
                        </h4>
                      </div>
                      <span className="text-[11px] text-outline font-medium shrink-0">
                        {item.created_at
                          ? new Date(item.created_at).toLocaleString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Recent'}
                      </span>
                    </div>

                    <p className="text-primary-dark font-bold text-xs truncate">
                      {item.summary}
                    </p>

                    {item.details && (
                      <p className="text-secondary text-xs line-clamp-1 mt-1 bg-surface-container/40 p-1.5 rounded">
                        {item.details}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-outline mt-2 pt-2 border-t border-outline-variant/60">
                      <span className="truncate mr-2">
                        {item.name ? `${item.name} • ` : ''}
                        {item.email} {item.phone ? `• ${item.phone}` : ''}
                      </span>
                      <span className="text-primary font-bold inline-flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                        Manage <span className="material-symbols-outlined text-xs">arrow_forward</span>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Operations Hub & Pipeline Breakdown */}
        <div className="lg:col-span-5 space-y-6">
          {/* Quick Operations Dispatch Hub */}
          <div className="bg-surface-white border border-outline-variant rounded-xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-headline-sm text-base font-black text-deep-charcoal">
                Direct Dispatch Actions
              </h4>
              <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">
                1-Click Navigation
              </span>
            </div>

            <div className="space-y-2.5">
              <button
                onClick={() => onNavigate?.('compressor-requests')}
                className="w-full p-3 rounded-lg border border-outline-variant bg-surface-container-low hover:bg-primary/5 hover:border-primary/40 flex items-center justify-between transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-blue-600 text-lg">air</span>
                  <div>
                    <span className="text-xs font-bold text-deep-charcoal block">Compressor Quotations</span>
                    <span className="text-[11px] text-secondary">Review {compCount} inbound fleet RFQs</span>
                  </div>
                </div>
                <span className="text-xs bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                  {compCount}
                </span>
              </button>

              <button
                onClick={() => onNavigate?.('orders')}
                className="w-full p-3 rounded-lg border border-outline-variant bg-surface-container-low hover:bg-emerald-500/5 hover:border-emerald-500/40 flex items-center justify-between transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-emerald-600 text-lg">local_shipping</span>
                  <div>
                    <span className="text-xs font-bold text-deep-charcoal block">Yard Cart Orders</span>
                    <span className="text-[11px] text-secondary">Fulfill {orderCount} staged delivery</span>
                  </div>
                </div>
                <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  {orderCount}
                </span>
              </button>

              <button
                onClick={() => onNavigate?.('spare-parts-requests')}
                className="w-full p-3 rounded-lg border border-outline-variant bg-surface-container-low hover:bg-amber-500/5 hover:border-amber-500/40 flex items-center justify-between transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-amber-600 text-lg">build</span>
                  <div>
                    <span className="text-xs font-bold text-deep-charcoal block">Spare Parts RFQs</span>
                    <span className="text-[11px] text-secondary">Review {spareCount} parts inquiry</span>
                  </div>
                </div>
                <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                  {spareCount}
                </span>
              </button>

              <button
                onClick={() => onNavigate?.('leasing-requests')}
                className="w-full p-3 rounded-lg border border-outline-variant bg-surface-container-low hover:bg-purple-500/5 hover:border-purple-500/40 flex items-center justify-between transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-purple-600 text-lg">car_rental</span>
                  <div>
                    <span className="text-xs font-bold text-deep-charcoal block">Leasing &amp; Rentals</span>
                    <span className="text-[11px] text-secondary">Review {leaseCount} project contract</span>
                  </div>
                </div>
                <span className="text-xs bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full">
                  {leaseCount}
                </span>
              </button>

              <button
                onClick={() => onNavigate?.('enquiries')}
                className="w-full p-3 rounded-lg border border-outline-variant bg-surface-container-low hover:bg-slate-500/5 hover:border-slate-500/40 flex items-center justify-between transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-slate-600 text-lg">contact_support</span>
                  <div>
                    <span className="text-xs font-bold text-deep-charcoal block">General Enquiries</span>
                    <span className="text-[11px] text-secondary">View {inqCount} contact leads</span>
                  </div>
                </div>
                <span className="text-xs bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded-full">
                  {inqCount}
                </span>
              </button>
            </div>
          </div>

          {/* Inbound Demand Distribution by Category */}
          <div className="bg-surface-white border border-outline-variant rounded-xl p-6 shadow-xs">
            <h4 className="font-headline-sm text-base font-black text-deep-charcoal mb-1">
              Inbound RFQ Distribution
            </h4>
            <p className="text-xs text-secondary mb-4">
              Live proportion of incoming demand across business lines
            </p>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-blue-800">Air Compressors ({compCount})</span>
                  <span className="text-secondary">{compPct}%</span>
                </div>
                <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
                  <div className="bg-blue-600 h-2 rounded-full transition-all duration-500" style={{ width: `${compPct}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-amber-800">Spare Parts ({spareCount})</span>
                  <span className="text-secondary">{sparePct}%</span>
                </div>
                <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
                  <div className="bg-amber-500 h-2 rounded-full transition-all duration-500" style={{ width: `${sparePct}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-purple-800">Leasing &amp; Rentals ({leaseCount})</span>
                  <span className="text-secondary">{leasePct}%</span>
                </div>
                <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
                  <div className="bg-purple-600 h-2 rounded-full transition-all duration-500" style={{ width: `${leasePct}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-slate-800">General Web Inquiries ({inqCount})</span>
                  <span className="text-secondary">{inqPct}%</span>
                </div>
                <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
                  <div className="bg-slate-500 h-2 rounded-full transition-all duration-500" style={{ width: `${inqPct}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Regional Yard Hub Status */}
          <div className="bg-surface-white border border-outline-variant rounded-xl p-5 shadow-xs">
            <h4 className="font-bold text-xs uppercase tracking-wider text-secondary mb-3">
              Active Regional Yard Facilities
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded bg-surface-container-low">
                <span className="font-bold text-deep-charcoal">Port Harcourt Operations Yard (Elelenwo)</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">Active HQ</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-surface-container-low">
                <span className="font-bold text-deep-charcoal">Lagos Branch Logistics (Return, Ikeja)</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">Operational</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-surface-container-low">
                <span className="font-bold text-deep-charcoal">Abuja Industrial Hub (Karsana)</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">Operational</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
