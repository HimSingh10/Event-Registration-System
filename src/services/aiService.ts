/**
 * AI Service Layer for EventEase
 * Safely calls server-side Gemini API endpoints with robust client fallbacks.
 */
import { EventItem, EventCategory, Registration, AiRecommendationResult } from '../types';

export interface AiChatResponse {
  content: string;
  recommendedEventIds: string[];
  suggestions: string[];
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
  }
): Promise<AiChatResponse> {
  try {
    const res = await fetch('/api/gemini/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        eventsContext: events.slice(0, 20).map((e) => ({
          id: e.id,
          title: e.title,
          category: e.category,
          date: e.date,
          venue: e.venue,
          city: e.city,
          price: e.price,
          ticketType: e.ticketType,
          description: e.description,
          status: e.status,
        })),
        userContext,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        content: data.content,
        recommendedEventIds: data.recommendedEventIds || [],
        suggestions: data.suggestions || [],
      };
    }
  } catch (err) {
    console.warn('Network call to AI endpoint failed, using client fallback:', err);
  }

  // Client-side instant fallback if offline
  return fallbackClientChat(message, events, userContext);
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
    recommendedEventIds: picks.map((p) => p.id),
    suggestions: [
      'Show me free technology events',
      'What events are happening in San Francisco?',
      'Which events have beginner tracks?',
    ],
  };
}
