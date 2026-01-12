import React, { useState } from 'react';
import CreateServerForm from './CreateServerForm';
import DeploymentSuccess from './DeploymentSuccess';

const Dashboard = () => {
  const [currentView, setCurrentView] = useState('form');
  const [newServerData, setNewServerData] = useState(null);

  const handleServerCreated = (serverData) => {
    // Store the server data from backend response
    setNewServerData({
      name: serverData.name,
      ip: serverData.ipAddress || '10.0.0.5',
      port: serverData.port || 25565,
      tempPassword: serverData.tempPassword || generateTempPassword(),
      panelUrl: serverData.panelUrl || `https://panel.lighth.io/server/${serverData.id}`,
      location: serverData.location || 'US-East-1',
      memory: serverData.memory,
      uuid: serverData.uuid
    });
    
    // Switch to success view
    setCurrentView('success');
  };

  const handleViewSetupGuide = () => {
    // Could open a modal or navigate to a guide page
    console.log('View setup guide');
  };

  const handleCreateAnother = () => {
    // Reset form for another server creation
    setCurrentView('form');
    setNewServerData(null);
  };

  // Fallback password generator if backend doesn't provide one
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
    <>
      {currentView === 'form' ? (
        <CreateServerForm onServerCreated={handleServerCreated} />
      ) : (
        <DeploymentSuccess 
          serverData={newServerData}
          onViewSetupGuide={handleViewSetupGuide}
          onCreateAnother={handleCreateAnother}
        />
      )}
    </>
  );
};

export default Dashboard;
