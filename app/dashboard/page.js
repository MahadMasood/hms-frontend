"use client";
import { useAuth } from '../../context/AuthContext';
import PatientDashboard from '@/pages/patient/homePage';
import DoctorDashboard from '@/pages/doctor/homePage';
import AdminDashboard from '@/pages/admin/AdminDashbord';

export default function Dashboard() {
  const { user } = useAuth();

  // Role-Based Rendering
  if (user.role === "patient") {
    return <PatientDashboard />;
  }
  if (user.role === "doctor") {
    return <DoctorDashboard />;
  }
  if (user.role === "admin") {
    return <AdminDashboard />;
  }
  
  return <div>Unknown Role</div>;
}