import React, { useState, useMemo, useEffect } from 'react';
import { 
  ClipboardList, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Calendar,
  FilterX,
  Plus,
  Zap,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MoreVertical,
  Trash2,
  Trash,
  LayoutGrid,
  Eye,
  EyeOff,
  CheckSquare,
  Square,
  Lock,
  Unlock,
  Clock
} from 'lucide-react';
import { 
  format, 
  addDays, 
  startOfWeek, 
  eachDayOfInterval, 
  isSameDay, 
  addWeeks, 
  subWeeks 
} from 'date-fns';
import { Student, AppData, FilterState, Tab, UserRole, AppSettings } from '../types';

const MultilineInput: React.FC<{
  value: string;
  onChange: (val: string) => void;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
}> = ({ value, onChange, className, style, placeholder }) => {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '0px';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = scrollHeight + 'px';
    }
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          (e.target as HTMLTextAreaElement).blur();
        }
      }}
      className={className}
      style={{ ...style, resize: 'none', overflow: 'hidden', display: 'block' }}
    />
  );
};

interface DailyTaskTableProps {
  students: Student[];
  data: AppData;
  filters: FilterState;
  setFilters?: (f: FilterState) => void;
  uniqueTeachers?: string[];
  uniqueAssistants?: string[];
  onUpdate: (data: AppData) => void;
  onAddStudent: (defaults: Partial<Student>) => void;
  onDeleteStudent?: (ids: string | string[], skipConfirm?: boolean) => void;
  role: UserRole;
  onClearCategory?: (categories: string[]) => void;
  settings?: AppSettings;
}

