/**
 * ServerControls Component
 * 
 * Power state controls for Minecraft servers
 * - Start button (gray when online)
 * - Restart button (yellow)
 * - Stop button (red)
 * - Kill button (hidden, requires confirmation)
 * 
 * Features:
 * - Loading state prevents double-clicks
 * - Confirmation dialog for dangerous actions
 * - Toast notifications for feedback
 * - Disabled state management
 */

import React, { useState } from 'react';
import { Play, Square, RotateCw, Skull } from 'lucide-react';
import toast from 'react-hot-toast';

const ServerControls = ({ serverId, currentStatus, onStatusChange }) => {
  const [loading, setLoading] = useState(false);
  const [localStatus, setLocalStatus] = useState(currentStatus);

  // Update local status when prop changes
  React.useEffect(() => {
    setLocalStatus(currentStatus);
  }, [currentStatus]);

  /**
   * Send power action to backend
   * 
   * @param {string} action - 'start', 'stop', 'restart', or 'kill'
   */
  const sendPowerAction = async (action) => {
    // Prevent double-clicks
    if (loading) {
      toast.loading('Action in progress...');
      return;
    }

    setLoading(true);
    const token = localStorage.getItem('token');

    try {
      console.log(`[Controls] Sending power action: ${action}`);

      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:3002'}/api/servers/${serverId}/power`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ action }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Failed to ${action} server`);
      }

      // Update local status
      setLocalStatus(data.status);
      if (onStatusChange) {
        onStatusChange(data.status);
      }

      // Show success message
      const messages = {
        start: '✅ Server starting...',
        stop: '⏹️ Server stopping gracefully...',
        restart: '🔄 Server restarting...',
        kill: '☠️ Server force killed',
      };

      toast.success(messages[action] || `Server ${action} command sent!`);
      console.log(`[Controls] ✅ Server ${action} command successful`);
    } catch (error) {
      console.error(`[Controls] Error:`, error);
      toast.error(error.message || `Failed to ${action} server`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle kill action with confirmation
   * Warn user that killing can corrupt world data
   */
  const handleKill = () => {
    if (
      window.confirm(
        '⚠️ DANGER: Force killing will NOT save world data!\n\nThis may cause corruption. Are you sure?'
      )
    ) {
      sendPowerAction('kill');
    }
  };

  return (
    <div className="flex flex-wrap gap-3 mb-6 p-4 bg-gray-800 rounded-xl border border-gray-700 shadow-lg">
      {/* Start Button */}
      <button
        onClick={() => sendPowerAction('start')}
        disabled={loading || localStatus === 'online'}
        className={`flex items-center px-6 py-2.5 rounded-lg font-semibold transition-all duration-200 ${
          localStatus === 'online'
            ? 'bg-green-900/30 text-green-700 cursor-not-allowed opacity-50'
            : 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-600/30 hover:shadow-green-500/50 hover:scale-105 active:scale-95'
        } ${loading ? 'opacity-75' : ''}`}
        title={localStatus === 'online' ? 'Server is already online' : 'Start the server'}
      >
        <Play
          size={18}
          className={`mr-2 fill-current ${loading ? 'animate-spin' : ''}`}
        />
        {loading ? 'Starting...' : 'Start'}
      </button>

      {/* Restart Button */}
      <button
        onClick={() => sendPowerAction('restart')}
        disabled={loading || localStatus === 'offline'}
        className={`flex items-center px-6 py-2.5 rounded-lg font-semibold transition-all duration-200 ${
          localStatus === 'offline'
            ? 'bg-yellow-900/30 text-yellow-700 cursor-not-allowed opacity-50'
            : 'bg-yellow-600 hover:bg-yellow-500 text-white shadow-lg shadow-yellow-600/30 hover:shadow-yellow-500/50 hover:scale-105 active:scale-95'
        } ${loading ? 'opacity-75' : ''}`}
        title={localStatus === 'offline' ? 'Server must be online to restart' : 'Restart the server'}
      >
        <RotateCw
          size={18}
          className={`mr-2 ${loading ? 'animate-spin' : ''}`}
        />
        {loading ? 'Restarting...' : 'Restart'}
      </button>

      {/* Stop Button */}
      <button
        onClick={() => sendPowerAction('stop')}
        disabled={loading || localStatus === 'offline'}
        className={`flex items-center px-6 py-2.5 rounded-lg font-semibold transition-all duration-200 ${
          localStatus === 'offline'
            ? 'bg-red-900/30 text-red-700 cursor-not-allowed opacity-50'
            : 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30 hover:shadow-red-500/50 hover:scale-105 active:scale-95'
        } ${loading ? 'opacity-75' : ''}`}
        title={
          localStatus === 'offline'
            ? 'Server is already offline'
            : 'Stop the server gracefully (saves world)'
        }
      >
        <Square
          size={18}
          className={`mr-2 fill-current ${loading ? 'animate-spin' : ''}`}
        />
        {loading ? 'Stopping...' : 'Stop'}
      </button>

      {/* Divider */}
      <div className="flex-1" />

      {/* Kill Button (Dangerous - Hidden) */}
      <button
        onClick={handleKill}
        disabled={loading}
        className="flex items-center px-4 py-2.5 bg-gray-700 hover:bg-red-900 text-gray-400 hover:text-red-200 rounded-lg transition-all duration-200 border border-gray-600 hover:border-red-500 text-sm font-semibold group relative"
        title="Force Kill Server (⚠️ DANGEROUS - No world save!)"
      >
        <Skull size={16} className="mr-2" />
        Kill
        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-red-900 text-red-200 text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          ⚠️ No world save
        </div>
      </button>

      {/* Status Indicator */}
      <div className="flex items-center px-4 py-2.5 bg-gray-700/50 rounded-lg border border-gray-600">
        <div
          className={`w-2.5 h-2.5 rounded-full mr-2 ${
            localStatus === 'online'
              ? 'bg-green-500 shadow-lg shadow-green-500/50 animate-pulse'
              : localStatus === 'offline'
              ? 'bg-red-500 shadow-lg shadow-red-500/50'
              : 'bg-yellow-500 shadow-lg shadow-yellow-500/50 animate-pulse'
          }`}
        />
        <span className="text-sm text-gray-300 font-mono capitalize">
          {localStatus === 'provisioning' ? 'Starting up...' : localStatus}
        </span>
      </div>
    </div>
  );
};

export default ServerControls;
