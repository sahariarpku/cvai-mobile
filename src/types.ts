export interface Job {
    id: string;
    title: string;
    employer: string;
    institution?: string; // Some sources use institution
    department?: string;
    location: string;
    salary: string;
    type: string;
    url?: string; // Deprecated, use link
    link?: string; // Added from backend
    description: string;
    postedAt?: string;
    deadline?: string;
    keywords?: string[];
    source?: string; // 'jobs.ac.uk', 'linkedin', etc.

    // AI / Match Fields
    matchScore?: number;
    matchReason?: string;
    missingSkills?: string[];
    imageUrl?: string;
}

export interface Application {
    id: string;
    jobId: string;
    jobTitle: string;
    employer: string;
    status: 'saved' | 'applied' | 'interview' | 'offer' | 'rejected';
    dateSaved: Date;
    dateApplied?: Date;
    notes?: string;
    files: {
        cv?: string; // Path or link
        coverLetter?: string;
    };
}

// Desktop-Compatible Types for Syncing
export interface Education {
    id?: string;
    institution: string;
    degree: string;
    fieldOfStudy?: string;
    startDate?: string;
    endDate?: string;
    gpa?: string;
    thesis?: string;
    courses?: string;
    notes?: string;
}

export interface Experience {
    id?: string;
    role: string;
    company: string;
    duration: string;
    description: string;
}

export interface Project {
    id?: string;
    name: string;
    link?: string;
    description: string;
}

export interface Award {
    id?: string;
    title: string;
    issuer?: string;
    date?: string;
    description?: string;
}

export interface Publication {
    id?: string;
    title: string;
    authors?: string;
    venue?: string; // Journal or Conference
    date?: string;
    link?: string;
    doi?: string;
    description?: string;
}

export interface CustomSection {
    id?: string;
    title: string;
    content: string; // Markdown
}

export interface PersonalDetails {
    fullName: string;
    email: string;
    phone: string;
    linkedin: string;
    github?: string;
    portfolio?: string;
    summary?: string;
    address: string;
    city?: string;
    postcode?: string;
}

export interface CVProfile {
    personal: PersonalDetails;
    education: Education[];
    experience: Experience[];
    skills: string[];
    projects: Project[];
    publications: Publication[];
    awards: Award[];
    references: any[];
    custom: CustomSection[];
}
