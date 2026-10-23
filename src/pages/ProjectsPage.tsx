import { useState, useEffect, useRef } from 'react';
import { fetchProjects, updateTask, createTask, createProject } from '../services/projectsService';

type KanbanStatus = 'new' | 'inprogress' | 'awaiting' | 'completed';

interface KanbanCard {
  id: string;
  reqId: string;
  title: string;
  description: string;
  priority: 'HIGH PRIORITY' | 'URGENT' | 'ROUTINE' | 'PENDING' | 'DONE';
  priorityLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'ROUTINE';
  budget: number;
  actualCost: number;
  estCompletion: string;
  assignees: string[];
  status: KanbanStatus;
}

const initialCards: KanbanCard[] = [
  {
    id: 'k1',
    reqId: 'REQ-8842',
    title: 'Atlas Copco GA37 Routine Maintenance',
    description: 'Quarterly filter change and oil analysis for Unit 4B.',
    priority: 'HIGH PRIORITY',
    priorityLevel: 'HIGH',
    budget: 850000,
    actualCost: 620000,
    estCompletion: '2026-08-12',
    assignees: ['https://lh3.googleusercontent.com/aida-public/AB6AXuBiWmi2VrxuCvAT1_AmwZtp-zd8-fbW0LCtfPbvrjGty8SfxljM9RVeqMMFDNeTovhaKE8fyRyMZ7Q86_38bSHgzCj4N3Mmti9s6qqD8COAFBkZ9qDwtt69j5fzBBl-qv9DaS9j1T6g47ba0RFw1odgogjEZE-EB6bfBDSioETSeeYvwRGhgfJYGDYXN7vMKUAknIY9UKtjW9e3B2Cj7XfSyKwUanlzB0HDmqAxpaQwqbOYE0jvf4zbCgmGLCY0tc34b6FZcJqyJUA'],
    status: 'new',
  },
  {
    id: 'k2',
    reqId: 'REQ-9011',
    title: 'HVAC System Calibration',
    description: 'Precision calibration of temperature sensors in clean room area.',
    priority: 'ROUTINE',
    priorityLevel: 'ROUTINE',
    budget: 450000,
    actualCost: 310000,
    estCompletion: '2026-08-20',
    assignees: ['https://lh3.googleusercontent.com/aida-public/AB6AXuBdyBpBxS7zFEpYL6yKqImx2TPQrOSB_Q9ESvLgZWKx22lNzLiwHOGtNd49OHb1QzYrvWlmMTLMZMJs7ZY1Yu1L9_OV8m5W0iGHWeBC9vwwhG6fdePNAeF1633SQgLwSJsNiK2Umm5ARSp3JCm1XpkvIRbwKoDl8fRtSOnjMU-Ip-0DiH5c_NKX3G_ra84gXWshSBfACLlpKPPUU24xjdQSFh6pWMq18xu2uN0-Dd-4_ni4NeL0I1CbfTbc_GMOoS7zu5FCWBYX-J0'],
    status: 'new',
  },
  {
    id: 'k3',
    reqId: 'REQ-8755',
    title: 'Generator Lease Delivery',
    description: 'Coordinate logistics for 500kVA Cummins unit to North Site.',
    priority: 'URGENT',
    priorityLevel: 'CRITICAL',
    budget: 2400000,
    actualCost: 1950000,
    estCompletion: '2026-08-05',
    assignees: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAQbRp9UodzmAHE_o8OkYNoLXowqmkp_aZQ7nJkIA9V2w1alk-3O63YsoEEvVfiqc0f8zz8Vw1Zjrs_OHmmscn5xSTxYYzSxHSvmM8ygiwjx6suUBIYKHNwy-TyZ_BAfnfJO0zU9Er5aMUxHJ-JtDtB8GIDCGf34537SKW-0I7dK8ILF1TpEMxWRqQBRrXmwBQ-IRbJp-5w05n3Uazs2DlNotdPQmr9QWZ4UXLlCZ7bziFqajLlQb0xjy3LSbYAXOP1HmtL-KMwZRc',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCMV7g_xahnRTHVY02agTxDHXog9msm0uSD-teNLmxowGgCVGC3UwET7mOQQteKuWnOd5eqH_bBPlbobwarwqNk7svPk7iIAefErMElMZ-Rs8fP_op-jMqsawovDlteF2d49jXOeyELQDe7yGGGmSjWWsU6eENhPvjPNoQEdQzAfSZOSKwsA7c4QzE8puFKCN3hXCYXMuI0ELlzN4Uvctv7msD3nbFXfAxr3ivmsHg0esCA3byVS-obKbVJA_OAp8gQslNJIvjB30E',
    ],
    status: 'inprogress',
  },
  {
    id: 'k4',
    reqId: 'REQ-8201',
    title: 'Hydraulic Press Seal Replacement',
    description: 'Waiting for custom Viton seals from distributor. ETA: Friday.',
    priority: 'PENDING',
    priorityLevel: 'MEDIUM',
    budget: 1100000,
    actualCost: 780000,
    estCompletion: '2026-08-15',
    assignees: ['https://lh3.googleusercontent.com/aida-public/AB6AXuAZhZiDQzPfR00qTjSHAJbfcHBZtcB9OHYMdM05qDiFz93O3t7ju2z09aBANX_2F9FR6yG-LH7M5rLrPDS3eX7jELNye5OQoD38ZahQhLlT2XS5EhOeDvqlnpx4dcXyye3bw38EN3Yw-npaXfr3jvCzdcSM9v7OiZI-ITrADjFjU_eoNy6IiAMXBcRXANX9_PzKkzcJfXVjaa_JifcKzmZkIoH2jymS-miCfxJhpNMEHU4aTl2TeeaLBFROQSJmOF_78Y-Y979dH6c'],
    status: 'awaiting',
  },
  {
    id: 'k5',
    reqId: 'REQ-7994',
    title: 'Pump Station 3 Overhaul',
    description: 'Full bearing replacement and housing alignment completed.',
    priority: 'DONE',
    priorityLevel: 'ROUTINE',
    budget: 3200000,
    actualCost: 2800000,
    estCompletion: '2026-07-28',
    assignees: [],
    status: 'completed',
  },
];

