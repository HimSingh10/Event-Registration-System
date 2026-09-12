import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { EventItem, EventCategory } from '../types';
import { EventCard } from './EventCard';
import {
  Search,
  SlidersHorizontal,
  Calendar,
  DollarSign,
  MapPin,
  RotateCcw,
  Sparkles,
  ChevronDown,
  Heart,
} from 'lucide-react';

interface EventDiscoveryProps {
  onSelectEvent: (event: EventItem) => void;
  onRegisterClick: (event: EventItem) => void;
  initialCategory?: EventCategory | 'All';
}

const CATEGORIES: Array<EventCategory | 'All'> = [
  'All',
  'Technology',
  'Hackathon',
  'Business',
  'Workshop',
  'Sports',
  'Cultural',
  'Education',
  'Music',
];

export const EventDiscovery: React.FC<EventDiscoveryProps> = ({
  onSelectEvent,
  onRegisterClick,
  initialCategory = 'All',
}) => {
  const {
    events,
    registrations,
    currentUser,
    wishlist,
    userLocation,
    radiusFilter,
    getEventDistance,
    getAiRecommendations,
    setIsAiAssistantOpen,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | 'All'>(initialCategory);
  const [dateFilter, setDateFilter] = useState<'All' | 'Today' | 'ThisMonth' | 'Upcoming'>('All');
  const [locationTypeFilter, setLocationTypeFilter] = useState<'All' | 'In-Person' | 'Virtual' | 'Hybrid'>('All');
  const [pricingFilter, setPricingFilter] = useState<'All' | 'Free' | 'Paid'>('All');
  const [sortBy, setSortBy] = useState<'date-asc' | 'date-desc' | 'popularity' | 'capacity' | 'closest'>('date-asc');
  const [showOnlyWishlist, setShowOnlyWishlist] = useState(false);
  const [showOnlyNearby, setShowOnlyNearby] = useState(false);
  const [showOnlyAiRecommended, setShowOnlyAiRecommended] = useState(false);
  const [visibleCount, setVisibleCount] = useState(6);

  // User's registered event IDs
  const userRegisteredEventIds = useMemo(() => {
    return new Set(
      registrations
        .filter((r) => r.userId === currentUser.id && r.ticketStatus !== 'Cancelled')
        .map((r) => r.eventId)
    );
  }, [registrations, currentUser.id]);

  const recommendedEventIds = useMemo(() => {
    return new Set(getAiRecommendations().map((r) => r.eventId));
  }, [getAiRecommendations]);

  // Filtering & Sorting logic
  const filteredEvents = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];

    return events
      .filter((evt) => {
        // Keyword Search
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchTitle = evt.title.toLowerCase().includes(q);
          const matchDesc = evt.description.toLowerCase().includes(q);
          const matchVenue = evt.venue.toLowerCase().includes(q);
          const matchOrg = evt.organizerName.toLowerCase().includes(q);
          const matchCat = evt.category.toLowerCase().includes(q);
          const matchCity = (evt.city || '').toLowerCase().includes(q);
          if (!matchTitle && !matchDesc && !matchVenue && !matchOrg && !matchCat && !matchCity) return false;
        }

        // Category Filter
        if (selectedCategory !== 'All' && evt.category !== selectedCategory) {
          return false;
        }

        // Location Type
        if (locationTypeFilter !== 'All' && evt.locationType !== locationTypeFilter) {
          return false;
        }

        // Pricing Filter
        if (pricingFilter === 'Free' && evt.ticketType !== 'Free') return false;
        if (pricingFilter === 'Paid' && evt.ticketType !== 'Paid') return false;

        // Date Filter
        if (dateFilter === 'Today') {
          if (evt.date !== todayStr) return false;
        } else if (dateFilter === 'ThisMonth') {
          const currentMonth = todayStr.slice(0, 7);
          if (!evt.date.startsWith(currentMonth)) return false;
        } else if (dateFilter === 'Upcoming') {
          if (evt.date < todayStr) return false;
        }

        // Wishlist Filter
        if (showOnlyWishlist && !wishlist.includes(evt.id)) {
          return false;
        }

        // Nearby Radius Filter
        if (showOnlyNearby) {
          if (evt.format === 'Virtual') return false;
          const dist = getEventDistance(evt);
          if (dist !== null) {
            if (dist > radiusFilter) return false;
          } else if (evt.city && userLocation.city) {
            if (evt.city.toLowerCase() !== userLocation.city.toLowerCase()) return false;
          }
        }

        // AI Recommended Filter
        if (showOnlyAiRecommended && !recommendedEventIds.has(evt.id)) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'closest') {
          const distA = getEventDistance(a) ?? 9999;
          const distB = getEventDistance(b) ?? 9999;
          return distA - distB;
        } else if (sortBy === 'date-asc') {
          return a.date.localeCompare(b.date);
        } else if (sortBy === 'date-desc') {
          return b.date.localeCompare(a.date);
        } else if (sortBy === 'popularity') {
          return b.registeredCount - a.registeredCount;
        } else if (sortBy === 'capacity') {
          return b.maxCapacity - a.maxCapacity;
        }
        return 0;
      });
  }, [
    events,
    searchTerm,
    selectedCategory,
    locationTypeFilter,
    pricingFilter,
    dateFilter,
    sortBy,
    showOnlyWishlist,
    showOnlyNearby,
    showOnlyAiRecommended,
    wishlist,
    recommendedEventIds,
    radiusFilter,
    userLocation.city,
    getEventDistance,
  ]);

  const hasActiveFilters =
    searchTerm !== '' ||
    selectedCategory !== 'All' ||
    locationTypeFilter !== 'All' ||
    pricingFilter !== 'All' ||
    dateFilter !== 'All' ||
    showOnlyWishlist ||
    showOnlyNearby ||
    showOnlyAiRecommended;

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All');
    setLocationTypeFilter('All');
    setPricingFilter('All');
    setDateFilter('All');
    setSortBy('date-asc');
    setShowOnlyWishlist(false);
    setShowOnlyNearby(false);
    setShowOnlyAiRecommended(false);
  };

  const displayedEvents = filteredEvents.slice(0, visibleCount);

  return (
    <div id="event-discovery-page" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Search Bar */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white font-['Space_Grotesk'] tracking-tight">
            Discover Exceptional Events
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Browse upcoming summits, hackathons, workshops, and gatherings.
          </p>
        </div>

        {/* Big Search Input with Quick Category Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
            <input
              id="event-search-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by event title, speaker, keywords, or city..."
              className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm text-slate-900 dark:text-white placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-3.5 text-xs text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Sort Dropdown */}
            <select
              id="event-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              aria-label="Sort events"
              className="px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="date-asc">Date: Earliest First</option>
              <option value="date-desc">Date: Latest First</option>
              <option value="closest">Distance: Closest First</option>
              <option value="popularity">Most Popular</option>
              <option value="capacity">Largest Capacity</option>
            </select>

            <button
              onClick={() => setIsAiAssistantOpen(true)}
              className="px-3.5 py-3 bg-gradient-to-r from-indigo-50 dark:from-indigo-950/60 to-violet-50 dark:to-violet-950/60 hover:from-indigo-100 hover:to-violet-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80 rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs group"
              title="Ask EventEase AI Assistant"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse group-hover:rotate-12 transition-transform" />
              <span className="hidden md:inline">AI Help</span>
            </button>

            {hasActiveFilters && (
              <button
                id="reset-filters-btn"
                onClick={resetFilters}
                className="px-3.5 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Reset all filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Category Pills Scroller */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                id={`cat-pill-${cat.toLowerCase()}`}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-slate-600'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Secondary Filter Row: Format, Price, Date */}
        <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
          {/* Format */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
            <span className="text-slate-400 pl-2 font-medium">Format:</span>
            {(['All', 'In-Person', 'Virtual', 'Hybrid'] as const).map((fmt) => (
              <button
                key={fmt}
                onClick={() => setLocationTypeFilter(fmt)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  locationTypeFilter === fmt
                    ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white font-bold'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>

          {/* Pricing */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
            <span className="text-slate-400 pl-2 font-medium">Access:</span>
            {(['All', 'Free', 'Paid'] as const).map((pr) => (
              <button
                key={pr}
                onClick={() => setPricingFilter(pr)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  pricingFilter === pr
                    ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white font-bold'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {pr}
              </button>
            ))}
          </div>

          {/* Date Range */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
            <span className="text-slate-400 pl-2 font-medium">Timeline:</span>
            {(['All', 'Upcoming', 'ThisMonth'] as const).map((dt) => (
              <button
                key={dt}
                onClick={() => setDateFilter(dt)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  dateFilter === dt
                    ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white font-bold'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {dt === 'ThisMonth' ? 'This Month' : dt}
              </button>
            ))}
          </div>

          {/* Wishlist Toggle Button */}
          <button
            id="filter-wishlist-toggle"
            onClick={() => setShowOnlyWishlist(!showOnlyWishlist)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
              showOnlyWishlist
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-rose-400'
            }`}
            title="Show only events saved to your wishlist"
          >
            <Heart className={`w-3.5 h-3.5 ${showOnlyWishlist ? 'fill-current text-white' : 'text-rose-500'}`} />
            <span>Saved ({wishlist.length})</span>
          </button>

          {/* Nearby Location Filter Button */}
          <button
            id="filter-nearby-toggle"
            onClick={() => setShowOnlyNearby(!showOnlyNearby)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
              showOnlyNearby
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-400'
            }`}
            title={`Filter events within ${radiusFilter}km of ${userLocation.city}`}
          >
            <MapPin className={`w-3.5 h-3.5 ${showOnlyNearby ? 'text-white' : 'text-emerald-500'}`} />
            <span>Near {userLocation.city} ({radiusFilter}km)</span>
          </button>

          {/* AI Recommended Filter Button */}
          <button
            id="filter-ai-recommended-toggle"
            onClick={() => setShowOnlyAiRecommended(!showOnlyAiRecommended)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
              showOnlyAiRecommended
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-400'
            }`}
            title="Filter by personalized AI recommendations based on your preferences"
          >
            <Sparkles className={`w-3.5 h-3.5 ${showOnlyAiRecommended ? 'text-white' : 'text-indigo-500'}`} />
            <span>AI Picks</span>
          </button>

          <div className="ml-auto text-xs font-semibold text-slate-500 dark:text-slate-400">
            Showing <span className="text-indigo-600 dark:text-indigo-400">{filteredEvents.length}</span> events
          </div>
        </div>
      </div>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <div className="p-16 text-center bg-white dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto text-slate-400">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No Events Match Your Filters
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search terms, changing the category, or resetting all filters.
          </p>
          <button
            onClick={resetFilters}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedEvents.map((evt) => (
            <EventCard
              key={evt.id}
              event={evt}
              onSelect={onSelectEvent}
              onRegisterClick={onRegisterClick}
              isRegistered={userRegisteredEventIds.has(evt.id)}
              distanceKm={getEventDistance(evt)}
            />
          ))}
        </div>
      )}

      {/* Pagination / Load More */}
      {filteredEvents.length > visibleCount && (
        <div className="text-center pt-4">
          <button
            id="load-more-events-btn"
            onClick={() => setVisibleCount((prev) => prev + 6)}
            className="px-6 py-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-2xl text-xs font-bold shadow-xs transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <span>Load More Events</span>
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
