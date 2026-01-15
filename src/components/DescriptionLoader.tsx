import { useEffect } from 'react';
import axios from 'axios';
import type { Job } from '../types';

export default function DescriptionLoader({ job, setJob }: { job: Job, setJob: (j: Job | null) => void }) {
    useEffect(() => {
        const fetchDesc = async () => {
            if (!job || (job.description && job.description.length > 100) || !job.link) return;

            try {
                // Determine API URL (handle dev vs prod)
                const isDev = import.meta.env.DEV;
                const baseUrl = isDev ? '' : import.meta.env.VITE_API_URL || '';

                // Use the link to fetch details
                const res = await axios.get(`${baseUrl}/api/jobs/details?url=${encodeURIComponent(job.link)}`);
                if (res.data.description) {
                    setJob({ ...job, description: res.data.description });
                }
            } catch (e) {
                console.error("Failed to load description", e);
            }
        };
        fetchDesc();
    }, [job?.id]);

    return null;
}
