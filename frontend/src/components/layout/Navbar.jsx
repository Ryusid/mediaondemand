import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Play, Book, Upload, Search, User, LogOut, Menu, X } from 'lucide-react';
import { logout } from '../../services/auth';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

const Navbar = ({ user, onLogout }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = () => {
        logout();
        onLogout();
        navigate('/');
    };

    const navLinks = [
        { name: 'Browse', path: '/catalog', icon: Search },
        { name: 'Upload', path: '/upload', icon: Upload, protected: true },
    ];

    return (
        <nav className={cn(
            "fixed top-0 left-0 w-full z-50 transition-all duration-300 px-4 py-4",
            isScrolled ? "py-2" : "py-4"
        )}>
            <div className={cn(
                "max-w-7xl mx-auto glass rounded-2xl px-6 py-3 flex items-center justify-between transition-all",
                isScrolled ? "bg-black/60 shadow-xl" : "bg-white/5 shadow-none"
            )}>
                <Link to="/" className="flex items-center gap-2 group">
                    <div className="w-10 h-10 bg-gradient-to-tr from-brand-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="fill-white text-white w-5 h-5 ml-0.5" />
                    </div>
                    <span className="text-xl font-bold font-['Outfit'] tracking-tight">
                        Media<span className="text-brand-400">On</span>Demand
                    </span>
                </Link>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center gap-8">
                    {navLinks.map((link) => (
                        (!link.protected || user) && (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={cn(
                                    "flex items-center gap-2 text-sm font-medium transition-colors hover:text-brand-400",
                                    location.pathname === link.path ? "text-brand-400" : "text-slate-400"
                                )}
                            >
                                <link.icon className="w-4 h-4" />
                                {link.name}
                            </Link>
                        )
                    ))}

                    <div className="h-4 w-px bg-white/10 mx-2" />

                    {user ? (
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 py-1 px-3 bg-white/5 rounded-lg border border-white/10">
                                <div className="w-6 h-6 rounded-full bg-brand-500/20 flex items-center justify-center">
                                    <User className="w-3.5 h-3.5 text-brand-400" />
                                </div>
                                <span className="text-sm font-medium text-slate-300">{user?.name || user?.email || 'User'}</span>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                                title="Logout"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    ) : (
                        <Link to="/login" className="btn-primary py-2 px-6 text-sm">
                            Sign In
                        </Link>
                    )}
                </div>

                {/* Mobile Menu Toggle */}
                <button className="md:hidden p-2" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                    {isMobileMenuOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="md:hidden absolute top-full left-4 right-4 mt-2 glass rounded-2xl p-6 flex flex-col gap-6 animate-in fade-in slide-in-from-top-4">
                    {navLinks.map((link) => (
                        (!link.protected || user) && (
                            <Link
                                key={link.path}
                                to={link.path}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex items-center gap-4 text-lg font-medium"
                            >
                                <link.icon className="w-6 h-6" />
                                {link.name}
                            </Link>
                        )
                    ))}
                    <hr className="border-white/10" />
                    {user ? (
                        <button onClick={handleLogout} className="flex items-center gap-4 text-lg font-medium text-red-400">
                            <LogOut className="w-6 h-6" />
                            Sign Out
                        </button>
                    ) : (
                        <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="btn-primary flex items-center justify-center">
                            Sign In
                        </Link>
                    )}
                </div>
            )}
        </nav>
    );
};

export default Navbar;
