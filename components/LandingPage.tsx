import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, User, Lock, Users } from 'lucide-react';
import { UserRole } from '../types';

interface Props {
  onLogin: (name: string, role: UserRole, pin: string) => void;
}

export const LandingPage: React.FC<Props> = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('Teacher');
  const [pin, setPin] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && pin.trim()) {
      onLogin(name, role, pin);
    }
  };

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/[0.02] backdrop-blur-[2px] rounded-[40px] shadow-2xl overflow-hidden border border-white/5">
        <div className="bg-orange-500/10 p-8 text-center backdrop-blur-[4px] border-b border-white/5">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-[4px] border border-white/10">
            <ShieldCheck className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-1 uppercase tracking-tighter shadow-sm">DPSS Khmer PORTAL</h1>
          <p className="text-slate-700 text-[10px] font-black uppercase tracking-[4px]">Staff Secure Login</p>
        </div>
        
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Role Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Select Your Role</label>
              <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('Teacher')}
                    className={`text-sm py-3 px-4 rounded-lg border transition-all flex items-center justify-center gap-2 font-medium ${
                      role === 'Teacher' 
                      ? 'bg-slate-800 text-white border-slate-800 shadow-md' 
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Users size={16} /> Teacher / Assistant
                  </button>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={() => setRole('Finance')}
                        className={`text-sm py-2 px-3 rounded-lg border transition-all flex items-center justify-center gap-2 ${
                        role === 'Finance' 
                        ? 'bg-slate-800 text-white border-slate-800 shadow-md' 
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                        Finance
                    </button>
                    <button
                        type="button"
                        onClick={() => setRole('Admin')}
                        className={`text-sm py-2 px-3 rounded-lg border transition-all flex items-center justify-center gap-2 ${
                        role === 'Admin' 
                        ? 'bg-slate-800 text-white border-slate-800 shadow-md' 
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                        Admin
                    </button>
                  </div>
              </div>
            </div>

            {/* Name Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Your Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sok Heng"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* PIN Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Security PIN</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="password" 
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Enter PIN"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  required
                />
              </div>
            </div>
            
            <button 
              type="submit"
              className="w-full py-3 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-primary-500/30 mt-4"
            >
              Login to Portal <ArrowRight size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};