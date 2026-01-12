"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Users,
  Calendar,
  Package,
  AlertCircle,
  UserPlus,
  Activity,
  FileText,
  LogOut,
  X,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext"; // <--- IMPORT CONTEXT

export default function Sidebar({ isMobileOpen, setIsMobileOpen }) {
  const pathname = usePathname();
  const { user, logout } = useAuth(); // <--- GET DATA FROM CONTEXT

  // Default to 'patient' if user is loading or undefined
  const role = user?.role;

  const menus = {
    admin: [
      { name: "Overview", href: "/dashboard", icon: Home },
      { name: "Patients", href: "/dashboard/patients", icon: UserPlus },
      { name: "Appointments", href: "/dashboard/appointments", icon: Calendar },
      { name: "Pharmacy", href: "/dashboard/inventory", icon: Package },
      { name: "Emergency", href: "/dashboard/er", icon: AlertCircle },
      { name: "HR & Staff", href: "/dashboard/hr", icon: Users },
      { name: "Admissions ", href: "/dashboard/admissions", icon: Activity },
      { name: "Management", href: "/dashboard/management", icon: FileText },
    ],
    doctor: [
      { name: "My Dashboard", href: "/dashboard", icon: Home },
      { name: "Appointments", href: "/dashboard/appointments", icon: Calendar },
      { name: "My Patients", href: "/dashboard/patients", icon: Users },
      { name: "Medical Records", href: "/dashboard/records", icon: FileText },
      {
        name: "Prescriptions",
        href: "/dashboard/prescriptions",
        icon: Package,
      },
      { name: "Emergency Cases", href: "/dashboard/er", icon: AlertCircle },
      { name: 'inventory', href: '/dashboard/inventory', icon: Activity },
    ],
    patient: [
      { name: "Home", href: "/dashboard", icon: Home },
      {
        name: "Book Appointment",
        href: "/dashboard/appointments",
        icon: Calendar,
      },
      // { name: 'My Records', href: '/dashboard/records', icon: FileText },
      { name: "Prescription", href: "/dashboard/prescriptions", icon: Package },
      { name: "Billing", href: "/dashboard/billing", icon: Activity },
      { name: "Feedback", href: "/dashboard/feedback", icon: AlertCircle },
    ],
  };

  const currentMenu = menus[role] || menus["patient"];

  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white w-72 z-50 transition-transform duration-300 ease-in-out ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 shadow-2xl`}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">MediCare</h2>
              <span className="text-xs text-blue-400 font-semibold uppercase tracking-wider">
                {role}
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto h-[calc(100vh-180px)]">
          <ul className="space-y-2">
            {currentMenu.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <li key={item.name}>
                  <Link href={item.href} onClick={() => setIsMobileOpen(false)}>
                    <div
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                        isActive
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg"
                          : "hover:bg-gray-700 hover:translate-x-1"
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 ${
                          isActive
                            ? "text-white"
                            : "text-gray-400 group-hover:text-white"
                        }`}
                      />
                      <span className="font-medium">{item.name}</span>
                      {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-red-600 bg-opacity-20 hover:bg-opacity-30 border border-red-500 border-opacity-30 transition-all text-red-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
