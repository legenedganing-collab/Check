/**
 * ServerConsole Component
 * 
 * Real-time terminal interface for Minecraft server console
 * Uses:
 * - xterm.js (same engine as VS Code)
 * - Socket.io for WebSocket communication
 * - Professional terminal styling
 * 
 * Features:
 * - Live console streaming from Docker container
 * - Full terminal emulation (colors, formatting)
 * - Auto-fit to container size
 * - Responsive design
 * - Connection status indicator
 */

import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import 'xterm/css/xterm.css';

const ServerConsole = ({ serverId, onConnectionChange }) => {
  const terminalRef = useRef(null);
  const socketRef = useRef(null);
  const termRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  useEffect(() => {
    // Initialize xterm.js
    const term = new Terminal({
      // Cursor and interaction
      cursorBlink: true,
      cursorStyle: 'block',
      
      // Visual theme (dark mode)
      theme: {
        background: '#0f172a',      // Slate-900
        foreground: '#10b981',       // Emerald-500 (Matrix green)
        cursor: '#10b981',
        black: '#0f172a',
        brightBlack: '#64748b',
      },

      // Font and sizing
      fontFamily: '"SF Mono", Menlo, "Courier New", monospace',
      fontSize: 13,
      lineHeight: 1.2,
      letterSpacing: 0,

      // Scrollback
      scrollback: 1000, // Keep last 1000 lines in buffer
      
      // Input handling
      disableStdin: false, // Allow user input
    });

    // Add fit addon to auto-resize terminal
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    // Mount terminal to DOM
    if (terminalRef.current) {
      term.open(terminalRef.current);
      fitAddon.fit();
    }

    termRef.current = term;

    // Initialize WebSocket connection
    if (!token) {
      setError('No authentication token found');
      return;
    }

    console.log('[Console] Connecting to WebSocket...');

    // Connect to Socket.io server
    const socket = io(
      process.env.REACT_APP_SOCKET_URL || 'http://localhost:3002',
      {
        auth: {
          token: token, // Send JWT token for authentication
        },
        query: {
          serverId: serverId, // Tell backend which server we want
        },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      }
    );

    socketRef.current = socket;

    // ========================================================================
    // WEBSOCKET EVENT HANDLERS
    // ========================================================================

    // Connection established
    socket.on('connect', () => {
      console.log('[Console] ✅ WebSocket connected');
      setIsConnected(true);
      setError(null);
      if (onConnectionChange) onConnectionChange(true);
      term.write('\r\n🟢 Connected to server console\r\n');
    });

    // Receive console output from Docker
    socket.on('console-output', (data) => {
      if (term) {
        term.write(data);
      }
    });

    // Receive console errors
    socket.on('console-error', (message) => {
      console.error('[Console] Error:', message);
      setError(message);
      if (term) {
        term.write(`\r\n🔴 Error: ${message}\r\n`);
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('[Console] 🔌 WebSocket disconnected');
      setIsConnected(false);
      if (onConnectionChange) onConnectionChange(false);
      if (term) {
        term.write('\r\n🔴 Console disconnected\r\n');
      }
    });

    // Handle connection errors
    socket.on('connect_error', (error) => {
      console.error('[Console] Connection error:', error);
      setError(error.message);
      if (term) {
        term.write(`\r\n🔴 Connection error: ${error.message}\r\n`);
      }
    });

    // Handle authentication errors
    socket.on('error', (message) => {
      console.error('[Console] Socket error:', message);
      setError(message);
      if (term) {
        term.write(`\r\n🔴 Error: ${message}\r\n`);
      }
    });

    // ========================================================================
    // USER INPUT HANDLING
    // ========================================================================

    /**
     * When user types in terminal:
     * 1. Send the keystroke to the backend via WebSocket
     * 2. The backend writes it to the Docker container's STDIN
     * 3. The server echoes it back via stdout
     * 4. We receive it as console-output
     */
    term.onData((input) => {
      if (socket && socket.connected) {
        // Send every keystroke to the server
        socket.emit('console-input', input);
      } else {
        term.write('\r\n⚠️ Console not connected. Refreshing...\r\n');
      }
    });

    // ========================================================================
    // RESIZE HANDLING
    // ========================================================================

    const handleResize = () => {
      try {
        fitAddon.fit();
        // Optionally notify server of new dimensions
        if (socket && socket.connected) {
          socket.emit('console-resize', {
            cols: term.cols,
            rows: term.rows,
          });
        }
      } catch (err) {
        console.warn('[Console] Resize error:', err.message);
      }
    };

    window.addEventListener('resize', handleResize);

    // ========================================================================
    // CLEANUP
    // ========================================================================

    return () => {
      window.removeEventListener('resize', handleResize);
      if (socket) {
        socket.disconnect();
      }
      if (term) {
        term.dispose();
      }
    };
  }, [serverId, onConnectionChange]);

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-xl border border-gray-700 overflow-hidden shadow-2xl">
      {/* Terminal Header */}
      <div className="bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center space-x-3">
          {/* Fake traffic lights */}
          <div className="flex space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500 shadow-lg shadow-red-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-lg shadow-yellow-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-green-500 shadow-lg shadow-green-500/50"></div>
          </div>
          
          {/* Terminal title and path */}
          <span className="text-xs text-gray-400 font-mono">
            root@lighth:~/server-{serverId}
          </span>
        </div>

        {/* Connection status indicator */}
        <div className="flex items-center space-x-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected
                ? 'bg-green-500 shadow-lg shadow-green-500/50 animate-pulse'
                : 'bg-red-500 shadow-lg shadow-red-500/50'
            }`}
          />
          <span className="text-xs text-gray-400">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-900/20 border-b border-red-900 px-4 py-2 text-xs text-red-400">
          ⚠️ {error}
        </div>
      )}

      {/* Terminal canvas */}
      <div
        ref={terminalRef}
        className="flex-1 overflow-hidden bg-gradient-to-b from-gray-900 to-slate-950"
      />

      {/* Footer hint */}
      <div className="bg-gray-800 px-4 py-1 border-t border-gray-700 text-xs text-gray-500">
        Type commands and press Enter. Use Ctrl+C to stop processes.
      </div>
    </div>
  );
};

export default ServerConsole;
