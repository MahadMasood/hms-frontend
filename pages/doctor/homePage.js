"use client";
import { useEffect, useState } from "react";
import API from "@/utils/api";
import { useAuth } from "@/context/AuthContext";

import {
  Calendar,
  Users,
  Clock,
  FileText,
  CheckCircle,
  Activity,
  ChevronRight,
  Stethoscope,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

export default function DashboardHome() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);

  // Data State
  const [stats, setStats] = useState({ today: 0, pending: 0, total: 0 });
  const [appointments, setAppointments] = useState([]);
  const [nextPatient, setNextPatient] = useState(null);

  useEffect(() => {
    if (authLoading || !user) return;

    const fetchDoctorData = async () => {
      try {
        // Backend already filters by doctor - just fetch all
        const { data } = await API.get("/appointments");

        console.log("--- DEBUGGING ---");
        console.log("Logged in User:", user.name, "Role:", user.role);
        console.log("Total Appointments from API:", data.length);

        // The backend already filtered by doctor profile
        // Now we just need to filter by TODAY
        const todaysAppts = data.filter((a) => {
          const apptDate = new Date(a.date).toDateString();
          const todayDate = new Date().toDateString();
          return apptDate === todayDate;
        });

        console.log("Today's Appointments:", todaysAppts.length);
        console.log("-----------------");

        // Sort by time slot
        todaysAppts.sort((a, b) => a.slot.localeCompare(b.slot));
        
        // Calculate stats
        const pending = todaysAppts.filter(a => a.status !== "Completed").length;
        const nextAppt = todaysAppts.find(a => a.status !== "Completed");

        setAppointments(todaysAppts);
        setStats({
          today: todaysAppts.length,
          pending: pending,
          total: data.length
        });
        setNextPatient(nextAppt || null);

      } catch (err) {
        console.error("Doctor dashboard error:", err);
        console.error("Error details:", err.response?.data);
      } finally {
        setLoading(false);
      }
    };

    if (user.role === "doctor") fetchDoctorData();
    else setLoading(false);
  }, [user, authLoading]);

  if (loading || authLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // --- DOCTOR VIEW ---
  if (user?.role === "doctor") {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Dr. {user.name.split(" ")[0]}'s Workspace
            </h1>
            <p className="text-gray-500">
              You have{" "}
              <span className="font-bold text-blue-600">
                {stats.pending} patients
              </span>{" "}
              remaining today.
            </p>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-2xl font-bold text-gray-900">
              {new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            <p className="text-gray-500 text-sm">
              {new Date().toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Top Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Appointments Today"
            value={stats.today}
            icon={Calendar}
            color="blue"
          />
          <StatCard
            title="Pending Patients"
            value={stats.pending}
            icon={Clock}
            color="orange"
          />
          <StatCard
            title="Total Patients"
            value={stats.total}
            icon={Users}
            color="purple"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT: SCHEDULE LIST (2/3 Width) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                <h2 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-500" /> Today's
                  Schedule
                </h2>
                <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                  {appointments.length} Visits
                </span>
              </div>

              <div className="divide-y divide-gray-50">
                {appointments.length === 0 ? (
                  <div className="p-10 text-center text-gray-400">
                    No appointments scheduled for today.
                  </div>
                ) : (
                  appointments.map((appt) => (
                    <div
                      key={appt._id}
                      className="p-4 hover:bg-gray-50 transition flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-16 py-2 rounded-lg text-center border ${
                            appt.status === "Completed"
                              ? "bg-gray-50 border-gray-100 text-gray-400"
                              : appt._id === nextPatient?._id
                              ? "bg-blue-600 border-blue-600 text-white shadow-md"
                              : "bg-blue-50 border-blue-100 text-blue-600"
                          }`}
                        >
                          <span className="block text-sm font-bold">
                            {appt.slot.split(" ")[0]}
                          </span>
                          <span className="block text-[10px] uppercase">
                            {appt.slot.split(" ")[1]}
                          </span>
                        </div>

                        <div>
                          <h3
                            className={`font-bold ${
                              appt.status === "Completed"
                                ? "text-gray-500"
                                : "text-gray-900"
                            }`}
                          >
                            {appt.patientName}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                            <span className="flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> General
                              Checkup
                            </span>
                            {appt.patientPhone && (
                              <span>• {appt.patientPhone}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {appt.status === "Completed" ? (
                          <span className="flex items-center gap-1 text-green-600 text-sm font-medium px-3 py-1 bg-green-50 rounded-lg">
                            <CheckCircle className="w-4 h-4" /> Done
                          </span>
                        ) : (
                          <>
                            <Link
                              href={`/dashboard/prescriptions?patient=${appt.patientName}`}
                              className="hidden md:flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-50 transition"
                            >
                              <FileText className="w-4 h-4" /> History
                            </Link>
                            <Link
                              href="/dashboard/prescriptions"
                              className="flex items-center gap-2 bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-800 transition shadow-sm"
                            >
                              <Stethoscope className="w-4 h-4" /> Prescribe
                            </Link>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: NEXT PATIENT & QUICK ACTIONS (1/3 Width) */}
          <div className="space-y-6">
            {nextPatient ? (
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-4">
                  Up Next
                </p>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-xl font-bold backdrop-blur-sm">
                    {nextPatient.patientName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">
                      {nextPatient.patientName}
                    </h3>
                    <p className="text-blue-100 flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4" /> {nextPatient.slot}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button className="bg-white text-blue-700 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-50 transition shadow-lg">
                    Start Visit
                  </button>
                  <button className="bg-blue-500/30 text-white py-2.5 rounded-xl font-medium text-sm hover:bg-blue-500/40 transition backdrop-blur-md border border-white/10">
                    Skip
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-100 rounded-2xl p-6 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <h3 className="text-green-800 font-bold">All Caught Up!</h3>
                <p className="text-green-600 text-sm">
                  No pending patients for now.
                </p>
              </div>
            )}

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wide">
                Quick Actions
              </h3>
              <div className="space-y-2">
                <QuickActionLink
                  href="/dashboard/prescriptions"
                  icon={FileText}
                  label="Write Prescription"
                  color="blue"
                />
                <QuickActionLink
                  href="/dashboard/records"
                  icon={Activity}
                  label="Lab Reports"
                  color="purple"
                />
                <QuickActionLink
                  href="/dashboard/appointments"
                  icon={Calendar}
                  label="Full Calendar"
                  color="green"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <div>Access Denied or Loading...</div>;
}

// --- HELPER COMPONENTS ---

function StatCard({ title, value, icon: Icon, color }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
  };

  return (
    <div
      className={`p-5 rounded-2xl border ${colors[color]} flex items-center gap-4`}
    >
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center bg-white shadow-sm`}
      >
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm font-medium opacity-70">{title}</p>
        <p className="text-3xl font-bold">{value}</p>
      </div>
    </div>
  );
}

function QuickActionLink({ href, icon: Icon, label, color }) {
  const bgColors = {
    blue: "bg-blue-100 text-blue-600",
    purple: "bg-purple-100 text-purple-600",
    green: "bg-green-100 text-green-600",
  };

  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition group"
    >
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center ${bgColors[color]}`}
      >
        <Icon className="w-4 h-4" />
      </div>
      <span className="font-medium text-gray-700 group-hover:text-gray-900">
        {label}
      </span>
      <ChevronRight className="w-4 h-4 text-gray-300 ml-auto group-hover:text-gray-500" />
    </Link>
  );
}