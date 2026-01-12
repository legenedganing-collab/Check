import React from 'react';
import { Bell, User } from 'lucide-react';

export default function Topbar() {
  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-brand.border bg-transparent">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-bold">Dashboard</h1>
      </div>
      <div className="flex items-center gap-3">
        <button className="p-2 rounded-lg bg-brand.card/40 hover:bg-brand.card text-slate-300">
          <Bell size={18} />
        </button>
        <button className="flex items-center gap-2 p-2 rounded-lg bg-brand.card/40 text-slate-300">
          <User size={16} />
          <span className="text-sm">You</span>
        </button>
      </div>
    </header>
  );
}
