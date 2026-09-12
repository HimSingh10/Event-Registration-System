import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { EventItem, EventCategory } from '../types';
import { EventCard } from './EventCard';
import {
  Calendar,
  Search,
  ArrowRight,
  Sparkles,
  QrCode,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Star,
  Cpu,
  Code2,
  Briefcase,
  GraduationCap,
  Music2,
  Trophy,
  MessageSquareQuote,
  PlusCircle,
  MapPin,
  Compass,
  Sliders,
  Navigation,
} from 'lucide-react';

interface LandingPageProps {
  onExploreClick: (category?: EventCategory | 'All') => void;
  onSelectEvent: (event: EventItem) => void;
  onRegisterClick: (event: EventItem) => void;
  onOpenCreateEvent: () => void;
  onOpenPreferences?: () => void;
}

const CATEGORY_ITEMS: { name: EventCategory; icon: any; color: string }[] = [
  { name: 'Technology', icon: Cpu, color: 'from-blue-500 to-indigo-600' },
  { name: 'Hackathon', icon: Code2, color: 'from-violet-500 to-purple-600' },
  { name: 'Business', icon: Briefcase, color: 'from-amber-500 to-orange-600' },
  { name: 'Education', icon: GraduationCap, color: 'from-emerald-500 to-teal-600' },
  { name: 'Music', icon: Music2, color: 'from-pink-500 to-rose-600' },
  { name: 'Sports', icon: Trophy, color: 'from-sky-500 to-blue-600' },
];

