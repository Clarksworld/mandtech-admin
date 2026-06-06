import { useState } from 'react';

interface InventoryItem {
  id: string;
  name: string;
  spec: string;
  partNumber: string;
  brand: 'ATLAS COPCO' | 'INGERSOLL RAND' | 'MANDTECH';
  category: 'Compressors' | 'Generators' | 'Pumps';
  stock: number;
  stockStatus: 'Critical' | 'Low Stock' | 'Healthy';
  storefrontVisible: boolean;
  imageUrl: string;
  imageAlt: string;
}

const initialInventory: InventoryItem[] = [
  {
    id: 'i1',
    name: 'GA 30-45 VSD+ Compressor',
    spec: '30kW / 13 bar',
    partNumber: 'AC-99042-XP',
    brand: 'ATLAS COPCO',
    category: 'Compressors',
    stock: 2,
    stockStatus: 'Critical',
    storefrontVisible: true,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCOy5Nfbi_NuHHhrvP_lxfk0Af-eyj4P-LzjWlj7s4bPlqVo7tzPROWWPO1tMY6ADm3Yt0zpB2QQ97AUQfvGS7p9mMoE2ntf-JZVu3nWPyMUZpZGHu51aJSSh-ELpvax8rdujY4_SiHxUmv5E5U88N0XwYTErZcGPPXqFFJQU8ohwWFdpM_D2rFRvGm4Pu_O1Raf3I-dQHX2d9pJHvAFys5t1S9xpZzXGL_slOlYSyXy8DA4p8csbIiqgNJxNAB9EaifVe4YnxSG9s',
    imageAlt: 'Atlas Copco industrial air compressor',
  },
  {
    id: 'i2',
    name: 'P1.5-3 Portable Power',
    spec: 'OUTPUT: 1.5 kVA / 230V',
    partNumber: 'IR-GEN-8822',
    brand: 'INGERSOLL RAND',
    category: 'Generators',
    stock: 45,
    stockStatus: 'Healthy',
    storefrontVisible: false,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCCd90KRut2shcTUiE-cWesObjROACudqZLZkaGjYABVxZSMlzTssrlDnZJ_F1nVzYJqxpEmISpK4RmqkYZ1YXFCVgdoXWTU6H0U9vicY74180vusK4wK49KF9g-YKetZOo6I2CIzf4J_ClZxq9Lu-ZTq-VCjzot3heByRcV73gwGV5tBqT9h2N-3ojCxc3D83F6bL92mRcZh6WxKGiKSHXoAF7l5PMoypExeaBQBYD0-_VReJBT5pxFppP98c_ZK5gnkac3tSFG5s',
    imageAlt: 'Portable industrial diesel generator',
  },
  {
    id: 'i3',
    name: 'TX-400 High Pressure Pump',
    spec: 'FLOW: 400 L/min',
    partNumber: 'MND-TX-400',
    brand: 'MANDTECH',
    category: 'Pumps',
    stock: 8,
    stockStatus: 'Low Stock',
    storefrontVisible: true,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAfE2_QEpnSCyK1GqnRpuXX_8y_7KgaDPUFnaWHB83IeBYzbB2uR6O1jFA15xaBQLTD3NKCJ4HOYLiJy59nPU0IX7g6t50MPgUVrtaIbkn-RZWY_X7yabrNw9VzIb5yBNY-8EKq_tSeYOchvkycFJRfimooD4Cem8D5skL0HCcID1KDn8RRYEEc-_UapkAAmcGjbnh-0voaFcn_K3JOs47H9xknkASTKTQWSDJ-73-eQKKhIYrepPZO-UH4AruNJjMBSb29UZN5pAY',
    imageAlt: 'High pressure centrifugal pump assembly',
  },
  {
    id: 'i4',
    name: 'GA 90+ Air Compressor',
    spec: '90kW / 8.5 bar',
    partNumber: 'AC-77031-VSD',
    brand: 'ATLAS COPCO',
    category: 'Compressors',
    stock: 12,
    stockStatus: 'Healthy',
    storefrontVisible: true,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCOy5Nfbi_NuHHhrvP_lxfk0Af-eyj4P-LzjWlj7s4bPlqVo7tzPROWWPO1tMY6ADm3Yt0zpB2QQ97AUQfvGS7p9mMoE2ntf-JZVu3nWPyMUZpZGHu51aJSSh-ELpvax8rdujY4_SiHxUmv5E5U88N0XwYTErZcGPPXqFFJQU8ohwWFdpM_D2rFRvGm4Pu_O1Raf3I-dQHX2d9pJHvAFys5t1S9xpZzXGL_slOlYSyXy8DA4p8csbIiqgNJxNAB9EaifVe4YnxSG9s',
    imageAlt: 'Large Atlas Copco compressor unit',
  },
  {
    id: 'i5',
    name: 'XHP 900 Portable Compressor',
    spec: '900 cfm / 350 psi',
    partNumber: 'IR-XHP-9002',
    brand: 'INGERSOLL RAND',
    category: 'Compressors',
    stock: 3,
    stockStatus: 'Critical',
    storefrontVisible: false,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCCd90KRut2shcTUiE-cWesObjROACudqZLZkaGjYABVxZSMlzTssrlDnZJ_F1nVzYJqxpEmISpK4RmqkYZ1YXFCVgdoXWTU6H0U9vicY74180vusK4wK49KF9g-YKetZOo6I2CIzf4J_ClZxq9Lu-ZTq-VCjzot3heByRcV73gwGV5tBqT9h2N-3ojCxc3D83F6bL92mRcZh6WxKGiKSHXoAF7l5PMoypExeaBQBYD0-_VReJBT5pxFppP98c_ZK5gnkac3tSFG5s',
    imageAlt: 'Portable XHP compressor',
  },
];

