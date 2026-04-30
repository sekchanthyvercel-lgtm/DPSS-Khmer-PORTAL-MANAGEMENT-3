import React, { useState, useMemo } from 'react';
import { StaffDirectory, AppData } from '../types';
import { X, Save, Phone, Send, User, Search } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  data: AppData;
  onUpdate: (directory: StaffDirectory) => void;
}

export const ContactManager: React.FC<Props> = ({ isOpen, onClose, data, onUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Local state for editing to avoid frequent global saves
  const [directory, setDirectory] = useState<StaffDirectory>(data.staffDirectory || {});

  // Extract all unique names from student records (Teachers and Assistants)
  const allStaffNames = useMemo(() => {
    const names = new Set<string>();
    data.students.forEach(s => {
        if (s.teachers) {
            s.teachers.split(',').forEach(t => names.add(t.trim()));
        }
        if (s.assistant) {
            names.add(s.assistant.trim());
        }
    });
    // Also include existing keys in directory even if not currently assigned
    Object.keys(directory).forEach(k => names.add(k));
    
    return Array.from(names).filter(Boolean).sort();
  }, [data.students, directory]);

  const filteredNames = allStaffNames.filter(n => n.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleChange = (name: string, field: 'phone' | 'telegram', value: string) => {
    setDirectory(prev => ({
        ...prev,
        [name]: {
            ...prev[name],
            [field]: value
        }
    }));
  };

  const handleSave = () => {
    onUpdate(directory);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh] overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <div>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <User size={24} className="text-primary-600" /> Staff Contacts
                </h2>
                <p className="text-xs text-slate-500">Manage Phone & Telegram for Notifications</p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
            </button>
        </div>

        {/* Search */}
        <div className="p-4 bg-white border-b border-slate-100">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                    type="text" 
                    placeholder="Search staff name..." 
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
            {filteredNames.length === 0 ? (
                <div className="text-center text-slate-400 py-8">No staff found. Add students first.</div>
            ) : (
                filteredNames.map(name => (
                    <div key={name} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center gap-4">
                        <div className="w-1/3 font-semibold text-slate-700 truncate" title={name}>
                            {name}
                        </div>
                        
                        <div className="flex-1 flex gap-3">
                            {/* Phone Input */}
                            <div className="flex-1 relative group">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500" size={14} />
                                <input 
                                    type="text"
                                    placeholder="+855..."
                                    className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded focus:ring-1 focus:ring-primary-500 outline-none"
                                    value={directory[name]?.phone || ''}
                                    onChange={e => handleChange(name, 'phone', e.target.value)}
                                />
                            </div>

                            {/* Telegram Input */}
                            <div className="flex-1 relative group">
                                <Send className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500" size={14} />
                                <input 
                                    type="text"
                                    placeholder="Telegram User"
                                    className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded focus:ring-1 focus:ring-emerald-500 outline-none"
                                    value={directory[name]?.telegram || ''}
                                    onChange={e => handleChange(name, 'telegram', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-white flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Cancel</button>
            <button onClick={handleSave} className="px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 shadow-sm flex items-center gap-2">
                <Save size={18} /> Save Contacts
            </button>
        </div>
      </div>
    </div>
  );
};