export const DailyTaskTable: React.FC<DailyTaskTableProps> = ({
  students,
  data,
  filters,
  setFilters,
  uniqueTeachers = [],
  uniqueAssistants = [],
  onUpdate,
  onAddStudent,
  onDeleteStudent,
  role,
  onClearCategory,
  settings
}) => {
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isFrozen, setIsFrozen] = useState(true);
  const [studentNameWidth, setStudentNameWidth] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dps_studentNameWidth');
      if (saved) return parseInt(saved, 10);
      return window.innerWidth < 768 ? 120 : 180;
    }
    return 180;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dps_studentNameWidth', studentNameWidth.toString());
    }
  }, [studentNameWidth]);

  const resizingRef = React.useRef<{ startX: number; startWidth: number } | null>(null);

  const onResizeStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!('touches' in e)) {
      e.preventDefault();
    }
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    resizingRef.current = { startX: clientX, startWidth: studentNameWidth };
    document.addEventListener('mousemove', onResizeMove);
    document.addEventListener('mouseup', onResizeEnd);
    document.addEventListener('touchmove', onResizeMove, { passive: false });
    document.addEventListener('touchend', onResizeEnd);
  };

  const onResizeMove = (e: MouseEvent | TouchEvent) => {
    if (!resizingRef.current) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const { startX, startWidth } = resizingRef.current;
    const diff = clientX - startX;
    setStudentNameWidth(Math.max(80, startWidth + diff));
  };

  const onResizeEnd = () => {
    resizingRef.current = null;
    document.removeEventListener('mousemove', onResizeMove);
    document.removeEventListener('mouseup', onResizeEnd);
    document.removeEventListener('touchmove', onResizeMove);
    document.removeEventListener('touchend', onResizeEnd);
  };

  // Week Interval
  const weekStart = startOfWeek(viewDate, { weekStartsOn: 1 }); // Monday
  const weekEnd = addDays(weekStart, 4); // Friday
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      if (s.category !== 'DailyTask') return false;
      const query = (filters.searchQuery || '').toLowerCase();
      const matchesSearch = !query || 
                           (s.name || '').toLowerCase().includes(query) || 
                           (s.level || '').toLowerCase().includes(query) ||
                           (s.shift || '').toLowerCase().includes(query) ||
                           (s.teachers || '').toLowerCase().includes(query) ||
                           (s.assistant || '').toLowerCase().includes(query) ||
                           (s.time || '').toLowerCase().includes(query);
      if (!matchesSearch) return false;
      if (filters.level && !s.level?.toUpperCase().includes(filters.level.toUpperCase())) return false;
      if (filters.time && !s.time?.toUpperCase().includes(filters.time.toUpperCase()) && !s.shift?.toUpperCase().includes(filters.time.toUpperCase())) return false;
      if (filters.teacher && !s.teachers?.toUpperCase().includes(filters.teacher.toUpperCase())) return false;
      if (filters.assistant && !s.assistant?.toUpperCase().includes(filters.assistant.toUpperCase())) return false;
      
      const matchesHidden = filters.showHidden || !s.isHidden;
      if (!matchesHidden) return false;
      
      return true;
    }).sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [students, filters]);

  const toggleTask = (studentId: string, date: Date, taskSlot: 1 | 2) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const newTasks = { ...(data.dailyTasks || {}) };
    const studentTasks = { ...(newTasks[studentId] || {}) };
    const taskKey = `${dateKey}_${taskSlot}`;
    
    const current = studentTasks[taskKey];
    let next: string | undefined;
    
    if (current === 'Done') next = 'Not Yet';
    else if (current === 'Not Yet') next = undefined;
    else next = 'Done';

    if (next === undefined) {
      delete studentTasks[taskKey];
    } else {
      studentTasks[taskKey] = next;
    }

    newTasks[studentId] = studentTasks;
    onUpdate({ ...data, dailyTasks: newTasks });
  };

  const getLevelBorderColor = (level?: string) => {
    if (!level) return 'border-transparent';
    const l = level.toUpperCase();
    if (l.includes('1A')) return 'border-l-purple-500';
    if (l.includes('1B')) return 'border-l-orange-500';
    if (l.includes('2A')) return 'border-l-amber-500';
    if (l.includes('2B')) return 'border-l-teal-500';
    if (l.includes('3A')) return 'border-l-indigo-500';
    if (l.includes('3B')) return 'border-l-violet-500';
    if (l.includes('4A')) return 'border-l-emerald-500';
    return 'border-l-transparent';
  };

  const getStatusColor = (status?: string) => {
    if (status === 'Done') return 'bg-emerald-500 text-white';
    if (status === 'Not Yet') return 'bg-orange-500 text-white';
    return 'bg-slate-50 text-slate-300';
  };

  const getStatusIcon = (status?: string) => {
    if (status === 'Done') return <CheckCircle2 size={12} />;
    if (status === 'Not Yet') return <XCircle size={12} />;
    return null;
  };

  const getRowBg = (assistantName?: string) => {
    if (!assistantName) return 'bg-slate-50 border-white/5';
    const colors = [
      'bg-emerald-400/10',
      'bg-amber-400/10',
      'bg-indigo-400/10',
      'bg-rose-400/10',
      'bg-violet-400/10',
      'bg-teal-400/10',
      'bg-orange-400/10'
    ];
    let hash = 0;
    for (let i = 0; i < assistantName.length; i++) {
        hash = assistantName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const isoToDisplay = (iso: string) => {
      if (!iso) return '';
      const [y, m, d] = iso.split('-');
      return `${d}/${m}/${y.slice(2)}`;
  };

  const displayToIso = (display: string) => {
      if (!display || !display.includes('/')) return '';
      const [d, m, y] = display.split('/');
      return `20${y}-${m}-${d}`;
  };

  const updateField = (id: string, key: string, val: any) => {
    let updates: any = { [key]: val };
    
    // Auto-fill deadline if name is entered
    if (key === 'name' && val && !students.find(s => s.id === id)?.deadline) {
        updates.deadline = format(new Date(), 'dd/MM/yy');
    }

    onUpdate({
      ...data,
      students: students.map(s => s.id === id ? { ...s, ...updates } : s)
    });
  };

  const removeEntry = (id: string) => {
    onDeleteStudent?.(id);
  };

  const filterSelectStyle = "bg-white/80 border border-slate-300/30 rounded-xl pl-8 pr-3 py-1.5 text-[10px] font-black uppercase text-slate-800 outline-none shadow-sm transition-all focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50 hover:bg-white cursor-pointer h-9 appearance-none";

  return (
    <div className="flex-1 flex flex-col bg-transparent overflow-hidden p-2 md:p-4 lg:p-6">
        {/* New Sophisticated Header */}
        <div className="bg-white/10 backdrop-blur-3xl rounded-[40px] p-8 mb-6 shadow-2xl border border-white/20">
            <div className="flex flex-wrap items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-orange-500/30">
                        <ClipboardList size={28} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-950 uppercase tracking-tighter leading-none">Task Hub</h1>
                        <div className="flex items-center gap-3 mt-2">
                            <span className="px-2 py-0.5 bg-orange-500 text-white text-[8px] font-black rounded-md uppercase tracking-wider">System Ready</span>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[3px]">Mission Control</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-8">
                    <div className="text-center">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Efficiency</p>
                        <p className="text-2xl font-black text-slate-800">0%</p>
                    </div>
                    <div className="text-center">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Velocity</p>
                        <p className="text-2xl font-black text-slate-800">0/0</p>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <button className="flex items-center gap-2 h-9 px-4 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all">
                        <Zap size={14} fill="currentColor" /> Strategic Plan
                      </button>
                      <button onClick={() => onAddStudent({ category: 'DailyTask', shift: 'Morning' })} className="flex items-center gap-2 h-9 px-4 bg-orange-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg hover:bg-orange-600 transition-all">
                        <Plus size={14} strokeWidth={4} /> Add New Topic
                      </button>
                    </div>
                </div>
            </div>

                {/* Second Row: Navigation and View Switch */}
                <div className="flex flex-wrap items-center justify-between gap-4 mt-6">
                    <div className="flex items-center gap-1 bg-white/20 p-1 rounded-xl border border-white/10 backdrop-blur-md">
                        {['Daily', 'Weekly', 'Calendar'].map((view) => (
                            <button 
                                key={view}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${view === 'Weekly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                            >
                                {view}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2">
                        <button onClick={() => setViewDate(subWeeks(viewDate, 1))} className="p-2 bg-white/40 rounded-xl hover:bg-white/60 transition-all border border-white/10">
                            <ChevronLeft size={16} />
                        </button>
                        <div className="px-6 py-2 bg-white/40 rounded-xl border border-white/10 font-black text-[11px] text-slate-800 uppercase tracking-widest min-w-[180px] text-center">
                            {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d')}
                        </div>
                        <button onClick={() => setViewDate(addWeeks(viewDate, 1))} className="p-2 bg-white/40 rounded-xl hover:bg-white/60 transition-all border border-white/10">
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <button className="p-2.5 bg-white/40 rounded-xl hover:bg-white/60 transition-all border border-white/10 text-slate-600">
                             <div className="w-5 h-5 flex items-center justify-center"><Search size={18} /></div>
                        </button>
                        <button 
                            onClick={() => onClearCategory?.(['DailyTask'])}
                            className="p-2.5 bg-white/40 rounded-xl hover:bg-red-500 hover:text-white transition-all border border-white/10 text-slate-600"
                            title="Clear All"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Spreadsheet Content */}
            <div className="flex-1 bg-white/5 backdrop-blur-[2px] rounded-[40px] shadow-2xl overflow-hidden flex flex-col border border-white/10">
                <div className="overflow-auto flex-1 custom-scrollbar">
                    <table className="w-full border-collapse table-fixed min-w-[1500px]">
                        <thead className="sticky top-0 z-40 bg-white/10 backdrop-blur-md">
                            <tr className="border-b border-white/5 uppercase text-[9px] font-black text-slate-800">
                                <th className="w-10 py-5 text-center border-r border-white/5">#</th>
                                <th className={`px-6 py-5 text-left border-r border-white/5 sticky left-0 z-50 transition-all group ${isFrozen ? 'bg-white/90 backdrop-blur-md shadow-[2px_0_5px_rgba(0,0,0,0.1)]' : 'bg-inherit'}`} style={{ width: studentNameWidth }}>
                                    <div className="flex items-center justify-between">
                                      STUDENT NAME
                                    </div>
                                    <div onMouseDown={onResizeStart} onTouchStart={onResizeStart} className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-orange-500 opacity-0 group-hover:opacity-100 transition-opacity z-50" />
                                </th>
                                <th className="w-28 py-5 text-center border-r border-white/5">Priority</th>
                                <th className="w-24 py-5 text-center border-r border-white/5">Energy</th>
                                <th className="w-28 py-5 text-center border-r border-white/5">Phase</th>
                                <th className="w-24 py-5 text-center border-r border-white/5">Domain</th>
                                <th className="w-24 py-5 text-center border-r border-white/5">Context</th>
                                <th className="w-32 py-5 text-center border-r border-white/5">Deadline</th>
                                
                                {days.map(day => (
                                    <th key={day.toString()} className="w-48 border-r border-white/5 p-0">
                                        <div className="text-center py-2 border-b border-white/5">
                                            <p className="text-[10px] font-black text-slate-800 tracking-tighter">{format(day, 'EEE').toUpperCase()}</p>
                                            <p className="text-[8px] font-bold text-slate-500">{format(day, 'MMM d')}</p>
                                        </div>
                                        <div className="flex divide-x divide-white/5 h-8">
                                            <div className="flex-1 text-[7px] font-black text-slate-400 flex items-center justify-center">Slot 01</div>
                                            <div className="flex-1 text-[7px] font-black text-slate-400 flex items-center justify-center">Slot 02</div>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredStudents.map((s, idx) => {
                                const rowBg = getRowBg(s.assistant);
                                return (
                                    <tr key={s.id} className={`h-12 transition-all hover:brightness-95 group ${rowBg} ${s.isHidden ? 'opacity-30' : ''}`}>
                                        <td className="text-center font-bold text-[10px] text-indigo-900/60 border-r border-white/5">{idx + 1}</td>
                                        <td className={`px-6 border-r border-white/5 sticky left-0 z-30 transition-all ${isFrozen ? 'bg-white/90 backdrop-blur-md shadow-[2px_0_5px_rgba(0,0,0,0.05)]' : 'bg-inherit'}`} style={{ width: studentNameWidth }}>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-1 h-8 rounded-full ${getLevelBorderColor(s.level).replace('border-l-', 'bg-')}`} />
                                                <MultilineInput 
                                                    value={s.name} 
                                                    onChange={val => updateField(s.id, 'name', val)}
                                                    className="w-full bg-transparent font-black text-slate-900 text-xs outline-none"
                                                />
                                            </div>
                                        </td>
                                        <td className="border-r border-white/5 px-2">
                                            <select 
                                                value={s.priority || 'MEDIUM'} 
                                                onChange={e => updateField(s.id, 'priority', e.target.value)}
                                                className="w-full h-8 bg-orange-500/10 text-orange-600 rounded-lg text-[9px] font-black text-center appearance-none cursor-pointer outline-none transition-all hover:bg-orange-500/20"
                                            >
                                                <option value="LOW">LOW</option>
                                                <option value="MEDIUM">MEDIUM</option>
                                                <option value="HIGH">HIGH</option>
                                                <option value="CRITICAL">CRITICAL</option>
                                            </select>
                                        </td>
                                        <td className="border-r border-white/5">
                                            <MultilineInput 
                                                value={s.energy || '1A + (5.1)'} 
                                                onChange={val => updateField(s.id, 'energy', val)}
                                                className="w-full h-8 px-2 bg-transparent text-[10px] font-bold text-slate-600 text-center outline-none"
                                            />
                                        </td>
                                        <td className="border-r border-white/5 px-2">
                                            <select 
                                                value={s.phase || 'MORNING'} 
                                                onChange={e => updateField(s.id, 'phase', e.target.value)}
                                                className="w-full h-8 bg-emerald-500/10 text-emerald-600 rounded-lg text-[9px] font-black text-center appearance-none cursor-pointer outline-none transition-all hover:bg-emerald-500/20"
                                            >
                                                <option value="MORNING">MORNING</option>
                                                <option value="AFTERNOON">AFTERNOON</option>
                                                <option value="EVENING">EVENING</option>
                                            </select>
                                        </td>
                                        <td className="border-r border-white/5">
                                            <MultilineInput 
                                                value={s.domain || 'Category'} 
                                                onChange={val => updateField(s.id, 'domain', val)}
                                                className="w-full h-8 px-2 bg-transparent text-[10px] font-medium text-slate-400 text-center outline-none"
                                            />
                                        </td>
                                        <td className="border-r border-white/5">
                                            <MultilineInput 
                                                value={s.context || 'Group'} 
                                                onChange={val => updateField(s.id, 'context', val)}
                                                className="w-full h-8 px-2 bg-transparent text-[10px] font-medium text-slate-400 text-center outline-none"
                                            />
                                        </td>
                                        <td className="border-r border-white/5 px-4 relative group/dd">
                                            <div className="flex items-center justify-center gap-2 bg-white/20 px-2 py-1.5 rounded-lg border border-white/10 group-hover/dd:bg-white/40 transition-all">
                                                <input 
                                                    type="date"
                                                    value={displayToIso(s.deadline || '')} 
                                                    onChange={e => updateField(s.id, 'deadline', isoToDisplay(e.target.value))}
                                                    className="w-full bg-transparent text-[10px] font-black text-orange-600 outline-none text-center cursor-pointer"
                                                />
                                            </div>
                                        </td>
                                        {days.map(day => {
                                            const status1 = data.dailyTasks?.[s.id]?.[`${format(day, 'yyyy-MM-dd')}_1`];
                                            const status2 = data.dailyTasks?.[s.id]?.[`${format(day, 'yyyy-MM-dd')}_2`];
                                            return (
                                                <td key={day.toString()} className="border-r border-white/5 p-0">
                                                    <div className="flex h-12">
                                                        <button 
                                                            onClick={() => toggleTask(s.id, day, 1)}
                                                            className="flex-1 flex items-center justify-center transition-all group/cell"
                                                        >
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${status1 === 'Done' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : status1 === 'Not Yet' ? 'bg-indigo-500/80 text-white shadow-lg shadow-indigo-500/20' : 'bg-white/40 border border-white/20'}`}>
                                                                {status1 === 'Done' ? <CheckCircle2 size={16} /> : status1 === 'Not Yet' ? <Clock size={16} /> : <div className="w-1.5 h-1.5 bg-slate-200 rounded-full" />}
                                                            </div>
                                                        </button>
                                                        <button 
                                                            onClick={() => toggleTask(s.id, day, 2)}
                                                            className="flex-1 flex items-center justify-center transition-all group/cell"
                                                        >
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${status2 === 'Done' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : status2 === 'Not Yet' ? 'bg-indigo-500/80 text-white shadow-lg shadow-indigo-500/20' : 'bg-white/40 border border-white/20'}`}>
                                                                {status2 === 'Done' ? <CheckCircle2 size={16} /> : status2 === 'Not Yet' ? <Clock size={16} /> : <div className="w-1.5 h-1.5 bg-slate-200 rounded-full" />}
                                                            </div>
                                                        </button>
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DailyTaskTable;
