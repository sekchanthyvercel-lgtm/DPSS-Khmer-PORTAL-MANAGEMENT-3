import React, { useMemo, useRef, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Student, FilterState, UserRole, AppSettings, StudentCategory } from '../types';
import { 
    LayoutGrid, Search, Trash2, Zap, Plus, AlertCircle, Eye, EyeOff, CheckSquare, Square,
    Lock, Unlock
} from 'lucide-react';

const MultilineInput: React.FC<{
  value: string;
  onChange: (val: string) => void;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
}> = ({ value, onChange, className, style, placeholder }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
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

interface PenaltyTableProps {
  students: Student[];
  onUpdate: (students: Student[]) => void;
  filters: FilterState;
  setFilters?: (filters: FilterState) => void;
  uniqueTeachers?: string[];
  uniqueAssistants?: string[];
  uniqueLevels?: string[];
  onQuickAdd?: () => void;
  onAddStudent?: (defaults: Partial<Student>) => void;
  onDeleteStudent?: (ids: string | string[], skipConfirm?: boolean) => void;
  role?: UserRole;
  onClearCategory?: (cats: StudentCategory[]) => void;
  settings?: AppSettings;
}

export const PenaltyTable: React.FC<PenaltyTableProps> = ({ 
  students, onUpdate, onDeleteStudent, filters, setFilters, 
  uniqueTeachers = [], 
  uniqueAssistants = [], 
  uniqueLevels = [], 
  onQuickAdd, onAddStudent,
  role, onClearCategory, settings
}) => {
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
  
  const resizingRef = useRef<{ startX: number; startWidth: number } | null>(null);

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

  const penaltyStudents = useMemo(() => students.filter(s => s.category === 'Penalty' && !s.deletedAt), [students]);

  const localTeachers = useMemo(() => {
    const ts = new Set<string>();
    penaltyStudents.forEach(s => {
      if (s.teachers) String(s.teachers).split(/[&+,\/]+/).forEach(t => ts.add(t.trim()));
    });
    return Array.from(ts).filter(Boolean).sort();
  }, [penaltyStudents]);

  const localAssistants = useMemo(() => {
    const asst = new Set<string>();
    penaltyStudents.forEach(s => {
      if (s.assistant) String(s.assistant).split(/[&+,\/]+/).forEach(a => asst.add(a.trim()));
    });
    return Array.from(asst).filter(Boolean).sort();
  }, [penaltyStudents]);

  const filterTeachers = useMemo(() => {
    return Array.from(new Set([...uniqueTeachers, ...localTeachers])).sort();
  }, [uniqueTeachers, localTeachers]);

  const filterAssistants = useMemo(() => {
    return Array.from(new Set([...uniqueAssistants, ...localAssistants])).sort();
  }, [uniqueAssistants, localAssistants]);

  const localLevels = useMemo(() => {
    const lv = new Set<string>();
    penaltyStudents.forEach(s => {
      if (s.level) String(s.level).split('&').forEach(l => lv.add(l.trim().toUpperCase()));
    });
    return Array.from(lv).filter(Boolean).sort();
  }, [penaltyStudents]);

  const filteredStudents = useMemo(() => {
    return penaltyStudents.filter(s => {
        const query = filters.searchQuery?.toLowerCase() || '';
        const matchesSearch = !query || 
            String(s.name || '').toLowerCase().includes(query) ||
            String(s.assistant || '').toLowerCase().includes(query) ||
            String(s.teachers || '').toLowerCase().includes(query) ||
            String(s.level || '').toLowerCase().includes(query) ||
            String(s.time || '').toLowerCase().includes(query);
        
        const matchesTeacher = !filters.teacher || String(s.teachers || '').toUpperCase().includes(filters.teacher.toUpperCase());
        const matchesAssistant = !filters.assistant || String(s.assistant || '').toUpperCase().includes(filters.assistant.toUpperCase());
        const matchesLevel = !filters.level || String(s.level || '').toUpperCase().includes(filters.level.toUpperCase());
        const matchesVisibility = filters.showHidden || !s.isHidden;
        
        return matchesSearch && matchesTeacher && matchesAssistant && matchesLevel && matchesVisibility;
    }).sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [penaltyStudents, filters]);

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
      let updates: Partial<Student> = { [key]: val };
      
      // Auto-fill date if type is selected
      if (key.startsWith('penaltyType') && val) {
          const num = key.replace('penaltyType', '');
          const dateKey = `penaltyDate${num}`;
          const currentStudent = students.find(s => s.id === id);
          if (currentStudent && !currentStudent[dateKey]) {
              updates[dateKey] = format(new Date(), 'dd/MM/yy');
          }
      }
      
      onUpdate(students.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const getRowBg = (idx: number) => {
    const colors = [
      'bg-emerald-100/30',
      'bg-emerald-100/30',
      'bg-amber-100/30',
      'bg-indigo-100/30',
      'bg-rose-100/30',
      'bg-violet-100/30',
      'bg-teal-100/30',
      'bg-orange-100/30'
    ];
    return colors[idx % colors.length];
  };

  const resetFilters = () => {
    setFilters?.({
      ...filters,
      searchQuery: '',
      teacher: '',
      assistant: '',
      level: '',
      showHidden: false
    });
  };

  const filterSelectStyle = "bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-[10px] font-black text-[#1B254B] border-slate-200 outline-none shadow-sm focus:ring-2 focus:ring-primary-500/10 focus:border-primary-500 transition-all cursor-pointer h-9 appearance-none";

  return (
    <div className="flex-1 flex flex-col bg-transparent overflow-hidden relative">
      {/* Header Bar */}
      <div className="min-h-[100px] py-4 border-b border-white/20 flex flex-col px-4 gap-4 no-print shrink-0 bg-white/50 backdrop-blur-3xl rounded-b-[40px] shadow-2xl shadow-indigo-900/10">
          <div className="flex items-start justify-between w-full">
              <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0">
                          <Zap size={20} className="fill-white" />
                      </div>
                      <div>
                          <h2 className="text-sm font-black text-[#1B254B] leading-none tracking-tight">Late / Absence Log</h2>
                          <p className="text-[10px] font-bold text-slate-400 mt-1 tracking-widest">{filteredStudents.length} Students Listed</p>
                      </div>
                  </div>
                  
                   {/* Buttons moved to the left under the title */}
                  <div className="flex items-center gap-2">
                      <button onClick={onQuickAdd} className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-xl text-[10px] font-black shadow-lg hover:scale-105 active:scale-95 transition-all">
                          <Zap size={14} className="fill-yellow-400 text-yellow-400 shrink-0" /> AI AUTO
                      </button>
                      <button onClick={() => {
                        setFilters?.({ searchQuery: '', teacher: '', assistant: '', time: '', level: '', behavior: '' });
                        onAddStudent?.({ category: 'Penalty' });
                      }} className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl text-[10px] font-black shadow-lg hover:bg-orange-600 active:scale-95 transition-all">
                          <Plus size={16} strokeWidth={3} className="shrink-0"/> ADD ENTRY
                      </button>
                      <button onClick={() => setIsFrozen(!isFrozen)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-black uppercase text-[9px] transition-all border backdrop-blur-md ${isFrozen ? 'bg-amber-500/80 text-white border-amber-600 shadow-md' : 'bg-white/10 text-slate-900 border-white/20 hover:bg-white/20'}`}>
                        {isFrozen ? <Lock size={12}/> : <Unlock size={12}/>} {isFrozen ? 'FROZEN' : 'FREEZE'}
                      </button>
                      {selectedIds.size > 0 && (
                          <button 
                            onClick={() => {
                              if (confirm(`Delete ${selectedIds.size} selected items?`)) {
                                onDeleteStudent?.(Array.from(selectedIds), true);
                                setSelectedIds(new Set());
                              }
                            }}
                            className="bg-red-500 text-white px-3 py-2 rounded-xl text-[10px] font-black shadow-lg hover:bg-red-600 transition-all flex items-center gap-2"
                          >
                             <Trash2 size={14} /> DELETE ({selectedIds.size})
                          </button>
                      )}
                  </div>
              </div>

              {/* Admin Clear Button moved to top right to keep it safe but visible */}
              <div className="flex items-center gap-2">
                <button 
                    onClick={() => setFilters?.({...filters, showHidden: !filters.showHidden})}
                    className={`p-3 rounded-xl transition-all shadow-sm border ${filters.showHidden ? 'bg-[#1B254B] text-white border-[#1B254B]' : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'}`}
                    title={filters.showHidden ? "Hide Tasks" : "Show Tasks"}
                >
                    {filters.showHidden ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
                {role === 'Admin' && (
                  <button 
                    onClick={() => onClearCategory?.(['Penalty'])} 
                    title="CLEAR ALL RECORDS"
                    className="p-3 bg-red-50 border border-red-100 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-sm"
                  >
                      <AlertCircle size={18} />
                  </button>
                )}
              </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
              <div className="relative w-64 min-w-[150px]">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                      type="text" 
                      placeholder="Search spreadsheet..." 
                      className="w-full h-9 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary-500/10 focus:border-primary-500 transition-all"
                      value={filters.searchQuery}
                      onChange={e => setFilters?.({...filters, searchQuery: e.target.value})}
                  />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                  <div className="relative group">
                      <LayoutGrid size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                      <select value={filters.teacher} onChange={e => setFilters?.({...filters, teacher: e.target.value})} className={filterSelectStyle}>
                          <option value="">Teachers</option>
                          {filterTeachers.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                  </div>
                  <div className="relative group">
                      <LayoutGrid size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                      <select value={filters.assistant} onChange={e => setFilters?.({...filters, assistant: e.target.value})} className={filterSelectStyle}>
                          <option value="">Assistants</option>
                          {filterAssistants.map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                  </div>
                  <div className="relative group">
                      <LayoutGrid size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                      <select value={filters.level} onChange={e => setFilters?.({...filters, level: e.target.value})} className={filterSelectStyle}>
                          <option value="">All Levels</option>
                          {localLevels.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                  </div>
                  <button onClick={resetFilters} title="Reset Filters" className="p-2.5 bg-slate-50 border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 rounded-xl transition-all">
                      <Trash2 size={16} />
                  </button>
              </div>
          </div>
      </div>

      {/* Spreadsheet Content */}
      <div className="flex-1 overflow-auto bg-transparent p-4">
          <div className="h-full bg-white/[0.02] backdrop-blur-[2px] border border-white/5 rounded-2xl shadow-xl overflow-auto relative">
              <table className="w-full border-collapse table-fixed min-w-[1400px]">
                  <thead className="sticky top-0 z-40 bg-white/[0.02] backdrop-blur-[2px] border-b border-white/5">
                      <tr>
                        <th className="w-10 border-r border-white/5 text-[10px] font-black text-slate-900 sticky top-0 bg-white">
                          <div className="flex items-center justify-center">
                            <button onClick={() => setSelectedIds(selectedIds.size === filteredStudents.length ? new Set() : new Set(filteredStudents.map(s => s.id)))}>
                              {selectedIds.size > 0 ? <CheckSquare size={14} className="text-orange-500" /> : <Square size={14} className="text-slate-400/30" />}
                            </button>
                          </div>
                        </th>
                        <th className="w-10 border-r border-white/5 text-[10px] font-black text-slate-900 sticky top-0 bg-white">#</th>
                        <th className={`border-r border-white/5 text-[10px] font-black text-slate-900 text-left px-3 sticky top-0 ${isFrozen ? 'left-0 z-50 bg-white/90 backdrop-blur-[4px] shadow-[2px_0_5px_rgba(0,0,0,0.1)]' : 'bg-white'}`} style={{ width: studentNameWidth, left: isFrozen ? 0 : undefined }}>
                          <div className="flex items-center justify-between">
                            Student Name
                          </div>
                          <div onMouseDown={onResizeStart} onTouchStart={onResizeStart} className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary-400 opacity-0 group-hover:opacity-100 transition-opacity z-50" />
                        </th>
                        <th className="w-24 border-r border-white/5 text-[10px] font-black text-orange-600 text-center px-3 sticky top-0 z-40 bg-white/[0.03] backdrop-blur-[2px]">Thumbprint</th>
                        <th className="w-24 border-r border-white/5 text-[10px] font-black text-slate-900 text-center px-3 sticky top-0 bg-white/[0.03] backdrop-blur-[2px]">Behavior 1</th>
                        <th className="w-24 border-r border-white/5 text-[10px] font-black text-slate-900 text-center px-3 sticky top-0 bg-white/[0.03] backdrop-blur-[2px]">Behavior 2</th>
                        <th className="w-24 border-r border-white/5 text-[10px] font-black text-slate-900 text-center px-3 sticky top-0 bg-white/[0.03] backdrop-blur-[2px]">Behavior 3</th>
                        <th className="w-40 border-r border-white/5 text-[10px] font-black text-slate-900 text-left px-3 sticky top-0 bg-white/[0.03] backdrop-blur-[2px]">Teachers</th>
                        <th className="w-36 border-r border-white/5 text-[10px] font-black text-slate-900 text-left px-3 sticky top-0 bg-white/[0.03] backdrop-blur-[2px]">Assistant</th>
                        <th className="w-24 border-r border-white/5 text-[10px] font-black text-slate-900 text-left px-3 sticky top-0 bg-white/[0.03] backdrop-blur-[2px]">Level</th>
                        
                        {[1, 2, 3, 4, 5, 6, 7].map(num => (
                          <React.Fragment key={num}>
                            <th className="w-40 border-r border-slate-200 text-[10px] font-black text-red-500 text-center px-3">Log {num} (Lat/Abs)</th>
                            <th className="w-32 border-r border-slate-200 text-[10px] font-black text-red-500 text-center px-3">Date {num}</th>
                          </React.Fragment>
                        ))}

                        <th className="w-60 border-r border-slate-200 text-[10px] font-black text-slate-400 text-left px-3">General Comments / Notes</th>
                        
                        <th className="w-16 text-[10px] font-black text-slate-400 text-center">X</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.map((s, idx) => (
                      <tr key={s.id} className={`h-8 hover:bg-white/20 transition-colors group ${getRowBg(idx)} ${s.isHidden ? 'opacity-30' : ''}`}>
                        <td className="border-r border-slate-100 text-center bg-white/60">
                          <div className="flex items-center justify-center min-h-[32px]">
                             <button onClick={() => { const ns = new Set(selectedIds); ns.has(s.id) ? ns.delete(s.id) : ns.add(s.id); setSelectedIds(ns); }}>
                                {selectedIds.has(s.id) ? <CheckSquare size={14} className="text-orange-500" /> : <Square size={14} className="text-slate-400/30" />}
                             </button>
                          </div>
                        </td>
                        <td className="border-r border-slate-100 text-center text-[10px] font-bold text-slate-400 bg-slate-50/40">
                          <div className="flex items-center justify-center min-h-[32px]">
                            {idx + 1}
                          </div>
                        </td>
                        <td className={`border-r border-slate-100 group ${isFrozen ? 'sticky left-0 z-20 bg-white/90 backdrop-blur-[4px] shadow-[2px_0_5px_rgba(0,0,0,0.05)]' : 'bg-white/60'}`} style={{ width: studentNameWidth, left: isFrozen ? 0 : undefined }}>
                            <div className="flex items-center min-h-[32px] w-full">
                                <MultilineInput 
                                    value={s.name} 
                                    onChange={val => updateField(s.id, 'name', val)} 
                                    className="w-full bg-transparent outline-none px-3 py-1 font-black text-[#1B254B] leading-tight" 
                                    style={{ fontSize: settings?.fontSize ? `${settings.fontSize}px` : '11px' }}
                                />
                            </div>
                        </td>
                        <td className="border-r border-slate-100 bg-orange-50/60 text-center">
                            <select 
                              value={s.thumbprint || ''} 
                              onChange={e => updateField(s.id, 'thumbprint', e.target.value)}
                              className="w-full h-full px-3 text-[11px] font-black text-orange-600 bg-transparent outline-none appearance-none text-center cursor-pointer"
                            >
                                <option value="">-</option>
                                {[1, 2, 3, 4, 5].map(v => <option key={v} value={v}>{v}</option>)}
                            </select>
                        </td>
                        <td className="border-r border-slate-100">
                            <MultilineInput value={s.behavior1 || ''} onChange={val => updateField(s.id, 'behavior1', val)} className="w-full bg-transparent outline-none px-3 py-1 text-[10px] font-medium text-slate-700 text-center" />
                        </td>
                        <td className="border-r border-slate-100">
                            <MultilineInput value={s.behavior2 || ''} onChange={val => updateField(s.id, 'behavior2', val)} className="w-full bg-transparent outline-none px-3 py-1 text-[10px] font-medium text-slate-700 text-center" />
                        </td>
                        <td className="border-r border-slate-100">
                            <MultilineInput value={s.behavior3 || ''} onChange={val => updateField(s.id, 'behavior3', val)} className="w-full bg-transparent outline-none px-3 py-1 text-[10px] font-medium text-slate-700 text-center" />
                        </td>
                        <td className="border-r border-slate-100">
                            <MultilineInput value={s.teachers || ''} onChange={val => updateField(s.id, 'teachers', val)} className="w-full bg-transparent outline-none px-3 py-1 text-[10px] font-bold text-slate-500 uppercase" />
                        </td>
                        <td className="border-r border-slate-100">
                            <MultilineInput value={s.assistant || ''} onChange={val => updateField(s.id, 'assistant', val)} className="w-full bg-transparent outline-none px-3 py-1 text-[10px] font-black text-orange-600 uppercase" />
                        </td>
                        <td className="border-r border-slate-100">
                            <MultilineInput value={s.level || ''} onChange={val => updateField(s.id, 'level', val)} className="w-full bg-transparent outline-none px-3 py-1 text-[10px] font-black text-slate-600 text-center" />
                        </td>

                        {[1, 2, 3, 4, 5, 6, 7].map(num => (
                          <React.Fragment key={num}>
                            <td className={`border-r border-slate-100 bg-orange-50/20`}>
                                <select 
                                  value={s[`penaltyType${num}`] || ''} 
                                  onChange={e => updateField(s.id, `penaltyType${num}`, e.target.value)}
                                  className="w-full h-full px-3 text-[10px] font-black text-[#1B254B] bg-transparent outline-none appearance-none text-center"
                                >
                                    <option value="">-</option>
                                    <option value="Lateness">Lateness</option>
                                    <option value="Absence">Absence</option>
                                    <option value="Wrong Shoes">Wrong Shoes</option>
                                    <option value="No cards">No cards</option>
                                    <option value="Wrong Uniforms">Wrong Uniforms</option>
                                    <option value="Late Check (Normal)">Late Check (Normal)</option>
                                    <option value="Other">Other</option>
                                </select>
                            </td>
                            <td className="border-r border-slate-100">
                                <input 
                                  type="date"
                                  value={displayToIso(s[`penaltyDate${num}`] || '')} 
                                  onChange={e => updateField(s.id, `penaltyDate${num}`, isoToDisplay(e.target.value))}
                                  className="w-full h-full px-2 text-[10px] font-bold text-slate-600 bg-transparent outline-none text-center cursor-pointer" 
                                />
                            </td>
                          </React.Fragment>
                        ))}

                        <td className="border-r border-slate-100">
                            <MultilineInput 
                              placeholder="Enter notes..."
                              value={s.penaltyComments || ''} 
                              onChange={val => updateField(s.id, 'penaltyComments', val)}
                              className="w-full bg-transparent outline-none px-3 py-1 text-[10px] font-bold text-slate-500" 
                            />
                        </td>

                        <td className="text-center">
                            <div className="flex items-center justify-center gap-1">
                                <button onClick={() => updateField(s.id, 'isHidden', !s.isHidden)} className={`p-1 text-slate-300 hover:text-indigo-600 transition-colors ${s.isHidden ? 'text-indigo-600' : ''}`}>
                                    {s.isHidden ? <Eye size={12} /> : <EyeOff size={12} />}
                                </button>
                                <button onClick={() => onDeleteStudent?.(s.id)} className="p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
              </table>
          </div>
      </div>
    </div>
  );
};
