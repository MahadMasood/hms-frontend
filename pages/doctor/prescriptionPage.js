"use client";
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import API from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import { Plus, Trash2, Save, User, FileText, CheckCircle, Pill, Search, Download, Calendar, Clock } from 'lucide-react';

// Wrapper for Suspense (Next.js requirement for useSearchParams)
export default function PrescriptionsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PrescriptionContent />
    </Suspense>
  );
}

function PrescriptionContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // --- STATE FOR PATIENTS (View History) ---
  const [history, setHistory] = useState([]);

  // --- STATE FOR DOCTORS (Create Prescription) ---
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('patient') || '');
  const [medicines, setMedicines] = useState([
    { name: '', dosage: '500mg', frequency: '1-0-1', duration: '5 days' }
  ]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);

  // --- INITIAL LOAD ---
  useEffect(() => {
    if (authLoading || !user) return;

    const loadData = async () => {
      try {
        if (user.role === 'patient') {
          // 1. Patient: Load History
          const { data } = await API.get('/records/prescriptions/my');
          setHistory(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
        } 
        else if (user.role === 'doctor' || user.role === 'admin') {
          // 2. Doctor: Load Patient List for Dropdown
          const { data } = await API.get('/auth/patients');
          setPatients(data);
          
          // Auto-select if searching
          if (searchQuery) {
            const found = data.find(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
            if (found) setSelectedPatient(found._id);
          }
        }
      } catch (err) {
        console.error("Data load failed", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user, authLoading]);

  // --- DOCTOR ACTIONS ---
  
  const handleMedChange = (index, field, value) => {
    const updated = [...medicines];
    updated[index][field] = value;
    setMedicines(updated);
  };

  const addRow = () => {
    setMedicines([...medicines, { name: '', dosage: '', frequency: '', duration: '' }]);
  };

  const removeRow = (index) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPatient) return alert("Please select a patient");
    if (medicines.some(m => !m.name)) return alert("Please specify medicine names");

    try {
      setLoading(true);
      await API.post('/records/prescriptions', {
        patient: selectedPatient, // Must be ID
        doctor: user._id,
        medicines,
        notes
      });
      alert('✅ Prescription Sent!');
      router.push('/dashboard/appointments'); // Redirect back to schedule
    } catch (err) {
      alert('Failed: ' + (err.response?.data?.message || err.message));
      setLoading(false);
    }
  };


  if (authLoading || loading) return <div className="p-10 text-center">Loading...</div>;

  // ==========================================
  // VIEW 1: PATIENT (HISTORY LIST)
  // ==========================================
  if (user.role === 'patient') {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Prescriptions</h1>
          <p className="text-gray-500">Digital records from your doctor visits.</p>
        </div>

        <div className="space-y-6">
          {history.length === 0 ? (
             <div className="text-center py-10 bg-gray-50 rounded-xl border-dashed border-2">No prescriptions found.</div>
          ) : (
            history.map((rx) => (
              <div key={rx._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Dr. {rx.doctor?.name || 'Unknown'}</h3>
                      <p className="text-sm text-gray-500">{new Date(rx.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <button className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg">
                    <Download className="w-5 h-5" />
                  </button>
                </div>
                {/* Medicines */}
                <div className="p-6 grid gap-4 md:grid-cols-2">
                  {rx.medicines.map((m, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                      <Pill className="w-5 h-5 text-purple-500" />
                      <div>
                        <p className="font-bold">{m.name}</p>
                        <p className="text-xs text-gray-500">{m.dosage} • {m.frequency} • {m.duration}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: DOCTOR (CREATE FORM)
  // ==========================================
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Issue Prescription</h1>
        <p className="text-gray-500">Create a new digital record for your patient.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* 1. Patient Selector */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-500" /> Patient Details
          </h2>
          
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            <select
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              value={selectedPatient}
              onChange={(e) => setSelectedPatient(e.target.value)}
              required
            >
              <option value="">-- Select Patient --</option>
              {patients.map(p => (
                <option key={p._id} value={p._id}>{p.name} ({p.email})</option>
              ))}
            </select>
          </div>
          {searchQuery && !selectedPatient && (
             <p className="text-xs text-orange-500 mt-2">Could not auto-select patient "{searchQuery}". Please select manually.</p>
          )}
        </div>

        {/* 2. Medicine Grid */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Pill className="w-5 h-5 text-purple-500" /> Medicines
            </h2>
            <button 
              type="button" 
              onClick={addRow}
              className="text-sm font-semibold text-blue-600 hover:bg-blue-50 px-3 py-1 rounded-lg transition"
            >
              + Add Row
            </button>
          </div>

          <div className="space-y-3">
            {medicines.map((med, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="md:col-span-4">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Drug Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Panadol"
                    className="w-full p-2 rounded border focus:border-blue-500 outline-none"
                    value={med.name}
                    onChange={(e) => handleMedChange(index, 'name', e.target.value)}
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Dosage</label>
                  <input
                    type="text"
                    className="w-full p-2 rounded border focus:border-blue-500 outline-none"
                    value={med.dosage}
                    onChange={(e) => handleMedChange(index, 'dosage', e.target.value)}
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Frequency</label>
                  <input
                    type="text"
                    className="w-full p-2 rounded border focus:border-blue-500 outline-none"
                    value={med.frequency}
                    onChange={(e) => handleMedChange(index, 'frequency', e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Duration</label>
                  <input
                    type="text"
                    className="w-full p-2 rounded border focus:border-blue-500 outline-none"
                    value={med.duration}
                    onChange={(e) => handleMedChange(index, 'duration', e.target.value)}
                  />
                </div>
                <div className="md:col-span-1 flex justify-center">
                  {medicines.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => removeRow(index)}
                      className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Notes */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <label className="font-bold text-gray-800 mb-2 block">Doctor's Notes</label>
          <textarea
            rows="3"
            placeholder="Advice, precautions, etc..."
            className="w-full p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          ></textarea>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-4">
           <button 
             type="button" 
             onClick={() => router.back()}
             className="px-6 py-3 rounded-xl font-semibold text-gray-600 hover:bg-gray-100"
           >
             Cancel
           </button>
           <button 
             type="submit" 
             className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
           >
             <CheckCircle className="w-5 h-5" /> Save Prescription
           </button>
        </div>

      </form>
    </div>
  );
}