import React, { useState, useEffect } from 'react';
import { Folder, FileText, Settings, FileCode, ChevronRight, Upload, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiCall } from '../lib/api';

const FileManager = ({ serverId }) => {
  const [currentPath, setCurrentPath] = useState(['home']);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFiles();
  }, [serverId]);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      const pathQuery = currentPath.length > 1 ? '/' + currentPath.slice(1).join('/') : '';
      const response = await apiCall(`/api/servers/${serverId}/files?path=${encodeURIComponent(pathQuery)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch files');
      }

      const data = await response.json();
      setFiles(data.files || []);
    } catch (error) {
      console.error('Error fetching files:', error);
      toast.error('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (type) => {
    switch (type) {
      case 'folder': return <Folder className="text-blue-400" size={16} />;
      case 'config': return <Settings className="text-gray-400" size={16} />;
      case 'json': return <FileCode className="text-yellow-400" size={16} />;
      case 'archive': return <FileCode className="text-purple-400" size={16} />;
      case 'text': return <FileText className="text-slate-400" size={16} />;
      default: return <FileText className="text-slate-400" size={16} />;
    }
  };

  const handleNavigate = (file) => {
    if (file.isDirectory) {
      setCurrentPath([...currentPath, file.name]);
      fetchFiles();
    }
  };

  const handleBreadcrumbClick = (index) => {
    setCurrentPath(currentPath.slice(0, index + 1));
    fetchFiles();
  };

  return (
    <div className="bg-brand.darker rounded-2xl border border-brand.border overflow-hidden">
      <div className="p-4 bg-brand.card flex justify-between items-center border-b border-brand.border">
        <div className="flex items-center space-x-2 text-sm">
          {currentPath.map((path, index) => (
            <React.Fragment key={index}>
              <span 
                onClick={() => handleBreadcrumbClick(index)}
                className="text-slate-400 hover:text-accent cursor-pointer capitalize"
              >
                {path}
              </span>
              {index < currentPath.length - 1 && <ChevronRight size={14} className="text-slate-600" />}
            </React.Fragment>
          ))}
        </div>
        <div className="flex space-x-2">
          <button className="p-2 bg-brand.darkest hover:bg-slate-700 rounded-lg text-slate-300 transition"><Upload size={18} /></button>
          <button className="p-2 bg-brand.darkest hover:bg-slate-700 rounded-lg text-slate-300 transition"><Plus size={18} /></button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-brand.darkest/50 text-slate-500 uppercase text-xs">
            <tr>
              <th className="px-6 py-3 font-bold">Name</th>
              <th className="px-6 py-3 font-bold">Type</th>
              <th className="px-6 py-3 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand.border">
            {loading ? (
              <tr>
                <td colSpan="3" className="px-6 py-4 text-center text-slate-400">Loading files...</td>
              </tr>
            ) : files.length === 0 ? (
              <tr>
                <td colSpan="3" className="px-6 py-4 text-center text-slate-400">No files in this directory</td>
              </tr>
            ) : (
              files.map((file, i) => (
                <tr 
                  key={i} 
                  onClick={() => handleNavigate(file)}
                  className={`hover:bg-accent/5 transition-colors ${file.isDirectory ? 'cursor-pointer' : 'cursor-default'} group`}
                >
                  <td className="px-6 py-4 flex items-center space-x-3">
                    {getFileIcon(file.type)}
                    <span className="font-medium text-slate-200 group-hover:text-accent">{file.name}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-xs">
                    {file.isDirectory ? 'Folder' : file.type}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-slate-600 hover:text-status.offline transition"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FileManager;
