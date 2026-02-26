import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, Loader2, AlertCircle, Hash, CheckCircle2 } from 'lucide-react';
import { signIn, signUp, confirmSignUp, completeNewPassword } from '../services/auth';
import { motion, AnimatePresence } from 'framer-motion';

const Login = ({ onLogin }) => {
    const [mode, setMode] = useState('login'); // login, signup, verify, new_password
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [pendingUser, setPendingUser] = useState(null); // Holds the cognitoUser for password challenge

    const [formData, setFormData] = useState({
        username: '',
        password: '',
        email: '',
        name: '',
        code: '',
        newPassword: ''
    });
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            if (mode === 'login') {
                const result = await signIn(formData.username, formData.password);

                if (result.challenge === 'NewPasswordRequired') {
                    setPendingUser(result.cognitoUser);
                    setMode('new_password');
                    setMessage('Your account requires a new password before signing in.');
                } else {
                    await onLogin();
                    navigate('/catalog');
                }
            }
            else if (mode === 'signup') {
                await signUp(formData.username, formData.password, formData.email, formData.name);
                setMessage('Registration successful! Check your email for a verification code.');
                setMode('verify');
            }
            else if (mode === 'verify') {
                await confirmSignUp(formData.username, formData.code);
                setMessage('Account verified! You can now sign in.');
                setMode('login');
            }
            else if (mode === 'new_password') {
                if (!pendingUser) throw new Error('No pending session found.');
                await completeNewPassword(pendingUser, formData.newPassword);
                setMessage('Password updated! You can now sign in with your new credentials.');
                setMode('login');
                setPendingUser(null);
            }
        } catch (err) {
            console.error(err);
            setError(err.message || 'Action failed. Please check your inputs.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card w-full max-w-md relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-500 to-indigo-500"></div>

                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold mb-2 font-['Outfit']">
                        {mode === 'login' && 'Welcome Back'}
                        {mode === 'signup' && 'Create Account'}
                        {mode === 'verify' && 'Verify Account'}
                        {mode === 'new_password' && 'Set New Password'}
                    </h2>
                    <p className="text-slate-400">
                        {mode === 'login' && 'Sign in to access your media cloud'}
                        {mode === 'signup' && 'Join the next-gen media platform'}
                        {mode === 'verify' && `Enter the code sent to your email`}
                        {mode === 'new_password' && 'Security requirement: Please set a fresh password'}
                    </p>
                </div>

                <AnimatePresence mode="wait">
                    {error && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl mb-6 flex items-start gap-2 text-sm"
                        >
                            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>{error}</span>
                        </motion.div>
                    )}
                    {message && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-green-500/10 border border-green-500/20 text-green-400 p-3 rounded-xl mb-6 flex items-start gap-2 text-sm"
                        >
                            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>{message}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === 'signup' && (
                        <>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                    <input
                                        type="text" required placeholder="John Doe" className="form-input pl-12"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                    <input
                                        type="email" required placeholder="name@example.com" className="form-input pl-12"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {(mode === 'login' || mode === 'signup') && (
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Username or Email</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input
                                    type="text" required placeholder="jdoe" className="form-input pl-12"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                />
                            </div>
                        </div>
                    )}

                    {(mode === 'login' || mode === 'signup') && (
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input
                                    type="password" required placeholder="••••••••" className="form-input pl-12"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                        </div>
                    )}

                    {mode === 'new_password' && (
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500 uppercase ml-1">New Secure Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input
                                    type="password" required placeholder="Min. 8 characters" className="form-input pl-12"
                                    value={formData.newPassword}
                                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                />
                            </div>
                        </div>
                    )}

                    {mode === 'verify' && (
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500 uppercase ml-1">6-Digit Code</label>
                            <div className="relative">
                                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input
                                    type="text" required placeholder="123456" className="form-input pl-12 tracking-[0.5em] font-bold text-center"
                                    maxLength="6"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                />
                            </div>
                        </div>
                    )}

                    <button
                        type="submit" disabled={loading}
                        className="btn-primary w-full py-4 mt-4 flex items-center justify-center gap-2 group"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                            <>
                                {mode === 'login' && 'Sign In'}
                                {mode === 'signup' && 'Create Account'}
                                {mode === 'verify' && 'Verify My Account'}
                                {mode === 'new_password' && 'Change Password & Login'}
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-white/5 text-center flex flex-col gap-3">
                    {mode === 'login' ? (
                        <button
                            onClick={() => { setMode('signup'); setError(''); setMessage(''); }}
                            className="text-slate-400 hover:text-brand-400 transition-colors text-sm font-medium"
                        >
                            Don't have an account? Create one
                        </button>
                    ) : (
                        <button
                            onClick={() => { setMode('login'); setError(''); setMessage(''); setPendingUser(null); }}
                            className="text-slate-400 hover:text-brand-400 transition-colors text-sm font-medium"
                        >
                            Back to Sign In
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
