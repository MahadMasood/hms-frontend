"use client";
import { useAuth } from '../../../context/AuthContext';
import PatientPrescriptions from '@/pages/patient/prescriptionPage';
import DoctorPrescriptions from '@/pages/doctor/prescriptionPage';

export default function PrescriptionsPage() {
  const { user } = useAuth();

  if (user.role === "patient") {
    return <PatientPrescriptions />;
  }
  if (user.role === "doctor") {
    return <DoctorPrescriptions />;
  }
  if (user.role === "admin") {
    return <div className="p-10 text-center text-xl">Prescription access for admins coming soon...</div>;
  }
  
  return <div>Unknown Role</div>;
}