import React from 'react';

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[url('/bg-pattern.svg')] bg-cover">
      <div className="bg-brand.darker/80 backdrop-blur-xl p-8 rounded-3xl border border-brand.border w-full max-w-md shadow-2xl">
        <img src="/logo.png" className="h-12 mx-auto mb-8" alt="LightNode" />
        <h2 className="text-2xl font-bold text-center mb-6">Welcome Back</h2>
        <form className="space-y-4">
          <input type="email" placeholder="Email Address" className="w-full bg-brand.card border border-brand.border p-3 rounded-lg focus:ring-2 focus:ring-accent outline-none" />
          <input type="password" placeholder="Password" className="w-full bg-brand.card border border-brand.border p-3 rounded-lg focus:ring-2 focus:ring-accent outline-none" />
          <button className="w-full bg-accent hover:bg-accent/90 py-3 rounded-lg font-bold transition-all shadow-lg shadow-accent/20 text-white">
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
