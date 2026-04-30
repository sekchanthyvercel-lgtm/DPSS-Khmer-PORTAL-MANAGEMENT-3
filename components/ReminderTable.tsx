import React, { useState } from 'react';
import { 
  Bell, 
  Search, 
  Plus, 
  Trash2, 
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  FilterX,
  LayoutGrid,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { Student, FilterState, UserRole } from '../types';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameDay, 
  isSameMonth, 
  subMonths, 
  addMonths 
} from 'date-fns';

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
      textareaRef.current.style.height = Math.max(32, scrollHeight) + 'px';
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

interface ReminderTableProps {
  students: Student[];
  onAddStudent: (defaults?: Partial<Student>) => void;
  onUpdateStudent: (id: string, updates: Partial<Student>) => void;
  onDeleteStudent: (ids: string | string[], skipConfirm?: boolean) => void;
  onClearCategory: (categories: string[]) => void;
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  role: UserRole;
  settings?: any;
  onUpdateSettings?: (settings: any) => void;
}

const ReminderTable: React.FC<ReminderTableProps> = ({
  students,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  onClearCategory,
  filters,
  setFilters,
  role,
  settings,
  onUpdateSettings
}) => {
  const [viewDate, setViewDate] = useState(new Date());
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [viewMode, setViewMode] = useState<'List' | 'Calendar'>('Calendar');

  const filteredReminders = students
    .filter(s => s.category === 'Reminder')
    .filter(s => {
      const query = (filters.searchQuery || '').toLowerCase();
      const matchesSearch = !query || 
             (s.name || '').toLowerCase().includes(query) || 
             (s.note || '').toLowerCase().includes(query) ||
             (s.status || '').toLowerCase().includes(query);

      const matchesTeacher = !filters.teacher || 
          (s.teachers || '').toUpperCase().includes(filters.teacher.toUpperCase());
          
      const matchesAssistant = !filters.assistant || 
          (s.assistant || '').toUpperCase().includes(filters.assistant.toUpperCase());

      return matchesSearch && matchesTeacher && matchesAssistant;
    });

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  
  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd
  });

  const getRemindersForDate = (date: Date) => {
    return filteredReminders.filter(r => {
      if (!r.deadline) return false;
      const [d, m, y] = r.deadline.split('/');
      const remDate = new Date(parseInt(`20${y}`), parseInt(m) - 1, parseInt(d));
      return isSameDay(remDate, date);
    });
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

  const updateField = (id: string, field: string, value: any) => {
    let updates: any = { [field]: value };
    if (field === 'name' && value && !students.find(s => s.id === id)?.deadline) {
        updates.deadline = format(viewDate, 'dd/MM/yy');
    }
    onUpdateStudent(id, updates);
  };

  const getRowBg = (idx: number) => {
    const colors = ['bg-emerald-400/5', 'bg-amber-400/5', 'bg-indigo-400/5', 'bg-rose-400/5', 'bg-violet-400/5', 'bg-teal-400/5', 'bg-orange-400/5'];
    return colors[idx % colors.length];
  };

  return (
    <div className={`flex flex-col bg-transparent transition-all ${isFullScreen ? 'fixed inset-0 z-[100] bg-slate-50/90 backdrop-blur-3xl' : 'flex-1 overflow-hidden p-4 md:p-6 lg:p-8'}`}>
      {/* Header Bar */}
      <div className={`bg-white/10 backdrop-blur-3xl rounded-[32px] p-6 mb-6 flex flex-wrap items-center justify-between shadow-2xl shadow-indigo-900/10 border border-white/20 gap-4 transition-all ${isFullScreen ? 'm-4 rounded-3xl' : ''}`}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#1B254B] rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-900/20">
            <Calendar size={24} strokeWidth={3} />
          </div>
          <div>
            <h1 className="text-xl font-black text-[#1B254B] uppercase tracking-tight leading-none">Reminder Hub</h1>
            <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest mt-1">{format(viewDate, 'MMMM yyyy')}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white/20 p-1 rounded-xl border border-white/10 shrink-0">
             <button onClick={() => setViewDate(subMonths(viewDate, 1))} className="p-1.5 text-slate-600 hover:text-indigo-600 transition-colors">
               <ChevronLeft size={20} />
             </button>
             <div className="px-4 text-center min-w-[140px]">
               <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest">
                 {format(viewDate, 'MMM yyyy')}
               </p>
             </div>
             <button onClick={() => setViewDate(addMonths(viewDate, 1))} className="p-1.5 text-slate-600 hover:text-indigo-600 transition-colors">
               <ChevronRight size={20} />
             </button>
          </div>

          <div className="flex items-center bg-white/20 p-1 rounded-xl border border-white/10 shrink-0">
            <button onClick={() => setViewMode('Calendar')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${viewMode === 'Calendar' ? 'bg-[#1B254B] text-white shadow-lg' : 'text-slate-600'}`}>Calendar</button>
            <button onClick={() => setViewMode('List')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${viewMode === 'List' ? 'bg-[#1B254B] text-white shadow-lg' : 'text-slate-600'}`}>List</button>
          </div>

          {viewMode === 'Calendar' && (
            <button onClick={() => setIsFullScreen(!isFullScreen)} className="p-2.5 bg-white/40 rounded-xl hover:bg-white/60 transition-all border border-white/10 text-slate-600">
               {isFullScreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
          )}

          <button 
            onClick={() => onAddStudent({ category: 'Reminder', deadline: format(new Date(), 'dd/MM/yy') })}
            className="flex items-center gap-2 h-10 px-5 bg-[#1B254B] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-slate-800 transition-all"
          >
            <Plus size={16} strokeWidth={3} /> Add Planning
          </button>
        </div>
      </div>

      {viewMode === 'Calendar' ? (
        <div className="flex-1 overflow-x-auto no-scrollbar pb-4 group">
            <div className="min-w-[1000px] h-full flex flex-col">
                <div className="grid grid-cols-7 gap-1 px-4 mb-2">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                        <div key={d} className="text-center text-[11px] font-black uppercase text-slate-400 tracking-widest py-2 italic">{d}</div>
                    ))}
                </div>
                <div className="flex-1 grid grid-cols-7 grid-rows-6 gap-3 px-4 pb-4">
                    {calendarDays.map((day, idx) => {
                        const isCurrentMonth = isSameMonth(day, monthStart);
                        const isToday = isSameDay(day, new Date());
                        const dayReminders = getRemindersForDate(day);
                        
                        return (
                            <div 
                                key={idx} 
                                className={`relative rounded-[24px] p-3 border transition-all flex flex-col group/day 
                                    ${isCurrentMonth ? 'bg-white/10 border-white/10 backdrop-blur-sm' : 'bg-white/5 border-white/5 opacity-40'}
                                    ${isToday ? 'ring-2 ring-orange-500 ring-offset-2 ring-offset-transparent' : ''}
                                    hover:bg-white/20 hover:border-white/30 hover:shadow-xl hover:-translate-y-1
                                `}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`w-7 h-7 flex items-center justify-center text-sm font-black italic
                                        ${idx % 3 === 0 ? 'text-emerald-500' : idx % 3 === 1 ? 'text-violet-500' : 'text-orange-500'}
                                    `}>
                                      {format(day, 'd')}
                                    </span>
                                    <button 
                                        onClick={() => onAddStudent({ category: 'Reminder', deadline: format(day, 'dd/MM/yy') })}
                                        className="w-6 h-6 flex items-center justify-center bg-white/40 rounded-lg text-slate-900 opacity-0 group-hover/day:opacity-100 transition-all hover:bg-white"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-1 pr-1">
                                    {dayReminders.map(r => (
                                        <div key={r.id} className="text-[10px] font-bold text-slate-700 bg-white/60 p-1.5 rounded-lg border border-white/40 shadow-sm leading-tight flex items-center gap-1.5 transition-all hover:bg-white group/item">
                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                                            <input 
                                                value={r.name}
                                                onChange={e => updateField(r.id, 'name', e.target.value)}
                                                className="bg-transparent w-full outline-none"
                                            />
                                            <button onClick={() => onDeleteStudent(r.id)} className="opacity-0 group-hover/item:opacity-100 text-red-400 hover:text-red-600 shrink-0">
                                                <Trash2 size={10} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
      ) : (
        <div className="flex-1 bg-white/5 backdrop-blur-[1px] rounded-[40px] shadow-2xl overflow-hidden flex flex-col border border-white/10 mx-8 mb-8">
            <div className="overflow-auto flex-1 custom-scrollbar">
                <table className="w-full border-collapse table-fixed min-w-[900px]">
                    <thead className="sticky top-0 z-40 bg-white/10 backdrop-blur-md">
                        <tr className="border-b border-white/5">
                            <th className="w-16 h-14 text-[10px] font-black text-slate-900 uppercase tracking-widest">#</th>
                            <th className="w-64 text-left px-4 text-[10px] font-black text-slate-900 uppercase tracking-widest">Task / Item</th>
                            <th className="w-40 text-center text-[10px] font-black text-slate-900 uppercase tracking-widest">Deadline</th>
                            <th className="w-40 text-center text-[10px] font-black text-slate-900 uppercase tracking-widest">Status</th>
                            <th className="text-left px-4 text-[10px] font-black text-slate-900 uppercase tracking-widest">Notes</th>
                            <th className="w-20 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Del</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredReminders.map((s, idx) => (
                            <tr key={s.id} className={`group hover:bg-white/10 transition-all h-8 ${getRowBg(idx)}`}>
                                <td className="text-center text-[10px] font-bold text-slate-400">{idx + 1}</td>
                                <td className="px-4">
                                    <MultilineInput 
                                        value={s.name} 
                                        onChange={val => updateField(s.id, 'name', val)}
                                        className="w-full bg-transparent font-black text-slate-900 text-xs outline-none"
                                    />
                                </td>
                                <td className="px-4 text-center">
                                    <input 
                                        type="date"
                                        value={displayToIso(s.deadline || '')} 
                                        onChange={e => updateField(s.id, 'deadline', isoToDisplay(e.target.value))}
                                        className="bg-white/40 px-3 py-1 rounded-lg border border-white/10 text-[10px] font-black text-slate-600 outline-none cursor-pointer"
                                    />
                                </td>
                                <td className="px-4 text-center">
                                    <select 
                                        value={s.status || 'Pending'} 
                                        onChange={e => updateField(s.id, 'status', e.target.value)}
                                        className="bg-transparent font-black text-[10px] outline-none"
                                    >
                                        <option value="Pending">Pending</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Completed">Completed</option>
                                        <option value="Urgent">Urgent</option>
                                    </select>
                                </td>
                                <td className="px-4">
                                    <MultilineInput 
                                        value={s.note || ''} 
                                        onChange={val => updateField(s.id, 'note', val)}
                                        className="w-full bg-transparent font-bold text-slate-500 text-[11px] outline-none"
                                    />
                                </td>
                                <td className="text-center px-4">
                                    <button onClick={() => onDeleteStudent(s.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-500">
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      )}
    </div>
  );
};

export default ReminderTable;
