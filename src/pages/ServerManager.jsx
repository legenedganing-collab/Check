/**
 * ServerManager Page
 * 
 * Complete server management interface
 * - Power controls (Start/Stop/Restart/Kill)
 * - Live console with xterm.js
 * - Server information display
 * - Resource usage stats
 * 
 * This is the "nerve center" of the Lighth platform
 * Similar to Pterodactyl, AWS, or DigitalOcean control panels
 */

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Cpu, HardDrive, Zap, Globe } from 'lucide-react';
import toast from 'react-hot-toast';
import ServerControls from '../components/ServerControls';
import ServerConsole from '../components/ServerConsole';
import ServerStats from '../components/ServerStats';

const ServerManager = () => {
  const { serverId } = useParams() || { serverId: '1' }; // Get from URL or use default
  const [server, setServer] = useState(null);
  const [status, setStatus] = useState('offline');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    cpu: 0,
    memory: '0 / 4 GB',
    disk: '0 MB',
    uptime: 0,
  });
  const [consoleConnected, setConsoleConnected] = useState(false);

  // Fetch server info on mount
  useEffect(() => {
    const fetchServerInfo = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(
          `${process.env.REACT_APP_API_URL || 'http://localhost:3002'}/api/servers/${serverId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch server info');
        }

        const data = await response.json();
        setServer(data.server);
        setStatus(data.server.status);
      } catch (error) {
        console.error('[ServerManager] Error fetching server:', error);
        toast.error('Failed to load server info');
      } finally {
        setLoading(false);
      }
    };

    fetchServerInfo();
  }, [serverId]);

  // Simulate live stats updates (in production, use WebSocket or polling)
  useEffect(() => {
    if (status !== 'online') return;

    const interval = setInterval(() => {
      setStats((prev) => ({
        cpu: Math.floor(Math.random() * 40) + 5, // 5-45%
        memory: `${(Math.random() * 2 + 1).toFixed(1)} / 4 GB`,
        disk: `${Math.floor(Math.random() * 500) + 100} MB`,
        uptime: prev.uptime + 1,
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, [status]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-700 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading server...</p>
        </div>
      </div>
    );
  }

  if (!server) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-red-900/20 border border-red-900 rounded-lg p-6 text-center">
          <p className="text-red-400">Server not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <header className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white">{server.name}</h1>
            <p className="text-gray-400 text-sm mt-1">
              Server ID: <span className="text-emerald-400 font-mono">{server.uuid}</span>
            </p>
          </div>
          <div className="text-right">
            <div className="inline-block">
              <div
                className={`w-3 h-3 rounded-full mb-2 ${
                  status === 'online'
                    ? 'bg-green-500 shadow-lg shadow-green-500/50 animate-pulse'
                    : status === 'offline'
                    ? 'bg-red-500 shadow-lg shadow-red-500/50'
                    : 'bg-yellow-500 shadow-lg shadow-yellow-500/50 animate-pulse'
                }`}
              />
              <p className="text-sm text-gray-400 capitalize">
                {status === 'provisioning' ? 'Starting up...' : status}
              </p>
            </div>
          </div>
        </div>

        {/* Server Connection Info */}
        <div className="flex items-center space-x-6 text-sm">
          <div className="flex items-center space-x-2 text-gray-300">
            <Globe size={16} className="text-blue-400" />
            <span className="font-mono">{server.ipAddress}:{server.port}</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-300">
            <HardDrive size={16} className="text-purple-400" />
            <span>{server.memory}GB RAM • {server.diskSpace}GB Storage</span>
          </div>
        </div>
      </header>

      {/* Power Controls */}
      <ServerControls
        serverId={serverId}
        currentStatus={status}
        onStatusChange={setStatus}
      />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Console - Takes 3 columns on large screens */}
        <div className="lg:col-span-3 space-y-4">
          <h2 className="text-xl font-semibold text-white">Live Console</h2>
          <div style={{ height: '500px' }}>
            <ServerConsole
              serverId={serverId}
              onConnectionChange={setConsoleConnected}
            />
          </div>
        </div>

        {/* Stats Sidebar - Takes 1 column */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Resources</h2>

          {/* Live Stats Component - Replaces all static cards */}
          <ServerStats
            serverId={serverId}
            onStatsUpdate={(newStats) => {
              console.log('[ServerManager] Stats updated:', newStats);
            }}
          />

          {/* Console Status */}
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <h3 className="text-gray-400 text-sm uppercase tracking-wider mb-2">Console</h3>
            <div className="flex items-center space-x-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  consoleConnected
                    ? 'bg-green-500 shadow-lg shadow-green-500/50 animate-pulse'
                    : 'bg-red-500 shadow-lg shadow-red-500/50'
                }`}
              />
              <span className="text-sm text-gray-300">
                {consoleConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 space-y-2">
            <h3 className="text-gray-400 text-sm uppercase tracking-wider mb-3">Actions</h3>
            <button className="w-full px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded transition-colors text-sm font-semibold">
              Edit Config
            </button>
            <button className="w-full px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded transition-colors text-sm font-semibold">
              Backup World
            </button>
            <button className="w-full px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded transition-colors text-sm font-semibold">
              Restore Backup
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Settings Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Server Settings */}
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Server Settings</h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-400 block mb-1">Game Mode</label>
              <select className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 text-sm">
                <option>Survival</option>
                <option>Creative</option>
                <option>Adventure</option>
                <option>Spectator</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">Difficulty</label>
              <select className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 text-sm">
                <option>Peaceful</option>
                <option>Easy</option>
                <option>Normal</option>
                <option>Hard</option>
              </select>
            </div>
          </div>
        </div>

        {/* Backup Info */}
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Backups</h3>
          <div className="space-y-2 text-sm text-gray-400">
            <p>Last backup: <span className="text-gray-300">2 hours ago</span></p>
            <p>Backup size: <span className="text-gray-300">245 MB</span></p>
            <button className="mt-4 w-full px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-semibold transition-colors">
              Create Backup Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServerManager;
