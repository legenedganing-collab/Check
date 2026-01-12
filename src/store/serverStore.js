import { create } from 'zustand';
import { apiCall } from '../lib/api';

/**
 * Global server state management using Zustand
 * Handles loading, selecting, and updating servers
 */
export const useServerStore = create((set, get) => ({
  servers: [],
  selectedServer: null,
  loading: false,
  error: null,

  // Fetch all servers for the logged-in user
  fetchServers: async () => {
    set({ loading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await apiCall('/api/servers', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch servers');
      }

      const data = await response.json();
      const servers = data.servers || [];
      
      set({ servers, loading: false });
      
      // Auto-select first server if none selected
      if (servers.length > 0 && !get().selectedServer) {
        set({ selectedServer: servers[0] });
      }
    } catch (error) {
      set({ 
        error: error.message, 
        loading: false 
      });
    }
  },

  // Select a specific server
  setSelectedServer: (server) => {
    set({ selectedServer: server });
  },

  // Add a new server to the list
  addServer: (server) => {
    set(state => ({
      servers: [...state.servers, server],
      selectedServer: server
    }));
  },

  // Update a server in the list
  updateServer: (serverId, updates) => {
    set(state => ({
      servers: state.servers.map(s => 
        s.id === serverId ? { ...s, ...updates } : s
      ),
      selectedServer: state.selectedServer?.id === serverId 
        ? { ...state.selectedServer, ...updates }
        : state.selectedServer
    }));
  },

  // Remove a server from the list
  removeServer: (serverId) => {
    set(state => {
      const servers = state.servers.filter(s => s.id !== serverId);
      const selectedServer = state.selectedServer?.id === serverId 
        ? (servers.length > 0 ? servers[0] : null)
        : state.selectedServer;
      
      return { servers, selectedServer };
    });
  }
}));
