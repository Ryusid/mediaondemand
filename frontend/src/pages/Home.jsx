import React from 'react';
import { motion } from 'framer-motion';
import { Play, Shield, Globe, Cpu, Zap, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

const Home = () => {
    return (
        <div className="space-y-32 py-12">
            {/* Hero Section */}
            <section className="relative min-h-[70vh] flex flex-col items-center justify-center text-center overflow-hidden">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="z-10"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500/10 border border-brand-500/20 rounded-full text-brand-400 text-sm font-semibold mb-8 backdrop-blur-sm">
                        <Zap className="w-4 h-4 fill-brand-400" />
                        <span>Built on AWS Free Tier — Always Ready</span>
                    </div>

                    <h1 className="text-6xl md:text-8xl font-black mb-6 leading-tight">
                        Infinite Content. <br />
                        <span className="gradient-text">Zero Overhead.</span>
                    </h1>

                    <p className="max-w-2xl mx-auto text-slate-400 text-lg md:text-xl mb-12 leading-relaxed">
                        Experience the next generation of personal media clouds.
                        Stream 4K videos and read infinite ebooks on an architecture
                        that evolves with your needs.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link to="/catalog" className="btn-primary text-lg flex items-center justify-center gap-3 group">
                            <Play className="w-5 h-5 fill-white group-hover:scale-110 transition-transform" />
                            Start Streaming
                        </Link>
                        <Link to="/login" className="btn-secondary text-lg">
                            Create Account
                        </Link>
                    </div>
                </motion.div>

                {/* Abstract shapes for hero background */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-500/20 rounded-full blur-[120px] -z-10 animate-pulse-slow"></div>
            </section>

            {/* Feature Grid */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                    {
                        title: 'SSO Everywhere',
                        desc: 'Secure authentication powered by AWS Cognito with support for MFA and social logins.',
                        icon: Shield,
                        color: 'text-brand-400'
                    },
                    {
                        title: 'Global CDN',
                        desc: 'Ultra-low latency streaming via Amazon CloudFront nodes distributed worldwide.',
                        icon: Globe,
                        color: 'text-indigo-400'
                    },
                    {
                        title: 'AI Processing',
                        desc: 'Automatic transcoding and metadata extraction using serverless AWS Lambda functions.',
                        icon: Cpu,
                        color: 'text-purple-400'
                    }
                ].map((feature, idx) => (
                    <motion.div
                        key={idx}
                        whileHover={{ y: -10 }}
                        className="glass-card flex flex-col items-center text-center group"
                    >
                        <div className={`p-4 rounded-2xl bg-white/5 border border-white/10 mb-6 group-hover:scale-110 transition-transform ${feature.color}`}>
                            <feature.icon className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
                        <p className="text-slate-400 leading-relaxed text-sm">
                            {feature.desc}
                        </p>
                    </motion.div>
                ))}
            </section>

            {/* Modern CTA */}
            <section className="glass rounded-[40px] p-12 md:p-24 relative overflow-hidden text-center">
                <div className="relative z-10">
                    <h2 className="text-4xl md:text-5xl font-bold mb-8">Ready to evolve your stack?</h2>
                    <Link to="/catalog" className="inline-flex items-center gap-3 px-10 py-5 bg-white text-black rounded-full font-bold text-lg hover:bg-slate-200 transition-all shadow-xl active:scale-95">
                        <Search className="w-5 h-5" />
                        Browse the Catalog
                    </Link>
                </div>

                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 blur-[100px] rounded-full"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 blur-[100px] rounded-full"></div>
            </section>
        </div>
    );
};

export default Home;
