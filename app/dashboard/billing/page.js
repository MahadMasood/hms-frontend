"use client";
import { useAuth } from '../../../context/AuthContext';
import PatientBilling from '@/pages/patient/billingPage_new';
import AdminBilling from '@/pages/admin/billingPage';

export default function BillingPage() {
  const { user } = useAuth();

  if (user.role === "patient") {
    return <PatientBilling />;
  }
  if (user.role === "admin") {
    return <AdminBilling />;
  }
  if (user.role === "doctor") {
    return <div className="p-10 text-center text-xl">Billing access for doctors coming soon...</div>;
  }
  
  return <div>Unknown Role</div>;
}
               