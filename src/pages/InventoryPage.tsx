import { useState, useEffect, useCallback } from 'react';
import {
  fetchProducts, fetchParts,
  createProduct, updateProduct, deleteProduct,
  createPart, updatePart, deletePart,
} from '../services/inventoryService';
import { Product, Part } from '../services/types';

/* ─────────── helpers ─────────── */
const PRODUCT_CATEGORIES = ['Air Compressors', 'Generators', 'Pumps', 'Air Dryers'] as const;
const PART_CATEGORIES    = ['Air Filtration', 'Control Systems', 'Electrical Spares', 'Mechanical Gaskets'] as const;
const BRANDS             = ['Sullair', 'Atlas Copco', 'Ingersoll Rand', 'Kaeser'];
const DRIVEN_TYPES       = ['Diesel Driven', 'Electric'] as const;
const PART_CONDITIONS    = ['New OEM', 'Refurbished'] as const;

const emptyProductForm = () => ({
  title: '', brand: 'Sullair', category: 'Air Compressors' as string,
  driven_type: 'Diesel Driven' as string, capacity: 185, badge: 'IN STOCK',
  image_url: '', is_active: true,
});

const emptyPartForm = () => ({
  title: '', sku: '', brand: 'Sullair', category: 'Air Filtration' as string,
  compatibility: '', condition: 'New OEM' as string, badge: 'IN STOCK',
  image_url: '', is_active: true,
});

