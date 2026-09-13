import React, { useState } from 'react';
import { EventItem, Registration } from '../types';
import { useApp } from '../context/AppContext';
import { formatDate, formatCurrency, downloadIcsFile } from '../utils/helpers';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Building,
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Share2,
  ArrowLeft,
  Sparkles,
  ChevronDown,
  Star,
  MessageSquare,
  FileText,
  ExternalLink,
  Heart,
} from 'lucide-react';

interface EventDetailsProps {
  event: EventItem;
  onBack: () => void;
  onRegisterClick: (event: EventItem) => void;
  onSelectRelatedEvent: (event: EventItem) => void;
  onViewTicket: (reg: Registration) => void;
  onOpenFeedback: (event: EventItem) => void;
}

export const EventDetails: React.FC<EventDetailsProps> = ({
  event,
  onBack,
  onRegisterClick,
  onSelectRelatedEvent,
  onViewTicket,
  onOpenFeedback,
}) => {
  const {
    registrations,
    currentUser,
    events,
    getEventFeedbacks,
    showToast,
    isWishlisted,
    toggleWishlist,
    getEventDistance,
    userLocation,
    openAiAssistantWithEvent,
  } = useApp();
  const wishlisted = isWishlisted(event.id);
  const eventDistance = getEventDistance(event);
  const [activeTab, setActiveTab] = useState<'overview' | 'agenda' | 'speakers' | 'faqs' | 'reviews'>('overview');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Check if current user is registered
  const userRegistration = registrations.find(
    (r) =>
      r.eventId === event.id &&
      r.userId === currentUser.id &&
      r.ticketStatus !== 'Cancelled'
  );

  const feedbacks = getEventFeedbacks(event.id);
  const avgRating =
    feedbacks.length > 0
      ? (feedbacks.reduce((acc, f) => acc + f.rating, 0) / feedbacks.length).toFixed(1)
      : '5.0';

  const seatsLeft = Math.max(0, event.maxCapacity - event.registeredCount);
  const capacityPercent = Math.min(100, Math.round((event.registeredCount / event.maxCapacity) * 100));

  const isClosed = event.status === 'Registration Closed' || seatsLeft === 0;
  const isCompleted = event.status === 'Completed';
  const isAlmostFull = event.status === 'Almost Full' || (seatsLeft <= 20 && !isClosed && !isCompleted);

  // Related events in same category
  const relatedEvents = events
    .filter((e) => e.id !== event.id && (e.category === event.category || e.ticketType === event.ticketType))
    .slice(0, 3);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: event.title,
        text: event.description.slice(0, 150),
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('info', 'Link Copied', 'Event link copied to clipboard.');
    }
  };

  return (
    <div id="event-details-view" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button & quick action row */}
      <div className="flex items-center justify-between">
        <button
          id="back-to-explore-btn"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Events</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => openAiAssistantWithEvent(event)}
            className="p-2 bg-gradient-to-r from-indigo-50 dark:from-indigo-950/60 to-violet-50 dark:to-violet-950/60 hover:from-indigo-100 hover:to-violet-100 border border-indigo-200/80 dark:border-indigo-800 rounded-xl text-indigo-700 dark:text-indigo-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs group"
            title="Ask AI Assistant about this event"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse group-hover:rotate-12 transition-transform" />
            <span className="hidden sm:inline">Ask AI</span>
          </button>
          <button
            id="details-wishlist-btn"
            onClick={() => toggleWishlist(event.id)}
            className={`p-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs border ${
              wishlisted
                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/60'
                : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
            title={wishlisted ? 'Saved in Wishlist' : 'Save to Wishlist'}
          >
            <Heart className={`w-3.5 h-3.5 ${wishlisted ? 'fill-current text-rose-500' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">{wishlisted ? 'Saved' : 'Save'}</span>
          </button>
          <button
            onClick={handleShare}
            className="p-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Share</span>
          </button>
          <button
            onClick={() => downloadIcsFile(event)}
            className="p-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden sm:inline">Add to Calendar</span>
          </button>
        </div>
      </div>

      {/* Hero Banner with Overlay */}
      <div className="relative rounded-3xl overflow-hidden shadow-xl aspect-[21/9] min-h-[280px] sm:min-h-[380px] bg-slate-900">
        <img
          src={event.bannerImage}
          alt={event.title}
          className="w-full h-full object-cover opacity-75"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

        <div className="absolute bottom-6 left-6 right-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/90 text-slate-900 shadow-sm backdrop-blur-md">
                {event.category}
              </span>

              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md ${
                  event.ticketType === 'Free'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-600 text-white'
                }`}
              >
                {formatCurrency(event.price, event.currency)}
              </span>

              <span
                className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 backdrop-blur-md ${
                  isCompleted
                    ? 'bg-slate-800/90 text-slate-300'
                    : isClosed
                    ? 'bg-rose-950/90 text-rose-200 border border-rose-500/30'
                    : isAlmostFull
                    ? 'bg-amber-950/90 text-amber-200 border border-amber-500/30'
                    : 'bg-emerald-950/90 text-emerald-200 border border-emerald-500/30'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isCompleted
                      ? 'bg-slate-400'
                      : isClosed
                      ? 'bg-rose-400'
                      : 'bg-emerald-400 animate-pulse'
                  }`}
                />
                {isCompleted
                  ? 'Event Completed'
                  : isClosed
                  ? 'Registration Closed'
                  : isAlmostFull
                  ? 'Almost Full'
                  : 'Registration Open'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight font-['Space_Grotesk']">
              {event.title}
            </h1>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Details & Tabs / Right Sticky Registration Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 8 Cols */}
        <div className="lg:col-span-8 space-y-8">
          {/* Quick Metrics Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Date</span>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                <span>{formatDate(event.date)}</span>
              </p>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Time</span>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                <span>{event.startTime} - {event.endTime}</span>
              </p>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Format</span>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                <span>{event.locationType}</span>
                {eventDistance !== null && (
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                    ({eventDistance} km away)
                  </span>
                )}
              </p>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Deadline</span>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                {formatDate(event.registrationDeadline)}
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-700 gap-6 overflow-x-auto text-sm font-semibold">
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'agenda', label: `Agenda (${event.agenda?.length || 0})` },
              { key: 'speakers', label: `Speakers (${event.speakers?.length || 0})` },
              { key: 'faqs', label: `FAQs (${event.faqs?.length || 0})` },
              { key: 'reviews', label: `Reviews (${feedbacks.length})` },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`pb-3 text-xs font-bold transition-all relative whitespace-nowrap cursor-pointer ${
                  activeTab === tab.key
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* TAB CONTENT: Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in duration-150">
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  About This Event
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {event.description}
                </p>
              </div>

              {/* Venue & Location Section with simulated map */}
              <div className="space-y-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-indigo-500" />
                  <span>Venue & Location</span>
                </h3>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {event.venue}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {event.address}
                    </p>
                  </div>

                  {/* Interactive Styled Map View Mockup */}
                  <div className="relative h-44 rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 bg-slate-200 dark:bg-slate-900 flex items-center justify-center">
                    <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:16px_16px]" />
                    <div className="relative text-center p-4 bg-white/90 dark:bg-slate-800/90 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 backdrop-blur-xs max-w-xs">
                      <MapPin className="w-6 h-6 text-rose-500 mx-auto animate-bounce" />
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                        {event.venue}
                      </p>
                      <p className="text-[10px] text-slate-400">{event.address}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Terms and Conditions */}
              {event.terms && event.terms.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-500" />
                    <span>Terms & Entry Rules</span>
                  </h3>
                  <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400 list-disc list-inside bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60">
                    {event.terms.map((term, i) => (
                      <li key={i}>{term}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* TAB CONTENT: Agenda */}
          {activeTab === 'agenda' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Official Event Schedule
              </h3>
              <div className="space-y-3">
                {event.agenda?.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col sm:flex-row sm:items-start gap-4"
                  >
                    <span className="px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono text-xs font-bold shrink-0 self-start">
                      {item.time}
                    </span>
                    <div className="space-y-1 flex-1">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {item.title}
                      </h4>
                      {item.speaker && (
                        <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                          Session Lead: {item.speaker}
                        </p>
                      )}
                      {item.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB CONTENT: Speakers */}
          {activeTab === 'speakers' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Featured Speakers & Instructors
              </h3>
              {event.speakers?.length === 0 ? (
                <p className="text-xs text-slate-400 p-8 text-center">
                  Speaker announcements coming soon.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {event.speakers.map((spk) => (
                    <div
                      key={spk.id}
                      className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-start gap-3.5"
                    >
                      <img
                        src={spk.avatar}
                        alt={spk.name}
                        className="w-14 h-14 rounded-2xl object-cover ring-2 ring-slate-100 dark:ring-slate-700 shrink-0"
                      />
                      <div className="space-y-1 min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {spk.name}
                        </h4>
                        <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 truncate">
                          {spk.role}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {spk.company}
                        </p>
                        {spk.bio && (
                          <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                            {spk.bio}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB CONTENT: FAQs */}
          {activeTab === 'faqs' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Frequently Asked Questions
              </h3>
              <div className="space-y-2.5">
                {event.faqs?.map((faq, index) => {
                  const isOpen = openFaqIndex === index;
                  return (
                    <div
                      key={index}
                      className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-2xs transition-all"
                    >
                      <button
                        onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                        className="w-full px-5 py-3.5 text-left text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
                      >
                        <span>{faq.question}</span>
                        <ChevronDown
                          className={`w-4 h-4 text-slate-400 transition-transform ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-700/60 pt-2">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB CONTENT: Reviews & Feedback */}
          {activeTab === 'reviews' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Attendee Reviews & Feedback
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center text-amber-400">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {avgRating} out of 5
                    </span>
                    <span className="text-xs text-slate-400">({feedbacks.length} reviews)</span>
                  </div>
                </div>

                <button
                  onClick={() => onOpenFeedback(event)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Write a Review</span>
                </button>
              </div>

              <div className="space-y-3">
                {feedbacks.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                    No attendee reviews submitted yet. Be the first to review this event!
                  </div>
                ) : (
                  feedbacks.map((fb) => (
                    <div
                      key={fb.id}
                      className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={fb.userAvatar}
                            alt={fb.userName}
                            className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200"
                          />
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">
                              {fb.userName}
                            </p>
                            <span className="text-[10px] text-slate-400">
                              {new Date(fb.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center text-amber-400">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${
                                s <= fb.rating ? 'fill-current' : 'text-slate-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        "{fb.review}"
                      </p>
                      {fb.suggestions && (
                        <p className="text-[11px] text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 p-2 rounded-lg">
                          Suggestion: {fb.suggestions}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right 4 Cols: Sticky Registration Card & Organizer Box */}
        <div className="lg:col-span-4 space-y-6">
          <div className="sticky top-24 space-y-6">
            {/* Primary Action Card */}
            <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-lg space-y-6">
              <div className="flex items-baseline justify-between border-b border-slate-100 dark:border-slate-700/80 pb-4">
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                    Admission
                  </span>
                  <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
                    {formatCurrency(event.price, event.currency)}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    event.ticketType === 'Free'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                      : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400'
                  }`}
                >
                  {event.ticketType} Pass
                </span>
              </div>

              {/* Real-time Capacity Meter */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>{event.registeredCount} / {event.maxCapacity} Seats</span>
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {isClosed ? 'Full' : `${seatsLeft} Left`}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      capacityPercent >= 90 ? 'bg-amber-500' : 'bg-indigo-600'
                    }`}
                    style={{ width: `${capacityPercent}%` }}
                  />
                </div>
              </div>

              {/* Action Buttons based on User Registration Status */}
              {userRegistration ? (
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>You're registered for this event!</span>
                  </div>
                  <button
                    id="view-my-ticket-btn"
                    onClick={() => onViewTicket(userRegistration)}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>View Digital Ticket & QR Code</span>
                  </button>
                </div>
              ) : isCompleted ? (
                <div className="space-y-3">
                  <div className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-2xl text-xs text-slate-600 dark:text-slate-300 text-center font-medium">
                    This event was completed on {formatDate(event.date)}.
                  </div>
                  <button
                    onClick={() => onOpenFeedback(event)}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Submit Attendee Feedback</span>
                  </button>
                </div>
              ) : isClosed ? (
                <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl text-xs text-rose-700 dark:text-rose-300 text-center font-semibold">
                  Registration for this event is currently closed.
                </div>
              ) : (
                <button
                  id="event-register-now-btn"
                  onClick={() => onRegisterClick(event)}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-extrabold shadow-md hover:shadow-indigo-500/30 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Register for Event</span>
                </button>
              )}

              <div className="pt-2 text-[11px] text-slate-400 space-y-1.5 border-t border-slate-100 dark:border-slate-700/60">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Instant digital ticket delivery with QR code</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Free cancellation up to 48 hours before start</span>
                </div>
              </div>
            </div>

            {/* Organizer Card */}
            <div className="p-5 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">
                Hosted By
              </span>
              <div className="flex items-center gap-3">
                <img
                  src={event.organizerAvatar}
                  alt={event.organizerName}
                  className="w-12 h-12 rounded-2xl object-cover ring-2 ring-indigo-100 dark:ring-slate-700"
                />
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {event.organizerName}
                  </h4>
                  <p className="text-xs text-slate-500 truncate">{event.organizerEmail}</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pt-1">
                Verified event creator on EventEase. Organizing high-impact summits and workshops.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Related Events Section */}
      {relatedEvents.length > 0 && (
        <div className="pt-12 border-t border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white font-['Space_Grotesk']">
              Related Events You Might Like
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedEvents.map((rel) => (
              <div
                key={rel.id}
                onClick={() => onSelectRelatedEvent(rel)}
                className="group cursor-pointer bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-2xs hover:shadow-lg transition-all"
              >
                <div className="aspect-[16/9] overflow-hidden relative">
                  <img
                    src={rel.bannerImage}
                    alt={rel.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white">
                    {rel.category}
                  </span>
                </div>
                <div className="p-4 space-y-1">
                  <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                    {formatDate(rel.date)}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 transition-colors">
                    {rel.title}
                  </h4>
                  <p className="text-xs text-slate-500 truncate">{rel.venue}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
