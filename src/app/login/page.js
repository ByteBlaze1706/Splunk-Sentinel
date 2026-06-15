// src/app/login/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Database, ShieldAlert, KeyRound, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';
import { signInUser, getSessionUser } from '../../utils/supabaseClient';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If user already logged in, redirect to workspace
    const session = getSessionUser();
    if (session) {
      router.push('/');
    }
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all credentials.');
      return;
    }

    setLoading(true);
    setError('');

    const { data, error: err } = await signInUser(email, password);
    setLoading(false);

    if (err) {
      setError(err.message);
    } else {
      router.push('/');
    }
  };

  const triggerDemoLogin = async (demoEmail) => {
    setLoading(true);
    setError('');
    const { data, error: err } = await signInUser(demoEmail, 'password123');
    setLoading(false);

    if (err) {
      setError(err.message);
    } else {
      router.push('/');
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
            <ShieldAlert className="w-8 h-8 text-cyber-cyan filter drop-shadow-[0_0_8px_#00f0ff]" />
          </div>
          <h1 className="text-2xl font-bold tracking-widest text-white text-shadow-cyan uppercase">
            SPLUNK <span className="text-cyber-cyan">SENTINEL</span>
          </h1>
          <div className="text-[10px] text-cyber-cyan/80 font-bold border border-cyber-cyan/20 bg-cyber-cyan/5 py-0.5 px-2 rounded inline-block">
            V2.0 ENTERPRISE SOC TERMINAL
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 border border-cyber-red/30 bg-cyber-red/10 text-cyber-red rounded text-xs leading-relaxed flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 flex-shrink-0 animate-pulse" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] uppercase text-cyber-gray tracking-wider block">Analyst Email</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="analyst@splunksentinel.local"
                className="w-full p-2.5 pl-3 bg-cyber-bg border border-cyber-border rounded text-xs text-cyber-cyan focus:outline-none focus:border-cyber-cyan focus:shadow-cyan-glow"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase text-cyber-gray tracking-wider block">Security Key (Password)</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full p-2.5 pl-3 bg-cyber-bg border border-cyber-border rounded text-xs text-cyber-cyan focus:outline-none focus:border-cyber-cyan focus:shadow-cyan-glow"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] font-bold">
            <Link href="/forgot-password" className="text-cyber-cyan hover:underline">
              Reset Key?
            </Link>
            <Link href="/register" className="text-cyber-cyan hover:underline">
              Create Analyst Profile
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-cyber-cyan text-cyber-bg border border-cyber-cyan rounded font-bold text-xs hover:bg-transparent hover:text-cyber-cyan hover:shadow-cyan-glow transition-all flex items-center justify-center gap-2 cursor-pointer uppercase"
          >
            {loading ? 'Decrypting Credentials...' : 'Authenticate Analyst'}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Demo Roles Shortcut Panel */}
        <div className="mt-6 pt-5 border-t border-cyber-border/40">
          <p className="text-[9px] uppercase tracking-widest text-cyber-gray text-center mb-3">
            -- DEV PROFILE QUICK AUTHENTICATORS --
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => triggerDemoLogin('admin@splunksentinel.local')}
              className="py-2 border border-cyber-red/35 bg-cyber-red/5 hover:bg-cyber-red/20 text-cyber-red rounded text-[10px] font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-1"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>ADMIN</span>
            </button>

            <button
              onClick={() => triggerDemoLogin('analyst@splunksentinel.local')}
              className="py-2 border border-cyber-cyan/35 bg-cyber-cyan/5 hover:bg-cyber-cyan/20 text-cyber-cyan rounded text-[10px] font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-1"
            >
              <UserCheck className="w-4 h-4" />
              <span>ANALYST</span>
            </button>

            <button
              onClick={() => triggerDemoLogin('viewer@splunksentinel.local')}
              className="py-2 border border-cyber-gray/35 bg-cyber-gray/5 hover:bg-cyber-gray/20 text-cyber-gray rounded text-[10px] font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-1"
            >
              <Database className="w-4 h-4" />
              <span>VIEWER</span>
            </button>
          </div>
        </div>

      </div>

      <div className="absolute bottom-4 text-[9px] text-cyber-gray/60 tracking-wider">
        SPLUNK SENTINEL LOGICS v2.0.0 // ENCRYPTION AES-GCM ACTIVE
      </div>
    </main>
  );
}
