import React, { useState, useEffect, useMemo } from 'react';
import { StudentTable } from './components/StudentTable';
import { PenaltyTable } from './components/PenaltyTable';
import { DailyTaskTable } from './components/DailyTaskTable';
import { LandingPage } from './components/LandingPage';
import { AIModal } from './components/AIModal';
import { AttendanceTable } from './components/AttendanceTable';
import { FinanceTable } from './components/FinanceTable';
import { CardGenerator } from './components/CardGenerator';
import { MaintenancePanel } from './components/MaintenancePanel';
import { Sidebar } from './components/Sidebar';
import { ContactManager } from './components/ContactManager';
import { SupermanAnimation } from './components/SupermanAnimation';
import ReminderTable from './components/ReminderTable';
import DPSSTable from './components/DPSSTable';
import { RecycleBin } from './components/RecycleBin';
import { Dashboard } from './components/Dashboard';
import { AppData, Student, CurrentUser, UserRole, ColumnConfig, Tab, ViewMode, AppSettings, StudentCategory } from './types';
import { subscribeToData, saveData } from './services/firebase';
import { Menu, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { addMonths, format } from 'date-fns';

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'c2', key: 'teachers', label: 'TEACHERS', width: 180, visible: true, type: 'text' },
  { id: 'c9', key: 'assistant', label: 'ASSISTANT', width: 150, visible: true, type: 'text' },
  { id: 'c3', key: 'level', label: 'LEVEL', width: 85, visible: true, type: 'text' },
  { id: 'c5', key: 'behavior', label: 'BEHAVIOR', width: 180, visible: true, type: 'text' },
  { id: 'c_schedule', key: 'schedule', label: 'SCHEDULE', width: 140, visible: true, type: 'text' },
  { id: 'c4', key: 'time', label: 'TIME', width: 110, visible: true, type: 'text' },
  { id: 'c6', key: 'duration', label: 'DURATION', width: 100, visible: true, type: 'text' },
  { id: 'c7', key: 'startDate', label: 'START', width: 100, visible: true, type: 'text' },
  { id: 'c8', key: 'deadline', label: 'DEADLINE', width: 100, visible: true, type: 'text' }
];

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() => {
    const stored = localStorage.getItem('dps_user');
    return stored ? JSON.parse(stored) : null;
  });

  const [data, setData] = useState<AppData>({ 
    students: [], 
    settings: { 
      fontSize: 12, 
      fontFamily: "'Inter', sans-serif", 
      columns: DEFAULT_COLUMNS,
      backgroundImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=2000'
    },
    attendance: {}
  });

  const [localBackground, setLocalBackground] = useState<string>(() => {
    return localStorage.getItem('dps_background') || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=2000';
  });

  const [history, setHistory] = useState<AppData[]>([]);
  const [redoStack, setRedoStack] = useState<AppData[]>([]);

  const [activeTab, setActiveTab] = useState<Tab>(Tab.Hall);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isContactsOpen, setIsContactsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('Default');
  const [globalScale, setGlobalScale] = useState(1);
  
  const [filters, setFilters] = useState<any>({
    searchQuery: '', 
    teacher: '', 
    assistant: '',
    time: '', 
    level: '', 
    behavior: '', 
    deadline: '', 
    showHidden: false,
    attendanceTab: 'PartTime',
    attendanceClass: ''
  });

  const OFFICIAL_DAILY_TASKS = useMemo(() => [
    { name: "Souyean & Sreythea", level: "1A + (5.1)", shift: "Morning", category: "DailyTask" as StudentCategory },
    { name: "Sreythea & Vilya", level: "1A + (5.1)", shift: "Afternoon", category: "DailyTask" as StudentCategory },
    { name: "Chhenglay & Nita", level: "1B-(16.10)", shift: "Morning", category: "DailyTask" as StudentCategory },
    { name: "Chhenglay & Derith", level: "1B-", shift: "Afternoon", category: "DailyTask" as StudentCategory },
    { name: "Meymey & Naza", level: "1B- (1.9)", shift: "Morning", category: "DailyTask" as StudentCategory },
    { name: "Naza & Pulvatey", level: "1B-", shift: "Afternoon", category: "DailyTask" as StudentCategory },
    { name: "Mengthou & Meymey", level: "Pre-2A(I)-", shift: "Morning", category: "DailyTask" as StudentCategory },
    { name: "Chanpanha & Sonita", level: "Pre-2A(I)-", shift: "Afternoon", category: "DailyTask" as StudentCategory },
    { name: "Derith & Mengthou", level: "Pre-2A(I)+", shift: "Morning", category: "DailyTask" as StudentCategory },
    { name: "Lina & Davina", level: "Pre-2A(I)+", shift: "Afternoon", category: "DailyTask" as StudentCategory },
    { name: "Pha & Saravottey", level: "Pre-2A(II)-", shift: "Morning", category: "DailyTask" as StudentCategory },
    { name: "Virak & Chhenglay", level: "Pre-2A(II)-", shift: "Afternoon", category: "DailyTask" as StudentCategory },
    { name: "Sreypov & Chhorvornn", level: "2A-", shift: "Morning", category: "DailyTask" as StudentCategory },
    { name: "Pha & Liza", level: "2A-", shift: "Afternoon", category: "DailyTask" as StudentCategory },
    { name: "Sreyleap & Chhengly", level: "2B-", shift: "Morning", category: "DailyTask" as StudentCategory },
    { name: "Chhorvornn & Sreyren", level: "2B-", shift: "Afternoon", category: "DailyTask" as StudentCategory },
    { name: "S.Vottey & Soklim", level: "2B+", shift: "Morning", category: "DailyTask" as StudentCategory },
    { name: "Davina & Virak", level: "2B+", shift: "Afternoon", category: "DailyTask" as StudentCategory },
    { name: "Piseth & Kimheang", level: "3A-", shift: "Afternoon", category: "DailyTask" as StudentCategory },
    { name: "Nita & Thida", level: "3A-", shift: "Morning", category: "DailyTask" as StudentCategory },
    { name: "Sathyaboth & Thida", level: "3A-", shift: "Afternoon", category: "DailyTask" as StudentCategory },
    { name: "Chhengly & Pisey", level: "3A+", shift: "Morning", category: "DailyTask" as StudentCategory },
    { name: "Chhengly & Naza", level: "3A+", shift: "Afternoon", category: "DailyTask" as StudentCategory },
    { name: "Souyean & Soklim", level: "3B +", shift: "Morning", category: "DailyTask" as StudentCategory },
    { name: "Soklim & Chanpanha", level: "3B +", shift: "Afternoon", category: "DailyTask" as StudentCategory },
    { name: "Lina & Bormey", level: "4A-", shift: "Morning", category: "DailyTask" as StudentCategory },
    { name: "Sreyren & Both", level: "4A-", shift: "Afternoon", category: "DailyTask" as StudentCategory },
    { name: "Pisey & Chhenglay", level: "4A+", shift: "Morning", category: "DailyTask" as StudentCategory },
    { name: "Sonita & Chhorvornn", level: "4A+", shift: "Afternoon", category: "DailyTask" as StudentCategory },
    { name: "Virak & Socheata", level: "4A+", shift: "Morning", category: "DailyTask" as StudentCategory },
    { name: "Derith & Socheata", level: "4A+", shift: "Afternoon", category: "DailyTask" as StudentCategory },
    { name: "Bormey & Chomnan", level: "4B+", shift: "Morning", category: "DailyTask" as StudentCategory },
    { name: "Socheata & Dalin", level: "4B+", shift: "Afternoon", category: "DailyTask" as StudentCategory },
    { name: "Seavninh & Derith", level: "5A-", shift: "Morning", category: "DailyTask" as StudentCategory },
    { name: "Dalin & Piseth", level: "5A-", shift: "Afternoon", category: "DailyTask" as StudentCategory },
    { name: "Thida & Sreypov", level: "5B-", shift: "Morning", category: "DailyTask" as StudentCategory },
    { name: "Pulvatey & Pha", level: "5B-", shift: "Afternoon", category: "DailyTask" as StudentCategory }
  ], []);

  // One-time seed for Daily Tasks
  useEffect(() => {
    if (!loading) {
        const hasTasks = data.students.some(s => s.category === 'DailyTask');
        if (!hasTasks) {
            const newTasks: Student[] = OFFICIAL_DAILY_TASKS.map(t => ({
                ...t,
                id: uuidv4(),
                teachers: '',
                behavior: '',
                time: '',
                duration: '',
                startDate: '',
                deadline: format(new Date(), 'dd/MM/yy'),
                assistant: '',
                order: 0,
                isHidden: false
            }));
            handleUpdate({ ...data, students: [...data.students, ...newTasks] });
        }
    }
  }, [loading, data.students.length === 0]);

  const allActiveStudents = useMemo(() => data.students.filter(s => !s.deletedAt), [data.students]);

  // Updated name-to-color logic that can be used consistently
  const getNameColor = (name: string, isAssistant: boolean = false) => {
    if (!name || name === 'N/A') return 'bg-slate-200 text-slate-600';
    const assistantColors = [
      'bg-indigo-50 text-indigo-900 border border-indigo-100',
      'bg-rose-50 text-rose-900 border border-rose-100',
      'bg-emerald-50 text-emerald-900 border border-emerald-100',
      'bg-amber-50 text-amber-900 border border-amber-100', 
      'bg-violet-50 text-violet-900 border border-violet-100',
      'bg-cyan-50 text-cyan-900 border border-cyan-100',
      'bg-fuchsia-50 text-fuchsia-900 border border-fuchsia-100',
      'bg-sky-50 text-sky-900 border border-sky-100'
    ];
    const teacherColors = [
      'bg-slate-50 text-slate-900 border border-slate-100',
      'bg-blue-50 text-blue-900 border border-blue-100',
      'bg-teal-50 text-teal-900 border border-teal-100',
      'bg-orange-50 text-orange-900 border border-orange-100',
      'bg-purple-50 text-purple-900 border border-purple-100',
      'bg-pink-50 text-pink-900 border border-pink-100',
      'bg-green-50 text-green-900 border border-green-100',
      'bg-red-50 text-red-900 border border-red-100'
    ];
    const palette = isAssistant ? assistantColors : teacherColors;
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return palette[Math.abs(hash) % palette.length];
  };

  const uniqueTeachers = useMemo(() => {
    const ts = new Set<string>();
    // From all active students
    allActiveStudents.forEach(s => {
      if (s.teachers) {
        String(s.teachers).split(/[&+,\/]+/).forEach(t => ts.add(t.trim()));
      }
      if (s.teacher) ts.add(String(s.teacher).trim()); // Some legacy keys might use .teacher
    });
    // From staff directory
    if (data.staffDirectory) {
      Object.keys(data.staffDirectory).forEach(name => ts.add(name.trim()));
    }
    return Array.from(ts).filter(Boolean).sort();
  }, [allActiveStudents, data.staffDirectory]);

  const uniqueAssistants = useMemo(() => {
    const asst = new Set<string>();
    allActiveStudents.forEach(s => {
      if (s.assistant) {
        String(s.assistant).split(/[&+,\/]+/).forEach(a => asst.add(a.trim()));
      }
    });
    if (data.staffDirectory) {
      Object.keys(data.staffDirectory).forEach(name => asst.add(name.trim()));
    }
    return Array.from(asst).filter(Boolean).sort();
  }, [allActiveStudents, data.staffDirectory]);

  const uniqueTimes = useMemo(() => {
    const tm = new Set<string>();
    allActiveStudents.forEach(s => {
      if (s.time) String(s.time).split('&').forEach(t => tm.add(t.trim()));
    });
    return Array.from(tm).filter(Boolean).sort();
  }, [allActiveStudents]);

  const uniqueLevels = useMemo(() => {
    const lv = new Set<string>();
    allActiveStudents.forEach(s => {
      if (s.level) String(s.level).split('&').forEach(l => lv.add(l.trim()));
    });
    return Array.from(lv).filter(Boolean).sort();
  }, [allActiveStudents]);

  const uniqueBehaviors = useMemo(() => {
    const bh = new Set<string>();
    allActiveStudents.forEach(s => s.behavior && bh.add(String(s.behavior).trim()));
    return Array.from(bh).filter(Boolean).sort();
  }, [allActiveStudents]);

  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = subscribeToData((newData) => {
      // Ensure DEFAULT_COLUMNS are initialized
      if (!newData.settings?.columns) {
          newData.settings = { ...(newData.settings || { fontSize: 12, fontFamily: "'Inter', sans-serif" }), columns: DEFAULT_COLUMNS };
      } else {
        // Migration: Remove redundant 'name' or 'Full Name' column if it exists in settings
        const filteredCols = newData.settings.columns.filter((c: any) => 
          c.key !== 'name' && c.label?.toUpperCase() !== 'FULL NAME'
        );
        if (filteredCols.length !== newData.settings.columns.length) {
          newData.settings.columns = filteredCols;
        }

        // Migration: Ensure 'schedule' column exists if missing
        const hasSchedule = newData.settings.columns.some((c: any) => c.key === 'schedule');
        if (!hasSchedule) {
          const newCols = [...newData.settings.columns];
          // Try to insert after behavior or before time
          const behaviorIdx = newCols.findIndex((c: any) => c.key === 'behavior');
          if (behaviorIdx !== -1) {
            newCols.splice(behaviorIdx + 1, 0, DEFAULT_COLUMNS.find(c => c.key === 'schedule')!);
          } else {
            newCols.push(DEFAULT_COLUMNS.find(c => c.key === 'schedule')!);
          }
          newData.settings.columns = newCols;
        }

        // Migration: Reorder 'assistant' between 'teachers' and 'level' if it is at the end
        const assistantIdx = newData.settings.columns.findIndex((c: any) => c.key === 'assistant');
        const teachersIdx = newData.settings.columns.findIndex((c: any) => c.key === 'teachers');
        if (assistantIdx !== -1 && teachersIdx !== -1 && assistantIdx > teachersIdx + 1) {
          const newCols = [...newData.settings.columns];
          const [assistantCol] = newCols.splice(assistantIdx, 1);
          newCols.splice(teachersIdx + 1, 0, assistantCol);
          newData.settings.columns = newCols;
        }
      }
      setData(newData);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsubscribe();
  }, [currentUser]);

  const handleUpdate = (newData: AppData, skipHistory = false) => {
      if (!skipHistory) {
        setHistory(prev => [...prev.slice(-19), data]); // Keep last 20 states
        setRedoStack([]);
      }
      setData(newData);
      saveData(newData);
  };

  const undo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setRedoStack(prev => [...prev, data]);
    setHistory(prev => prev.slice(0, -1));
    setData(previous);
    saveData(previous);
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setHistory(prev => [...prev, data]);
    setRedoStack(prev => prev.slice(0, -1));
    setData(next);
    saveData(next);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          redo();
        } else {
          e.preventDefault();
          undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [history, redoStack, data]);

  const handleAddStudent = (parsedData?: Partial<Student> | Partial<Student>[]) => {
    const incomingData = Array.isArray(parsedData) ? parsedData : (parsedData ? [parsedData] : [{}]);
    const newStudents = incomingData.map((s, index) => {
        const today = new Date();
        
        let determinedCategory: StudentCategory = 'Hall';
        if (activeTab === Tab.Attendance) determinedCategory = 'Class';
        else if (activeTab === Tab.Finance) determinedCategory = 'Office';
        else if (activeTab === Tab.Penalty) determinedCategory = 'Penalty';
        
        return {
          id: uuidv4(),
          name: '',
          category: determinedCategory,
          order: data.students.length + index,
          isHidden: false,
          parentContact: false,
          headTeacher: false,
          startDate: s.startDate || format(today, 'dd/MM/yyyy'),
          deadline: s.deadline || format(addMonths(today, 1), 'dd/MM/yyyy'),
          ...s
        } as Student;
    });
    handleUpdate({ ...data, students: [...newStudents, ...data.students] });
  };

  const handleLogin = (name: string, role: UserRole, pin: string) => {
    const pins: Record<UserRole, string> = { Admin: '888', Teacher: '1234', Finance: '555' };
    if (pin === (pins as any)[role]) {
      const user: CurrentUser = { name, role };
      setCurrentUser(user);
      localStorage.setItem('dps_user', JSON.stringify(user));
    } else {
      alert("Invalid PIN.");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('dps_user');
  };

  const handleClearCategory = (categories: StudentCategory[]) => {
    if (!window.confirm(`Are you sure you want to move ALL students in ${categories.join('/')} to the Recycle Bin?`)) return;
    const now = new Date().toISOString();
    const updatedStudents = data.students.map(s => 
      categories.includes(s.category) ? { ...s, deletedAt: now } : s
    );
    handleUpdate({ ...data, students: updatedStudents });
  };

  const handleDeleteStudent = (ids: string | string[], skipConfirm = false) => {
    const idList = Array.isArray(ids) ? ids : [ids];
    if (idList.length === 0) return;
    
    if (skipConfirm || window.confirm(idList.length > 1 ? `Move ${idList.length} records to Recycle Bin?` : 'Move to Recycle Bin?')) {
      const now = new Date().toISOString();
      const idSet = new Set(idList);
      const updatedStudents = data.students.map(s => 
        idSet.has(s.id) ? { ...s, deletedAt: now } : s
      );
      handleUpdate({ ...data, students: updatedStudents });
    }
  };

  // Automatically purge items older than 30 days
  useEffect(() => {
    if (!loading && data.students.length > 0) {
      const now = new Date();
      const filtered = data.students.filter(s => {
        if (!s.deletedAt) return true;
        const deletedDate = new Date(s.deletedAt);
        const diffDays = (now.getTime() - deletedDate.getTime()) / (1000 * 60 * 60 * 24);
        return diffDays < 30;
      });
      
      if (filtered.length !== data.students.length) {
        handleUpdate({ ...data, students: filtered });
      }
    }
  }, [loading, data.students.length]);

  if (!currentUser) return <LandingPage onLogin={handleLogin} />;

  const isModuleLocked = (module: 'Hall' | 'Attendance' | 'Finance') => {
    return data.moduleLocks?.[module] || false;
  };

  return (
    <div 
      className="h-screen flex font-sans overflow-hidden transition-all duration-700 bg-cover bg-center bg-fixed" 
      style={{ 
        fontFamily: data.settings?.fontFamily || "'Inter', sans-serif",
        backgroundImage: localBackground ? (localBackground.includes('linear-gradient') || localBackground.includes('radial-gradient') ? localBackground : `url('${localBackground}')`) : "url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=2000')"
      }}
    >
      <Sidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen}
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={handleLogout} 
        role={currentUser.role} 
        onContactsOpen={() => setIsContactsOpen(true)}
        filters={filters}
        setFilters={setFilters}
        uniqueTeachers={uniqueTeachers}
        uniqueAssistants={uniqueAssistants}
        uniqueTimes={uniqueTimes}
        uniqueLevels={uniqueLevels}
        uniqueBehaviors={uniqueBehaviors}
        viewMode={viewMode}
        setViewMode={setViewMode}
        globalScale={globalScale}
        setGlobalScale={setGlobalScale}
        settings={data.settings}
        onUpdateSettings={(s) => handleUpdate({...data, settings: s})}
        data={data}
        onClearCategory={handleClearCategory}
        canUndo={history.length > 0}
        canRedo={redoStack.length > 0}
        onUndo={undo}
        onRedo={redo}
        localBackground={localBackground}
        setLocalBackground={setLocalBackground}
      />
      
      <AIModal 
        isOpen={isAiOpen} 
        onClose={() => setIsAiOpen(false)} 
        onAdd={handleAddStudent} 
        mode={
            activeTab === Tab.Attendance ? 'Attendance' : 
            activeTab === Tab.Finance ? 'Finance' : 
            activeTab === Tab.DailyTask ? 'DailyTask' : 'Hall'
        } 
      />
      
      <ContactManager 
        isOpen={isContactsOpen} 
        onClose={() => setIsContactsOpen(false)} 
        data={data} 
        onUpdate={(dir) => handleUpdate({...data, staffDirectory: dir})} 
      />

      <SupermanAnimation students={data.students} />

      <main 
        className="flex-1 flex flex-col overflow-hidden transition-transform duration-300 origin-top-left bg-transparent"
        style={{ transform: `scale(${globalScale})`, width: `${100/globalScale}%`, height: `${100/globalScale}%` }}
      >
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-900 gap-4">
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="font-black text-sm tracking-widest uppercase">Syncing Cloud...</p>
          </div>
        ) : (
          <>
            {activeTab === Tab.Hall && (
              <StudentTable 
                students={allActiveStudents} 
                columns={data.settings?.columns || DEFAULT_COLUMNS}
                onUpdate={students => handleUpdate({...data, students: [...students, ...data.students.filter(s => s.deletedAt)]})} 
                onUpdateColumns={cols => handleUpdate({...data, settings: { ...data.settings!, columns: cols }})}
                onDeleteStudent={handleDeleteStudent}
                filters={filters} 
                setFilters={setFilters}
                uniqueTeachers={uniqueTeachers}
                uniqueAssistants={uniqueAssistants}
                uniqueTimes={uniqueTimes}
                uniqueLevels={uniqueLevels}
                uniqueBehaviors={uniqueBehaviors}
                onQuickAdd={() => setIsAiOpen(true)} 
                onAddStudent={(defaults) => handleAddStudent(defaults)} 
                role={currentUser.role}
                onClearCategory={handleClearCategory}
                settings={data.settings}
              />
            )}
            {activeTab === Tab.Penalty && (
              <PenaltyTable 
                students={allActiveStudents} 
                onUpdate={students => handleUpdate({...data, students: [...students, ...data.students.filter(s => s.deletedAt)]})} 
                onDeleteStudent={handleDeleteStudent}
                filters={filters} 
                setFilters={setFilters}
                uniqueTeachers={uniqueTeachers}
                uniqueAssistants={uniqueAssistants}
                uniqueLevels={uniqueLevels}
                onQuickAdd={() => setIsAiOpen(true)} 
                onAddStudent={(defaults) => handleAddStudent(defaults)} 
                role={currentUser.role}
                onClearCategory={handleClearCategory}
                settings={data.settings}
              />
            )}
            {activeTab === Tab.DailyTask && (
              <DailyTaskTable 
                students={allActiveStudents} 
                data={data}
                onUpdate={handleUpdate} 
                onDeleteStudent={handleDeleteStudent}
                filters={filters} 
                setFilters={setFilters}
                uniqueTeachers={uniqueTeachers}
                uniqueAssistants={uniqueAssistants}
                onAddStudent={(defaults) => handleAddStudent(defaults)} 
                role={currentUser.role}
                onClearCategory={handleClearCategory}
                settings={data.settings}
              />
            )}
            {activeTab === Tab.Reminder && (
              <ReminderTable 
                students={allActiveStudents} 
                onAddStudent={handleAddStudent}
                onUpdateStudent={(id, updates) => handleUpdate({ ...data, students: data.students.map(s => s.id === id ? { ...s, ...updates } : s) })}
                onDeleteStudent={handleDeleteStudent}
                onClearCategory={handleClearCategory}
                filters={filters}
                setFilters={setFilters}
                role={currentUser.role}
                settings={data.settings}
                onUpdateSettings={(s) => handleUpdate({ ...data, settings: s })}
              />
            )}
            {activeTab === Tab.DPSS && (
                <DPSSTable data={data} onUpdate={handleUpdate} />
            )}
            {activeTab === Tab.Attendance && (
              <AttendanceTable 
                students={allActiveStudents} 
                data={data} 
                onDeleteStudent={handleDeleteStudent}
                filters={filters} 
                setFilters={setFilters}
                uniqueTeachers={uniqueTeachers}
                uniqueAssistants={uniqueAssistants}
                uniqueLevels={uniqueLevels}
                uniqueTimes={uniqueTimes}
                onUpdate={handleUpdate} 
                onAddStudent={handleAddStudent}
                onQuickAdd={() => setIsAiOpen(true)}
                isLocked={isModuleLocked('Attendance')}
                role={currentUser.role}
                onClearCategory={handleClearCategory}
                settings={data.settings}
              />
            )}
            {activeTab === Tab.Finance && (
              <FinanceTable 
                students={allActiveStudents} 
                data={data} 
                onUpdate={handleUpdate} 
                onQuickAdd={() => setIsAiOpen(true)}
                onAddStudent={handleAddStudent}
                isLocked={isModuleLocked('Finance')}
                filters={filters}
                setFilters={setFilters}
              />
            )}
            {activeTab === Tab.StudentCard && (
              <CardGenerator 
                students={allActiveStudents} 
                data={data} 
                onUpdate={handleUpdate} 
                onQuickAdd={() => setIsAiOpen(true)}
                onAddStudent={handleAddStudent}
                filters={filters}
                setFilters={setFilters}
              />
            )}
            {activeTab === Tab.Maintenance && (
              <MaintenancePanel data={data} onUpdate={handleUpdate} />
            )}
            {activeTab === Tab.RecycleBin && (
              <RecycleBin data={data} onUpdate={handleUpdate} />
            )}
            {activeTab === Tab.Dashboard && (
              <Dashboard 
                data={data} 
                students={allActiveStudents} 
                filters={filters}
                setFilters={setFilters}
                uniqueTeachers={uniqueTeachers}
                uniqueAssistants={uniqueAssistants}
                onSelectTeacher={(name) => {
                  setFilters({ ...filters, teacher: name, assistant: '', searchQuery: '' });
                  setActiveTab(Tab.Hall);
                }}
                onSelectAssistant={(name) => {
                  setFilters({ ...filters, assistant: name, teacher: '', searchQuery: '' });
                  setActiveTab(Tab.Hall);
                }}
              />
            )}
          </>
        )}
      </main>

      <div className="fixed bottom-6 right-6 flex flex-col gap-3 no-print z-50">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="w-14 h-14 bg-white text-slate-400 rounded-full shadow-2xl flex items-center justify-center hover:text-primary-500 hover:scale-110 active:scale-95 transition-all border-2 border-slate-100">
            <Menu size={24} />
          </button>
      </div>
    </div>
  );
};

export default App;