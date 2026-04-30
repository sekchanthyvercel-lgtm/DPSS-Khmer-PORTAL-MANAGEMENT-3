import React, { useMemo } from 'react';
import { AppData, Student } from '../types';
import { Users, Clock, BookOpen, GraduationCap, ArrowRight } from 'lucide-react';

interface StatCardProps {
  title: string;
  total: number;
  breakdown: Record<string, number>;
  icon: any;
  isAssistant: boolean;
  onClick: () => void;
}

const getNameBg = (name: string, isAssistant: boolean) => {
  const assistants = [
    'from-indigo-50/50 to-indigo-100/30',
    'from-rose-50/50 to-rose-100/30',
    'from-emerald-50/50 to-emerald-100/30',
    'from-amber-50/50 to-amber-100/30',
    'from-violet-50/50 to-violet-100/30',
    'from-cyan-50/50 to-cyan-100/30',
    'from-pink-50/50 to-pink-100/30',
    'from-sky-50/50 to-sky-100/30'
  ];
  const teachers = [
    'from-slate-50/50 to-slate-100/30',
    'from-blue-50/50 to-indigo-100/30',
    'from-teal-50/50 to-emerald-100/30',
    'from-orange-50/50 to-red-100/30',
    'from-purple-50/50 to-fuchsia-100/30',
    'from-pink-50/50 to-rose-100/30',
    'from-green-50/50 to-teal-100/30',
    'from-red-50/50 to-rose-100/30'
  ];
  const palette = isAssistant ? assistants : teachers;
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palette[Math.abs(hash) % palette.length];
};

