import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const ServerSuccessScreen = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [server, setServer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(null);

  const newServerId = location.state?.newServerId;

  useEffect(() => {
    if (!newServerId) {
      navigate('/dashboard');
      return;
    }

    // Fetch the newly created server details
    const fetchServer = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/servers/${newServerId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) throw new Error('Failed to fetch server');

        const data = await response.json();
        setServer(data.server);
      } catch (error) {
        console.error('Error fetching server:', error);
        toast.error('Could not load server details');
      } finally {
        setLoading(false);
      }
    };

    fetchServer();
  }, [newServerId, navigate]);

  // Copy to clipboard
  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    toast.success(`${type} copied!`);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-5xl mb-4">⚙️</div>
          <p className="text-gray-400">Loading your server details...</p>
        </div>
      </div>
    );
  }

  if (!server) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Failed to load server</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-2xl mx-auto">
        
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="text-6xl mb-4 animate-bounce">🎉</div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Server Created Successfully!
          </h1>
          <p className="text-gray-400 text-lg">
            Your Minecraft server is launching. You'll be online in 2-3 minutes.
          </p>
        </div>

        {/* Server Info Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 mb-8">
          
          {/* Server Name & Status */}
          <div className="mb-8 pb-8 border-b border-gray-800">
            <h2 className="text-2xl font-bold text-white mb-2">
              {server.name}
            </h2>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
              <span className="text-gray-400 capitalize">
                {server.status === 'starting' ? 'Starting up...' : server.status}
              </span>
            </div>
          </div>

          {/* Connection Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            
            {/* Server Address */}
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">
                Server Address
              </p>
              <div className="flex items-center gap-2">
                <code className="text-white font-mono text-sm break-all flex-1">
                  {server.ipAddress || 'Assigning...'}
                </code>
                {server.ipAddress && (
                  <button
                    onClick={() => copyToClipboard(server.ipAddress, 'Address')}
                    className="p-2 hover:bg-gray-700 rounded transition"
                    title="Copy address"
                  >
                    {copied === 'Address' ? '✓' : '📋'}
                  </button>
                )}
              </div>
            </div>

            {/* Server Port */}
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">
                Port
              </p>
              <div className="flex items-center gap-2">
                <code className="text-white font-mono text-sm flex-1">
                  {server.port}
                </code>
                <button
                  onClick={() => copyToClipboard(String(server.port), 'Port')}
                  className="p-2 hover:bg-gray-700 rounded transition"
                  title="Copy port"
                >
                  {copied === 'Port' ? '✓' : '📋'}
                </button>
              </div>
            </div>

            {/* Full Connection String */}
            <div className="bg-gray-800 rounded-lg p-4 md:col-span-2">
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">
                Connection String
              </p>
              <div className="flex items-center gap-2">
                <code className="text-white font-mono text-sm break-all flex-1">
                  {server.ipAddress ? `${server.ipAddress}:${server.port}` : 'Assigning...'}
                </code>
                {server.ipAddress && (
                  <button
                    onClick={() => copyToClipboard(`${server.ipAddress}:${server.port}`, 'Connection')}
                    className="p-2 hover:bg-gray-700 rounded transition"
                    title="Copy connection string"
                  >
                    {copied === 'Connection' ? '✓' : '📋'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Server Specs */}
          <div className="bg-gray-800 rounded-lg p-4 mb-8">
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-3">
              Server Specifications
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-gray-500 text-xs">Version</p>
                <p className="text-white font-semibold">Paper 1.21</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">RAM</p>
                <p className="text-white font-semibold">{server.memory} GB</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Storage</p>
                <p className="text-white font-semibold">{server.diskSpace} GB</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">UUID</p>
                <p className="text-white font-semibold text-xs">
                  {server.uuid?.substring(0, 8)}...
                </p>
              </div>
            </div>
          </div>

          {/* Server UUID (Full) */}
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">
              Server ID
            </p>
            <div className="flex items-center gap-2">
              <code className="text-gray-300 font-mono text-xs break-all flex-1">
                {server.uuid}
              </code>
              <button
                onClick={() => copyToClipboard(server.uuid, 'UUID')}
                className="p-2 hover:bg-gray-700 rounded transition"
                title="Copy UUID"
              >
                {copied === 'UUID' ? '✓' : '📋'}
              </button>
            </div>
          </div>
        </div>

        {/* How to Connect */}
        <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-purple-800 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-white mb-3">How to Connect</h3>
          <ol className="space-y-2 text-gray-300 text-sm">
            <li><strong>1.</strong> Open Minecraft Java Edition</li>
            <li><strong>2.</strong> Click "Multiplayer" on the main menu</li>
            <li><strong>3.</strong> Click "Add Server"</li>
            <li><strong>4.</strong> Paste: <code className="bg-gray-900 px-2 py-1 rounded text-purple-300">{server.ipAddress}:{server.port}</code></li>
            <li><strong>5.</strong> Click "Join Server"</li>
          </ol>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => {
              const connectionString = `${server.ipAddress}:${server.port}`;
              copyToClipboard(connectionString, 'Server Address');
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2"
          >
            <span>📋</span>
            Copy Address
          </button>

          <button
            onClick={() => navigate('/dashboard')}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition"
          >
            View Dashboard
          </button>

          <button
            onClick={() => {
              toast.success('Invite link copied!');
              // In a real app, this would generate a shareable invite link
            }}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2"
          >
            <span>👥</span>
            Share with Friends
          </button>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-gray-800 border border-gray-700 rounded-lg p-4 text-sm text-gray-400">
          <p className="mb-2"><strong>💡 Tip:</strong> Save your server address somewhere safe!</p>
          <p>Your server will be automatically backed up daily. You can manage your server from the dashboard.</p>
        </div>
      </div>
    </div>
  );
};

export default ServerSuccessScreen;
