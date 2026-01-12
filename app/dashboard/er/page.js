"use client";
import { useEffect, useState } from 'react';
import API from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import { Siren, Clock, Activity, CheckCircle, AlertTriangle, Stethoscope, User, ArrowRight } from 'lucide-react';

export default function EmergencyRoom() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ critical: 0, waiting: 0 });

  const fetchERData = async () => {
    try {
      const { data } = await API.get('/er/active');
      
      // Frontend Sorting: Red (Critical) > Yellow (Urgent) > Green (Stable)
      const severityScore = { 'Red': 3, 'Yellow': 2, 'Green': 1 };
      
      const sorted = data.sort((a, b) => {
        // 1. Sort by Severity (High to Low)
        const diff = severityScore[b.triageLevel] - severityScore[a.triageLevel];
        if (diff !== 0) return diff;
        // 2. Sort by Wait Time (Oldest First)
        return new Date(a.createdAt) - new Date(b.createdAt);
      });

      setPatients(sorted);
      setStats({
        critical: sorted.filter(p => p.triageLevel === 'Red').length,
        waiting: sorted.filter(p => p.status === 'Waiting').length
      });
    } catch (err) {
      console.error("ER Load Error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchERData();
    // Optional: Auto-refresh every 30 seconds
    const interval = setInterval(fetchERData, 30000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (id, newStatus) => {
    try {
      await API.put(`/er/${id}/status`, { status: newStatus });
      fetchERData(); // Refresh UI immediately
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const getSeverityStyles = (level) => {
    switch(level) {
      case 'Red': return 'bg-red-50 border-red-200 text-red-700 animate-pulse-slow'; // Critical
      case 'Yellow': return 'bg-yellow-50 border-yellow-200 text-yellow-700'; // Urgent
      case 'Green': return 'bg-green-50 border-green-200 text-green-700'; // Stable
      default: return 'bg-gray-50 border-gray-200 text-gray-600';
    }
  };

  if (loading) return <div className="p-10 text-center text-xl font-bold animate-pulse">Loading Triage Board...</div>;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Siren className="w-8 h-8 text-red-600 animate-bounce" /> Emergency Room (ER)
          </h1>
          <p className="text-gray-500 mt-1">Real-time Triage Board. Prioritize <span className="text-red-600 font-bold">RED</span> cases.</p>
        </div>
        
        {/* Live Stats */}
        <div className="flex gap-4">
          <div className="bg-red-600 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-3">
            <Activity className="w-6 h-6" />
            <div>
              <p className="text-xs font-bold uppercase opacity-80">Critical</p>
              <p className="text-2xl font-bold">{stats.critical}</p>
            </div>
          </div>
          <div className="bg-white border border-gray-200 px-5 py-3 rounded-xl shadow-sm flex items-center gap-3">
            <Clock className="w-6 h-6 text-gray-500" />
            <div>
              <p className="text-xs font-bold uppercase text-gray-400">Waiting</p>
              <p className="text-2xl font-bold text-gray-800">{stats.waiting}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Triage Board */}
      <div className="grid gap-4">
        {patients.length === 0 ? (
          <div className="p-12 text-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-700">All Clear</h3>
            <p className="text-gray-500">No active patients in the ER queue.</p>
          </div>
        ) : (
          patients.map((p) => (
            <div key={p._id} className={`p-5 rounded-xl border-l-8 shadow-sm transition-all flex flex-col md:flex-row items-center justify-between gap-6 ${getSeverityStyles(p.triageLevel).replace('bg-', 'hover:bg-opacity-80 ')} border-l-${p.triageLevel === 'Red' ? 'red' : p.triageLevel === 'Yellow' ? 'yellow' : 'green'}-500 bg-white`}>
              
              {/* Left: Patient Info */}
              <div className="flex items-center gap-5 w-full md:w-auto">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl shadow-inner ${
                  p.triageLevel === 'Red' ? 'bg-red-100 text-red-600' :
                  p.triageLevel === 'Yellow' ? 'bg-yellow-100 text-yellow-600' :
                  'bg-green-100 text-green-600'
                }`}>
                  {p.triageLevel.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    {p.patientName}
                    {p.triageLevel === 'Red' && <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">Critical</span>}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                    <span className="flex items-center gap-1"><User className="w-4 h-4" /> Age: {p.age || 'N/A'}</span>
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> Arrived: {new Date(p.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-gray-800 bg-gray-50 px-2 py-1 rounded inline-block">
                    Chief Complaint: {p.chiefComplaint}
                  </p>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                {p.status === 'Waiting' ? (
                  <button 
                    onClick={() => updateStatus(p._id, 'In Treatment')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-md transition flex items-center gap-2"
                  >
                    <Stethoscope className="w-5 h-5" /> Start Treatment
                  </button>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="text-blue-600 font-bold bg-blue-50 px-3 py-1 rounded-full text-sm border border-blue-100 flex items-center gap-1">
                      <Activity className="w-4 h-4 animate-spin-slow" /> Treating...
                    </span>
                    <button 
                      onClick={() => updateStatus(p._id, 'Discharged')}
                      className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-semibold text-sm transition"
                    >
                      Discharge
                    </button>
                    <button 
                      onClick={() => updateStatus(p._id, 'Admitted')}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold text-sm shadow-sm transition flex items-center gap-1"
                    >
                      Admit <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  );
}