export default function InventoryPage({ searchQuery }: { searchQuery?: string }) {
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);
  const [selectedBrand, setSelectedBrand] = useState<string>('All Brands');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [alertLevel, setAlertLevel] = useState<number>(5);
  const [localSearch, setLocalSearch] = useState('');

  const effectiveSearch = (searchQuery ?? localSearch).toLowerCase();

  const filteredInventory = inventory.filter((item) => {
    const matchesBrand = selectedBrand === 'All Brands' || item.brand === selectedBrand.toUpperCase();
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch =
      !effectiveSearch ||
      item.name.toLowerCase().includes(effectiveSearch) ||
      item.partNumber.toLowerCase().includes(effectiveSearch) ||
      item.brand.toLowerCase().includes(effectiveSearch);
    return matchesBrand && matchesCategory && matchesSearch;
  });

  const toggleStorefront = (id: string) => {
    setInventory((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, storefrontVisible: !item.storefrontVisible } : item
      )
    );
  };

  const categories = ['All', 'Compressors', 'Generators', 'Pumps'];
  const brands = ['All Brands', 'Atlas Copco', 'Ingersoll Rand', 'Mandtech Proprietary'];

  const criticalCount = inventory.filter((i) => i.stock <= alertLevel && i.stockStatus !== 'Healthy').length;
  const totalSKUs = inventory.length;

  return (
    <div className="space-y-8 pb-16">
      {/* Controls & Filtering */}
      <div className="mb-8 grid grid-cols-12 gap-6">
        {/* Hierarchical Filters */}
        <div className="col-span-12 lg:col-span-4 bg-surface-white border border-outline-variant p-6 rounded-lg shadow-sm">
          <h3 className="font-label-bold text-primary uppercase text-xs tracking-wider mb-4">
            Hierarchical Filters
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block font-label-bold text-secondary text-xs mb-2">Brand Selection</label>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full border border-outline-variant rounded-lg p-2 text-body-sm focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none bg-white text-sm"
              >
                {brands.map((b) => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-label-bold text-secondary text-xs mb-2">Category</label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded font-body-sm text-sm transition-colors duration-150 ${
                      selectedCategory === cat
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-container text-secondary hover:bg-surface-container-high'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block font-label-bold text-secondary text-xs mb-2">Quick Search</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-secondary text-base">search</span>
                <input
                  type="text"
                  placeholder="Search by name or part #..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-outline-variant rounded-lg text-sm focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Stats Column */}
        <div className="col-span-12 lg:col-span-8 grid grid-cols-2 gap-4">
          {/* Alert Settings */}
          <div className="bg-surface-white border border-outline-variant p-6 rounded-lg flex flex-col justify-between shadow-sm">
            <div>
              <h3 className="font-label-bold text-secondary uppercase text-xs mb-1">Global Alert Settings</h3>
              <p className="text-body-sm text-on-surface-variant text-xs mb-4 leading-relaxed">
                Configure threshold for low stock notifications across all technical units.
              </p>
            </div>
            <div className="flex items-end gap-3">
              <div className="flex-grow">
                <label className="block font-label-bold text-primary text-xs mb-1">Minimum Alert Level</label>
                <input
                  type="number"
                  value={alertLevel}
                  onChange={(e) => setAlertLevel(Number(e.target.value))}
                  className="w-full border border-outline-variant rounded p-2 text-sm focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none"
                />
              </div>
              <button className="bg-deep-charcoal text-surface-white px-5 py-2 rounded font-button text-sm hover:bg-opacity-90 transition-opacity mb-0.5 whitespace-nowrap">
                Apply
              </button>
            </div>
          </div>

          {/* Inventory Health */}
          <div className="bg-surface-white border border-outline-variant p-6 rounded-lg flex flex-col justify-between shadow-sm border-t-4 border-t-primary">
            <h3 className="font-label-bold text-primary uppercase text-xs mb-2">Inventory Health</h3>
            <div className="flex items-end gap-2">
              <span className="font-headline-xl text-headline-xl text-4xl font-bold">{totalSKUs}</span>
              <span className="text-secondary mb-1 font-label-bold text-xs">SKUs Active</span>
            </div>
            <div className="flex items-center gap-2 text-error mt-2">
              <span className="material-symbols-outlined text-lg">warning</span>
              <span className="font-body-sm text-xs">{criticalCount} items below threshold</span>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-surface-white border border-outline-variant rounded-lg overflow-hidden shadow-sm">
        {/* Table header bar */}
        <div className="p-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
          <span className="font-label-bold text-on-surface-variant text-xs">
            EQUIPMENT INVENTORY — {filteredInventory.length} results
          </span>
          <button
            onClick={() => alert('Add new equipment form')}
            className="bg-primary-container text-on-primary-container px-4 py-1.5 rounded font-button text-xs flex items-center gap-1.5 hover:shadow-md transition-shadow"
          >
            <span className="material-symbols-outlined text-base">add</span> Add Equipment
          </button>
        </div>

        <div className="overflow-x-auto scroll-hide">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-deep-charcoal text-surface-white text-xs">
                <th className="px-6 py-4 font-label-bold uppercase">Image</th>
                <th className="px-6 py-4 font-label-bold uppercase">Product Name</th>
                <th className="px-6 py-4 font-label-bold uppercase">Part Number</th>
                <th className="px-6 py-4 font-label-bold uppercase">Brand</th>
                <th className="px-6 py-4 font-label-bold uppercase">Stock Level</th>
                <th className="px-6 py-4 font-label-bold uppercase text-center">Storefront</th>
                <th className="px-6 py-4 font-label-bold uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-secondary text-sm">
                    <span className="material-symbols-outlined text-4xl block mb-2 opacity-30">inventory_2</span>
                    No inventory items match your filters.
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => (
                  <tr
                    key={item.id}
                    className={`transition-colors group cursor-pointer ${
                      item.stockStatus === 'Critical'
                        ? 'bg-red-50/40 hover:bg-red-50/60 border-l-4 border-l-error'
                        : item.stockStatus === 'Low Stock'
                        ? 'bg-surface-container-low/50 hover:bg-surface-container-low'
                        : 'hover:bg-surface-container-low'
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="w-12 h-12 bg-surface-container rounded border border-outline-variant overflow-hidden">
                        <img className="w-full h-full object-cover" src={item.imageUrl} alt={item.imageAlt} />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-button text-on-surface text-sm font-semibold">{item.name}</p>
                      <p className="text-[10px] text-secondary uppercase tracking-wider mt-0.5">
                        TECHNICAL SPEC: {item.spec}
                      </p>
                    </td>
                    <td className="px-6 py-4 font-body-sm text-secondary text-sm">{item.partNumber}</td>
                    <td className="px-6 py-4">
                      <span className="bg-surface-container-high px-2 py-1 rounded text-[11px] font-bold text-secondary">
                        {item.brand}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {item.stockStatus === 'Critical' ? (
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-error">{item.stock}</span>
                          <span className="text-[10px] bg-error text-surface-white px-1.5 py-0.5 rounded uppercase">
                            Critical
                          </span>
                        </div>
                      ) : item.stockStatus === 'Low Stock' ? (
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-status-gray">{item.stock}</span>
                          <span className="text-[10px] border border-outline px-1.5 py-0.5 rounded uppercase text-secondary">
                            Low Stock
                          </span>
                        </div>
                      ) : (
                        <span className="font-bold text-on-surface">{item.stock}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={item.storefrontVisible}
                          onChange={() => toggleStorefront(item.id)}
                        />
                        <div className="relative w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => alert(`Edit: ${item.name}`)}
                        className="text-secondary hover:text-primary transition-colors duration-150"
                      >
                        <span className="material-symbols-outlined">edit</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-6 border-t border-outline-variant flex justify-between items-center bg-surface-bright">
          <span className="text-body-sm text-secondary text-sm">
            Showing {filteredInventory.length} of {inventory.length} entries
          </span>
          <div className="flex gap-2">
            <button className="px-4 py-1.5 border border-outline-variant rounded text-sm hover:bg-surface-container transition-colors">
              Previous
            </button>
            <button className="px-4 py-1.5 bg-deep-charcoal text-surface-white rounded text-sm">1</button>
            <button className="px-4 py-1.5 border border-outline-variant rounded text-sm hover:bg-surface-container transition-colors">
              2
            </button>
            <button className="px-4 py-1.5 border border-outline-variant rounded text-sm hover:bg-surface-container transition-colors">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={() => alert('Add new equipment')}
        className="fixed bottom-8 right-8 w-16 h-16 bg-primary-container text-on-primary-container rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform z-50 group"
      >
        <span className="material-symbols-outlined text-3xl">add</span>
        <span className="absolute right-20 bg-deep-charcoal text-surface-white px-4 py-2 rounded font-button text-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md">
          Add New Equipment
        </span>
      </button>
    </div>
  );
}
