/**
 * AI Service Layer for EventEase
 * Safely calls server-side Gemini API endpoints with robust client fallbacks.
 */
import { EventItem, EventCategory, Registration, AiRecommendationResult } from '../types';

export interface AiChatResponse {
  content: string;
  events?: Array<{ eventId: string; reason?: string }>;
  recommendedEventIds: string[];
  suggestions: string[];
}

/**
 * Helper to sanitize and extract public event catalog information for Gemini
 * Strips private or internal data while preserving all discovery attributes
 */
function sanitizeEventsForAi(
  events: EventItem[],
  query?: string,
  userContext?: { interests?: EventCategory[]; city?: string }
): Array<{
  id: string;
  title: string;
  description: string;
  category: string;
  eventType: string;
  date: string;
  time: string;
  venue: string;
  city: string;
  locationType: string;
  price: number;
  ticketType: string;
  currency: string;
  capacity: number;
  availableSeats: number;
  registrationDeadline: string;
  status: string;
  organizer: string;
  speakers: string;
}> {
  // If catalog is compact (<= 25 events), send all events to allow comprehensive reasoning
  // Otherwise prioritize matching events
  let targetEvents = events;
  if (events.length > 25 && query) {
    const q = query.toLowerCase();
    const scored = events.map((e) => {
      let score = 0;
      if (e.title.toLowerCase().includes(q)) score += 5;
      if (e.category.toLowerCase().includes(q)) score += 4;
      if ((e.city || '').toLowerCase().includes(q)) score += 3;
      if (e.description.toLowerCase().includes(q)) score += 2;
      if (userContext?.interests?.includes(e.category)) score += 2;
      return { event: e, score };
    });
    scored.sort((a, b) => b.score - a.score);
    targetEvents = scored.slice(0, 25).map((s) => s.event);
  }

  return targetEvents.slice(0, 25).map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description ? e.description.slice(0, 140) : '',
    category: e.category,
    eventType: e.eventType || 'Event',
    date: e.date,
    time: `${e.startTime || ''} - ${e.endTime || ''}`.trim(),
    venue: e.venue || 'TBD',
    city: e.city || (e.locationType === 'Virtual' ? 'Virtual' : 'In-Person'),
    locationType: e.locationType || 'In-Person',
    price: e.price,
    ticketType: e.ticketType || (e.price === 0 ? 'Free' : 'Paid'),
    currency: e.currency || 'USD',
    capacity: e.maxCapacity,
    availableSeats: Math.max(0, e.maxCapacity - (e.registeredCount || 0)),
    registrationDeadline: e.registrationDeadline || e.date,
    status: e.status,
    organizer: e.organizerName || 'EventEase Host',
    speakers: (e.speakers || []).map((s) => `${s.name} (${s.role || ''}${s.company ? ' at ' + s.company : ''})`).join(', ') || 'Featured Speakers',
  }));
}

/**
 * Send natural language query to EventEase AI Assistant
 */
