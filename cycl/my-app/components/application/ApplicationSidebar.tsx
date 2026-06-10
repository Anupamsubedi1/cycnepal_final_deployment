"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

interface ApplicationSidebarProps {
  userName: string;
  email: string;
  onLogout: () => void;
}

export default function ApplicationSidebar({
  userName,
  email,
  onLogout,
}: ApplicationSidebarProps) {
  const params = useParams();

  const menuItems = [
    {
      label: "ड्यासबोर्ड",
      href: `/${params.locale}/dashboard`,
      icon: "🏠",
    },
    {
      label: "मेरो आवेदनहरू",
      href: `/${params.locale}/dashboard/applications`,
      icon: "📋",
    },
    {
      label: "रिक्तिहरू",
      href: `/${params.locale}/vacancies`,
      icon: "💼",
    },
    {
      label: "प्रोफाइल",
      href: `/${params.locale}/dashboard/profile`,
      icon: "👤",
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-[#d6e6ed] min-h-screen flex flex-col">
      {/* Logo / Header */}
      <div className="bg-[#0d837f] text-white p-6">
        <h2 className="text-xl font-bold">उम्मेदवार खण्ड</h2>
      </div>

      {/* User Info */}
      <div className="p-6 border-b border-[#d6e6ed]">
        <p className="font-semibold text-gray-800 truncate">{userName}</p>
        <p className="text-sm text-gray-600 truncate">{email}</p>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-6 space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="flex items-center gap-3 px-4 py-3 rounded text-gray-700 hover:bg-[#f0f8f7] hover:text-[#0d837f] transition-colors"
          >
            <span className="text-lg">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-6 border-t border-[#d6e6ed]">
        <button
          onClick={onLogout}
          className="w-full px-4 py-2 bg-[#0d837f] text-white rounded font-medium hover:bg-[#08716e] transition-colors"
        >
          लगआउट
        </button>
      </div>
    </aside>
  );
}
