import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { catalogApi, streamingApi } from '../services/api';
import { ChevronLeft, Loader2, AlertCircle, Maximize2 } from 'lucide-react';

const Viewer = () => {
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
                const streamRes = await streamingApi.getStreamUrl('ebook', encodeURIComponent(res.data.processed_s3_key));
                setStreamUrl(streamRes.data.url);
            }
        } catch (err) {
            setError('Failed to load ebook content.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
            <p className="text-slate-500 font-medium">Opening ebook...</p>
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

    const viewerUrl = streamUrl;

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-24 h-[calc(100vh-12rem)] flex flex-col">
            <div className="flex items-center justify-between">
                <button
                    onClick={() => navigate('/catalog')}
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
                >
                    <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    Back to Catalog
                </button>
                <h1 className="text-xl font-bold font-['Outfit'] truncate max-w-md">{item.title}</h1>
                <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-full text-[10px] font-bold uppercase tracking-widest">
                        {item.format || 'PDF'}
                    </span>
                </div>
            </div>

            <div className="flex-grow bg-slate-900 rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative">
                {item.status === 'ready' ? (
                    <iframe
                        src={viewerUrl}
                        className="w-full h-full border-none"
                        title={item.title}
                    />
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 bg-slate-900/50 backdrop-blur-xl">
                        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                        <div className="text-center">
                            <h3 className="text-xl font-bold">Preparing Ebook</h3>
                            <p className="text-slate-400">Scanning content and rendering pages...</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Viewer;
