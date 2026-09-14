import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { queryAiAssistant } from '../services/aiService';
import { EventItem, AiChatMessage } from '../types';
import { formatCurrency, formatDate } from '../utils/helpers';
import {
  Sparkles,
  X,
  Send,
  Loader2,
  Bot,
  User as UserIcon,
  Compass,
  ArrowRight,
  MapPin,
  Calendar,
  Clock,
  Heart,
  Lightbulb,
  CheckCircle2,
  Layers,
} from 'lucide-react';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEvent: (event: EventItem) => void;
  onRegisterClick: (event: EventItem) => void;
}

const GLOBAL_DEFAULT_PROMPTS = [
  'Find AI events',
  'Show free events',
  'What is happening this week?',
  'Recommend an event for me',
  'Find technical events',
  'Which events still have seats available?',
];

const EVENT_CONTEXT_PROMPTS = [
  'Tell me about this event',
  'Who are the keynote speakers?',
  'What is the schedule / agenda?',
  'What is the registration deadline?',
  'How much does it cost?',
  'How do I register?',
];

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  onSelectEvent,
  onRegisterClick,
}) => {
  const {
    events,
    currentUser,
    userLocation,
    userInterests,
    wishlist,
    aiActiveEvent,
    setAiActiveEvent,
    toggleWishlist,
    isWishlisted,
  } = useApp();

  const activePrompts = aiActiveEvent ? EVENT_CONTEXT_PROMPTS : GLOBAL_DEFAULT_PROMPTS;

  const getInitialWelcomeMessage = (): AiChatMessage => {
    if (aiActiveEvent) {
      return {
        id: `welcome-${aiActiveEvent.id}`,
        sender: 'assistant',
        content: `Hello ${currentUser.name || 'there'}! I am focused on **${aiActiveEvent.title}**.\n\nAsk me about the schedule, keynote speakers, venue directions, ticket pricing, or entry policies. You can also explore any other event in EventEase!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions: EVENT_CONTEXT_PROMPTS.slice(0, 3),
      };
    }

    return {
      id: 'welcome-msg',
      sender: 'assistant',
      content: `Hello ${currentUser.name || 'there'}! I am your **EventEase AI Assistant**.\n\nI can help you discover upcoming summits, workshops, and hackathons, answer questions about agendas, speakers, or venue directions, or recommend events tailored to your interests in **${userInterests.join(', ') || 'Technology & Workshops'}**!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestions: GLOBAL_DEFAULT_PROMPTS.slice(0, 3),
    };
  };

  const [messages, setMessages] = useState<AiChatMessage[]>([getInitialWelcomeMessage()]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update initial message when aiActiveEvent changes and chat is fresh
  useEffect(() => {
    if (messages.length <= 1) {
      setMessages([getInitialWelcomeMessage()]);
    }
  }, [aiActiveEvent]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const handleSendMessage = async (queryText?: string) => {
    const text = (queryText || inputQuery).trim();
    if (!text || isLoading) return;

    const userMessage: AiChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuery('');
    setIsLoading(true);

    const historyPayload = messages.slice(-6).map((m) => ({
      sender: m.sender,
      content: m.content,
    }));

    try {
      const response = await queryAiAssistant(
        text,
        events,
        {
          interests: userInterests,
          city: userLocation.city,
          wishlistCount: wishlist.length,
        },
        historyPayload,
        aiActiveEvent
      );

      const assistantMessage: AiChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        content: response.content,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        recommendedEventIds: response.recommendedEventIds,
        recommendedEvents: response.events,
        suggestions: response.suggestions,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          content: `⚠️ EventEase AI is temporarily unavailable. Please try again.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestions: activePrompts.slice(0, 3),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div
      id="ai-assistant-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="ai-assistant-dialog"
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white flex items-center justify-between border-b border-indigo-700/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center text-indigo-200 shadow-inner">
              <Sparkles className="w-5 h-5 text-indigo-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight">EventEase AI Assistant</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/40 text-indigo-200 border border-indigo-400/30">
                  Gemini 3.6 Flash
                </span>
              </div>
              <p className="text-xs text-indigo-200/80">
                Discover events, ask about schedules, or find experiences near {userLocation.city}
              </p>
            </div>
          </div>

          <button
            id="close-ai-assistant-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-indigo-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close assistant"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Event Context Strip (When opened with a specific event focused) */}
        {aiActiveEvent && (
          <div className="px-5 py-2 bg-indigo-950/70 border-b border-indigo-800/50 flex items-center justify-between text-xs text-indigo-200">
            <div className="flex items-center gap-2 truncate">
              <span className="px-2 py-0.5 rounded-md bg-indigo-500/30 text-indigo-200 font-semibold text-[10px] shrink-0 uppercase tracking-wide">
                Event Focus
              </span>
              <span className="font-semibold text-white truncate">{aiActiveEvent.title}</span>
            </div>
            <button
              onClick={() => setAiActiveEvent(null)}
              className="text-[11px] text-indigo-300 hover:text-white underline cursor-pointer shrink-0 ml-2"
              title="Switch back to full catalog discovery"
            >
              Clear focus
            </button>
          </div>
        )}

        {/* Message Stream */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-slate-950/40 text-sm">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[88%] rounded-2xl p-4 shadow-xs ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700/70 rounded-tl-xs'
                }`}
              >
                {/* Content text */}
                <div className="whitespace-pre-line leading-relaxed text-sm">
                  {msg.content}
                </div>

                {/* Quick Prompts Box on initial welcome message */}
                {msg.id.startsWith('welcome-') && messages.length === 1 && (
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 space-y-2">
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Quick Questions:</span>
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {activePrompts.map((prompt, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(prompt)}
                          className="p-2.5 text-left rounded-xl bg-slate-50 dark:bg-slate-900/90 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-all cursor-pointer flex items-center justify-between group"
                        >
                          <span className="line-clamp-1">{prompt}</span>
                          <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Embedded Recommended Event Cards */}
                {msg.recommendedEventIds && msg.recommendedEventIds.length > 0 && (
                  <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-700 space-y-2.5">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Recommended Events:</span>
                    </p>
                    <div className="grid grid-cols-1 gap-2.5">
                      {msg.recommendedEventIds
                        .map((id) => events.find((e) => e.id === id))
                        .filter(Boolean)
                        .map((evt) => {
                          const event = evt!;
                          const matchReason = msg.recommendedEvents?.find(
                            (r) => r.eventId === event.id
                          )?.reason;
                          const saved = isWishlisted(event.id);
                          const seatsLeft = Math.max(0, event.maxCapacity - (event.registeredCount || 0));

                          return (
                            <div
                              key={event.id}
                              className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 hover:border-indigo-400 transition-all flex flex-col justify-between group shadow-2xs"
                            >
                              <div>
                                <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mb-1.5 gap-2">
                                  <div className="flex items-center gap-1.5">
                                    <span className="px-2 py-0.5 rounded-md font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-100/80 dark:bg-indigo-950/80 uppercase tracking-wide">
                                      {event.category}
                                    </span>
                                    <span className="text-slate-400">•</span>
                                    <span className="font-semibold text-slate-600 dark:text-slate-300">
                                      {event.eventType || 'Event'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className={`px-2 py-0.5 rounded-md font-bold ${
                                        event.price === 0
                                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                                          : 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                                      }`}
                                    >
                                      {formatCurrency(event.price, event.currency)}
                                    </span>
                                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                                      {seatsLeft > 0 ? `${seatsLeft} seats left` : 'Full'}
                                    </span>
                                  </div>
                                </div>

                                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                  {event.title}
                                </h4>

                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3 text-indigo-500" />
                                    {formatDate(event.date)}
                                  </span>
                                  {event.startTime && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3 text-indigo-500" />
                                      {event.startTime}
                                    </span>
                                  )}
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-indigo-500" />
                                    {event.city || (event.locationType === 'Virtual' ? 'Virtual' : 'In-Person')}
                                  </span>
                                </div>

                                {/* AI Match Reason */}
                                {matchReason && (
                                  <div className="mt-2 px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/60 text-[11px] text-indigo-700 dark:text-indigo-300 flex items-start gap-1.5 leading-snug">
                                    <Sparkles className="w-3 h-3 text-indigo-500 shrink-0 mt-0.5" />
                                    <span>{matchReason}</span>
                                  </div>
                                )}
                              </div>

                              {/* Interactive Actions Row */}
                              <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-800 flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    onSelectEvent(event);
                                    onClose();
                                  }}
                                  className="flex-1 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors text-center cursor-pointer border border-indigo-200/60 dark:border-indigo-800/60"
                                >
                                  View Event
                                </button>
                                <button
                                  onClick={() => {
                                    onRegisterClick(event);
                                    onClose();
                                  }}
                                  className="px-3.5 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors cursor-pointer shadow-xs"
                                >
                                  Register
                                </button>
                                <button
                                  onClick={() => toggleWishlist(event.id)}
                                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                    saved
                                      ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400'
                                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:text-rose-500'
                                  }`}
                                  title={saved ? 'Remove from Saved' : 'Save to Wishlist'}
                                  aria-label={saved ? 'Remove from Saved' : 'Save to Wishlist'}
                                >
                                  <Heart className={`w-3.5 h-3.5 ${saved ? 'fill-current text-rose-500' : ''}`} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Suggestions chips */}
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="mt-3 pt-2 flex flex-wrap gap-1.5">
                    {msg.suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(suggestion)}
                        className="text-[11px] px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-200/60 dark:border-indigo-800 transition-colors text-left cursor-pointer"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}

                <div
                  className={`text-[10px] mt-2 text-right ${
                    msg.sender === 'user' ? 'text-indigo-200' : 'text-slate-400'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-full bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                  <UserIcon className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 items-center text-slate-500 text-xs">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 border border-slate-200 dark:border-slate-700 flex items-center gap-2 shadow-xs">
                <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                <span>EventEase AI is thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Prompt Chips Bar */}
        <div className="px-4 py-2 bg-slate-100 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto text-xs scrollbar-none">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 shrink-0">
            <Lightbulb className="w-3 h-3 text-amber-500" />
            Try asking:
          </span>
          {activePrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              className="whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700 shadow-2xs transition-colors shrink-0 cursor-pointer"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                id="ai-assistant-input"
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  aiActiveEvent
                    ? `Ask about ${aiActiveEvent.title}...`
                    : 'Ask about events, schedules, or recommend summits...'
                }
                disabled={isLoading}
                className="w-full px-4 py-2.5 pl-10 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition-all"
              />
              <Sparkles className="w-4 h-4 text-indigo-500 absolute left-3.5 top-3 pointer-events-none" />
            </div>

            <button
              id="ai-assistant-send-btn"
              onClick={() => handleSendMessage()}
              disabled={!inputQuery.trim() || isLoading}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-semibold text-sm flex items-center gap-2 transition-all cursor-pointer disabled:cursor-not-allowed shadow-sm"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Send</span>
                  <Send className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
