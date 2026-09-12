import React, { useState } from 'react';
import { Calendar, RotateCcw, Shield, Heart, ArrowUp, Mail, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface FooterProps {
  setCurrentView: (view: string) => void;
  onOpenCreateEvent: () => void;
}

export const Footer: React.FC<FooterProps> = ({ setCurrentView, onOpenCreateEvent }) => {
  const { showToast } = useApp();
  const [emailSub, setEmailSub] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailSub) return;
    setSubscribed(true);
    showToast('success', 'Subscribed to EventEase Newsletter', 'You will receive monthly curated event drops.');
    setEmailSub('');
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer
      id="main-footer"
      className="bg-slate-900 text-slate-400 border-t border-slate-800 transition-colors pt-16 pb-12"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white font-extrabold shadow-md shadow-indigo-500/20">
                <Calendar className="w-4 h-4" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-white font-['Space_Grotesk']">
                Event<span className="text-indigo-400">Ease</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              The modern web-based event registration and management platform. Streamlining
              discovery, multi-step registration, instant digital QR ticketing, and real-time
              organizer analytics.
            </p>

            {/* Newsletter form */}
            <form onSubmit={handleSubscribe} className="pt-2 max-w-sm">
              <span className="block text-xs font-semibold text-slate-300 mb-2">
                Stay updated on premier conferences & hackathons
              </span>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={emailSub}
                  onChange={(e) => setEmailSub(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer"
                >
                  {subscribed ? 'Joined' : 'Subscribe'}
                </button>
              </div>
            </form>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 font-['Space_Grotesk']">
              Platform
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button
                  onClick={() => {
                    setCurrentView('explore');
                    scrollToTop();
                  }}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Explore Events
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenCreateEvent}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Host an Event
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setCurrentView('qr-checkin');
                    scrollToTop();
                  }}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  QR Check-in System
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setCurrentView('profile');
                    scrollToTop();
                  }}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  My Digital Tickets
                </button>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 font-['Space_Grotesk']">
              Categories
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button
                  onClick={() => {
                    setCurrentView('explore');
                    scrollToTop();
                  }}
                  className="hover:text-white transition-colors"
                >
                  Technology & AI
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setCurrentView('explore');
                    scrollToTop();
                  }}
                  className="hover:text-white transition-colors"
                >
                  Hackathons & Sprints
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setCurrentView('explore');
                    scrollToTop();
                  }}
                  className="hover:text-white transition-colors"
                >
                  SaaS & Business Summits
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setCurrentView('explore');
                    scrollToTop();
                  }}
                  className="hover:text-white transition-colors"
                >
                  Hands-on Workshops
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setCurrentView('explore');
                    scrollToTop();
                  }}
                  className="hover:text-white transition-colors"
                >
                  Cultural & Music Galas
                </button>
              </li>
            </ul>
          </div>

          {/* Security & System Info */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 font-['Space_Grotesk']">
              Security & Engine
            </h4>
            <div className="space-y-3 text-xs">
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Powered by Google Cloud Firestore with real-time multi-device sync, Role-Based Access Control, and cryptographic QR gate verification.
              </p>

              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Zero-Trust ABAC Security Rules</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-indigo-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Real-Time Firestore Synchronized</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 EventEase Platform. Built for Web-Based Event Registration & Management.</p>
          <div className="flex items-center gap-4">
            <span>React 19 + TypeScript + Tailwind</span>
            <button
              id="scroll-to-top-btn"
              onClick={scrollToTop}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              aria-label="Back to top"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
