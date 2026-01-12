"use client";
import { useEffect, useState } from 'react';
import API from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import { CreditCard, CheckCircle, Clock, FileText, DollarSign } from 'lucide-react';

export default function PatientBilling() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch Data
  const fetchInvoices = async () => {
    try {
      const { data } = await API.get('/records/invoices/my');
      setInvoices(data);
    } catch (err) {
      console.error("Failed to load invoices", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchInvoices();
  }, [user]);

  // Pay Invoice
  const handlePay = async (invoiceId) => {
    if (!confirm('Confirm payment?')) return;
    try {
      await API.put(`/records/invoices/${invoiceId}/pay`);
      alert('Payment successful!');
      fetchInvoices();
    } catch (err) {
      alert('Payment failed');
    }
  };

  if (loading) return <div className="p-10 text-center">Loading billing...</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Billing</h1>
        <p className="text-gray-500">View and manage your invoices.</p>
      </div>

      <div className="space-y-6">
        {invoices.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-8 text-center border border-dashed border-gray-300 text-gray-500">
            No invoices found.
          </div>
        ) : (
          invoices.map((invoice) => (
            <div key={invoice._id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">Invoice #{invoice._id.slice(-6)}</h3>
                  <p className="text-sm text-gray-500">
                    {new Date(invoice.createdAt).toLocaleDateString()}
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
                  onClick={() => handlePay(invoice._id)}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition"
                >
                  Pay Now
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}