const columns: { id: KanbanStatus; label: string; color: string }[] = [
  { id: 'new', label: 'New Requests', color: 'border-primary' },
  { id: 'inprogress', label: 'Assigned / In Progress', color: 'border-black' },
  { id: 'awaiting', label: 'Awaiting Parts', color: 'border-status-gray' },
  { id: 'completed', label: 'Completed', color: 'border-primary-dark' },
];

const priorityLevelBadgeStyles: Record<string, { bg: string; text: string; icon: string }> = {
  CRITICAL: { bg: 'bg-error text-white', text: 'CRITICAL', icon: 'local_fire_department' },
  HIGH: { bg: 'bg-primary text-white', text: 'HIGH PRIORITY', icon: 'priority_high' },
  MEDIUM: { bg: 'bg-tertiary-fixed text-on-tertiary-container border border-tertiary', text: 'MEDIUM', icon: 'bolt' },
  ROUTINE: { bg: 'bg-surface-container-highest text-secondary', text: 'ROUTINE', icon: 'info' },
};

const topAccentStyles: Record<KanbanStatus, string> = {
  new: 'border-t-primary',
  inprogress: 'border-t-tertiary',
  awaiting: 'border-t-status-gray',
  completed: 'border-t-on-tertiary-fixed-variant',
};

const fmtNGN = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(n);

