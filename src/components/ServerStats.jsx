import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Cpu, HardDrive } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ServerStats = ({ serverId }) => {
  const [stats, setStats] = useState({ cpu: '0', ram: 0, ramLimit: 0 });
  const { token } = useAuth();

  useEffect(() => {
    const socket = io('http://localhost:3002', {
      auth: { token },
      query: { serverId }
    });

    socket.on('server-stats', (data) => {
      setStats(data);
    });

    socket.on('connect_error', (error) => {
      console.error('Stats connection error:', error);
    });

    return () => socket.disconnect();
  }, [serverId, token]);

  // Helper to format bytes to GB
  const formatBytes = (bytes) => (bytes / 1024 / 1024 / 1024).toFixed(2);

  // Calculate RAM Width for the progress bar
  const ramPercent = stats.ramLimit > 0 ? (stats.ram / stats.ramLimit) * 100 : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
      
      {/* CPU Card */}
      <div className="bg-gray-800 p-5 rounded-xl border border-gray-700 relative overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center text-gray-400">
            <Cpu size={18} className="mr-2" />
            <span className="font-semibold uppercase text-sm">CPU Load</span>
          </div>
          <span className="text-2xl font-mono text-white">{stats.cpu}%</span>
        </div>
        {/* Simple Graph Bar */}
        <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 transition-all duration-500 ease-out"
            style={{ width: `${Math.min(parseFloat(stats.cpu), 100)}%` }}
          />
        </div>
      </div>

      {/* RAM Card */}
      <div className="bg-gray-800 p-5 rounded-xl border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center text-gray-400">
            <HardDrive size={18} className="mr-2" />
            <span className="font-semibold uppercase text-sm">Memory</span>
          </div>
          <div className="text-right">
            <span className="text-2xl font-mono text-white">{formatBytes(stats.ram)}</span>
            <span className="text-gray-500 text-sm font-mono ml-1">/ {formatBytes(stats.ramLimit)} GB</span>
          </div>
        </div>
        {/* RAM Progress Bar */}
        <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ease-out ${ramPercent > 90 ? 'bg-red-500' : 'bg-purple-500'}`}
            style={{ width: `${ramPercent}%` }}
          />
        </div>
      </div>

    </div>
  );
};

export default ServerStats;
