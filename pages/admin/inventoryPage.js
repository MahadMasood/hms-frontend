"use client";
import { useEffect, useState } from 'react';
import API from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import { 
  Package, Search, Plus, AlertTriangle, 
  DollarSign, Calendar, Trash2, RefreshCw, X, CheckCircle 
} from 'lucide-react';

export default function InventoryPage() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Stats
  const [stats, setStats] = useState({ totalVal: 0, lowStock: 0, totalItems: 0 });

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '', sku: '', category: 'Medicine', 
    quantity: 0, unitPrice: 0, expiryDate: ''
  });

  // --- FETCH DATA ---
  const fetchInventory = async () => {
    try {
      const { data } = await API.get('/inventory');
      setItems(data);
      
      // Calculate Stats
      const low = data.filter(i => i.quantity < 20).length;
      const val = data.reduce((acc, curr) => acc + (curr.quantity * curr.unitPrice), 0);
      setStats({ totalItems: data.length, lowStock: low, totalVal: val });
    } catch (err) {
      console.error("Inventory load failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // --- ACTIONS ---
  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      await API.post('/inventory', formData);
      alert('✅ Item Added Successfully');
      setShowModal(false);
      setFormData({ name: '', sku: '', category: 'Medicine', quantity: 0, unitPrice: 0, expiryDate: '' });
      fetchInventory();
    } catch (err) {
      alert("Error: " + (err.response?.data?.message || err.message));
    }
  };

  const handleAdjustStock = async (id, amount, type) => {
    try {
      await API.post(`/inventory/${id}/adjust`, { adjustment: amount, type });
      fetchInventory(); // Refresh UI to show new quantity
    } catch (err) {
      alert("Update failed: " + err.response?.data?.message);
    }
  };

  // --- FILTERS ---
  const filteredItems = items.filter(i => 
    i.name.toLowerCase().includes(search.toLowerCase()) || 
    i.sku.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="p-10 text-center animate-pulse">Loading Pharmacy Data...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      
      {/* HEADER & STATS */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Package className="w-8 h-8 text-emerald-600" /> Pharmacy Inventory
          </h1>
          <p className="text-gray-500">Manage stock, track expiry, and reorder supplies.</p>
        </div>
        
        {user?.role === 'admin' && (
          <button 
            onClick={() => setShowModal(true)}
            className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 shadow-lg flex items-center gap-2 transition transform hover:-translate-y-1"
          >
            <Plus className="w-5 h-5" /> Add New Item
          </button>
        )}
      </div>

      {/* DASHBOARD CARDS (Admin Only) */}
      {user?.role === 'admin' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div><p className="text-gray-500 text-xs font-bold uppercase">Total Inventory Value</p><p className="text-2xl font-bold text-gray-900">${stats.totalVal.toLocaleString()}</p></div>
            <DollarSign className="text-emerald-200 w-10 h-10" />
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div><p className="text-gray-500 text-xs font-bold uppercase">Low Stock Alerts</p><p className="text-2xl font-bold text-red-600">{stats.lowStock}</p></div>
            <AlertTriangle className="text-red-200 w-10 h-10" />
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div><p className="text-gray-500 text-xs font-bold uppercase">Total SKU Count</p><p className="text-2xl font-bold text-blue-600">{stats.totalItems}</p></div>
            <Package className="text-blue-200 w-10 h-10" />
          </div>
        </div>
      )}

      {/* SEARCH */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
        <input 
          type="text" 
          placeholder="Search by Medicine Name or SKU..." 
          className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* INVENTORY LIST */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase">Item Details</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase">Category</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase">Stock Level</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredItems.map((item) => {
              const isLow = item.quantity < 20;
              return (
                <tr key={item._id} className="hover:bg-gray-50 transition">
                  <td className="p-4">
                    <p className="font-bold text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-2">
                      <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{item.sku}</span>
                      {item.expiryDate && (
                         <span className="flex items-center gap-1 text-orange-600"><Calendar className="w-3 h-3"/> Exp: {new Date(item.expiryDate).toLocaleDateString()}</span>
                      )}
                    </p>
                  </td>
                  <td className="p-4 text-sm text-gray-600">{item.category}</td>
                  <td className="p-4">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${isLow ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {isLow && <AlertTriangle className="w-3 h-3" />}
                      {item.quantity} Units
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    {user?.role === 'admin' ? (
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleAdjustStock(item._id, 10, 'add')}
                          className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 font-bold text-xs flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> Restock
                        </button>
                        <button 
                           onClick={() => {
                             if(confirm("Consume 1 unit?")) handleAdjustStock(item._id, 1, 'remove')
                           }}
                           className="p-2 text-gray-400 hover:text-red-600 rounded-lg"
                           title="Report Loss/Consumption"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 italic">Read Only</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredItems.length === 0 && <div className="p-10 text-center text-gray-500">No items found.</div>}
      </div>

      {/* --- ADD ITEM MODAL --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">Add New Inventory</h3>
              <button onClick={() => setShowModal(false)}><X className="w-6 h-6 text-gray-400" /></button>
            </div>
            
            <form onSubmit={handleAddItem} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Item Name</label>
                  <input type="text" required className="w-full p-3 border rounded-xl" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Panadol" />
                </div>
                <div>
                   <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">SKU Code</label>
                   <input type="text" required className="w-full p-3 border rounded-xl" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} placeholder="MED-001" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Category</label>
                  <select className="w-full p-3 border rounded-xl bg-white" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    <option>Medicine</option>
                    <option>Surgical</option>
                    <option>Equipment</option>
                    <option>General</option>
                  </select>
                </div>
                <div>
                   <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Expiry Date</label>
                   <input type="date" className="w-full p-3 border rounded-xl" value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Initial Quantity</label>
                  <input type="number" required className="w-full p-3 border rounded-xl" value={formData.quantity} onChange={e => setFormData({...formData, quantity: Number(e.target.value)})} />
                </div>
                <div>
                   <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Unit Price ($)</label>
                   <input type="number" required className="w-full p-3 border rounded-xl" value={formData.unitPrice} onChange={e => setFormData({...formData, unitPrice: Number(e.target.value)})} />
                </div>
              </div>

              <button type="submit" className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 mt-4 flex justify-center items-center gap-2">
                <CheckCircle className="w-5 h-5" /> Save to Inventory
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}