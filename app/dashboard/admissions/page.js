"use client";
import { useEffect, useState } from 'react';
import API from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import { BedDouble, UserPlus, LogOut, Activity, User, CheckCircle, X } from 'lucide-react';

export default function AdmissionsPage() {
  const { user } = useAuth();
  const [beds, setBeds] = useState([]);
  const [activeAdmissions, setActiveAdmissions] = useState({}); // Maps BedID -> AdmissionObj
  const [patients, setPatients] = useState([]); // For Admit Dropdown
  const [loading, setLoading] = useState(true);

  // Modal State
  const [selectedBed, setSelectedBed] = useState(null);
  const [admitForm, setAdmitForm] = useState({ patientId: '', reason: '' });

  // --- FETCH DATA ---
  const loadData = async () => {
    try {
      const [bedsRes, admissionsRes, patientsRes] = await Promise.all([
        API.get('/inpatient/beds'),
        API.get('/inpatient/admissions/active'),
        API.get('/auth/patients') // Reusing your existing patients route
      ]);

      setBeds(bedsRes.data);
      setPatients(patientsRes.data);

      // Create a Map: { 'bed_id_123': admission_object }
      // This lets us quickly find the Admission ID for any Occupied Bed
      const map = {};
      admissionsRes.data.forEach(adm => {
        map[adm.bed] = adm;
      });
      setActiveAdmissions(map);

    } catch (err) {
      console.error("Failed to load ward data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- ACTIONS ---

  const handleAdmit = async (e) => {
    e.preventDefault();
    if (!admitForm.patientId) return alert("Select a patient");

    try {
      await API.post('/inpatient/admit', {
        bedId: selectedBed._id,
        patientId: admitForm.patientId,
        doctorId: user._id, // Auto-assign logged in doctor
        reason: admitForm.reason
      });
      
      alert('✅ Patient Admitted!');
      setSelectedBed(null);
      setAdmitForm({ patientId: '', reason: '' });
      loadData(); // Refresh grid
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDischarge = async (bedId) => {
    const admission = activeAdmissions[bedId];
    if (!admission) return alert("Error: No active admission found for this bed.");

    if (!confirm(`Discharge patient ${admission.patient?.name}?`)) return;

    try {
      // Calls your existing PUT /discharge/:id route
      await API.put(`/inpatient/discharge/${admission._id}`);
      alert('✅ Patient Discharged! Bed is now Cleaning.');
      loadData();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  // --- HELPERS ---
  // Group Beds by Ward Name
  const bedsByWard = beds.reduce((acc, bed) => {
    const ward = bed.wardName || 'General';
    if (!acc[ward]) acc[ward] = [];
    acc[ward].push(bed);
    return acc;
  }, {});

  if (loading) return <div className="p-10 text-center">Loading Wards...</div>;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Inpatient Admissions</h1>
        <p className="text-gray-500">Manage ward occupancy and patient stay.</p>
      </div>

      {/* WARDS GRID */}
      {Object.keys(bedsByWard).map((ward) => (
        <div key={ward} className="mb-10">
          <h2 className="text-xl font-bold text-gray-800 mb-4 px-2 border-l-4 border-blue-600">
            {ward} <span className="text-sm font-normal text-gray-500">({bedsByWard[ward].length} Beds)</span>
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {bedsByWard[ward].map((bed) => {
              const admission = activeAdmissions[bed._id];
              const isOccupied = bed.status === 'Occupied';
              
              return (
                <div 
                  key={bed._id} 
                  className={`relative p-5 rounded-2xl border-2 transition-all shadow-sm ${
                    bed.status === 'Available' ? 'border-green-100 bg-green-50 hover:border-green-300 cursor-pointer' :
                    bed.status === 'Occupied' ? 'border-red-100 bg-white' :
                    'border-orange-100 bg-orange-50 opacity-80'
                  }`}
                  onClick={() => bed.status === 'Available' && setSelectedBed(bed)}
                >
                  {/* Status Badge */}
                  <div className={`absolute top-3 right-3 w-3 h-3 rounded-full ${
                    bed.status === 'Available' ? 'bg-green-500 animate-pulse' :
                    bed.status === 'Occupied' ? 'bg-red-500' : 'bg-orange-500'
                  }`}></div>

                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-3 rounded-xl ${
                      isOccupied ? 'bg-red-100 text-red-600' : 
                      bed.status === 'Available' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
                    }`}>
                      <BedDouble className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{bed.bedNumber}</h3>
                      <p className="text-xs font-bold uppercase text-gray-500">{bed.type}</p>
                    </div>
                  </div>

                  {/* Patient Info or "Empty" State */}
                  {isOccupied && admission ? (
                    <div className="bg-gray-50 p-3 rounded-lg mb-3">
                      <p className="text-sm font-bold text-gray-800 flex items-center gap-2">
                        <User className="w-3 h-3" /> {admission.patient?.name || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Reason: {admission.reason}</p>
                    </div>
                  ) : (
                    <div className="h-14 flex items-center text-sm text-gray-400 font-medium">
                      {bed.status === 'Cleaning' ? 'Housekeeping...' : 'Ready for patient'}
                    </div>
                  )}

                  {/* Action Button */}
                  {isOccupied ? (
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDischarge(bed._id); }}
                      className="w-full py-2 bg-white border border-red-200 text-red-600 rounded-lg text-sm font-bold hover:bg-red-50 flex items-center justify-center gap-2"
                    >
                      <LogOut className="w-4 h-4" /> Discharge
                    </button>
                  ) : bed.status === 'Available' ? (
                    <button className="w-full py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 flex items-center justify-center gap-2">
                      <UserPlus className="w-4 h-4" /> Admit Patient
                    </button>
                  ) : (
                    <button disabled className="w-full py-2 bg-orange-200 text-orange-700 rounded-lg text-sm font-bold cursor-not-allowed">
                      Cleaning...
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* --- ADMIT PATIENT MODAL --- */}
      {selectedBed && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Admit to {selectedBed.bedNumber}</h3>
                <p className="text-sm text-gray-500">{selectedBed.wardName} • {selectedBed.type}</p>
              </div>
              <button onClick={() => setSelectedBed(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleAdmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Select Patient</label>
                <select 
                  className="w-full p-3 border rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  value={admitForm.patientId}
                  onChange={(e) => setAdmitForm({...admitForm, patientId: e.target.value})}
                  required
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map(p => (
                    <option key={p._id} value={p._id}>{p.name} ({p.email})</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Reason for Admission</label>
                <textarea 
                  className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  rows="3"
                  placeholder="e.g. Severe Dengue, Post-Surgery recovery..."
                  value={admitForm.reason}
                  onChange={(e) => setAdmitForm({...admitForm, reason: e.target.value})}
                  required
                ></textarea>
              </div>

              <button className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5" /> Confirm Admission
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}