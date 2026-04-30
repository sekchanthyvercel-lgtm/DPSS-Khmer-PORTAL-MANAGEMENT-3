import React, { useRef } from 'react';
import { 
  LayoutDashboard, 
  LogOut, 
  CalendarCheck, 
  Contact, 
  LayoutGrid,
  ChevronDown,
  Eye,
  EyeOff,
  ChevronLeft,
  Menu,
  User as UserIcon,
  UserCheck,
  BookOpen,
  FilterX,
  Zap,
  ClipboardList,
  Bell,
  Image as ImageIcon,
  Trash2,
  FileText,
  RotateCcw,
  RotateCw,
  Settings2
} from 'lucide-react';
import { Tab, UserRole, AppSettings, ViewMode, StudentCategory, AppData } from '../types';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  onLogout: () => void;
  role: UserRole;
  onContactsOpen: () => void;
  filters: any;
  setFilters: (f: any) => void;
  uniqueTeachers: string[];
  uniqueAssistants: string[];
  uniqueTimes: string[];
  uniqueLevels?: string[];
  uniqueBehaviors?: string[];
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;
  globalScale: number;
  setGlobalScale: (s: number) => void;
  settings?: AppSettings;
  onUpdateSettings?: (s: AppSettings) => void;
  data: AppData;
  onClearCategory: (categories: StudentCategory[]) => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  localBackground?: string;
  setLocalBackground?: (bg: string) => void;
}

const DEFAULT_BGS = [
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=2000', // Original Beach
  'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)', // Clean Grey
  'linear-gradient(to top, #fff1eb 0%, #ace0f9 100%)', // Soft Peach/Blue
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=2000', // Clean Architecture
  'linear-gradient(to top, #a18cd1 0%, #fbc2eb 100%)', // Soft Purple
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=2000', // Abstract Fluid
  'linear-gradient(to right, #4facfe 0%, #00f2fe 100%)', // Bright Blue
  'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=2000', // Dark Gradient
  'linear-gradient(to top, #3f51b1 0%, #5a55ae 13%, #7b5fac 25%, #8f6aae 38%, #a86aa4 50%, #cc6b8e 62%, #f18271 75%, #f3a469 87%, #f7c978 100%)', // Sunset
  'linear-gradient(120deg, #fdfbfb 0%, #ebedee 100%)' // Minimal
];

