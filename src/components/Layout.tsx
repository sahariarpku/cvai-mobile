
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, FileText, User } from 'lucide-react';
import clsx from 'clsx';

export default function Layout() {
    const navigate = useNavigate();
    const location = useLocation();

    const tabs = [
        { id: 'discover', icon: Search, label: 'Discover', path: '/' },
        { id: 'tracker', icon: Home, label: 'Tracker', path: '/tracker' },
        { id: 'cv', icon: FileText, label: 'CV', path: '/cv' },
        { id: 'profile', icon: User, label: 'Profile', path: '/profile' },
    ];

    return (
        <div className="flex flex-col h-screen max-h-screen bg-gray-100 overflow-hidden">
            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto no-scrollbar pb-20 relative">
                <Outlet />
            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 safe-area-bottom z-50">
                <div className="flex justify-around items-center h-16">
                    {tabs.map((tab) => {
                        const isActive = location.pathname === tab.path;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => navigate(tab.path)}
                                className={clsx(
                                    "flex flex-col items-center justify-center w-full h-full transition-colors duration-200",
                                    isActive ? "text-primary" : "text-gray-400 hover:text-gray-600"
                                )}
                            >
                                <tab.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                                <span className="text-[10px] mt-1 font-medium">{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}
