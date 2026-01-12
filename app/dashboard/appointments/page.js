"use client";
import { useEffect, useState } from 'react';
import API from '../../../utils/api';
import { useAuth } from '../../../context/AuthContext'; 
import PatientAppointments from '@/pages/patient/appointmentPage';
import DoctorAppointments from '@/pages/doctor/appointmentPage';
import AdminDashboard from '@/pages/admin/AppointmentPage';
export default function BookAppointment() {
   const { user } = useAuth();
  
    const role = user?.role;
  
    if(role === "patient") {
      return <PatientAppointments />;
    }
    if(role === "doctor") {
      return <DoctorAppointments />;
    }
    if(role === "admin") {
      return <AdminDashboard />;
    }
}