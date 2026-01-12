import React from 'react';

export default function ServerCard({ name, ip, status = 'offline', ram = 2 }) {
  return (
    <div className="bg-brand.card border border-brand.border rounded-2xl p-5 hover:border-accent/50 transition-all cursor-pointer group">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold group-hover:text-accent transition-colors">{name}</h3>
          <p className="text-sm text-slate-500 font-mono">{ip}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
          status === 'online' ? 'bg-status.online/10 text-status.online' : 'bg-status.offline/10 text-status.offline'
        }`}>
          {status}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span>Memory Usage</span>
          <span>{ram} GB</span>
        </div>
        <div className="w-full bg-brand.darkest h-1.5 rounded-full overflow-hidden">
          <div className="bg-accent h-full w-[45%]" />
        </div>
      </div>
    </div>
  );
}
