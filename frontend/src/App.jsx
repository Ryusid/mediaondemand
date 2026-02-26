import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { getSession } from './services/auth';
import Navbar from './components/layout/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Catalog from './pages/Catalog';
import Upload from './pages/Upload';

const App = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const location = useLocation();

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const session = await getSession();
            if (session.isValid()) {
                setUser(session.getIdToken().payload);
            }
        } catch (err) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#020617] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200 flex flex-col">
            <div className="bg-mesh"></div>

            {location.pathname !== '/login' && <Navbar user={user} onLogout={checkAuth} />}

            <main className={`container mx-auto px-4 ${location.pathname !== '/login' ? 'pt-24' : 'pt-8'} flex-grow pb-12`}>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login onLogin={checkAuth} />} />
                    <Route path="/catalog" element={<Catalog />} />
                    <Route path="/upload" element={user ? <Upload /> : <Navigate to="/login" />} />
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </main>

            <footer className="mt-auto py-8 border-t border-white/5 text-center text-slate-500 text-sm">
                <p>&copy; 2026 MediaOnDemand — Built for Advanced Cloud Architectures</p>
            </footer>
        </div>
    );
};

export default App;