export const LandingPage: React.FC<LandingPageProps> = ({
  onExploreClick,
  onSelectEvent,
  onRegisterClick,
  onOpenCreateEvent,
  onOpenPreferences,
}) => {
  const {
    events,
    registrations,
    feedbacks,
    userLocation,
    radiusFilter,
    userInterests,
    setIsAiAssistantOpen,
    getAiRecommendations,
    getEventDistance,
  } = useApp();
  const [heroSearch, setHeroSearch] = useState('');
  const [heroCategory, setHeroCategory] = useState<EventCategory | 'All'>('All');

  // Real database dynamic statistics
  const totalRegistrations = registrations.length;
  const totalEvents = events.length;
  const verifiedCheckins = registrations.filter((r) => r.ticketStatus === 'Checked In').length;
  const avgRating =
    feedbacks.length > 0
      ? (feedbacks.reduce((acc, f) => acc + f.rating, 0) / feedbacks.length).toFixed(1) + ' / 5'
      : totalEvents > 0
      ? '5.0 / 5'
      : '0.0';

  // AI Recommendations
  const aiRecommendations = getAiRecommendations().slice(0, 3);

  // Nearby Events based on user location and radius
  const nearbyEvents = events
    .map((e) => ({
      event: e,
      distance: getEventDistance(e),
    }))
    .filter((item) => {
      if (item.event.format === 'Virtual') return false;
      if (item.distance !== null) return item.distance <= radiusFilter;
      return (
        item.event.city &&
        userLocation.city &&
        item.event.city.toLowerCase() === userLocation.city.toLowerCase()
      );
    })
    .sort((a, b) => (a.distance ?? 9999) - (b.distance ?? 9999))
    .slice(0, 3);

  // Featured events (highest registered / active status)
  const featuredEvents = events
    .filter((e) => e.status === 'Registration Open' || e.status === 'Almost Full')
    .slice(0, 3);

  const handleHeroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onExploreClick(heroCategory);
  };

  return (
    <div id="landing-page-view" className="space-y-20 pb-16">
      {/* 1. HERO SECTION */}
      <section className="relative pt-12 sm:pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Ambient background glow */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-3/4 h-80 bg-gradient-to-tr from-indigo-500/15 via-violet-500/10 to-transparent blur-3xl -z-10 rounded-full pointer-events-none" />

        <div className="text-center space-y-6 max-w-4xl mx-auto">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Next-Generation Event Registration & Check-In Platform</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.12] font-['Space_Grotesk']">
            Discover, Register, and Experience Events with{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-400">
              Unmatched Ease
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            From premier tech summits and hackathons to executive workshops. Instant digital QR
            ticketing, live attendance verification, and enterprise-grade event analytics.
          </p>

          {/* Quick Hero Search & Filter Form */}
          <div className="pt-2 max-w-2xl mx-auto">
            <form
              onSubmit={handleHeroSubmit}
              className="p-2 sm:p-2.5 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl flex flex-col sm:flex-row gap-2"
            >
              <div className="relative flex-1 flex items-center">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5" />
                <input
                  type="text"
                  value={heroSearch}
                  onChange={(e) => setHeroSearch(e.target.value)}
                  placeholder="Search summits, hackathons, cities..."
                  className="w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm bg-transparent text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={heroCategory}
                  onChange={(e) => setHeroCategory(e.target.value as any)}
                  aria-label="Filter by category"
                  className="px-3 py-2.5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="All">All Categories</option>
                  <option value="Technology">Technology</option>
                  <option value="Hackathon">Hackathon</option>
                  <option value="Business">Business</option>
                  <option value="Workshop">Workshop</option>
                  <option value="Sports">Sports</option>
                </select>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs sm:text-sm font-semibold shadow-md transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5"
                >
                  <span>Find Events</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsAiAssistantOpen(true)}
                  className="px-3.5 py-2.5 bg-gradient-to-r from-indigo-50 dark:from-indigo-950/70 to-violet-50 dark:to-violet-950/70 hover:from-indigo-100 hover:to-violet-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800 rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-2xs group"
                  title="Ask EventEase AI Assistant"
                >
                  <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse group-hover:rotate-12 transition-transform" />
                  <span className="hidden sm:inline">Ask AI</span>
                </button>
              </div>
            </form>

            {/* Quick Prompt Suggestions */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-3 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1 font-semibold text-slate-600 dark:text-slate-300">
                <Compass className="w-3 h-3 text-indigo-500" />
                Try:
              </span>
              {[
                `Events in ${userLocation.city}`,
                'Free tech workshops',
                'Weekend hackathons',
                'AI & Cloud summits',
              ].map((query, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setHeroSearch(query);
                    onExploreClick('All');
                  }}
                  className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer border border-slate-200/60 dark:border-slate-700"
                >
                  {query}
                </button>
              ))}
            </div>
          </div>

          {/* Quick action buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onExploreClick('All')}
              className="px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl text-xs font-bold shadow-sm hover:opacity-90 transition-all cursor-pointer flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              <span>Explore All Gatherings</span>
            </button>
            <button
              onClick={onOpenCreateEvent}
              className="px-5 py-2.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-750 transition-all cursor-pointer flex items-center gap-2"
            >
              <Zap className="w-4 h-4 text-indigo-500" />
              <span>Host an Event</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. STATS & CREDIBILITY BAR (Calculated Directly from Firestore Database) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-slate-900 text-white rounded-3xl shadow-xl border border-slate-800">
          <div className="space-y-1 text-center sm:text-left sm:border-r border-slate-800 sm:pr-4">
            <p className="text-2xl sm:text-3xl font-extrabold text-indigo-400 font-['Space_Grotesk']">
              {totalRegistrations.toLocaleString()}
            </p>
            <p className="text-xs text-slate-400 font-medium">Registered Attendees</p>
          </div>
          <div className="space-y-1 text-center sm:text-left sm:border-r border-slate-800 sm:pr-4">
            <p className="text-2xl sm:text-3xl font-extrabold text-white font-['Space_Grotesk']">
              {totalEvents.toLocaleString()}
            </p>
            <p className="text-xs text-slate-400 font-medium">Published Events</p>
          </div>
          <div className="space-y-1 text-center sm:text-left sm:border-r border-slate-800 sm:pr-4">
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-['Space_Grotesk']">
              {verifiedCheckins.toLocaleString()}
            </p>
            <p className="text-xs text-slate-400 font-medium">Gate Check-Ins Verified</p>
          </div>
          <div className="space-y-1 text-center sm:text-left">
            <p className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-['Space_Grotesk']">
              {avgRating}
            </p>
            <p className="text-xs text-slate-400 font-medium">
              {feedbacks.length > 0 ? `${feedbacks.length} Verified Reviews` : 'Attendee Rating'}
            </p>
          </div>
        </div>
      </section>

      {/* 3. FEATURED EVENTS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Handpicked Gatherings</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-['Space_Grotesk'] mt-1">
              Featured Flagship Events
            </h2>
          </div>

          <button
            onClick={() => onExploreClick('All')}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
          >
            <span>View all {events.length} events</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {events.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-800/80 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Calendar className="w-7 h-7" />
            </div>
            <div className="max-w-md mx-auto space-y-1.5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                No Events Published Yet
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                The database is fresh with 0 events. Organizers can host the first gathering now, or
                an administrator can seed starter events.
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={onOpenCreateEvent}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Publish the First Event</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(featuredEvents.length > 0 ? featuredEvents : events.slice(0, 3)).map((evt) => (
              <EventCard
                key={evt.id}
                event={evt}
                onSelect={onSelectEvent}
                onRegisterClick={onRegisterClick}
              />
            ))}
          </div>
        )}
      </section>

      {/* 3B. AI RECOMMENDATIONS SECTION */}
      {aiRecommendations.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 p-5 rounded-2xl bg-gradient-to-r from-indigo-900/10 via-violet-900/5 to-transparent border border-indigo-200/60 dark:border-indigo-800/60">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
                <span>AI Recommendation Engine</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  Gemini-Powered
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-['Space_Grotesk'] mt-1">
                Recommended For You
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Scored using your active interests ({userInterests.slice(0, 3).join(', ')}), saved wishlist, and local hubs.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {onOpenPreferences && (
                <button
                  onClick={onOpenPreferences}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                >
                  <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Edit Interests</span>
                </button>
              )}
              <button
                onClick={() => setIsAiAssistantOpen(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ask AI Why</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {aiRecommendations.map((rec) => {
              const matchedEvent = events.find((e) => e.id === rec.eventId);
              if (!matchedEvent) return null;
              return (
                <div key={rec.eventId} className="flex flex-col space-y-2">
                  <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/60 text-xs">
                    <span className="font-semibold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5 truncate">
                      <Sparkles className="w-3 h-3 text-indigo-500 shrink-0" />
                      <span className="truncate">{rec.reason}</span>
                    </span>
                    <span className="font-bold px-2 py-0.5 rounded-md bg-indigo-600 text-white text-[10px] shrink-0 ml-2">
                      {rec.matchScore}% Match
                    </span>
                  </div>
                  <EventCard
                    event={matchedEvent}
                    onSelect={onSelectEvent}
                    onRegisterClick={onRegisterClick}
                  />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 3C. NEARBY EVENTS SECTION */}
      {nearbyEvents.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                <Navigation className="w-3.5 h-3.5" />
                <span>Geolocation & Distance</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-['Space_Grotesk'] mt-1">
                Happening Near {userLocation.city}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                In-person gatherings within {radiusFilter} km of your selected discovery hub.
              </p>
            </div>

            {onOpenPreferences && (
              <button
                onClick={onOpenPreferences}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1.5 cursor-pointer bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Adjust City or Radius ({radiusFilter} km)</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {nearbyEvents.map(({ event, distance }) => (
              <EventCard
                key={event.id}
                event={event}
                onSelect={onSelectEvent}
                onRegisterClick={onRegisterClick}
                distanceKm={distance}
              />
            ))}
          </div>
        </section>
      )}

      {/* 4. BROWSE BY POPULAR CATEGORIES (Dynamic Counts from Firestore) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-['Space_Grotesk']">
            Explore by Event Category
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Tailored tracks built for engineering leaders, students, founders, and creators.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {CATEGORY_ITEMS.map((item) => {
            const Icon = item.icon;
            const categoryCount = events.filter((e) => e.category === item.name).length;
            return (
              <button
                key={item.name}
                onClick={() => onExploreClick(item.name)}
                className="group p-5 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xs hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all text-center space-y-3 cursor-pointer"
              >
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${item.color} text-white flex items-center justify-center mx-auto shadow-sm group-hover:scale-110 transition-transform`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                    {item.name}
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    {categoryCount} {categoryCount === 1 ? 'Event' : 'Events'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 5. HOW IT WORKS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 bg-slate-50 dark:bg-slate-850 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-10">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Seamless Workflow
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-['Space_Grotesk']">
              How EventEase Works
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              A frictionless journey from discovering an event to checking in at the physical or
              virtual venue.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {[
              {
                step: '01',
                title: 'Discover & Filter',
                desc: 'Explore upcoming summits, workshops, or hackathons with real-time seat availability.',
                icon: Calendar,
              },
              {
                step: '02',
                title: 'Smart Registration',
                desc: 'Complete the structured multi-step form with dietary, department, and custom preferences.',
                icon: CheckCircle2,
              },
              {
                step: '03',
                title: 'Digital QR Pass',
                desc: 'Instantly receive your official admission ticket with cryptographic QR verification.',
                icon: QrCode,
              },
              {
                step: '04',
                title: 'Live Gate Check-in',
                desc: 'Present pass at check-in kiosk or scanner for instant attendance verification in seconds.',
                icon: ShieldCheck,
              },
            ].map((st) => {
              const Icon = st.icon;
              return (
                <div
                  key={st.step}
                  className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="font-mono text-xs font-extrabold text-slate-300 dark:text-slate-600">
                      {st.step}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{st.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {st.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. VERIFIED ATTENDEE REVIEWS (From Real Firestore Database Feedback) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Real Community Voices
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-['Space_Grotesk']">
            Attendee & Organizer Reviews
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Ratings and feedback submitted by verified participants in our Firestore database.
          </p>
        </div>

        {feedbacks.length === 0 ? (
          <div className="p-8 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 text-center max-w-lg mx-auto space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400">
              <MessageSquareQuote className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              No Reviews Submitted Yet
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Reviews will display here dynamically as attendees submit ratings from their digital
              ticket passes.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {feedbacks.slice(0, 3).map((f) => (
              <div
                key={f.id}
                className="p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${s <= f.rating ? 'fill-current' : 'text-slate-300 dark:text-slate-600'}`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">
                    "{f.review}"
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                  <img
                    src={f.userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                    alt={f.userName}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-50 dark:ring-slate-750"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{f.userName}</h4>
                    <p className="text-[11px] text-slate-400">
                      Verified Attendee • {new Date(f.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 7. ORGANIZER CTA BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 border border-indigo-800/40">
          <div className="space-y-3 max-w-xl text-center md:text-left">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              For Event Creators & Universities
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold font-['Space_Grotesk'] tracking-tight">
              Ready to host your next conference or workshop?
            </h2>
            <p className="text-xs sm:text-sm text-indigo-200/80 leading-relaxed">
              Launch your registration page in minutes with customizable schedules, attendee badges,
              automated emails, and real-time door scanning.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <button
              onClick={onOpenCreateEvent}
              className="px-6 py-3.5 bg-white text-indigo-900 hover:bg-slate-100 rounded-2xl text-xs sm:text-sm font-bold shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Create Event Now</span>
            </button>
            <button
              onClick={() => onExploreClick('All')}
              className="px-6 py-3.5 bg-indigo-800/60 hover:bg-indigo-800 text-white rounded-2xl text-xs sm:text-sm font-semibold border border-indigo-700/60 transition-all cursor-pointer text-center"
            >
              Browse Catalog
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
