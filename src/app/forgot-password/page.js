// src/app/forgot-password/page.js
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft, Key } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setMessage('A security key decryption link has been issued to the registered email. Check inbox.');
    }, 1000);
  };

  return (
    <main className="min-h-screen bg-cyber-bg text-slate-300 flex flex-col items-center justify-center p-4 relative overflow-hidden font-mono">
      {/* Background cyber grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00f0ff03_1px,transparent_1px),linear-gradient(to_bottom,#00f0ff03_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>

      <div className="w-full max-w-md bg-cyber-card/65 border border-cyber-border rounded-lg p-6 relative z-10 shadow-lg backdrop-blur-md">
        
        {/* Branding Title */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center justify-center p-3 border border-cyber-cyan/30 bg-cyber-cyan/5 rounded-full mb-1">
            <Key className="w-8 h-8 text-cyber-cyan filter drop-shadow-[0_0_8px_#00f0ff]" />
          </div>
          <h1 className="text-2xl font-bold tracking-widest text-white text-shadow-cyan uppercase">
            RESET <span className="text-cyber-cyan">KEY</span>
          </h1>
          <div className="text-[10px] text-cyber-cyan/80 font-bold border border-cyber-cyan/20 bg-cyber-cyan/5 py-0.5 px-2 rounded inline-block">
            RECOVER SECURITY LOG CREDENTIALS
          </div>
        </div>

        {message && (
          <div className="mb-4 p-3 border border-cyber-green/30 bg-cyber-green/10 text-cyber-green rounded text-xs leading-relaxed flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleReset} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] uppercase text-cyber-gray tracking-wider block">Registered Analyst Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="analyst@sentinel.local"
              className="w-full p-2.5 bg-cyber-bg border border-cyber-border rounded text-xs text-cyber-cyan focus:outline-none focus:border-cyber-cyan focus:shadow-cyan-glow"
              required
            />
          </div>

          <div className="text-center text-[10px] font-bold">
            <Link href="/login" className="text-cyber-cyan hover:underline flex items-center justify-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Login Terminal
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-cyber-cyan text-cyber-bg border border-cyber-cyan rounded font-bold text-xs hover:bg-transparent hover:text-cyber-cyan hover:shadow-cyan-glow transition-all flex items-center justify-center gap-2 cursor-pointer uppercase"
          >
            {loading ? 'Issuing Decryption Link...' : 'Issue Reset Request'}
          </button>
        </form>

      </div>
    </main>
  );
}
