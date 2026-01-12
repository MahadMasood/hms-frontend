"use client";
import { useEffect, useState } from 'react';
import API from '@/utils/api'; // Use your alias
import Link from 'next/link';
import { 
  Users, BedDouble, Pill, DollarSign, Wrench, 
  MessageSquare, Shield, Activity, AlertTriangle, 
  TrendingUp, Clock
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    staffCount: 0,
    bedOccupancy: 0,
    revenue: 0,
    lowStock: 0,
    pendingComplaints: 0,
    totalBeds: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        // Fetch data from all modules in parallel
        const [usersRes, bedsRes, inventoryRes, billingRes, feedbackRes] = await Promise.all([
          API.get('/auth/doctors').catch(() => ({ data: [] })), // Reuse doctor route or /users
          API.get('/inpatient/beds').catch(() => ({ data: [] })),
          API.get('/inventory').catch(() => ({ data: [] })),
          API.get('/records/invoices/all').catch(() => ({ data: [] })), // Assuming billing route is setup
          API.get('/feedback').catch(() => ({ data: [] }))
        ]);

        // 1. Calculate Revenue
        const totalRevenue = billingRes.data
          .filter(inv => inv.status === 'Paid')
          .reduce((acc, curr) => acc + curr.totalAmount, 0);

        // 2. Calculate Bed Occupancy
        const occupiedBeds = bedsRes.data.filter(b => b.status === 'Occupied').length;
        
        // 3. Count Low Stock Items
        const lowStockCount = inventoryRes.data.filter(i => i.quantity < 20).length;

        // 4. Count New Complaints
        const newComplaints = feedbackRes.data.filter(f => f.status === 'New').length;

        setStats({
          staffCount: usersRes.data.length || 0,
          bedOccupancy: occupiedBeds,
          totalBeds: bedsRes.data.length || 0,
          revenue: totalRevenue,
          lowStock: lowStockCount,
          pendingComplaints: newComplaints
        });

      } catch (err) {
        console.error("Dashboard Load Error", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center h-96">
      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* --- HEADER --- */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Hospital Administration</h1>
        <p className="text-gray-500 mt-1">System Overview & Control Panel</p>
      </div>

      {/* --- HIGH-LEVEL STATS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        
        {/* Revenue Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-500 uppercase">Total Revenue</p>
            <p className="text-2xl font-bold text-gray-900">${stats.revenue.toLocaleString()}</p>
          </div>
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Occupancy Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-500 uppercase">Occupancy</p>
            <p className="text-2xl font-bold text-gray-900">{stats.bedOccupancy} <span className="text-sm text-gray-400">/ {stats.totalBeds} Beds</span></p>
          </div>
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
            <BedDouble className="w-6 h-6" />
          </div>
        </div>

        {/* Alerts Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-500 uppercase">Active Alerts</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-red-600">{stats.lowStock + stats.pendingComplaints}</span>
              <span className="text-xs font-medium bg-red-100 text-red-700 px-2 py-1 rounded-full">Action Needed</span>
            </div>
          </div>
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Staff Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-500 uppercase">Medical Staff</p>
            <p className="text-2xl font-bold text-gray-900">{stats.staffCount}</p>
          </div>
          <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* --- MODULE GRID (The 7 Modules) --- */}
      <h2 className="text-xl font-bold text-gray-800 mb-6">Management Modules</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

        <ModuleCard 
          title="HR & Staffing" 
          desc="Onboard doctors, manage shifts." 
          icon={Users} 
          color="purple" 
          href="/dashboard/hr" 
        />
        
        <ModuleCard 
          title="Inpatient / Wards" 
          desc="Admissions & bed tracking." 
          icon={BedDouble} 
          color="blue" 
          href="/dashboard/admissions" // Points to page we created
        />

        <ModuleCard 
          title="Pharmacy Inventory" 
          desc="Track stock & expiry." 
          icon={Pill} 
          color="green" 
          href="/dashboard/inventory" // Points to page we created
        />

        <ModuleCard 
          title="Finance & Billing" 
          desc="Invoices & revenue reports." 
          icon={DollarSign} 
          color="emerald" 
          href="/dashboard/billing" // Points to page we created
        />

        <ModuleCard 
          title="QMS / Complaints" 
          desc="Patient feedback resolution." 
          icon={MessageSquare} 
          color="orange" 
          href="/dashboard/feedback" // Points to page we created
          alertCount={stats.pendingComplaints}
        />

        <ModuleCard 
          title="Facility Maintenance" 
          desc="Repairs & equipment tickets." 
          icon={Wrench} 
          color="gray" 
          href="/dashboard/maintenance" 
        />

        <ModuleCard 
          title="Auth & Security" 
          desc="User access & passwords." 
          icon={Shield} 
          color="indigo" 
          href="/dashboard/security" 
        />

      </div>
    </div>
  );
}

// --- HELPER COMPONENT ---
function ModuleCard({ title, desc, icon: Icon, color, href, alertCount }) {
  const colors = {
    purple: 'bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white',
    blue: 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white',
    green: 'bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white',
    emerald: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white',
    orange: 'bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white',
    gray: 'bg-gray-100 text-gray-600 group-hover:bg-gray-600 group-hover:text-white',
    indigo: 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white',
  };

  return (
    <Link href={href} className="group bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
      
      {/* Alert Badge */}
      {alertCount > 0 && (
        <div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm animate-pulse">
          {alertCount} New
        </div>
      )}

      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-colors ${colors[color]}`}>
        <Icon className="w-7 h-7" />
      </div>
      
      <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">{title}</h3>
      <p className="text-sm text-gray-500">{desc}</p>
    </Link>
  );
}