export async function queryAiAssistant(
  message: string,
  events: EventItem[],
  userContext?: {
    interests?: EventCategory[];
    city?: string;
    wishlistCount?: number;
  },
  chatHistory?: Array<{ sender: 'user' | 'assistant'; content: string }>,
  focusedEvent?: EventItem | null
): Promise<AiChatResponse> {
  const trimmed = message.trim();
  if (!trimmed) {
    return {
      content: 'Please enter a question or select one of the suggested prompts to ask EventEase AI.',
      events: [],
      recommendedEventIds: [],
      suggestions: ['Show me free events', 'Find AI events', 'What is happening this week?'],
    };
  }

  try {
    const compactEvents = sanitizeEventsForAi(events, trimmed, userContext);
    const now = new Date();
    const currentDate = `${now.toISOString().split('T')[0]} (${now.toLocaleDateString('en-US', { weekday: 'long' })})`;

    const sanitizedFocusedEvent = focusedEvent
      ? {
          id: focusedEvent.id,
          title: focusedEvent.title,
          description: focusedEvent.description,
          category: focusedEvent.category,
          eventType: focusedEvent.eventType,
          date: focusedEvent.date,
          time: `${focusedEvent.startTime || ''} - ${focusedEvent.endTime || ''}`.trim(),
          venue: focusedEvent.venue,
          address: focusedEvent.address,
          city: focusedEvent.city,
          locationType: focusedEvent.locationType,
          price: focusedEvent.price,
          ticketType: focusedEvent.ticketType,
          currency: focusedEvent.currency,
          capacity: focusedEvent.maxCapacity,
          availableSeats: Math.max(0, focusedEvent.maxCapacity - (focusedEvent.registeredCount || 0)),
          registrationDeadline: focusedEvent.registrationDeadline,
          status: focusedEvent.status,
          organizer: focusedEvent.organizerName,
          speakers: (focusedEvent.speakers || []).map((s) => `${s.name} (${s.role || ''}${s.company ? ' at ' + s.company : ''})`).join(', '),
          agenda: focusedEvent.agenda || [],
          faqs: focusedEvent.faqs || [],
          terms: focusedEvent.terms || [],
        }
      : undefined;

    const res = await fetch('/api/gemini/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: trimmed,
        chatHistory: chatHistory?.slice(-6),
        eventsContext: compactEvents,
        focusedEvent: sanitizedFocusedEvent,
        userContext,
        currentDate,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.error) {
        return {
          content: `⚠️ **AI Assistant Notice**: ${data.error}`,
          events: [],
          recommendedEventIds: [],
          suggestions: ['Try another question', 'Browse all events'],
        };
      }

      const structuredEvents: Array<{ eventId: string; reason?: string }> = Array.isArray(data.events)
        ? data.events
        : [];

      const recommendedEventIds: string[] = structuredEvents.length > 0
        ? structuredEvents.map((e) => e.eventId)
        : Array.isArray(data.recommendedEventIds)
        ? data.recommendedEventIds
        : [];

      return {
        content: data.content || data.message || 'Here is the relevant information based on your request.',
        events: structuredEvents,
        recommendedEventIds,
        suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
      };
    } else {
      const errorData = await res.json().catch(() => ({}));
      const errorMsg = errorData.error || `Server responded with status ${res.status}`;
      return {
        content: `⚠️ **AI Service Error**: ${errorMsg}`,
        events: [],
        recommendedEventIds: [],
        suggestions: ['Show me all events', 'Filter by category'],
      };
    }
  } catch (err: any) {
    console.warn('Network call to AI endpoint failed:', err);
    return {
      content: `⚠️ **Connection Error**: EventEase AI is temporarily unavailable. Please verify your server connection and try again.`,
      events: [],
      recommendedEventIds: [],
      suggestions: ['Browse all events', 'Check filters'],
    };
  }
}

/**
 * Organizer AI Tool: Generate event description
 */
export async function aiGenerateDescription(
  title: string,
  category: EventCategory,
  eventType?: string,
  city?: string
): Promise<string> {
  try {
    const res = await fetch('/api/gemini/organizer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task: 'generate_description',
        title,
        category,
        eventType,
        city,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.description) return data.description;
    }
  } catch (err) {
    console.warn('AI description call fallback:', err);
  }

  return `Join us for ${title || 'our upcoming event'}, an engaging ${eventType || 'gathering'} curated for everyone interested in ${category}. Discover actionable insights, connect with passionate creators in ${city || 'the area'}, and expand your perspective through interactive sessions and networking.`;
}

/**
 * Organizer AI Tool: Generate agenda
 */
export async function aiGenerateAgenda(
  title: string,
  category: EventCategory,
  eventType?: string
): Promise<Array<{ time: string; title: string; description: string }>> {
  try {
    const res = await fetch('/api/gemini/organizer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task: 'generate_agenda',
        title,
        category,
        eventType,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.agenda) && data.agenda.length > 0) return data.agenda;
    }
  } catch (err) {
    console.warn('AI agenda call fallback:', err);
  }

  return [
    { time: '09:00 - 10:00', title: 'Registration & Welcome', description: 'Badge pickup, networking, and morning refreshments.' },
    { time: '10:00 - 11:30', title: 'Opening Keynote', description: 'Insights and perspective on recent breakthroughs in ' + category + '.' },
    { time: '11:45 - 13:00', title: 'Panel Discussion & Q&A', description: 'Candid conversation with domain practitioners.' },
    { time: '13:00 - 14:15', title: 'Networking Lunch', description: 'Connect with peers and speakers.' },
    { time: '14:30 - 16:30', title: 'Interactive Masterclass Track', description: 'Practical hands-on collaborative session.' },
    { time: '16:45 - 17:30', title: 'Closing Remarks & Showcase', description: 'Summary takeaways and upcoming roadmap.' },
  ];
}

/**
 * Organizer AI Tool: Generate FAQs
 */
