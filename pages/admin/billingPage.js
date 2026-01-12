"use client";
import { useEffect, useState } from 'react';
import API from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import { CreditCard, Plus, CheckCircle, Clock, FileText, User, DollarSign, Trash2, Search } from 'lucide-react';

export default function AdminBilling() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [patients, setPatients] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form State
  const [newBill, setNewBill] = useState({
    patient: '',
    items: [{ description: 'Consultation Fee', cost: 0 }],
    status: 'Unpaid'
  });

  // Fetch Data
  const fetchData = async () => {
    try {
      const [invRes, patRes] = await Promise.all([
        API.get('/records/invoices/all'),
        API.get('/auth/patients')
      ]);
      setInvoices(invRes.data);
      setPatients(patRes.data);
    } catch (err) {
      console.error("Failed to load billing data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  // Form Handlers
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

  const calculateTotal = () => {
    return newBill.items.reduce((sum, item) => sum + (parseFloat(item.cost) || 0), 0);
  };

  // Submit New Invoice
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newBill.patient) return alert('Select a patient');
    if (newBill.items.some(item => !item.description || item.cost <= 0)) return alert('Fill all items');

    try {
      await API.post('/records/invoices', newBill);
      alert('Invoice created!');
      setShowCreate(false);
      setNewBill({ patient: '', items: [{ description: 'Consultation Fee', cost: 0 }], status: 'Unpaid' });
      fetchData();
    } catch (err) {
      alert('Error creating invoice');
    }
  };

  // Mark as Paid
  const markAsPaid = async (id) => {
    try {
      await API.put(`/records/invoices/${id}/pay`);
      fetchData();
    } catch (err) {
      alert('Error updating status');
    }
  };

  if (loading) return <div className="p-10 text-center">Loading billing...</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Billing Management</h1>
        <p className="text-gray-500">Create and manage patient invoices.</p>
      </div>

      <div className="mb-6">
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Create Invoice
        </button>
      </div>

      {/* Create Invoice Form */}
      {showCreate && (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 mb-6">
          <h2 className="font-bold text-lg mb-4">Create New Invoice</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Patient</label>
              <select
                className="w-full p-2 border rounded-lg"
                value={newBill.patient}
                onChange={(e) => setNewBill({ ...newBill, patient: e.target.value })}
                required
              >
                <option value="">Select Patient</option>
                {patients.map(p => (
                  <option key={p._id} value={p._id}>{p.name} ({p.email})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Items</label>
              {newBill.items.map((item, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Description"
                    className="flex-1 p-2 border rounded"
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    required
                  />
                  <input
                    type="number"
                    placeholder="Cost"
                    className="w-24 p-2 border rounded"
                    value={item.cost}
                    onChange={(e) => handleItemChange(index, 'cost', parseFloat(e.target.value))}
                    required
                  />
                  <button type="button" onClick={() => removeItem(index)} className="text-red-500">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
              <button type="button" onClick={addItem} className="text-blue-600 text-sm">+ Add Item</button>
            </div>

            <div className="text-right font-bold">Total: ${calculateTotal()}</div>

            <button className="w-full bg-green-600 text-white py-2 rounded-lg font-bold hover:bg-green-700">
              Create Invoice
            </button>
          </form>
        </div>
      )}

      {/* Invoices List */}
      <div className="space-y-4">
        {invoices.map((invoice) => (
          <div key={invoice._id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg text-gray-900">Invoice #{invoice._id.slice(-6)}</h3>
                <p className="text-sm text-gray-500">
                  Patient: {invoice.patient?.name} • {new Date(invoice.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <span className={`text-sm px-3 py-1 rounded-full font-bold ${
                  invoice.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {invoice.status}
                </span>
                <p className="text-2xl font-bold text-gray-900 mt-1">${invoice.totalAmount}</p>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              {invoice.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span>{item.description}</span>
                  <span>${item.cost}</span>
                </div>
              ))}
            </div>

            {invoice.status === 'Unpaid' && (
              <button
                onClick={() => markAsPaid(invoice._id)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700"
              >
                Mark as Paid
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}