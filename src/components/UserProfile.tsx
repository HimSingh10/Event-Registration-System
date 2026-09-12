import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Registration, EventItem } from '../types';
import { formatDate, downloadIcsFile } from '../utils/helpers';
import {
  User,
  Mail,
  Phone,
  Building,
  Briefcase,
  QrCode,
  Calendar,
  Clock,
  MapPin,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Save,
  MessageSquare,
  Sparkles,
  Heart,
  ExternalLink,
} from 'lucide-react';

interface UserProfileProps {
  onViewTicket: (reg: Registration) => void;
  onSelectEvent: (event: EventItem) => void;
  onOpenFeedback: (event: EventItem) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({
  onViewTicket,
  onSelectEvent,
  onOpenFeedback,
}) => {
  const {
    currentUser,
    registrations,
    events,
    cancelRegistration,
    updateUserProfile,
    showToast,
    wishlist,
    toggleWishlist,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'cancelled' | 'wishlist'>('upcoming');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);

  // Editable profile state
  const [name, setName] = useState(currentUser.name);
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [organization, setOrganization] = useState(currentUser.organization || '');
  const [department, setDepartment] = useState(currentUser.department || '');
  const [designation, setDesignation] = useState(currentUser.designation || '');

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateUserProfile({
      name,
      phone,
      organization,
      department,
      designation,
    });
    setIsEditingProfile(false);
  };

  const handleCancel = async (regId: string) => {
    setCancellingId(regId);
    try {
      await cancelRegistration(regId);
      setConfirmCancelId(null);
    } catch (err: any) {
      showToast('error', 'Cancellation Failed', err.message);
    } finally {
      setCancellingId(null);
    }
  };

  // User's registrations
  const userRegistrations = registrations.filter(
    (r) => r.userId === currentUser.id || r.attendeeEmail.toLowerCase() === currentUser.email.toLowerCase()
  );

  const todayStr = new Date().toISOString().split('T')[0];

  const upcomingRegistrations = userRegistrations.filter(
    (r) => r.ticketStatus !== 'Cancelled' && r.eventDate >= todayStr
  );
  const pastRegistrations = userRegistrations.filter(
    (r) => r.ticketStatus !== 'Cancelled' && r.eventDate < todayStr
  );
  const cancelledRegistrations = userRegistrations.filter((r) => r.ticketStatus === 'Cancelled');
  const wishlistedEvents = events.filter((e) => wishlist.includes(e.id));

  const displayedList =
    activeTab === 'upcoming'
      ? upcomingRegistrations
      : activeTab === 'past'
      ? pastRegistrations
      : activeTab === 'cancelled'
      ? cancelledRegistrations
      : [];