export async function aiGenerateFaqs(
  title: string,
  category: EventCategory
): Promise<Array<{ question: string; answer: string }>> {
  try {
    const res = await fetch('/api/gemini/organizer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task: 'generate_faqs',
        title,
        category,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.faqs) && data.faqs.length > 0) return data.faqs;
    }
  } catch (err) {
    console.warn('AI FAQ call fallback:', err);
  }

  return [
    { question: 'What is the refund policy?', answer: 'Full refunds are available up to 7 days before event kickoff.' },
    { question: 'Are materials provided?', answer: 'Yes, all necessary workshop materials, digital slides, and badges are provided.' },
    { question: 'Is parking available?', answer: 'On-site parking is available. Detailed transit directions are sent with your digital pass.' },
    { question: 'Can I transfer my pass to someone else?', answer: 'Yes, pass transfers can be completed through your EventEase profile up to 24 hours prior.' },
  ];
}

/**
 * Smart AI Recommendation Engine
 * Computes transparent, scored recommendations based on user interests, wishlist, and location
 */
export function computeSmartRecommendations(
  events: EventItem[],
  userInterests: EventCategory[] = [],
  wishlistEventIds: string[] = [],
  userRegistrations: Registration[] = [],
  userCity?: string
): AiRecommendationResult[] {
  // Extract categories the user has registered for or wishlisted
  const wishlistCategories = new Set(
    events.filter((e) => wishlistEventIds.includes(e.id)).map((e) => e.category)
  );
  const registeredCategories = new Set(
    userRegistrations.map((r) => {
      const ev = events.find((e) => e.id === r.eventId);
      return ev ? ev.category : null;
    }).filter(Boolean) as EventCategory[]
  );

  const results: AiRecommendationResult[] = [];

  for (const event of events) {
    // Skip events already registered for or completed
    const isAlreadyRegistered = userRegistrations.some((r) => r.eventId === event.id && r.ticketStatus !== 'Cancelled');
    if (isAlreadyRegistered) continue;

    let score = 20; // baseline
    let reason = 'Trending upcoming event';
    let highlightTag = 'Popular Pick';

    // 1. Explicit user interest match (+40)
    if (userInterests.includes(event.category)) {
      score += 40;
      reason = `Matches your selected interest in ${event.category}`;
      highlightTag = `${event.category} Match`;
    }
    // 2. Wishlist category correlation (+30)
    else if (wishlistCategories.has(event.category)) {
      score += 30;
      reason = `Because you saved ${event.category} events`;
      highlightTag = 'Similar to Wishlist';
    }
    // 3. Past registration category correlation (+25)
    else if (registeredCategories.has(event.category)) {
      score += 25;
      reason = `Based on your past attendance in ${event.category}`;
      highlightTag = 'Recommended For You';
    }

    // 4. City match (+20)
    if (userCity && event.city && userCity.toLowerCase() === event.city.toLowerCase()) {
      score += 20;
      if (score > 40) {
        reason += ` • In your city (${event.city})`;
      } else {
        reason = `Happening near you in ${event.city}`;
        highlightTag = 'Nearby in ' + event.city;
      }
    }

    // 5. High demand (+10)
    if (event.registeredCount / event.maxCapacity > 0.8) {
      score += 10;
    }

    // 6. Featured boost (+10)
    if (event.featured) {
      score += 10;
    }

    results.push({
      eventId: event.id,
      matchScore: Math.min(score, 99),
      reason,
      highlightTag,
    });
  }

  // Sort by highest match score descending
  results.sort((a, b) => b.matchScore - a.matchScore);
  return results;
}

function fallbackClientChat(message: string, events: EventItem[], userContext?: any): AiChatResponse {
  const q = message.toLowerCase();
  const matched = events.filter((e) => {
    return (
      e.title.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q) ||
      (e.city && e.city.toLowerCase().includes(q)) ||
      e.description.toLowerCase().includes(q)
    );
  });

  const picks = matched.length > 0 ? matched.slice(0, 3) : events.slice(0, 3);
  const titles = picks.map((p) => `• **${p.title}** (${p.category}, ${p.city || 'Virtual'} - ${p.price === 0 ? 'Free' : '$' + p.price})`).join('\n');

  return {
    content: `Here are relevant events from the EventEase catalog based on your inquiry:\n\n${titles}\n\nFeel free to ask for more details on schedules, venues, or ticket options!`,
    events: picks.map((p) => ({ eventId: p.id, reason: 'Matching catalog event' })),
    recommendedEventIds: picks.map((p) => p.id),
    suggestions: [
      'Show me free technology events',
      'What events are happening in San Francisco?',
      'Which events have beginner tracks?',
    ],
  };
}
