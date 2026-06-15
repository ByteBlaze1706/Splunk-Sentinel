// src/app/register/page.js
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldAlert, ArrowRight, UserPlus } from 'lucide-react';
import { signUpUser } from '../../utils/supabaseClient';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Security Analyst');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      setError('Please fill in all profile fields.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    const { data, error: err } = await signUpUser(email, password, fullName, role);
    setLoading(false);

    if (err) {
      setError(err.message);
    } else {
      setSuccess('Analyst profile created successfully! Redirecting to login terminal...');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    }
  };

  return (
    <main className="min-h-screen bg-cyber-bg text-slate-300 flex flex-col items-center justify-center p-4 relative overflow-hidden font-mono">
      {/* Background cyber grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00f0ff03_1px,transparent_1px),linear-gradient(to_bottom,#00f0ff03_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
      
      {/* Glow shapes */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyber-cyan/5 rounded-full filter blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyber-red/5 rounded-full filter blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-cyber-card/65 border border-cyber-border rounded-lg p-6 relative z-10 shadow-lg backdrop-blur-md">
        
        {/* Branding Title */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center justify-center p-3 border border-cyber-cyan/30 bg-cyber-cyan/5 rounded-full mb-1">
            <UserPlus className="w-8 h-8 text-cyber-cyan filter drop-shadow-[0_0_8px_#00f0ff]" />
          </div>
          <h1 className="text-2xl font-bold tracking-widest text-white text-shadow-cyan uppercase">
            REGISTRATION <span className="text-cyber-cyan">DESK</span>
          </h1>
          <div className="text-[10px] text-cyber-cyan/80 font-bold border border-cyber-cyan/20 bg-cyber-cyan/5 py-0.5 px-2 rounded inline-block">
            CREATE PROFILES FOR SECURITY REPOSITORIES
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 border border-cyber-red/30 bg-cyber-red/10 text-cyber-red rounded text-xs leading-relaxed flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 flex-shrink-0 animate-pulse" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 border border-cyber-green/30 bg-cyber-green/10 text-cyber-green rounded text-xs leading-relaxed flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] uppercase text-cyber-gray tracking-wider block">Full Profile Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full p-2.5 bg-cyber-bg border border-cyber-border rounded text-xs text-cyber-cyan focus:outline-none focus:border-cyber-cyan focus:shadow-cyan-glow"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase text-cyber-gray tracking-wider block">Analyst Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john.doe@sentinel.local"
              className="w-full p-2.5 bg-cyber-bg border border-cyber-border rounded text-xs text-cyber-cyan focus:outline-none focus:border-cyber-cyan focus:shadow-cyan-glow"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase text-cyber-gray tracking-wider block">Security Key</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-2.5 bg-cyber-bg border border-cyber-border rounded text-xs text-cyber-cyan focus:outline-none focus:border-cyber-cyan focus:shadow-cyan-glow"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase text-cyber-gray tracking-wider block">Assign Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full p-2.5 bg-cyber-bg border border-cyber-border rounded text-xs text-cyber-cyan focus:outline-none focus:border-cyber-cyan"
              >
                <option value="Admin">Admin</option>
                <option value="Security Analyst">Security Analyst</option>
                <option value="Viewer">Viewer</option>
              </select>
            </div>
          </div>

          <div className="text-center text-[10px] font-bold">
            <Link href="/login" className="text-cyber-cyan hover:underline">
              Already have an analyst profile? Login
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-cyber-cyan text-cyber-bg border border-cyber-cyan rounded font-bold text-xs hover:bg-transparent hover:text-cyber-cyan hover:shadow-cyan-glow transition-all flex items-center justify-center gap-2 cursor-pointer uppercase"
          >
            {loading ? 'Submitting Registry...' : 'Register Profile'}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

      </div>
    </main>
  );
}
