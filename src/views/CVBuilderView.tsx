
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, BookOpen, Briefcase, Award, ChevronRight, ArrowLeft, Plus, Trash2, Download, Save, Sparkles, FolderGit2, FileText, Globe } from 'lucide-react';
import { cvService } from '../services/cvService';
import { auth } from '../lib/firebase';
import type { CVProfile } from '../types';
// @ts-ignore
import html2pdf from 'html2pdf.js';

const INITIAL_PROFILE: CVProfile = {
    personal: { fullName: '', email: '', phone: '', address: '', summary: '', linkedin: '', github: '', portfolio: '', city: '', postcode: '' },
    education: [],
    experience: [],
    skills: [],
    projects: [],
    publications: [],
    awards: [],
    references: [],
    custom: []
};

const SECTIONS = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'education', label: 'Education', icon: BookOpen },
    { id: 'experience', label: 'Experience', icon: Briefcase },
    { id: 'projects', label: 'Projects', icon: FolderGit2 },
    { id: 'skills', label: 'Skills', icon: Sparkles },
    { id: 'awards', label: 'Awards', icon: Award },
    { id: 'publications', label: 'Publications', icon: FileText },
    { id: 'custom', label: 'Custom', icon: Globe },
];

export default function CVBuilderView() {
    const [profile, setProfile] = useState<CVProfile>(INITIAL_PROFILE);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        if (!auth.currentUser) return;
        setLoading(true);
        const data = await cvService.getProfile(auth.currentUser.uid);
        if (data) {
            setProfile({ ...INITIAL_PROFILE, ...data, personal: { ...INITIAL_PROFILE.personal, ...data.personal } });
        }
        setLoading(false);
    };

    const handleSave = async () => {
        if (!auth.currentUser) return;
        setSaving(true);
        await cvService.saveProfile(profile, auth.currentUser.uid);
        setSaving(false);
    };

    const handleDownloadPDF = () => {
        setGenerating(true);
        const element = document.getElementById('cv-pdf-render');
        if (!element) {
            setGenerating(false);
            return;
        }

        const opt = {
            margin: 0,
            filename: `${profile.personal.fullName.replace(/\s+/g, '_') || 'Resume'}.pdf`,
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
        };

        html2pdf().set(opt).from(element).save().then(() => setGenerating(false));
    };

    if (loading) return <div className="flex items-center justify-center h-full text-slate-400">Loading Profile...</div>;

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 pb-20">
            <AnimatePresence mode='wait'>
                {!activeSection ? (
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex-1 p-4 overflow-y-auto"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">CV Builder</h1>
                            <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-transform">
                                <Save size={16} /> {saving ? 'Saving...' : 'Save'}
                            </button>
                        </div>

                        <div className="space-y-3">
                            {SECTIONS.map((section) => (
                                <button
                                    key={section.id}
                                    onClick={() => setActiveSection(section.id)}
                                    className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 active:bg-slate-50 dark:active:bg-slate-700 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
                                            <section.icon size={20} />
                                        </div>
                                        <div className="text-left">
                                            <h3 className="font-bold text-slate-900 dark:text-white">{section.label}</h3>
                                            <p className="text-xs text-slate-400">
                                                {section.id === 'personal' ? 'Name, Email, Summary' :
                                                    section.id === 'skills' ? `${profile.skills.length} skills listed` :
                                                        `${(profile as any)[section.id]?.length || 0} entries`}
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronRight size={20} className="text-slate-300" />
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={handleDownloadPDF}
                            disabled={generating}
                            className="mt-8 w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                            <Download size={18} /> {generating ? 'Generating PDF...' : 'Download PDF'}
                        </button>
                    </motion.div>
                ) : (
                    <SectionEditor
                        key="editor"
                        sectionId={activeSection}
                        profile={profile}
                        setProfile={setProfile}
                        onBack={() => setActiveSection(null)}
                    />
                )}
            </AnimatePresence>

            {/* Hidden PDF Render Container */}
            <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
                <div id="cv-pdf-render" className="bg-white text-black p-[15mm] w-[210mm] min-h-[297mm] font-serif leading-relaxed text-[10pt]">
                    {/* Header */}
                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-bold uppercase tracking-wider mb-2">{profile.personal.fullName}</h1>
                        <div className="text-sm text-gray-700 flex flex-wrap justify-center gap-2">
                            <span>{profile.personal.email}</span>
                            {profile.personal.phone && <span>• {profile.personal.phone}</span>}
                            {profile.personal.address && <span>• {profile.personal.city || profile.personal.address}</span>}
                            {profile.personal.linkedin && <span>• LinkedIn</span>}
                        </div>
                    </div>

                    {/* Summary */}
                    {profile.personal.summary && (
                        <div className="mb-5">
                            <h2 className="text-xs font-bold uppercase tracking-widest border-b border-black mb-2 pb-1">Professional Summary</h2>
                            <p className="text-justify text-sm leading-relaxed">{profile.personal.summary}</p>
                        </div>
                    )}

                    {/* Experience */}
                    {profile.experience.length > 0 && (
                        <div className="mb-5">
                            <h2 className="text-xs font-bold uppercase tracking-widest border-b border-black mb-2 pb-1">Experience</h2>
                            {profile.experience.map((exp, i) => (
                                <div key={i} className="mb-3">
                                    <div className="flex justify-between items-baseline font-bold text-[11pt]">
                                        <span>{exp.role}</span>
                                        <span className="text-xs font-normal">{exp.duration}</span>
                                    </div>
                                    <div className="italic text-sm mb-1">{exp.company}</div>
                                    <p className="whitespace-pre-line text-sm text-justify">{exp.description}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Education */}
                    {profile.education.length > 0 && (
                        <div className="mb-5">
                            <h2 className="text-xs font-bold uppercase tracking-widest border-b border-black mb-2 pb-1">Education</h2>
                            {profile.education.map((edu, i) => (
                                <div key={i} className="mb-2">
                                    <div className="flex justify-between items-baseline font-bold text-[11pt]">
                                        <span>{edu.institution}</span>
                                        <span className="text-xs font-normal">{edu.startDate} - {edu.endDate}</span>
                                    </div>
                                    <div className="italic text-sm">{edu.degree} {edu.fieldOfStudy}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Skills */}
                    {profile.skills.length > 0 && (
                        <div className="mb-5">
                            <h2 className="text-xs font-bold uppercase tracking-widest border-b border-black mb-2 pb-1">Skills</h2>
                            <p className="text-sm">{profile.skills.join(', ')}</p>
                        </div>
                    )}

                    {/* Projects */}
                    {profile.projects.length > 0 && (
                        <div className="mb-5">
                            <h2 className="text-xs font-bold uppercase tracking-widest border-b border-black mb-2 pb-1">Projects</h2>
                            {profile.projects.map((p, i) => (
                                <div key={i} className="mb-2">
                                    <div className="font-bold text-[11pt]">{p.name}</div>
                                    <p className="text-sm text-justify">{p.description}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Publications */}
                    {profile.publications.length > 0 && (
                        <div className="mb-5">
                            <h2 className="text-xs font-bold uppercase tracking-widest border-b border-black mb-2 pb-1">Publications</h2>
                            {profile.publications.map((p, i) => (
                                <div key={i} className="mb-2 text-sm">
                                    <span className="font-bold">{p.title}</span>. {p.venue} ({p.date}).
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Awards */}
                    {profile.awards.length > 0 && (
                        <div className="mb-5">
                            <h2 className="text-xs font-bold uppercase tracking-widest border-b border-black mb-2 pb-1">Awards</h2>
                            {profile.awards.map((a, i) => (
                                <div key={i} className="mb-1 text-sm">
                                    <span className="font-bold">{a.title}</span> - {a.issuer} ({a.date})
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function SectionEditor({ sectionId, profile, setProfile, onBack }: any) {
    const sectionName = SECTIONS.find(s => s.id === sectionId)?.label || sectionId;

    const handleUpdate = (field: string, value: any) => {
        setProfile((prev: any) => ({
            ...prev,
            personal: { ...prev.personal, [field]: value }
        }));
    };

    const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
    const [tempItem, setTempItem] = useState<any>(null);

    const handleEditItem = (index: number | null) => {
        setEditingItemIndex(index);
        if (index !== null) {
            setTempItem((profile as any)[sectionId][index]);
        } else {
            if (sectionId === 'education') setTempItem({ institution: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '', gpa: '', thesis: '', courses: '' });
            if (sectionId === 'experience') setTempItem({ company: '', role: '', duration: '', description: '' });
            if (sectionId === 'projects') setTempItem({ name: '', description: '', link: '' });
            if (sectionId === 'awards') setTempItem({ title: '', issuer: '', date: '', description: '' });
            if (sectionId === 'publications') setTempItem({ title: '', venue: '', date: '', link: '', authors: '' });
            if (sectionId === 'custom') setTempItem({ title: '', content: '' });
        }
    };

    const saveItem = () => {
        const list = [...(profile as any)[sectionId]];
        if (editingItemIndex !== null) {
            list[editingItemIndex] = tempItem;
        } else {
            list.push(tempItem);
        }
        setProfile((prev: any) => ({ ...prev, [sectionId]: list }));
        setTempItem(null);
        setEditingItemIndex(null);
    };

    const deleteItem = (index: number) => {
        if (!confirm("Delete item?")) return;
        const list = [...(profile as any)[sectionId]];
        list.splice(index, 1);
        setProfile((prev: any) => ({ ...prev, [sectionId]: list }));
    };

    if (tempItem) {
        return (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 flex flex-col h-full bg-white dark:bg-slate-900 z-50 fixed inset-0">
                <div className="flex items-center gap-4 p-4 border-b border-slate-100 dark:border-slate-800 pt-safe-top">
                    <button onClick={() => setTempItem(null)} className="p-2 -ml-2 text-slate-400">
                        <ArrowLeft size={24} />
                    </button>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">{editingItemIndex !== null ? 'Edit Item' : 'Add Item'}</h2>
                    <button onClick={saveItem} className="ml-auto px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg">Done</button>
                </div>
                <div className="p-6 space-y-4 overflow-y-auto pb-40">
                    {sectionId === 'education' && (
                        <>
                            <Input label="Institution" value={tempItem.institution} onChange={(v: string) => setTempItem({ ...tempItem, institution: v })} />
                            <Input label="Degree" value={tempItem.degree} onChange={(v: string) => setTempItem({ ...tempItem, degree: v })} />
                            <Input label="Field of Study" value={tempItem.fieldOfStudy} onChange={(v: string) => setTempItem({ ...tempItem, fieldOfStudy: v })} />
                            <div className="flex gap-4">
                                <Input label="Start Date" value={tempItem.startDate} onChange={(v: string) => setTempItem({ ...tempItem, startDate: v })} />
                                <Input label="End Date" value={tempItem.endDate} onChange={(v: string) => setTempItem({ ...tempItem, endDate: v })} />
                            </div>
                            <Input label="GPA" value={tempItem.gpa} onChange={(v: string) => setTempItem({ ...tempItem, gpa: v })} />
                            <Input label="Thesis / Project" value={tempItem.thesis} onChange={(v: string) => setTempItem({ ...tempItem, thesis: v })} />
                            <TextArea label="Courses" value={tempItem.courses} onChange={(v: string) => setTempItem({ ...tempItem, courses: v })} />
                        </>
                    )}
                    {sectionId === 'experience' && (
                        <>
                            <Input label="Role" value={tempItem.role} onChange={(v: string) => setTempItem({ ...tempItem, role: v })} />
                            <Input label="Company" value={tempItem.company} onChange={(v: string) => setTempItem({ ...tempItem, company: v })} />
                            <Input label="Duration" value={tempItem.duration} onChange={(v: string) => setTempItem({ ...tempItem, duration: v })} />
                            <TextArea label="Description" value={tempItem.description} onChange={(v: string) => setTempItem({ ...tempItem, description: v })} />
                        </>
                    )}
                    {sectionId === 'projects' && (
                        <>
                            <Input label="Project Name" value={tempItem.name} onChange={(v: string) => setTempItem({ ...tempItem, name: v })} />
                            <Input label="Link" value={tempItem.link} onChange={(v: string) => setTempItem({ ...tempItem, link: v })} />
                            <TextArea label="Description" value={tempItem.description} onChange={(v: string) => setTempItem({ ...tempItem, description: v })} />
                        </>
                    )}
                    {sectionId === 'awards' && (
                        <>
                            <Input label="Title" value={tempItem.title} onChange={(v: string) => setTempItem({ ...tempItem, title: v })} />
                            <Input label="Issuer" value={tempItem.issuer} onChange={(v: string) => setTempItem({ ...tempItem, issuer: v })} />
                            <Input label="Date" value={tempItem.date} onChange={(v: string) => setTempItem({ ...tempItem, date: v })} />
                            <TextArea label="Description" value={tempItem.description} onChange={(v: string) => setTempItem({ ...tempItem, description: v })} />
                        </>
                    )}
                    {sectionId === 'publications' && (
                        <>
                            <Input label="Title" value={tempItem.title} onChange={(v: string) => setTempItem({ ...tempItem, title: v })} />
                            <Input label="Venue" value={tempItem.venue} onChange={(v: string) => setTempItem({ ...tempItem, venue: v })} />
                            <Input label="Date" value={tempItem.date} onChange={(v: string) => setTempItem({ ...tempItem, date: v })} />
                            <TextArea label="Authors" value={tempItem.authors} onChange={(v: string) => setTempItem({ ...tempItem, authors: v })} />
                            <Input label="Link" value={tempItem.link} onChange={(v: string) => setTempItem({ ...tempItem, link: v })} />
                        </>
                    )}
                    {sectionId === 'custom' && (
                        <>
                            <Input label="Section Title" value={tempItem.title} onChange={(v: string) => setTempItem({ ...tempItem, title: v })} />
                            <TextArea label="Content" value={tempItem.content} onChange={(v: string) => setTempItem({ ...tempItem, content: v })} />
                        </>
                    )}
                </div>
            </motion.div>
        )
    }

    return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-900">
            <div className="flex items-center gap-4 p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                <button onClick={onBack} className="p-2 -ml-2 text-slate-400">
                    <ArrowLeft size={24} />
                </button>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{sectionName}</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-6 pb-20">
                {sectionId === 'personal' ? (
                    <div className="space-y-4">
                        <Input label="Full Name" value={profile.personal.fullName} onChange={(v: string) => handleUpdate('fullName', v)} />
                        <Input label="Email" value={profile.personal.email} onChange={(v: string) => handleUpdate('email', v)} />
                        <Input label="Phone" value={profile.personal.phone} onChange={(v: string) => handleUpdate('phone', v)} />

                        <div className="flex gap-4">
                            <Input label="City" value={profile.personal.city} onChange={(v: string) => handleUpdate('city', v)} />
                            <Input label="Postcode" value={profile.personal.postcode} onChange={(v: string) => handleUpdate('postcode', v)} />
                        </div>
                        <Input label="Address Line" value={profile.personal.address} onChange={(v: string) => handleUpdate('address', v)} />

                        <TextArea label="Professional Summary" value={profile.personal.summary} onChange={(v: string) => handleUpdate('summary', v)} />
                        <Input label="LinkedIn" value={profile.personal.linkedin} onChange={(v: string) => handleUpdate('linkedin', v)} />
                        <Input label="GitHub" value={profile.personal.github} onChange={(v: string) => handleUpdate('github', v)} />
                        <Input label="Portfolio" value={profile.personal.portfolio} onChange={(v: string) => handleUpdate('portfolio', v)} />
                    </div>
                ) : sectionId === 'skills' ? (
                    <div className="space-y-4">
                        <TextArea
                            label="Skills (Comma separated)"
                            value={profile.skills.join(', ')}
                            onChange={(v: string) => setProfile({ ...profile, skills: v.split(',').map((s: string) => s.trim()) })}
                        />
                        <p className="text-xs text-slate-400">Tip: Separate your skills with commas. e.g. React, Python, Leadership</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {(profile as any)[sectionId].map((item: any, i: number) => (
                            <div key={i} className="p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex justify-between items-center group">
                                <div onClick={() => handleEditItem(i)} className="flex-1">
                                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">{item.role || item.institution || item.name || item.title || 'Untitled'}</h4>
                                    <p className="text-xs text-slate-500 mt-0.5">{item.company || item.degree || item.date || ''}</p>
                                </div>
                                <button onClick={() => deleteItem(i)} className="p-2 text-slate-300 hover:text-red-500">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                        <button onClick={() => handleEditItem(null)} className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-slate-400 font-bold text-sm flex items-center justify-center gap-2 hover:border-primary hover:text-primary transition-colors">
                            <Plus size={16} /> Add Item
                        </button>
                    </div>
                )}
            </div>
        </motion.div>
    );
}

const Input = ({ label, value, onChange }: { label: string; value: string | undefined; onChange: (val: string) => void }) => (
    <div>
        <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">{label}</label>
        <input
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-shadow"
        />
    </div>
);

const TextArea = ({ label, value, onChange }: { label: string; value: string | undefined; onChange: (val: string) => void }) => (
    <div>
        <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">{label}</label>
        <textarea
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-shadow h-28"
        />
    </div>
);
