import React from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

const DashboardLayout = ({ children }) => {
  return (
    <div className="flex h-screen bg-brand.darker text-slate-100 font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 bg-brand.darker/50">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
