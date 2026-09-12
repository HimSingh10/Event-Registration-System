import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LandingPage } from './components/LandingPage';
import { EventDiscovery } from './components/EventDiscovery';
import { EventDetails } from './components/EventDetails';
import { Dashboard } from './components/Dashboard';
import { UserProfile } from './components/UserProfile';
import { QRCheckIn } from './components/QRCheckIn';
import { RegistrationModal } from './components/RegistrationModal';
import { DigitalTicketModal } from './components/DigitalTicketModal';
import { CreateEventModal } from './components/CreateEventModal';
import { FeedbackModal } from './components/FeedbackModal';
import { AuthModal } from './components/AuthModal';
import { AiAssistantModal } from './components/AiAssistantModal';
import { PreferencesModal } from './components/PreferencesModal';
import { ToastContainer } from './components/ToastContainer';
import { EventItem, Registration, EventCategory } from './types';
import { Sparkles } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { events, role, isAiAssistantOpen, setIsAiAssistantOpen } = useApp();

  // Navigation view state
  const [currentView, setCurrentView] = useState<string>('landing');
  const [selectedCategoryForExplore, setSelectedCategoryForExplore] = useState<EventCategory | 'All'>('All');

  // Selected event for details
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(events[0] || null);

  React.useEffect(() => {
    if (!selectedEvent && events.length > 0) {
      setSelectedEvent(events[0]);
    }
  }, [events, selectedEvent]);

  // Modals state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  const [eventToRegister, setEventToRegister] = useState<EventItem | null>(null);

  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [selectedTicketRegistration, setSelectedTicketRegistration] = useState<Registration | null>(null);

  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<EventItem | null>(null);

  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [eventForFeedback, setEventForFeedback] = useState<EventItem | null>(null);

  const [isPreferencesModalOpen, setIsPreferencesModalOpen] = useState(false);

  // Handlers
  const handleSelectEvent = (event: EventItem) => {
    setSelectedEvent(event);
    setCurrentView('details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRegisterClick = (event: EventItem) => {
    setEventToRegister(event);
    setIsRegistrationModalOpen(true);
  };

  const handleViewTicket = (registration: Registration) => {
    setSelectedTicketRegistration(registration);
    setIsTicketModalOpen(true);
  };

  const handleOpenCreateEvent = (eventToEditItem?: EventItem) => {
    setEventToEdit(eventToEditItem || null);
    setIsCreateEventModalOpen(true);
  };

  const handleOpenFeedback = (event: EventItem) => {
    setEventForFeedback(event);
    setIsFeedbackModalOpen(true);
  };

  const handleExploreWithCategory = (category: EventCategory | 'All' = 'All') => {
    setSelectedCategoryForExplore(category);
    setCurrentView('explore');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-['Plus_Jakarta_Sans',sans-serif] transition-colors duration-200">
      {/* Toast Notification Layer */}
      <ToastContainer />

      {/* Top Navigation */}
      <Navbar
        currentView={currentView}
        setCurrentView={(view) => {
          setCurrentView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenCreateEvent={() => handleOpenCreateEvent()}
        onOpenPreferences={() => setIsPreferencesModalOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1">
        {currentView === 'landing' && (
          <LandingPage
            onExploreClick={handleExploreWithCategory}
            onSelectEvent={handleSelectEvent}
            onRegisterClick={handleRegisterClick}
            onOpenCreateEvent={() => handleOpenCreateEvent()}
            onOpenPreferences={() => setIsPreferencesModalOpen(true)}
          />
        )}

        {currentView === 'explore' && (
          <EventDiscovery
            onSelectEvent={handleSelectEvent}
            onRegisterClick={handleRegisterClick}
            initialCategory={selectedCategoryForExplore}
          />
        )}

        {currentView === 'details' && selectedEvent && (
          <EventDetails
            event={selectedEvent}
            onBack={() => setCurrentView('explore')}
            onRegisterClick={handleRegisterClick}
            onSelectRelatedEvent={handleSelectEvent}
            onViewTicket={handleViewTicket}
            onOpenFeedback={handleOpenFeedback}
          />
        )}

        {(currentView === 'dashboard' || currentView === 'organizer-dashboard' || currentView === 'admin-dashboard') && (
          <Dashboard
            onOpenCreateEvent={handleOpenCreateEvent}
            onViewEvent={handleSelectEvent}
            onViewTicket={handleViewTicket}
            onOpenCheckIn={() => {
              setCurrentView('qr-checkin');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {currentView === 'profile' && (
          <UserProfile
            onViewTicket={handleViewTicket}
            onSelectEvent={handleSelectEvent}
            onOpenFeedback={handleOpenFeedback}
          />
        )}

        {currentView === 'qr-checkin' && <QRCheckIn />}
      </main>

      {/* Footer */}
      <Footer
        setCurrentView={(view) => {
          setCurrentView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenCreateEvent={() => handleOpenCreateEvent()}
      />

      {/* Modals */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      <RegistrationModal
        isOpen={isRegistrationModalOpen}
        onClose={() => {
          setIsRegistrationModalOpen(false);
          setEventToRegister(null);
        }}
        event={eventToRegister}
        onViewTicket={handleViewTicket}
      />

      <DigitalTicketModal
        isOpen={isTicketModalOpen}
        onClose={() => {
          setIsTicketModalOpen(false);
          setSelectedTicketRegistration(null);
        }}
        registration={selectedTicketRegistration}
      />

      <CreateEventModal
        isOpen={isCreateEventModalOpen}
        onClose={() => {
          setIsCreateEventModalOpen(false);
          setEventToEdit(null);
        }}
        eventToEdit={eventToEdit}
      />

      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => {
          setIsFeedbackModalOpen(false);
          setEventForFeedback(null);
        }}
        event={eventForFeedback}
      />

      {/* AI Assistant Modal */}
      <AiAssistantModal
        isOpen={isAiAssistantOpen}
        onClose={() => setIsAiAssistantOpen(false)}
        onSelectEvent={handleSelectEvent}
        onRegisterClick={handleRegisterClick}
      />

      {/* Discovery Preferences & Location Modal */}
      <PreferencesModal
        isOpen={isPreferencesModalOpen}
        onClose={() => setIsPreferencesModalOpen(false)}
      />

      {/* Floating AI Assistant Trigger */}
      <button
        id="floating-ai-assistant-btn"
        onClick={() => setIsAiAssistantOpen(true)}
        className="fixed bottom-6 right-6 z-30 flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-600 text-white font-semibold text-xs shadow-xl shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all cursor-pointer group"
        title="Open EventEase AI Assistant"
      >
        <Sparkles className="w-4 h-4 animate-pulse group-hover:rotate-12 transition-transform text-amber-300" />
        <span className="hidden sm:inline">Ask AI Assistant</span>
      </button>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
