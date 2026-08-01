import { useState, useEffect } from 'react';
import { fetchProducts, fetchParts, createProduct } from '../services/inventoryService';
import { Product, Part } from '../services/types';





export default function InventoryPage({ searchQuery }: { searchQuery?: string }) {
  const [activeTab, setActiveTab] = useState<'products' | 'parts'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const [selectedBrand, setSelectedBrand] = useState<string>('All Brands');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [alertLevel, setAlertLevel] = useState<number>(5);
  const [localSearch, setLocalSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state for new equipment
  const [newTitle, setNewTitle] = useState('');
  const [newBrand, setNewBrand] = useState('Sullair');
  const [newCategory, setNewCategory] = useState('Air Compressors');
  const [newCapacity, setNewCapacity] = useState(185);

  const effectiveSearch = searchQuery !== undefined ? searchQuery : localSearch;

  // Load from API
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setApiError(null);

    async function loadData() {
      try {
        if (activeTab === 'products') {
          const res = await fetchProducts({
            search: effectiveSearch || undefined,
            category: selectedCategory !== 'All' ? selectedCategory : undefined,
            brand: selectedBrand !== 'All Brands' ? selectedBrand : undefined,
          });
          if (isMounted) setProducts(res.data);
        } else {
          const res = await fetchParts({
            search: effectiveSearch || undefined,
            category: selectedCategory !== 'All' ? selectedCategory : undefined,
            brand: selectedBrand !== 'All Brands' ? selectedBrand : undefined,
          });
          if (isMounted) setParts(res.data);
        }
      } catch (err: any) {
        if (isMounted) {
          setApiError(err.message || 'Could not fetch data from backend');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => { isMounted = false; };
  }, [activeTab, effectiveSearch, selectedCategory, selectedBrand]);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      await createProduct({
        title: newTitle,
        brand: newBrand,
        category: newCategory,
        capacity: Number(newCapacity),
        driven_type: 'Diesel Driven',
        badge: 'IN STOCK',
        image_url: 'https://res.cloudinary.com/mandtech/image/upload/v1/products/sullair-185.jpg',
      });
      setShowAddModal(false);
      setNewTitle('');
      // Reload products
      const res = await fetchProducts();
      setProducts(res.data);
    } catch (err: any) {
      alert(`Error creating equipment: ${err.message}`);
    }
  };

  const categories = activeTab === 'products'
    ? ['All', 'Air Compressors', 'Generators', 'Pumps', 'Air Dryers']
    : ['All', 'Air Filtration', 'Control Systems', 'Electrical Spares', 'Mechanical Gaskets'];
    
  const brands = ['All Brands', 'Sullair', 'Atlas Copco', 'Ingersoll Rand', 'Kaeser'];

  const displayItems = activeTab === 'products' ? products : parts;
  const criticalCount = displayItems.length === 0 ? 1 : 0;

  return (
    <div className="space-y-8 pb-16">
      {/* Sub-header tabs for Products vs Spare Parts */}
      <div className="flex items-center justify-between bg-surface-white border border-outline-variant p-4 rounded-lg shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setActiveTab('products'); setSelectedCategory('All'); }}
            className={`px-5 py-2 rounded-lg font-button text-sm flex items-center gap-2 transition-all ${
              activeTab === 'products'
                ? 'bg-primary-container text-on-primary-container font-bold shadow-sm'
                : 'bg-surface-container text-secondary hover:bg-surface-container-high'
            }`}
          >
            <span className="material-symbols-outlined text-lg">precision_manufacturing</span>
            Equipment Machinery Catalog
          </button>
          <button
            onClick={() => { setActiveTab('parts'); setSelectedCategory('All'); }}
            className={`px-5 py-2 rounded-lg font-button text-sm flex items-center gap-2 transition-all ${
              activeTab === 'parts'
                ? 'bg-primary-container text-on-primary-container font-bold shadow-sm'
                : 'bg-surface-container text-secondary hover:bg-surface-container-high'
            }`}
          >
            <span className="material-symbols-outlined text-lg">build</span>
            Spare Parts Catalog
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Backend API Connected
          </span>
        </div>
      </div>

      {/* Controls & Filtering */}
      <div className="mb-8 grid grid-cols-12 gap-6">
        {/* Hierarchical Filters */}
        <div className="col-span-12 lg:col-span-4 bg-surface-white border border-outline-variant p-6 rounded-lg shadow-sm">
          <h3 className="font-label-bold text-primary uppercase text-xs tracking-wider mb-4">
            API Search & Filters
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
                        ? 'bg-primary text-on-primary font-bold'
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
                  placeholder={`Search ${activeTab}...`}
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
                Configure minimum stock threshold for API alerts.
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
            <h3 className="font-label-bold text-primary uppercase text-xs mb-2">Live Catalog Health</h3>
            <div className="flex items-end gap-2">
              <span className="font-headline-xl text-headline-xl text-4xl font-bold">
                {displayItems.length}
              </span>
              <span className="text-secondary mb-1 font-label-bold text-xs">
                {activeTab === 'products' ? 'Equipment Units' : 'Spare Parts'} Active
              </span>
            </div>
            <div className="flex items-center gap-2 text-error mt-2">
              <span className="material-symbols-outlined text-lg">warning</span>
              <span className="font-body-sm text-xs">{criticalCount} item below threshold</span>
            </div>
          </div>
        </div>
      </div>

      {/* API Notice / Error */}
      {apiError && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs flex items-center justify-between">
          <span>Backend offline or unreachable. Displaying fallback catalog. Error: {apiError}</span>
          <button onClick={() => window.location.reload()} className="underline font-bold">Retry API</button>
        </div>
      )}

      {/* Inventory Table */}
      <div className="bg-surface-white border border-outline-variant rounded-lg overflow-hidden shadow-sm">
        {/* Table header bar */}
        <div className="p-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
          <span className="font-label-bold text-on-surface-variant text-xs uppercase tracking-wider">
            LIVE {activeTab.toUpperCase()} CATALOG — {displayItems.length} items loaded from API
          </span>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-primary-container text-on-primary-container px-4 py-1.5 rounded font-button text-xs flex items-center gap-1.5 hover:shadow-md transition-shadow font-bold"
          >
            <span className="material-symbols-outlined text-base">add</span> Add New {activeTab === 'products' ? 'Equipment' : 'Part'}
          </button>
        </div>

        <div className="overflow-x-auto scroll-hide">
          {loading ? (
            <div className="p-16 text-center text-secondary text-sm flex flex-col items-center gap-3">
              <span className="material-symbols-outlined text-4xl animate-spin text-primary">sync</span>
              Loading {activeTab} from Mandtech Backend API...
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-deep-charcoal text-surface-white text-xs">
                  <th className="px-6 py-4 font-label-bold uppercase">Image</th>
                  <th className="px-6 py-4 font-label-bold uppercase">Name / Title</th>
                  <th className="px-6 py-4 font-label-bold uppercase">{activeTab === 'products' ? 'Capacity / Driven' : 'SKU / Compatibility'}</th>
                  <th className="px-6 py-4 font-label-bold uppercase">Category</th>
                  <th className="px-6 py-4 font-label-bold uppercase">Brand</th>
                  <th className="px-6 py-4 font-label-bold uppercase text-center">Status / Badge</th>
                  <th className="px-6 py-4 font-label-bold uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {displayItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-secondary text-sm">
                      <span className="material-symbols-outlined text-4xl block mb-2 opacity-30">inventory_2</span>
                      No items match your filters.
                    </td>
                  </tr>
                ) : activeTab === 'products' ? (
                  (displayItems as Product[]).map((item) => (
                    <tr key={item.id} className="hover:bg-surface-container-low transition-colors group">
                      <td className="px-6 py-4">
                        <div className="w-12 h-12 bg-surface-container rounded border border-outline-variant overflow-hidden">
                          <img
                            className="w-full h-full object-cover"
                            src={item.image_url || 'https://res.cloudinary.com/mandtech/image/upload/v1/products/sullair-185.jpg'}
                            alt={item.title}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-button text-on-surface text-sm font-semibold">{item.title}</p>
                        {item.specs && item.specs.length > 0 && (
                          <p className="text-[10px] text-secondary uppercase tracking-wider mt-0.5">
                            SPEC: {item.specs[0].label}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 font-body-sm text-secondary text-sm">
                        {item.capacity ? `${item.capacity} CFM/kVA` : 'Standard'} • {item.driven_type || 'Diesel'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-surface-container px-2 py-1 rounded text-[11px] font-bold text-secondary">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-surface-container-high px-2 py-1 rounded text-[11px] font-bold text-secondary">
                          {item.brand}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] rounded font-bold uppercase">
                          {item.badge || 'IN STOCK'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => alert(`Viewing details for ${item.title}`)}
                          className="text-secondary hover:text-primary transition-colors duration-150"
                        >
                          <span className="material-symbols-outlined">visibility</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  (displayItems as Part[]).map((part) => (
                    <tr key={part.id} className="hover:bg-surface-container-low transition-colors group">
                      <td className="px-6 py-4">
                        <div className="w-12 h-12 bg-surface-container rounded border border-outline-variant overflow-hidden">
                          <img
                            className="w-full h-full object-cover"
                            src={part.image_url || 'https://res.cloudinary.com/mandtech/image/upload/v1/parts/oil-filter.jpg'}
                            alt={part.title}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-button text-on-surface text-sm font-semibold">{part.title}</p>
                        <p className="text-[10px] text-secondary uppercase tracking-wider mt-0.5">
                          COMPATIBILITY: {part.compatibility || 'Universal'}
                        </p>
                      </td>
                      <td className="px-6 py-4 font-body-sm text-secondary text-sm font-mono">{part.sku}</td>
                      <td className="px-6 py-4">
                        <span className="bg-surface-container px-2 py-1 rounded text-[11px] font-bold text-secondary">
                          {part.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-surface-container-high px-2 py-1 rounded text-[11px] font-bold text-secondary">
                          {part.brand}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] rounded font-bold uppercase">
                          {part.badge || part.condition || 'New OEM'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => alert(`Viewing part details for ${part.title}`)}
                          className="text-secondary hover:text-primary transition-colors duration-150"
                        >
                          <span className="material-symbols-outlined">visibility</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        <div className="p-6 border-t border-outline-variant flex justify-between items-center bg-surface-bright">
          <span className="text-body-sm text-secondary text-sm">
            Showing {displayItems.length} entries from API
          </span>
          <div className="flex gap-2">
            <button className="px-4 py-1.5 border border-outline-variant rounded text-sm hover:bg-surface-container transition-colors">
              Previous
            </button>
            <button className="px-4 py-1.5 bg-deep-charcoal text-surface-white rounded text-sm">1</button>
            <button className="px-4 py-1.5 border border-outline-variant rounded text-sm hover:bg-surface-container transition-colors">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-deep-charcoal/70 backdrop-blur-sm">
          <div className="bg-surface-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden border border-outline p-6">
            <div className="flex justify-between items-center border-b border-outline-variant pb-3 mb-4">
              <h3 className="font-headline-md text-lg font-bold">Add New Equipment Product</h3>
              <button onClick={() => setShowAddModal(false)} className="text-secondary hover:text-deep-charcoal">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-secondary mb-1">Equipment Title / Model</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sullair 375 Tier 4"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full border border-outline-variant rounded p-2 text-sm outline-none focus:border-primary-container"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-secondary mb-1">Brand</label>
                  <select
                    value={newBrand}
                    onChange={(e) => setNewBrand(e.target.value)}
                    className="w-full border border-outline-variant rounded p-2 text-sm bg-white"
                  >
                    <option>Sullair</option>
                    <option>Atlas Copco</option>
                    <option>Ingersoll Rand</option>
                    <option>Kaeser</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-secondary mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full border border-outline-variant rounded p-2 text-sm bg-white"
                  >
                    <option>Air Compressors</option>
                    <option>Generators</option>
                    <option>Pumps</option>
                    <option>Air Dryers</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-secondary mb-1">Capacity (CFM / kVA)</label>
                <input
                  type="number"
                  value={newCapacity}
                  onChange={(e) => setNewCapacity(Number(e.target.value))}
                  className="w-full border border-outline-variant rounded p-2 text-sm outline-none focus:border-primary-container"
                />
              </div>
              <div className="pt-3 border-t border-outline-variant flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-outline rounded text-sm text-secondary hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-container text-on-primary-container font-bold rounded text-sm hover:shadow-md"
                >
                  Submit to API
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
