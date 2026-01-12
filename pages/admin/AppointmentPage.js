"use client";
import { useEffect, useState } from 'react';
import API from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import { 
  Calendar, Search, Filter, XCircle, CheckCircle, 
  Clock, User, Stethoscope, ChevronDown 
} from 'lucide-react';

export default function AllAppointmentsPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState(''); // Empty = All Time

  const fetchAppointments = async () => {
    try {
      const { data } = await API.get('/appointments');
      // Sort: Pending first, then by Date
      const sorted = data.sort((a, b) => {
        if (a.status === 'Pending' && b.status !== 'Pending') return -1;
        if (a.status !== 'Pending' && b.status === 'Pending') return 1;
        return new Date(a.date) - new Date(b.date);
      });
      setAppointments(sorted);
    } catch (err) {
      console.error("Failed to load appointments", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') fetchAppointments();
  }, [user]);

  const handleStatusUpdate = async (id, newStatus) => {
    if(!confirm(`Change status to ${newStatus}?`)) return;
    try {
      await API.put(`/appointments/${id}`, { status: newStatus });
      fetchAppointments();
    } catch (err) {
      alert("Update failed");
    }
  };

  // --- FILTER LOGIC ---
  const filteredList = appointments.filter(appt => {
    const matchesSearch = 
      appt.patientName.toLowerCase().includes(search.toLowerCase()) ||
      appt.doctor?.name.toLowerCase().includes(search.toLowerCase());
      
    const matchesStatus = statusFilter === 'All' || appt.status === statusFilter;
    
    // Date Check (matches string format YYYY-MM-DD)
    const matchesDate = !dateFilter || new Date(appt.date).toISOString().split('T')[0] === dateFilter;

    return matchesSearch && matchesStatus && matchesDate;
  });

  if (user?.role !== 'admin') return <div className="p-10 text-center text-red-500">Access Denied</div>;
  if (loading) return <div className="p-10 text-center animate-pulse">Loading Master Schedule...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Calendar className="w-8 h-8 text-blue-600" /> Master Appointment List
        </h1>
        <p className="text-gray-500">View and manage all hospital bookings across all doctors.</p>
      </div>

      {/* CONTROLS TOOLBAR */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search Patient or Doctor..." 
            className="w-full pl-10 pr-4 py-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
            <select 
              className="pl-9 pr-8 py-2.5 border rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <ChevronDown className="absolute right-3 top-3.5 text-gray-400 w-3 h-3 pointer-events-none" />
          </div>

          {/* Date Filter */}
          <input 
            type="date" 
            className="px-4 py-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
          
          {/* Clear Filters */}
          {(search || statusFilter !== 'All' || dateFilter) && (
            <button 
              onClick={() => {setSearch(''); setStatusFilter('All'); setDateFilter('');}}
              className="text-sm text-red-500 hover:text-red-700 font-bold px-2"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Date & Time</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Patient</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Doctor</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-10 text-center text-gray-500">No appointments match your filters.</td>
                </tr>
              ) : (
                filteredList.map((appt) => (
                  <tr key={appt._id} className="hover:bg-gray-50 transition">
                    
                    {/* Time */}
                    <td className="p-4">
                      <div className="font-bold text-gray-900">{new Date(appt.date).toLocaleDateString()}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {appt.slot}
                      </div>
                    </td>

                    {/* Patient */}
                    <td className="p-4">
                      <div className="font-medium text-gray-900">{appt.patientName}</div>
                      <div className="text-xs text-gray-500">{appt.patientPhone || 'No Phone'}</div>
                    </td>

                    {/* Doctor */}
                    <td className="p-4">
                      {appt.doctor ? (
                        <div className="flex items-center gap-2">
                           <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                              {appt.doctor.name.charAt(0)}
                           </div>
                           <div>
                              <div className="text-sm font-medium text-gray-900">{appt.doctor.name}</div>
                              <div className="text-xs text-gray-500">{appt.doctor.specialization}</div>
                           </div>
                        </div>
                      ) : (
                        <span className="text-red-400 italic">Unknown Doctor</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                        appt.status === 'Completed' ? 'bg-green-100 text-green-700' :
                        appt.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {appt.status === 'Completed' && <CheckCircle className="w-3 h-3" />}
                        {appt.status === 'Cancelled' && <XCircle className="w-3 h-3" />}
                        {appt.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      {appt.status === 'Pending' && (
                        <button 
                          onClick={() => handleStatusUpdate(appt._id, 'Cancelled')}
                          className="text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 transition"
                        >
                          Cancel Booking
                        </button>
                      )}
                      {appt.status === 'Cancelled' && (
                        <span className="text-xs text-gray-400 italic">Cancelled by Admin</span>
                      )}
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}