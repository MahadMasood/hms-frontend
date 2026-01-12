"use client";
import { useEffect, useState } from 'react';
import API from '@/utils/api';
import { useAuth } from '@/context/AuthContext'; // <--- Import Auth
import { Calendar, User, Clock, CheckCircle, Search, Phone } from 'lucide-react'; // <--- Added Phone Icon
import { useRouter } from 'next/navigation';

export default function BookAppointment() {
  const { user } = useAuth(); // <--- Get logged in user name
  const [doctors, setDoctors] = useState([]);
  const [filteredDocs, setFilteredDocs] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedDoc, setSelectedDoc] = useState(null);
  
  // Added patientPhone to state
  const [formData, setFormData] = useState({ 
    date: '', 
    slot: '', 
    patientPhone: '' 
  });
  
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    API.get('/doctors').then(res => {
      setDoctors(res.data);
      setFilteredDocs(res.data);
    });
  }, []);

  useEffect(() => {
    const results = doctors.filter(doc => 
      doc.name.toLowerCase().includes(search.toLowerCase()) || 
      doc.specialization.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredDocs(results);
  }, [search, doctors]);

  const handleBooking = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await API.post('/appointments', {
        doctorId: selectedDoc._id,
        date: formData.date,
        slot: formData.slot,
        // --- NEW FIELDS ADDED HERE ---
        patientName: user?.name,     // Send logged-in user's name
        patientPhone: formData.patientPhone // Send phone from input
      });
      
      alert('✅ Appointment Confirmed!');
      router.push('/dashboard');
    } catch (err) {
      alert('❌ Error: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Book an Appointment</h1>
        <p className="text-gray-600 mt-2">Find a specialist and schedule your visit.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT: Doctor Selection (Unchanged) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search by doctor name or specialization..." 
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDocs.map((doc) => (
              <div 
                key={doc._id}
                onClick={() => setSelectedDoc(doc)}
                className={`cursor-pointer p-5 rounded-xl border-2 transition-all duration-200 relative overflow-hidden group ${
                  selectedDoc?._id === doc._id 
                  ? 'border-blue-600 bg-blue-50 shadow-md' 
                  : 'border-transparent bg-white shadow-sm hover:border-blue-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {doc.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{doc.name}</h3>
                    <p className="text-blue-600 text-sm font-medium mb-1">{doc.specialization}</p>
                    <div className="flex items-center gap-1 text-gray-500 text-xs">
                      <Clock className="w-3 h-3" />
                      <span>Avail: {doc.availableSlots.length} slots</span>
                    </div>
                  </div>
                </div>
                {selectedDoc?._id === doc._id && (
                  <div className="absolute top-4 right-4 text-blue-600">
                    <CheckCircle className="w-6 h-6 fill-blue-100" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Booking Form */}
        <div>
          <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-24">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Appointment Details</h2>
            
            {!selectedDoc ? (
              <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                <User className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>Select a doctor from the list to proceed</p>
              </div>
            ) : (
              <form onSubmit={handleBooking} className="space-y-5">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 flex items-center gap-3">
                   <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center text-blue-700 font-bold">
                     {selectedDoc.name.charAt(0)}
                   </div>
                   <div>
                     <p className="text-xs text-blue-600 font-bold uppercase">Selected Doctor</p>
                     <p className="font-semibold text-gray-900 text-sm">{selectedDoc.name}</p>
                   </div>
                </div>

                {/* --- NEW: Phone Number Input --- */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                    <input 
                      type="tel" 
                      required
                      placeholder="0300-1234567"
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                      onChange={(e) => setFormData({...formData, patientPhone: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                    <input 
                      type="date" 
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Available Slots</label>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedDoc.availableSlots.map(slot => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setFormData({...formData, slot})}
                        className={`py-2 text-sm rounded-lg border transition-all ${
                          formData.slot === slot 
                          ? 'bg-blue-600 text-white border-blue-600' 
                          : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading || !formData.date || !formData.slot || !formData.patientPhone}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:transform-none"
                >
                  {loading ? 'Processing...' : 'Confirm Booking'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}