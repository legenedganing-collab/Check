import React, { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import CreateServerForm from './CreateServerForm';
import DeploymentSuccess from './DeploymentSuccess';
import ServerCard from './ServerCard';
import { useServerStore } from '../store/serverStore';
import toast from 'react-hot-toast';

/**
 * Dashboard Component - Main Server Hub (Dashboard A)
 * 
 * Purpose: Entry point after login
 * Features:
 * - Display list of all user's servers
 * - Create new server wizard
 * - Server deployment success screen
 * 
 * User clicks "Manage" on a server card to navigate to ServerManager (Dashboard B)
 * which handles specific server control (console, power, stats, files)
 */

const Dashboard = () => {
  const [currentView, setCurrentView] = useState('servers');
  const [newServerData, setNewServerData] = useState(null);
  const { servers, fetchServers, addServer } = useServerStore();

  useEffect(() => {
    // Load servers on mount
    fetchServers();
  }, []);

  const handleServerCreated = (serverData) => {
    setNewServerData({
      name: serverData.name,
      ip: serverData.ipAddress || '10.0.0.5',
      port: serverData.port || 25565,
      tempPassword: serverData.tempPassword || generateTempPassword(),
      panelUrl: serverData.panelUrl || `https://panel.lighth.io/server/${serverData.id}`,
      location: serverData.location || 'US-East-1',
      memory: serverData.memory,
      uuid: serverData.uuid,
      id: serverData.id
    });
    setCurrentView('success');
    // Add to store
    addServer(serverData);
  };

  const handleViewSetupGuide = () => {
    console.log('View setup guide');
  };

  const handleCreateAnother = () => {
    setCurrentView('form');
    setNewServerData(null);
  };

  const generateTempPassword = () => {
    const length = 16;
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };

  return (
    <DashboardLayout>
      {currentView === 'form' ? (
        <CreateServerForm onServerCreated={handleServerCreated} />
      ) : currentView === 'success' ? (
        <DeploymentSuccess 
          serverData={newServerData}
          onViewSetupGuide={handleViewSetupGuide}
          onCreateAnother={handleCreateAnother}
        />
      ) : (
        <div className="space-y-6">
          {/* Header with title and create button */}
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">My Servers</h1>
            <button 
              onClick={() => setCurrentView('form')}
              className="px-4 py-2 bg-accent hover:bg-accent/90 rounded-lg font-semibold transition"
            >
              + Create Server
            </button>
          </div>

          {/* Servers Grid */}
          {servers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {servers.map((server) => (
                <ServerCard
                  key={server.id}
                  id={server.id}
                  name={server.name}
                  ip={server.ipAddress}
                  status={server.status}
                  ram={server.memory}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-400 mb-4">No servers yet. Create your first one!</p>
              <button 
                onClick={() => setCurrentView('form')}
                className="px-6 py-3 bg-accent hover:bg-accent/90 rounded-lg font-semibold transition"
              >
                Deploy First Server
              </button>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
};

export default Dashboard;
