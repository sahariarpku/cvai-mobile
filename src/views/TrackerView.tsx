
import { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { MapPin, Calendar } from 'lucide-react';
import clsx from 'clsx';
import JobDetailsDrawer from '../components/JobDetailsDrawer';

export default function TrackerView() {
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedJob, setSelectedJob] = useState<any | null>(null);

    useEffect(() => {
        // Mock auth for now if not logged in using real firebase
        // Just kidding, let's try to list everything if auth is missing or show login prompt
        // For development, we assume user is logged in or we might see nothing.
        // Let's assume the user has a valid auth session from the other tab if they share indexeddb (firebase persistence).
        // If not, we might need to handle login.

        // However, checking auth state:
        const unsubscribeAuth = auth.onAuthStateChanged((user) => {
            if (user) {
                subscribeToApps(user.uid);
            } else {
                setLoading(false);
                // Optionally redirect to login
            }
        });

        return () => unsubscribeAuth();
    }, []);

    const subscribeToApps = (userId: string) => {
        const q = query(
            collection(db, "applications"),
            where("userId", "==", userId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const apps = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            // Sort by created_at desc
            apps.sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

            setApplications(apps);
            setLoading(false);
        });
        return unsubscribe;
    }

    if (loading) return <div className="p-8 text-center text-gray-500">Loading Applications...</div>;

    if (!auth.currentUser) return <div className="p-8 text-center text-gray-500">Please Log In</div>;

    return (
        <div className="p-4 space-y-4 pb-24">
            <h1 className="text-2xl font-bold mb-4">Your Applications</h1>
            {applications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No applications yet. Swipe some jobs!</div>
            ) : (
                applications.map((app) => (
                    <div
                        key={app.id}
                        onClick={() => setSelectedJob(app)}
                        className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-3 active:scale-[0.98] transition-transform"
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-lg leading-tight">{app.title}</h3>
                                <p className="text-sm text-gray-500">{app.employer}</p>
                            </div>
                            <span className={clsx(
                                "px-2 py-1 rounded text-xs font-bold uppercase",
                                app.status === 'Saved' ? "bg-gray-100 text-gray-600" :
                                    app.status === 'Applied' ? "bg-blue-100 text-blue-600" :
                                        app.status === 'Interviewing' ? "bg-amber-100 text-amber-600" :
                                            app.status === 'Offer' ? "bg-green-100 text-green-600" :
                                                "bg-gray-100 text-gray-600"
                            )}>
                                {app.status}
                            </span>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                                <MapPin size={14} />
                                <span>{app.location || 'Remote'}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Calendar size={14} />
                                <span>{app.created_at ? new Date(app.created_at).toLocaleDateString() : 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                ))
            )}

            <JobDetailsDrawer
                isOpen={!!selectedJob}
                onClose={() => setSelectedJob(null)}
                job={selectedJob}
            />
        </div>
    );
}
