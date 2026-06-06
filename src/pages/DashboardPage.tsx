

export default function DashboardPage() {
  const incomingRequests = [
    {
      id: 1,
      source: 'WhatsApp',
      company: 'Global Logistics Corp',
      customer: 'David Chen',
      message: 'Inquiry about heavy excavator lease terms.',
      time: '2m ago',
      active: true,
      icon: 'chat',
    },
    {
      id: 2,
      source: 'Email',
      company: 'Apex Construction Ltd.',
      customer: 'Sarah Miller',
      message: 'Technical spec request for Generator Set #44.',
      time: '15m ago',
      active: false,
      icon: 'mail',
    },
    {
      id: 3,
      source: 'WhatsApp',
      company: 'Urban Dev Group',
      customer: 'John Doe',
      message: 'Urgent maintenance request for onsite crane.',
      time: '42m ago',
      active: false,
      icon: 'chat',
    },
  ];

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
      {/* 1. Staff Attendance Banner */}
      <section className="bg-surface-white border border-outline-variant rounded-lg p-6 flex items-center justify-between shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-primary-container"></div>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
              how_to_reg
            </span>
          </div>
          <div>
            <p className="font-label-bold text-primary uppercase text-xs tracking-wider">Staff Attendance</p>
            <h2 className="font-headline-md text-headline-md mt-0.5">Logged in at 08:30 AM</h2>
          </div>
        </div>
        <div className="text-right">
          <p className="text-secondary text-body-sm">
            Status: <span className="text-on-primary-fixed-variant font-bold">On Time</span>
          </p>
          <p className="text-secondary text-body-sm">Shift Ends: 05:30 PM</p>
        </div>
      </section>

      {/* 2. Metrics Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Metric 1 */}
        <div className="bg-surface-white border border-outline-variant rounded-lg p-6 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-surface-container rounded-lg">
              <span className="material-symbols-outlined text-secondary">public</span>
            </div>
            <span className="text-status-gray text-label-bold text-xs">+12% vs yesterday</span>
          </div>
          <h3 className="text-secondary font-label-bold uppercase text-xs tracking-wider">New Web Inquiries Today</h3>
          <p className="font-headline-lg text-headline-lg mt-1">12</p>
        </div>

        {/* Metric 2 */}
        <div className="bg-surface-white border border-outline-variant rounded-lg p-6 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-surface-container rounded-lg">
              <span className="material-symbols-outlined text-secondary">precision_manufacturing</span>
            </div>
            <span className="text-on-primary-fixed-variant font-label-bold text-xs">Optimal Load</span>
          </div>
          <h3 className="text-secondary font-label-bold uppercase text-xs tracking-wider">Active Leases</h3>
          <p className="font-headline-lg text-headline-lg mt-1">45</p>
        </div>

        {/* Metric 3 */}
        <div className="bg-surface-white border border-outline-variant rounded-lg p-6 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 border-t-4 border-t-primary-container">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-error-container rounded-lg">
              <span className="material-symbols-outlined text-error">warning</span>
            </div>
            <span className="text-error font-label-bold text-xs">Action Required</span>
          </div>
          <h3 className="text-secondary font-label-bold uppercase text-xs tracking-wider">Low Stock Alerts</h3>
          <p className="font-headline-lg text-headline-lg mt-1">8</p>
        </div>
      </section>

      {/* 3. Main Split View */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Incoming Requests Feed */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between mb-2 px-1">
            <h3 className="font-headline-md text-headline-md">Live Incoming Requests</h3>
            <button className="text-primary font-button text-button text-sm hover:underline">
              View All Requests
            </button>
          </div>

          {incomingRequests.map((req) => (
            <div
              key={req.id}
              className="bg-surface-white border border-outline-variant rounded-lg p-4 flex gap-4 items-center hover:bg-surface-container-low transition-colors duration-200 cursor-pointer"
            >
              <div className="w-12 h-12 bg-surface-container-high rounded flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-secondary">{req.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-body-md truncate">{req.company}</h4>
                  <span className="bg-surface-container px-2 py-0.5 rounded text-[10px] font-bold text-secondary uppercase">
                    {req.source}
                  </span>
                </div>
                <p className="text-secondary text-body-sm truncate mt-0.5">
                  Customer: {req.customer} • {req.message}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[11px] text-status-gray font-label-bold">{req.time}</p>
                <span
                  className={`inline-block w-2 h-2 rounded-full mt-1 ${
                    req.active ? 'bg-primary-container animate-pulse' : 'bg-transparent'
                  }`}
                ></span>
              </div>
            </div>
          ))}

          {/* Large Featured Card */}
          <div className="relative rounded-lg overflow-hidden group h-64 border border-outline-variant shadow-sm mt-6">
            <img
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              alt="Technician inspecting diesel generator"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAfnzLBqVIRb7Z4G-epCwiuv6HsarDnEA8knn2CaxTUSkHMnj-9hIYBUabJnmg2l-gKe2tlhbztxgWYH8qts6ES0oF-oyC26jF_R6DbbyzTHMUzqO16wcPDQ5Xp82BMTFCD3jeVjCLcE6z-CqypRinNlMoi-wT5o8delF9zxzaRKK4K90SU2uzmCCWan9byfQN3f5JDwgiyEyDGvn1SSPgffp9CPqB6RMWcfUmxmj9RcuUVHIKOKTvaQ1ROSzSNFCL_Tt-_8a_6rtE"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-deep-charcoal via-transparent to-transparent opacity-90"></div>
            <div className="absolute bottom-0 left-0 p-6 w-full z-10">
              <span className="bg-primary-container text-on-primary-container px-3 py-1 rounded-full text-label-bold text-xs uppercase mb-2 inline-block">
                Priority Maintenance
              </span>
              <h4 className="text-surface-white font-headline-md text-headline-md leading-tight text-xl">
                Quarterly Calibration Phase 2: Industrial Area C
              </h4>
              <p className="text-surface-variant text-body-sm mt-1">Scheduled for tomorrow, 09:00 AM</p>
            </div>
          </div>
        </div>

        {/* Right: Quick-Glance Task Board */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="bg-surface-white border border-outline-variant rounded-lg p-6 flex-1 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-headline-md text-headline-md">Task Board</h3>
              <button className="bg-surface-container hover:bg-surface-container-high p-2 rounded-full transition-colors duration-200">
                <span className="material-symbols-outlined">add</span>
              </button>
            </div>

            <div className="space-y-6">
              {/* Task Category 1: In Progress */}
              <div>
                <h4 className="text-secondary font-label-bold uppercase text-xs tracking-wider mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
                  In Progress ({tasks.inProgress.length})
                </h4>
                <div className="space-y-3">
                  {tasks.inProgress.map((task) => (
                    <div
                      key={task.id}
                      className="bg-surface-container-lowest border border-outline-variant p-3 rounded-lg flex items-start justify-between group hover:border-outline transition-all duration-200"
                    >
                      <div>
                        <p className="font-bold text-body-md text-sm">{task.title}</p>
                        <p className="text-secondary text-[11px]">Assigned to: {task.user}</p>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="material-symbols-outlined text-secondary cursor-pointer">
                          drag_indicator
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Task Category 2: Backlog */}
              <div>
                <h4 className="text-secondary font-label-bold uppercase text-xs tracking-wider mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-status-gray"></span>
                  Backlog ({tasks.backlog.length})
                </h4>
                <div className="space-y-3">
                  {tasks.backlog.map((task) => (
                    <div
                      key={task.id}
                      className="bg-surface-container-lowest border border-outline-variant p-3 rounded-lg flex items-start justify-between group grayscale hover:grayscale-0 hover:border-outline transition-all duration-200"
                    >
                      <div>
                        <p className="font-bold text-body-md text-sm">{task.title}</p>
                        <p className="text-secondary text-[11px]">Assigned to: {task.user}</p>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="material-symbols-outlined text-secondary cursor-pointer">
                          drag_indicator
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance Data Visual */}
              <div className="mt-8 pt-8 border-t border-outline-variant">
                <h4 className="text-secondary font-label-bold uppercase text-xs tracking-wider mb-4">
                  Daily Fleet Utilization
                </h4>
                <div className="flex items-end gap-2 h-20 px-1">
                  {utilizationData.map((bar, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end">
                      <div
                        className={`w-full rounded-t-sm transition-all duration-500 ${
                          bar.active
                            ? 'bg-primary-container shadow-[0_0_10px_rgba(245,130,32,0.3)]'
                            : 'bg-secondary/20 hover:bg-secondary/35'
                        }`}
                        style={{ height: bar.percentage }}
                      ></div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-2 text-[10px] text-secondary font-label-bold px-1">
                  {utilizationData.map((bar, idx) => (
                    <span key={idx}>{bar.day}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAB (Contextual Floating Action Button) */}
      <button 
        onClick={() => alert('New technical task handler')}
        className="fixed bottom-8 right-8 w-14 h-14 bg-primary text-surface-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center z-50 group"
      >
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
          add_task
        </span>
        <span className="absolute right-16 bg-deep-charcoal text-surface-white px-3 py-1.5 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md">
          Add task
        </span>
      </button>
    </div>
  );
}
