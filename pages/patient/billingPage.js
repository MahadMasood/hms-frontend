"use client";
import { useEffect, useState } from 'react';
import API from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import { CreditCard, Plus, CheckCircle, Clock, FileText, User, DollarSign, Trash2, Search } from 'lucide-react';

export default function BillingModule() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [patients, setPatients] = useState([]); // For Admin Dropdown
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form State (Matches your Mongoose Schema)
  const [newBill, setNewBill] = useState({
    patient: '', // This will store the User ID
    items: [{ description: 'Consultation Fee', cost: 0 }],
    status: 'Unpaid'
  });

  // 1. Fetch Data based on Role
  const fetchData = async () => {
    try {
      if (user.role === 'admin') {
        // Admin: Get ALL invoices & List of Patients for the dropdown
        const [invRes, patRes] = await Promise.all([
          API.get('/records/invoices/all'),
          API.get('/auth/patients') // Ensure this route exists as discussed before
        ]);
        setInvoices(invRes.data);
        setPatients(patRes.data);
      } else {
        // Patient: Get MY invoices only (Your existing route)
        const { data } = await API.get('/records/invoices/my');
        setInvoices(data);
      }
    } catch (err) {
      console.error("Failed to load billing data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  // --- FORM HANDLERS ---
  
  const handleItemChange = (index, field, value) => {
    const updatedItems = [...newBill.items];
    updatedItems[index][field] = value;
    setNewBill({ ...newBill, items: updatedItems });
  };

  const addItem = () => {
    setNewBill({
      ...newBill,
      items: [...newBill.items, { description: '', cost: 0 }]
    });
  };

  const removeItem = (index) => {
    const updatedItems = newBill.items.filter((_, i) => i !== index);
    setNewBill({ ...newBill, items: updatedItems });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    
    // Calculate Total
    const totalAmount = newBill.items.reduce((acc, item) => acc + Number(item.cost), 0);

    try {
      // Sending payload exactly as your Schema expects
      await API.post('/records/invoices', {
        patient: newBill.patient,
        items: newBill.items,
        totalAmount: totalAmount,
        status: newBill.status
      });
      
      alert('Invoice Generated!');
      setShowCreate(false);
      fetchData(); // Refresh list
      // Reset Form
      setNewBill({ patient: '', items: [{ description: '', cost: 0 }], status: 'Unpaid' });
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  // Helper to calculate total for display
  const currentTotal = newBill.items.reduce((acc, item) => acc + Number(item.cost), 0);

  if (loading) return <div className="p-10 text-center">Loading Financial Data...</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Billing & Invoices</h1>
          <p className="text-gray-500">Manage financial records and payments.</p>
        </div>
        {user?.role === 'admin' && (
          <button 
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition shadow-lg"
          >
            {showCreate ? 'Close Form' : '+ New Invoice'}
          </button>
        )}
      </div>

      {/* --- CREATE INVOICE FORM (Admin Only) --- */}
      {showCreate && user?.role === 'admin' && (
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-blue-100 mb-8 animate-in slide-in-from-top-4">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" /> Generate New Bill
          </h2>
          
          <form onSubmit={handleCreate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Patient Dropdown (Required for ObjectId reference) */}
              <div>
                <label className="text-sm font-semibold text-gray-600 block mb-1">Select Patient</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                  <select 
                    className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    value={newBill.patient}
                    onChange={(e) => setNewBill({...newBill, patient: e.target.value})}
                    required
                  >
                    <option value="">-- Choose Patient --</option>
                    {patients.map(p => (
                      <option key={p._id} value={p._id}>{p.name} ({p.email})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-600 block mb-1">Status</label>
                <select 
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  value={newBill.status}
                  onChange={(e) => setNewBill({...newBill, status: e.target.value})}
                >
                  <option value="Unpaid">Unpaid</option>
                  <option value="Paid">Paid</option>
                  <option value="Insurance Pending">Insurance Pending</option>
                </select>
              </div>
            </div>

            {/* Line Items */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Billable Items</label>
              {newBill.items.map((item, index) => (
                <div key={index} className="flex gap-3 mb-2">
                  <input 
                    type="text" 
                    placeholder="Description (e.g. X-Ray)" 
                    className="flex-1 p-2 border rounded-lg"
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    required
                  />
                  <input 
                    type="number" 
                    placeholder="Cost" 
                    className="w-32 p-2 border rounded-lg"
                    value={item.cost}
                    onChange={(e) => handleItemChange(index, 'cost', e.target.value)}
                    required
                  />
                  {newBill.items.length > 1 && (
                    <button type="button" onClick={() => removeItem(index)} className="text-red-500 hover:bg-red-100 p-2 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addItem} className="text-sm text-blue-600 font-semibold mt-2 hover:underline">
                + Add Another Item
              </button>
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-xl font-bold text-gray-800">
                Total: <span className="text-blue-600">${currentTotal}</span>
              </div>
              <button className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 transition">
                Create Invoice
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- INVOICE LIST --- */}
      <div className="grid grid-cols-1 gap-4">
        {invoices.length === 0 ? (
           <div className="text-center py-10 text-gray-500 bg-white rounded-xl border border-dashed">No invoices found.</div>
        ) : (
          invoices.map((inv) => (
            <div key={inv._id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 hover:shadow-md transition-all">
              
              {/* Left Info */}
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  inv.status === 'Paid' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                }`}>
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  {/* Admin sees Patient Name (via Populate), Patient sees "Hospital Bill" or similar */}
                  <h3 className="font-bold text-gray-900">
                    {user.role === 'admin' ? (inv.patient?.name || 'Unknown Patient') : 'Medical Invoice'}
                  </h3>
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <Clock className="w-3 h-3" /> {new Date(inv.createdAt).toLocaleDateString()}
                    <span>•</span>
                    <span className="text-xs">ID: #{inv._id.slice(-6).toUpperCase()}</span>
                  </p>
                </div>
              </div>

              {/* Middle Breakdown */}
              <div className="hidden md:block flex-1 px-8">
                <div className="flex flex-wrap gap-2">
                  {inv.items?.slice(0, 2).map((item, i) => (
                    <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      {item.description}
                    </span>
                  ))}
                  {inv.items?.length > 2 && <span className="text-xs text-gray-400">+{inv.items.length - 2} more</span>}
                </div>
              </div>

              {/* Right Status & Action */}
              <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                <div className="text-right">
                  <p className="text-xl font-bold text-gray-900">${inv.totalAmount}</p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    inv.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {inv.status}
                  </span>
                </div>
                
                {/* Patient Payment Button (Simulation) */}
                {user?.role === 'patient' && inv.status === 'Unpaid' && (
                  <button className="bg-black text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-800 flex items-center gap-2 transition">
                    <CreditCard className="w-4 h-4" /> Pay Now
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}