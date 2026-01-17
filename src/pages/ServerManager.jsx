/**
 * ServerManager Page - Server Control Panel (Dashboard B)
 * 
 * Purpose: Specific server management interface
 * This is the "nerve center" - similar to Pterodactyl, AWS, or DigitalOcean control panels
 * 
 * Features:
 * - Power controls (Start/Stop/Restart/Kill)
 * - Live console with xterm.js (WebSocket)
 * - Server information display
 * - Resource usage stats (CPU/RAM)
 * - File manager
 * 
 * Accessed via: /server/:id
 * URL params tell us which server to manage
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../layouts/DashboardLayout';
import ServerControls from '../components/ServerControls';
import ServerConsole from '../components/ServerConsole';
import ServerStats from '../components/ServerStats';
import FileManager from '../components/FileManager';
import ServerCard from '../components/ServerCard';
import { useAuth } from '../context/AuthContext';

const ServerManager = () => {
  const { id: serverId } = useParams(); // Get server ID from URL
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const [server, setServer] = useState(null);
  const [status, setStatus] = useState('offline');
  const [loading, setLoading] = useState(true);
  const [consoleConnected, setConsoleConnected] = useState(false);

  /**
   * Fetch server info on mount
   * Validate that user owns this server
   */
  useEffect(() => {
    const fetchServerInfo = async () => {
      if (!serverId || !token) {
        toast.error('Server ID or authentication missing');
        navigate('/dashboard');
        return;
      }

      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL || 'http://localhost:3002'}/api/servers/${serverId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          if (response.status === 404) {
            toast.error('Server not found');
            navigate('/dashboard');
            return;
          }
          throw new Error('Failed to fetch server info');
        }

        const data = await response.json();
        setServer(data.server);
        setStatus(data.server.status);
      } catch (error) {
        console.error('[ServerManager] Error fetching server:', error);
        toast.error('Failed to load server info');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchServerInfo();
  }, [serverId, token, navigate]);

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
  };

  const handleConsoleConnectionChange = (connected) => {
    setConsoleConnected(connected);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-accent border-opacity-75 mb-4"></div>
            <p className="text-slate-400">Loading server...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!server) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-slate-400 mb-4">Server not found</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-accent hover:bg-accent/90 rounded-lg font-semibold transition"
          >
            Back to Servers
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header with back button and server name */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition mb-4"
        >
          <ChevronLeft size={20} />
          Back to Servers
        </button>
        <h1 className="text-3xl font-bold">{server.name}</h1>
        <p className="text-slate-400 text-sm">Server ID: {server.uuid}</p>
      </div>

      {/* Main control grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Console and File Manager */}
        <div className="lg:col-span-2 space-y-6">
          {/* Console */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Live Console</h2>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                consoleConnected 
                  ? 'bg-status.online/10 text-status.online' 
                  : 'bg-status.offline/10 text-status.offline'
              }`}>
                {consoleConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <ServerConsole 
              serverId={serverId}
              onConnectionChange={handleConsoleConnectionChange}
            />
          </div>

          {/* File Manager */}
          <div>
            <h2 className="text-xl font-bold mb-4">File Manager</h2>
            <FileManager serverId={serverId} />
          </div>
        </div>

        {/* Right column - Controls and Stats */}
        <div className="space-y-6">
          {/* Power Controls */}
          <div>
            <h2 className="text-xl font-bold mb-4">Power Controls</h2>
            <ServerControls 
              serverId={serverId}
              currentStatus={status}
              onStatusChange={handleStatusChange}
            />
          </div>

          {/* Server Info Card */}
          <div>
            <h2 className="text-xl font-bold mb-4">Server Info</h2>
            <ServerCard 
              id={server.id}
              name={server.name}
              ip={server.ipAddress}
              status={status}
              ram={server.memory}
            />
          </div>

          {/* Live Stats */}
          <div>
            <h2 className="text-xl font-bold mb-4">Resource Usage</h2>
            <ServerStats serverId={serverId} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ServerManager;
