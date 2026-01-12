import React from 'react';
import { ChevronDown } from 'lucide-react';
import { useServerStore } from '../store/serverStore';

export default function ServerSwitcher() {
  const { servers, selectedServer, setSelectedServer } = useServerStore();

  if (!servers || servers.length === 0) return null;

  return (
    <div className="bg-brand.card border border-brand.border rounded-xl p-4">
      <label className="text-sm text-slate-400 block mb-2">Switch Server</label>
      <div className="relative">
        <select
          value={selectedServer?.id || ''}
          onChange={(e) => {
            const server = servers.find(s => s.id === parseInt(e.target.value));
            if (server) setSelectedServer(server);
          }}
          className="w-full bg-brand.darker border border-brand.border rounded-lg p-3 text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent pr-10"
        >
          {servers.map((server) => (
            <option key={server.id} value={server.id}>
              {server.name} - {server.status === 'online' ? '🟢' : '🔴'}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-slate-400" size={18} />
      </div>
    </div>
  );
}
