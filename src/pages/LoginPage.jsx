import React, { useState } from 'react';
import { Mail, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';
import { apiCall } from '../lib/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const response = await apiCall('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(form)
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || 'Login failed');
        return;
      }

      // Store token and user info
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      toast.success('✅ Logged in successfully!');
      setTimeout(() => navigate('/dashboard'), 500);
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Connection error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand.darkest to-brand.darker flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-brand.darker/80 backdrop-blur-xl p-8 rounded-3xl border border-brand.border shadow-2xl">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">⚡</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-center mb-2">Welcome Back</h1>
          <p className="text-center text-slate-400 mb-8">Sign in to LightNode Hosting</p>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm text-slate-300 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="w-full bg-white border border-brand.border rounded-lg p-3 pl-10 text-black placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent transition"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm text-slate-300 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full bg-white border border-brand.border rounded-lg p-3 pl-10 text-black placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent transition"
                />
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent hover:bg-accent/90 disabled:bg-slate-600 text-white font-bold py-3 rounded-lg transition duration-200 mt-6"
            >
              {loading ? '🔄 Signing In...' : '🚀 Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-brand.border"></div>
            <span className="px-3 text-slate-500 text-sm">New to LightNode?</span>
            <div className="flex-1 border-t border-brand.border"></div>
          </div>

          {/* Register Link */}
          <p className="text-center text-slate-400 text-sm">
            <Link to="/register" className="text-accent hover:underline font-semibold">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
