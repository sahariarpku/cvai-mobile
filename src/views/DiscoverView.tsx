
import { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { X, Heart, Briefcase, MapPin, GraduationCap, Info, ExternalLink } from 'lucide-react';
import type { Job } from '../types';
import axios from 'axios';
import { db, auth } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

// Mock data removed per warning

export default function DiscoverView() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        try {
            setLoading(true);
            const res = await axios.get('/api/jobs/search');
            // Server returns { jobs: [...] }
            let data = res.data.jobs || [];

            // Sort by match score if available (mimic desktop)
            data.sort((a: any, b: any) => (b.matchScore || 0) - (a.matchScore || 0));

            setJobs(data);
        } catch (error) {
            console.error("Failed to fetch jobs", error);
            setJobs([]);
        } finally {
            setLoading(false);
        }
    };


    const removeJob = async (id: string, direction: 'left' | 'right') => {
        const jobToSave = jobs.find(j => j.id === id); // Find job data before removing

        // If details modal is open for this job, close it
        if (selectedJob?.id === id) setSelectedJob(null);

        setJobs((prev) => prev.filter((job) => job.id !== id));
        console.log(`Swiped ${direction} on job ${id}`);

        if (direction === 'right' && jobToSave) {
            if (!auth.currentUser) {
                console.error("User not logged in, cannot save job");
                return;
            }
            try {
                // Determine user ID (assuming auth is ready)
                const uid = auth.currentUser.uid;

                await addDoc(collection(db, 'applications'), {
                    userId: uid,
                    jobId: jobToSave.id,
                    title: jobToSave.title,
                    employer: jobToSave.employer || jobToSave.institution || '',
                    location: jobToSave.location || 'Remote',
                    link: jobToSave.link || jobToSave.url || '',
                    deadline: jobToSave.deadline || '',
                    raw_data: jobToSave,
                    status: 'Saved',
                    userNotes: '',
                    created_at: new Date().toISOString()
                });
                console.log("Job saved to Firestore applications collection");
            } catch (err) {
                console.error("Error saving job to firestore:", err);
            }
        }
    };

    if (loading) return <div className="flex items-center justify-center h-full text-gray-500">Loading Jobs...</div>;
    if (jobs.length === 0) return <div className="flex items-center justify-center h-full text-gray-500 p-8 text-center">No more jobs! Check back later.</div>;

    const activeJobs = [...jobs].reverse();

    return (
        <div className="relative w-full h-full flex flex-col items-center justify-center p-4 bg-gray-50 overflow-hidden">
            <div className="relative w-full max-w-sm h-[75vh]">
                <AnimatePresence>
                    {activeJobs.map((job, index) => {
                        const isTop = index === activeJobs.length - 1;
                        return (
                            <Card
                                key={job.id}
                                job={job}
                                isTop={isTop}
                                onSwipe={(dir) => removeJob(job.id, dir)}
                                onInfo={() => setSelectedJob(job)}
                            />
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-6 mt-6 z-10">
                <button
                    onClick={() => removeJob(jobs[0].id, 'left')}
                    className="p-4 bg-white rounded-full shadow-lg text-red-500 hover:bg-red-50 transition-colors border border-red-100"
                >
                    <X size={32} />
                </button>
                <div className="w-4"></div>
                <button
                    onClick={() => removeJob(jobs[0].id, 'right')}
                    className="p-4 bg-white rounded-full shadow-lg text-green-500 hover:bg-green-50 transition-colors border border-green-100"
                >
                    <Heart size={32} fill="currentColor" />
                </button>
            </div>

            {/* Job Details Modal */}
            <AnimatePresence>
                {selectedJob && (
                    <motion.div
                        initial={{ opacity: 0, y: '100%' }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed inset-0 z-50 bg-white flex flex-col"
                    >
                        <div className="relative h-48 bg-blue-600 shrink-0">
                            {selectedJob.imageUrl ? (
                                <img src={selectedJob.imageUrl} alt={selectedJob.employer} className="w-full h-full object-cover opacity-80" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-blue-600 to-indigo-800" />
                            )}
                            <button
                                onClick={() => setSelectedJob(null)}
                                className="absolute top-4 right-4 p-2 bg-black/20 text-white rounded-full backdrop-blur-md"
                            >
                                <X size={24} />
                            </button>
                            <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black/60 to-transparent text-white">
                                <h2 className="text-2xl font-bold leading-tight">{selectedJob.title}</h2>
                                <p className="opacity-90 font-medium">{selectedJob.employer || selectedJob.institution}</p>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Match Score */}
                            {(selectedJob.matchScore !== undefined) && (
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-bold text-blue-800 flex items-center gap-1">
                                            <Heart size={16} className="fill-blue-600 text-blue-600" /> AI Match
                                        </span>
                                        <span className="font-black text-xl text-blue-600">{selectedJob.matchScore}%</span>
                                    </div>
                                    <div className="w-full bg-blue-200 rounded-full h-2">
                                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${selectedJob.matchScore}%` }}></div>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    <p className="text-xs text-gray-400 uppercase font-bold mb-1">Location</p>
                                    <div className="flex items-center gap-1 text-gray-700 font-medium">
                                        <MapPin size={16} /> {selectedJob.location || 'Remote'}
                                    </div>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    <p className="text-xs text-gray-400 uppercase font-bold mb-1">Salary</p>
                                    <div className="flex items-center gap-1 text-gray-700 font-medium">
                                        <Briefcase size={16} /> {selectedJob.salary || 'Competitive'}
                                    </div>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    <p className="text-xs text-gray-400 uppercase font-bold mb-1">Type</p>
                                    <div className="flex items-center gap-1 text-gray-700 font-medium">
                                        <GraduationCap size={16} /> {selectedJob.type || 'Full-time'}
                                    </div>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    <p className="text-xs text-gray-400 uppercase font-bold mb-1">Deadline</p>
                                    <div className="text-gray-700 font-medium">
                                        {selectedJob.deadline || 'Open'}
                                    </div>
                                </div>
                            </div>

                            <div className="prose prose-sm max-w-none text-gray-600">
                                <h3 className="text-gray-900 font-bold text-lg mb-2">About the Role</h3>
                                <p className="whitespace-pre-line">{selectedJob.description}</p>
                            </div>

                            <div className="pb-8">
                                <a
                                    href={selectedJob.link}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block w-full py-4 bg-primary text-white text-center font-bold rounded-xl shadow-lg shadow-blue-200 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                                >
                                    Apply Now <ExternalLink size={18} />
                                </a>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function Card({ job, isTop, onSwipe, onInfo }: { job: Job, isTop: boolean, onSwipe: (dir: 'left' | 'right') => void, onInfo: () => void }) {
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-30, 30]);
    const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

    const handleDragEnd = (_: any, info: any) => {
        const threshold = 100;
        if (info.offset.x > threshold) {
            onSwipe('right');
        } else if (info.offset.x < -threshold) {
            onSwipe('left');
        }
    };

    if (!isTop) {
        return (
            <div className="absolute top-0 left-0 w-full h-full bg-white rounded-3xl shadow-xl p-0 border border-gray-200 transform scale-95 translate-y-4 -z-10 overflow-hidden">
                <div className="h-48 bg-gray-200 w-full" />
                <div className="p-6 space-y-4">
                    <div className="h-6 w-3/4 bg-gray-100 rounded" />
                    <div className="h-4 w-1/2 bg-gray-100 rounded" />
                    <div className="space-y-2 pt-4">
                        <div className="h-3 w-full bg-gray-50 rounded" />
                        <div className="h-3 w-full bg-gray-50 rounded" />
                        <div className="h-3 w-2/3 bg-gray-50 rounded" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            style={{ x, rotate, opacity, cursor: 'grab' }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={handleDragEnd}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ x: x.get() < 0 ? -300 : 300, opacity: 0, transition: { duration: 0.2 } }}
            className="absolute top-0 left-0 w-full h-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col"
        >
            {/* Header Image */}
            <div className="relative h-1/2 bg-gray-100 shrink-0">
                {job.imageUrl ? (
                    <img src={job.imageUrl} alt={job.employer} className="w-full h-full object-cover pointer-events-none" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center text-white/50 text-4xl font-black">
                        {job.employer ? job.employer[0] : 'J'}
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                <div className="absolute bottom-0 left-0 w-full p-6 text-white">
                    <h2 className="text-2xl font-bold leading-tight drop-shadow-md line-clamp-2">{job.title}</h2>
                    <p className="text-white/90 font-medium drop-shadow-md">{job.employer || job.institution}</p>
                </div>

                {/* Info Button */}
                <button
                    onClick={(e) => { e.stopPropagation(); onInfo(); }}
                    className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full text-white transition-colors z-20"
                >
                    <Info size={24} />
                </button>
            </div>

            <div className="flex-1 p-6 flex flex-col gap-4 overflow-hidden relative" onClick={onInfo}>
                <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
                        <MapPin size={12} /> {job.location || 'Remote'}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-bold border border-green-100">
                        <Briefcase size={12} /> {job.salary ? job.salary.substring(0, 15) + (job.salary.length > 15 ? '...' : '') : 'Competitive'}
                    </span>
                    {job.matchScore && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold border border-purple-100">
                            <Heart size={12} className="fill-purple-700" /> {job.matchScore}% Match
                        </span>
                    )}
                </div>

                <div className="prose prose-sm">
                    <p className="text-gray-500 line-clamp-4 leading-relaxed text-sm">
                        {job.description}
                    </p>
                </div>

                <div className="mt-auto pt-4 border-t border-gray-50 text-center">
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Tap for Details</span>
                </div>
            </div>
        </motion.div>
    );
}