export const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  setIsOpen,
  activeTab, 
  setActiveTab, 
  onLogout, 
  role,
  onContactsOpen,
  filters,
  setFilters,
  uniqueTeachers,
  uniqueAssistants,
  uniqueLevels = [],
  settings,
  onUpdateSettings,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  localBackground,
  setLocalBackground
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateFilter = (key: string, value: any) => {
    setFilters({ ...filters, [key]: value });
  };

  const [isSettingsExpanded, setIsSettingsExpanded] = React.useState(false);

  const handleTabSelect = (tab: Tab) => {
    // If user is selecting text, don't trigger the tab switch
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      return;
    }
    setActiveTab(tab);
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  const handleSetLocalBackground = (bgUrl: string) => {
    if (setLocalBackground) {
      setLocalBackground(bgUrl);
      localStorage.setItem('dps_background', bgUrl);
    }
  };

  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && setLocalBackground) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1280;
          const MAX_HEIGHT = 720;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          // Compress to WebP with 0.4 quality to save massive space
          const dataUrl = canvas.toDataURL('image/webp', 0.4);
          handleSetLocalBackground(dataUrl);
          
          if (fileInputRef.current) fileInputRef.current.value = '';
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const removeBackground = () => {
    handleSetLocalBackground(DEFAULT_BGS[0]);
  };

  const resetFilters = () => {
    setFilters({
      ...filters,
      teacher: '',
      assistant: '',
      time: '',
      level: '',
      behavior: '',
      searchQuery: '',
      deadline: '',
      showHidden: false
    });
  };

  const navItems = [
    { id: Tab.Dashboard, icon: LayoutDashboard, label: 'Dashboard', roles: ['Admin', 'Teacher', 'Finance'] },
    { id: Tab.Hall, icon: LayoutGrid, label: 'Hall Study', roles: ['Admin', 'Teacher', 'Finance'] },
    { id: Tab.Attendance, icon: CalendarCheck, label: 'Attendance', roles: ['Admin', 'Teacher', 'Finance'] },
    { id: Tab.Penalty, icon: Zap, label: 'Late/Absence Log', roles: ['Admin', 'Teacher', 'Finance'] },
    { id: Tab.DailyTask, icon: ClipboardList, label: 'Daily Task', roles: ['Admin', 'Teacher', 'Finance'] },
    { id: Tab.Reminder, icon: Bell, label: 'Reminder', roles: ['Admin', 'Teacher', 'Finance'] },
    { id: Tab.DPSS, icon: FileText, label: 'DPSS', roles: ['Admin', 'Teacher', 'Finance'] },
    { id: Tab.RecycleBin, icon: Trash2, label: 'Recycle Bin', roles: ['Admin', 'Teacher'] },
  ];

  const filterSelectStyle = "w-full bg-white/10 border border-white/20 rounded-xl py-2.5 px-3 text-[11px] text-slate-900 font-black outline-none transition-all cursor-pointer appearance-none hover:bg-white/20 focus:ring-4 focus:ring-primary-500/10 backdrop-blur-md";
  const labelStyle = "text-[10px] font-black text-slate-800 mb-2 flex items-center gap-2 ml-1 tracking-[3px]";

  return (
    <>
      {/* Re-open button when hidden */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="fixed top-4 left-4 z-[60] w-12 h-12 bg-white text-[#1B254B] rounded-xl shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all border border-slate-100"
        >
          <Menu size={24} />
        </button>
      )}

      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside 
        className={`fixed md:relative h-full z-50 md:z-40 bg-white/[0.01] backdrop-blur-[1px] border-r border-white/5 text-slate-800 flex flex-col transition-all duration-300 ease-in-out overflow-hidden shadow-2xl no-print shrink-0 ${
          isOpen ? 'w-80 translate-x-0' : 'w-0 -translate-x-full md:translate-x-0 overflow-hidden'
        }`}
      >
        {/* Branding Area with Collapse Toggle */}
        <div className="p-6 flex items-center justify-between border-b border-white/5 h-20 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg flex-shrink-0">
              D
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight uppercase leading-none text-slate-900">DPSS Khmer</h2>
              <p className="text-[9px] font-black text-slate-700 uppercase tracking-widest mt-1">PORTAL MANAGEMENT</p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 text-slate-400 hover:text-slate-800 hover:bg-white/10 rounded-xl transition-all"
          >
            <ChevronLeft size={20} />
          </button>
        </div>

        {/* Undo/Redo Section */}
        <div className="px-5 py-3 border-b border-white/5 flex gap-2 shrink-0 bg-slate-50/10">
            <button 
                onClick={onUndo}
                disabled={!canUndo}
                title="Undo (Ctrl+Z)"
                className={`flex-1 h-9 rounded-xl flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest transition-all ${canUndo ? 'bg-white/20 text-slate-900 hover:bg-white/30 border border-slate-200' : 'bg-white/5 text-slate-300 opacity-50 cursor-not-allowed border border-transparent'}`}
            >
                <RotateCcw size={14} /> Undo
            </button>
            <button 
                onClick={onRedo}
                disabled={!canRedo}
                title="Redo (Ctrl+Y)"
                className={`flex-1 h-9 rounded-xl flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest transition-all ${canRedo ? 'bg-white/20 text-slate-900 hover:bg-white/30 border border-slate-200' : 'bg-white/5 text-slate-300 opacity-50 cursor-not-allowed border border-transparent'}`}
            >
                <RotateCw size={14} /> Redo
            </button>
        </div>

        {/* Navigation & Filters */}
        <div className="flex-1 px-5 py-6 space-y-8 overflow-y-auto custom-scrollbar">
          <nav className="space-y-2">
              {navItems.filter(item => item.roles.includes(role)).map(item => (
                <button
                    key={item.id}
                    onClick={() => handleTabSelect(item.id)}
                    className={`flex items-center gap-4 px-6 py-4 rounded-[20px] transition-all w-full group ${
                      activeTab === item.id 
                        ? 'bg-orange-500 text-white shadow-xl shadow-orange-500/20 backdrop-blur-[4px]' 
                        : 'text-slate-600 hover:text-orange-600 hover:bg-white/[0.05]'
                    }`}
                >
                    <item.icon size={22} strokeWidth={activeTab === item.id ? 3 : 2} />
                    <span className="text-[11px] font-black tracking-widest">{item.label}</span>
                </button>
              ))}
          </nav>

          <div className="pt-6 border-t border-white/5">
              <div className="flex items-center justify-between mb-6 px-1">
                  <p className="text-[10px] font-black text-orange-600 tracking-[3px]">Advanced Filters</p>
                  <button onClick={resetFilters} className="p-1.5 text-slate-400 hover:text-red-400 transition-colors">
                      <FilterX size={14} />
                  </button>
              </div>
              
              <div className="space-y-5 px-1">
                  <div>
                    <label className={labelStyle}><UserIcon size={12}/> Teacher</label>
                    <div className="relative">
                        <select value={filters.teacher} onChange={e => updateFilter('teacher', e.target.value)} className={filterSelectStyle}>
                            <option value="">All Teachers</option>
                            {uniqueTeachers.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className={labelStyle}><UserCheck size={12}/> Assistant</label>
                    <div className="relative">
                        <select value={filters.assistant} onChange={e => updateFilter('assistant', e.target.value)} className={filterSelectStyle}>
                            <option value="">All Assistants</option>
                            {uniqueAssistants.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className={labelStyle}><BookOpen size={12}/> Level</label>
                    <div className="relative">
                        <select value={filters.level} onChange={e => updateFilter('level', e.target.value)} className={filterSelectStyle}>
                            <option value="">All Levels</option>
                            {uniqueLevels.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                    </div>
                  </div>

                  <button 
                      onClick={() => updateFilter('showHidden', !filters.showHidden)}
                      className={`w-full mt-6 py-4 rounded-xl flex items-center justify-center gap-3 transition-all text-[10px] font-black uppercase tracking-[2px] border ${filters.showHidden ? 'bg-emerald-500/10 text-emerald-900 border-emerald-500/50' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                  >
                      {filters.showHidden ? <Eye size={16}/> : <EyeOff size={16}/>}
                      {filters.showHidden ? 'Hidden Records Visible' : 'Show Hidden Records'}
                  </button>
              </div>
          </div>
        </div>

        {/* Footer Area */}
        <div className="p-4 bg-white/[0.03] border-t border-white/5 space-y-3 no-print shrink-0 backdrop-blur-[2px]">
          {isSettingsExpanded && (
            <div className="px-2 pb-2 space-y-6 animate-in slide-in-from-bottom-4 duration-300">
              {/* Customization */}
              <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-900 uppercase tracking-[3px] ml-1">Background Theme</p>
                
                <div className="grid grid-cols-5 gap-2">
                  {DEFAULT_BGS.map((bg, idx) => (
                    <button 
                      key={idx}
                      onClick={() => handleSetLocalBackground(bg)}
                      style={{ background: bg.includes('gradient') ? bg : `url(${bg}) center/cover` }}
                      className={`h-10 rounded-lg overflow-hidden border-2 transition-all ${
                        localBackground === bg ? 'border-orange-500 scale-105 shadow-md' : 'border-transparent hover:scale-105'
                      }`}
                    />
                  ))}
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/40 border border-white/40 rounded-2xl text-slate-800 hover:bg-white/60 transition-all text-[10px] font-black uppercase tracking-wider shadow-sm"
                  >
                    <ImageIcon size={16} /> Upload Custom
                  </button>
                  <input type="file" ref={fileInputRef} onChange={handleBackgroundUpload} className="hidden" accept="image/*" />
                  {localBackground && !DEFAULT_BGS.includes(localBackground) && (
                    <button 
                        onClick={removeBackground} 
                        className="w-12 h-12 flex items-center justify-center bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>

              {/* Font Styling Card */}
              <div className="bg-white/40 p-5 rounded-[28px] border border-white/40 shadow-sm space-y-5">
                <div className="flex items-center gap-2 text-slate-800">
                  <Settings2 size={16} />
                  <span className="text-[11px] font-black uppercase tracking-wider">Font Styling</span>
                </div>
                
                <div className="space-y-5">
                  <div className="flex flex-col gap-2">
                    <label className="text-[9px] font-black text-slate-500 ml-1 uppercase tracking-widest">Font Family</label>
                    <div className="relative">
                      <select 
                        value={settings?.fontFamily || 'Inter'}
                        onChange={(e) => onUpdateSettings?.({ ...(settings || { fontSize: 12, fontFamily: 'Inter' }), fontFamily: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-xs font-black outline-none focus:ring-4 focus:ring-orange-500/10 appearance-none pr-10 shadow-sm"
                      >
                        <option value="Inter">Modern (Hall Study)</option>
                        <option value="Space Grotesk">Display (DPSS)</option>
                        <option value="Playfair Display">Elegant</option>
                        <option value="JetBrains Mono">Technical</option>
                        <option value="cursive">Handwritten</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <label className="text-[9px] font-black text-slate-500 ml-1 uppercase tracking-widest leading-none">
                      Font Size for DPSS ({settings?.fontSize || 12}px)
                    </label>
                    <input 
                      type="range" min="10" max="32" 
                      value={settings?.fontSize || 12} 
                      onChange={(e) => onUpdateSettings?.({ ...(settings || { fontSize: 12, fontFamily: 'Inter' }), fontSize: parseInt(e.target.value) })}
                      className="w-full accent-orange-500 cursor-pointer h-1.5 bg-slate-200 rounded-full"
                    />
                  </div>
                </div>
              </div>

              {/* Staff Contacts & Logout */}
              <div className="space-y-1">
                <button 
                  onClick={onContactsOpen}
                  className="flex items-center gap-4 px-6 py-4 rounded-2xl text-slate-600 hover:text-slate-900 hover:bg-white/40 transition-all w-full group"
                >
                  <Contact size={20} className="group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] font-black uppercase tracking-widest leading-none">Staff Contacts</span>
                </button>
                <button 
                  onClick={onLogout}
                  className="flex items-center gap-4 px-6 py-4 rounded-2xl text-slate-600 hover:text-red-500 hover:bg-red-50/20 transition-all w-full group"
                >
                  <LogOut size={20} className="group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] font-black uppercase tracking-widest leading-none">Logout</span>
                </button>
              </div>
            </div>
          )}

          <button 
            onClick={() => setIsSettingsExpanded(!isSettingsExpanded)}
            className={`w-full py-5 rounded-[24px] flex items-center justify-center gap-4 transition-all border shadow-sm ${
              isSettingsExpanded 
                ? 'bg-[#1B254B] text-white border-transparent' 
                : 'bg-white/40 border-white/20 text-orange-600 hover:bg-white/60 hover:scale-[1.02]'
            }`}
          >
            <Settings2 size={22} className={isSettingsExpanded ? 'animate-spin-slow' : ''} />
            <span className="text-[11px] font-black uppercase tracking-[3px]">Settings</span>
          </button>
        </div>
      </aside>
    </>
  );
};
