"use client";
import { useAuth } from '../../../context/AuthContext';
import DoctorInventory from '@/pages/doctor/inventoryPage';
import AdminInventory from '@/pages/admin/inventoryPage';
export default function InventoryPage() {
  const { user } = useAuth();

  if (user.role === "doctor") {
    return <DoctorInventory />;
  }
  if (user.role === "admin") {
    return <AdminInventory />;
  }
  
  return <div>Unknown Role</div>;
}