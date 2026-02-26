import React, { useState, useEffect } from 'react';
import { catalogApi } from '../services/api';
import { Search, Filter, Play, Book, Loader2, Info, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Catalog = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchItems();
    }, [filter]);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const params = filter !== 'all' ? { type: filter } : {};
            const res = await catalogApi.list(params);
            setItems(res.data.content);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!search) return fetchItems();
        setLoading(true);
        try {
            const res = await catalogApi.search(search);
            setItems(res.data.results);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this item?')) return;
        try {
            await catalogApi.delete(id);
            setItems(items.filter(item => item.id !== id));
        } catch (err) {
            console.error('Delete failed:', err);
            alert('Failed to delete item.');
        }
    };

    return (
        <div className="space-y-8 min-h-screen pb-24">
            {/* Header & Search */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <h1 className="text-4xl font-bold font-['Outfit']">Content Library</h1>
                    <p className="text-slate-400 text-sm">Explore your personal cloud resources</p>
                </div>

                <form onSubmit={handleSearch} className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search by title, description, tags..."
                        className="form-input pl-12 pr-4 bg-white/5 border-white/10"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </form>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scroll-hide">
                {[
                    { id: 'all', label: 'All Media', icon: Info },
                    { id: 'video', label: 'Videos', icon: Play },
                    { id: 'ebook', label: 'Ebooks', icon: Book },
                ].map((f) => (
                    <button
                        key={f.id}
                        onClick={() => setFilter(f.id)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap border ${filter === f.id
                            ? 'bg-brand-500/20 border-brand-500/50 text-brand-400'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                            }`}
                    >
                        <f.icon className="w-4 h-4" />
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Grid */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 space-y-4">
                    <Loader2 className="w-10 h-10 text-brand-500 animate-spin" />
                    <p className="text-slate-500 font-medium animate-pulse">Scanning server...</p>
                </div>
            ) : (
                <AnimatePresence>
                    {items.length > 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                        >
                            {items.map((item, idx) => (
                                <MediaCard key={item.id} item={item} index={idx} onDelete={() => handleDelete(item.id)} />
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-32 glass-card border-dashed"
                        >
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Search className="w-8 h-8 text-slate-500" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">No content found</h3>
                            <p className="text-slate-400">Try adjusting your search or filters</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            )}
        </div>
    );
};

const MediaCard = ({ item, index, onDelete }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ y: -8 }}
            className="glass-card group cursor-pointer p-0 overflow-hidden relative"
        >
            <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="absolute top-4 right-4 p-2 bg-black/60 backdrop-blur-md rounded-lg text-slate-400 hover:text-red-400 border border-white/10 opacity-0 group-hover:opacity-100 transition-all z-20"
                title="Delete content"
            >
                <Trash2 className="w-4 h-4" />
            </button>

            <div className="relative aspect-video bg-gradient-to-br from-slate-800 to-black overflow-hidden">
                {item.type === 'video' ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Play className="w-12 h-12 text-white/20 group-hover:scale-125 group-hover:text-brand-500/50 transition-all" />
                    </div>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Book className="w-12 h-12 text-white/20 group-hover:scale-125 group-hover:text-indigo-500/50 transition-all" />
                    </div>
                )}

                {/* Badge */}
                <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/10 z-10">
                    <div className={`w-1.5 h-1.5 rounded-full ${item.status === 'ready' ? 'bg-green-500' : 'bg-orange-500 animate-pulse'}`}></div>
                    {item.status}
                </div>
            </div>

            <div className="p-5 space-y-3">
                <h3 className="text-lg font-bold line-clamp-1 group-hover:text-brand-400 transition-colors uppercase tracking-tight font-['Outfit']">
                    {item.title}
                </h3>
                <p className="text-slate-400 text-sm line-clamp-2 leading-relaxed">
                    {item.description || 'No description provided.'}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <span className="text-xs font-semibold text-slate-500 uppercase">{item.type}</span>
                    <span className="text-xs text-slate-500">{new Date(item.created_at).toLocaleDateString()}</span>
                </div>
            </div>
        </motion.div>
    );
};

export default Catalog;
