import React, { useState } from 'react';
import { CheckCircle, Copy, ExternalLink, Terminal, ShieldCheck, AlertCircle, Clock, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

const DeploymentSuccess = ({ serverData, onViewSetupGuide }) => {
  const [copied, setCopied] = useState(null);

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    toast.success(`${type} copied!`);
    setTimeout(() => setCopied(null), 2000);
  };

  // Connection string for Minecraft client
  const minecraftAddress = `${serverData.ip}${serverData.port ? ':' + serverData.port : ''}`;

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-5xl mx-auto">
        
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-500/10 rounded-full mb-6 animate-bounce">
            <CheckCircle className="w-14 h-14 text-green-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-3">
            Deployment Successful! 🚀
          </h1>
          <p className="text-xl text-gray-400">
            Your server <span className="text-purple-400 font-mono font-bold">"{serverData.name}"</span> is spinning up now.
          </p>
          <p className="text-gray-500 mt-2 text-sm">
            Server will be fully online in 2-3 minutes
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          
          {/* Connection Details Card - Featured */}
          <div className="lg:col-span-2 bg-gray-900 p-8 rounded-2xl border-2 border-green-500/50 shadow-2xl">
            <h3 className="flex items-center text-2xl font-bold mb-6 text-green-400">
              <Terminal className="w-6 h-6 mr-3" /> 
              Connection Details
            </h3>
            
            <div className="space-y-5">
              {/* Minecraft Server Address */}
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold tracking-wide">
                  🎮 Minecraft Server Address
                </label>
                <div className="flex mt-2 gap-2">
                  <code className="flex-1 bg-black/60 p-4 rounded-lg font-mono text-green-400 text-sm border border-green-500/20 break-all">
                    {minecraftAddress}
                  </code>
                  <button 
                    onClick={() => copyToClipboard(minecraftAddress, 'Address')}
                    className={`px-4 rounded-lg font-bold transition flex items-center gap-2 ${
                      copied === 'Address'
                        ? 'bg-green-600 text-white'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    {copied === 'Address' ? '✓' : <Copy size={18} />}
                    <span className="hidden sm:inline">Copy</span>
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">Paste this into Multiplayer → Add Server in Minecraft</p>
              </div>

              {/* Server IP */}
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold tracking-wide">
                  📍 Server IP Address
                </label>
                <div className="flex mt-2 gap-2">
                  <code className="flex-1 bg-black/60 p-4 rounded-lg font-mono text-blue-400 text-sm border border-blue-500/20">
                    {serverData.ip}
                  </code>
                  <button 
                    onClick={() => copyToClipboard(serverData.ip, 'IP')}
                    className={`px-4 rounded-lg font-bold transition flex items-center gap-2 ${
                      copied === 'IP'
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {copied === 'IP' ? '✓' : <Copy size={18} />}
                  </button>
                </div>
              </div>

              {/* Temporary Panel Password */}
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold tracking-wide">
                  🔐 Temporary Panel Password
                </label>
                <p className="text-xs text-gray-400 mt-1">For accessing your control panel</p>
                <div className="flex mt-2 gap-2">
                  <code className="flex-1 bg-black/60 p-4 rounded-lg font-mono text-orange-400 text-sm border border-orange-500/20 break-all">
                    {serverData.tempPassword}
                  </code>
                  <button 
                    onClick={() => copyToClipboard(serverData.tempPassword, 'Password')}
                    className={`px-4 rounded-lg font-bold transition flex items-center gap-2 ${
                      copied === 'Password'
                        ? 'bg-orange-600 text-white'
                        : 'bg-orange-600 hover:bg-orange-700 text-white'
                    }`}
                  >
                    {copied === 'Password' ? '✓' : <Copy size={18} />}
                  </button>
                </div>
              </div>

              {/* Port (if custom) */}
              {serverData.port && serverData.port !== 25565 && (
                <div>
                  <label className="text-xs text-gray-500 uppercase font-bold tracking-wide">
                    🔌 Server Port
                  </label>
                  <div className="flex mt-2 gap-2">
                    <code className="flex-1 bg-black/60 p-4 rounded-lg font-mono text-purple-400 text-sm border border-purple-500/20">
                      {serverData.port}
                    </code>
                    <button 
                      onClick={() => copyToClipboard(String(serverData.port), 'Port')}
                      className={`px-4 rounded-lg font-bold transition flex items-center gap-2 ${
                        copied === 'Port'
                          ? 'bg-purple-600 text-white'
                          : 'bg-purple-600 hover:bg-purple-700 text-white'
                      }`}
                    >
                      {copied === 'Port' ? '✓' : <Copy size={18} />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Server Status Card */}
          <div className="bg-gray-900 p-8 rounded-2xl border border-gray-800">
            <h3 className="flex items-center text-lg font-bold mb-6 text-blue-400">
              <ShieldCheck className="w-6 h-6 mr-2" /> 
              Server Health
            </h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Status</span>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
                    <span className="text-yellow-400 font-bold text-sm">Starting...</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Location</span>
                  <span className="text-white font-bold">{serverData.location || 'US-East'}</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">DDoS Protection</span>
                  <span className="text-green-400 font-bold">ACTIVE</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Estimated Time</span>
                  <span className="text-white font-bold flex items-center gap-1">
                    <Clock size={14} /> 2-3 min
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-700">
                <div className="flex items-start gap-2 text-xs">
                  <Zap size={14} className="text-green-400 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-300">
                    Your server is auto-scaling. Performance optimized for <strong>{serverData.memory}GB RAM</strong>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* EULA Alert */}
        <div className="bg-amber-900/20 border-l-4 border-amber-500 p-6 rounded-lg mb-8">
          <div className="flex gap-4">
            <AlertCircle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-bold text-amber-300 mb-2">⚡ Important: Accept the Minecraft EULA</h4>
              <p className="text-amber-100 text-sm mb-3">
                Before your server can start, you must accept the Minecraft End User License Agreement. This prevents the server from staying idle.
              </p>
              <p className="text-amber-100/70 text-xs">
                Go to the Console tab in your panel and accept the EULA, or the server won't run!
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <a 
            href={serverData.panelUrl || '#'} 
            target="_blank"
            rel="noopener noreferrer"
            className="bg-purple-600 hover:bg-purple-700 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-purple-900/50 text-white"
          >
            Open Control Panel
            <ExternalLink size={20} />
          </a>

          <button 
            onClick={onViewSetupGuide}
            className="bg-gray-700 hover:bg-gray-600 py-4 rounded-xl font-bold transition text-white"
          >
            📖 Setup Guide
          </button>

          <button 
            onClick={() => window.location.href = 'https://www.minecraft.net/en-us/download'} 
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gray-700 hover:bg-gray-600 py-4 rounded-xl font-bold transition text-white flex items-center justify-center gap-2"
          >
            Get Minecraft
            <ExternalLink size={20} />
          </button>
        </div>

        {/* Quick Tips */}
        <div className="mt-10 grid md:grid-cols-2 gap-6 pt-8 border-t border-gray-800">
          <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-800">
            <h4 className="font-bold text-green-400 mb-3 flex items-center gap-2">
              <CheckCircle size={18} /> Quick Start
            </h4>
            <ol className="text-sm text-gray-400 space-y-2">
              <li>1. Open Minecraft Java Edition</li>
              <li>2. Click "Multiplayer"</li>
              <li>3. Add Server (use address above)</li>
              <li>4. Join and start playing!</li>
            </ol>
          </div>

          <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-800">
            <h4 className="font-bold text-blue-400 mb-3 flex items-center gap-2">
              <Terminal size={18} /> Need Help?
            </h4>
            <p className="text-sm text-gray-400">
              Check our <a href="#" className="text-blue-400 hover:text-blue-300 underline">documentation</a> or email <code className="bg-black/40 px-2 py-1 rounded text-blue-300">support@lighth.io</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeploymentSuccess;
