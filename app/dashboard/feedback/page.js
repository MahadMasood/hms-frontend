"use client";
import { useAuth } from '../../../context/AuthContext';
import PatientFeedback from '@/pages/patient/feedbackPage';
import AdminFeedback from '@/pages/admin/feedbackPage';

export default function FeedbackPage() {
  const { user } = useAuth();

  if (user.role === "patient") {
    return <PatientFeedback />;
  }
  if (user.role === "admin") {
    return <AdminFeedback />;
  }
  if (user.role === "doctor") {
    return <div className="p-10 text-center text-xl">Feedback access for doctors coming soon...</div>;
  }
  
  return <div>Unknown Role</div>;
}