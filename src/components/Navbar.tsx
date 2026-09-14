import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import {
  Calendar,
  Compass,
  Bell,
  Sun,
  Moon,
  PlusCircle,
  QrCode,
  LayoutDashboard,
  Ticket,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Menu,
  X,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Layers,
  Sparkles,
  ExternalLink,
  MapPin,
} from 'lucide-react';

interface NavbarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onOpenCreateEvent: () => void;
  onOpenPreferences?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  onOpenAuth,
  onOpenCreateEvent,
  onOpenPreferences,
}) => {
  const {
    currentUser,
    role,
    switchRole,
    logout,
    isLoggedIn,
    notifications,
    unreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    isDarkMode,
    toggleDarkMode,
    userLocation,
    setIsAiAssistantOpen,
  } = useApp();

  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifMenu(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
      if (roleRef.current && !roleRef.current.contains(e.target as Node)) {
        setShowRoleMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const userNotifications = notifications.filter((n) => n.userId === currentUser.id);

  return (
    <nav
      id="main-navbar"
      aria-label="Main Navigation"
      className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Brand Logo & Links */}
          <div className="flex items-center gap-8">
            <button
              id="brand-logo-btn"
              onClick={() => {
                setCurrentView('landing');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-2.5 group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-extrabold shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-1 font-['Space_Grotesk']">
                  Event<span className="text-indigo-600 dark:text-indigo-400">Ease</span>
                </span>
                <span className="block text-[10px] font-medium tracking-wider uppercase text-slate-400 -mt-1">
                  Event Platform
                </span>
              </div>
            </button>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-1">
              <button
                id="nav-home-btn"
                onClick={() => setCurrentView('landing')}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  currentView === 'landing'
                    ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Home
              </button>

              <button
                id="nav-explore-btn"
                onClick={() => setCurrentView('explore')}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  currentView === 'explore'
                    ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Compass className="w-4 h-4" />
                <span>Explore Events</span>
              </button>

              {role === 'organizer' && (
                <>
                  <button
                    id="nav-organizer-dash-btn"
                    onClick={() => setCurrentView('organizer-dashboard')}
                    className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      currentView === 'organizer-dashboard'
                        ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 font-semibold'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Organizer Hub</span>
                  </button>

                  <button
                    id="nav-qr-checkin-btn"
                    onClick={() => setCurrentView('qr-checkin')}
                    className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      currentView === 'qr-checkin'
                        ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 font-semibold'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <QrCode className="w-4 h-4 text-emerald-500" />
                    <span>QR Check-in</span>
                  </button>
                </>
              )}

              {role === 'admin' && (
                <>
                  <button
                    id="nav-admin-dash-btn"
                    onClick={() => setCurrentView('admin-dashboard')}
                    className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      currentView === 'admin-dashboard'
                        ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 font-semibold'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-indigo-500" />
                    <span>Admin Panel</span>
                  </button>

                  <button
                    id="nav-admin-qr-checkin-btn"
                    onClick={() => setCurrentView('qr-checkin')}
                    className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      currentView === 'qr-checkin'
                        ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 font-semibold'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <QrCode className="w-4 h-4 text-emerald-500" />
                    <span>Check-in Scanner</span>
                  </button>
                </>
              )}

              {role === 'attendee' && (
                <button
                  id="nav-attendee-tickets-btn"
                  onClick={() => setCurrentView('profile')}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    currentView === 'profile'
                      ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Ticket className="w-4 h-4 text-indigo-500" />
                  <span>My Tickets</span>
                </button>
              )}
            </div>
          </div>

          {/* Right Controls: AI Assistant, Location, Role Switcher, Create Event, Notifications, Dark Mode, Profile */}
          <div className="hidden md:flex items-center gap-2.5">
            {/* AI Assistant Quick Trigger */}
            <button
              id="nav-ai-assistant-btn"
              onClick={() => setIsAiAssistantOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-50 dark:from-indigo-950/60 to-violet-50 dark:to-violet-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all cursor-pointer shadow-2xs group"
              title="Open EventEase AI Assistant"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse group-hover:rotate-12 transition-transform" />
              <span>AI Assistant</span>
            </button>

            {/* Location Selector Pill */}
            {onOpenPreferences && (
              <button
                id="nav-location-btn"
                onClick={onOpenPreferences}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200/70 dark:border-slate-700/70 cursor-pointer shadow-2xs"
                title="Change discovery location and radius"
              >
                <MapPin className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span className="max-w-[100px] truncate">{userLocation.city}</span>
              </button>
            )}

            {/* Quick Demo Role Switcher Badge */}
            <div className="relative" ref={roleRef}>
              <button
                id="role-switcher-badge-btn"
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer shadow-xs bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-indigo-400"
                title="Switch role for testing"
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    role === 'admin'
                      ? 'bg-purple-500'
                      : role === 'organizer'
                      ? 'bg-blue-500'
                      : 'bg-emerald-500'
                  }`}
                />
                <span className="capitalize">{role} View</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showRoleMenu && (
                <div
                  id="role-switcher-dropdown"
                  className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                >
                  <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-700/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Switch Active Persona
                  </div>
                  <button
                    id="switch-role-attendee"
                    onClick={() => {
                      switchRole('attendee');
                      setShowRoleMenu(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-xs font-medium flex items-center justify-between transition-colors ${
                      role === 'attendee'
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>Attendee (Alex)</span>
                    {role === 'attendee' && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                  </button>
                  <button
                    id="switch-role-organizer"
                    onClick={() => {
                      switchRole('organizer');
                      setShowRoleMenu(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-xs font-medium flex items-center justify-between transition-colors ${
                      role === 'organizer'
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>Organizer (Sarah)</span>
                    {role === 'organizer' && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                  </button>
                  <button
                    id="switch-role-admin"
                    onClick={() => {
                      switchRole('admin');
                      setShowRoleMenu(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-xs font-medium flex items-center justify-between transition-colors ${
                      role === 'admin'
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>Administrator (Marcus)</span>
                    {role === 'admin' && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                  </button>
                </div>
              )}
            </div>

            {/* Create Event CTA (For Organizers and Admins, or opens modal for anyone) */}
            {(role === 'organizer' || role === 'admin') && (
              <button
                id="navbar-create-event-btn"
                onClick={onOpenCreateEvent}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create Event</span>
              </button>
            )}

            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                id="navbar-notif-bell-btn"
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                className="relative p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadNotificationCount > 0 && (
                  <span
                    id="notif-badge-counter"
                    className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse"
                  >
                    {unreadNotificationCount}
                  </span>
                )}
              </button>

              {showNotifMenu && (
                <div
                  id="notifications-popover"
                  className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 animate-in fade-in duration-150"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Notifications
                      </span>
                      {unreadNotificationCount > 0 && (
                        <span className="px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-[10px] font-semibold rounded-full">
                          {unreadNotificationCount} unread
                        </span>
                      )}
                    </div>
                    {unreadNotificationCount > 0 && (
                      <button
                        id="mark-all-read-btn"
                        onClick={markAllNotificationsAsRead}
                        className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/50">
                    {userNotifications.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400">
                        No notifications yet.
                      </div>
                    ) : (
                      userNotifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => markNotificationAsRead(n.id)}
                          className={`p-3.5 text-xs transition-colors cursor-pointer ${
                            n.read
                              ? 'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-750'
                              : 'bg-indigo-50/50 dark:bg-indigo-950/20 text-slate-800 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-semibold leading-snug">{n.title}</p>
                            {!n.read && (
                              <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                            {n.message}
                          </p>
                          <span className="block text-[10px] text-slate-400 dark:text-slate-500 mt-1.5">
                            {new Date(n.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Dark Mode Toggle */}
            <button
              id="navbar-darkmode-toggle"
              onClick={toggleDarkMode}
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* User Profile / Auth Action */}
            {isLoggedIn ? (
              <div className="relative" ref={profileRef}>
                <button
                  id="navbar-profile-btn"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                  />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 hidden lg:inline-block max-w-[100px] truncate">
                    {currentUser.name}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {showProfileMenu && (
                  <div
                    id="profile-dropdown-menu"
                    className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1 z-50 animate-in fade-in duration-150"
                  >
                    <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-700">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {currentUser.name}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 capitalize">
                        {currentUser.role}
                      </span>
                    </div>

                    <div className="py-1">
                      <button
                        id="profile-menu-item"
                        onClick={() => {
                          setCurrentView('profile');
                          setShowProfileMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer"
                      >
                        <UserIcon className="w-4 h-4 text-slate-400" />
                        <span>My Profile & Tickets</span>
                      </button>

                      {role === 'organizer' && (
                        <button
                          id="organizer-hub-menu-item"
                          onClick={() => {
                            setCurrentView('organizer-dashboard');
                            setShowProfileMenu(false);
                          }}
                          className="w-full px-4 py-2 text-left text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer"
                        >
                          <LayoutDashboard className="w-4 h-4 text-slate-400" />
                          <span>Organizer Dashboard</span>
                        </button>
                      )}

                      {role === 'admin' && (
                        <button
                          id="admin-hub-menu-item"
                          onClick={() => {
                            setCurrentView('admin-dashboard');
                            setShowProfileMenu(false);
                          }}
                          className="w-full px-4 py-2 text-left text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer"
                        >
                          <ShieldCheck className="w-4 h-4 text-slate-400" />
                          <span>Admin Dashboard</span>
                        </button>
                      )}

                      <button
                        id="auth-switch-account-item"
                        onClick={() => {
                          setShowProfileMenu(false);
                          onOpenAuth('login');
                        }}
                        className="w-full px-4 py-2 text-left text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4 text-slate-400" />
                        <span>Switch Account</span>
                      </button>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-700 py-1">
                      <button
                        id="profile-logout-item"
                        onClick={() => {
                          logout();
                          setShowProfileMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 flex items-center gap-2 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="navbar-signin-btn"
                  onClick={() => onOpenAuth('login')}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  id="navbar-signup-btn"
                  onClick={() => onOpenAuth('register')}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs shadow-indigo-600/20 transition-all cursor-pointer"
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>Sign Up</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              id="mobile-darkmode-toggle"
              onClick={toggleDarkMode}
              className="p-1.5 text-slate-600 dark:text-slate-300 rounded-lg"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            </button>

            <button
              id="mobile-menu-toggle-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Open menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div
          id="mobile-drawer-nav"
          className="md:hidden border-t border-slate-200 dark:border-slate-800 px-4 pt-3 pb-6 space-y-3 bg-white dark:bg-slate-900 animate-in slide-in-from-top duration-200"
        >
          {/* User profile snippet or Logged Out Prompt */}
          {!isLoggedIn ? (
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 rounded-xl space-y-2">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Sign in to EventEase
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Book event tickets, get digital QR passes, and receive personalized recommendations.
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  id="mobile-signin-btn"
                  onClick={() => {
                    onOpenAuth('login');
                    setMobileMenuOpen(false);
                  }}
                  className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold text-center shadow-xs cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  id="mobile-signup-btn"
                  onClick={() => {
                    onOpenAuth('register');
                    setMobileMenuOpen(false);
                  }}
                  className="flex-1 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold text-center cursor-pointer"
                >
                  Sign Up
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-10 h-10 rounded-lg object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {currentUser.name}
                </p>
                <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
                <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 capitalize">
                  Role: {currentUser.role}
                </span>
              </div>
              <button
                type="button"
                id="mobile-logout-btn"
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Quick Role switcher mobile */}
          <div className="grid grid-cols-3 gap-2 py-1">
            {(['attendee', 'organizer', 'admin'] as UserRole[]).map((r) => (
              <button
                key={r}
                onClick={() => {
                  switchRole(r);
                  setMobileMenuOpen(false);
                }}
                className={`py-1.5 text-xs font-medium rounded-lg border text-center capitalize cursor-pointer ${
                  role === r
                    ? 'bg-indigo-600 text-white border-indigo-600 font-semibold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <div className="space-y-1">
            <button
              onClick={() => {
                setCurrentView('landing');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Home
            </button>
            <button
              onClick={() => {
                setCurrentView('explore');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
            >
              <Compass className="w-4 h-4 text-indigo-500" />
              <span>Explore Events</span>
            </button>
            <button
              onClick={() => {
                setCurrentView('profile');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
            >
              <Ticket className="w-4 h-4 text-indigo-500" />
              <span>My Tickets & Registrations</span>
            </button>

            {role === 'organizer' && (
              <>
                <button
                  onClick={() => {
                    setCurrentView('organizer-dashboard');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                >
                  <LayoutDashboard className="w-4 h-4 text-indigo-500" />
                  <span>Organizer Dashboard</span>
                </button>
                <button
                  onClick={() => {
                    setCurrentView('qr-checkin');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                >
                  <QrCode className="w-4 h-4 text-emerald-500" />
                  <span>QR Check-in Scanner</span>
                </button>
              </>
            )}

            {role === 'admin' && (
              <>
                <button
                  onClick={() => {
                    setCurrentView('admin-dashboard');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-indigo-500" />
                  <span>Admin Dashboard</span>
                </button>
                <button
                  onClick={() => {
                    setCurrentView('qr-checkin');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                >
                  <QrCode className="w-4 h-4 text-emerald-500" />
                  <span>QR Check-in Scanner</span>
                </button>
              </>
            )}
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex gap-2">
            <button
              onClick={() => {
                onOpenCreateEvent();
                setMobileMenuOpen(false);
              }}
              className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold text-center cursor-pointer shadow-xs"
            >
              + Create Event
            </button>
            {!isLoggedIn ? (
              <button
                onClick={() => {
                  onOpenAuth('login');
                  setMobileMenuOpen(false);
                }}
                className="px-3.5 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Sign In
              </button>
            ) : (
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="px-3.5 py-2 border border-rose-200 dark:border-rose-900/50 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 cursor-pointer"
              >
                Sign Out
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
