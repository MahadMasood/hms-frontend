"use client";
import { useEffect, useState } from 'react';
import API from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import { Calendar, FileText, Clock, Plus, ChevronRight, Activity, Pill } from 'lucide-react';
import Link from 'next/link';

export default function PatientDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;

    const fetchData = async () => {
      try {
        const [apptsRes, rxRes] = await Promise.all([
          API.get('/appointments'), 
          API.get('/records/prescriptions/my')
        ]);

        // Filter appointments for this user & sort by date
        // (Assuming backend returns all, we filter here. ideally backend filters)
        const myAppts = apptsRes.data.filter(a => a.patientName === user.name);
        const upcoming = myAppts
          .filter(a => new Date(a.date) >= new Date().setHours(0,0,0,0))
          .sort((a, b) => new Date(a.date) - new Date(b.date));

        setAppointments(upcoming);
        setPrescriptions(rxRes.data.slice(0, 3)); // Get recent 3
      } catch (err) {
        console.error("Error loading patient data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, authLoading]);

  if (loading || authLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const nextAppt = appointments[0];

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hello, {user?.name.split(' ')[0]} 👋</h1>
          <p className="text-gray-500">Welcome to your health portal.</p>
        </div>
        <Link 
          href="/dashboard/appointments" 
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-xl font-semibold shadow-lg hover:bg-blue-700 transition transform hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5" />
          Book Appointment
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN (Main Stats) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* 1. Next Appointment Card (Hero) */}
          {nextAppt ? (
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
              
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium mb-3">
                    <Clock className="w-3 h-3" /> Upcoming Visit
                  </div>
                  <h2 className="text-3xl font-bold mb-1">{nextAppt.slot}</h2>
                  <p className="text-blue-100 text-lg mb-4">
                    {new Date(nextAppt.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                  </p>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold">
                      Dr
                    </div>
                    <div>
                      <p className="font-semibold">Dr. {nextAppt.doctor?.name || 'Specialist'}</p>
                      <p className="text-xs text-blue-200">General Consultation</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10 min-w-[140px] text-center">
                   <p className="text-xs text-blue-200 uppercase tracking-wider mb-1">Status</p>
                   <p className="font-bold text-lg">Confirmed</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 border-2 border-dashed border-blue-200 rounded-3xl p-8 text-center">
              <Calendar className="w-12 h-12 text-blue-300 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900">No Upcoming Visits</h3>
              <p className="text-gray-500 mb-4">You are all caught up! Feel free to book a checkup.</p>
              <Link href="/dashboard/appointments" className="text-blue-600 font-medium hover:underline">Book Now</Link>
            </div>
          )}

          {/* 2. Recent Prescriptions List */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Recent Prescriptions</h3>
              <Link href="/dashboard/records" className="text-sm text-blue-600 hover:underline">See All</Link>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {prescriptions.length === 0 ? (
                <div className="p-6 text-center text-gray-400">No prescriptions found.</div>
              ) : (
                prescriptions.map((rx, i) => (
                  <div key={i} className="p-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition flex items-center gap-4">
                    <div className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
                      <Pill className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">Dr. {rx.doctor?.name}</h4>
                      <p className="text-xs text-gray-500">
                        {new Date(rx.createdAt).toLocaleDateString()} • {rx.medicines.length} Medicines
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300" />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (Quick Vitals/Info) */}
        <div className="space-y-6">
          
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-purple-50 p-5 rounded-2xl">
              <Activity className="w-6 h-6 text-purple-600 mb-2" />
              <p className="text-2xl font-bold text-gray-900">120/80</p>
              <p className="text-xs text-purple-400 font-medium">Last BP (Avg)</p>
            </div>
            <div className="bg-red-50 p-5 rounded-2xl">
              <Calendar className="w-6 h-6 text-red-600 mb-2" />
              <p className="text-2xl font-bold text-gray-900">{appointments.length}</p>
              <p className="text-xs text-red-400 font-medium">Total Visits</p>
            </div>
          </div>

          {/* Help Card */}
          <div className="bg-gray-900 text-white p-6 rounded-2xl relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="font-bold text-lg mb-2">Need Help?</h3>
              <p className="text-gray-400 text-sm mb-4">
                Call our emergency hotline for immediate assistance.
              </p>
              <button className="w-full bg-white text-gray-900 py-2 rounded-lg text-sm font-bold hover:bg-gray-100 transition">
                Call 1122
              </button>
            </div>
            {/* Decoration */}
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-gray-700 rounded-full opacity-50 blur-2xl"></div>
          </div>

        </div>
      </div>
    </div>
  );
}