export default function ProjectsPage() {
  const [cards, setCards] = useState<KanbanCard[]>(initialCards);
  
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  
  const [savingCards, setSavingCards] = useState<Set<string>>(new Set());
  const [savedCards, setSavedCards] = useState<Set<string>>(new Set());
  const [dragOverColumn, setDragOverColumn] = useState<KanbanStatus | null>(null);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskStatus, setNewTaskStatus] = useState<KanbanStatus>('new');
  const draggingCardId = useRef<string | null>(null);

  const statusToBackend: Record<KanbanStatus, 'backlog' | 'in_progress' | 'review' | 'done'> = {
    new: 'backlog',
    inprogress: 'in_progress',
    awaiting: 'review',
    completed: 'done',
  };

  const backendToStatus: Record<string, KanbanStatus> = {
    backlog: 'new',
    in_progress: 'inprogress',
    review: 'awaiting',
    done: 'completed',
  };

  const loadProjectsAndTasks = () => {
    
    fetchProjects()
      .then((res) => {
        if (res && res.data && res.data.length > 0) {
          
          const firstProj = res.data[0];
          setActiveProjectId(firstProj.id);
          
          if (firstProj.tasks && firstProj.tasks.length > 0) {
            const mappedCards: KanbanCard[] = firstProj.tasks.map((t, idx) => ({
              id: t.id,
              reqId: `TSK-${idx + 100}`,
              title: t.title,
              description: t.description || 'Routine engineering assignment.',
              priority: 'HIGH PRIORITY',
              priorityLevel: 'HIGH',
              budget: 650000,
              actualCost: 420000,
              estCompletion: t.due_date || '2026-09-01',
              assignees: [],
              status: backendToStatus[t.status] || 'new',
            }));
            setCards(mappedCards);
          }
        }
      })
      .catch(() => {})
      ;
  };

  useEffect(() => {
    loadProjectsAndTasks();
  }, []);

  const handleDragStart = (cardId: string) => {
    draggingCardId.current = cardId;
  };

  const handleDrop = async (targetStatus: KanbanStatus) => {
    const cardId = draggingCardId.current;
    if (cardId) {
      setCards((prev) =>
        prev.map((card) =>
          card.id === cardId ? { ...card, status: targetStatus } : card
        )
      );

      // Sync with backend if real task ID
      if (!cardId.startsWith('k')) {
        try {
          await updateTask(cardId, { status: statusToBackend[targetStatus] });
        } catch {
          // Graceful fallback
        }
      }
    }
    draggingCardId.current = null;
    setDragOverColumn(null);
  };

  const handleCreateNewTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    let projId = activeProjectId;
    if (!projId) {
      try {
        const newP = await createProject({ title: 'Mandtech Yard Operations', description: 'General fleet maintenance' });
        projId = newP.data.id;
        setActiveProjectId(projId);
      } catch {
        projId = 'proj-local';
      }
    }

    try {
      const res = await createTask(projId, {
        title: newTaskTitle.trim(),
        description: newTaskDesc.trim() || undefined,
        status: statusToBackend[newTaskStatus],
      });
      const newCard: KanbanCard = {
        id: res.data?.id || `k${Date.now()}`,
        reqId: `TSK-${Math.floor(100 + Math.random() * 900)}`,
        title: newTaskTitle.trim(),
        description: newTaskDesc.trim() || 'New site assignment.',
        priority: 'HIGH PRIORITY',
        priorityLevel: 'HIGH',
        budget: 500000,
        actualCost: 200000,
        estCompletion: new Date().toISOString().split('T')[0],
        assignees: [],
        status: newTaskStatus,
      };
      setCards((prev) => [newCard, ...prev]);
    } catch {
      const newCard: KanbanCard = {
        id: `k${Date.now()}`,
        reqId: `TSK-${Math.floor(100 + Math.random() * 900)}`,
        title: newTaskTitle.trim(),
        description: newTaskDesc.trim(),
        priority: 'ROUTINE',
        priorityLevel: 'ROUTINE',
        budget: 350000,
        actualCost: 100000,
        estCompletion: new Date().toISOString().split('T')[0],
        assignees: [],
        status: newTaskStatus,
      };
      setCards((prev) => [newCard, ...prev]);
    }

    setNewTaskTitle('');
    setNewTaskDesc('');
    setShowNewTaskModal(false);
  };

  const handleLogProgress = (cardId: string) => {
    setSavingCards((prev) => new Set(prev).add(cardId));
    setTimeout(() => {
      setSavingCards((prev) => {
        const next = new Set(prev);
        next.delete(cardId);
        return next;
      });
      setSavedCards((prev) => new Set(prev).add(cardId));
      setTimeout(() => {
        setSavedCards((prev) => {
          const next = new Set(prev);
          next.delete(cardId);
          return next;
        });
      }, 2000);
    }, 1000);
  };

  const totalPortfolioBudget = cards.reduce((sum, c) => sum + c.budget, 0);
  const totalPortfolioSpend = cards.reduce((sum, c) => sum + c.actualCost, 0);
  const portfolioProfitMargin = Math.round(((totalPortfolioBudget - totalPortfolioSpend) / totalPortfolioBudget) * 100);

  return (
    <div className="pb-16 space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-deep-charcoal">
            Engineering Project Board & Cost Tracking
          </h2>
          <p className="font-body-md text-body-md text-secondary mt-1">
            Manage site operations, visual priorities, completion timelines, and profitability metrics.
          </p>
        </div>
        <div className="flex gap-3 shrink-0">
          <button className="flex items-center gap-2 border border-outline px-4 py-2 rounded font-button text-sm text-deep-charcoal hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined text-lg">filter_list</span> Filter
          </button>
          <button
            onClick={() => setShowNewTaskModal(true)}
            className="flex items-center gap-2 bg-primary text-white hover:bg-black px-5 py-2 rounded font-button text-sm hover:shadow-md transition-all shadow-sm font-bold"
          >
            <span className="material-symbols-outlined text-lg">add</span> New Project
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {columns.map((col) => {
          const colCards = cards.filter((c) => c.status === col.id);
          return (
            <div
              key={col.id}
              className={`flex flex-col gap-4 min-h-[300px] rounded-lg transition-all duration-200 ${
                dragOverColumn === col.id
                  ? 'bg-primary-container/5 ring-2 ring-dashed ring-primary p-2'
                  : ''
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverColumn(col.id);
              }}
              onDragLeave={() => setDragOverColumn(null)}
              onDrop={() => handleDrop(col.id)}
            >
              {/* Column Header */}
              <div className={`flex items-center justify-between px-2 border-b-2 pb-2 ${col.color}`}>
                <span className="font-label-bold text-deep-charcoal uppercase text-[11px] tracking-widest flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${col.color.replace('border-', 'bg-')}`}></span>
                  {col.label}
                </span>
                <span className="bg-surface-container-high text-on-surface px-2 py-0.5 rounded-full text-xs font-bold">
                  {colCards.length}
                </span>
              </div>

              {/* Cards */}
              {colCards.map((card) => {
                const spendPercentage = Math.min(100, Math.round((card.actualCost / card.budget) * 100));
                const profit = card.budget - card.actualCost;
                const badgeInfo = priorityLevelBadgeStyles[card.priorityLevel] || priorityLevelBadgeStyles.ROUTINE;

                return (
                  <div
                    key={card.id}
                    draggable
                    onDragStart={() => handleDragStart(card.id)}
                    onDragEnd={() => setDragOverColumn(null)}
                    className={`bg-surface-white border border-outline-variant p-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-grab active:cursor-grabbing border-t-4 ${topAccentStyles[card.status]} ${
                      card.status === 'completed' ? 'grayscale opacity-75 hover:grayscale-0 hover:opacity-100' : ''
                    }`}
                  >
                    {/* Header Row with Request ID & Visual Priority Badge */}
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        card.status === 'completed'
                          ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                          : card.status === 'new'
                          ? 'bg-primary-fixed text-on-primary-fixed'
                          : 'bg-surface-container-high text-on-surface'
                      }`}>
                        {card.reqId}
                      </span>
                      {/* Visual Priority Indicator */}
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold flex items-center gap-1 shadow-sm ${badgeInfo.bg}`}>
                        <span className="material-symbols-outlined text-xs">{badgeInfo.icon}</span>
                        {badgeInfo.text}
                      </span>
                    </div>

                    <h4 className="font-label-bold text-body-md text-deep-charcoal mb-1 leading-tight text-sm">
                      {card.title}
                    </h4>
                    <p className="font-body-sm text-body-sm text-secondary mb-3 text-xs leading-relaxed">
                      {card.description}
                    </p>

                    {/* Estimated Completion Date Indicator */}
                    <div className="bg-surface-container-low p-2 rounded mb-3 flex items-center justify-between text-[11px]">
                      <span className="text-secondary flex items-center gap-1 font-bold">
                        <span className="material-symbols-outlined text-sm text-primary">event</span> Est. Completion:
                      </span>
                      <span className="font-bold text-deep-charcoal">{card.estCompletion}</span>
                    </div>

                    {/* Budget & Profitability Cost Tracking */}
                    <div className="mb-4 p-2.5 bg-surface rounded border border-outline-variant/60 space-y-1.5">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-bold text-secondary uppercase tracking-wider">Cost vs Budget</span>
                        <span className={`font-bold ${profit >= 0 ? 'text-primary' : 'text-error'}`}>
                          Margin: +{Math.round((profit / card.budget) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-outline-variant/40 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            spendPercentage > 90 ? 'bg-error' : spendPercentage > 75 ? 'bg-primary' : 'bg-primary-container'
                          }`}
                          style={{ width: `${spendPercentage}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-secondary font-medium">
                        <span>Spent: <strong className="text-deep-charcoal">{fmtNGN(card.actualCost)}</strong></span>
                        <span>Budget: <strong className="text-deep-charcoal">{fmtNGN(card.budget)}</strong></span>
                      </div>
                    </div>

                    {/* Assignees & Action Button */}
                    <div className="flex items-center justify-between pt-3 border-t border-outline-variant/30">
                      <div className="flex -space-x-2">
                        {card.assignees.map((url, i) => (
                          <img
                            key={i}
                            alt="Team member"
                            className="w-7 h-7 rounded-full border-2 border-surface-white bg-surface-container object-cover"
                            src={url}
                          />
                        ))}
                      </div>

                      {card.status === 'awaiting' ? (
                        <button className="font-button text-[11px] bg-outline/60 text-white px-3 py-1.5 rounded cursor-not-allowed opacity-50 flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">lock</span>
                          On Hold
                        </button>
                      ) : card.status !== 'completed' ? (
                        <button
                          onClick={() => handleLogProgress(card.id)}
                          className={`font-button text-[11px] px-3 py-1.5 rounded flex items-center gap-1 transition-colors duration-200 ${
                            savedCards.has(card.id)
                              ? 'bg-green-600 text-white'
                              : 'bg-deep-charcoal text-white hover:bg-secondary'
                          }`}
                        >
                          {savingCards.has(card.id) ? (
                            <>
                              <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                              Saving...
                            </>
                          ) : savedCards.has(card.id) ? (
                            <>
                              <span className="material-symbols-outlined text-sm">check</span>
                              Saved
                            </>
                          ) : (
                            <>
                              <span className="material-symbols-outlined text-sm">history_edu</span>
                              Log Progress
                            </>
                          )}
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}

              {/* Empty column hint */}
              {colCards.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center py-10 border-2 border-dashed border-outline-variant/40 rounded-lg">
                  <span className="material-symbols-outlined text-3xl text-outline-variant/60 mb-2">
                    inbox
                  </span>
                  <p className="text-xs text-secondary/60">Drop cards here</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Productivity & Financial Portfolio Analytics */}
      <section className="mt-4 bg-deep-charcoal rounded-xl p-8 text-surface-white relative overflow-hidden shadow-lg">
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-headline-md text-headline-md text-xl text-white mb-1">Site & Cost Profitability</h3>
            <p className="font-body-sm text-body-sm text-surface-variant text-xs">
              Real-time portfolio budget tracking & sprint performance metrics.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-surface-variant uppercase font-bold tracking-wider">Total Portfolio Budget</p>
                <p className="text-xl font-bold text-white mt-0.5">{fmtNGN(totalPortfolioBudget)}</p>
              </div>
              <div>
                <p className="text-[10px] text-surface-variant uppercase font-bold tracking-wider">Est. Profit Margin</p>
                <p className="text-xl font-bold text-primary mt-0.5">+{portfolioProfitMargin}%</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <div className="flex justify-between text-xs font-label-bold uppercase tracking-wider mb-2 text-surface-variant">
              <span>Sprint Budget Utilization</span>
              <span>{fmtNGN(totalPortfolioSpend)} spent</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-primary h-full rounded-full transition-all duration-1000"
                style={{ width: `${Math.round((totalPortfolioSpend / totalPortfolioBudget) * 100)}%` }}
              ></div>
            </div>
            <div className="grid grid-cols-4 gap-2 mt-6">
              {[
                { label: 'New', count: cards.filter((c) => c.status === 'new').length },
                { label: 'Active', count: cards.filter((c) => c.status === 'inprogress').length },
                { label: 'Blocked', count: cards.filter((c) => c.status === 'awaiting').length },
                { label: 'Done', count: cards.filter((c) => c.status === 'completed').length },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-2xl font-bold text-white">{stat.count}</p>
                  <p className="text-[10px] text-surface-variant uppercase tracking-wider">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center md:justify-end">
            <div className="flex items-end gap-1.5 h-24">
              {[40, 65, 50, 80, 60, 92, 45].map((h, i) => (
                <div
                  key={i}
                  className={`w-6 rounded-t transition-all duration-500 ${
                    i === 5 ? 'bg-primary' : 'bg-white/20'
                  }`}
                  style={{ height: `${h}%` }}
                ></div>
              ))}
            </div>
          </div>
        </div>

        {/* Dot grid background */}
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        ></div>
      </section>
    
      {/* New Task / Card Modal */}
      {showNewTaskModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-white border border-outline rounded-lg max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-outline-variant pb-3">
              <h3 className="font-headline-sm text-headline-sm">Create New Kanban Task</h3>
              <button onClick={() => setShowNewTaskModal(false)} className="text-secondary hover:text-on-surface font-bold text-lg">✕</button>
            </div>
            <form onSubmit={handleCreateNewTask} className="space-y-4 text-sm">
              <div>
                <label className="block font-bold text-xs uppercase text-secondary mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sullair 185 Oil & Filter Change"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full bg-surface-container border border-outline rounded px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block font-bold text-xs uppercase text-secondary mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Technical scope, yard location, or machine serial number..."
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  className="w-full bg-surface-container border border-outline rounded px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block font-bold text-xs uppercase text-secondary mb-1">Initial Column / Status</label>
                <select
                  value={newTaskStatus}
                  onChange={(e) => setNewTaskStatus(e.target.value as any)}
                  className="w-full bg-surface-container border border-outline rounded px-3 py-2 text-sm font-medium"
                >
                  <option value="new">New Requests</option>
                  <option value="inprogress">Assigned / In Progress</option>
                  <option value="awaiting">Awaiting Parts</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => setShowNewTaskModal(false)}
                  className="px-4 py-2 border border-outline rounded text-secondary hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-surface-white rounded font-bold hover:opacity-90"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}