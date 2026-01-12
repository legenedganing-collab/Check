import React, { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import CreateServerForm from './CreateServerForm';
import DeploymentSuccess from './DeploymentSuccess';
import ServerCard from './ServerCard';
import FileManager from './FileManager';
import ServerSwitcher from './ServerSwitcher';
import { useServerStore } from '../store/serverStore';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [currentView, setCurrentView] = useState('servers');
  const [newServerData, setNewServerData] = useState(null);
  const { servers, selectedServer, setSelectedServer, fetchServers, addServer } = useServerStore();

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
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">My Servers</h1>
            <button 
              onClick={() => setCurrentView('form')}
              className="px-4 py-2 bg-accent hover:bg-accent/90 rounded-lg font-semibold transition"
            >
              + Create Server
            </button>
          </div>

          {servers.length > 0 && <ServerSwitcher />}

          {selectedServer && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="mb-6">
                  <h2 className="text-xl font-bold mb-4">Console</h2>
                  <div className="bg-brand.card rounded-lg border border-brand.border p-4 h-96 font-mono text-sm text-slate-300 overflow-auto">
                    Console output will appear here...
                  </div>
                </div>
                <FileManager serverId={selectedServer.id} />
              </div>
              <div>
                <h2 className="text-xl font-bold mb-4">Server Info</h2>
                <ServerCard 
                  name={selectedServer.name} 
                  ip={selectedServer.ipAddress} 
                  status={selectedServer.status} 
                  ram={selectedServer.memory}
                />
              </div>
            </div>
          )}

          {servers.length === 0 && (
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
