import React from 'react';
import { LayoutDashboard, Server, CreditCard, LifeBuoy, Settings, LogOut } from 'lucide-react';

const SidebarItem = ({ icon: Icon, label, active = false }) => (
  <div className={`flex items-center space-x-3 p-3 rounded-xl cursor-pointer transition-all ${
    active ? 'bg-accent text-white shadow-glow' : 'text-slate-400 hover:bg-brand.card hover:text-white'
  }`}>
    <Icon size={20} />
    <span className="font-semibold">{label}</span>
  </div>
);

export default function Sidebar() {
  return (
    <aside className="w-64 bg-brand.darker h-screen border-r border-brand.border p-4 flex flex-col">
      <div className="flex items-center space-x-2 px-2 mb-10">
        <div className="w-8 h-8 bg-accent rounded-lg" />
        <span className="text-xl font-bold tracking-tighter">LIGHTNODE</span>
      </div>

      <nav className="flex-1 space-y-2">
        <SidebarItem icon={LayoutDashboard} label="Dashboard" active />
        <SidebarItem icon={Server} label="My Servers" />
        <SidebarItem icon={CreditCard} label="Billing" />
        <SidebarItem icon={LifeBuoy} label="Support" />
      </nav>

      <div className="pt-4 border-t border-brand.border space-y-2">
        <SidebarItem icon={Settings} label="Settings" />
        <SidebarItem icon={LogOut} label="Sign Out" />
      </div>
    </aside>
  );
}
