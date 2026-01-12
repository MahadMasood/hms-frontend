"use client";
import { useEffect, useState } from 'react';
import API from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import { 
  Wrench, AlertTriangle, CheckCircle, Plus, 
  Trash2, Clock, MapPin, BedDouble, X 
} from 'lucide-react';

export default function MaintenancePage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [beds, setBeds] = useState([]); // For dropdown
  const [loading, setLoading] = useState(true);
  
  // Modal & Form State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    department: 'General',
    item: '',
    issueType: 'Repair', // Repair, Cleaning, Safety
    priority: 'Medium',
    description: '',
    bedId: '' // Optional, for cleaning integration
  });

  // --- FETCH DATA ---
  const loadData = async () => {
    try {
      const [ticketRes, bedRes] = await Promise.all([
        API.get('/maintenance'),
        API.get('/inpatient/beds')
      ]);
      
      // Sort: High Priority first
      const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
      const sortedTickets = ticketRes.data.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

      setTickets(sortedTickets);
      setBeds(bedRes.data);
    } catch (err) {
      console.error("Failed to load maintenance data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') loadData();
  }, [user]);

  // --- ACTIONS ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/maintenance', formData);
      alert('✅ Ticket Created!');
      setShowModal(false);
      setFormData({ department: 'General', item: '', issueType: 'Repair', priority: 'Medium', description: '', bedId: '' });
      loadData();
    } catch (err) {
      alert("Error: " + (err.response?.data?.message || err.message));
    }
  };

  const handleResolve = async (id) => {
    if(!confirm("Mark this issue as Resolved?")) return;
    try {
      await API.put(`/maintenance/${id}/resolve`);
      loadData(); // Refresh list
    } catch (err) {
      alert("Failed to resolve ticket");
    }
  };

  // --- HELPERS ---
  const getPriorityColor = (p) => {
    switch(p) {
      case 'High': return 'bg-red-100 text-red-700 border-red-200';
      case 'Medium': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Low': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100';
    }
  };

  if (user?.role !== 'admin') return <div className="p-10 text-center text-red-500">Access Denied</div>;
  if (loading) return <div className="p-10 text-center animate-pulse">Loading Tickets...</div>;

  return (
    <div className="max-w-6xl mx-auto">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Wrench className="w-8 h-8 text-orange-600" /> Maintenance & Cleaning
          </h1>
          <p className="text-gray-500">Track repairs, housekeeping, and facility issues.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-orange-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-orange-700 shadow-lg flex items-center gap-2 transition transform hover:-translate-y-1"
        >
          <Plus className="w-5 h-5" /> Create Ticket
        </button>
      </div>

      {/* STATS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
           <div><p className="text-gray-500 text-xs font-bold uppercase">Total Open</p><p className="text-2xl font-bold">{tickets.length}</p></div>
           <Wrench className="text-gray-300 w-8 h-8" />
        </div>
        <div className="bg-red-50 p-5 rounded-2xl border border-red-100 shadow-sm flex items-center justify-between">
           <div><p className="text-red-500 text-xs font-bold uppercase">High Priority</p><p className="text-2xl font-bold text-red-700">{tickets.filter(t => t.priority === 'High').length}</p></div>
           <AlertTriangle className="text-red-300 w-8 h-8" />
        </div>
        <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 shadow-sm flex items-center justify-between">
           <div><p className="text-blue-500 text-xs font-bold uppercase">Cleaning Requests</p><p className="text-2xl font-bold text-blue-700">{tickets.filter(t => t.issueType === 'Cleaning').length}</p></div>
           <BedDouble className="text-blue-300 w-8 h-8" />
        </div>
      </div>

      {/* TICKETS LIST */}
      <div className="space-y-4">
        {tickets.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-700">All Systems Operational</h3>
            <p className="text-gray-500">No active maintenance tickets.</p>
          </div>
        ) : (
          tickets.map((ticket) => (
            <div key={ticket._id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md transition">
              
              <div className="flex gap-5">
                {/* Priority Badge */}
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center border-2 ${getPriorityColor(ticket.priority).replace('bg-', 'bg-opacity-20 ')}`}>
                  <AlertTriangle className={`w-6 h-6 ${ticket.priority === 'High' ? 'text-red-600' : ticket.priority === 'Medium' ? 'text-orange-600' : 'text-blue-600'}`} />
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-900">{ticket.item} <span className="text-gray-400 font-normal text-sm">in {ticket.department}</span></h3>
                  <p className="text-gray-600 mt-1">{ticket.description}</p>
                  
                  <div className="flex items-center gap-3 mt-2 text-xs font-bold text-gray-400 uppercase tracking-wide">
                     <span className={`px-2 py-0.5 rounded ${getPriorityColor(ticket.priority)}`}>{ticket.priority}</span>
                     <span>•</span>
                     <span>{ticket.issueType}</span>
                     <span>•</span>
                     <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(ticket.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => handleResolve(ticket._id)}
                className="px-6 py-2 bg-green-50 text-green-700 font-bold text-sm rounded-lg hover:bg-green-100 border border-green-200 flex items-center gap-2 transition"
              >
                <CheckCircle className="w-4 h-4" /> Mark Done
              </button>

            </div>
          ))
        )}
      </div>

      {/* --- CREATE MODAL --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">New Maintenance Ticket</h3>
              <button onClick={() => setShowModal(false)}><X className="w-6 h-6 text-gray-400" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              {/* Type & Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Issue Type</label>
                  <select className="w-full p-3 border rounded-xl bg-white" value={formData.issueType} onChange={e => setFormData({...formData, issueType: e.target.value})}>
                    <option value="Repair">Repair</option>
                    <option value="Cleaning">Cleaning</option>
                    <option value="Safety">Safety Check</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Priority</label>
                  <select className="w-full p-3 border rounded-xl bg-white" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              {/* Location & Item */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Department</label>
                  <select className="w-full p-3 border rounded-xl bg-white" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})}>
                    <option value="General">General</option>
                    <option value="ICU">ICU</option>
                    <option value="ER">Emergency Room</option>
                    <option value="Ward A">Ward A</option>
                    <option value="Laboratory">Laboratory</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Item Name</label>
                  <input type="text" placeholder="e.g. AC Unit, Bed 05" className="w-full p-3 border rounded-xl" value={formData.item} onChange={e => setFormData({...formData, item: e.target.value})} required />
                </div>
              </div>

              {/* Special Logic: Bed Selection for Cleaning */}
              {formData.issueType === 'Cleaning' && (
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <label className="text-xs font-bold text-blue-600 uppercase mb-1 block flex items-center gap-1"><BedDouble className="w-3 h-3" /> Select Bed (Auto-Updates Status)</label>
                  <select className="w-full p-3 border border-blue-200 rounded-xl bg-white" value={formData.bedId} onChange={e => setFormData({...formData, bedId: e.target.value})}>
                    <option value="">-- Choose Bed --</option>
                    {beds.map(b => (
                      <option key={b._id} value={b._id}>{b.wardName} - {b.bedNumber} ({b.status})</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Description</label>
                <textarea rows="3" placeholder="Describe the problem..." className="w-full p-3 border rounded-xl" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required></textarea>
              </div>

              <button type="submit" className="w-full bg-orange-600 text-white py-3 rounded-xl font-bold hover:bg-orange-700 transition">Create Ticket</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}