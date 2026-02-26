import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadApi, catalogApi } from '../services/api';
import { Upload as UploadIcon, File, Check, X, Loader2, Play, Book } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const Upload = () => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState('');
    const [type, setType] = useState('video');
    const [details, setDetails] = useState({ title: '', description: '' });
    const navigate = useNavigate();

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected) {
            setFile(selected);
            setDetails({ ...details, title: selected.name.split('.')[0] });
            // Infer type from extension
            const ext = selected.name.split('.').pop().toLowerCase();
            if (['pdf', 'epub', 'mobi'].includes(ext)) setType('ebook');
            else setType('video');
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) return;

        setUploading(true);
        setProgress(0);
        setError('');

        try {
            // 1. Get presigned URL from our gateway
            const { data: presigned } = await uploadApi.getPresignedUrl(type, file.name, file.type);

            // 2. Create catalog entry (status: pending)
            const { data: catalogItem } = await catalogApi.create({
                title: details.title,
                description: details.description,
                type: type,
                s3_key: presigned.key,
                file_size: file.size,
                format: file.name.split('.').pop(),
            });

            // 3. Upload directly to S3
            await axios.put(presigned.uploadUrl, file, {
                headers: { 'Content-Type': file.type },
                onUploadProgress: (progressEvent) => {
                    const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setProgress(percent);
                },
            });

            setSuccess(true);
            setTimeout(() => navigate('/catalog'), 2000);
        } catch (err) {
            console.error(err);
            setError('Upload failed. Check your connection or AWS permissions.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-12">
            <div className="flex items-center gap-4 mb-12">
                <div className="w-14 h-14 bg-brand-500/10 rounded-2xl flex items-center justify-center border border-brand-500/20">
                    <UploadIcon className="w-7 h-7 text-brand-400" />
                </div>
                <div>
                    <h1 className="text-4xl font-black font-['Outfit'] tracking-tight uppercase">Upload Content</h1>
                    <p className="text-slate-400">Share your media with the cloud</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Form */}
                <form onSubmit={handleUpload} className="space-y-6">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase ml-1 tracking-wider">Content Type</label>
                        <div className="flex gap-4">
                            {[
                                { id: 'video', label: 'Video', icon: Play },
                                { id: 'ebook', label: 'Ebook', icon: Book },
                            ].map((t) => (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => setType(t.id)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${type === t.id
                                            ? 'bg-brand-500/20 border-brand-500 text-brand-400 shadow-lg shadow-brand-500/10'
                                            : 'bg-white/5 border-white/10 text-slate-500 hover:bg-white/10'
                                        }`}
                                >
                                    <t.icon className="w-4 h-4" />
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase ml-1 tracking-wider">Title</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Give your content a name"
                            value={details.title}
                            onChange={(e) => setDetails({ ...details, title: e.target.value })}
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase ml-1 tracking-wider">Description</label>
                        <textarea
                            rows="4"
                            className="form-input resize-none"
                            placeholder="What's this about?"
                            value={details.description}
                            onChange={(e) => setDetails({ ...details, description: e.target.value })}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={!file || uploading || success}
                        className="btn-primary w-full py-4 flex items-center justify-center gap-3 relative overflow-hidden"
                    >
                        {uploading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Uploading {progress}%</span>
                                <div className="absolute bottom-0 left-0 h-1 bg-white/20 transition-all duration-300" style={{ width: `${progress}%` }} />
                            </>
                        ) : success ? (
                            <>
                                <Check className="w-5 h-5" />
                                <span>Published!</span>
                            </>
                        ) : (
                            <>
                                <UploadIcon className="w-5 h-5" />
                                <span>Launch Processing</span>
                            </>
                        )}
                    </button>
                </form>

                {/* File Dropzone */}
                <div className="space-y-4">
                    <label className="text-xs font-semibold text-slate-500 uppercase ml-1 tracking-wider">Source File</label>
                    <div
                        className={`cursor-pointer group relative aspect-square glass-card border-2 border-dashed flex flex-col items-center justify-center text-center transition-all ${file ? 'border-brand-500/50 bg-brand-500/5' : 'border-white/10 hover:border-brand-500/30'
                            }`}
                    >
                        <input
                            type="file"
                            onChange={handleFileChange}
                            className="absolute inset-0 opacity-0 cursor-pointer z-20"
                            accept={type === 'video' ? 'video/*' : '.pdf,.epub,.mobi'}
                        />

                        <AnimatePresence mode="wait">
                            {file ? (
                                <motion.div
                                    key="file"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="space-y-4 px-8"
                                >
                                    <div className="w-20 h-20 bg-brand-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-brand-500/30 ring-4 ring-brand-500/10">
                                        <File className="w-10 h-10 text-brand-400" />
                                    </div>
                                    <p className="font-bold text-lg truncate w-full">{file.name}</p>
                                    <p className="text-slate-500 text-sm">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                                    <button onClick={() => setFile(null)} className="text-red-400 text-xs font-bold uppercase hover:underline z-30">Change File</button>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="empty"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="space-y-4 px-8"
                                >
                                    <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:bg-brand-500/10 transition-all border border-white/10 group-hover:border-brand-500/30">
                                        <UploadIcon className="w-8 h-8 text-slate-500 group-hover:text-brand-400" />
                                    </div>
                                    <p className="font-semibold text-slate-400">Click or drag file to upload</p>
                                    <p className="text-slate-600 text-xs uppercase tracking-tighter">Support: MP4, WebM, PDF, EPUB</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">
                            <X className="w-4 h-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Upload;
