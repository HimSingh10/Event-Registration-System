import React from 'react';
import { EventItem } from '../types';
import { useApp } from '../context/AppContext';
import {
  formatDate,
  formatCurrency,
  getDynamicEventStatus,
  getStatusBadgeConfig,
  formatDistance,
} from '../utils/helpers';
import { getEventUrgencyBadge } from '../utils/location';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  ArrowRight,
  CheckCircle2,
  Globe,
  Navigation,
  Heart,
} from 'lucide-react';

interface EventCardProps {
  event: EventItem;
  onSelect: (event: EventItem) => void;
  onRegisterClick?: (event: EventItem) => void;
  isRegistered?: boolean;
  userCoords?: { latitude: number; longitude: number } | null;
  distanceKm?: number | null;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  onSelect,
  onRegisterClick,
  isRegistered = false,
  userCoords,
  distanceKm: providedDistance,
}) => {
  const { isWishlisted, toggleWishlist, getEventDistance } = useApp();
  const wishlisted = isWishlisted(event.id);

  const capacity = event.capacity ?? event.maxCapacity ?? 0;
  const registered = event.registeredCount ?? 0;
  const seatsLeft = Math.max(0, capacity - registered);
  const capacityPercent =
    capacity > 0 ? Math.min(100, Math.round((registered / capacity) * 100)) : 0;

  // Calculate dynamic status from real-time / database values
  const dynamicStatus = getDynamicEventStatus(event);
  const statusConfig = getStatusBadgeConfig(dynamicStatus);

  // Urgency indicator badge
  const urgency = getEventUrgencyBadge(event);

  // Calculate distance if coordinates exist
  const effectiveDistance =
    providedDistance !== undefined
      ? providedDistance
      : getEventDistance(event);

  const isVirtual = event.format === 'Virtual' || event.locationType === 'Virtual';
  const isHybrid = event.format === 'Hybrid' || event.locationType === 'Hybrid';

  const canRegister =
    !isRegistered &&
    dynamicStatus === 'REGISTRATION_OPEN' &&
    seatsLeft > 0;

  return (
    <div
      id={`event-card-${event.id}`}
      className="group flex flex-col bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/70 overflow-hidden shadow-sm hover:shadow-xl hover:border-indigo-300 dark:hover:border-indigo-500/40 transition-all duration-300 transform hover:-translate-y-1"
    >
      {/* Banner & Badges */}
      <div className="relative aspect-[16/9] overflow-hidden bg-slate-100 dark:bg-slate-800">
        <img
          src={event.bannerImage}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          {/* Category & Urgency Pills */}
          <div className="flex items-center gap-1.5">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-white backdrop-blur-md shadow-sm">
              {event.category}
            </span>
            {urgency && (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide backdrop-blur-md shadow-xs ${
                  urgency.tone === 'danger'
                    ? 'bg-rose-500/95 text-white'
                    : 'bg-amber-400 text-slate-950'
                }`}
              >
                {urgency.text}
              </span>
            )}
          </div>

          {/* Actions & Price */}
          <div className="flex items-center gap-1.5 pointer-events-auto">
            <button
              id={`wishlist-btn-${event.id}`}
              onClick={(e) => {
                e.stopPropagation();
                toggleWishlist(event.id);
              }}
              aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              className={`p-1.5 rounded-full backdrop-blur-md transition-all active:scale-90 cursor-pointer shadow-sm ${
                wishlisted
                  ? 'bg-rose-500 text-white shadow-rose-500/40'
                  : 'bg-slate-900/70 hover:bg-slate-900 text-white/80 hover:text-white border border-white/20'
              }`}
              title={wishlisted ? 'Saved in Wishlist' : 'Save to Wishlist'}
            >
              <Heart className={`w-3.5 h-3.5 ${wishlisted ? 'fill-current text-white' : ''}`} />
            </button>

            <span
              className={`px-2.5 py-1 rounded-full text-xs font-bold shadow-sm backdrop-blur-md ${
                event.ticketType === 'Free' || event.price === 0
                  ? 'bg-emerald-600 text-white'
                  : 'bg-indigo-600 text-white'
              }`}
            >
              {formatCurrency(event.price, event.currency)}
            </span>
          </div>
        </div>

        {/* Bottom Status & Format Overlay */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
          {/* Dynamic Status Badge */}
          <span
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1.5 backdrop-blur-md shadow-xs ${statusConfig.badgeClass}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotClass} ${
                statusConfig.pulse ? 'animate-pulse' : ''
              }`}
            />
            {statusConfig.label}
          </span>

          {/* Format Badge */}
          <span className="text-[11px] font-medium text-slate-200 bg-slate-900/85 px-2.5 py-1 rounded-md backdrop-blur-md border border-slate-700/50 flex items-center gap-1">
            {isVirtual ? (
              <>
                <Globe className="w-3 h-3 text-sky-400" />
                <span>Online</span>
              </>
            ) : isHybrid ? (
              <>
                <MapPin className="w-3 h-3 text-indigo-400" />
                <span>Hybrid</span>
              </>
            ) : (
              <>
                <MapPin className="w-3 h-3 text-amber-400" />
                <span>In-Person</span>
              </>
            )}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Date & Time */}
          <div className="flex items-center gap-3 text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-2">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(event.date)}
            </span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              {event.startTime}
            </span>
          </div>

          {/* Title */}
          <h3
            onClick={() => onSelect(event)}
            className="text-base font-bold text-slate-900 dark:text-white line-clamp-2 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer leading-snug"
          >
            {event.title}
          </h3>

          {/* Location & Distance Display */}
          <div className="mt-2.5 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 truncate">
              {isVirtual ? (
                <>
                  <Globe className="w-3.5 h-3.5 shrink-0 text-sky-500" />
                  <span className="truncate font-medium text-sky-600 dark:text-sky-400">
                    🌐 Online Event
                  </span>
                </>
              ) : (
                <>
                  <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  <span className="truncate">
                    {event.city ? `${event.city} • ${event.venue}` : event.venue}
                  </span>
                </>
              )}
            </div>

            {/* Approximate Distance (Only shown when valid coordinates exist) */}
            {!isVirtual && effectiveDistance !== null && (
              <div className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                <Navigation className="w-3 h-3 shrink-0" />
                <span>{formatDistance(effectiveDistance)}</span>
              </div>
            )}
          </div>

          {/* Description snippet */}
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-2.5 line-clamp-2 leading-relaxed">
            {event.description}
          </p>
        </div>

        {/* Capacity bar & Organizer footer */}
        <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-700/60 space-y-3">
          {/* Progress bar */}
          <div>
            <div className="flex items-center justify-between text-[11px] mb-1 text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3 text-slate-400" />
                <span>{registered} registered</span>
              </span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {dynamicStatus === 'SOLD_OUT' || seatsLeft === 0
                  ? 'Sold Out'
                  : `${seatsLeft} seats left`}
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  seatsLeft === 0 || dynamicStatus === 'SOLD_OUT'
                    ? 'bg-rose-500'
                    : capacityPercent >= 90
                    ? 'bg-amber-500'
                    : 'bg-indigo-600'
                }`}
                style={{ width: `${capacityPercent}%` }}
              />
            </div>
          </div>

          {/* Organizer and CTA Button */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2 min-w-0">
              <img
                src={event.organizerAvatar}
                alt={event.organizerName}
                className="w-6 h-6 rounded-full object-cover shrink-0 ring-1 ring-slate-200 dark:ring-slate-700"
              />
              <span className="text-xs text-slate-600 dark:text-slate-400 truncate">
                {event.organizerName}
              </span>
            </div>

            {isRegistered ? (
              <button
                id={`view-ticket-btn-${event.id}`}
                onClick={() => onSelect(event)}
                className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 rounded-xl text-xs font-semibold flex items-center gap-1 hover:bg-emerald-100 transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Ticket Active</span>
              </button>
            ) : dynamicStatus === 'COMPLETED' ? (
              <button
                id={`view-completed-btn-${event.id}`}
                onClick={() => onSelect(event)}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-medium hover:bg-slate-200 transition-colors cursor-pointer"
              >
                View Recap
              </button>
            ) : canRegister ? (
              <button
                id={`register-btn-${event.id}`}
                onClick={() => (onRegisterClick ? onRegisterClick(event) : onSelect(event))}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1 transition-all cursor-pointer group-hover:shadow-md"
              >
                <span>Register</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            ) : (
              <button
                id={`view-details-btn-${event.id}`}
                onClick={() => onSelect(event)}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
              >
                View Details
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
