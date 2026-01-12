"use client";
import { useEffect, useState } from 'react';
import API from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import { Search, Package, AlertTriangle, CheckCircle, Filter, ShoppingCart, Plus, Minus } from 'lucide-react';

export default function InventoryPage() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter State
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Admin Adjustment State
  const [adjustingId, setAdjustingId] = useState(null); // ID of item being modified
  const [adjustAmount, setAdjustAmount] = useState(0);

  const fetchInventory = async () => {
    try {
      const { data } = await API.get('/inventory');
      // Sort: Low stock first, then alphabetical
      const sorted = data.sort((a, b) => a.quantity - b.quantity);
      setItems(sorted);
    } catch (err) {
      console.error("Inventory error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleAdjust = async (id, type) => {
    if (adjustAmount <= 0) return alert("Enter a valid amount");
    try {
      await API.post(`/inventory/${id}/adjust`, { adjustment: adjustAmount, type });
      alert('Stock updated!');
      setAdjustingId(null);
      setAdjustAmount(0);
      fetchInventory();
    } catch (err) {
      alert(err.response?.data?.message || 'Update failed');
    }
  };

  // --- FILTER LOGIC ---
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                          item.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  // Calculate Categories dynamically
  const categories = ['All', ...new Set(items.map(i => i.category))];

  if (loading) return <div className="p-10 text-center animate-pulse">Checking Pharmacy Stock...</div>;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Package className="w-8 h-8 text-blue-600" /> Pharmacy Inventory
          </h1>
          <p className="text-gray-500 mt-1">
            {user?.role === 'doctor' 
              ? "Check medicine availability before prescribing." 
              : "Manage hospital stock levels."}
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search medicine or SKU..." 
            className="w-full pl-10 pr-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Categories Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
              categoryFilter === cat 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Inventory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.length === 0 ? (
          <div className="col-span-full text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
             <Filter className="w-12 h-12 text-gray-300 mx-auto mb-3" />
             <p className="text-gray-500">No items match your search.</p>
          </div>
        ) : (
          filteredItems.map((item) => {
            // Determine Stock Status Color
            const isCritical = item.quantity === 0;
            const isLow = item.quantity < 50;
            const statusColor = isCritical ? 'bg-red-50 border-red-200' : isLow ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-100';
            
            return (
              <div key={item._id} className={`p-5 rounded-2xl border shadow-sm transition-all hover:shadow-md ${statusColor}`}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-white px-2 py-0.5 rounded border border-gray-100">
                      {item.sku}
                    </span>
                    <h3 className="text-lg font-bold text-gray-900 mt-1">{item.name}</h3>
                    <p className="text-xs text-gray-500">{item.category} • ${item.unitPrice}/unit</p>
                  </div>
                  
                  {/* Quantity Badge */}
                  <div className={`text-center px-3 py-1.5 rounded-lg min-w-[70px] ${
                    isCritical ? 'bg-red-100 text-red-700' : 
                    isLow ? 'bg-orange-100 text-orange-700' : 
                    'bg-green-100 text-green-700'
                  }`}>
                    <span className="block text-xl font-bold leading-none">{item.quantity}</span>
                    <span className="text-[10px] font-bold uppercase">Left</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200/50">
                  {isCritical ? (
                    <span className="flex items-center gap-1.5 text-red-600 text-sm font-bold">
                      <AlertTriangle className="w-4 h-4" /> Out of Stock
                    </span>
                  ) : isLow ? (
                    <span className="flex items-center gap-1.5 text-orange-600 text-sm font-bold">
                      <ShoppingCart className="w-4 h-4" /> Low Stock
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-green-600 text-sm font-bold">
                      <CheckCircle className="w-4 h-4" /> In Stock
                    </span>
                  )}
                  
                  {/* ADMIN ONLY CONTROLS */}
                  {user?.role === 'admin' && (
                    <div className="ml-auto">
                      {adjustingId === item._id ? (
                         <div className="flex items-center gap-1 animate-in fade-in slide-in-from-right-2">
                           <input 
                             type="number" 
                             className="w-16 p-1 border rounded text-sm text-center"
                             placeholder="Qty"
                             autoFocus
                             onChange={(e) => setAdjustAmount(Number(e.target.value))}
                           />
                           <button onClick={() => handleAdjust(item._id, 'add')} className="p-1 bg-green-100 text-green-600 rounded hover:bg-green-200"><Plus className="w-4 h-4"/></button>
                           <button onClick={() => handleAdjust(item._id, 'remove')} className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200"><Minus className="w-4 h-4"/></button>
                           <button onClick={() => setAdjustingId(null)} className="ml-1 text-xs text-gray-400">Cancel</button>
                         </div>
                      ) : (
                        <button 
                          onClick={() => setAdjustingId(item._id)}
                          className="text-xs text-blue-600 font-semibold hover:underline"
                        >
                          Adjust
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}