import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { catalogApi, streamingApi } from '../services/api';
import { ChevronLeft, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const Player = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [item, setItem] = useState(null);
    const [streamUrl, setStreamUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchItem();
    }, [id]);

    const fetchItem = async () => {
        try {
            const res = await catalogApi.get(id);
            setItem(res.data);

            if (res.data.status === 'ready' && res.data.processed_s3_key) {
                const streamRes = await streamingApi.getStreamUrl('video', encodeURIComponent(res.data.processed_s3_key));
                setStreamUrl(streamRes.data.url);
            }
        } catch (err) {
            setError('Failed to load video content.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="w-10 h-10 text-brand-500 animate-spin" />
            <p className="text-slate-500 font-medium">Loading theater...</p>
        </div>
    );

    if (error || !item) return (
        <div className="text-center py-32 glass-card mx-auto max-w-2xl px-8">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Error</h2>
            <p className="text-slate-400 mb-6">{error || 'Content not found'}</p>
            <button onClick={() => navigate('/catalog')} className="btn-secondary">Back to Catalog</button>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-24">
            <button
                onClick={() => navigate('/catalog')}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
            >
                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                Back to Catalog
            </button>

            <div className="space-y-6">
                <div className="aspect-video bg-black rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative group">
                    {item.status === 'ready' && streamUrl ? (
                        <video
                            src={streamUrl}
                            controls
                            autoPlay
                            className="w-full h-full"
                        />
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 bg-slate-900/50 backdrop-blur-xl">
                            <Loader2 className="w-12 h-12 text-brand-500 animate-spin" />
                            <div className="text-center">
                                <h3 className="text-xl font-bold">
                                    {item.status === 'ready' ? 'Fetching Secure Link...' : 'Processing Video'}
                                </h3>
                                <p className="text-slate-400">
                                    {item.status === 'ready'
                                        ? 'Verifying access credentials...'
                                        : 'FFmpeg is optimizing this for streaming. Please wait...'}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="glass-card p-8 space-y-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-3xl font-bold font-['Outfit']">{item.title}</h1>
                        <span className="px-4 py-1.5 bg-brand-500/20 text-brand-400 border border-brand-500/30 rounded-full text-xs font-bold uppercase tracking-widest">
                            {item.format || 'MP4'}
                        </span>
                    </div>
                    <p className="text-slate-400 text-lg leading-relaxed">{item.description || 'No description available for this video.'}</p>

                    <div className="flex flex-wrap gap-2 pt-4">
                        {item.tags?.map(tag => (
                            <span key={tag} className="px-3 py-1 bg-white/5 border border-white/10 rounded-md text-xs text-slate-500">#{tag}</span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Player;
