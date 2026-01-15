import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import DiscoverView from './views/DiscoverView';
import TrackerView from './views/TrackerView';
import LoginView from './views/LoginView';
import ProfileView from './views/ProfileView';
import { auth } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

import CVBuilderView from './views/CVBuilderView';

// Placeholders

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="h-screen flex items-center justify-center text-gray-500">Loading...</div>;
  }

  if (!user) {
    return <LoginView />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<DiscoverView />} />
          <Route path="tracker" element={<TrackerView />} />
          <Route path="cv" element={<CVBuilderView />} />
          <Route path="profile" element={<ProfileView />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
