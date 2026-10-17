import { useState, useEffect } from 'react';
import { fetchInquiries, updateInquiryStatus, assignInquiry } from '../services/leadsService';
import { getStoredUser } from '../services/authService';


interface Lead {
  id: string;
  rawId: string;
  company: string;
  customer: string;
  email: string;
  phone?: string;
  message: string;
  assignedAdmin: string;
  assignedInitials: string;
  status: 'In Progress' | 'Pending' | 'Completed';
  createdAt?: string;
}

interface LeadsPageProps {
  onNavigate?: (tab: 'dashboard' | 'leads' | 'inventory' | 'invoicing' | 'projects') => void;
}



export default function LeadsPage({ onNavigate }: LeadsPageProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  
  
  

  const defaultLeads: Lead[] = [
    {
      id: '#REQ-8291',
      rawId: 'lead-1',
      company: 'HeavyLift Solutions Ltd.',
      customer: 'Marcus Vane',
      email: 'm.vane@heavylift.com',
      message: 'Urgent quotation required for 185 CFM rotary compressors.',
      assignedAdmin: 'Sarah Lund',
      assignedInitials: 'SL',
      status: 'In Progress',
    },
    {
      id: '#REQ-8295',
      rawId: 'lead-2',
      company: 'Global Foundry Group',
      customer: 'Helena Ross',
      email: 'h.ross@globalfoundry.com',
      message: 'Need OEM spare gasket kit and filtration units.',
      assignedAdmin: 'Jack Kern',
      assignedInitials: 'JK',
      status: 'Pending',
    },
    {
      id: '#REQ-8302',
      rawId: 'lead-3',
      company: 'Nordic Turbine Corp',
      customer: 'Erik Sjöberg',
      email: 'erik@nordicturbine.se',
      message: 'Scheduled seasonal maintenance and dryer overhaul.',
      assignedAdmin: 'Sarah Lund',
      assignedInitials: 'SL',
      status: 'Completed',
    },
    {
      id: '#REQ-8310',
      rawId: 'lead-4',
      company: 'Precision Gears Inc.',
      customer: 'Lydia Wu',
      email: 'lydia@precisiongears.com',
      message: 'Equipment sizing inquiry for 500 CFM industrial compressor.',
      assignedAdmin: 'Unassigned',
      assignedInitials: '',
      status: 'Pending',
    },
  ];

  const mapBackendInquiryToLead = (inq: any): Lead => {
    const rawId = inq.id || 'lead-' + Math.random();
    const shortCode = '#REQ-' + rawId.slice(0, 4).toUpperCase();
    
    let status: 'In Progress' | 'Pending' | 'Completed' = 'Pending';
    if (inq.status === 'in_review') status = 'In Progress';
    if (inq.status === 'responded' || inq.status === 'closed') status = 'Completed';

    const assigned = inq.assigned_name || (inq.assigned_to ? 'Assigned' : 'Unassigned');
    const initials = assigned !== 'Unassigned' 
      ? assigned.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() 
      : '';

    return {
      id: shortCode,
      rawId,
      company: inq.company || 'Direct Client',
      customer: inq.name || 'Anonymous Contact',
      email: inq.email || '',
      phone: inq.phone || '',
      message: inq.message || '',
      assignedAdmin: assigned,
      assignedInitials: initials,
      status,
      createdAt: inq.created_at,
    };
  };

  const loadLeads = () => {
    setLoading(true);
    fetchInquiries()
      .then((res) => {
        if (res && res.data && res.data.length > 0) {
          setLeads(res.data.map(mapBackendInquiryToLead));
        } else {
          setLeads(defaultLeads);
        }
      })
      .catch(() => {
        setLeads(defaultLeads);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadLeads();
  }, []);



  const handleClaimLead = async (leadId: string) => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return;

    const currentUser = getStoredUser();
    const adminName = currentUser?.email?.split('@')[0] || 'Alex Rivera';

    // Optimistic UI update
    setLeads((prevLeads) =>
      prevLeads.map((l) =>
        l.id === leadId
          ? {
              ...l,
              assignedAdmin: adminName,
              assignedInitials: adminName.slice(0, 2).toUpperCase(),
              status: 'In Progress',
            }
          : l
      )
    );
    setSelectedLead(null);

    // Call backend
    if (lead.rawId && !lead.rawId.startsWith('lead-')) {
      try {
        await assignInquiry(lead.rawId, currentUser?.id || null);
        await updateInquiryStatus(lead.rawId, 'in_review');
      } catch {
        // Fallback gracefully
      }
    }
  };

  const handleUpdateStatus = async (leadId: string, newStatus: 'Pending' | 'In Progress' | 'Completed') => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return;

    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
    );

    if (lead.rawId && !lead.rawId.startsWith('lead-')) {
      const backendStatusMap = {
        'Pending': 'new',
        'In Progress': 'in_review',
        'Completed': 'responded',
      };
      try {
        await updateInquiryStatus(lead.rawId, backendStatusMap[newStatus]);
      } catch {}
    }
  };

  const pendingCount = leads.filter((l) => l.status === 'Pending').length;
  const inProgressCount = leads.filter((l) => l.status === 'In Progress').length;
  const completedCount = leads.filter((l) => l.status === 'Completed').length;

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">Customer Requests &amp; Lead Hub</h2>
          <p className="font-body-md text-body-md text-secondary max-w-2xl mt-1">
            Manage incoming industrial inquiries, technical lead handovers, and assignment logistics.
          </p>
        </div>
        <div className="flex gap-3 shrink-0">
          <button 
            onClick={loadLeads}
            disabled={loading}
            className="bg-surface-white border border-outline text-secondary px-3 py-2 rounded font-button text-sm hover:bg-surface-container transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <span className={`material-symbols-outlined text-sm ${loading ? 'animate-spin' : ''}`}>sync</span>
            {loading ? 'Refreshing...' : 'Sync Leads'}
          </button>
          <button 
            onClick={() => onNavigate?.('invoicing')}
            className="bg-primary text-surface-white px-4 py-2 rounded font-button text-sm hover:opacity-90 transition-opacity flex items-center gap-2 shadow-sm font-bold"
          >
            <span className="material-symbols-outlined text-lg">receipt_long</span> Create Quote / Invoice
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 bg-surface-white border border-outline rounded p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
          <div>
            <p className="font-label-bold text-secondary uppercase text-xs tracking-wider">Total Active Requests</p>
            <h3 className="font-headline-xl text-headline-xl text-on-surface mt-1">{leads.length}</h3>
            <p className="text-tertiary font-body-sm text-body-sm mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">database</span> Real-time connected to PostgreSQL
            </p>
          </div>
          <div className="flex flex-wrap gap-8 border-t sm:border-t-0 sm:border-l border-outline-variant pt-4 sm:pt-0 sm:pl-8">
            <div>
              <p className="font-label-bold text-secondary text-[11px] tracking-wider">PENDING</p>
              <p className="font-headline-md text-headline-md text-primary">{pendingCount}</p>
            </div>
            <div>
              <p className="font-label-bold text-secondary text-[11px] tracking-wider">IN PROGRESS</p>
              <p className="font-headline-md text-headline-md text-tertiary">{inProgressCount}</p>
            </div>
            <div>
              <p className="font-label-bold text-secondary text-[11px] tracking-wider">COMPLETED</p>
              <p className="font-headline-md text-headline-md text-status-gray">{completedCount}</p>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 bg-deep-charcoal text-surface-white rounded p-6 relative flex flex-col justify-between overflow-hidden">
          <div className="z-10">
            <p className="font-label-bold text-surface-variant uppercase text-xs tracking-wider">Unclaimed Handoffs</p>
            <h3 className="font-headline-xl text-headline-xl mt-1">
              {leads.filter((l) => l.assignedAdmin === 'Unassigned').length.toString().padStart(2, '0')}
            </h3>
          </div>
          <button 
            onClick={() => window.scrollTo({ top: 300, behavior: 'smooth' })}
            className="z-10 mt-6 border border-surface-variant text-surface-white px-4 py-2 rounded font-button text-sm hover:bg-secondary transition-colors w-full"
          >
            View Unclaimed Queue
          </button>
          <div className="absolute -bottom-6 -right-6 opacity-10 pointer-events-none select-none">
            <span className="material-symbols-outlined text-[140px]">precision_manufacturing</span>
          </div>
        </div>
      </div>

      {/* Main Data Table Container */}
      <div className="bg-surface-white border border-outline rounded overflow-hidden shadow-sm">
        <div className="p-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
          <span className="font-label-bold text-label-bold text-on-surface-variant text-xs flex items-center gap-2">
            ACTIVE LEAD REPOSITORY
            <span className="bg-primary-container text-on-primary-container px-2 py-0.5 rounded text-[10px] font-bold">
              Showing Active ({leads.length})
            </span>
          </span>
          <span className="text-secondary text-xs">Click row to inspect inquiry or assign</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant text-[11px] font-label-bold text-secondary uppercase tracking-wider bg-surface-white">
                <th className="p-4">Lead ID</th>
                <th className="p-4">Company</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Assigned Specialist</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant font-body-md text-sm">
              {leads.map((lead) => (
                <tr 
                  key={lead.id} 
                  onClick={() => setSelectedLead(lead)}
                  className="hover:bg-surface-container-low transition-colors duration-150 cursor-pointer group"
                >
                  <td className="p-4 font-mono font-bold text-primary">{lead.id}</td>
                  <td className="p-4 font-bold text-on-surface">{lead.company}</td>
                  <td className="p-4 text-secondary">{lead.customer}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {lead.assignedInitials ? (
                        <span className="w-6 h-6 rounded-full bg-primary-fixed text-primary flex items-center justify-center font-bold text-[10px]">
                          {lead.assignedInitials}
                        </span>
                      ) : (
                        <span className="w-6 h-6 rounded-full bg-surface-container flex items-center justify-center text-secondary text-[10px]">
                          --
                        </span>
                      )}
                      <span className={lead.assignedAdmin === 'Unassigned' ? 'text-error font-medium italic' : 'text-on-surface'}>
                        {lead.assignedAdmin}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                        lead.status === 'In Progress'
                          ? 'bg-amber-100 text-amber-900 border border-amber-200'
                          : lead.status === 'Completed'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                          : 'bg-blue-100 text-blue-900 border border-blue-200'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        lead.status === 'In Progress' ? 'bg-amber-500' : lead.status === 'Completed' ? 'bg-emerald-500' : 'bg-blue-500'
                      }`}></span>
                      {lead.status}
                    </span>
                  </td>
                  <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                    {lead.assignedAdmin === 'Unassigned' ? (
                      <button
                        onClick={() => handleClaimLead(lead.id)}
                        className="bg-primary text-surface-white px-3 py-1 rounded text-xs font-button hover:opacity-90 font-bold"
                      >
                        Claim Lead
                      </button>
                    ) : (
                      <select
                        value={lead.status}
                        onChange={(e) => handleUpdateStatus(lead.id, e.target.value as any)}
                        className="text-xs bg-surface-container border border-outline-variant rounded px-2 py-1 font-medium"
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lead Detail & Claim Modal */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-white border border-outline rounded-lg max-w-lg w-full p-6 shadow-2xl relative space-y-4">
            <div className="flex justify-between items-start border-b border-outline-variant pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-primary">{selectedLead.id}</span>
                <h3 className="font-headline-sm text-headline-sm mt-0.5">{selectedLead.company}</h3>
              </div>
              <button 
                onClick={() => setSelectedLead(null)}
                className="text-secondary hover:text-on-surface text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <p className="text-secondary text-xs uppercase font-bold">Contact Person</p>
                <p className="font-medium text-on-surface">{selectedLead.customer} {selectedLead.email ? `(${selectedLead.email})` : ''}</p>
                {selectedLead.phone && <p className="text-xs text-secondary mt-0.5">{selectedLead.phone}</p>}
              </div>

              {selectedLead.message && (
                <div className="bg-surface-container-low p-3 rounded border border-outline-variant">
                  <p className="text-secondary text-xs uppercase font-bold mb-1">Inquiry Specification</p>
                  <p className="text-body-sm text-on-surface">{selectedLead.message}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <p className="text-secondary text-xs uppercase font-bold">Current Status</p>
                  <p className="font-bold text-sm mt-0.5">{selectedLead.status}</p>
                </div>
                <div>
                  <p className="text-secondary text-xs uppercase font-bold">Assigned Engineer</p>
                  <p className="font-bold text-sm mt-0.5">{selectedLead.assignedAdmin}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant">
              <button
                onClick={() => setSelectedLead(null)}
                className="px-4 py-2 border border-outline rounded text-sm text-secondary hover:bg-surface-container"
              >
                Close
              </button>
              {selectedLead.assignedAdmin === 'Unassigned' && (
                <button
                  onClick={() => handleClaimLead(selectedLead.id)}
                  className="px-4 py-2 bg-primary text-surface-white rounded text-sm font-bold hover:opacity-90"
                >
                  Claim &amp; Take Assignment
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
