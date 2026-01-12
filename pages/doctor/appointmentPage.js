"use client";
import { useEffect, useState } from 'react';
import API from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import { Calendar, Clock, User, CheckCircle, XCircle, FileText, Search, Filter } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AppointmentsPage() {
  const { user, loading: authLoading } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Doctor Specific State
  const [filter, setFilter] = useState('today'); // 'today', 'upcoming', 'history'
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (authLoading || !user) return;
    fetchAppointments();
  }, [user, authLoading]);

  const fetchAppointments = async () => {
    try {
      // Backend already filters by role - just fetch all
      const { data } = await API.get('/appointments');
      
      console.log("--- APPOINTMENTS PAGE DEBUG ---");
      console.log("User:", user.name, "Role:", user.role);
      console.log("Appointments from backend:", data.length);
      
      // Backend already filtered by doctor/patient - no need to filter again!
      // Just sort by date & time
      data.sort((a, b) => new Date(a.date) - new Date(b.date) || a.slot.localeCompare(b.slot));
      
      setAppointments(data);
      console.log("Final appointments set:", data.length);
    } catch (err) {
      console.error("Failed to load appointments", err);
      console.error("Error details:", err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
    if(!confirm(`Mark this appointment as ${newStatus}?`)) return;
    try {
      await API.put(`/appointments/${id}`, { status: newStatus });
      fetchAppointments(); // Refresh
    } catch (err) {
      console.error("Failed to update status:", err);
      alert("Failed to update status");
    }
  };

  // --- FILTERING LOGIC FOR DOCTOR ---
  const getFilteredList = () => {
    const todayStr = new Date().toDateString();
    
    return appointments.filter(a => {
      const apptDate = new Date(a.date).toDateString();
      const matchesSearch = a.patientName.toLowerCase().includes(search.toLowerCase());
      
      if (!matchesSearch) return false;

      if (filter === 'today') return apptDate === todayStr;
      if (filter === 'upcoming') return new Date(a.date) > new Date();
      if (filter === 'history') return new Date(a.date) < new Date() && apptDate !== todayStr;
      return true;
    });
  };

  if (loading || authLoading) return <div className="p-10 text-center">Loading Schedule...</div>;

  // --- PATIENT VIEW (Redirect to Booking or Show Simple List) ---
  if (user.role === 'patient') {
    // Ideally render the "BookAppointment" component here
    return <div className="p-10 text-center">Please use the Dashboard Home to book.</div>;
  }

  // --- DOCTOR VIEW ---
  const displayList = getFilteredList();

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Appointment Manager</h1>
          <p className="text-gray-500">Manage your patient queue and daily schedule.</p>
        </div>
        
        {/* Search Bar */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search patient name..." 
            className="w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 pb-1">
        {['today', 'upcoming', 'history'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-6 py-2 text-sm font-bold capitalize transition-all rounded-t-lg ${
              filter === f 
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' 
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Appointment List */}
      <div className="space-y-4">
        {displayList.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No appointments found in this category.</p>
          </div>
        ) : (
          displayList.map((appt) => (
            <div key={appt._id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-md transition">
              
              {/* Left: Time & Info */}
              <div className="flex items-center gap-6 w-full md:w-auto">
                <div className={`flex flex-col items-center justify-center w-20 h-20 rounded-2xl border ${
                  appt.status === 'Completed' ? 'bg-gray-50 border-gray-200 text-gray-400' :
                  appt.status === 'Cancelled' ? 'bg-red-50 border-red-100 text-red-400' :
                  'bg-blue-50 border-blue-100 text-blue-600'
                }`}>
                  <span className="text-lg font-bold">{appt.slot.split(' ')[0]}</span>
                  <span className="text-xs font-bold uppercase">{appt.slot.split(' ')[1]}</span>
                </div>
                
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{appt.patientName}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                     <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {new Date(appt.date).toLocaleDateString()}</span>
                     {appt.patientPhone && <span className="flex items-center gap-1"><User className="w-4 h-4" /> {appt.patientPhone}</span>}
                  </div>
                  <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded font-bold uppercase ${
                    appt.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                    appt.status === 'Completed' ? 'bg-green-100 text-green-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {appt.status}
                  </span>
                </div>
              </div>

              {/* Right: Actions */}
              {appt.status === 'Pending' && (
                <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                   <button 
                     onClick={() => updateStatus(appt._id, 'Cancelled')}
                     className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"
                   >
                     <XCircle className="w-4 h-4" /> No Show
                   </button>
                   
                   <button 
                     onClick={() => updateStatus(appt._id, 'Completed')}
                     className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-md transition"
                   >
                     <CheckCircle className="w-4 h-4" /> Mark Done
                   </button>
                   
                   <Link 
                     href={`/dashboard/prescriptions?patient=${appt.patientName}`}
                     className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-blue-600 border border-blue-200 hover:bg-blue-50 rounded-lg transition"
                   >
                     <FileText className="w-4 h-4" /> Prescribe
                   </Link>
                </div>
              )}

              {appt.status === 'Completed' && (
                 <div className="flex items-center gap-2 text-gray-400">
                    <CheckCircle className="w-5 h-5" /> Visit Completed
                 </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}