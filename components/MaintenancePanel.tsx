import React, { useState, useEffect, useMemo } from 'react';
import { AppData, BackupEntry, ModuleLocks } from '../types';
import { 
  ShieldCheck, RefreshCw, Clock, Lock, Unlock, Download, Upload, Database, ExternalLink, Camera, Sparkles,
  CalendarDays, CalendarRange, History
} from 'lucide-react';
import { getCloudBackups, createCloudBackup } from '../services/firebase';
import { format, differenceInDays } from 'date-fns';

interface Props {
  data: AppData;
  onUpdate: (newData: AppData) => void;
}

export const MaintenancePanel: React.FC<Props> = ({ data, onUpdate }) => {
  const [backups, setBackups] = useState<Partial<BackupEntry>[]>([]);
  const [loading, setLoading] = useState(false);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [activeTab, setActiveTab] = useState<'Backups' | 'Safety' | 'Locks'>('Backups');

  const FIREBASE_CONSOLE_URL = "https://console.firebase.google.com/project/dps-staff-portal/firestore/data";

  const fetchBackups = async () => {
    setLoading(true);
    const list = await getCloudBackups();
    setBackups(list);
    setLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'Backups') fetchBackups();
  }, [activeTab]);

  // Logic to identify Key Restore Points (Daily, Weekly, Monthly)
  const keyRestorePoints = useMemo(() => {
    if (backups.length === 0) return { daily: null, weekly: null, monthly: null };

    const sorted = [...backups].sort((a, b) => 
      new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime()
    );

    const now = new Date();
    
    // Find latest backup that is at least 1 day old for "Daily"
    const daily = sorted.find(b => differenceInDays(now, new Date(b.timestamp!)) >= 1);
    
    // Find latest backup that is at least 7 days old for "Weekly"
    const weekly = sorted.find(b => differenceInDays(now, new Date(b.timestamp!)) >= 7);
    
    // Find latest backup that is at least 30 days old for "Monthly"
    const monthly = sorted.find(b => differenceInDays(now, new Date(b.timestamp!)) >= 30);

    return { daily, weekly, monthly };
  }, [backups]);

  const handleCreateSnapshot = async () => {
    if (creatingBackup) return;
    setCreatingBackup(true);
    try {
        await createCloudBackup(data, 'Manual');
        await fetchBackups();
        alert("Manual Snapshot created successfully!");
    } catch (err) {
        alert("Failed to create snapshot.");
    } finally {
        setCreatingBackup(false);
    }
  };

  const toggleModuleLock = (module: keyof ModuleLocks) => {
    const currentLocks = data.moduleLocks || { Hall: false, Attendance: false, Finance: false };
    const newState = !currentLocks[module];
    onUpdate({
        ...data,
        moduleLocks: { ...currentLocks, [module]: newState }
    });
  };

  const handleRestore = (backup: BackupEntry) => {
    if (confirm(`CRITICAL WARNING: You are about to restore data from ${format(new Date(backup.timestamp), 'PPPP p')}. This will delete all changes made after that time. Are you sure?`)) {
       onUpdate({ ...backup.data, systemLocked: false });
       alert("System Restored Successfully!");
    }
  };

  return (
    <div className="flex-1 flex flex-col p-8 overflow-hidden bg-slate-50">
      <div className="max-w-6xl mx-auto w-full space-y-8 h-full flex flex-col">
        
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
                    <ShieldCheck size={32} />
                </div>
                <div>
                    <h2 className="text-3xl font-black text-[#1B254B] uppercase tracking-tighter leading-none">Maintenance & Recovery</h2>
                    <p className="text-xs font-bold text-slate-400 uppercase mt-1 tracking-widest">Admin Control • Data Integrity • Cloud Snapshots</p>
                </div>
            </div>

            <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200">
                {(['Backups', 'Safety', 'Locks'] as const).map(tab => (
                    <button 
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${
                            activeTab === tab ? 'bg-[#1B254B] text-white shadow-lg' : 'text-slate-500 hover:text-[#1B254B]'
                        }`}
                    >
                        {tab === 'Locks' ? 'Module Locks' : tab}
                    </button>
                ))}
            </div>
        </div>

        <div className="flex-1 bg-white rounded-[40px] shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            
            {activeTab === 'Locks' && (
                <div className="p-12 space-y-10">
                    <div className="text-center max-w-xl mx-auto">
                        <h3 className="text-2xl font-black text-[#1B254B] uppercase mb-2">Module Security Matrix</h3>
                        <p className="text-sm text-slate-500 font-medium">When locked, users can view data but CANNOT add, edit, or delete any records. Locks are applied instantly 100%.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {(['Hall', 'Attendance', 'Finance'] as const).map(module => {
                            const isLocked = data.moduleLocks?.[module] || false;
                            return (
                                <div key={module} className={`p-8 rounded-[32px] border-2 transition-all flex flex-col items-center text-center gap-4 ${isLocked ? 'border-red-100 bg-red-50/30' : 'border-slate-100 bg-white hover:border-indigo-100'}`}>
                                    <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-2 ${isLocked ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-slate-100 text-slate-400'}`}>
                                        {isLocked ? <Lock size={32} /> : <Unlock size={32} />}
                                    </div>
                                    <div>
                                        <h4 className="font-black text-[#1B254B] uppercase text-lg">{module} Study</h4>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Status: {isLocked ? 'Locked (100%)' : 'Open'}</p>
                                    </div>
                                    <button 
                                        onClick={() => toggleModuleLock(module)}
                                        className={`mt-4 w-full py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${isLocked ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-red-500 text-white shadow-lg shadow-red-500/20'}`}
                                    >
                                        {isLocked ? `Unlock ${module}` : `Lock ${module} 100%`}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {activeTab === 'Backups' && (
                <div className="flex flex-col h-full overflow-hidden">
                    <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <div className="flex items-center gap-4">
                             <History className="text-emerald-500" />
                             <div>
                                <h3 className="text-xl font-black text-[#1B254B] uppercase">Restore Hub</h3>
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-tighter">Recover accidentally deleted data from previous states</p>
                             </div>
                        </div>
                        <div className="flex gap-3">
                            <button 
                                onClick={handleCreateSnapshot}
                                disabled={creatingBackup}
                                className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all disabled:opacity-50"
                            >
                                {creatingBackup ? <RefreshCw size={18} className="animate-spin" /> : <Camera size={18} />} 
                                {creatingBackup ? 'Saving State...' : 'Manual Snapshot'}
                            </button>
                            <button onClick={fetchBackups} className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:text-primary-500 transition-all shadow-sm">
                                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                        
                        {/* Summary restore points */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                { label: 'Daily Restore', point: keyRestorePoints.daily, icon: CalendarDays, color: 'blue' },
                                { label: 'Weekly Restore', point: keyRestorePoints.weekly, icon: CalendarRange, color: 'indigo' },
                                { label: 'Monthly Restore', point: keyRestorePoints.monthly, icon: CalendarDays, color: 'purple' }
                            ].map((item, idx) => (
                                <div key={idx} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col items-center text-center gap-4 hover:border-primary-500 transition-all group">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform`}>
                                        <item.icon size={28} />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-[#1B254B] uppercase">{item.label}</h4>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">
                                            {item.point ? format(new Date(item.point.timestamp!), 'PP') : 'No Point Found'}
                                        </p>
                                    </div>
                                    <button 
                                        disabled={!item.point}
                                        onClick={() => handleRestore(item.point as BackupEntry)}
                                        className={`mt-2 w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                            item.point ? 'bg-slate-800 text-white hover:bg-black' : 'bg-slate-50 text-slate-300 cursor-not-allowed'
                                        }`}
                                    >
                                        Restore this point
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[4px] pl-2 mb-4">Detailed Snapshot History</h3>
                            {backups.length === 0 && !loading ? (
                                <div className="text-center py-20 bg-slate-50/50 rounded-[40px] border-2 border-dashed border-slate-100">
                                    <Sparkles className="mx-auto text-slate-200 mb-4" size={48} />
                                    <p className="font-black text-slate-300 uppercase tracking-widest text-sm">No snapshots found yet</p>
                                </div>
                            ) : backups.map((b) => (
                                <div key={b.id} className="bg-white border border-slate-100 p-6 rounded-[30px] flex items-center justify-between hover:border-indigo-500 transition-all group shadow-sm">
                                    <div className="flex items-center gap-6">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${b.type === 'Auto' ? 'bg-emerald-500 text-white' : 'bg-green-500 text-white'}`}>
                                            <Clock size={24} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="text-lg font-black text-[#1B254B] uppercase leading-none">{b.type} Snapshot</h4>
                                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${b.type === 'Auto' ? 'bg-emerald-100 text-emerald-600' : 'bg-green-100 text-green-600'}`}>
                                                    {b.type === 'Auto' ? 'AUTO' : 'MANUAL'}
                                                </span>
                                            </div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{format(new Date(b.timestamp!), 'PPPP p')}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button 
                                            onClick={() => handleRestore(b as BackupEntry)} 
                                            className="px-6 py-3 bg-red-500 text-white rounded-2xl text-[10px] font-black uppercase shadow-lg hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            Restore Now
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Direct Link to Firebase */}
                        <div className="bg-indigo-50 border border-indigo-200 p-6 rounded-[30px] flex items-center justify-between mt-8">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
                                    <Database size={24} />
                                </div>
                                <div>
                                    <h4 className="font-black text-indigo-900 uppercase text-sm">Deep Cloud Infrastructure</h4>
                                    <p className="text-xs text-indigo-700 font-medium">Access master database snapshots directly in Google Firebase.</p>
                                </div>
                            </div>
                            <a 
                                href={FIREBASE_CONSOLE_URL} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase shadow-lg shadow-indigo-500/20 flex items-center gap-2 hover:bg-indigo-700 transition-all"
                            >
                                Open Cloud Console <ExternalLink size={14} />
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'Safety' && (
                <div className="p-12 space-y-12 max-w-2xl mx-auto w-full overflow-y-auto">
                    <div className="text-center">
                        <h3 className="text-2xl font-black text-[#1B254B] uppercase mb-1">Manual Data Portability</h3>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Physical backups for your own Google Drive or PC</p>
                    </div>

                    <div className="grid gap-6">
                        <div className="bg-slate-50 rounded-[32px] p-8 border border-slate-200 flex items-center gap-8 shadow-sm">
                            <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-primary-500 shadow-xl border border-slate-100">
                                <Download size={32} />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-black text-[#1B254B] uppercase">Download Database File</h4>
                                <p className="text-xs text-slate-500 mt-1">Export your entire school data as a JSON file. We recommend doing this once a week and uploading it to your Google Drive.</p>
                                <button 
                                    onClick={() => { const blob = new Blob([JSON.stringify(data)], {type: 'application/json'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `dpss_backup_${format(new Date(), 'yyyy-MM-dd')}.json`; a.click(); }}
                                    className="mt-4 px-6 py-2 bg-primary-500 text-white rounded-xl text-[10px] font-black uppercase hover:scale-105 active:scale-95 transition-transform shadow-lg shadow-primary-500/30"
                                >
                                    Export JSON
                                </button>
                            </div>
                        </div>

                        <div className="bg-slate-50 rounded-[32px] p-8 border border-slate-200 flex items-center gap-8 shadow-sm">
                            <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-emerald-500 shadow-xl border border-slate-100">
                                <Upload size={32} />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-black text-[#1B254B] uppercase">Import Backup File</h4>
                                <p className="text-xs text-slate-500 mt-1">Upload a previously exported JSON file to restore the portal state. This overwrites all current cloud data.</p>
                                <label className="inline-block mt-4 px-6 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase cursor-pointer hover:scale-105 active:scale-95 transition-transform shadow-lg shadow-emerald-500/30">
                                    Upload JSON
                                    <input type="file" className="hidden" accept=".json" onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        const reader = new FileReader();
                                        reader.onload = (event) => {
                                            try {
                                                const imported = JSON.parse(event.target?.result as string);
                                                if (imported.students && Array.isArray(imported.students)) {
                                                    if (confirm("Restore entire database from this file? Current data will be lost.")) {
                                                        onUpdate(imported);
                                                    }
                                                } else { alert("Invalid backup file."); }
                                            } catch (err) { alert("Error reading file."); }
                                        };
                                        reader.readAsText(file);
                                    }} />
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
      </div>
    </div>
  );
};