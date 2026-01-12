"use client";
import { useEffect, useState } from 'react';
import API from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import { 
  Users, Search, UserPlus, Mail, Calendar, 
  ChevronRight, X, CheckCircle, Phone 
} from 'lucide-react';

export default function PatientManagement() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '', // Admin sets a default password
    role: 'patient' // Hardcoded
  });

  // --- FETCH DATA ---
  const fetchPatients = async () => {
    try {
      // Reusing the route we created earlier
      const { data } = await API.get('/auth/patients');
      setPatients(data);
    } catch (err) {
      console.error("Failed to load patients", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') fetchPatients();
  }, [user]);

  // --- HANDLERS ---
  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      // We use the existing register route. 
      // Note: This route returns a token for the new user, but as Admin we just ignore it.
      await API.post('/auth/register', formData);
      
      alert('✅ Patient Account Created Successfully');
      setShowModal(false);
      setFormData({ name: '', email: '', password: '', role: 'patient' });
      fetchPatients(); // Refresh list
    } catch (err) {
      alert("Registration failed: " + (err.response?.data?.message || err.message));
    }
  };

  // --- FILTER ---
  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.email.toLowerCase().includes(search.toLowerCase())
  );

  if (user?.role !== 'admin') return <div className="p-10 text-center text-red-500">Access Denied</div>;
  if (loading) return <div className="p-10 text-center animate-pulse">Loading Patient Directory...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600" /> Patient Directory
          </h1>
          <p className="text-gray-500">Manage registered patients and onboarding.</p>
        </div>
        
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg flex items-center gap-2 transition transform hover:-translate-y-1"
        >
          <UserPlus className="w-5 h-5" /> Register Patient
        </button>
      </div>

      {/* SEARCH BAR */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
        <input 
          type="text" 
          placeholder="Search by name or email..." 
          className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* PATIENTS LIST */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {filteredPatients.length === 0 ? (
          <div className="p-10 text-center text-gray-500">No patients found.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredPatients.map((patient) => (
              <div key={patient._id} className="p-5 hover:bg-gray-50 transition flex flex-col md:flex-row items-center justify-between gap-4">
                
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg">
                    {patient.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{patient.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-0.5">
                      <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {patient.email}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Joined: {new Date(patient.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                   <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-200">
                     Active
                   </span>
                   {/* Future Feature: Add 'View Records' button here */}
                   <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                     <ChevronRight className="w-5 h-5" />
                   </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- REGISTRATION MODAL --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">Add New Patient</h3>
              <button onClick={() => setShowModal(false)}><X className="w-6 h-6 text-gray-400" /></button>
            </div>

            <form onSubmit={handleRegister} className="p-6 space-y-4">
              <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-700 mb-4">
                <strong>Note:</strong> This creates a login for the patient. You must share these credentials with them manually.
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  required
                  className="w-full p-3 border rounded-xl outline-none focus:border-blue-500"
                  placeholder="e.g. John Doe"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
                <input 
                  type="email" 
                  required
                  className="w-full p-3 border rounded-xl outline-none focus:border-blue-500"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Temporary Password</label>
                <input 
                  type="text" 
                  required
                  className="w-full p-3 border rounded-xl outline-none focus:border-blue-500 font-mono"
                  placeholder="e.g. Pass123"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>

              <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition flex justify-center items-center gap-2 mt-4">
                <CheckCircle className="w-5 h-5" /> Create Account
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}