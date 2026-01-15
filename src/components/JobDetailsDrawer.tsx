
import React, { useState, useRef, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { X, Upload, FileText, Trash2, Download, Cloud } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface JobDetailsDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    job: any;
}

export default function JobDetailsDrawer({ isOpen, onClose, job }: JobDetailsDrawerProps) {
    const [uploading, setUploading] = useState(false);
    const [downloading, setDownloading] = useState<string | null>(null);
    const [note, setNote] = useState(job?.notes || '');
    const [savingNote, setSavingNote] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setNote(job?.notes || '');
    }, [job]);

    // Save note on unmount/close or blur could be tricky in modal, let's auto-save on debounce or blur of textarea
    const handleSaveNote = async () => {
        if (!job?.id) return;
        setSavingNote(true);
        try {
            await updateDoc(doc(db, "applications", job.id), { notes: note });
        } catch (error) {
            console.error("Save note failed", error);
        } finally {
            setSavingNote(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0] || !job?.id) return;
        const file = e.target.files[0];

        if (file.size > 700 * 1024) {
            alert("File too large! Limit is 700KB.");
            return;
        }

        setUploading(true);
        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64Content = reader.result as string;
                const fileId = `${auth.currentUser?.uid}_${Date.now()}`;

                await setDoc(doc(db, "file_storage", fileId), {
                    content: base64Content,
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    userId: auth.currentUser?.uid,
                    uploadedAt: new Date().toISOString()
                });

                const newDoc = {
                    fileId: fileId,
                    name: file.name,
                    type: file.type,
                    uploadedAt: new Date().toISOString()
                };

                await updateDoc(doc(db, "applications", job.id), {
                    documents: arrayUnion(newDoc)
                });
                setUploading(false);
            };
        } catch (error) {
            console.error("Upload failed:", error);
            alert("Upload failed");
            setUploading(false);
        }
    };

    const handleDownload = async (fileDoc: any) => {
        if (fileDoc.url) {
            window.open(fileDoc.url, '_blank');
            return;
        }
        if (!fileDoc.fileId) return;

        setDownloading(fileDoc.fileId);
        try {
            const snap = await getDoc(doc(db, "file_storage", fileDoc.fileId));
            if (snap.exists()) {
                const data = snap.data();
                const link = document.createElement('a');
                link.href = data.content;
                link.download = data.name || 'download';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        } catch (e) {
            console.error(e);
            alert("Download failed");
        } finally {
            setDownloading(null);
        }
    };

    const handleDeleteFile = async (fileDoc: any) => {
        if (!confirm("Delete file?")) return;
        try {
            await updateDoc(doc(db, "applications", job.id), {
                documents: arrayRemove(fileDoc)
            });
            if (fileDoc.fileId) {
                await deleteDoc(doc(db, "file_storage", fileDoc.fileId)).catch(console.warn);
            }
        } catch (e) {
            console.error(e);
        }
    };

    if (!job) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed inset-0 z-50 bg-white flex flex-col pt-safe-top"
                >
                    <div className="flex items-center justify-between p-4 border-b border-gray-100">
                        <button onClick={onClose} className="p-2 -ml-2 text-gray-400 hover:text-gray-600">
                            <X size={24} />
                        </button>
                        <div className="flex flex-col items-center">
                            <span className="text-xs font-bold uppercase text-gray-400 mb-0.5">Application Details</span>
                            <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${job.status === 'Saved' ? 'bg-gray-400' : 'bg-green-500'}`} />
                                <span className="font-bold text-sm">{job.status}</span>
                            </div>
                        </div>
                        <div className="w-8"></div> {/* Spacer for center alignment */}
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
                        {/* Status Select */}
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Status</label>
                            <select
                                value={job.status || 'Saved'}
                                onChange={(e) => updateDoc(doc(db, "applications", job.id), { status: e.target.value })}
                                className="w-full bg-white border border-gray-200 rounded-lg p-3 font-bold text-gray-700"
                            >
                                <option value="Saved">Saved</option>
                                <option value="Applied">Applied</option>
                                <option value="Interviewing">Interviewing</option>
                                <option value="Offer">Offer</option>
                                <option value="Rejected">Rejected</option>
                            </select>
                        </div>

                        {/* Metadata Inputs */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Job Title</label>
                                <input
                                    value={job.title}
                                    onChange={(e) => updateDoc(doc(db, "applications", job.id), { title: e.target.value })}
                                    className="w-full text-lg font-bold border-b border-gray-200 py-1 focus:outline-none focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Employer</label>
                                <input
                                    value={job.employer}
                                    onChange={(e) => updateDoc(doc(db, "applications", job.id), { employer: e.target.value })}
                                    className="w-full border-b border-gray-200 py-1 focus:outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>

                        {/* Documents */}
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold flex items-center gap-2"><FileText size={18} /> Documents</h3>
                                <label className={`flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold shadow-sm active:scale-95 transition-transform ${uploading ? 'opacity-70 pointer-events-none' : ''}`}>
                                    {uploading ? <Cloud size={14} className="animate-spin" /> : <Upload size={14} />}
                                    {uploading ? 'Uploading...' : 'Upload'}
                                    <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={handleFileUpload} disabled={uploading} />
                                </label>
                            </div>

                            <div className="space-y-3">
                                {job.documents?.map((doc: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                                                <FileText size={20} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-sm truncate">{doc.name}</p>
                                                <p className="text-xs text-gray-400">{new Date(doc.uploadedAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center">
                                            <button onClick={() => handleDownload(doc)} disabled={downloading === doc.fileId} className="p-2 text-gray-400 hover:text-blue-600">
                                                {downloading === doc.fileId ? <Cloud size={18} className="animate-bounce" /> : <Download size={18} />}
                                            </button>
                                            <button onClick={() => handleDeleteFile(doc)} className="p-2 text-gray-400 hover:text-red-500">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {(!job.documents?.length) && (
                                    <div className="p-6 text-center border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-sm">
                                        No documents yet
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="relative">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-bold">Notes</h3>
                                {savingNote && <span className="text-xs text-green-500 font-bold animate-pulse">Saving...</span>}
                            </div>
                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                onBlur={handleSaveNote}
                                className="w-full h-32 p-4 bg-yellow-50 border border-yellow-100 rounded-xl text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-yellow-200"
                                placeholder="Add notes here..."
                            />
                        </div>

                        {/* Delete Button */}
                        <button
                            onClick={async () => {
                                if (confirm('Delete this application?')) {
                                    await deleteDoc(doc(db, "applications", job.id));
                                    onClose();
                                }
                            }}
                            className="w-full py-4 text-red-500 font-bold bg-red-50 rounded-xl"
                        >
                            Delete Application
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