/* ─────────── component ─────────── */
export default function InventoryPage({ searchQuery }: { searchQuery?: string }) {
  const [activeTab, setActiveTab] = useState<'products' | 'parts'>('products');
  const [products, setProducts]   = useState<Product[]>([]);
  const [parts, setParts]         = useState<Part[]>([]);
  const [loading, setLoading]     = useState(true);
  const [apiError, setApiError]   = useState<string | null>(null);

  /* filters */
  const [selectedBrand, setSelectedBrand]       = useState('All Brands');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [alertLevel, setAlertLevel]             = useState(5);
  const [localSearch, setLocalSearch]           = useState('');

  /* feedback */
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg]     = useState<string | null>(null);

  /* modal visibility */
  const [showAddModal, setShowAddModal]   = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  /* add / edit form for products */
  const [productForm, setProductForm] = useState(emptyProductForm());

  /* add / edit form for parts */
  const [partForm, setPartForm] = useState(emptyPartForm());

  /* which item is being edited */
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingPartId, setEditingPartId]       = useState<string | null>(null);

  const [saving, setSaving] = useState(false);

  const effectiveSearch = searchQuery !== undefined ? searchQuery : localSearch;

  /* ── auto-dismiss feedback ── */
  useEffect(() => {
    if (!successMsg && !errorMsg) return;
    const t = setTimeout(() => { setSuccessMsg(null); setErrorMsg(null); }, 4000);
    return () => clearTimeout(t);
  }, [successMsg, errorMsg]);

  /* ── load data ── */
  const loadData = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      if (activeTab === 'products') {
        const res = await fetchProducts({
          search: effectiveSearch || undefined,
          category: selectedCategory !== 'All' ? selectedCategory : undefined,
          brand: selectedBrand !== 'All Brands' ? selectedBrand : undefined,
        });
        setProducts(res.data);
      } else {
        const res = await fetchParts({
          search: effectiveSearch || undefined,
          category: selectedCategory !== 'All' ? selectedCategory : undefined,
          brand: selectedBrand !== 'All Brands' ? selectedBrand : undefined,
        });
        setParts(res.data);
      }
    } catch (err: any) {
      setApiError(err.message || 'Could not fetch data from backend');
    } finally {
      setLoading(false);
    }
  }, [activeTab, effectiveSearch, selectedCategory, selectedBrand]);

  useEffect(() => { loadData(); }, [loadData]);

  /* ───────────────────── PRODUCTS CRUD ───────────────────── */
  const openAddProduct = () => {
    setProductForm(emptyProductForm());
    setEditingProductId(null);
    setShowAddModal(true);
  };

  const openEditProduct = (p: Product) => {
    setProductForm({
      title: p.title, brand: p.brand, category: p.category,
      driven_type: p.driven_type || 'Diesel Driven', capacity: p.capacity ?? 185,
      badge: p.badge || 'IN STOCK', image_url: p.image_url || '', is_active: p.is_active ?? true,
    });
    setEditingProductId(p.id);
    setShowEditModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.title.trim()) return;
    setSaving(true);
    try {
      if (editingProductId) {
        await updateProduct(editingProductId, productForm);
        setSuccessMsg('Equipment updated successfully.');
      } else {
        await createProduct(productForm);
        setSuccessMsg('Equipment added to catalog.');
      }
      setShowAddModal(false);
      setShowEditModal(false);
      setEditingProductId(null);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save equipment.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleProductActive = async (p: Product) => {
    try {
      await updateProduct(p.id, { ...p, is_active: !p.is_active });
      setSuccessMsg(`${p.title} marked as ${!p.is_active ? 'Active' : 'Inactive'}.`);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update status.');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    setSaving(true);
    try {
      await deleteProduct(id);
      setSuccessMsg('Equipment deactivated (soft-deleted).');
      setConfirmDeleteId(null);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to deactivate equipment.');
    } finally {
      setSaving(false);
    }
  };

  /* ───────────────────── PARTS CRUD ───────────────────── */
  const openAddPart = () => {
    setPartForm(emptyPartForm());
    setEditingPartId(null);
    setShowAddModal(true);
  };

  const openEditPart = (p: Part) => {
    setPartForm({
      title: p.title, sku: p.sku || '', brand: p.brand, category: p.category,
      compatibility: p.compatibility || '', condition: p.condition || 'New OEM',
      badge: p.badge || 'IN STOCK', image_url: p.image_url || '', is_active: p.is_active ?? true,
    });
    setEditingPartId(p.id);
    setShowEditModal(true);
  };

  const handleSavePart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partForm.title.trim()) return;
    setSaving(true);
    try {
      if (editingPartId) {
        await updatePart(editingPartId, partForm);
        setSuccessMsg('Spare part updated successfully.');
      } else {
        await createPart(partForm);
        setSuccessMsg('Spare part added to catalog.');
      }
      setShowAddModal(false);
      setShowEditModal(false);
      setEditingPartId(null);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save spare part.');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePartActive = async (p: Part) => {
    try {
      await updatePart(p.id, { ...p, is_active: !p.is_active });
      setSuccessMsg(`${p.title} marked as ${!p.is_active ? 'Active' : 'Inactive'}.`);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update status.');
    }
  };

  const handleDeletePart = async (id: string) => {
    setSaving(true);
    try {
      await deletePart(id);
      setSuccessMsg('Spare part deactivated (soft-deleted).');
      setConfirmDeleteId(null);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to deactivate spare part.');
    } finally {
      setSaving(false);
    }
  };

  /* ─── derived ─── */
  const categories = activeTab === 'products'
    ? ['All', ...PRODUCT_CATEGORIES]
    : ['All', ...PART_CATEGORIES];

  const displayItems = activeTab === 'products' ? products : parts;
  const isAddingProduct = activeTab === 'products';

  /* ═══════════════════════════════ RENDER ═══════════════════════════════ */
  return (
    <div className="space-y-8 pb-16">

      {/* ── feedback banners ── */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-base text-emerald-600">check_circle</span>
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-base text-rose-500">error</span>
          {errorMsg}
        </div>
      )}

      {/* ── Tab switcher ── */}
      <div className="flex items-center justify-between bg-surface-white border border-outline-variant p-4 rounded-lg shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setActiveTab('products'); setSelectedCategory('All'); }}
            className={`px-5 py-2 rounded-lg font-button text-sm flex items-center gap-2 transition-all ${
              activeTab === 'products'
                ? 'bg-primary text-white font-bold shadow-sm'
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
                ? 'bg-primary text-white font-bold shadow-sm'
                : 'bg-surface-container text-secondary hover:bg-surface-container-high'
            }`}
          >
            <span className="material-symbols-outlined text-lg">build</span>
            Spare Parts Catalog
          </button>
        </div>
        <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary-dark border border-primary/20 px-3 py-1 rounded-full text-xs font-bold">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          Backend API Connected
        </span>
      </div>

      {/* ── Filters row ── */}
      <div className="mb-8 grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-4 bg-surface-white border border-outline-variant p-6 rounded-lg shadow-sm">
          <h3 className="font-label-bold text-primary uppercase text-xs tracking-wider mb-4">API Search & Filters</h3>
          <div className="space-y-4">
            <div>
              <label className="block font-label-bold text-secondary text-xs mb-2">Brand Selection</label>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full border border-outline-variant rounded-lg p-2 text-sm focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none bg-white"
              >
                <option>All Brands</option>
                {BRANDS.map((b) => <option key={b}>{b}</option>)}
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

        <div className="col-span-12 lg:col-span-8 grid grid-cols-2 gap-4">
          <div className="bg-surface-white border border-outline-variant p-6 rounded-lg flex flex-col justify-between shadow-sm">
            <div>
              <h3 className="font-label-bold text-secondary uppercase text-xs mb-1">Global Alert Settings</h3>
              <p className="text-body-sm text-on-surface-variant text-xs mb-4 leading-relaxed">Configure minimum stock threshold for API alerts.</p>
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
              <button className="bg-deep-charcoal text-surface-white px-5 py-2 rounded font-button text-sm hover:bg-opacity-90 transition-opacity mb-0.5 whitespace-nowrap">Apply</button>
            </div>
          </div>
          <div className="bg-surface-white border border-outline-variant p-6 rounded-lg flex flex-col justify-between shadow-sm border-t-4 border-t-primary">
            <h3 className="font-label-bold text-primary uppercase text-xs mb-2">Live Catalog Health</h3>
            <div className="flex items-end gap-2">
              <span className="font-headline-xl text-headline-xl text-4xl font-bold">{displayItems.length}</span>
              <span className="text-secondary mb-1 font-label-bold text-xs">{activeTab === 'products' ? 'Equipment Units' : 'Spare Parts'} Loaded</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-600 mt-2">
              <span className="material-symbols-outlined text-lg">check_circle</span>
              <span className="font-body-sm text-xs">{displayItems.filter((i: any) => i.is_active !== false).length} active in catalog</span>
            </div>
          </div>
        </div>
      </div>

      {/* API Error */}
      {apiError && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs flex items-center justify-between">
          <span>Backend error: {apiError}</span>
          <button onClick={loadData} className="underline font-bold">Retry</button>
        </div>
      )}

      {/* ── Main Table ── */}
      <div className="bg-surface-white border border-outline-variant rounded-lg overflow-hidden shadow-sm">
        <div className="p-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
          <span className="font-label-bold text-on-surface-variant text-xs uppercase tracking-wider">
            LIVE {activeTab.toUpperCase()} CATALOG — {displayItems.length} items
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="text-secondary hover:text-primary transition-colors p-1"
              title="Refresh"
            >
              <span className={`material-symbols-outlined text-lg ${loading ? 'animate-spin' : ''}`}>sync</span>
            </button>
            <button
              onClick={isAddingProduct ? openAddProduct : openAddPart}
              className="bg-primary text-white hover:bg-black px-4 py-1.5 rounded font-button text-xs flex items-center gap-1.5 hover:shadow-md transition-all font-bold"
            >
              <span className="material-symbols-outlined text-base">add</span>
              Add New {isAddingProduct ? 'Equipment' : 'Part'}
            </button>
          </div>
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
                  <th className="px-6 py-4 font-label-bold uppercase">
                    {activeTab === 'products' ? 'Capacity / Driven' : 'SKU / Compatibility'}
                  </th>
                  <th className="px-6 py-4 font-label-bold uppercase">Category</th>
                  <th className="px-6 py-4 font-label-bold uppercase">Brand</th>
                  <th className="px-6 py-4 font-label-bold uppercase text-center">Status</th>
                  <th className="px-6 py-4 font-label-bold uppercase text-center">Active</th>
                  <th className="px-6 py-4 font-label-bold uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {displayItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center text-secondary text-sm">
                      <span className="material-symbols-outlined text-4xl block mb-2 opacity-30">inventory_2</span>
                      No items match your filters.
                    </td>
                  </tr>
                ) : activeTab === 'products' ? (
                  (displayItems as Product[]).map((item) => (
                    <tr key={item.id} className={`hover:bg-surface-container-low transition-colors group ${!item.is_active ? 'opacity-50' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="w-12 h-12 bg-surface-container rounded border border-outline-variant overflow-hidden">
                          <img className="w-full h-full object-cover" src={item.image_url || 'https://placehold.co/48x48?text=IMG'} alt={item.title} />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-button text-on-surface text-sm font-semibold">{item.title}</p>
                        {item.specs && item.specs.length > 0 && (
                          <p className="text-[10px] text-secondary uppercase tracking-wider mt-0.5">SPEC: {item.specs[0].label}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 font-body-sm text-secondary text-sm">
                        {item.capacity ? `${item.capacity} CFM/kVA` : 'Standard'} • {item.driven_type || 'Diesel'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-surface-container px-2 py-1 rounded text-[11px] font-bold text-secondary">{item.category}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-surface-container-high px-2 py-1 rounded text-[11px] font-bold text-secondary">{item.brand}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2 py-0.5 bg-primary/15 text-primary-dark text-[10px] rounded font-bold uppercase">
                          {item.badge || 'IN STOCK'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleToggleProductActive(item)}
                          title={item.is_active ? 'Deactivate' : 'Activate'}
                          className={`transition-colors ${item.is_active ? 'text-emerald-600 hover:text-rose-500' : 'text-secondary hover:text-emerald-600'}`}
                        >
                          <span className="material-symbols-outlined text-xl">
                            {item.is_active ? 'toggle_on' : 'toggle_off'}
                          </span>
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditProduct(item)}
                            title="Edit"
                            className="text-secondary hover:text-primary transition-colors"
                          >
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                          {confirmDeleteId === item.id ? (
                            <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 rounded px-2 py-1">
                              <span className="text-[10px] text-rose-700 font-bold">Deactivate?</span>
                              <button
                                onClick={() => handleDeleteProduct(item.id)}
                                disabled={saving}
                                className="text-[10px] font-bold text-rose-700 hover:text-rose-900 underline"
                              >Yes</button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="text-[10px] text-secondary hover:text-on-surface underline"
                              >No</button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(item.id)}
                              title="Deactivate"
                              className="text-secondary hover:text-rose-500 transition-colors"
                            >
                              <span className="material-symbols-outlined text-lg">delete</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  (displayItems as Part[]).map((part) => (
                    <tr key={part.id} className={`hover:bg-surface-container-low transition-colors group ${!part.is_active ? 'opacity-50' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="w-12 h-12 bg-surface-container rounded border border-outline-variant overflow-hidden">
                          <img className="w-full h-full object-cover" src={part.image_url || 'https://placehold.co/48x48?text=IMG'} alt={part.title} />
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
                        <span className="bg-surface-container px-2 py-1 rounded text-[11px] font-bold text-secondary">{part.category}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-surface-container-high px-2 py-1 rounded text-[11px] font-bold text-secondary">{part.brand}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] rounded font-bold uppercase">
                          {part.badge || part.condition || 'New OEM'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleTogglePartActive(part)}
                          title={part.is_active ? 'Deactivate' : 'Activate'}
                          className={`transition-colors ${part.is_active ? 'text-emerald-600 hover:text-rose-500' : 'text-secondary hover:text-emerald-600'}`}
                        >
                          <span className="material-symbols-outlined text-xl">
                            {part.is_active ? 'toggle_on' : 'toggle_off'}
                          </span>
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditPart(part)}
                            title="Edit"
                            className="text-secondary hover:text-primary transition-colors"
                          >
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                          {confirmDeleteId === part.id ? (
                            <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 rounded px-2 py-1">
                              <span className="text-[10px] text-rose-700 font-bold">Deactivate?</span>
                              <button
                                onClick={() => handleDeletePart(part.id)}
                                disabled={saving}
                                className="text-[10px] font-bold text-rose-700 hover:text-rose-900 underline"
                              >Yes</button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="text-[10px] text-secondary hover:text-on-surface underline"
                              >No</button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(part.id)}
                              title="Deactivate"
                              className="text-secondary hover:text-rose-500 transition-colors"
                            >
                              <span className="material-symbols-outlined text-lg">delete</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="p-6 border-t border-outline-variant flex justify-between items-center bg-surface-bright">
          <span className="text-body-sm text-secondary text-sm">Showing {displayItems.length} entries from API</span>
          <div className="flex gap-2">
            <button className="px-4 py-1.5 border border-outline-variant rounded text-sm hover:bg-surface-container transition-colors">Previous</button>
            <button className="px-4 py-1.5 bg-deep-charcoal text-surface-white rounded text-sm">1</button>
            <button className="px-4 py-1.5 border border-outline-variant rounded text-sm hover:bg-surface-container transition-colors">Next</button>
          </div>
        </div>
      </div>

      {/* ══════════ ADD MODAL ══════════ */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-deep-charcoal/70 backdrop-blur-sm">
          <div className="bg-surface-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden border border-outline">
            <div className="flex justify-between items-center border-b border-outline-variant px-6 py-4">
              <h3 className="font-headline-md text-lg font-bold">
                Add New {isAddingProduct ? 'Equipment' : 'Spare Part'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-secondary hover:text-deep-charcoal">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {isAddingProduct ? (
                <form onSubmit={handleSaveProduct} className="space-y-4">
                  <ProductFormFields form={productForm} setForm={setProductForm} />
                  <FormButtons saving={saving} onCancel={() => setShowAddModal(false)} label="Add to Catalog" />
                </form>
              ) : (
                <form onSubmit={handleSavePart} className="space-y-4">
                  <PartFormFields form={partForm} setForm={setPartForm} />
                  <FormButtons saving={saving} onCancel={() => setShowAddModal(false)} label="Add to Catalog" />
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════ EDIT MODAL ══════════ */}
      {showEditModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-deep-charcoal/70 backdrop-blur-sm">
          <div className="bg-surface-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden border border-outline">
            <div className="flex justify-between items-center border-b border-outline-variant px-6 py-4">
              <h3 className="font-headline-md text-lg font-bold">
                Edit {editingProductId ? 'Equipment' : 'Spare Part'}
              </h3>
              <button onClick={() => { setShowEditModal(false); setEditingProductId(null); setEditingPartId(null); }} className="text-secondary hover:text-deep-charcoal">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {editingProductId ? (
                <form onSubmit={handleSaveProduct} className="space-y-4">
                  <ProductFormFields form={productForm} setForm={setProductForm} />
                  <FormButtons saving={saving} onCancel={() => { setShowEditModal(false); setEditingProductId(null); }} label="Save Changes" />
                </form>
              ) : (
                <form onSubmit={handleSavePart} className="space-y-4">
                  <PartFormFields form={partForm} setForm={setPartForm} />
                  <FormButtons saving={saving} onCancel={() => { setShowEditModal(false); setEditingPartId(null); }} label="Save Changes" />
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════ SUB-COMPONENTS ═══════════════ */

type ProductForm = ReturnType<typeof emptyProductForm>;
type PartForm    = ReturnType<typeof emptyPartForm>;

function ProductFormFields({ form, setForm }: { form: ProductForm; setForm: (f: ProductForm) => void }) {
  const set = (k: keyof ProductForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: k === 'capacity' ? Number(e.target.value) : k === 'is_active' ? (e.target as HTMLInputElement).checked : e.target.value });

  return (
    <>
      <div>
        <label className="block text-xs font-bold text-secondary mb-1">Equipment Title / Model *</label>
        <input required type="text" placeholder="e.g. Sullair 375 Tier 4" value={form.title}
          onChange={set('title')} className="w-full border border-outline-variant rounded p-2 text-sm outline-none focus:border-primary-container" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-secondary mb-1">Brand</label>
          <select value={form.brand} onChange={set('brand')} className="w-full border border-outline-variant rounded p-2 text-sm bg-white">
            {['Sullair', 'Atlas Copco', 'Ingersoll Rand', 'Kaeser'].map(b => <option key={b}>{b}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-secondary mb-1">Category</label>
          <select value={form.category} onChange={set('category')} className="w-full border border-outline-variant rounded p-2 text-sm bg-white">
            {PRODUCT_CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-secondary mb-1">Driven Type</label>
          <select value={form.driven_type} onChange={set('driven_type')} className="w-full border border-outline-variant rounded p-2 text-sm bg-white">
            {DRIVEN_TYPES.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-secondary mb-1">Capacity (CFM / kVA)</label>
          <input type="number" value={form.capacity} onChange={set('capacity')}
            className="w-full border border-outline-variant rounded p-2 text-sm outline-none focus:border-primary-container" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-secondary mb-1">Badge Label</label>
          <input type="text" placeholder="IN STOCK" value={form.badge} onChange={set('badge')}
            className="w-full border border-outline-variant rounded p-2 text-sm outline-none focus:border-primary-container" />
        </div>
        <div>
          <label className="block text-xs font-bold text-secondary mb-1">Image URL</label>
          <input type="text" placeholder="https://..." value={form.image_url} onChange={set('image_url')}
            className="w-full border border-outline-variant rounded p-2 text-sm outline-none focus:border-primary-container" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="prod-active" checked={form.is_active}
          onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
          className="w-4 h-4 accent-primary" />
        <label htmlFor="prod-active" className="text-xs font-bold text-secondary">Active in catalog</label>
      </div>
    </>
  );
}

function PartFormFields({ form, setForm }: { form: PartForm; setForm: (f: PartForm) => void }) {
  const set = (k: keyof PartForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: k === 'is_active' ? (e.target as HTMLInputElement).checked : e.target.value });

  return (
    <>
      <div>
        <label className="block text-xs font-bold text-secondary mb-1">Part Title *</label>
        <input required type="text" placeholder="e.g. Oil Filter — Sullair 02250100-756" value={form.title}
          onChange={set('title')} className="w-full border border-outline-variant rounded p-2 text-sm outline-none focus:border-primary-container" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-secondary mb-1">SKU *</label>
          <input required type="text" placeholder="e.g. SUL-OF-756" value={form.sku}
            onChange={set('sku')} className="w-full border border-outline-variant rounded p-2 text-sm outline-none focus:border-primary-container font-mono" />
        </div>
        <div>
          <label className="block text-xs font-bold text-secondary mb-1">Brand</label>
          <select value={form.brand} onChange={set('brand')} className="w-full border border-outline-variant rounded p-2 text-sm bg-white">
            {['Sullair', 'Atlas Copco', 'Ingersoll Rand', 'Kaeser'].map(b => <option key={b}>{b}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-secondary mb-1">Category</label>
          <select value={form.category} onChange={set('category')} className="w-full border border-outline-variant rounded p-2 text-sm bg-white">
            {PART_CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-secondary mb-1">Condition</label>
          <select value={form.condition} onChange={set('condition')} className="w-full border border-outline-variant rounded p-2 text-sm bg-white">
            {PART_CONDITIONS.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-bold text-secondary mb-1">Compatibility</label>
        <input type="text" placeholder="e.g. Sullair 185, 375 series" value={form.compatibility}
          onChange={set('compatibility')} className="w-full border border-outline-variant rounded p-2 text-sm outline-none focus:border-primary-container" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-secondary mb-1">Badge Label</label>
          <input type="text" placeholder="IN STOCK" value={form.badge} onChange={set('badge')}
            className="w-full border border-outline-variant rounded p-2 text-sm outline-none focus:border-primary-container" />
        </div>
        <div>
          <label className="block text-xs font-bold text-secondary mb-1">Image URL</label>
          <input type="text" placeholder="https://..." value={form.image_url} onChange={set('image_url')}
            className="w-full border border-outline-variant rounded p-2 text-sm outline-none focus:border-primary-container" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="part-active" checked={form.is_active}
          onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
          className="w-4 h-4 accent-primary" />
        <label htmlFor="part-active" className="text-xs font-bold text-secondary">Active in catalog</label>
      </div>
    </>
  );
}

function FormButtons({ saving, onCancel, label }: { saving: boolean; onCancel: () => void; label: string }) {
  return (
    <div className="pt-3 border-t border-outline-variant flex justify-end gap-3">
      <button type="button" onClick={onCancel}
        className="px-4 py-2 border border-outline rounded text-sm text-secondary hover:bg-surface-container">
        Cancel
      </button>
      <button type="submit" disabled={saving}
        className="px-5 py-2 bg-primary text-white font-bold rounded text-sm hover:bg-black transition-colors disabled:opacity-60 flex items-center gap-2">
        {saving && <span className="material-symbols-outlined text-base animate-spin">sync</span>}
        {label}
      </button>
    </div>
  );
}
