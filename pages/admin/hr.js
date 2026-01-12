"use client";
import { useEffect, useState } from 'react';
import API from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import { 
  Users, Search, Plus, Stethoscope, 
  Calendar, Clock, Trash2, Edit2, X, CheckCircle 
} from 'lucide-react';

export default function StaffManagement() {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    specialization: '',
    availableSlots: '' // Comma separated string for input
  });
  const [editingId, setEditingId] = useState(null);

  // --- FETCH DATA ---
  const fetchDoctors = async () => {
    try {
      const { data } = await API.get('/doctors'); // Uses the public doctor list route
      setDoctors(data);
    } catch (err) {
      console.error("Failed to load staff", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchDoctors();
    }
  }, [user]);

  // --- HANDLERS ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Convert comma-separated string to array
    const slotArray = formData.availableSlots.split(',').map(s => s.trim()).filter(s => s);

    const payload = {
      name: formData.name,
      specialization: formData.specialization,
      availableSlots: slotArray
    };

    try {
      if (editingId) {
        // Update Existing
        // Note: You need a PUT route in your backend for /api/doctors/:id
        await API.put(`/doctors/${editingId}`, payload);
        alert("✅ Doctor updated successfully");
      } else {
        // Create New
        // Note: In a real app, you'd also create a User Account here. 
        // This creates the Doctor Profile used for appointments.
        await API.post('/doctors', payload);
        alert("✅ New Doctor added to directory");
      }
      setShowModal(false);
      setFormData({ name: '', specialization: '', availableSlots: '' });
      setEditingId(null);
      fetchDoctors();
    } catch (err) {
      alert("Operation failed: " + (err.response?.data?.message || err.message));
    }
  };

  const handleEdit = (doc) => {
    setFormData({
      name: doc.name,
      specialization: doc.specialization,
      availableSlots: doc.availableSlots.join(', ')
    });
    setEditingId(doc._id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure? This will remove the doctor from appointments.")) return;
    try {
      await API.delete(`/doctors/${id}`);
      fetchDoctors();
    } catch (err) {
      alert("Failed to delete");
    }
  };

  // --- FILTER ---
  const filteredDoctors = doctors.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) || 
    d.specialization.toLowerCase().includes(search.toLowerCase())
  );

  if (user?.role !== 'admin') return <div className="p-10 text-center text-red-500">Access Denied</div>;
  if (loading) return <div className="p-10 text-center animate-pulse">Loading Staff Directory...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="w-8 h-8 text-purple-600" /> Medical Staff
          </h1>
          <p className="text-gray-500">Manage doctors, specializations, and schedules.</p>
        </div>
        
        <button 
          onClick={() => { setEditingId(null); setFormData({name:'', specialization:'', availableSlots:''}); setShowModal(true); }}
          className="bg-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-700 shadow-lg flex items-center gap-2 transition transform hover:-translate-y-1"
        >
          <Plus className="w-5 h-5" /> Add Doctor
        </button>
      </div>

      {/* SEARCH BAR */}
      <div className="relative mb-8">
        <Search className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
        <input 
          type="text" 
          placeholder="Search by name or specialization..." 
          className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-purple-500 bg-white shadow-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* DOCTORS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDoctors.map((doc) => (
          <div key={doc._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center text-xl font-bold">
                  {doc.name.charAt(0)}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(doc)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(doc._id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900">{doc.name}</h3>
              <p className="text-purple-600 font-medium flex items-center gap-1.5 mt-1">
                <Stethoscope className="w-4 h-4" /> {doc.specialization}
              </p>

              <div className="mt-6">
                <p className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Available Slots
                </p>
                <div className="flex flex-wrap gap-2">
                  {doc.availableSlots.length > 0 ? (
                    doc.availableSlots.map((slot, i) => (
                      <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded border border-gray-200">
                        {slot}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-red-400 italic">No slots configured</span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Footer Stats (Optional Mock Data) */}
            <div className="bg-gray-50 p-4 border-t border-gray-100 flex justify-between items-center text-sm text-gray-500">
               <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> Daily Rounds</span>
               <span className="font-bold text-gray-900">Active</span>
            </div>
          </div>
        ))}
      </div>

      {/* --- ADD/EDIT MODAL --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">
                {editingId ? 'Edit Doctor Profile' : 'Onboard New Doctor'}
              </h3>
              <button onClick={() => setShowModal(false)}><X className="w-6 h-6 text-gray-400" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Doctor Name</label>
                <input 
                  type="text" 
                  required
                  className="w-full p-3 border rounded-xl outline-none focus:border-purple-500"
                  placeholder="e.g. Dr. Sarah Wilson"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Specialization</label>
                <select 
                  className="w-full p-3 border rounded-xl outline-none focus:border-purple-500 bg-white"
                  value={formData.specialization}
                  onChange={e => setFormData({...formData, specialization: e.target.value})}
                  required
                >
                  <option value="">-- Select Specialty --</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Neurology">Neurology</option>
                  <option value="Pediatrics">Pediatrics</option>
                  <option value="General Medicine">General Medicine</option>
                  <option value="Orthopedics">Orthopedics</option>
                  <option value="Dermatology">Dermatology</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Available Slots (Comma Separated)</label>
                <input 
                  type="text" 
                  className="w-full p-3 border rounded-xl outline-none focus:border-purple-500"
                  placeholder="e.g. 09:00 AM, 10:00 AM, 02:00 PM"
                  value={formData.availableSlots}
                  onChange={e => setFormData({...formData, availableSlots: e.target.value})}
                />
                <p className="text-xs text-gray-500 mt-1">Enter times separated by commas.</p>
              </div>

              <div className="pt-4">
                <button type="submit" className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 transition flex justify-center items-center gap-2">
                  <CheckCircle className="w-5 h-5" /> Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}