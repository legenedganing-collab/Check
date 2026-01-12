import React, { useState } from 'react';
import toast from 'react-hot-toast';

const CreateServerForm = ({ onServerCreated }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    memory: 2,           // Default 2GB
    disk: 10,            // Default 10GB
    version: 'Paper 1.21'
  });

  const [errors, setErrors] = useState({});

  // Price calculation: $2.50 per GB RAM + $0.50 per GB Disk
  const calculatePrice = () => {
    const ramCost = formData.memory * 2.50;
    const diskCost = formData.disk * 0.50;
    return (ramCost + diskCost).toFixed(2);
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name || formData.name.trim().length === 0) {
      newErrors.name = 'Server name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Server name must be at least 3 characters';
    } else if (formData.name.length > 32) {
      newErrors.name = 'Server name must be less than 32 characters';
    }

    if (formData.memory < 1 || formData.memory > 16) {
      newErrors.memory = 'RAM must be between 1GB and 16GB';
    }

    if (formData.disk < 5 || formData.disk > 500) {
      newErrors.disk = 'Disk space must be between 5GB and 500GB';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);

    try {
      // Get JWT token from localStorage
      const token = localStorage.getItem('token');

      if (!token) {
        toast.error('Authentication required. Please log in.');
        navigate('/login');
        setLoading(false);
        return;
      }

      // Prepare the request payload
      const payload = {
        name: formData.name.trim(),
        memory: parseInt(formData.memory),
        diskSpace: parseInt(formData.disk),
        version: formData.version,
        ipAddress: '0.0.0.0',  // Will be assigned by backend
        port: 25565,             // Default Minecraft port
        status: 'starting'       // Initial status
      };

      // Send POST request to backend
      const response = await fetch('http://localhost:5000/api/servers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      // Handle response
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create server');
      }

      const data = await response.json();

      // Success! Show toast and call callback
      toast.success('🎉 Server created successfully!');
      
      // Call parent callback with server data
      if (onServerCreated) {
        onServerCreated(data.server);
      }

    } catch (error) {
      console.error('Error creating server:', error);
      toast.error(error.message || 'Failed to create server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Deploy New Instance</h1>
          <p className="text-gray-400">Create and configure your Minecraft server in minutes</p>
        </div>

        {/* Form Card */}
        <div className="bg-gray-900 p-8 rounded-xl border border-gray-800 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Server Name Input */}
            <div>
              <label className="block text-gray-300 font-semibold mb-2">
                Server Name
              </label>
              <input 
                type="text" 
                placeholder="e.g. My Epic SMP"
                value={formData.name}
                onChange={(e) => {
                  setFormData({...formData, name: e.target.value});
                  if (errors.name) setErrors({...errors, name: ''});
                }}
                className={`w-full bg-gray-800 border rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none transition ${
                  errors.name 
                    ? 'border-red-500 focus:border-red-500' 
                    : 'border-gray-700 focus:border-purple-500'
                }`}
              />
              {errors.name && (
                <p className="text-red-400 text-sm mt-1">{errors.name}</p>
              )}
              <p className="text-gray-500 text-xs mt-2">
                {formData.name.length}/32 characters
              </p>
            </div>

            {/* RAM Slider with Real-time Feedback */}
            <div>
              <label className="block text-gray-300 font-semibold mb-3">
                RAM Allocation
                <span className="text-purple-400 font-bold ml-2">
                  {formData.memory} GB
                </span>
              </label>
              <input 
                type="range" 
                min="1" 
                max="16" 
                step="1" 
                value={formData.memory}
                onChange={(e) => setFormData({...formData, memory: parseInt(e.target.value)})}
                className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400 transition"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>1 GB</span>
                <span>8 GB</span>
                <span>16 GB</span>
              </div>
              {errors.memory && (
                <p className="text-red-400 text-sm mt-2">{errors.memory}</p>
              )}
            </div>

            {/* Disk Space Slider with Real-time Feedback */}
            <div>
              <label className="block text-gray-300 font-semibold mb-3">
                Disk Space
                <span className="text-purple-400 font-bold ml-2">
                  {formData.disk} GB
                </span>
              </label>
              <input 
                type="range" 
                min="5" 
                max="500" 
                step="5" 
                value={formData.disk}
                onChange={(e) => setFormData({...formData, disk: parseInt(e.target.value)})}
                className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400 transition"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>5 GB</span>
                <span>250 GB</span>
                <span>500 GB</span>
              </div>
              {errors.disk && (
                <p className="text-red-400 text-sm mt-2">{errors.disk}</p>
              )}
            </div>

            {/* Minecraft Version Dropdown */}
            <div>
              <label className="block text-gray-300 font-semibold mb-2">
                Minecraft Version
              </label>
              <select 
                value={formData.version}
                onChange={(e) => setFormData({...formData, version: e.target.value})}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:border-purple-500 focus:outline-none transition cursor-pointer"
              >
                <option>Paper 1.21</option>
                <option>Paper 1.20.4</option>
                <option>Forge 1.20.1</option>
                <option>Fabric 1.21</option>
                <option>Spigot 1.20.4</option>
                <option>Bungeecord</option>
              </select>
            </div>

            {/* Price Summary */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-400 text-sm">Estimated Monthly Cost</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    ${calculatePrice()}/mo
                  </p>
                </div>
                <div className="text-right text-xs text-gray-500">
                  <p>RAM: ${(formData.memory * 2.50).toFixed(2)}/mo</p>
                  <p>Disk: ${(formData.disk * 0.50).toFixed(2)}/mo</p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-900 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="inline-block animate-spin">⚙️</span>
                  Creating Server...
                </>
              ) : (
                <>
                  <span>🚀</span>
                  Create Server
                </>
              )}
            </button>

            {/* Info Text */}
            <p className="text-gray-500 text-xs text-center">
              Your server will be ready in 2-3 minutes. You'll receive the connection details on your dashboard.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateServerForm;
