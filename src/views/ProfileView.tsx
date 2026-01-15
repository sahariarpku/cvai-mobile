import { useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { LogOut, User, Mail, Briefcase, MapPin, DollarSign, Save } from 'lucide-react';
import { settingsService } from '../services/settingsService';

export default function ProfileView() {
    const user = auth.currentUser;
    const [prefs, setPrefs] = useState({
        keywords: '',
        location: '',
        minSalary: '',
        jobType: 'Full Time'
    });
    const [loading, setLoading] = useState(true);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (!user) return;
        const unsub = settingsService.subscribeSettings(user.uid, (settings) => {
            if (settings?.jobPreferences) {
                setPrefs(prev => ({ ...prev, ...settings.jobPreferences }));
            }
            setLoading(false);
        });
        return () => unsub();
    }, [user]);

    const handleSave = async () => {
        if (!user) return;
        try {
            await settingsService.saveSettings(user.uid, { jobPreferences: prefs });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (e) {
            console.error(e);
            alert("Failed to save.");
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    if (loading) return <div className="flex items-center justify-center h-full text-slate-400">Loading Preferences...</div>;

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 p-6 overflow-y-auto">
            <h1 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Profile & Preferences</h1>

            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 mb-6">
                <div className="flex items-center gap-4 mb-2">
                    <div className="size-14 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500">
                        <User size={28} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Account</h2>
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-sm">
                            <Mail size={14} />
                            <span>{user?.email}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 mb-6 space-y-4">
                <h3 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                    <Briefcase size={18} className="text-primary" /> Target Job
                </h3>

                <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Target Role / Keywords</label>
                    <input
                        value={prefs.keywords}
                        onChange={e => setPrefs({ ...prefs, keywords: e.target.value })}
                        placeholder="e.g. Research Assistant, Frontend Dev"
                        className="w-full px-3 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:border-primary transition-colors"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Location</label>
                        <div className="relative">
                            <MapPin size={16} className="absolute left-3 top-3.5 text-slate-400" />
                            <input
                                value={prefs.location}
                                onChange={e => setPrefs({ ...prefs, location: e.target.value })}
                                placeholder="London"
                                className="w-full pl-9 pr-3 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:border-primary transition-colors"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Min Salary</label>
                        <div className="relative">
                            <DollarSign size={16} className="absolute left-3 top-3.5 text-slate-400" />
                            <select
                                value={prefs.minSalary}
                                onChange={e => setPrefs({ ...prefs, minSalary: e.target.value })}
                                className="w-full pl-9 pr-3 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:border-primary transition-colors appearance-none"
                            >
                                <option value="0">Any</option>
                                <option value="25000">25k+</option>
                                <option value="35000">35k+</option>
                                <option value="45000">45k+</option>
                                <option value="60000">60k+</option>
                            </select>
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all mt-2 ${saved ? 'bg-green-600 text-white' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'}`}
                >
                    <Save size={18} /> {saved ? 'Saved!' : 'Save Preferences'}
                </button>
            </div>

            <button
                onClick={handleLogout}
                className="mt-auto w-full py-4 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 font-bold rounded-xl border border-red-100 dark:border-red-900/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
                <LogOut size={18} />
                Sign Out
            </button>

            <p className="text-center text-xs text-slate-300 dark:text-slate-600 mt-6 pb-20">
                AcademiaAI Mobile v1.0.0
            </p>
        </div>
    );
}