  return (
    <div id="user-profile-page" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Profile Overview Card */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-700/80">
          <div className="flex items-center gap-4">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-20 h-20 rounded-2xl object-cover ring-4 ring-indigo-50 dark:ring-slate-700 shadow-md"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white font-['Space_Grotesk']">
                  {currentUser.name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400">
                  {currentUser.role}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                <span>{currentUser.email}</span>
              </p>
              {currentUser.organization && (
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5" />
                  <span>
                    {currentUser.organization}{' '}
                    {currentUser.designation ? `• ${currentUser.designation}` : ''}
                  </span>
                </p>
              )}
            </div>
          </div>

          <button
            id="edit-profile-btn"
            onClick={() => setIsEditingProfile(!isEditingProfile)}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 self-start md:self-auto transition-colors cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>{isEditingProfile ? 'Cancel Editing' : 'Edit Profile'}</span>
          </button>
        </div>

        {/* Edit Profile Form */}
        {isEditingProfile && (
          <form
            onSubmit={handleSaveProfile}
            className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs animate-in fade-in duration-150"
          >
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Organization / College
              </label>
              <input
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="MIT / Google"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Department</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Software Engineering"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Designation / Title
              </label>
              <input
                type="text"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="Lead Developer"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Registrations & Digital Passes Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white font-['Space_Grotesk']">
              My Digital Passes & Registrations
            </h2>
            <p className="text-xs text-slate-500">
              Access your QR tickets, add dates to calendar, or manage attendance.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl overflow-x-auto">
            {[
              { key: 'upcoming', label: `Upcoming (${upcomingRegistrations.length})` },
              { key: 'past', label: `Past (${pastRegistrations.length})` },
              { key: 'cancelled', label: `Cancelled (${cancelledRegistrations.length})` },
              { key: 'wishlist', label: `Saved (${wishlistedEvents.length})` },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === tab.key
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Wishlist View */}
        {activeTab === 'wishlist' ? (
          wishlistedEvents.length === 0 ? (
            <div className="p-16 text-center bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 space-y-2">
              <Heart className="w-10 h-10 text-rose-400 mx-auto opacity-70" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Your wishlist is empty
              </h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Explore upcoming events and click the heart icon to save them for quick access.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {wishlistedEvents.map((evt) => (
                <div
                  key={evt.id}
                  id={`wishlist-row-${evt.id}`}
                  className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={evt.bannerImage}
                      alt={evt.title}
                      className="w-20 h-20 rounded-2xl object-cover shrink-0 ring-1 ring-slate-100 dark:ring-slate-700"
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                          {evt.category}
                        </span>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {evt.ticketType === 'Free' || evt.price === 0 ? 'Free' : `${evt.currency} ${evt.price}`}
                        </span>
                      </div>

                      <h3
                        onClick={() => onSelectEvent(evt)}
                        className="text-sm font-bold text-slate-900 dark:text-white hover:text-indigo-600 transition-colors cursor-pointer line-clamp-1"
                      >
                        {evt.title}
                      </h3>

                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                          {formatDate(evt.date)}
                        </span>
                        <span className="truncate flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {evt.venue}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700/60 text-xs">
                    <button
                      onClick={() => onSelectEvent(evt)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    >
                      <span>View & Register</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>

                    <button
                      onClick={() => toggleWishlist(evt.id)}
                      className="text-[11px] font-semibold text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : displayedList.length === 0 ? (
          <div className="p-16 text-center bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 space-y-2">
            <QrCode className="w-10 h-10 text-slate-400 mx-auto opacity-70" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No {activeTab} registrations found
            </h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Explore upcoming events and reserve your seats with instant digital ticketing.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedList.map((reg) => {
              const matchedEvent = events.find((e) => e.id === reg.eventId);
              const isCheckedIn = reg.ticketStatus === 'Checked In';
              const isCancelled = reg.ticketStatus === 'Cancelled';

              return (
                <div
                  key={reg.id}
                  id={`ticket-row-${reg.id}`}
                  className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={reg.eventBanner}
                      alt={reg.eventTitle}
                      className="w-20 h-20 rounded-2xl object-cover shrink-0 ring-1 ring-slate-100 dark:ring-slate-700"
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                            {reg.id}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">
                            (Ticket: {reg.ticketId || reg.id})
                          </span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            isCheckedIn
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                              : isCancelled
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                              : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400'
                          }`}
                        >
                          {reg.ticketStatus}
                        </span>
                      </div>

                      <h3
                        onClick={() => matchedEvent && onSelectEvent(matchedEvent)}
                        className="text-sm font-bold text-slate-900 dark:text-white hover:text-indigo-600 transition-colors cursor-pointer line-clamp-1"
                      >
                        {reg.eventTitle}
                      </h3>

                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                          {formatDate(reg.eventDate)}
                        </span>
                        <span className="truncate flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {reg.eventVenue}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions bar */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700/60 text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onViewTicket(reg)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>View Pass</span>
                      </button>

                      {matchedEvent && (
                        <button
                          onClick={() => downloadIcsFile(matchedEvent)}
                          className="p-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-600 dark:text-slate-300 rounded-xl"
                          title="Add to Calendar (.ics)"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {activeTab === 'past' && matchedEvent && (
                        <button
                          onClick={() => onOpenFeedback(matchedEvent)}
                          className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 rounded-xl font-semibold flex items-center gap-1"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Review</span>
                        </button>
                      )}
                    </div>

                    {!isCancelled && !isCheckedIn && (
                      confirmCancelId === reg.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">Release seat?</span>
                          <button
                            disabled={cancellingId === reg.id}
                            onClick={() => handleCancel(reg.id)}
                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-colors shadow-2xs"
                          >
                            {cancellingId === reg.id ? 'Releasing...' : 'Yes, Cancel'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmCancelId(null)}
                            className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-semibold cursor-pointer hover:bg-slate-200"
                          >
                            Keep
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmCancelId(reg.id)}
                          className="text-[11px] font-semibold text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 transition-colors cursor-pointer"
                        >
                          Cancel Seat
                        </button>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