const StatCard: React.FC<StatCardProps> = ({ title, total, breakdown, icon: Icon, isAssistant, onClick }) => {
  const bgGradient = getNameBg(title, isAssistant);
  
  const handleCardClick = (e: React.MouseEvent) => {
    // If user is selecting text, don't trigger the click navigation
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      return;
    }
    onClick();
  };

  return (
    <div className="bg-white/40 backdrop-blur-md rounded-[32px] overflow-hidden border border-white/60 shadow-xl hover:shadow-2xl transition-all group flex flex-col h-full cursor-pointer" onClick={handleCardClick}>
      {/* Top Header with Name */}
      <div className={`p-5 bg-gradient-to-br ${bgGradient} text-slate-900 border-b border-white/20`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-white/40 rounded-xl flex items-center justify-center backdrop-blur-md shadow-sm">
                <Icon size={20} strokeWidth={3} className={isAssistant ? 'text-indigo-600' : 'text-slate-600'} />
             </div>
             <h3 className="text-base font-black uppercase tracking-tight truncate max-w-[140px] drop-shadow-sm">{title}</h3>
          </div>
          <div className="text-right">
             <p className="text-[10px] font-black opacity-60 uppercase tracking-widest leading-none mb-1">Students</p>
             <p className="text-2xl font-black tracking-tighter leading-none">{total}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">Schedule Breakdown</p>
          <span className="px-2 py-0.5 bg-white/50 rounded-full text-[8px] font-black text-slate-400 uppercase tracking-widest border border-white/40">
            {Object.keys(breakdown).length} Sessions
          </span>
        </div>
        
        <div className="space-y-2">
          {Object.entries(breakdown).sort((a: any, b: any) => b[1] - a[1]).map(([time, count]: any) => (
            <div key={time} className="flex items-center justify-between p-3 bg-white/50 rounded-2xl border border-white/40 group-hover:bg-white/70 transition-all">
              <div className="flex items-center gap-2">
                <Clock size={12} className="text-slate-400" />
                <span className="text-[9px] font-black text-slate-700 uppercase tracking-tight truncate max-w-[120px]">{time}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-black ${isAssistant ? 'text-orange-500' : 'text-emerald-500'} leading-none`}>{count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-6 py-4 border-t border-slate-200/50 flex items-center justify-between text-slate-400 group-hover:text-orange-500 transition-colors bg-white/20">
        <span className="text-[9px] font-black uppercase tracking-widest">Detail View</span>
        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  );
};

interface Props {
  data: AppData;
  students: Student[];
  onSelectTeacher?: (name: string) => void;
  onSelectAssistant?: (name: string) => void;
  filters?: any;
  setFilters?: (f: any) => void;
  uniqueTeachers?: string[];
  uniqueAssistants?: string[];
}

export const Dashboard: React.FC<Props> = ({ 
  data, students, onSelectTeacher, onSelectAssistant,
  filters, setFilters, uniqueTeachers = [], uniqueAssistants = [] 
}) => {
  const activeStudents = useMemo(() => 
    students.filter(s => !s.isHidden),
  [students]);

  const teacherStats = useMemo(() => {
    const stats: Record<string, { total: number; times: Record<string, number> }> = {};
    activeStudents.forEach(s => {
      if (!s.teachers) return;
      const tList = s.teachers.split(/[&+,\/]+/).map(t => t.trim()).filter(Boolean);
      tList.forEach(t => {
        if (!stats[t]) stats[t] = { total: 0, times: {} };
        stats[t].total++;
        if (s.time) {
          stats[t].times[s.time] = (stats[t].times[s.time] || 0) + 1;
        }
      });
    });
    return Object.entries(stats);
  }, [activeStudents]);

  const assistantStats = useMemo(() => {
    const stats: Record<string, { total: number; times: Record<string, number> }> = {};
    activeStudents.forEach(s => {
      if (!s.assistant) return;
      const aList = s.assistant.split(/[&+,\/]+/).map(a => a.trim()).filter(Boolean);
      aList.forEach(a => {
        if (a === 'N/A') return;
        if (!stats[a]) stats[a] = { total: 0, times: {} };
        stats[a].total++;
        if (s.time) {
          stats[a].times[s.time] = (stats[a].times[s.time] || 0) + 1;
        }
      });
    });
    return Object.entries(stats);
  }, [activeStudents]);

  const filteredTeachers = useMemo(() => {
    // Hide entire section if assistant is selected specifically
    if (filters?.assistant && !filters?.teacher && !filters?.searchQuery) return [];
    
    let list = teacherStats;
    if (filters?.searchQuery) {
        list = list.filter(([name]) => name.toLowerCase().includes(filters.searchQuery.toLowerCase()));
    }
    if (filters?.teacher) {
        list = list.filter(([name]) => name.toUpperCase() === filters.teacher.toUpperCase());
    }
    return list.sort((a, b) => b[1].total - a[1].total);
  }, [teacherStats, filters]);

  const filteredAssistants = useMemo(() => {
    // Hide entire section if teacher is selected specifically
    if (filters?.teacher && !filters?.assistant && !filters?.searchQuery) return [];
    
    let list = assistantStats;
    if (filters?.searchQuery) {
        list = list.filter(([name]) => name.toLowerCase().includes(filters.searchQuery.toLowerCase()));
    }
    if (filters?.assistant) {
        list = list.filter(([name]) => name.toUpperCase() === filters.assistant.toUpperCase());
    }
    return list.sort((a, b) => b[1].total - a[1].total);
  }, [assistantStats, filters]);

  const filterSelectStyle = "bg-white/40 backdrop-blur-md border border-white/60 rounded-2xl px-10 py-2.5 text-[11px] font-black text-slate-700 uppercase tracking-widest outline-none focus:ring-2 focus:ring-orange-500/50 appearance-none min-w-[180px] shadow-sm cursor-pointer";

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-6 md:p-8">
      {/* Header with Stats */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 bg-white/20 backdrop-blur-md p-6 rounded-[32px] border border-white/40 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-indigo-600/30">
            <Users size={32} strokeWidth={3} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-[#1B254B] uppercase tracking-tighter leading-none">Dashboard</h1>
            <p className="text-[10px] font-black text-slate-500 uppercase mt-2 tracking-[4px] opacity-70">DPSS Management Overview</p>
          </div>
        </div>

        {/* Global Search & Filters */}
        <div className="flex flex-wrap items-center gap-3">
            <div className="relative group flex-1 min-w-[240px]">
                <Clock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search staff name..."
                  value={filters?.searchQuery || ''}
                  onChange={e => setFilters?.({ ...filters, searchQuery: e.target.value })}
                  className="w-full bg-white/40 backdrop-blur-md border border-white/60 rounded-2xl pl-12 pr-4 py-3 text-xs font-black text-slate-800 uppercase tracking-widest outline-none focus:ring-2 focus:ring-orange-500/50 shadow-sm"
                />
            </div>
            
            <div className="relative">
                <Users size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
                <select 
                  value={filters?.teacher || ''} 
                  onChange={e => setFilters?.({ ...filters, teacher: e.target.value })}
                  className={filterSelectStyle}
                >
                    <option value="">Teachers</option>
                    {uniqueTeachers.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>

            <div className="relative">
                <Users size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
                <select 
                  value={filters?.assistant || ''} 
                  onChange={e => setFilters?.({ ...filters, assistant: e.target.value })}
                  className={filterSelectStyle}
                >
                    <option value="">Assistants</option>
                    {uniqueAssistants.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
            </div>
            
            <button 
              onClick={() => setFilters?.({ searchQuery: '', teacher: '', assistant: '' })}
              className="px-4 py-3 bg-red-500/10 text-red-500 rounded-2xl border border-red-500/20 hover:bg-red-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest shadow-sm"
            >
                Reset
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-20">
        <div className="space-y-16">
          {/* Teachers Section */}
          <section>
            <div className="flex items-center gap-4 mb-8 px-2">
              <div className="w-10 h-10 bg-emerald-500/20 text-emerald-600 rounded-2xl flex items-center justify-center">
                <BookOpen size={20} strokeWidth={3} />
              </div>
              <div>
                <h2 className="text-lg font-black text-[#1B254B] uppercase tracking-[6px] leading-none">Teachers</h2>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{filteredTeachers.length} Staff Members</p>
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-slate-200/50 to-transparent ml-4" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredTeachers.map(([name, stat]) => (
                <StatCard 
                  key={name}
                  title={name}
                  total={stat.total}
                  breakdown={stat.times}
                  icon={GraduationCap}
                  isAssistant={false}
                  onClick={() => onSelectTeacher?.(name)}
                />
              ))}
              {filteredTeachers.length === 0 && (
                <div className="col-span-full py-12 text-center bg-white/20 rounded-[32px] border border-dashed border-slate-300">
                    <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No teachers found matching your search</p>
                </div>
              )}
            </div>
          </section>

          {/* Assistants Section */}
          <section>
            <div className="flex items-center gap-4 mb-8 px-2">
              <div className="w-10 h-10 bg-orange-500/20 text-orange-600 rounded-2xl flex items-center justify-center">
                <Users size={20} strokeWidth={3} />
              </div>
              <div>
                <h2 className="text-lg font-black text-[#1B254B] uppercase tracking-[6px] leading-none">Assistants</h2>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{filteredAssistants.length} Staff Members</p>
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-slate-200/50 to-transparent ml-4" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredAssistants.map(([name, stat]) => (
                <StatCard 
                  key={name}
                  title={name}
                  total={stat.total}
                  breakdown={stat.times}
                  icon={Users}
                  isAssistant={true}
                  onClick={() => onSelectAssistant?.(name)}
                />
              ))}
              {filteredAssistants.length === 0 && (
                <div className="col-span-full py-12 text-center bg-white/20 rounded-[32px] border border-dashed border-slate-300">
                    <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No assistants found matching your search</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
