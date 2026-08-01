import { useState } from 'react';

interface Lead {
  id: string;
  company: string;
  customer: string;
  assignedAdmin: string;
  assignedInitials: string;
  status: 'In Progress' | 'Pending' | 'Completed';
}

interface LeadsPageProps {
  onNavigate?: (tab: 'dashboard' | 'leads' | 'inventory' | 'invoicing' | 'projects') => void;
}

interface TechQueueItem {
  id: string;
  title: string;
  etaHours: number;
  priority: 'URGENT' | 'HIGH' | 'ROUTINE';
}

export default function LeadsPage({ onNavigate }: LeadsPageProps) {
  const [leads, setLeads] = useState<Lead[]>([
    {
      id: '#REQ-8291',
      company: 'HeavyLift Solutions Ltd.',
      customer: 'Marcus Vane',
      assignedAdmin: 'Sarah Lund',
      assignedInitials: 'SL',
      status: 'In Progress',
    },
    {
      id: '#REQ-8295',
      company: 'Global Foundry Group',
      customer: 'Helena Ross',
      assignedAdmin: 'Jack Kern',
      assignedInitials: 'JK',
      status: 'Pending',
    },
    {
      id: '#REQ-8302',
      company: 'Nordic Turbine Corp',
      customer: 'Erik Sjöberg',
      assignedAdmin: 'Sarah Lund',
      assignedInitials: 'SL',
      status: 'Completed',
    },
    {
      id: '#REQ-8310',
      company: 'Precision Gears Inc.',
      customer: 'Lydia Wu',
      assignedAdmin: 'Unassigned',
      assignedInitials: '',
      status: 'Pending',
    },
    {
      id: '#REQ-8315',
      company: 'Oceanic Dredge Systems',
      customer: 'Alan Carter',
      assignedAdmin: 'Alex Miller',
      assignedInitials: 'AM',
      status: 'In Progress',
    },
  ]);

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showAllLeadsModal, setShowAllLeadsModal] = useState(false);
  const [queuePriorityFilter, setQueuePriorityFilter] = useState<'ALL' | 'URGENT' | 'HIGH' | 'ROUTINE'>('ALL');
  const [queueSort, setQueueSort] = useState<'ETA_ASC' | 'PRIORITY_DESC'>('ETA_ASC');

  const [techQueueItems] = useState<TechQueueItem[]>([
    { id: 'tq1', title: 'Hydraulic System Spec', etaHours: 2, priority: 'URGENT' },
    { id: 'tq2', title: 'Structural Load Data', etaHours: 4, priority: 'HIGH' },
    { id: 'tq3', title: 'Turbine Vibration Diagnostics', etaHours: 1, priority: 'URGENT' },
    { id: 'tq4', title: 'Electrical Panel Calibration', etaHours: 6, priority: 'ROUTINE' },
  ]);

  const filteredTechQueue = techQueueItems
    .filter((item) => (queuePriorityFilter === 'ALL' ? true : item.priority === queuePriorityFilter))
    .sort((a, b) => {
      if (queueSort === 'ETA_ASC') return a.etaHours - b.etaHours;
      const priorityMap = { URGENT: 3, HIGH: 2, ROUTINE: 1 };
      return priorityMap[b.priority] - priorityMap[a.priority];
    });

  const handleClaimLead = (leadId: string) => {
    setLeads((prevLeads) =>
      prevLeads.map((lead) =>
        lead.id === leadId
          ? {
              ...lead,
              assignedAdmin: 'Alex Rivera',
              assignedInitials: 'AR',
              status: 'In Progress',
            }
          : lead
      )
    );
    setSelectedLead(null);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">Customer Requests & Lead Hub</h2>
          <p className="font-body-md text-body-md text-secondary max-w-2xl mt-1">
            Manage incoming industrial inquiries, technical lead handovers, and assignment logistics.
          </p>
        </div>
        <div className="flex gap-3 shrink-0">
          <button 
            onClick={() => setShowAllLeadsModal(true)}
            className="bg-surface-white border border-primary text-primary px-4 py-2 rounded font-button text-sm hover:bg-primary-container/10 transition-colors flex items-center gap-2 font-bold shadow-sm"
          >
            <span className="material-symbols-outlined text-lg">list_alt</span> View All Leads (142)
          </button>
          <button 
            onClick={() => alert('New lead form dialog')}
            className="bg-primary text-surface-white px-4 py-2 rounded font-button text-sm hover:opacity-90 transition-opacity flex items-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined text-lg">add</span> Create New Lead
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 bg-surface-white border border-outline rounded p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
          <div>
            <p className="font-label-bold text-secondary uppercase text-xs tracking-wider">Total Active Requests</p>
            <h3 className="font-headline-xl text-headline-xl text-on-surface mt-1">142</h3>
            <p className="text-tertiary font-body-sm text-body-sm mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">trending_up</span> +12% from last week
            </p>
          </div>
          <div className="flex flex-wrap gap-8 border-t sm:border-t-0 sm:border-l border-outline-variant pt-4 sm:pt-0 sm:pl-8">
            <div>
              <p className="font-label-bold text-secondary text-[11px] tracking-wider">PENDING</p>
              <p className="font-headline-md text-headline-md text-primary">28</p>
            </div>
            <div>
              <p className="font-label-bold text-secondary text-[11px] tracking-wider">IN PROGRESS</p>
              <p className="font-headline-md text-headline-md text-tertiary">94</p>
            </div>
            <div>
              <p className="font-label-bold text-secondary text-[11px] tracking-wider">COMPLETED</p>
              <p className="font-headline-md text-headline-md text-status-gray">20</p>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 bg-deep-charcoal text-surface-white rounded p-6 relative flex flex-col justify-between overflow-hidden">
          <div className="z-10">
            <p className="font-label-bold text-surface-variant uppercase text-xs tracking-wider">Unclaimed Handoffs</p>
            <h3 className="font-headline-xl text-headline-xl mt-1">07</h3>
          </div>
          <button 
            onClick={() => setShowAllLeadsModal(true)}
            className="z-10 mt-6 border border-surface-variant text-surface-white px-4 py-2 rounded font-button text-sm hover:bg-secondary transition-colors w-full"
          >
            View Urgent Queue
          </button>
          {/* Abstract industrial background pattern */}
          <div className="absolute -bottom-6 -right-6 opacity-10 pointer-events-none select-none">
            <span className="material-symbols-outlined text-[140px]">precision_manufacturing</span>
          </div>
        </div>
      </div>

      {/* Main Data Table Container */}
      <div className="bg-surface-white border border-outline rounded overflow-hidden">
        <div className="p-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
          <span className="font-label-bold text-label-bold text-on-surface-variant text-xs flex items-center gap-2">
            ACTIVE LEAD REPOSITORY
            <span className="bg-primary-container text-on-primary-container px-2 py-0.5 rounded text-[10px] font-bold">
              Showing Active ({leads.length})
            </span>
          </span>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowAllLeadsModal(true)}
              className="bg-primary text-white text-xs px-3 py-1 rounded font-bold hover:opacity-90 flex items-center gap-1 transition-opacity"
            >
              <span className="material-symbols-outlined text-sm">open_in_full</span> View All 142 Leads
            </button>
            <button className="p-1 hover:bg-surface-container-high rounded transition-colors" title="Refresh list">
              <span className="material-symbols-outlined text-secondary">refresh</span>
            </button>
            <button className="p-1 hover:bg-surface-container-high rounded transition-colors" title="Export CSV">
              <span className="material-symbols-outlined text-secondary">download</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto scroll-hide">
          <table className="w-full text-left border-collapse">
            <thead className="bg-deep-charcoal text-surface-white text-xs">
              <tr>
                <th className="px-6 py-4 font-label-bold uppercase">Request ID</th>
                <th className="px-6 py-4 font-label-bold uppercase">Company</th>
                <th className="px-6 py-4 font-label-bold uppercase">Customer</th>
                <th className="px-6 py-4 font-label-bold uppercase">Assigned Admin</th>
                <th className="px-6 py-4 font-label-bold uppercase">Status</th>
                <th className="px-6 py-4 font-label-bold uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant font-body-sm text-body-sm">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-surface-container-low transition-colors group">
                  <td className="px-6 py-4 font-bold text-primary">{lead.id}</td>
                  <td className="px-6 py-4">{lead.company}</td>
                  <td className="px-6 py-4">{lead.customer}</td>
                  <td className="px-6 py-4">
                    {lead.assignedAdmin === 'Unassigned' ? (
                      <span className="italic text-secondary">Unassigned</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-surface-container-highest flex items-center justify-center text-[10px] font-bold">
                          {lead.assignedInitials}
                        </div>
                        <span>{lead.assignedAdmin}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded font-label-bold text-[10px] uppercase border ${
                        lead.status === 'In Progress'
                          ? 'bg-tertiary-fixed text-on-tertiary-container border-tertiary-container'
                          : lead.status === 'Pending'
                          ? 'bg-primary-fixed text-on-primary-container border-primary-container'
                          : 'bg-surface-container-highest text-secondary border-outline-variant'
                      }`}
                    >
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {lead.status === 'Completed' ? (
                      <button
                        onClick={() => setSelectedLead(lead)}
                        className="bg-deep-charcoal text-surface-white px-3 py-1.5 rounded font-button text-xs hover:opacity-90 transition-all shadow-sm"
                      >
                        View Details
                      </button>
                    ) : lead.assignedAdmin === 'Unassigned' ? (
                      <button
                        onClick={() => setSelectedLead(lead)}
                        className="bg-primary text-surface-white px-3 py-1.5 rounded font-button text-xs hover:opacity-90 transition-all shadow-sm group-hover:scale-105"
                      >
                        Pick Up Request
                      </button>
                    ) : (
                      <button
                        onClick={() => setSelectedLead(lead)}
                        className="bg-primary text-surface-white px-3 py-1.5 rounded font-button text-xs hover:opacity-90 transition-all shadow-sm group-hover:scale-105"
                      >
                        Handoff Request
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-outline-variant flex items-center justify-between bg-surface-container-low">
          <p className="font-body-sm text-body-sm text-secondary text-xs">
            Showing {leads.length} of 142 total requests
          </p>
          <div className="flex gap-2">
            <button className="w-8 h-8 flex items-center justify-center border border-outline-variant bg-surface-white rounded hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <button className="w-8 h-8 flex items-center justify-center border border-primary bg-primary-container text-on-primary-container font-bold rounded text-xs">
              1
            </button>
            <button className="w-8 h-8 flex items-center justify-center border border-outline-variant bg-surface-white rounded hover:bg-surface-container-high transition-colors text-xs">
              2
            </button>
            <button className="w-8 h-8 flex items-center justify-center border border-outline-variant bg-surface-white rounded hover:bg-surface-container-high transition-colors text-xs">
              3
            </button>
            <button className="w-8 h-8 flex items-center justify-center border border-outline-variant bg-surface-white rounded hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bento Grid - Supplementary Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Technical Queue */}
        <div className="bg-surface-white border border-outline rounded-xl p-6 min-h-64 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <h4 className="font-headline-md text-headline-md text-lg">Technical Queue</h4>
              <span className="bg-primary-container/20 text-primary font-bold text-[10px] px-2 py-0.5 rounded-full">
                {filteredTechQueue.length} Pending
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-secondary text-xs">
              High-priority requests requiring engineering validation before handoff.
            </p>

            {/* Filter and Sort Controls */}
            <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-outline-variant text-[11px]">
              <div className="flex items-center gap-1">
                <span className="text-secondary font-bold">Filter:</span>
                <select
                  value={queuePriorityFilter}
                  onChange={(e) => setQueuePriorityFilter(e.target.value as any)}
                  className="bg-surface-container border border-outline-variant rounded px-1.5 py-0.5 text-xs outline-none"
                >
                  <option value="ALL">All Priorities</option>
                  <option value="URGENT">Urgent</option>
                  <option value="HIGH">High</option>
                  <option value="ROUTINE">Routine</option>
                </select>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-secondary font-bold">Sort:</span>
                <select
                  value={queueSort}
                  onChange={(e) => setQueueSort(e.target.value as any)}
                  className="bg-surface-container border border-outline-variant rounded px-1.5 py-0.5 text-xs outline-none"
                >
                  <option value="ETA_ASC">Fastest ETA</option>
                  <option value="PRIORITY_DESC">Highest Priority</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-2 mt-3 flex-1 overflow-y-auto max-h-40 pr-1">
            {filteredTechQueue.map((item) => (
              <div
                key={item.id}
                className={`flex items-center gap-3 p-2.5 rounded border-l-4 ${
                  item.priority === 'URGENT'
                    ? 'border-l-error bg-error-container/10'
                    : item.priority === 'HIGH'
                    ? 'border-l-primary bg-primary-container/10'
                    : 'border-l-secondary bg-surface-container-low'
                }`}
              >
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <p className="font-label-bold text-label-bold text-xs">{item.title}</p>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                        item.priority === 'URGENT'
                          ? 'bg-error text-white'
                          : item.priority === 'HIGH'
                          ? 'bg-primary text-white'
                          : 'bg-secondary/20 text-secondary'
                      }`}
                    >
                      {item.priority}
                    </span>
                  </div>
                  <p className="text-[10px] text-secondary mt-0.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">schedule</span> ETA: {item.etaHours} {item.etaHours === 1 ? 'Hour' : 'Hours'}
                  </p>
                </div>
              </div>
            ))}
            {filteredTechQueue.length === 0 && (
              <p className="text-xs text-secondary italic py-4 text-center">No queue items match filter.</p>
            )}
          </div>
        </div>

        {/* Admin Productivity */}
        <div className="bg-surface-white border border-outline rounded-xl p-6 min-h-64 flex flex-col justify-between shadow-sm">
          <h4 className="font-headline-md text-headline-md text-lg mb-2">Admin Productivity</h4>
          <div className="flex-1 flex items-end gap-2 px-2">
            <div className="w-1/4 bg-primary-fixed-dim h-1/2 rounded-t flex items-center justify-center text-[10px] font-bold text-primary">12</div>
            <div className="w-1/4 bg-primary h-3/4 rounded-t flex items-center justify-center text-[10px] font-bold text-white">28</div>
            <div className="w-1/4 bg-tertiary-fixed-dim h-full rounded-t flex items-center justify-center text-[10px] font-bold text-tertiary">35</div>
            <div className="w-1/4 bg-primary h-2/3 rounded-t flex items-center justify-center text-[10px] font-bold text-white">22</div>
          </div>
          <div className="mt-4 flex justify-between font-label-bold text-[10px] text-secondary px-2 border-t border-outline-variant pt-2">
            <span>MON</span>
            <span>TUE</span>
            <span>WED</span>
            <span>THU</span>
          </div>
        </div>

        {/* Inventory Sync */}
        <div className="bg-deep-charcoal rounded-xl p-6 min-h-64 relative overflow-hidden text-surface-white flex flex-col justify-between shadow-md">
          <img
            alt="Industrial Warehouse"
            className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-overlay pointer-events-none"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuA74hvydLUcNnZ9LlHez5FdIIZnQtD0L2RHHITtgxaBMNPQkcJ70RK2n6-8CcMAjPiQtAwdti9gwGaZXLkn9-zG_CBI9bRkoht4oI7bSrDULcHN4XGH4qkpYkuM3whMxoCktePwKyoq4X8W0rSFKHw7-JSFXzjOW9Kn3EJmMfRuOcLe_0KzaU4Q19q_JBkLsh78eKJzdXWP9-gPFIhb_UbDPibpDpyjJ93hPcVj2J8TdZKNIowOjeGC-fkwmJIjVC3LEV-7LRIWHp8"
          />
          <div className="relative z-10">
            <h4 className="font-headline-md text-headline-md text-lg text-white">Inventory Sync</h4>
            <p className="font-body-sm text-body-sm text-surface-variant text-xs mt-1 leading-relaxed">
              Check real-time stock levels of technical components before confirming lead feasibility.
            </p>
          </div>
          <div className="relative z-10">
            <button 
              onClick={() => onNavigate?.('inventory')}
              className="bg-white text-deep-charcoal font-button text-sm px-4 py-2.5 rounded-full flex items-center gap-2 hover:bg-primary-container hover:text-white transition-all duration-200 shadow hover:scale-105 active:scale-95 cursor-pointer font-bold"
            >
              Launch Catalog <span className="material-symbols-outlined text-base">open_in_new</span>
            </button>
          </div>
        </div>
      </div>

      {/* Handover Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            onClick={() => setSelectedLead(null)}
            className="absolute inset-0 bg-deep-charcoal/70 backdrop-blur-[4px] transition-opacity"
          ></div>
          
          <div className="bg-surface-white w-full max-w-4xl max-h-[85vh] rounded-xl shadow-2xl flex overflow-hidden border border-outline transform transition-all z-10">
            {/* Modal Sidebar (Dark) */}
            <div className="w-72 bg-deep-charcoal text-surface-white p-8 flex flex-col justify-between">
              <div>
                <div className="w-12 h-1 bg-primary mb-4"></div>
                <h3 className="font-headline-md text-headline-md text-xl text-white">
                  {selectedLead.status === 'Completed' ? 'Request Details' : 'Request Handoff'}
                </h3>
                <p className="text-surface-variant font-body-sm text-xs mt-1">{selectedLead.id}</p>
                
                <div className="space-y-6 mt-8">
                  <div>
                    <p className="font-label-bold text-label-bold text-[10px] text-surface-variant uppercase tracking-wider mb-2">
                      Original Owner
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center font-bold text-xs">
                        {selectedLead.assignedInitials || 'UA'}
                      </div>
                      <div>
                        <p className="font-body-md text-sm text-white">
                          {selectedLead.assignedAdmin === 'Unassigned' ? 'Unassigned' : selectedLead.assignedAdmin}
                        </p>
                        <p className="text-[10px] text-surface-variant">Operations Dept</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <p className="font-label-bold text-label-bold text-[10px] text-surface-variant uppercase tracking-wider mb-1">
                      Current Client
                    </p>
                    <p className="font-body-md text-sm text-white">{selectedLead.company}</p>
                    <p className="text-[10px] text-surface-variant">Industrial Engineering</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-secondary pt-6">
                <p className="text-[10px] text-surface-variant leading-relaxed italic">
                  By claiming this request, you take full ownership of client communications and specification delivery.
                </p>
              </div>
            </div>

            {/* Modal Main Content */}
            <div className="flex-1 bg-surface flex flex-col justify-between max-h-[85vh]">
              <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-white">
                <h4 className="font-label-bold text-label-bold text-secondary text-xs uppercase tracking-wider">
                  Audit Log & Update History
                </h4>
                <button
                  className="text-secondary hover:text-on-surface transition-colors"
                  onClick={() => setSelectedLead(null)}
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Timeline Audit Log */}
              <div className="flex-grow p-8 overflow-y-auto bg-surface-container-lowest">
                <div className="space-y-8 relative">
                  <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-outline-variant"></div>
                  
                  <div className="relative pl-10 animate-fade-in">
                    <div className="absolute left-1.5 top-2 w-3.5 h-3.5 rounded-full bg-primary border-4 border-surface-white"></div>
                    <div className="bg-surface-white p-4 border border-outline-variant rounded-lg shadow-sm">
                      <div className="flex justify-between items-center mb-1">
                        <p className="font-label-bold text-label-bold text-xs text-on-surface">
                          Initial Inquiry Received
                        </p>
                        <span className="text-[10px] text-secondary">Oct 24, 2023 • 09:15 AM</span>
                      </div>
                      <p className="font-body-sm text-xs text-on-surface-variant italic">
                        "Looking for bulk quote on high-torque industrial gearboxes for Q1 2024 rollout."
                      </p>
                    </div>
                  </div>

                  <div className="relative pl-10 animate-fade-in">
                    <div className="absolute left-1.5 top-2 w-3.5 h-3.5 rounded-full bg-secondary border-4 border-surface-white"></div>
                    <div className="bg-surface-white p-4 border border-outline-variant rounded-lg shadow-sm">
                      <div className="flex justify-between items-center mb-1">
                        <p className="font-label-bold text-label-bold text-xs text-on-surface">
                          Allocated to Operator
                        </p>
                        <span className="text-[10px] text-secondary">Oct 24, 2023 • 10:30 AM</span>
                      </div>
                      <p className="font-body-sm text-xs text-on-surface-variant">
                        Lead allocated based on regional workspace and industry classification.
                      </p>
                    </div>
                  </div>

                  <div className="relative pl-10 animate-fade-in">
                    <div className="absolute left-1.5 top-2 w-3.5 h-3.5 rounded-full bg-tertiary border-4 border-surface-white"></div>
                    <div className="bg-surface-white p-4 border border-outline-variant rounded-lg shadow-sm">
                      <div className="flex justify-between items-center mb-1">
                        <p className="font-label-bold text-label-bold text-xs text-on-surface">
                          Technical Specs Verified
                        </p>
                        <span className="text-[10px] text-secondary">Oct 25, 2023 • 02:45 PM</span>
                      </div>
                      <p className="font-body-sm text-xs text-on-surface-variant">
                        Engineering team confirmed availability of GR-400 series units. Specification sheet attached.
                      </p>
                      <div className="mt-2 inline-flex items-center gap-2 bg-surface-container-low px-2 py-1 rounded text-[10px] border border-outline-variant cursor-pointer hover:bg-outline-variant transition-colors">
                        <span className="material-symbols-outlined text-sm">attachment</span> SPECS_V2.PDF
                      </div>
                    </div>
                  </div>

                  {!selectedLead.status.includes('Completed') && (
                    <div className="relative pl-10 animate-fade-in">
                      <div className="absolute left-1.5 top-2 w-3.5 h-3.5 rounded-full bg-primary-container border-4 border-surface-white"></div>
                      <div className="bg-surface-white p-4 border border-outline-variant rounded-lg shadow-sm">
                        <div className="flex justify-between items-center mb-1">
                          <p className="font-label-bold text-label-bold text-xs text-on-surface">
                            Handoff Triggered
                          </p>
                          <span className="text-[10px] text-secondary">Today • 11:00 AM</span>
                        </div>
                        <p className="font-body-sm text-xs text-on-surface-variant">
                          Owner requested handoff/escalation due to schedule load. Priority: High.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 bg-surface-white border-t border-outline-variant flex justify-end gap-3 shrink-0">
                <button
                  className="px-6 py-2 border border-outline text-on-surface font-button text-sm rounded hover:bg-surface-container-low transition-colors"
                  onClick={() => setSelectedLead(null)}
                >
                  Cancel
                </button>
                {selectedLead.status !== 'Completed' && (
                  <button
                    onClick={() => handleClaimLead(selectedLead.id)}
                    className="px-6 py-2 bg-primary text-surface-white font-button text-sm rounded shadow-lg hover:opacity-90 active:scale-95 transition-all flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">assignment_turned_in</span>
                    Claim Request & Continue
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View All Leads Modal */}
      {showAllLeadsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            onClick={() => setShowAllLeadsModal(false)}
            className="absolute inset-0 bg-deep-charcoal/70 backdrop-blur-[4px] transition-opacity"
          ></div>
          <div className="bg-surface-white w-full max-w-5xl max-h-[85vh] rounded-xl shadow-2xl flex flex-col overflow-hidden border border-outline z-10 animate-fade-in">
            <div className="p-6 bg-deep-charcoal text-surface-white flex items-center justify-between">
              <div>
                <h3 className="font-headline-md text-headline-md text-xl text-white">Full Active Leads Database</h3>
                <p className="text-surface-variant font-body-sm text-xs mt-1">Total 142 Active Requests Registered across All Hubs</p>
              </div>
              <button
                onClick={() => setShowAllLeadsModal(false)}
                className="text-surface-variant hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4 flex-grow bg-surface-container-lowest">
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface-container text-secondary text-xs uppercase font-label-bold">
                  <tr>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Company</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Assigned Admin</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant text-xs">
                  {leads.concat([
                    { id: '#REQ-8320', company: 'Metro Mining Equipment', customer: 'David Vance', assignedAdmin: 'Jack Kern', assignedInitials: 'JK', status: 'In Progress' },
                    { id: '#REQ-8324', company: 'Apex Energy Systems', customer: 'Julia Roberts', assignedAdmin: 'Unassigned', assignedInitials: '', status: 'Pending' },
                    { id: '#REQ-8331', company: 'Titan Hydraulics', customer: 'Marcus Brody', assignedAdmin: 'Sarah Lund', assignedInitials: 'SL', status: 'Completed' },
                    { id: '#REQ-8338', company: 'Starlight Tech Ltd', customer: 'Anna Wang', assignedAdmin: 'Alex Miller', assignedInitials: 'AM', status: 'In Progress' },
                  ]).map((lead) => (
                    <tr key={lead.id} className="hover:bg-surface-container-low">
                      <td className="px-4 py-3 font-bold text-primary">{lead.id}</td>
                      <td className="px-4 py-3 font-semibold">{lead.company}</td>
                      <td className="px-4 py-3 text-secondary">{lead.customer}</td>
                      <td className="px-4 py-3">{lead.assignedAdmin}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          lead.status === 'In Progress' ? 'bg-tertiary-fixed text-on-tertiary-container' : lead.status === 'Pending' ? 'bg-primary-fixed text-on-primary-container' : 'bg-surface-container-highest text-secondary'
                        }`}>{lead.status}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => { setSelectedLead(lead); setShowAllLeadsModal(false); }}
                          className="text-primary hover:underline font-bold text-xs"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-outline-variant bg-surface-white flex justify-between items-center text-xs">
              <span className="text-secondary">Showing 9 of 142 total leads</span>
              <button
                onClick={() => setShowAllLeadsModal(false)}
                className="bg-deep-charcoal text-white px-5 py-2 rounded font-button hover:opacity-90"
              >
                Close Repository View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
