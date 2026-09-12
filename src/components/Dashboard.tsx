import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { EventItem, Registration, UserRole, EventCategory } from '../types';
import { formatCurrency, formatDate, exportToCsv } from '../utils/helpers';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import {
  LayoutDashboard,
  Calendar,
  Users,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Plus,
  Search,
  Download,
  Trash2,
  Edit,
  Copy,
  Send,
  Shield,
  Eye,
  AlertCircle,
  FileSpreadsheet,
  QrCode,
  Filter,
  Check,
} from 'lucide-react';

interface DashboardProps {
  onOpenCreateEvent: (eventToEdit?: EventItem) => void;
  onViewEvent: (event: EventItem) => void;
  onViewTicket: (registration: Registration) => void;
  onOpenCheckIn: () => void;
}

const COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

export const Dashboard: React.FC<DashboardProps> = ({
  onOpenCreateEvent,
  onViewEvent,
  onViewTicket,
  onOpenCheckIn,
}) => {
  const {
    events,
    registrations,
    users,
    currentUser,
    role,
    deleteEvent,
    duplicateEvent,
    updateEvent,
    checkInAttendee,
    cancelRegistration,
    sendAnnouncement,
    updateUserRole,
    seedDemoEvents,
    clearDemoData,
    showToast,
  } = useApp();

  const isAdmin = role?.toLowerCase() === 'admin';
  const isOrganizer = role?.toLowerCase() === 'organizer';

  // Tabs: 'analytics' | 'events' | 'registrations' | 'announcements' | 'users'
  const [activeTab, setActiveTab] = useState<'analytics' | 'events' | 'registrations' | 'announcements' | 'users'>(
    'analytics'
  );

  // Filter events based on role: Admin sees all events; Organizer sees their created events (or all demo events for testing)
  const scopedEvents = useMemo(() => {
    if (isAdmin) return events;
    const mine = events.filter((e) => e.organizerId === currentUser.id);
    return mine.length > 0 ? mine : events;
  }, [events, isAdmin, currentUser.id]);

  const scopedEventIds = useMemo(() => new Set(scopedEvents.map((e) => e.id)), [scopedEvents]);

  const scopedRegistrations = useMemo(() => {
    return registrations.filter((r) => scopedEventIds.has(r.eventId));
  }, [registrations, scopedEventIds]);

  // Overall Statistics
  const totalEvents = scopedEvents.length;
  const totalRegistrations = scopedRegistrations.filter((r) => r.ticketStatus !== 'Cancelled').length;
  const totalCheckedIn = scopedRegistrations.filter((r) => r.ticketStatus === 'Checked In').length;
  const attendanceRate = totalRegistrations > 0 ? Math.round((totalCheckedIn / totalRegistrations) * 100) : 0;

  const totalRevenue = scopedRegistrations
    .filter((r) => r.ticketStatus !== 'Cancelled')
    .reduce((acc, r) => {
      const evt = events.find((e) => e.id === r.eventId);
      return acc + (evt?.ticketType === 'Paid' ? evt.price : 0);
    }, 0);

  // Analytics Chart 1: Registrations & Capacity by Event
  const eventCapacityData = useMemo(() => {
    return scopedEvents.slice(0, 6).map((evt) => ({
      name: evt.title.length > 18 ? evt.title.slice(0, 18) + '...' : evt.title,
      Registered: evt.registeredCount,
      Capacity: evt.maxCapacity,
    }));
  }, [scopedEvents]);

  // Analytics Chart 2: Category Distribution
  const categoryDistributionData = useMemo(() => {
    const counts: Record<string, number> = {};
    scopedEvents.forEach((evt) => {
      counts[evt.category] = (counts[evt.category] || 0) + evt.registeredCount;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [scopedEvents]);

  // Manage Events state
  const [eventSearch, setEventSearch] = useState('');
  const [eventCategoryFilter, setEventCategoryFilter] = useState('All');

  const filteredEventsList = useMemo(() => {
    return scopedEvents.filter((evt) => {
      const matchSearch =
        evt.title.toLowerCase().includes(eventSearch.toLowerCase()) ||
        evt.venue.toLowerCase().includes(eventSearch.toLowerCase());
      const matchCat = eventCategoryFilter === 'All' || evt.category === eventCategoryFilter;
      return matchSearch && matchCat;
    });
  }, [scopedEvents, eventSearch, eventCategoryFilter]);

  // Registrations state
  const [regSearch, setRegSearch] = useState('');
  const [regEventFilter, setRegEventFilter] = useState('All');
  const [regStatusFilter, setRegStatusFilter] = useState('All');

  const filteredRegistrations = useMemo(() => {
    return scopedRegistrations.filter((r) => {
      const matchSearch =
        r.attendeeName.toLowerCase().includes(regSearch.toLowerCase()) ||
        r.attendeeEmail.toLowerCase().includes(regSearch.toLowerCase()) ||
        r.id.toLowerCase().includes(regSearch.toLowerCase());
      const matchEvent = regEventFilter === 'All' || r.eventId === regEventFilter;
      const matchStatus = regStatusFilter === 'All' || r.ticketStatus === regStatusFilter;
      return matchSearch && matchEvent && matchStatus;
    });
  }, [scopedRegistrations, regSearch, regEventFilter, regStatusFilter]);

  // Announcement state
  const [announcementEventId, setAnnouncementEventId] = useState<string>(scopedEvents[0]?.id || '');
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementMessage, setAnnouncementMessage] = useState('');

  const handleSendAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementTitle.trim() || !announcementMessage.trim()) {
      showToast('error', 'Missing Content', 'Please provide a title and announcement message.');
      return;
    }
    sendAnnouncement(announcementEventId, announcementTitle.trim(), announcementMessage.trim());
    setAnnouncementTitle('');
    setAnnouncementMessage('');
  };

  // Export Attendees to CSV
  const handleExportAttendeesCsv = () => {
    if (filteredRegistrations.length === 0) {
      showToast('warning', 'No records to export', 'There are no registrations matching current filters.');
      return;
    }

    const headers = [
      'Registration ID',
      'Attendee Name',
      'Attendee Email',
      'Phone',
      'Event Title',
      'Event Date',
      'Organization',
      'Designation',
      'Dietary Preference',
      'Ticket Status',
      'Checked In Time',
    ];

    const rows = filteredRegistrations.map((r) => [
      r.id,
      r.attendeeName,
      r.attendeeEmail,
      r.attendeePhone || '',
      r.eventTitle,
      r.eventDate,
      r.organization || '',
      r.designation || '',
      r.dietaryPreference || '',
      r.ticketStatus,
      r.checkedInAt ? new Date(r.checkedInAt).toLocaleString() : 'N/A',
    ]);

    exportToCsv(`eventease_attendees_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
    showToast('success', 'CSV Exported', `Exported ${filteredRegistrations.length} attendee records.`);
  };

  return (
    <div id="dashboard-container" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner & Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400">
              {isAdmin ? 'Super Admin Portal' : 'Organizer Workspace'}
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              {currentUser.name} ({currentUser.email})
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-['Space_Grotesk'] tracking-tight mt-1">
            {isAdmin ? 'System Administration & Analytics' : 'Event Operations Dashboard'}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="dash-open-qr-btn"
            onClick={onOpenCheckIn}
            className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5 text-emerald-500" />
            <span>QR Check-In Station</span>
          </button>

          <button
            id="dash-create-event-btn"
            onClick={() => onOpenCreateEvent()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Event</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Events</span>
            <Calendar className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {totalEvents}
          </p>
          <p className="text-[11px] text-slate-400">Active & published gatherings</p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Registrations</span>
            <Users className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {totalRegistrations}
          </p>
          <p className="text-[11px] text-slate-400">Confirmed digital passes issued</p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Check-In Rate</span>
            <CheckCircle2 className="w-4 h-4 text-teal-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {attendanceRate}%
            </p>
            <span className="text-xs text-slate-500 font-medium">({totalCheckedIn} arrived)</span>
          </div>
          <p className="text-[11px] text-slate-400">Real-time gate scan verification</p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Gross Volume</span>
            <DollarSign className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {formatCurrency(totalRevenue, 'USD')}
          </p>
          <p className="text-[11px] text-slate-400">From paid tickets & premium access</p>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 gap-6 overflow-x-auto text-sm font-semibold">
        {[
          { key: 'analytics', label: 'Overview & Charts', icon: LayoutDashboard },
          { key: 'events', label: `Events (${scopedEvents.length})`, icon: Calendar },
          { key: 'registrations', label: `Attendee Roster (${scopedRegistrations.length})`, icon: Users },
          { key: 'announcements', label: 'Broadcast Announcements', icon: Send },
          ...(isAdmin ? [{ key: 'users', label: `User Management (${users.length})`, icon: Shield }] : []),
        ].map((tab) => {
          const Icon = tab.icon;
          const isCurrent = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              id={`dash-tab-${tab.key}`}
              onClick={() => setActiveTab(tab.key as any)}
              className={`pb-3 text-xs font-bold transition-all relative flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                isCurrent
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {isCurrent && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: Analytics & Interactive Charts */}
      {activeTab === 'analytics' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Chart 1: Registration Count vs Capacity */}
            <div className="lg:col-span-8 p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Registration Demand vs. Venue Capacity
                  </h3>
                  <p className="text-xs text-slate-500">
                    Comparing attendee registrations against total venue seating
                  </p>
                </div>
              </div>

              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={eventCapacityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderRadius: '12px',
                        border: 'none',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="Registered" fill="#6366f1" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Capacity" fill="#cbd5e1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Category Distribution */}
            <div className="lg:col-span-4 p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Registrations by Category
                </h3>
                <p className="text-xs text-slate-500">Distribution across tech, hackathons, and summits</p>
              </div>

              <div className="h-56 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {categoryDistributionData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderRadius: '12px',
                        border: 'none',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex flex-wrap gap-2 text-[10px] text-slate-600 dark:text-slate-300 justify-center">
                {categoryDistributionData.map((c, i) => (
                  <span key={c.name} className="flex items-center gap-1">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                    <span>
                      {c.name} ({c.value})
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Events Management Table */}
      {activeTab === 'events' && (
        <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={eventSearch}
                  onChange={(e) => setEventSearch(e.target.value)}
                  placeholder="Search events by title or venue..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
              <select
                value={eventCategoryFilter}
                onChange={(e) => setEventCategoryFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                <option value="All">All Categories</option>
                <option value="Technology">Technology</option>
                <option value="Hackathon">Hackathon</option>
                <option value="Business">Business</option>
                <option value="Workshop">Workshop</option>
              </select>
            </div>

            <button
              onClick={() => onOpenCreateEvent()}
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Event</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3">Event Title</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Venue</th>
                  <th className="px-4 py-3">Capacity</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {filteredEventsList.map((evt) => {
                  const capPct = Math.round((evt.registeredCount / evt.maxCapacity) * 100);
                  return (
                    <tr
                      key={evt.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-750 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={evt.bannerImage}
                            alt={evt.title}
                            className="w-10 h-10 rounded-xl object-cover shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 dark:text-white line-clamp-1 block">
                              {evt.title}
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold uppercase">
                              {evt.category}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatDate(evt.date)}</td>
                      <td className="px-4 py-3 text-slate-500 max-w-[140px] truncate">{evt.venue}</td>
                      <td className="px-4 py-3">
                        <div className="w-24 space-y-1">
                          <div className="flex justify-between text-[10px] font-semibold">
                            <span>{evt.registeredCount}</span>
                            <span className="text-slate-400">/ {evt.maxCapacity}</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-600 rounded-full"
                              style={{ width: `${Math.min(100, capPct)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            evt.status === 'Registration Open'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {evt.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                        {formatCurrency(evt.price, evt.currency)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onViewEvent(evt)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                            title="Preview Event"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onOpenCreateEvent(evt)}
                            className="p-1.5 text-slate-400 hover:text-amber-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                            title="Edit Event"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => duplicateEvent(evt.id)}
                            className="p-1.5 text-slate-400 hover:text-emerald-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                            title="Duplicate Event"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteEvent(evt.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                            title="Delete Event"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Attendee Registrations & CSV Export */}
      {activeTab === 'registrations' && (
        <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={regSearch}
                  onChange={(e) => setRegSearch(e.target.value)}
                  placeholder="Search attendee, email, ID..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <select
                value={regEventFilter}
                onChange={(e) => setRegEventFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                <option value="All">All Events</option>
                {scopedEvents.map((evt) => (
                  <option key={evt.id} value={evt.id}>
                    {evt.title.slice(0, 30)}...
                  </option>
                ))}
              </select>

              <select
                value={regStatusFilter}
                onChange={(e) => setRegStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                <option value="All">All Statuses</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Checked In">Checked In</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <button
              id="export-attendees-csv-btn"
              onClick={handleExportAttendeesCsv}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer shrink-0"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Attendee</th>
                  <th className="px-4 py-3">Event</th>
                  <th className="px-4 py-3">Organization</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Check-In</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {filteredRegistrations.map((reg) => (
                  <tr
                    key={reg.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-750 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">
                      {reg.id}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{reg.attendeeName}</p>
                        <p className="text-[11px] text-slate-400">{reg.attendeeEmail}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-[160px] truncate">{reg.eventTitle}</td>
                    <td className="px-4 py-3 text-slate-500">{reg.organization || '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          reg.ticketStatus === 'Checked In'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                            : reg.ticketStatus === 'Cancelled'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                            : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400'
                        }`}
                      >
                        {reg.ticketStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {reg.checkedInAt ? new Date(reg.checkedInAt).toLocaleTimeString() : 'Pending'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onViewTicket(reg)}
                          className="px-2 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-lg text-[11px] font-medium"
                        >
                          Ticket
                        </button>
                        {reg.ticketStatus !== 'Checked In' && reg.ticketStatus !== 'Cancelled' && (
                          <button
                            onClick={() => checkInAttendee(reg.id, currentUser.name)}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold"
                          >
                            Check-In
                          </button>
                        )}
                        {reg.ticketStatus !== 'Cancelled' && (
                          <button
                            onClick={() => cancelRegistration(reg.id)}
                            className="p-1 text-slate-400 hover:text-rose-500 rounded-md"
                            title="Cancel Registration"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Broadcast Announcements */}
      {activeTab === 'announcements' && (
        <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-6 max-w-2xl">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Send Event Broadcast
            </h3>
            <p className="text-xs text-slate-500">
              Instantly send schedule updates, room changes, or reminders to all registered attendees.
            </p>
          </div>

          <form onSubmit={handleSendAnnouncement} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Target Event
              </label>
              <select
                id="announcement-event-select"
                value={announcementEventId}
                onChange={(e) => setAnnouncementEventId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                {scopedEvents.map((evt) => (
                  <option key={evt.id} value={evt.id}>
                    {evt.title} ({evt.registeredCount} attendees)
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Announcement Subject *
              </label>
              <input
                id="announcement-title-input"
                type="text"
                required
                value={announcementTitle}
                onChange={(e) => setAnnouncementTitle(e.target.value)}
                placeholder="e.g. Keynote Room Relocated to Hall A"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Detailed Message *
              </label>
              <textarea
                id="announcement-message-textarea"
                rows={4}
                required
                value={announcementMessage}
                onChange={(e) => setAnnouncementMessage(e.target.value)}
                placeholder="Write your announcement details here. It will immediately trigger a push notification for all registered participants."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <button
              id="send-broadcast-btn"
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Broadcast to All Registered Attendees</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 5: User Management (Admin Only) */}
      {isAdmin && activeTab === 'users' && (
        <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Platform User Management
            </h3>
            <p className="text-xs text-slate-500">
              Manage user roles, verify organizer permissions, and monitor registrations.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Organization</th>
                  <th className="px-4 py-3">Current Role</th>
                  <th className="px-4 py-3 text-right">Assign Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-750 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={u.avatar}
                          alt={u.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <span className="font-bold text-slate-900 dark:text-white">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">{u.email}</td>
                    <td className="px-4 py-3 text-slate-500">{u.organization || 'Independent'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          u.role === 'Admin'
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400'
                            : u.role === 'Organizer'
                            ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <select
                        value={u.role}
                        onChange={(e) => updateUserRole(u.id, e.target.value as UserRole)}
                        className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      >
                        <option value="Attendee">Attendee</option>
                        <option value="Organizer">Organizer</option>
                        <option value="Admin">Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Admin Database & Seeding Management */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              Database Seeding & Reset Controls
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              Authorized admin tools to populate initial curated test events or purge sample data from Google Cloud Firestore.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={seedDemoEvents}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-2xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Seed Starter Events to Database</span>
              </button>

              <button
                type="button"
                onClick={clearDemoData}
                className="px-4 py-2.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-rose-500" />
                <span>Purge Sample Demo Data</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
